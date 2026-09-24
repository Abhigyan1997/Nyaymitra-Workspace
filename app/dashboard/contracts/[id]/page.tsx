// app/dashboard/contracts/[id]/page.tsx

"use client"

import {
    useCallback,
    useEffect,
    useState,
} from "react"

import Link from "next/link"

import {
    ArrowLeft,
    CalendarDays,
    Download,
    MoreHorizontal,
    RefreshCw,
    ShieldCheck,
} from "lucide-react"

import {
    CommentComposer,
    ContractActivity,
    ContractDocuments,
    ContractOverview,
    PriorityBadge,
    StatusBadge,
} from "@/components/contracts/contracts"

import {
    contractService,
    type Contract,
    type ContractActivity as ApiContractActivity,
    type ContractComment,
    type ContractRequest,
} from "@/lib/services/contract.service"

import {
    formatContractDate,
    getContractVersionLabel,
} from "@/lib/contracts"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type PageState =
    | "loading"
    | "contract"
    | "request"
    | "not-found"
    | "error"

type DetailComment = {
    _id?: string
    id?: string
    message?: string
    comment?: string
    text?: string
    content?: string
    createdAt?: string
    user?: unknown
    createdBy?: unknown
    isInternal?: boolean
}

type FinalFileType = "pdf" | "docx" | "signedPdf"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false
    }

    const message = error.message.toLowerCase()

    return (
        message.includes("404") ||
        message.includes("not found")
    )
}

function normalizeComments(
    comments: ContractComment[]
): DetailComment[] {
    return comments as unknown as DetailComment[]
}

function normalizeActivities(
    activities: ApiContractActivity[]
) {
    return activities as unknown as Array<{
        _id?: string
        id?: string
        action?: string
        event?: string
        type?: string
        title?: string
        label?: string
        description?: string
        detail?: string
        createdAt?: string
        date?: string
        performedBy?: unknown
        user?: unknown
    }>
}

/**
 * A contract has a downloadable final document when at least
 * one of these populated fields is present:
 *
 *   currentDocument  → the working PDF (fileType: "pdf")
 *   signedDocument   → the executed PDF (fileType: "signedPdf")
 *
 * Fields may be a populated BusinessDocument object OR a string ID.
 * Both are valid — the backend resolves the ID.
 */
function hasAnyFinalDocument(contract: Contract): boolean {
    const isPresent = (value: unknown): boolean => {
        if (!value) return false
        if (typeof value === "string") return value.length > 0
        if (typeof value === "object") return true
        return false
    }

    return (
        isPresent(contract.currentDocument) ||
        isPresent(contract.signedDocument)
    )
}

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value)
}

/* -------------------------------------------------------------------------- */
/* Final document download (R2)                                               */
/* -------------------------------------------------------------------------- */

/**
 * Order matters:
 *  1. Prefer the signed/executed copy if present.
 *  2. Fall back to the working PDF.
 *  3. Finally try the DOCX source.
 */
const FINAL_FILE_CANDIDATES: FinalFileType[] = [
    "signedPdf",
    "pdf",
    "docx",
]

function buildFinalFilename(
    contractId: string,
    fileType: FinalFileType
): string {
    const ext = fileType === "docx" ? "docx" : "pdf"

    const suffix =
        fileType === "signedPdf"
            ? "signed"
            : fileType === "pdf"
                ? "final"
                : "source"

    return `contract-${contractId}-${suffix}.${ext}`
}

/**
 * Fetch an R2 object from a signed URL and force a browser save.
 *
 * We do NOT use window.open here:
 *   window.open() after an await is blocked by popup blockers.
 *
 * We do NOT send an Authorization header to R2:
 *   the signed URL is self-authorizing. Sending extra headers
 *   will invalidate the signature and R2 returns 403.
 */
async function downloadFromR2(
    signedUrl: string,
    filename: string
): Promise<void> {
    const response = await fetch(signedUrl, {
        method: "GET",
        credentials: "omit",
        mode: "cors",
    })

    if (!response.ok) {
        throw new Error(
            `Failed to fetch file from R2 (${response.status} ${response.statusText})`
        )
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    try {
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = filename
        a.rel = "noopener noreferrer"
        document.body.appendChild(a)
        a.click()
        a.remove()
    } finally {
        // Free the blob URL after the browser has had time
        // to start the download.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    }
}

function FinalDocumentButton({
    contractId,
    hasDocument,
}: {
    contractId: string
    hasDocument: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const download = async () => {
        if (!hasDocument || loading) return

        setLoading(true)
        setError(null)

        let lastError: unknown = null

        for (const fileType of FINAL_FILE_CANDIDATES) {
            try {
                const result =
                    await contractService.getFinalFileUrl(
                        contractId,
                        fileType
                    )

                if (!result?.url) {
                    continue
                }

                if (!isAbsoluteUrl(result.url)) {
                    throw new Error(
                        "Backend returned a non-absolute URL for the R2 object."
                    )
                }

                const filename = buildFinalFilename(
                    contractId,
                    fileType
                )

                await downloadFromR2(result.url, filename)

                setLoading(false)
                return
            } catch (err) {
                lastError = err
                // Try the next candidate.
            }
        }

        setLoading(false)

        const message =
            lastError instanceof Error
                ? lastError.message
                : "No final document is available for this contract."

        setError(message)
        window.alert(message)
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={download}
                disabled={!hasDocument || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title={
                    hasDocument
                        ? "Download final document"
                        : "No final document available yet"
                }
            >
                <Download className="size-4" />

                {loading ? "Preparing…" : "Download"}
            </button>

            {error && (
                <span className="max-w-[200px] text-right text-[11px] text-red-400">
                    {error}
                </span>
            )}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ContractDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const [id, setId] = useState<string | null>(null)

    const [contract, setContract] =
        useState<Contract | null>(null)

    const [request, setRequest] =
        useState<ContractRequest | null>(null)

    const [comments, setComments] =
        useState<DetailComment[]>([])

    const [activities, setActivities] =
        useState<ReturnType<typeof normalizeActivities>>([])

    const [pageState, setPageState] =
        useState<PageState>("loading")

    const [error, setError] =
        useState<string | null>(null)

    const [refreshing, setRefreshing] =
        useState(false)

    const [commentSubmitting, setCommentSubmitting] =
        useState(false)

    /* ---------------------------------------------------------------------- */
    /* Resolve route params                                                    */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true

        void params.then((resolvedParams) => {
            if (mounted) {
                setId(resolvedParams.id)
            }
        })

        return () => {
            mounted = false
        }
    }, [params])

    /* ---------------------------------------------------------------------- */
    /* Load contract/request                                                   */
    /* ---------------------------------------------------------------------- */

    const loadContract = useCallback(
        async (
            contractId: string,
            options?: { silent?: boolean }
        ) => {
            try {
                if (!options?.silent) {
                    setPageState("loading")
                }

                setError(null)

                try {
                    const actualContract =
                        await contractService.getContractById(
                            contractId
                        )

                    setContract(actualContract)
                    setRequest(null)
                    setPageState("contract")

                    const [
                        activityResult,
                        commentsResult,
                    ] = await Promise.allSettled([
                        contractService.getActivities(
                            actualContract._id
                        ),
                        contractService.getComments(
                            actualContract._id
                        ),
                    ])

                    if (activityResult.status === "fulfilled") {
                        setActivities(
                            normalizeActivities(
                                activityResult.value
                            )
                        )
                    } else {
                        console.warn(
                            "Failed to load contract activity:",
                            activityResult.reason
                        )
                        setActivities([])
                    }

                    if (commentsResult.status === "fulfilled") {
                        setComments(
                            normalizeComments(
                                commentsResult.value
                            )
                        )
                    } else {
                        console.warn(
                            "Failed to load contract comments:",
                            commentsResult.reason
                        )
                        setComments([])
                    }

                    return
                } catch (contractError) {
                    if (!isNotFoundError(contractError)) {
                        throw contractError
                    }
                }

                const actualRequest =
                    await contractService.getContractRequestById(
                        contractId
                    )

                setRequest(actualRequest)
                setContract(null)
                setActivities([])
                setComments([])
                setPageState("request")
            } catch (loadError) {
                console.error(
                    "Failed to load contract detail:",
                    loadError
                )

                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Failed to load contract."
                )

                if (!options?.silent) {
                    setPageState("error")
                }
            }
        },
        []
    )

    /* ---------------------------------------------------------------------- */
    /* Initial load                                                            */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (!id) return
        void loadContract(id)
    }, [id, loadContract])

    /* ---------------------------------------------------------------------- */
    /* Refresh                                                                 */
    /* ---------------------------------------------------------------------- */

    const refresh = async () => {
        if (!id || refreshing) return

        try {
            setRefreshing(true)
            await loadContract(id, { silent: true })
        } finally {
            setRefreshing(false)
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Add comment                                                             */
    /* ---------------------------------------------------------------------- */

    const handleAddComment = async (message: string) => {
        if (!contract) return

        try {
            setCommentSubmitting(true)

            const createdComment =
                await contractService.addComment(
                    contract._id,
                    message
                )

            setComments((current) => [
                ...current,
                createdComment as unknown as DetailComment,
            ])
        } finally {
            setCommentSubmitting(false)
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Loading                                                                 */
    /* ---------------------------------------------------------------------- */

    if (pageState === "loading" || !id) {
        return (
            <main className="contracts-theme flex min-h-screen items-center justify-center bg-black text-zinc-100">
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="size-2 animate-pulse rounded-full bg-yellow-400" />
                    Loading contract...
                </div>
            </main>
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Error                                                                   */
    /* ---------------------------------------------------------------------- */

    if (pageState === "error") {
        return (
            <main className="contracts-theme flex min-h-screen items-center justify-center bg-black p-6 text-zinc-100">
                <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-white">
                        Unable to load contract
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {error ??
                            "Something went wrong while loading this legal record."}
                    </p>

                    <div className="mt-5 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={refresh}
                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300"
                        >
                            <RefreshCw className="size-4" />
                            Try again
                        </button>

                        <Link
                            href="/dashboard/contracts"
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Request detail                                                          */
    /* ---------------------------------------------------------------------- */

    if (pageState === "request" && request) {
        return (
            <RequestDetail
                request={request}
                onRefresh={refresh}
                refreshing={refreshing}
            />
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Contract missing                                                        */
    /* ---------------------------------------------------------------------- */

    if (!contract) {
        return (
            <main className="contracts-theme flex min-h-screen items-center justify-center bg-black p-6 text-zinc-100">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-white">
                        Contract not found
                    </h1>

                    <p className="mt-2 text-sm text-zinc-400">
                        This contract may have been archived or removed.
                    </p>

                    <Link
                        href="/dashboard/contracts"
                        className="mt-5 inline-flex rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300"
                    >
                        Back to workspace
                    </Link>
                </div>
            </main>
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Contract page                                                           */
    /* ---------------------------------------------------------------------- */

    return (
        <main className="contracts-theme min-h-screen bg-black text-zinc-100">
            <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
                {/* ---------------------------------------------------------- */}
                {/* Top bar                                                     */}
                {/* ---------------------------------------------------------- */}

                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/contracts"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-yellow-400"
                    >
                        <ArrowLeft className="size-4" />
                        Back to contracts
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={refresh}
                            disabled={refreshing}
                            aria-label="Refresh contract"
                            className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`size-5 ${refreshing ? "animate-spin" : ""
                                    }`}
                            />
                        </button>

                        <button
                            type="button"
                            aria-label="More contract actions"
                            className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
                        >
                            <MoreHorizontal className="size-5" />
                        </button>
                    </div>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* Header                                                      */}
                {/* ---------------------------------------------------------- */}

                <header className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-zinc-500">
                                    {contract.contractNumber}
                                </span>

                                <StatusBadge status={contract.status} />
                                <PriorityBadge priority={contract.priority} />
                            </div>

                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                {contract.title}
                            </h1>

                            <p className="mt-2 text-sm text-zinc-400">
                                {contract.contractType}
                                {" · "}
                                Last updated{" "}
                                {formatContractDate(contract.updatedAt)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <FinalDocumentButton
                                contractId={contract._id}
                                hasDocument={hasAnyFinalDocument(
                                    contract
                                )}
                            />

                            <button
                                type="button"
                                onClick={refresh}
                                disabled={refreshing}
                                className="rounded-xl bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                            >
                                {refreshing ? "Refreshing…" : "Refresh"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-zinc-800 pt-5 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="size-4 text-yellow-400" />
                            Access limited to your organization
                        </span>

                        <span>
                            Current version{" "}
                            <strong className="text-zinc-200">
                                {getContractVersionLabel(
                                    contract.currentVersion
                                )}
                            </strong>
                        </span>

                        <span>
                            Renewal{" "}
                            <strong className="text-zinc-200">
                                {formatContractDate(
                                    contract.renewalDate
                                )}
                            </strong>
                        </span>

                        <span>
                            Created{" "}
                            <strong className="text-zinc-200">
                                {formatContractDate(
                                    contract.createdAt
                                )}
                            </strong>
                        </span>
                    </div>
                </header>

                {/* ---------------------------------------------------------- */}
                {/* Tabs                                                        */}
                {/* ---------------------------------------------------------- */}

                <div className="mt-5 flex gap-1 overflow-x-auto border-b border-zinc-800">
                    <button
                        type="button"
                        className="border-b-2 border-yellow-400 px-4 py-3 text-sm font-semibold text-white"
                    >
                        Overview
                    </button>

                    <button
                        type="button"
                        className="px-4 py-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-300"
                    >
                        Versions
                    </button>

                    <button
                        type="button"
                        className="px-4 py-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-300"
                    >
                        Documents
                    </button>

                    <button
                        type="button"
                        className="px-4 py-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-300"
                    >
                        Activity
                    </button>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* Content                                                     */}
                {/* ---------------------------------------------------------- */}

                <div className="mt-5 flex flex-col gap-4">
                    <ContractOverview contract={contract} />

                    <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                        <ContractDocuments contract={contract} />

                        <ContractActivity
                            contract={contract}
                            activities={activities}
                        />
                    </div>

                    <CommentComposer
                        comments={comments}
                        onSubmit={handleAddComment}
                        submitting={commentSubmitting}
                    />
                </div>
            </div>
        </main>
    )
}

/* -------------------------------------------------------------------------- */
/* Request detail                                                             */
/* -------------------------------------------------------------------------- */

function RequestDetail({
    request,
    onRefresh,
    refreshing,
}: {
    request: ContractRequest
    onRefresh: () => Promise<void>
    refreshing: boolean
}) {
    const requestedBy =
        typeof request.requestedBy === "string"
            ? request.requestedBy
            : request.requestedBy?.name ??
            request.requestedBy?.email ??
            "Business user"

    const professional =
        typeof request.assignedProfessional === "string"
            ? request.assignedProfessional
            : request.assignedProfessional?.name ??
            request.assignedProfessional?.email ??
            "Not assigned"

    return (
        <main className="contracts-theme min-h-screen bg-black text-zinc-100">
            <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/contracts"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-yellow-400"
                    >
                        <ArrowLeft className="size-4" />
                        Back to contracts
                    </Link>

                    <button
                        type="button"
                        onClick={() => void onRefresh()}
                        disabled={refreshing}
                        aria-label="Refresh request"
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`size-5 ${refreshing ? "animate-spin" : ""
                                }`}
                        />
                    </button>
                </div>

                <header className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-zinc-500">
                                    {request.requestNumber}
                                </span>

                                <StatusBadge status={request.status} />
                                <PriorityBadge priority={request.priority} />
                            </div>

                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                {request.title}
                            </h1>

                            <p className="mt-2 text-sm text-zinc-400">
                                {request.contractType}
                                {" · "}
                                Request submitted{" "}
                                {formatContractDate(request.createdAt)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void onRefresh()}
                            disabled={refreshing}
                            className="rounded-xl bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                        >
                            {refreshing ? "Refreshing…" : "Refresh"}
                        </button>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-zinc-800 pt-5 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="size-4 text-yellow-400" />
                            Request belongs to your organization
                        </span>

                        <span>
                            Expected delivery{" "}
                            <strong className="text-zinc-200">
                                {formatContractDate(
                                    request.expectedDeliveryDate
                                )}
                            </strong>
                        </span>
                    </div>
                </header>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-white">
                            Request details
                        </h2>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                            {request.description || "No description provided."}
                        </p>

                        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Request number
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {request.requestNumber}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Contract type
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {request.contractType}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Requested by
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {requestedBy}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Assigned professional
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {professional}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Created
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {formatContractDate(request.createdAt)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Expected delivery
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {formatContractDate(
                                        request.expectedDeliveryDate
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-white">
                            Request status
                        </h2>

                        <div className="mt-5 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                                <CalendarDays className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {request.status}
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Priority: {request.priority}
                                </p>
                            </div>
                        </div>

                        {request.specialInstructions && (
                            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                <p className="text-xs font-semibold text-zinc-300">
                                    Special instructions
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-500">
                                    {request.specialInstructions}
                                </p>
                            </div>
                        )}

                        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs leading-5 text-zinc-400">
                            This is a legal request. Once it is converted into
                            an actual contract, the contract record will be
                            available in the Contracts workspace.
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}