// app/admin-dashboard/documents/page.tsx
'use client'

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    RefreshCw,
    AlertCircle,
    FileText,
    File,
    X,
    ChevronLeft,
    ChevronRight,
    Lock,
    Shield,
    Building2,
    User,
    Layers,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    Ban,
} from 'lucide-react'

// ==================================================
// API
// ==================================================

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const DOCS_API = `${API_BASE}/admin/documents`

// ==================================================
// TYPES
// ==================================================

type DocumentCategory =
    | 'incorporation'
    | 'tax'
    | 'compliance'
    | 'financial'
    | 'identity'
    | 'agreement'
    | 'contract'
    | 'other'

type DocumentStatus = 'pending' | 'uploaded' | 'failed' | 'deleted'

type DocumentVisibility = 'business' | 'lawyer' | 'private'

interface DocumentBusinessRef {
    _id: string
    companyName?: string
    legalName?: string
    companyType?: string
    industry?: string
    status?: string
}

interface DocumentUploaderRef {
    _id: string
    userId?: string
    fullName?: string
    email?: string
    phone?: string
    role?: string
    profilePhoto?: string
    avatar?: string
}

interface BusinessDocument {
    _id: string
    business?: string | DocumentBusinessRef | null
    uploadedBy?: string | DocumentUploaderRef | null
    name: string
    originalName?: string
    mimeType?: string
    size?: number
    category?: DocumentCategory
    status?: DocumentStatus
    visibility?: DocumentVisibility
    uploadedAt?: string
    createdAt?: string
    updatedAt?: string
}

interface RelatedContract {
    _id: string
    contractNumber?: string
    title?: string
    contractType?: string
    status?: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

interface DocumentStats {
    total: number
    uploaded: number
    pending: number
    private: number
    failed?: number
    deleted?: number
    business?: number
    lawyer?: number
}

interface DocumentDetail {
    document: BusinessDocument
    business: DocumentBusinessRef | null
    uploadedBy: DocumentUploaderRef | null
    relatedContracts: RelatedContract[]
}

interface ListDocumentsParams {
    page?: number
    limit?: number
    search?: string
    businessId?: string
    category?: DocumentCategory | ''
    status?: DocumentStatus | ''
    visibility?: DocumentVisibility | ''
}

// ==================================================
// AUTH
// ==================================================

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return (
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken')
    )
}

// ==================================================
// API CLIENT
// ==================================================

class AdminApiError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.name = 'AdminApiError'
        this.status = status
    }
}

async function apiRequest<T>(
    url: string,
    init?: RequestInit
): Promise<T> {
    const token = getAuthToken()
    if (!token) {
        throw new AdminApiError(
            'Authentication required. Please sign in again.',
            401
        )
    }

    let res: Response
    try {
        res = await fetch(url, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(init?.headers || {}),
            },
        })
    } catch {
        throw new AdminApiError(
            'Network error. Please check your connection and try again.',
            0
        )
    }

    let body: {
        success?: boolean
        message?: string
        data?: unknown
        pagination?: Pagination
    } | null = null
    try {
        body = await res.json()
    } catch {
        body = null
    }

    if (!res.ok) {
        const fallback =
            res.status === 401
                ? 'Your session has expired. Please sign in again.'
                : res.status === 403
                    ? 'You do not have permission to perform this action.'
                    : res.status === 404
                        ? 'The requested resource was not found.'
                        : res.status >= 500
                            ? 'Server error. Please try again later.'
                            : 'Request failed.'
        throw new AdminApiError(body?.message || fallback, res.status)
    }

    return (body ?? {}) as T
}

async function fetchDocuments(
    params: ListDocumentsParams = {}
): Promise<{ documents: BusinessDocument[]; pagination: Pagination }> {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.limit) q.set('limit', String(params.limit))
    if (params.search && params.search.trim())
        q.set('search', params.search.trim())
    if (params.businessId) q.set('businessId', params.businessId)
    if (params.category) q.set('category', params.category)
    if (params.status) q.set('status', params.status)
    if (params.visibility) q.set('visibility', params.visibility)

    const suffix = q.toString() ? `?${q.toString()}` : ''
    const json = await apiRequest<{
        data?: BusinessDocument[]
        pagination?: Pagination
    }>(`${DOCS_API}${suffix}`)

    const documents = Array.isArray(json?.data) ? json.data : []
    const pagination: Pagination = json?.pagination ?? {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        total: documents.length,
        pages: 1,
    }

    return { documents, pagination }
}

async function fetchDocumentStats(): Promise<DocumentStats> {
    const json = await apiRequest<{
        data?: Partial<DocumentStats>
    }>(`${DOCS_API}/stats`)
    const d = json?.data ?? {}
    return {
        total: Number(d.total ?? 0),
        uploaded: Number(d.uploaded ?? 0),
        pending: Number(d.pending ?? 0),
        private: Number(d.private ?? 0),
        failed: Number(d.failed ?? 0),
        deleted: Number(d.deleted ?? 0),
        business: Number(d.business ?? 0),
        lawyer: Number(d.lawyer ?? 0),
    }
}

async function fetchDocumentDetail(
    documentId: string
): Promise<DocumentDetail> {
    if (!documentId) {
        throw new AdminApiError('Invalid document id.', 400)
    }

    const json = await apiRequest<{
        data?: {
            document?: BusinessDocument
            business?: DocumentBusinessRef | null
            uploadedBy?: DocumentUploaderRef | null
            relatedContracts?: RelatedContract[]
        } & Partial<BusinessDocument>
    }>(`${DOCS_API}/${encodeURIComponent(documentId)}`)

    const d = json?.data

    if (d && 'document' in d && d.document) {
        return {
            document: d.document,
            business: d.business ?? null,
            uploadedBy: d.uploadedBy ?? null,
            relatedContracts: Array.isArray(d.relatedContracts)
                ? d.relatedContracts
                : [],
        }
    }

    const doc = (d as BusinessDocument) ?? null
    if (!doc) {
        throw new AdminApiError('Malformed response from server.', 500)
    }

    return {
        document: doc,
        business:
            typeof doc.business === 'object' && doc.business
                ? doc.business
                : null,
        uploadedBy:
            typeof doc.uploadedBy === 'object' && doc.uploadedBy
                ? doc.uploadedBy
                : null,
        relatedContracts: [],
    }
}

// ==================================================
// CONSTANTS
// ==================================================

const CATEGORY_OPTIONS: { value: DocumentCategory | ''; label: string }[] =
    [
        { value: '', label: 'All Categories' },
        { value: 'incorporation', label: 'Incorporation' },
        { value: 'tax', label: 'Tax' },
        { value: 'compliance', label: 'Compliance' },
        { value: 'financial', label: 'Financial' },
        { value: 'identity', label: 'Identity' },
        { value: 'agreement', label: 'Agreement' },
        { value: 'contract', label: 'Contract' },
        { value: 'other', label: 'Other' },
    ]

const STATUS_OPTIONS: { value: DocumentStatus | ''; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'uploaded', label: 'Uploaded' },
    { value: 'failed', label: 'Failed' },
    { value: 'deleted', label: 'Deleted' },
]

const VISIBILITY_OPTIONS: {
    value: DocumentVisibility | ''
    label: string
}[] = [
        { value: '', label: 'All Visibility' },
        { value: 'business', label: 'Business' },
        { value: 'lawyer', label: 'Lawyer' },
        { value: 'private', label: 'Private' },
    ]

const PAGE_LIMIT = 10

// ==================================================
// HELPERS
// ==================================================

function formatDate(value?: string | null): string {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatValue(v?: string | number | null): string {
    if (v === undefined || v === null || v === '') return '—'
    return String(v)
}

function formatBytes(n?: number | null): string {
    if (n === undefined || n === null) return '—'
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    if (n < 1024 * 1024 * 1024)
        return `${(n / (1024 * 1024)).toFixed(1)} MB`
    return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function humanize(v?: string): string {
    if (!v) return '—'
    return v
        .split(/[-\s]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
}

function initials(name?: string): string {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/).slice(0, 2)
    return parts.map((p) => p.charAt(0).toUpperCase()).join('')
}

function getBusiness(
    b: BusinessDocument['business']
): DocumentBusinessRef | null {
    if (!b || typeof b === 'string') return null
    return b
}

function getUploader(
    u: BusinessDocument['uploadedBy']
): DocumentUploaderRef | null {
    if (!u || typeof u === 'string') return null
    return u
}

// ==================================================
// BADGES
// ==================================================

function StatusBadge({ status }: { status?: string }) {
    if (!status) return <span className="text-gray-600">—</span>
    const key = status.toLowerCase()
    const config: Record<
        string,
        { cls: string; icon: React.ComponentType<{ className?: string }> }
    > = {
        uploaded: {
            cls: 'bg-green-500/10 text-green-400 border-green-500/20',
            icon: CheckCircle2,
        },
        pending: {
            cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            icon: Clock,
        },
        failed: {
            cls: 'bg-red-500/10 text-red-400 border-red-500/20',
            icon: XCircle,
        },
        deleted: {
            cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
            icon: Ban,
        },
    }
    const c = config[key] || {
        cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: Clock,
    }
    const Icon = c.icon
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${c.cls}`}
        >
            <Icon className="h-3 w-3" />
            {humanize(status)}
        </span>
    )
}

function VisibilityBadge({ visibility }: { visibility?: string }) {
    if (!visibility) return <span className="text-gray-600">—</span>
    const key = visibility.toLowerCase()
    const cls: Record<string, string> = {
        private: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        business: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        lawyer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${cls[key] || 'bg-white/[0.04] text-gray-400 border-white/10'
                }`}
        >
            {key === 'private' ? (
                <Lock className="h-3 w-3" />
            ) : key === 'business' ? (
                <Building2 className="h-3 w-3" />
            ) : (
                <User className="h-3 w-3" />
            )}
            {humanize(visibility)}
        </span>
    )
}

function CategoryBadge({ category }: { category?: string }) {
    if (!category) return <span className="text-gray-600">—</span>
    return (
        <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-gray-400">
            {humanize(category)}
        </span>
    )
}

// ==================================================
// PRIMITIVES
// ==================================================

function Skeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-white/[0.04]"
                />
            ))}
        </div>
    )
}

function StatSkeleton() {
    return (
        <div className="h-[86px] animate-pulse rounded-2xl bg-white/[0.04]" />
    )
}

function EmptyState({
    title,
    description,
    icon: Icon,
}: {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon className="mb-4 h-10 w-10 text-gray-700" />
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
            <p className="mt-1 max-w-sm text-xs text-gray-600">
                {description}
            </p>
        </div>
    )
}

function ErrorState({
    message,
    onRetry,
}: {
    message: string
    onRetry: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center py-14 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-red-400/70" />
            <h3 className="text-sm font-medium text-gray-300">
                Unable to load documents.
            </h3>
            <p className="mt-1 max-w-sm text-xs text-gray-600">
                {message || 'Please try again.'}
            </p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-400/20"
            >
                Retry
            </button>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
}: {
    label: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    tone?: 'default' | 'uploaded' | 'pending' | 'private'
}) {
    const tones: Record<string, string> = {
        default: 'text-amber-400',
        uploaded: 'text-green-400',
        pending: 'text-amber-400',
        private: 'text-indigo-400',
    }
    return (
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 to-black/20 p-5 backdrop-blur-sm">
            <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-1.5 text-3xl font-light text-white">
                    {value}
                </p>
            </div>
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] ${tones[tone]}`}
            >
                <Icon className="h-5 w-5" />
            </div>
        </div>
    )
}

function DetailRow({
    label,
    value,
    icon: Icon,
}: {
    label: string
    value: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] py-2.5 last:border-b-0">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-3.5 w-3.5 text-gray-600" />}
                <span className="text-xs text-gray-500">{label}</span>
            </div>
            <span className="text-right text-xs font-medium text-gray-200">
                {value}
            </span>
        </div>
    )
}

function Section({
    title,
    icon: Icon,
    children,
}: {
    title: string
    icon?: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}) {
    return (
        <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-amber-400" />}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {title}
                </h3>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-2">
                {children}
            </div>
        </div>
    )
}

const selectCls =
    'rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none transition focus:border-amber-400/40'

// ==================================================
// PAGE
// ==================================================

export default function AdminDocumentsPage() {
    // ----- stats -----
    const [stats, setStats] = useState<DocumentStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState<string | null>(null)

    // ----- list -----
    const [documents, setDocuments] = useState<BusinessDocument[]>([])
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: PAGE_LIMIT,
        total: 0,
        pages: 1,
    })
    const [listLoading, setListLoading] = useState(true)
    const [listRefreshing, setListRefreshing] = useState(false)
    const [listError, setListError] = useState<string | null>(null)

    // ----- filters -----
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState<DocumentCategory | ''>('')
    const [status, setStatus] = useState<DocumentStatus | ''>('')
    const [visibility, setVisibility] = useState<DocumentVisibility | ''>('')
    const [page, setPage] = useState(1)

    // ----- metadata drawer -----
    const [openDocId, setOpenDocId] = useState<string | null>(null)
    const [detail, setDetail] = useState<DocumentDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)

    const listAbortRef = useRef<AbortController | null>(null)
    const detailAbortRef = useRef<AbortController | null>(null)

    // ==================================================
    // DEBOUNCE SEARCH
    // ==================================================

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 400)
        return () => window.clearTimeout(t)
    }, [searchInput])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [category, status, visibility])

    // ==================================================
    // FETCH STATS
    // ==================================================

    const loadStats = useCallback(async () => {
        setStatsLoading(true)
        setStatsError(null)
        try {
            const data = await fetchDocumentStats()
            setStats(data)
        } catch (err) {
            const message =
                err instanceof AdminApiError
                    ? err.message
                    : 'Unable to load document statistics.'
            setStatsError(message)
        } finally {
            setStatsLoading(false)
        }
    }, [])

    // ==================================================
    // FETCH LIST
    // ==================================================

    const loadDocuments = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) setListRefreshing(true)
            else setListLoading(true)
            setListError(null)

            if (listAbortRef.current) listAbortRef.current.abort()
            const ctrl = new AbortController()
            listAbortRef.current = ctrl

            try {
                const res = await fetchDocuments({
                    page,
                    limit: pagination.limit,
                    search,
                    category,
                    status,
                    visibility,
                })
                if (ctrl.signal.aborted) return
                setDocuments(res.documents)
                setPagination(res.pagination)
            } catch (err) {
                if ((err as Error)?.name === 'AbortError') return
                const message =
                    err instanceof AdminApiError
                        ? err.message
                        : 'Unable to load documents.'
                setListError(message)
            } finally {
                setListLoading(false)
                setListRefreshing(false)
            }
        },
        [page, pagination.limit, search, category, status, visibility]
    )

    useEffect(() => {
        loadStats()
    }, [loadStats])

    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    // ==================================================
    // FETCH DETAIL
    // ==================================================

    const loadDetail = useCallback(async (id: string) => {
        setDetailLoading(true)
        setDetailError(null)
        setDetail(null)

        if (detailAbortRef.current) detailAbortRef.current.abort()
        const ctrl = new AbortController()
        detailAbortRef.current = ctrl

        try {
            const data = await fetchDocumentDetail(id)
            if (ctrl.signal.aborted) return
            setDetail(data)
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') return
            const message =
                err instanceof AdminApiError
                    ? err.message
                    : 'Unable to load document metadata.'
            setDetailError(message)
        } finally {
            setDetailLoading(false)
        }
    }, [])

    const openMetadata = (id: string) => {
        setOpenDocId(id)
        loadDetail(id)
    }

    const closeMetadata = () => {
        setOpenDocId(null)
        setDetail(null)
        setDetailError(null)
    }

    // ==================================================
    // REFRESH
    // ==================================================

    const handleRefresh = () => {
        loadStats()
        loadDocuments(true)
        if (openDocId) loadDetail(openDocId)
    }

    // ==================================================
    // DERIVED
    // ==================================================

    const rangeLabel = useMemo(() => {
        if (pagination.total === 0) return 'Showing 0 of 0 documents'
        const start = (pagination.page - 1) * pagination.limit + 1
        const end = Math.min(
            pagination.page * pagination.limit,
            pagination.total
        )
        return `Showing ${start}–${end} of ${pagination.total} documents`
    }, [pagination])

    const pageButtons = useMemo(() => {
        const total = pagination.pages
        const current = pagination.page
        const arr: (number | '…')[] = []
        if (total <= 7) {
            for (let i = 1; i <= total; i++) arr.push(i)
            return arr
        }
        arr.push(1)
        if (current > 4) arr.push('…')
        const start = Math.max(2, current - 1)
        const end = Math.min(total - 1, current + 1)
        for (let i = start; i <= end; i++) arr.push(i)
        if (current < total - 3) arr.push('…')
        arr.push(total)
        return arr
    }, [pagination.page, pagination.pages])

    const canPrev = pagination.page > 1
    const canNext = pagination.page < pagination.pages

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="min-h-full text-white">
            {/* Header */}
            <div className="border-b border-white/[0.05] bg-black/40 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-light tracking-tight text-white lg:text-5xl">
                                Documents
                            </h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Manage and review document metadata across
                                all business workspaces.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={listRefreshing || listLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${listRefreshing ? 'animate-spin' : ''
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                {/* Stat cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statsLoading && !stats ? (
                        <>
                            <StatSkeleton />
                            <StatSkeleton />
                            <StatSkeleton />
                            <StatSkeleton />
                        </>
                    ) : (
                        <>
                            <StatCard
                                label="Total Documents"
                                value={stats?.total ?? 0}
                                icon={Layers}
                                tone="default"
                            />
                            <StatCard
                                label="Uploaded"
                                value={stats?.uploaded ?? 0}
                                icon={CheckCircle2}
                                tone="uploaded"
                            />
                            <StatCard
                                label="Pending"
                                value={stats?.pending ?? 0}
                                icon={Clock}
                                tone="pending"
                            />
                            <StatCard
                                label="Private"
                                value={stats?.private ?? 0}
                                icon={Lock}
                                tone="private"
                            />
                        </>
                    )}
                </div>

                {statsError && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                            {statsError}
                        </span>
                        <button
                            type="button"
                            onClick={loadStats}
                            className="text-xs font-medium underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) =>
                                setSearchInput(e.target.value)
                            }
                            placeholder="Search documents, businesses..."
                            className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-amber-400/40"
                        />
                    </div>

                    <select
                        value={category}
                        onChange={(e) =>
                            setCategory(
                                e.target.value as DocumentCategory | ''
                            )
                        }
                        className={selectCls}
                    >
                        {CATEGORY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(
                                e.target.value as DocumentStatus | ''
                            )
                        }
                        className={selectCls}
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={visibility}
                        onChange={(e) =>
                            setVisibility(
                                e.target.value as
                                | DocumentVisibility
                                | ''
                            )
                        }
                        className={selectCls}
                    >
                        {VISIBILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm">
                    {listLoading ? (
                        <div className="p-6">
                            <Skeleton rows={6} />
                        </div>
                    ) : listError ? (
                        <div className="p-6">
                            <ErrorState
                                message={listError}
                                onRetry={() => loadDocuments()}
                            />
                        </div>
                    ) : documents.length === 0 ? (
                        <EmptyState
                            title="No documents found."
                            description="Try adjusting your search or filters."
                            icon={FileText}
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-gray-500">
                                            <th className="px-4 py-3 font-medium">
                                                Document
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Business
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Category
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Uploaded By
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Visibility
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((doc) => {
                                            const biz = getBusiness(
                                                doc.business
                                            )
                                            const uploader =
                                                getUploader(
                                                    doc.uploadedBy
                                                )
                                            return (
                                                <tr
                                                    key={doc._id}
                                                    className="border-b border-white/[0.03] transition hover:bg-white/[0.02]"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                                                                <File className="h-4 w-4 text-gray-500" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-white">
                                                                    {formatValue(
                                                                        doc.name
                                                                    )}
                                                                </p>
                                                                <p className="truncate text-xs text-gray-600">
                                                                    {formatValue(
                                                                        doc.originalName
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <p className="truncate text-sm text-gray-200">
                                                            {formatValue(
                                                                biz?.companyName
                                                            )}
                                                        </p>
                                                        <p className="truncate text-xs text-gray-600">
                                                            {formatValue(
                                                                biz?.legalName
                                                            )}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <CategoryBadge
                                                            category={
                                                                doc.category
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-medium text-gray-300">
                                                                {initials(
                                                                    uploader?.fullName
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm text-gray-200">
                                                                    {formatValue(
                                                                        uploader?.fullName
                                                                    )}
                                                                </p>
                                                                <p className="truncate text-xs text-gray-600">
                                                                    {formatValue(
                                                                        uploader?.role
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3 text-xs text-gray-400">
                                                        {formatDate(
                                                            doc.uploadedAt ||
                                                            doc.createdAt
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <VisibilityBadge
                                                            visibility={
                                                                doc.visibility
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <StatusBadge
                                                            status={
                                                                doc.status
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openMetadata(
                                                                    doc._id
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-400/20"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                            Metadata
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 sm:flex-row">
                                <p className="text-xs text-gray-500">
                                    {rangeLabel}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={!canPrev}
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.max(1, p - 1)
                                            )
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-3 w-3" />
                                        Previous
                                    </button>

                                    {pageButtons.map((p, i) =>
                                        p === '…' ? (
                                            <span
                                                key={`e-${i}`}
                                                className="px-2 text-xs text-gray-600"
                                            >
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() =>
                                                    setPage(p)
                                                }
                                                className={`min-w-[28px] rounded-lg border px-2 py-1.5 text-xs transition ${p === pagination.page
                                                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                                                    : 'border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}

                                    <button
                                        type="button"
                                        disabled={!canNext}
                                        onClick={() =>
                                            setPage((p) => p + 1)
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Metadata Drawer */}
            <AnimatePresence>
                {openDocId && (
                    <motion.div
                        className="fixed inset-0 z-50 flex"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={closeMetadata}
                        />

                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{
                                type: 'spring',
                                damping: 30,
                                stiffness: 250,
                            }}
                            className="relative ml-auto flex h-full w-full max-w-2xl flex-col border-l border-white/[0.08] bg-[#0a0a0a]"
                        >
                            {/* Drawer header */}
                            <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-semibold">
                                        Document Metadata
                                    </h2>
                                    <p className="mt-0.5 truncate text-xs text-gray-600">
                                        {detail?.document?.name
                                            ? formatValue(
                                                detail.document.name
                                            )
                                            : 'Loading...'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeMetadata}
                                    className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-gray-400 transition hover:bg-white/[0.08]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Drawer body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {/* Security notice */}
                                <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
                                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                    <p className="text-xs text-amber-200/90">
                                        Admin access is limited to document
                                        metadata. File preview, download and
                                        direct file access are restricted.
                                    </p>
                                </div>

                                {detailLoading && <Skeleton rows={8} />}

                                {detailError && (
                                    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span className="min-w-0 flex-1">
                                            {detailError}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openDocId &&
                                                loadDetail(openDocId)
                                            }
                                            className="text-xs font-medium underline hover:no-underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {detail && !detailLoading && (
                                    <>
                                        <Section
                                            title="Document Information"
                                            icon={FileText}
                                        >
                                            <DetailRow
                                                label="Document Name"
                                                value={formatValue(
                                                    detail.document.name
                                                )}
                                            />
                                            <DetailRow
                                                label="Original File Name"
                                                value={formatValue(
                                                    detail.document
                                                        .originalName
                                                )}
                                            />
                                            <DetailRow
                                                label="MIME Type"
                                                value={formatValue(
                                                    detail.document.mimeType
                                                )}
                                            />
                                            <DetailRow
                                                label="File Size"
                                                value={formatBytes(
                                                    detail.document.size
                                                )}
                                            />
                                            <DetailRow
                                                label="Category"
                                                value={
                                                    <CategoryBadge
                                                        category={
                                                            detail.document
                                                                .category
                                                        }
                                                    />
                                                }
                                            />
                                            <DetailRow
                                                label="Status"
                                                value={
                                                    <StatusBadge
                                                        status={
                                                            detail.document
                                                                .status
                                                        }
                                                    />
                                                }
                                            />
                                            <DetailRow
                                                label="Visibility"
                                                value={
                                                    <VisibilityBadge
                                                        visibility={
                                                            detail.document
                                                                .visibility
                                                        }
                                                    />
                                                }
                                            />
                                            <DetailRow
                                                label="Uploaded Date"
                                                value={formatDate(
                                                    detail.document
                                                        .uploadedAt ||
                                                    detail.document
                                                        .createdAt
                                                )}
                                            />
                                        </Section>

                                        <Section
                                            title="Business Information"
                                            icon={Building2}
                                        >
                                            {detail.business ? (
                                                <>
                                                    <DetailRow
                                                        label="Company Name"
                                                        value={formatValue(
                                                            detail.business
                                                                .companyName
                                                        )}
                                                    />
                                                    <DetailRow
                                                        label="Legal Name"
                                                        value={formatValue(
                                                            detail.business
                                                                .legalName
                                                        )}
                                                    />
                                                    <DetailRow
                                                        label="Company Type"
                                                        value={formatValue(
                                                            detail.business
                                                                .companyType
                                                        )}
                                                    />
                                                    <DetailRow
                                                        label="Industry"
                                                        value={formatValue(
                                                            detail.business
                                                                .industry
                                                        )}
                                                    />
                                                    <DetailRow
                                                        label="Business Status"
                                                        value={formatValue(
                                                            detail.business
                                                                .status
                                                        )}
                                                    />
                                                </>
                                            ) : (
                                                <p className="py-3 text-xs text-gray-600">
                                                    Business information
                                                    unavailable.
                                                </p>
                                            )}
                                        </Section>

                                        <Section
                                            title="Uploaded By"
                                            icon={User}
                                        >
                                            {detail.uploadedBy ? (
                                                <>
                                                    <DetailRow
                                                        label="Name"
                                                        value={formatValue(
                                                            detail.uploadedBy
                                                                .fullName
                                                        )}
                                                    />
                                                    <DetailRow
                                                        label="Email"
                                                        value={formatValue(
                                                            detail.uploadedBy
                                                                .email
                                                        )}
                                                    />
                                                    <DetailRow
                                                        label="Phone"
                                                        value={formatValue(
                                                            detail.uploadedBy
                                                                .phone
                                                        )}
                                                    />
                                                    <DetailRow
                                                        label="Role"
                                                        value={formatValue(
                                                            detail.uploadedBy
                                                                .role
                                                        )}
                                                    />
                                                </>
                                            ) : (
                                                <p className="py-3 text-xs text-gray-600">
                                                    Uploader information
                                                    unavailable.
                                                </p>
                                            )}
                                        </Section>

                                        <Section
                                            title="Related Contracts"
                                            icon={FileText}
                                        >
                                            {detail.relatedContracts &&
                                                detail.relatedContracts
                                                    .length > 0 ? (
                                                <div className="space-y-2 py-2">
                                                    {detail.relatedContracts.map(
                                                        (c) => (
                                                            <div
                                                                key={c._id}
                                                                className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-mono text-[11px] text-gray-500">
                                                                        {formatValue(
                                                                            c.contractNumber
                                                                        )}
                                                                    </span>
                                                                    <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-400">
                                                                        {formatValue(
                                                                            c.status
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 truncate text-xs font-medium text-gray-200">
                                                                    {formatValue(
                                                                        c.title
                                                                    )}
                                                                </p>
                                                                <p className="text-[11px] text-gray-600">
                                                                    {formatValue(
                                                                        c.contractType
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="py-3 text-xs text-gray-600">
                                                    No related contracts.
                                                </p>
                                            )}
                                        </Section>

                                        <Section
                                            title="Admin Access"
                                            icon={Lock}
                                        >
                                            <DetailRow
                                                label="View File"
                                                value={
                                                    <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                                                        Restricted
                                                    </span>
                                                }
                                            />
                                            <DetailRow
                                                label="Preview"
                                                value={
                                                    <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                                                        Restricted
                                                    </span>
                                                }
                                            />
                                            <DetailRow
                                                label="Download"
                                                value={
                                                    <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                                                        Restricted
                                                    </span>
                                                }
                                            />
                                            <DetailRow
                                                label="Signed URL"
                                                value={
                                                    <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                                                        Restricted
                                                    </span>
                                                }
                                            />
                                        </Section>
                                    </>
                                )}
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}