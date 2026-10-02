"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock3,
    FileCheck2,
    FileText,
    Loader2,
    RefreshCw,
    Search,
    ShieldAlert,
    UserRoundCheck,
    X,
} from "lucide-react";

import { premiumToast } from "@/lib/premium-toast";


const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://nyaymitra-backend-production.up.railway.app/api/v1"
).replace(/\/$/, "");


const COMPLIANCE_API =
    `${API_BASE}/admin/compliance`;

const STATS_API =
    `${COMPLIANCE_API}/stats`;

const LAWYERS_API =
    `${API_BASE}/lawyer/all`;


type ComplianceStatus =
    | "pending"
    | "in-progress"
    | "completed"
    | "overdue";

type Priority =
    | "low"
    | "medium"
    | "high";


interface Business {
    _id: string;
    companyName?: string;
    legalName?: string;
    industry?: string;
}


interface Lawyer {
    _id: string;
    userId?: string;
    fullName?: string;
    name?: string;
    email?: string;
    userInfo?: {
        fullName?: string;
        email?: string;
    };
    lawyerDetails?: {
        _id?: string;
        specialization?: string[];
        experience?: number;
    };
}


interface ComplianceItem {
    _id: string;
    name: string;
    organization?: string;
    category?: string;
    description?: string;

    business?:
    | Business
    | string
    | null;

    assignedTo?: {
        _id?: string;
        userId?: string;
        fullName?: string;
        email?: string;
        role?: string;
    } | null;

    dueDate?: string;

    status: ComplianceStatus;

    priority: Priority;

    relatedDocuments?: number;

    recurring?: boolean;
    recurrence?: string | null;

    completedAt?: string | null;
    completedBy?: string | null;

    createdAt?: string;
    updatedAt?: string;
}


interface Stats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
}


interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}


function getToken() {
    if (
        typeof window === "undefined"
    ) {
        return "";
    }

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}


async function apiFetch<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const response = await fetch(
        url,
        {
            ...options,
            headers: {
                "Content-Type":
                    "application/json",

                ...(token
                    ? {
                        Authorization:
                            `Bearer ${token}`,
                    }
                    : {}),

                ...(options.headers || {}),
            },
            cache: "no-store",
        }
    );

    let result: any = null;

    try {
        result =
            await response.json();
    } catch {
        // Ignore non-JSON response
    }

    if (!response.ok) {
        throw new Error(
            result?.message ||
            `Request failed (${response.status})`
        );
    }

    return result;
}


function formatDate(
    value?: string | null
) {
    if (!value) return "—";

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}


function formatStatus(
    status?: string
) {
    if (!status) return "—";

    return status
        .split("-")
        .map(
            (part) =>
                part
                    .charAt(0)
                    .toUpperCase() +
                part.slice(1)
        )
        .join(" ");
}


function getBusinessName(
    business:
        | Business
        | string
        | null
        | undefined
) {
    if (!business) {
        return "Unknown Business";
    }

    if (
        typeof business ===
        "string"
    ) {
        return business;
    }

    return (
        business.companyName ||
        business.legalName ||
        "Unknown Business"
    );
}


function getLawyerName(
    lawyer:
        | ComplianceItem["assignedTo"]
        | null
        | undefined
) {
    return (
        lawyer?.fullName ||
        "Not assigned"
    );
}


function normalizeLawyer(
    raw: any
): Lawyer {
    const info =
        raw?.userInfo || {};

    const details =
        raw?.lawyerDetails || {};

    return {
        _id:
            raw?._id ||
            details?._id ||
            "",

        userId:
            raw?.userId,

        fullName:
            raw?.fullName ||
            info?.fullName ||
            raw?.name ||
            "Unknown Lawyer",

        name:
            raw?.name,

        email:
            raw?.email ||
            info?.email ||
            details?.email ||
            "",

        userInfo:
            raw?.userInfo,

        lawyerDetails:
            raw?.lawyerDetails,
    };
}


function statusClass(
    status: ComplianceStatus
) {
    switch (status) {
        case "pending":
            return "border-amber-400/20 bg-amber-400/10 text-amber-300";

        case "in-progress":
            return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

        case "completed":
            return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

        case "overdue":
            return "border-red-400/20 bg-red-400/10 text-red-300";

        default:
            return "border-zinc-700 bg-zinc-800 text-zinc-300";
    }
}


function priorityClass(
    priority: Priority
) {
    switch (priority) {
        case "high":
            return "text-red-400";

        case "medium":
            return "text-amber-400";

        case "low":
            return "text-emerald-400";

        default:
            return "text-zinc-400";
    }
}


function getInitials(
    name?: string
) {
    if (!name) return "U";

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            (part) =>
                part
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");
}


export default function AdminCompliancePage() {
    const [
        compliance,
        setCompliance,
    ] = useState<
        ComplianceItem[]
    >([]);


    const [
        stats,
        setStats,
    ] = useState<Stats>({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
    });


    const [
        lawyers,
        setLawyers,
    ] = useState<Lawyer[]>([]);


    const [
        pagination,
        setPagination,
    ] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });


    const [
        page,
        setPage,
    ] = useState(1);


    const [
        search,
        setSearch,
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("all");


    const [
        priorityFilter,
        setPriorityFilter,
    ] = useState("all");


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        statsLoading,
        setStatsLoading,
    ] = useState(true);


    const [
        lawyersLoading,
        setLawyersLoading,
    ] = useState(false);


    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        selectedItem,
        setSelectedItem,
    ] = useState<
        ComplianceItem | null
    >(null);


    const [
        selectedLawyer,
        setSelectedLawyer,
    ] = useState("");


    const [
        lawyerQuery,
        setLawyerQuery,
    ] = useState("");


    const [
        assignLoading,
        setAssignLoading,
    ] = useState(false);


    const [
        assignError,
        setAssignError,
    ] = useState("");


    const [
        statusLoading,
        setStatusLoading,
    ] = useState<
        string | null
    >(null);


    const [
        detailLoading,
        setDetailLoading,
    ] = useState(false);


    // =====================================================
    // FETCH COMPLIANCE
    // =====================================================

    const fetchCompliance =
        useCallback(async () => {
            try {
                setLoading(true);
                setError("");

                const params =
                    new URLSearchParams();

                params.set(
                    "page",
                    String(page)
                );

                params.set(
                    "limit",
                    "10"
                );

                if (
                    search.trim()
                ) {
                    params.set(
                        "search",
                        search.trim()
                    );
                }

                if (
                    statusFilter !==
                    "all"
                ) {
                    params.set(
                        "status",
                        statusFilter
                    );
                }

                if (
                    priorityFilter !==
                    "all"
                ) {
                    params.set(
                        "priority",
                        priorityFilter
                    );
                }

                const result =
                    await apiFetch<{
                        success: boolean;
                        data?: {
                            items?: ComplianceItem[];
                            pagination?: Pagination;
                        };
                    }>(
                        `${COMPLIANCE_API}?${params.toString()}`
                    );

                setCompliance(
                    result.data?.items ||
                    []
                );

                setPagination(
                    result.data?.pagination ||
                    {
                        page,
                        limit: 10,
                        total: 0,
                        totalPages: 1,
                    }
                );
            } catch (err) {
                console.error(
                    "Fetch admin compliance:",
                    err
                );

                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch compliance.";

                setError(message);

                // ===== ERROR TOAST =====
                premiumToast.error('Could not load compliance', {
                    description: message,
                });
            } finally {
                setLoading(false);
            }
        }, [
            page,
            search,
            statusFilter,
            priorityFilter,
        ]);


    // =====================================================
    // FETCH STATS
    // =====================================================

    const fetchStats =
        useCallback(async () => {
            try {
                setStatsLoading(
                    true
                );

                const result =
                    await apiFetch<{
                        success: boolean;
                        data?: Stats;
                    }>(
                        STATS_API
                    );

                setStats(
                    result.data || {
                        total: 0,
                        pending: 0,
                        inProgress: 0,
                        completed: 0,
                        overdue: 0,
                    }
                );
            } catch (err) {
                console.error(
                    "Compliance stats:",
                    err
                );

                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to load statistics.";

                // ===== ERROR TOAST =====
                premiumToast.error('Could not load statistics', {
                    description: message,
                });
            } finally {
                setStatsLoading(
                    false
                );
            }
        }, []);


    // =====================================================
    // FETCH LAWYERS
    // =====================================================

    const fetchLawyers =
        useCallback(async () => {
            try {
                setLawyersLoading(
                    true
                );

                const result =
                    await apiFetch<any>(
                        `${LAWYERS_API}?page=1&limit=100`
                    );

                const rawList =
                    Array.isArray(
                        result?.lawyers
                    )
                        ? result.lawyers
                        : Array.isArray(
                            result?.data
                        )
                            ? result.data
                            : [];

                const normalized =
                    rawList
                        .map(
                            normalizeLawyer
                        )
                        .filter(
                            (item: Lawyer) =>
                                Boolean(
                                    item._id
                                )
                        );

                setLawyers(
                    normalized
                );
            } catch (err) {
                console.error(
                    "Fetch lawyers:",
                    err
                );

                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to load lawyers.";

                // ===== ERROR TOAST =====
                premiumToast.error('Could not load lawyers', {
                    description: message,
                });
            } finally {
                setLawyersLoading(
                    false
                );
            }
        }, []);


    useEffect(() => {
        void fetchCompliance();
    }, [fetchCompliance]);


    useEffect(() => {
        void fetchStats();
        void fetchLawyers();
    }, [
        fetchStats,
        fetchLawyers,
    ]);


    // =====================================================
    // REFRESH
    // =====================================================

    const refresh = async () => {
        setRefreshing(true);

        try {
            await Promise.all([
                fetchCompliance(),
                fetchStats(),
                fetchLawyers(),
            ]);

            // ===== SUCCESS TOAST =====
            premiumToast.success('Refreshed', {
                description: 'Latest compliance data loaded.',
                duration: 2000,
            });
        } finally {
            setRefreshing(
                false
            );
        }
    };


    // =====================================================
    // OPEN DETAILS
    // =====================================================

    const openDetails = async (
        item: ComplianceItem
    ) => {
        setSelectedItem(item);
        setAssignError("");

        try {
            setDetailLoading(true);

            const result =
                await apiFetch<{
                    success: boolean;
                    data?: ComplianceItem;
                }>(
                    `${COMPLIANCE_API}/${item._id}`
                );

            if (
                result.data
            ) {
                setSelectedItem(
                    result.data
                );
            }
        } catch (err) {
            // Keep list item as fallback — but tell the user

            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to load details.'

            // ===== ERROR TOAST =====
            premiumToast.error('Could not load details', {
                description: message,
            });
        } finally {
            setDetailLoading(
                false
            );
        }
    };


    // =====================================================
    // ASSIGN LAWYER
    // =====================================================

    const assignLawyer =
        async () => {
            if (
                !selectedItem
            ) {
                return;
            }

            if (
                !selectedLawyer
            ) {
                setAssignError(
                    "Please select a lawyer."
                );

                // ===== WARNING TOAST =====
                premiumToast.warning('Select a lawyer', {
                    description: 'Choose a lawyer before assigning.',
                });

                return;
            }

            const lawyerName =
                lawyers.find((l) => l._id === selectedLawyer)?.fullName ||
                'Lawyer';

            try {
                setAssignLoading(
                    true
                );

                setAssignError("");

                const result =
                    await apiFetch<{
                        success: boolean;
                        data?: ComplianceItem;
                    }>(
                        `${COMPLIANCE_API}/${selectedItem._id}/assign`,
                        {
                            method:
                                "PATCH",

                            body:
                                JSON.stringify(
                                    {
                                        lawyerId:
                                            selectedLawyer,
                                    }
                                ),
                        }
                    );

                if (
                    result.data
                ) {
                    setCompliance(
                        (
                            current
                        ) =>
                            current.map(
                                (
                                    item
                                ) =>
                                    item._id ===
                                        result.data!._id
                                        ? result.data!
                                        : item
                            )
                    );

                    setSelectedItem(
                        result.data
                    );
                }

                await fetchStats();

                // ===== SUCCESS TOAST =====
                premiumToast.success('Lawyer assigned', {
                    description: `${lawyerName} is now assigned to this compliance item.`,
                });
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to assign lawyer."

                setAssignError(message);

                // ===== ERROR TOAST =====
                premiumToast.error('Assignment failed', {
                    description: message,
                });
            } finally {
                setAssignLoading(
                    false
                );
            }
        };


    // =====================================================
    // UPDATE STATUS
    // =====================================================

    const updateStatus =
        async (
            id: string,
            status: ComplianceStatus
        ) => {
            try {
                setStatusLoading(
                    id
                );

                const result =
                    await apiFetch<{
                        success: boolean;
                        data?: ComplianceItem;
                    }>(
                        `${COMPLIANCE_API}/${id}/status`,
                        {
                            method:
                                "PATCH",

                            body:
                                JSON.stringify(
                                    {
                                        status,
                                    }
                                ),
                        }
                    );

                if (
                    result.data
                ) {
                    setCompliance(
                        (
                            current
                        ) =>
                            current.map(
                                (
                                    item
                                ) =>
                                    item._id ===
                                        result.data!._id
                                        ? result.data!
                                        : item
                            )
                    );

                    if (
                        selectedItem?._id ===
                        result.data._id
                    ) {
                        setSelectedItem(
                            result.data
                        );
                    }
                }

                await fetchStats();

                // ===== SUCCESS TOAST =====
                premiumToast.success('Status updated', {
                    description: `Marked as ${formatStatus(status)}.`,
                });
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to update status."

                setError(message);

                // ===== ERROR TOAST =====
                premiumToast.error('Status update failed', {
                    description: message,
                });
            } finally {
                setStatusLoading(
                    null
                );
            }
        };


    const filteredLawyers =
        useMemo(() => {
            const query =
                lawyerQuery
                    .trim()
                    .toLowerCase();

            if (!query) {
                return lawyers;
            }

            return lawyers.filter(
                (lawyer) =>
                    (
                        lawyer.fullName ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query) ||
                    (
                        lawyer.email ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)
            );
        }, [
            lawyers,
            lawyerQuery,
        ]);


    return (
        <main className="min-h-screen bg-[#070707] text-white">

            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <header className="border-b border-white/[0.06] pb-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                                Admin · Legal Operations
                            </p>

                            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                Compliance
                            </h1>

                            <p className="mt-1 text-sm text-zinc-500">
                                Monitor business compliance obligations and assign legal professionals.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={
                                refresh
                            }
                            disabled={
                                refreshing
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={
                                    `h-4 w-4 ${refreshing
                                        ? "animate-spin"
                                        : ""
                                    }`
                                }
                            />

                            Refresh
                        </button>

                    </div>

                </header>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (
                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">

                        <AlertCircle className="h-4 w-4" />

                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={
                                () =>
                                    void fetchCompliance()
                            }
                            className="ml-auto underline"
                        >
                            Retry
                        </button>

                    </div>
                )}


                {/* =====================================================
                    STATS
                ===================================================== */}

                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">

                    <StatCard
                        label="Total"
                        value={
                            statsLoading
                                ? "—"
                                : stats.total
                        }
                        icon={
                            <FileCheck2 className="h-4 w-4" />
                        }
                    />

                    <StatCard
                        label="Pending"
                        value={
                            statsLoading
                                ? "—"
                                : stats.pending
                        }
                        icon={
                            <Clock3 className="h-4 w-4" />
                        }
                    />

                    <StatCard
                        label="In Progress"
                        value={
                            statsLoading
                                ? "—"
                                : stats.inProgress
                        }
                        icon={
                            <Loader2 className="h-4 w-4" />
                        }
                    />

                    <StatCard
                        label="Completed"
                        value={
                            statsLoading
                                ? "—"
                                : stats.completed
                        }
                        icon={
                            <CheckCircle2 className="h-4 w-4" />
                        }
                    />

                    <StatCard
                        label="Overdue"
                        value={
                            statsLoading
                                ? "—"
                                : stats.overdue
                        }
                        icon={
                            <ShieldAlert className="h-4 w-4" />
                        }
                    />

                </section>


                {/* =====================================================
                    FILTERS
                ===================================================== */}

                <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">

                    <div className="flex flex-col gap-3 lg:flex-row">

                        <div className="relative flex-1">

                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                            <input
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) => {
                                    setSearch(
                                        event.target
                                            .value
                                    );
                                    setPage(
                                        1
                                    );
                                }}
                                placeholder="Search compliance, business or category..."
                                className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.02] pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-amber-400/30"
                            />

                        </div>


                        <select
                            value={
                                statusFilter
                            }
                            onChange={(
                                event
                            ) => {
                                setStatusFilter(
                                    event.target
                                        .value
                                );
                                setPage(
                                    1
                                );
                            }}
                            className="h-11 rounded-xl border border-white/[0.07] bg-[#101318] px-3 text-xs text-white outline-none"
                        >
                            <option value="all">
                                All statuses
                            </option>

                            <option value="pending">
                                Pending
                            </option>

                            <option value="in-progress">
                                In Progress
                            </option>

                            <option value="completed">
                                Completed
                            </option>

                            <option value="overdue">
                                Overdue
                            </option>
                        </select>


                        <select
                            value={
                                priorityFilter
                            }
                            onChange={(
                                event
                            ) => {
                                setPriorityFilter(
                                    event.target
                                        .value
                                );
                                setPage(
                                    1
                                );
                            }}
                            className="h-11 rounded-xl border border-white/[0.07] bg-[#101318] px-3 text-xs text-white outline-none"
                        >
                            <option value="all">
                                All priorities
                            </option>

                            <option value="high">
                                High
                            </option>

                            <option value="medium">
                                Medium
                            </option>

                            <option value="low">
                                Low
                            </option>
                        </select>

                    </div>

                </section>


                {/* =====================================================
                    TABLE
                ===================================================== */}

                <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1200px] text-left">

                            <thead className="border-b border-white/[0.06] bg-white/[0.02]">

                                <tr>

                                    {[
                                        "Compliance",
                                        "Business",
                                        "Category",
                                        "Priority",
                                        "Due Date",
                                        "Assigned Lawyer",
                                        "Status",
                                        "Action",
                                    ].map(
                                        (
                                            heading
                                        ) => (
                                            <th
                                                key={
                                                    heading
                                                }
                                                className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600"
                                            >
                                                {
                                                    heading
                                                }
                                            </th>
                                        )
                                    )}

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-white/[0.05]">

                                {loading ? (
                                    <tr>

                                        <td
                                            colSpan={
                                                8
                                            }
                                            className="px-5 py-16 text-center"
                                        >
                                            <Loader2 className="mx-auto h-5 w-5 animate-spin text-amber-400" />

                                            <p className="mt-3 text-xs text-zinc-600">
                                                Loading compliance...
                                            </p>

                                        </td>

                                    </tr>
                                ) : compliance.length === 0 ? (
                                    <tr>

                                        <td
                                            colSpan={
                                                8
                                            }
                                            className="px-5 py-16 text-center"
                                        >
                                            <FileText className="mx-auto h-7 w-7 text-zinc-700" />

                                            <p className="mt-3 text-sm font-medium text-zinc-400">
                                                No compliance items found
                                            </p>

                                            <p className="mt-1 text-xs text-zinc-700">
                                                Try changing your filters.
                                            </p>

                                        </td>

                                    </tr>
                                ) : (
                                    compliance.map(
                                        (
                                            item
                                        ) => (
                                            <tr
                                                key={
                                                    item._id
                                                }
                                                onClick={() =>
                                                    void openDetails(
                                                        item
                                                    )
                                                }
                                                className="cursor-pointer transition hover:bg-white/[0.02]"
                                            >

                                                {/* Compliance */}

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                                                            <FileCheck2 className="h-4 w-4" />
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="max-w-[240px] truncate text-sm font-semibold text-white">
                                                                {
                                                                    item.name
                                                                }
                                                            </p>

                                                            <p className="mt-1 max-w-[240px] truncate text-[10px] uppercase tracking-wider text-zinc-600">
                                                                {
                                                                    item._id
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* Business */}

                                                <td className="px-5 py-4">

                                                    <p className="max-w-[210px] truncate text-xs font-medium text-zinc-300">
                                                        {
                                                            getBusinessName(
                                                                item.business
                                                            )
                                                        }
                                                    </p>

                                                    {item.organization && (
                                                        <p className="mt-1 max-w-[210px] truncate text-[10px] text-zinc-600">
                                                            {
                                                                item.organization
                                                            }
                                                        </p>
                                                    )}

                                                </td>


                                                {/* Category */}

                                                <td className="px-5 py-4">

                                                    <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-zinc-400">
                                                        {
                                                            item.category ||
                                                            "Other"
                                                        }
                                                    </span>

                                                </td>


                                                {/* Priority */}

                                                <td className="px-5 py-4">

                                                    <span
                                                        className={`text-xs font-medium capitalize ${priorityClass(
                                                            item.priority
                                                        )}`}
                                                    >
                                                        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-current" />

                                                        {
                                                            item.priority
                                                        }
                                                    </span>

                                                </td>


                                                {/* Due Date */}

                                                <td className="px-5 py-4">

                                                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">

                                                        <CalendarDays className="h-3.5 w-3.5" />

                                                        {
                                                            formatDate(
                                                                item.dueDate
                                                            )
                                                        }

                                                    </span>

                                                </td>


                                                {/* Lawyer */}

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-2">

                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-[10px] font-semibold text-amber-400">
                                                            {
                                                                getInitials(
                                                                    getLawyerName(
                                                                        item.assignedTo
                                                                    )
                                                                )
                                                            }
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="max-w-[170px] truncate text-xs font-medium text-zinc-300">
                                                                {
                                                                    getLawyerName(
                                                                        item.assignedTo
                                                                    )
                                                                }
                                                            </p>

                                                            {item.assignedTo?.email && (
                                                                <p className="max-w-[170px] truncate text-[10px] text-zinc-600">
                                                                    {
                                                                        item.assignedTo
                                                                            .email
                                                                    }
                                                                </p>
                                                            )}

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* Status */}

                                                <td className="px-5 py-4">

                                                    <div
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                    >

                                                        <div className="relative">

                                                            <select
                                                                value={
                                                                    item.status
                                                                }
                                                                disabled={
                                                                    statusLoading ===
                                                                    item._id
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    void updateStatus(
                                                                        item._id,
                                                                        event.target
                                                                            .value as ComplianceStatus
                                                                    )
                                                                }
                                                                className={`appearance-none rounded-full border px-3 py-1 pr-8 text-[10px] font-medium outline-none ${statusClass(
                                                                    item.status
                                                                )}`}
                                                            >

                                                                <option value="pending">
                                                                    Pending
                                                                </option>

                                                                <option value="in-progress">
                                                                    In Progress
                                                                </option>

                                                                <option value="completed">
                                                                    Completed
                                                                </option>

                                                                <option value="overdue">
                                                                    Overdue
                                                                </option>

                                                            </select>

                                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* Action */}

                                                <td className="px-5 py-4 text-right">

                                                    <button
                                                        type="button"
                                                        onClick={(
                                                            event
                                                        ) => {
                                                            event.stopPropagation();

                                                            setSelectedItem(
                                                                item
                                                            );

                                                            setSelectedLawyer(
                                                                item.assignedTo?._id ||
                                                                ""
                                                            );

                                                            setLawyerQuery(
                                                                ""
                                                            );

                                                            setAssignError(
                                                                ""
                                                            );
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/10"
                                                    >

                                                        <UserRoundCheck className="h-3.5 w-3.5" />

                                                        {
                                                            item.assignedTo
                                                                ? "Reassign"
                                                                : "Assign"
                                                        }

                                                    </button>

                                                </td>

                                            </tr>
                                        )
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* PAGINATION */}

                    <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">

                        <p className="text-xs text-zinc-600">

                            {
                                pagination.total
                            }{" "}
                            compliance item
                            {
                                pagination.total !==
                                    1
                                    ? "s"
                                    : ""
                            }

                        </p>


                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                disabled={
                                    page <=
                                    1
                                }
                                onClick={() =>
                                    setPage(
                                        (
                                            current
                                        ) =>
                                            Math.max(
                                                1,
                                                current -
                                                1
                                            )
                                    )
                                }
                                className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] text-zinc-400 disabled:opacity-30"
                            >
                                Previous
                            </button>


                            <span className="text-[11px] text-zinc-600">
                                Page{" "}
                                {
                                    page
                                }{" "}
                                of{" "}
                                {
                                    pagination.totalPages
                                }
                            </span>


                            <button
                                type="button"
                                disabled={
                                    page >=
                                    pagination.totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        (
                                            current
                                        ) =>
                                            current +
                                            1
                                    )
                                }
                                className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] text-zinc-400 disabled:opacity-30"
                            >
                                Next
                            </button>

                        </div>

                    </div>

                </section>

            </div>


            {/* =====================================================
                DETAIL / ASSIGN DRAWER
            ===================================================== */}

            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                    onClick={() =>
                        !assignLoading &&
                        setSelectedItem(
                            null
                        )
                    }
                >

                    <aside
                        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#0b0d10] shadow-2xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* Header */}

                        <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-5">

                            <div className="min-w-0">

                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                                    Compliance
                                </p>

                                <h2 className="mt-2 truncate text-lg font-semibold text-white">
                                    {
                                        selectedItem.name
                                    }
                                </h2>

                                <p className="mt-1 text-xs text-zinc-600">
                                    {
                                        getBusinessName(
                                            selectedItem.business
                                        )
                                    }
                                </p>

                            </div>


                            <button
                                type="button"
                                disabled={
                                    assignLoading
                                }
                                onClick={() =>
                                    setSelectedItem(
                                        null
                                    )
                                }
                                className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>

                        </div>


                        {/* Content */}

                        <div className="flex-1 overflow-y-auto p-6">

                            {detailLoading && (
                                <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500">
                                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                                    Loading details...
                                </div>
                            )}


                            <div className="grid grid-cols-2 gap-3">

                                <DetailCard
                                    label="Category"
                                    value={
                                        selectedItem.category ||
                                        "Other"
                                    }
                                />

                                <DetailCard
                                    label="Priority"
                                    value={
                                        selectedItem.priority
                                    }
                                />

                                <DetailCard
                                    label="Due Date"
                                    value={
                                        formatDate(
                                            selectedItem.dueDate
                                        )
                                    }
                                />

                                <DetailCard
                                    label="Status"
                                    value={
                                        formatStatus(
                                            selectedItem.status
                                        )
                                    }
                                />

                            </div>


                            {selectedItem.description && (
                                <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                                        Description
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                                        {
                                            selectedItem.description
                                        }
                                    </p>

                                </div>
                            )}


                            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                                    Assignment
                                </p>

                                <div className="mt-4">

                                    <input
                                        value={
                                            lawyerQuery
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setLawyerQuery(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Search lawyer..."
                                        className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#101318] px-3 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-amber-400/30"
                                    />

                                </div>


                                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">

                                    {lawyersLoading ? (
                                        <div className="flex items-center gap-2 py-6 text-xs text-zinc-500">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading lawyers...
                                        </div>
                                    ) : filteredLawyers.length ===
                                        0 ? (
                                        <p className="py-6 text-xs text-zinc-600">
                                            No lawyers found.
                                        </p>
                                    ) : (
                                        filteredLawyers.map(
                                            (
                                                lawyer
                                            ) => {
                                                const active =
                                                    selectedLawyer ===
                                                    lawyer._id;

                                                return (
                                                    <button
                                                        key={
                                                            lawyer._id
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedLawyer(
                                                                lawyer._id
                                                            )
                                                        }
                                                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active
                                                            ? "border-amber-400/40 bg-amber-400/[0.07]"
                                                            : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                                                            }`}
                                                    >

                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-xs font-semibold text-amber-400">
                                                            {
                                                                getInitials(
                                                                    lawyer.fullName
                                                                )
                                                            }
                                                        </div>

                                                        <div className="min-w-0 flex-1">

                                                            <p className="truncate text-xs font-semibold text-zinc-200">
                                                                {
                                                                    lawyer.fullName
                                                                }
                                                            </p>

                                                            <p className="truncate text-[10px] text-zinc-600">
                                                                {
                                                                    lawyer.email
                                                                }
                                                            </p>

                                                        </div>

                                                        {active && (
                                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
                                                        )}

                                                    </button>
                                                );
                                            }
                                        )
                                    )}

                                </div>


                                {assignError && (
                                    <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-xs text-red-300">
                                        {
                                            assignError
                                        }
                                    </div>
                                )}


                                <button
                                    type="button"
                                    disabled={
                                        assignLoading ||
                                        !selectedLawyer
                                    }
                                    onClick={() =>
                                        void assignLawyer()
                                    }
                                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-xs font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    {assignLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <UserRoundCheck className="h-4 w-4" />
                                            Assign Lawyer
                                        </>
                                    )}

                                </button>

                            </div>


                            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                                    Status
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">

                                    {[
                                        "pending",
                                        "in-progress",
                                        "completed",
                                        "overdue",
                                    ].map(
                                        (
                                            status
                                        ) => (
                                            <button
                                                key={
                                                    status
                                                }
                                                type="button"
                                                disabled={
                                                    statusLoading ===
                                                    selectedItem._id
                                                }
                                                onClick={() =>
                                                    void updateStatus(
                                                        selectedItem._id,
                                                        status as ComplianceStatus
                                                    )
                                                }
                                                className={`rounded-full border px-3 py-1.5 text-[10px] font-medium transition ${selectedItem.status ===
                                                    status
                                                    ? statusClass(
                                                        status as ComplianceStatus
                                                    )
                                                    : "border-white/[0.07] bg-white/[0.02] text-zinc-500 hover:bg-white/[0.05]"
                                                    }`}
                                            >
                                                {
                                                    formatStatus(
                                                        status
                                                    )
                                                }
                                            </button>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                    </aside>

                </div>
            )}

        </main>
    );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

            <div className="flex items-center justify-between">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                    {icon}
                </div>

            </div>

            <p className="mt-5 text-2xl font-semibold text-white">
                {value}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
                {label}
            </p>

        </div>
    );
}


/* =========================================================
   DETAIL CARD
========================================================= */

function DetailCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">

            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                {label}
            </p>

            <p className="mt-1 text-sm font-medium text-zinc-300">
                {value}
            </p>

        </div>
    );
}