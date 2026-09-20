'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Download,
    Eye,
    FileCheck2,
    FileText,
    History,
    Mail,
    MoreHorizontal,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    UserRound,
    X,
} from 'lucide-react'

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'

type ComplianceStatus =
    | 'Pending'
    | 'In Progress'
    | 'Completed'
    | 'Overdue'

type CompliancePriority =
    | 'High'
    | 'Medium'
    | 'Low'

type ComplianceCategory =
    | 'Corporate'
    | 'Tax'
    | 'GST'
    | 'Labour'
    | 'Privacy'
    | 'Regulatory'
    | 'Licensing'
    | 'Other'

interface ComplianceActivity {
    id: string
    action: string
    description?: string
    by: string
    timestamp: string
    role?: string
}

interface ComplianceDocument {
    id: string
    name: string
    type: string
    size: string
    category?: string
    key?: string
    status?: string
}

interface ComplianceItem {
    id: string
    name: string
    category: ComplianceCategory
    clientName: string
    clientId: string
    dueDate: string
    status: ComplianceStatus
    priority: CompliancePriority
    description: string
    organization?: string
    recurring?: boolean
    recurrence?: string | null
    completedAt?: string | null
    assignedDate: string
    assignedLawyer: {
        name: string
        email: string
    }
    documents: ComplianceDocument[]
    activities: ComplianceActivity[]
    raw?: any
}

const STATUS_OPTIONS: ComplianceStatus[] = [
    'Pending',
    'In Progress',
    'Completed',
    'Overdue',
]

const CATEGORY_OPTIONS: ComplianceCategory[] = [
    'Corporate',
    'Tax',
    'GST',
    'Labour',
    'Privacy',
    'Regulatory',
    'Licensing',
    'Other',
]

function getToken() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
}

async function apiRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()

    if (!token) {
        throw new Error('NO_TOKEN')
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body
                ? { 'Content-Type': 'application/json' }
                : {}),
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    })

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('NO_TOKEN')
        }

        let message = `Request failed (${response.status})`

        try {
            const body = await response.json()
            message =
                body?.message ||
                body?.error ||
                body?.errors?.[0]?.message ||
                message
        } catch {
            // Non-JSON error body.
        }

        throw new Error(message)
    }

    if (response.status === 204) {
        return {} as T
    }

    return response.json()
}

function extractArray<T>(response: any): T[] {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.items)) return response.items
    if (Array.isArray(response?.compliance)) return response.compliance
    if (Array.isArray(response?.documents)) return response.documents
    if (Array.isArray(response?.activity)) return response.activity
    return []
}

function extractObject(response: any) {
    return (
        response?.data ||
        response?.compliance ||
        response?.item ||
        response
    )
}

function getId(value: any) {
    return String(
        value?._id ||
        value?.id ||
        value?.complianceId ||
        value?.documentId ||
        ''
    )
}

function getBusinessId(item: any) {
    return String(
        item?.business?._id ||
        item?.business?.id ||
        item?.business ||
        ''
    )
}

function getBusinessName(item: any) {
    return (
        item?.business?.companyName ||
        item?.business?.legalName ||
        item?.client?.companyName ||
        item?.client?.legalName ||
        item?.companyName ||
        (typeof item?.client === 'string'
            ? item.client
            : '') ||
        'Client'
    )
}

function normalizeStatus(value: any): ComplianceStatus {
    const raw = String(value || 'pending').toLowerCase()

    const values: Record<string, ComplianceStatus> = {
        pending: 'Pending',
        'in-progress': 'In Progress',
        'in progress': 'In Progress',
        completed: 'Completed',
        overdue: 'Overdue',
    }

    return values[raw] || 'Pending'
}

function apiStatusFromUi(
    value: ComplianceStatus
) {
    const values: Record<
        ComplianceStatus,
        string
    > = {
        Pending: 'pending',
        'In Progress': 'in-progress',
        Completed: 'completed',
        Overdue: 'overdue',
    }

    return values[value]
}

function normalizePriority(value: any): CompliancePriority {
    const raw = String(value || 'medium').toLowerCase()

    if (raw === 'high') return 'High'
    if (raw === 'low') return 'Low'

    return 'Medium'
}

function normalizeCategory(
    value: any
): ComplianceCategory {
    const raw = String(value || 'other').toLowerCase()

    const values: Record<
        string,
        ComplianceCategory
    > = {
        corporate: 'Corporate',
        tax: 'Tax',
        gst: 'GST',
        labour: 'Labour',
        privacy: 'Privacy',
        regulatory: 'Regulatory',
        licensing: 'Licensing',
        other: 'Other',
    }

    return values[raw] || 'Other'
}

function formatDate(
    value?: string,
    includeTime = false
) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    if (includeTime) {
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatFileSize(size: any) {
    const value = Number(size)

    if (!Number.isFinite(value) || value <= 0) {
        return '—'
    }

    if (value < 1024) {
        return `${value} B`
    }

    if (value < 1024 * 1024) {
        return `${(value / 1024).toFixed(1)} KB`
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function mapSummary(item: any): ComplianceItem {
    const assignedTo =
        item?.assignedTo ||
        item?.assignedLawyer

    return {
        id: getId(item),
        name:
            item?.name ||
            item?.title ||
            'Compliance Item',
        category: normalizeCategory(
            item?.category
        ),
        clientName: getBusinessName(item),
        clientId: getBusinessId(item),
        dueDate: item?.dueDate || '',
        status: normalizeStatus(item?.status),
        priority: normalizePriority(
            item?.priority
        ),
        description: item?.description || '',
        organization:
            item?.organization || '',
        recurring: Boolean(item?.recurring),
        recurrence: item?.recurrence || null,
        completedAt:
            item?.completedAt || null,
        assignedDate:
            item?.createdAt ||
            item?.assignedAt ||
            '',
        assignedLawyer: {
            name:
                assignedTo?.fullName ||
                assignedTo?.name ||
                'Assigned Lawyer',
            email: assignedTo?.email || '',
        },
        documents: [],
        activities: [],
        raw: item,
    }
}

function mapDetail(
    item: any,
    fallback?: ComplianceItem
): ComplianceItem {
    const base = mapSummary({
        ...(fallback?.raw || {}),
        ...(item || {}),
    })

    const assignedTo =
        item?.assignedTo ||
        item?.assignedLawyer

    return {
        ...base,
        dueDate:
            item?.dueDate ||
            fallback?.dueDate ||
            '',
        assignedDate:
            item?.createdAt ||
            item?.assignedAt ||
            fallback?.assignedDate ||
            '',
        completedAt:
            item?.completedAt ||
            null,
        assignedLawyer: {
            name:
                assignedTo?.fullName ||
                assignedTo?.name ||
                fallback?.assignedLawyer
                    .name ||
                'Assigned Lawyer',
            email:
                assignedTo?.email ||
                fallback?.assignedLawyer
                    .email ||
                '',
        },
        documents:
            fallback?.documents || [],
        activities:
            fallback?.activities || [],
        raw: item,
    }
}

function mapDocument(
    item: any
): ComplianceDocument {
    return {
        id: getId(item),
        name:
            item?.name ||
            item?.originalName ||
            'Document',
        type:
            item?.mimeType ||
            item?.type ||
            'Document',
        size: formatFileSize(item?.size),
        category: item?.category,
        key: item?.key,
        status: item?.status,
    }
}

function mapActivity(
    item: any
): ComplianceActivity {
    const performer =
        item?.performedBy ||
        item?.author ||
        item?.user

    return {
        id: getId(item),
        action:
            item?.description ||
            item?.action ||
            'Compliance activity',
        description:
            item?.description,
        by:
            performer?.fullName ||
            performer?.name ||
            performer?.email ||
            'User',
        timestamp:
            item?.createdAt ||
            item?.timestamp ||
            '',
        role: Array.isArray(
            performer?.role
        )
            ? performer.role.join(', ')
            : performer?.role,
    }
}

function StatusBadge({
    status,
}: {
    status: ComplianceStatus
}) {
    const styles: Record<
        ComplianceStatus,
        string
    > = {
        Pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        'In Progress':
            'border-blue-500/20 bg-blue-500/10 text-blue-400',
        Completed:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Overdue:
            'border-red-500/20 bg-red-500/10 text-red-400',
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status]}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
        </span>
    )
}

function PriorityBadge({
    priority,
}: {
    priority: CompliancePriority
}) {
    const styles: Record<
        CompliancePriority,
        string
    > = {
        High:
            'border-red-500/15 bg-red-500/10 text-red-400',
        Medium:
            'border-amber-500/15 bg-amber-500/10 text-amber-400',
        Low:
            'border-zinc-500/15 bg-zinc-500/10 text-zinc-400',
    }

    return (
        <span
            className={`rounded-md border px-2 py-1 text-[10px] font-medium ${styles[priority]}`}
        >
            {priority}
        </span>
    )
}

function CategoryBadge({
    category,
}: {
    category: ComplianceCategory
}) {
    return (
        <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[10px] text-zinc-500">
            {category}
        </span>
    )
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: React.ComponentType<{
        className?: string
    }>
    label: string
    value: number
    description: string
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
        >
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.035]">
                <Icon className="h-4 w-4 text-blue-400" />
            </div>

            <p className="text-2xl font-semibold text-white">
                {value}
            </p>

            <p className="mt-1 text-sm font-medium text-zinc-300">
                {label}
            </p>

            <p className="mt-1 text-[11px] text-zinc-600">
                {description}
            </p>
        </motion.div>
    )
}

function LoadingState() {
    return (
        <div className="grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="h-8 w-44 animate-pulse rounded bg-white/[0.05]" />
                <div className="mt-5 space-y-2">
                    {Array.from({
                        length: 6,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="h-20 animate-pulse rounded-xl bg-white/[0.04]"
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-5">
                <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
                <div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />
            </div>
        </div>
    )
}

export default function LawyerCompliancePage() {
    const [items, setItems] = useState<
        ComplianceItem[]
    >([])

    const [selectedItem, setSelectedItem] =
        useState<ComplianceItem | null>(
            null
        )

    const [search, setSearch] = useState('')

    const [statusFilter, setStatusFilter] =
        useState<'All' | ComplianceStatus>(
            'All'
        )

    const [categoryFilter, setCategoryFilter] =
        useState<
            'All' | ComplianceCategory
        >('All')

    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] =
        useState(false)

    const [refreshing, setRefreshing] =
        useState(false)

    const [changingStatus, setChangingStatus] =
        useState(false)

    const [error, setError] = useState<string | null>(
        null
    )

    const [
        mobileDetailOpen,
        setMobileDetailOpen,
    ] = useState(false)

    const [
        downloadingDocumentId,
        setDownloadingDocumentId,
    ] = useState('')

    const fetchCompliance =
        useCallback(async () => {
            try {
                setLoading(true)
                setError(null)

                const response =
                    await apiRequest<any>(
                        '/lawyer/compliance?page=1&limit=100'
                    )

                const mapped = extractArray<any>(
                    response
                ).map(mapSummary)

                setItems(mapped)

                setSelectedItem((current) => {
                    if (!current) {
                        return mapped[0] || null
                    }

                    return (
                        mapped.find(
                            (item) =>
                                item.id ===
                                current.id
                        ) || current
                    )
                })
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load compliance items'

                setError(message)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }, [])

    const fetchDetail =
        useCallback(
            async (complianceId: string) => {
                if (!complianceId) return

                try {
                    setDetailLoading(true)

                    const response =
                        await apiRequest<any>(
                            `/lawyer/compliance/${encodeURIComponent(
                                complianceId
                            )}`
                        )

                    const detail =
                        extractObject(response)

                    setSelectedItem(
                        (current) =>
                            mapDetail(
                                detail,
                                current ||
                                items.find(
                                    (item) =>
                                        item.id ===
                                        complianceId
                                )
                            )
                    )
                } catch (err) {
                    console.error(
                        'Compliance detail error:',
                        err
                    )
                } finally {
                    setDetailLoading(false)
                }
            },
            [items]
        )

    const fetchDocuments =
        useCallback(
            async (complianceId: string) => {
                try {
                    const response =
                        await apiRequest<any>(
                            `/lawyer/compliance/${encodeURIComponent(
                                complianceId
                            )}/documents`
                        )

                    const documents =
                        extractArray<any>(
                            response
                        ).map(mapDocument)

                    setSelectedItem(
                        (current) =>
                            current
                                ? {
                                    ...current,
                                    documents,
                                }
                                : current
                    )
                } catch (err) {
                    console.error(
                        'Compliance documents error:',
                        err
                    )
                }
            },
            []
        )

    const fetchActivity =
        useCallback(
            async (complianceId: string) => {
                try {
                    const response =
                        await apiRequest<any>(
                            `/lawyer/compliance/${encodeURIComponent(
                                complianceId
                            )}/activity`
                        )

                    const activities =
                        extractArray<any>(
                            response
                        ).map(mapActivity)

                    setSelectedItem(
                        (current) =>
                            current
                                ? {
                                    ...current,
                                    activities,
                                }
                                : current
                    )
                } catch (err) {
                    console.error(
                        'Compliance activity error:',
                        err
                    )
                }
            },
            []
        )

    useEffect(() => {
        fetchCompliance()
    }, [fetchCompliance])

    useEffect(() => {
        if (!selectedItem?.id) return

        fetchDetail(selectedItem.id)
        fetchDocuments(selectedItem.id)
        fetchActivity(selectedItem.id)
    }, [
        selectedItem?.id,
        fetchDetail,
        fetchDocuments,
        fetchActivity,
    ])

    const filteredItems = useMemo(() => {
        const term =
            search.trim().toLowerCase()

        return items.filter((item) => {
            const matchesSearch =
                !term ||
                item.name
                    .toLowerCase()
                    .includes(term) ||
                item.clientName
                    .toLowerCase()
                    .includes(term) ||
                item.category
                    .toLowerCase()
                    .includes(term) ||
                item.organization
                    ?.toLowerCase()
                    .includes(term)

            const matchesStatus =
                statusFilter === 'All' ||
                item.status === statusFilter

            const matchesCategory =
                categoryFilter === 'All' ||
                item.category === categoryFilter

            return (
                matchesSearch &&
                matchesStatus &&
                matchesCategory
            )
        })
    }, [
        items,
        search,
        statusFilter,
        categoryFilter,
    ])

    const summary = useMemo(
        () => ({
            total: items.length,

            pending: items.filter(
                (item) =>
                    item.status === 'Pending'
            ).length,

            inProgress: items.filter(
                (item) =>
                    item.status === 'In Progress'
            ).length,

            overdue: items.filter(
                (item) =>
                    item.status === 'Overdue'
            ).length,

            completed: items.filter(
                (item) =>
                    item.status === 'Completed'
            ).length,
        }),
        [items]
    )

    const selectItem = (
        item: ComplianceItem
    ) => {
        setSelectedItem(item)
        setMobileDetailOpen(true)
    }

    const updateStatus =
        async (status: ComplianceStatus) => {
            if (!selectedItem?.id) return

            try {
                setChangingStatus(true)
                setError(null)

                const response =
                    await apiRequest<any>(
                        `/lawyer/compliance/${encodeURIComponent(
                            selectedItem.id
                        )}/status`,
                        {
                            method: 'PATCH',
                            body: JSON.stringify({
                                status:
                                    apiStatusFromUi(
                                        status
                                    ),
                            }),
                        }
                    )

                const updated =
                    extractObject(response)

                const mapped =
                    mapDetail(updated, {
                        ...selectedItem,
                        status,
                        completedAt:
                            status ===
                                'Completed'
                                ? new Date().toISOString()
                                : null,
                    })

                setSelectedItem(mapped)

                setItems((current) =>
                    current.map((item) =>
                        item.id ===
                            selectedItem.id
                            ? {
                                ...item,
                                status,
                                completedAt:
                                    status ===
                                        'Completed'
                                        ? new Date().toISOString()
                                        : null,
                            }
                            : item
                    )
                )

                await Promise.all([
                    fetchDetail(
                        selectedItem.id
                    ),
                    fetchActivity(
                        selectedItem.id
                    ),
                ])
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to update compliance status'

                setError(message)
            } finally {
                setChangingStatus(false)
            }
        }

    const openClient = () => {
        if (!selectedItem?.clientId) {
            return
        }

        window.location.href = `/lawyer/clients?clientId=${encodeURIComponent(
            selectedItem.clientId
        )}`
    }

    const downloadDocument =
        async (
            document: ComplianceDocument
        ) => {
            if (!document.id) return

            try {
                setDownloadingDocumentId(
                    document.id
                )

                const response =
                    await apiRequest<any>(
                        `/lawyer/documents/${encodeURIComponent(
                            document.id
                        )}/download`
                    )

                const result =
                    extractObject(response)

                const url =
                    result?.url ||
                    result?.downloadUrl ||
                    result?.signedUrl

                if (url) {
                    window.open(
                        url,
                        '_blank',
                        'noopener,noreferrer'
                    )
                }
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to download document'

                setError(message)
            } finally {
                setDownloadingDocumentId(
                    ''
                )
            }
        }

    if (error === 'NO_TOKEN') {
        return (
            <div className="min-h-screen bg-[#06080b] px-6 py-12 text-white">
                <div className="mx-auto mt-24 max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-center">
                    <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" />

                    <h2 className="mt-4 text-lg font-semibold">
                        Authentication Required
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                        Please sign in again to access compliance.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                        (window.location.href =
                            '/signin')
                        }
                        className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[28%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
                <div className="absolute right-0 top-[30%] h-[360px] w-[360px] rounded-full bg-amber-500/[0.018] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                <motion.div
                    initial={{
                        opacity: 0,
                        y: -8,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="border-b border-white/[0.06] pb-6"
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                                <span>
                                    Lawyer Dashboard
                                </span>

                                <ChevronRight className="h-3 w-3" />

                                <span className="text-zinc-300">
                                    Compliance
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-7 w-7 text-blue-400" />

                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Compliance
                                </h1>
                            </div>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Track regulatory and statutory obligations across your assigned clients and stay ahead of important deadlines.
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={
                                loading ||
                                refreshing
                            }
                            onClick={async () => {
                                setRefreshing(true)
                                await fetchCompliance()
                            }}
                            className="flex items-center gap-2 self-start rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.05] disabled:opacity-50 lg:self-auto"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing
                                    ? 'animate-spin'
                                    : ''
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </motion.div>

                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <SummaryCard
                        icon={ShieldCheck}
                        label="Total"
                        value={summary.total}
                        description="Assigned compliance items"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Pending"
                        value={summary.pending}
                        description="Waiting for action"
                    />

                    <SummaryCard
                        icon={FileCheck2}
                        label="In Progress"
                        value={
                            summary.inProgress
                        }
                        description="Currently being handled"
                    />

                    <SummaryCard
                        icon={AlertCircle}
                        label="Overdue"
                        value={summary.overdue}
                        description="Require immediate attention"
                    />

                    <SummaryCard
                        icon={CheckCircle2}
                        label="Completed"
                        value={
                            summary.completed
                        }
                        description="Successfully closed"
                    />
                </section>

                {loading ? (
                    <section className="mt-6">
                        <LoadingState />
                    </section>
                ) : (
                    <section className="mt-6 grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)]">
                        <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                            <div className="border-b border-white/[0.06] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">
                                            Assigned Compliance
                                        </h2>

                                        <p className="mt-1 text-[11px] text-zinc-600">
                                            {
                                                filteredItems.length
                                            }{' '}
                                            item
                                            {filteredItems.length !==
                                                1
                                                ? 's'
                                                : ''}
                                        </p>
                                    </div>

                                    <ShieldAlert className="h-4 w-4 text-zinc-600" />
                                </div>

                                <div className="relative mt-4">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Search compliance or clients..."
                                        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                    />
                                </div>

                                <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                                    {[
                                        'All',
                                        ...STATUS_OPTIONS,
                                    ].map(
                                        (status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() =>
                                                    setStatusFilter(
                                                        status as
                                                        | 'All'
                                                        | ComplianceStatus
                                                    )
                                                }
                                                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] transition ${statusFilter ===
                                                    status
                                                    ? 'border border-blue-400/20 bg-blue-400/10 text-blue-400'
                                                    : 'border border-white/[0.05] bg-white/[0.02] text-zinc-600 hover:text-zinc-300'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        )
                                    )}
                                </div>

                                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCategoryFilter(
                                                'All'
                                            )
                                        }
                                        className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] transition ${categoryFilter ===
                                            'All'
                                            ? 'border border-white/[0.1] bg-white/[0.07] text-white'
                                            : 'border border-transparent text-zinc-600 hover:text-zinc-300'
                                            }`}
                                    >
                                        All
                                    </button>

                                    {CATEGORY_OPTIONS.map(
                                        (
                                            category
                                        ) => (
                                            <button
                                                key={
                                                    category
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setCategoryFilter(
                                                        category
                                                    )
                                                }
                                                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] transition ${categoryFilter ===
                                                    category
                                                    ? 'border border-white/[0.1] bg-white/[0.07] text-white'
                                                    : 'border border-transparent text-zinc-600 hover:text-zinc-300'
                                                    }`}
                                            >
                                                {category}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="max-h-[740px] overflow-y-auto p-2">
                                {filteredItems.length ===
                                    0 ? (
                                    <div className="py-16 text-center">
                                        <ShieldCheck className="mx-auto h-8 w-8 text-zinc-700" />

                                        <p className="mt-3 text-sm text-zinc-400">
                                            No compliance items found
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-700">
                                            Try changing your search or filters.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredItems.map(
                                            (
                                                item,
                                                index
                                            ) => {
                                                const selected =
                                                    selectedItem?.id ===
                                                    item.id

                                                return (
                                                    <motion.button
                                                        key={
                                                            item.id
                                                        }
                                                        type="button"
                                                        initial={{
                                                            opacity: 0,
                                                            x: -5,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            x: 0,
                                                        }}
                                                        transition={{
                                                            delay:
                                                                index *
                                                                0.035,
                                                        }}
                                                        onClick={() =>
                                                            selectItem(
                                                                item
                                                            )
                                                        }
                                                        className={`w-full rounded-xl p-3 text-left transition ${selected
                                                            ? 'border border-blue-400/15 bg-blue-400/[0.07]'
                                                            : 'border border-transparent hover:border-white/[0.05] hover:bg-white/[0.025]'
                                                            }`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div
                                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${item.status ===
                                                                    'Overdue'
                                                                    ? 'border-red-500/15 bg-red-500/[0.06]'
                                                                    : 'border-white/[0.06] bg-white/[0.025]'
                                                                    }`}
                                                            >
                                                                {item.status ===
                                                                    'Overdue' ? (
                                                                    <ShieldAlert className="h-5 w-5 text-red-400" />
                                                                ) : (
                                                                    <ShieldCheck className="h-5 w-5 text-blue-400" />
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="truncate text-sm font-medium text-white">
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </p>

                                                                    {selected && (
                                                                        <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
                                                                    )}
                                                                </div>

                                                                <p className="mt-1 truncate text-[11px] text-zinc-500">
                                                                    {
                                                                        item.clientName
                                                                    }
                                                                </p>

                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                    <StatusBadge
                                                                        status={
                                                                            item.status
                                                                        }
                                                                    />

                                                                    <PriorityBadge
                                                                        priority={
                                                                            item.priority
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-600">
                                                                    <CategoryBadge
                                                                        category={
                                                                            item.category
                                                                        }
                                                                    />

                                                                    <span>
                                                                        Due{' '}
                                                                        {formatDate(
                                                                            item.dueDate
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                )
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="hidden min-w-0 lg:block">
                            <ComplianceDetails
                                item={selectedItem}
                                detailLoading={
                                    detailLoading
                                }
                                changingStatus={
                                    changingStatus
                                }
                                downloadingDocumentId={
                                    downloadingDocumentId
                                }
                                onStatusChange={
                                    updateStatus
                                }
                                onViewClient={
                                    openClient
                                }
                                onDownloadDocument={
                                    downloadDocument
                                }
                            />
                        </div>
                    </section>
                )}

                {error &&
                    error !== 'NO_TOKEN' && (
                        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={() =>
                                    setError(null)
                                }
                                className="shrink-0 text-xs text-red-300/70 hover:text-red-200"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
            </main>

            <AnimatePresence>
                {mobileDetailOpen &&
                    selectedItem && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 20,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                y: 20,
                            }}
                            className="fixed inset-0 z-50 overflow-y-auto bg-[#06080b] lg:hidden"
                        >
                            <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/[0.06] bg-[#06080b]/95 px-4 py-3 backdrop-blur-xl">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setMobileDetailOpen(
                                            false
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]"
                                >
                                    <ArrowLeft className="h-4 w-4 text-zinc-400" />
                                </button>

                                <span className="text-sm font-medium text-white">
                                    Compliance Details
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMobileDetailOpen(
                                            false
                                        )
                                    }
                                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]"
                                >
                                    <X className="h-4 w-4 text-zinc-400" />
                                </button>
                            </div>

                            <div className="p-4">
                                <ComplianceDetails
                                    item={
                                        selectedItem
                                    }
                                    detailLoading={
                                        detailLoading
                                    }
                                    changingStatus={
                                        changingStatus
                                    }
                                    downloadingDocumentId={
                                        downloadingDocumentId
                                    }
                                    onStatusChange={
                                        updateStatus
                                    }
                                    onViewClient={
                                        openClient
                                    }
                                    onDownloadDocument={
                                        downloadDocument
                                    }
                                />
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    )
}

function ComplianceDetails({
    item,
    detailLoading,
    changingStatus,
    downloadingDocumentId,
    onStatusChange,
    onViewClient,
    onDownloadDocument,
}: {
    item: ComplianceItem | null
    detailLoading: boolean
    changingStatus: boolean
    downloadingDocumentId: string
    onStatusChange: (
        status: ComplianceStatus
    ) => void
    onViewClient: () => void
    onDownloadDocument: (
        document: ComplianceDocument
    ) => void
}) {
    if (!item) {
        return (
            <div className="flex min-h-[650px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <div className="text-center">
                    <ShieldCheck className="mx-auto h-10 w-10 text-zinc-700" />

                    <p className="mt-4 text-sm text-zinc-400">
                        Select a compliance item
                    </p>

                    <p className="mt-1 text-xs text-zinc-700">
                        Select an item from the list to view its details.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            key={item.id}
            initial={{
                opacity: 0,
                y: 8,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            className="space-y-5"
        >
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${item.status ===
                                'Overdue'
                                ? 'border-red-500/15 bg-red-500/[0.06]'
                                : 'border-blue-400/10 bg-blue-400/[0.06]'
                                }`}
                        >
                            {item.status ===
                                'Overdue' ? (
                                <ShieldAlert className="h-6 w-6 text-red-400" />
                            ) : (
                                <ShieldCheck className="h-6 w-6 text-blue-400" />
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight text-white">
                                    {item.name}
                                </h2>

                                <StatusBadge
                                    status={
                                        item.status
                                    }
                                />
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                                {item.category} Compliance
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-zinc-600" />
                                    {
                                        item.clientName
                                    }
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-zinc-600" />
                                    Due{' '}
                                    {formatDate(
                                        item.dueDate
                                    )}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="h-3.5 w-3.5 text-zinc-600" />
                                    Assigned{' '}
                                    {formatDate(
                                        item.assignedDate
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <PriorityBadge
                            priority={
                                item.priority
                            }
                        />

                        <select
                            value={
                                item.status
                            }
                            disabled={
                                changingStatus
                            }
                            onChange={(event) =>
                                onStatusChange(
                                    event.target
                                        .value as ComplianceStatus
                                )
                            }
                            className="h-9 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 text-[11px] text-zinc-300 outline-none focus:border-blue-400/30"
                        >
                            {STATUS_OPTIONS.map(
                                (status) => (
                                    <option
                                        key={
                                            status
                                        }
                                        value={
                                            status
                                        }
                                        className="bg-[#111318]"
                                    >
                                        {status}
                                    </option>
                                )
                            )}
                        </select>

                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-500 hover:text-white"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {detailLoading && (
                    <div className="mt-5 flex items-center gap-2 text-[11px] text-zinc-600">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Refreshing live compliance details...
                    </div>
                )}

                <div className="mt-6 border-t border-white/[0.06] pt-5">
                    <p className="text-xs leading-6 text-zinc-500">
                        {item.description ||
                            'No description has been provided for this compliance item.'}
                    </p>
                </div>

                {item.organization && (
                    <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                            Organization / Authority
                        </p>
                        <p className="mt-1 text-xs text-zinc-300">
                            {item.organization}
                        </p>
                    </div>
                )}

                <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                        <UserRound className="h-4 w-4 text-blue-400" />
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                            Assigned Lawyer
                        </p>

                        <p className="text-xs font-medium text-white">
                            {
                                item
                                    .assignedLawyer
                                    .name
                            }
                        </p>
                    </div>

                    <div className="ml-auto hidden items-center gap-2 text-[11px] text-zinc-600 sm:flex">
                        <Mail className="h-3.5 w-3.5" />
                        {
                            item
                                .assignedLawyer
                                .email
                        }
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                    type="button"
                    onClick={() =>
                        onStatusChange(
                            'In Progress'
                        )
                    }
                    disabled={
                        changingStatus ||
                        item.status ===
                        'In Progress'
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-3 text-xs font-medium text-blue-400 transition hover:bg-blue-400/15 disabled:opacity-40"
                >
                    <Eye className="h-4 w-4" />
                    Start Review
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onStatusChange(
                            'Completed'
                        )
                    }
                    disabled={
                        changingStatus ||
                        item.status ===
                        'Completed'
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-40"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                </button>

                <button
                    type="button"
                    onClick={() =>
                        document
                            .getElementById(
                                'compliance-documents'
                            )
                            ?.scrollIntoView({
                                behavior: 'smooth',
                            })
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                    <FileText className="h-4 w-4" />
                    Documents
                </button>

                <button
                    type="button"
                    onClick={() =>
                        document
                            .getElementById(
                                'compliance-activity'
                            )
                            ?.scrollIntoView({
                                behavior: 'smooth',
                            })
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                    <History className="h-4 w-4" />
                    Activity
                </button>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                            <Building2 className="h-4 w-4 text-zinc-400" />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Client
                            </h3>

                            <p className="text-xs text-zinc-600">
                                Business associated with this compliance
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-blue-500/[0.06]">
                            <Building2 className="h-4 w-4 text-blue-400" />
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white">
                                {
                                    item.clientName
                                }
                            </p>

                            <p className="mt-1 truncate text-[10px] text-zinc-600">
                                Client ID:{' '}
                                {
                                    item.clientId
                                }
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onViewClient
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-xs text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                    >
                        View Client
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div
                    className={`rounded-2xl border p-5 ${item.status ===
                        'Overdue'
                        ? 'border-red-500/15 bg-red-500/[0.025]'
                        : 'border-white/[0.08] bg-white/[0.025]'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.status ===
                                'Overdue'
                                ? 'bg-red-500/10'
                                : 'bg-white/[0.04]'
                                }`}
                        >
                            {item.status ===
                                'Overdue' ? (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                            ) : (
                                <CalendarDays className="h-4 w-4 text-zinc-400" />
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Deadline
                            </h3>

                            <p className="text-xs text-zinc-600">
                                Compliance due date
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <p
                            className={`text-2xl font-semibold ${item.status ===
                                'Overdue'
                                ? 'text-red-400'
                                : 'text-white'
                                }`}
                        >
                            {formatDate(
                                item.dueDate
                            )}
                        </p>

                        <p className="mt-2 text-xs text-zinc-600">
                            {item.status ===
                                'Overdue'
                                ? 'This compliance item requires immediate attention.'
                                : 'Make sure all required documentation is completed before the deadline.'}
                        </p>
                    </div>

                    {item.recurring && (
                        <p className="mt-4 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px] text-zinc-500">
                            Recurring:{' '}
                            {item.recurrence ||
                                'custom'}
                        </p>
                    )}
                </div>
            </div>

            <div
                id="compliance-documents"
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025]"
            >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Related Documents
                        </h3>

                        <p className="mt-1 text-xs text-zinc-600">
                            Documents returned by the compliance documents API
                        </p>
                    </div>

                    <span className="text-[10px] text-zinc-700">
                        {
                            item.documents
                                .length
                        }{' '}
                        file
                        {item.documents
                            .length !==
                            1
                            ? 's'
                            : ''}
                    </span>
                </div>

                {item.documents
                    .length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <FileText className="mx-auto h-7 w-7 text-zinc-700" />

                        <p className="mt-3 text-sm text-zinc-400">
                            No documents attached
                        </p>

                        <p className="mt-1 text-xs text-zinc-700">
                            Documents associated with this compliance item will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.05]">
                        {item.documents.map(
                            (document) => (
                                <div
                                    key={
                                        document.id ||
                                        document.key
                                    }
                                    className="flex items-center gap-3 px-5 py-4"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
                                        <FileText className="h-4 w-4 text-zinc-400" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-white">
                                            {
                                                document.name
                                            }
                                        </p>

                                        <p className="mt-1 text-[10px] text-zinc-600">
                                            {
                                                document.type
                                            }{' '}
                                            •{' '}
                                            {
                                                document.size
                                            }
                                            {document.category
                                                ? ` • ${document.category}`
                                                : ''}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={
                                            !document.id ||
                                            downloadingDocumentId ===
                                            document.id
                                        }
                                        onClick={() =>
                                            onDownloadDocument(
                                                document
                                            )
                                        }
                                        className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
                                    >
                                        {downloadingDocumentId ===
                                            document.id ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            <div
                id="compliance-activity"
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025]"
            >
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                        <History className="h-4 w-4 text-zinc-400" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Compliance Activity
                        </h3>

                        <p className="text-xs text-zinc-600">
                            Live AuditLog activity for this compliance item
                        </p>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    {item.activities
                        .length ? (
                        item.activities.map(
                            (
                                activity,
                                index
                            ) => (
                                <div
                                    key={
                                        activity.id ||
                                        `${activity.action}-${index}`
                                    }
                                    className="relative flex gap-3"
                                >
                                    {index <
                                        item
                                            .activities
                                            .length -
                                        1 && (
                                            <div className="absolute left-[7px] top-5 h-full w-px bg-white/[0.06]" />
                                        )}

                                    <div className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-400/10">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-white">
                                            {
                                                activity.action
                                            }
                                        </p>

                                        <p className="mt-1 text-[10px] text-zinc-600">
                                            {
                                                activity.by
                                            }
                                            {' • '}
                                            {formatDate(
                                                activity.timestamp,
                                                true
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )
                        )
                    ) : (
                        <div className="py-10 text-center">
                            <History className="mx-auto h-7 w-7 text-zinc-700" />
                            <p className="mt-3 text-sm text-zinc-400">
                                No activity recorded yet
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
