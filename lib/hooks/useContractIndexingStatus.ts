
"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    contractService,
    type ContractIndexingReadiness,
} from "@/lib/services/contract.service";

// ============================================================
// 1. CONFIGURATION
// ============================================================

const DEFAULT_POLL_INTERVAL_MS = 5000;

const MIN_POLL_INTERVAL_MS = 3000;

const MAX_POLL_INTERVAL_MS = 30000;

const REQUEST_TIMEOUT_MS = 20000;

const MAX_CONSECUTIVE_ERRORS = 3;

const ERROR_RETRY_INTERVAL_MS = 10000;

// ============================================================
// 2. TYPES
// ============================================================

interface UseContractIndexingStatusOptions {
    contractId?: string | null;
    versionId?: string | null;
    enabled?: boolean;
}

interface IndexingStatusState {
    scopeKey: string | null;
    readiness: ContractIndexingReadiness | null;
    isLoading: boolean;
    isPolling: boolean;
    error: string | null;
}

interface UseContractIndexingStatusResult {
    readiness: ContractIndexingReadiness | null;
    isLoading: boolean;
    isPolling: boolean;
    isReady: boolean;
    canAskQuestions: boolean;
    error: string | null;
    refresh: () => void;
}

// ============================================================
// 3. INITIAL STATE
// ============================================================

const INITIAL_STATE: IndexingStatusState = {
    scopeKey: null,
    readiness: null,
    isLoading: false,
    isPolling: false,
    error: null,
};

// ============================================================
// 4. POLLING INTERVAL HELPER
// ============================================================

const resolvePollInterval = (
    interval: number | null
): number => {
    if (
        typeof interval !== "number" ||
        !Number.isFinite(interval) ||
        interval <= 0
    ) {
        return DEFAULT_POLL_INTERVAL_MS;
    }

    return Math.min(
        MAX_POLL_INTERVAL_MS,
        Math.max(
            MIN_POLL_INTERVAL_MS,
            interval
        )
    );
};

// ============================================================
// 5. CUSTOM HOOK
// ============================================================

export function useContractIndexingStatus({
    contractId = null,
    versionId = null,
    enabled = true,
}: UseContractIndexingStatusOptions):
    UseContractIndexingStatusResult {

    const [state, setState] =
        useState<IndexingStatusState>(INITIAL_STATE);

    const [refreshVersion, setRefreshVersion] =
        useState(0);

    // --------------------------------------------------------
    // A. Identify the current resource
    // --------------------------------------------------------

    const scopeKey =
        enabled && contractId && versionId
            ? `${contractId}:${versionId}:${refreshVersion}`
            : null;

    // --------------------------------------------------------
    // B. Manual refresh
    // --------------------------------------------------------

    const refresh = useCallback(() => {
        setRefreshVersion((previous) => previous + 1);
    }, []);

    // --------------------------------------------------------
    // C. Polling lifecycle
    // --------------------------------------------------------

    useEffect(() => {
        if (
            !enabled ||
            !contractId ||
            !versionId ||
            !scopeKey
        ) {
            setState(INITIAL_STATE);
            return;
        }

        let disposed = false;

        let consecutiveErrors = 0;

        let pollTimer:
            ReturnType<typeof setTimeout> | null = null;

        let requestTimer:
            ReturnType<typeof setTimeout> | null = null;

        let activeController:
            AbortController | null = null;

        // ----------------------------------------------------
        // D. Reset state for the selected resource
        // ----------------------------------------------------

        setState({
            scopeKey,
            readiness: null,
            isLoading: true,
            isPolling: false,
            error: null,
        });

        // ----------------------------------------------------
        // E. Schedule the next request
        // ----------------------------------------------------

        const scheduleNextPoll = (
            delay: number
        ) => {
            if (disposed) return;

            if (pollTimer !== null) {
                clearTimeout(pollTimer);
            }

            pollTimer = setTimeout(() => {
                pollTimer = null;

                void fetchStatus();
            }, delay);
        };

        // ----------------------------------------------------
        // F. Fetch indexing readiness
        // ----------------------------------------------------

        const fetchStatus = async () => {
            if (disposed || activeController) {
                return;
            }

            const controller = new AbortController();

            activeController = controller;

            let timedOut = false;

            // Protect against indefinitely hanging requests.

            requestTimer = setTimeout(() => {
                timedOut = true;
                controller.abort();
            }, REQUEST_TIMEOUT_MS);

            try {
                const result =
                    await contractService
                        .getContractIndexingStatus(
                            contractId,
                            versionId,
                            controller.signal
                        );

                // Ignore responses from obsolete requests.

                if (disposed) {
                    return;
                }

                if (timedOut) {
                    throw new Error(
                        "Indexing status request timed out."
                    );
                }

                consecutiveErrors = 0;

                const shouldContinuePolling =
                    result.shouldPoll &&
                    !result.isReady;

                setState({
                    scopeKey,
                    readiness: result,
                    isLoading: false,
                    isPolling: shouldContinuePolling,
                    error: null,
                });

                // Continue only when instructed by the API.

                if (shouldContinuePolling) {
                    scheduleNextPoll(
                        resolvePollInterval(
                            result.pollAfterMs
                        )
                    );
                }

            } catch (error) {
                if (disposed) {
                    return;
                }

                if (
                    controller.signal.aborted &&
                    !timedOut
                ) {
                    return;
                }

                consecutiveErrors += 1;

                const message = timedOut
                    ? "Indexing status request timed out."
                    : error instanceof Error
                        ? error.message
                        : "Unable to check indexing status.";

                // Existing response handler includes HTTP
                // status codes at the end of error messages.

                const isTerminalHttpError =
                    /\((400|401|403|404)\)$/.test(
                        message
                    );

                const shouldRetry =
                    !isTerminalHttpError &&
                    consecutiveErrors <
                    MAX_CONSECUTIVE_ERRORS;

                // Fail closed when readiness cannot
                // be verified.

                setState({
                    scopeKey,
                    readiness: null,
                    isLoading: false,
                    isPolling: shouldRetry,
                    error: message,
                });

                if (shouldRetry) {
                    scheduleNextPoll(
                        ERROR_RETRY_INTERVAL_MS
                    );
                }

            } finally {
                if (requestTimer !== null) {
                    clearTimeout(requestTimer);

                    requestTimer = null;
                }

                if (
                    activeController === controller
                ) {
                    activeController = null;
                }
            }
        };

        // ----------------------------------------------------
        // G. Execute the initial readiness request
        // ----------------------------------------------------

        void fetchStatus();

        // ----------------------------------------------------
        // H. Cleanup
        // ----------------------------------------------------

        return () => {
            disposed = true;

            if (pollTimer !== null) {
                clearTimeout(pollTimer);
                pollTimer = null;
            }

            if (requestTimer !== null) {
                clearTimeout(requestTimer);
                requestTimer = null;
            }

            if (activeController) {
                activeController.abort();
                activeController = null;
            }
        };

    }, [
        contractId,
        versionId,
        enabled,
        scopeKey,
    ]);

    // ========================================================
    // 6. PROTECT AGAINST STALE RESOURCE STATE
    // ========================================================

    const hasCurrentState =
        scopeKey !== null &&
        state.scopeKey === scopeKey;

    const readiness = hasCurrentState
        ? state.readiness
        : null;

    const isLoading =
        scopeKey !== null &&
        (
            !hasCurrentState ||
            state.isLoading
        );

    const isPolling =
        hasCurrentState &&
        state.isPolling;

    const error = hasCurrentState
        ? state.error
        : null;

    const isReady =
        readiness?.status === "Ready" &&
        readiness.isReady === true &&
        !error;

    const canAskQuestions =
        isReady &&
        readiness?.canAskQuestions === true;

    // ========================================================
    // 7. PUBLIC HOOK INTERFACE
    // ========================================================

    return {
        readiness,
        isLoading,
        isPolling,
        isReady,
        canAskQuestions,
        error,
        refresh,
    };
}
