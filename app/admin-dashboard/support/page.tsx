// app/admin-dashboard/support/page.tsx
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
    CheckCircle2,
    Loader2,
    Send,
    StickyNote,
    ChevronLeft,
    ChevronRight,
    Ticket,
    Inbox,
    Clock,
    XCircle,
    AlertTriangle,
    Building2,
    Scale,
    User,
    UserCog,
    MessageSquare,
    Paperclip,
    Download,
    FileText,
} from 'lucide-react'

// ==================================================
// API BASE
// ==================================================

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const SUPPORT_API = `${API_BASE}/admin/support`

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
// TYPES
// ==================================================

interface SupportRequester {
    _id?: string
    userId?: string
    fullName?: string
    email?: string
    phone?: string
    role?: string
    profilePhoto?: string
    avatar?: string
}

interface SupportAssignee {
    _id?: string
    userId?: string
    fullName?: string
    email?: string
    role?: string
    profilePhoto?: string
}

interface SupportBusiness {
    _id?: string
    companyName?: string
    legalName?: string
    industry?: string
    companyType?: string
    status?: string
    owner?: {
        _id?: string
        fullName?: string
        email?: string
        phone?: string
        role?: string
    }
}

interface SupportTicket {
    _id: string
    ticketNumber?: string
    subject?: string
    description?: string
    category?: string
    priority?: string
    status?: string
    assignedTo?: SupportAssignee | null
    createdBy?: SupportRequester | null
    lastMessageAt?: string
    resolvedAt?: string
    resolvedBy?: string
    createdAt?: string
    updatedAt?: string
}

interface SupportAttachment {
    _id?: string
    name?: string
    fileName?: string
    url?: string
    fileUrl?: string
    type?: string
    mimeType?: string
    size?: number
    fileSize?: number
}

interface SupportMessage {
    _id: string
    ticket?: string
    sender?: SupportRequester | null
    senderRole?: string
    message?: string
    isInternal?: boolean
    attachments?: SupportAttachment[]
    isEdited?: boolean
    editedAt?: string
    createdAt?: string
    updatedAt?: string
}

interface SupportStats {
    total: number
    open: number
    inProgress: number
    resolved: number
    closed: number
    urgent: number
    businessTickets: number
    lawyerTickets: number
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

// ==================================================
// CONSTANTS
// ==================================================

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS = [
    { value: '', label: 'All priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
]

const CATEGORY_OPTIONS = [
    { value: '', label: 'All categories' },
    { value: 'technical', label: 'Technical' },
    { value: 'account', label: 'Account' },
    { value: 'billing', label: 'Billing' },
    { value: 'payment', label: 'Payment' },
    { value: 'client', label: 'Client' },
    { value: 'contract', label: 'Contract' },
    { value: 'document', label: 'Document' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'other', label: 'Other' },
]

const REQUESTER_OPTIONS = [
    { value: '', label: 'All requesters' },
    { value: 'business', label: 'Business' },
    { value: 'lawyer', label: 'Lawyer' },
]

// ==================================================
// HELPERS
// ==================================================

function formatDateTime(value?: string | null): string {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'

    const now = new Date()
    const sameDay =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()

    const time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })

    if (sameDay) return `Today, ${time}`

    const date = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
    return `${date}, ${time}`
}

function relativeTime(value?: string | null): string {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    const diff = Date.now() - d.getTime()
    const s = Math.floor(diff / 1000)
    if (s < 60) return 'just now'
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const days = Math.floor(h / 24)
    if (days < 7) return `${days}d ago`
    return formatDateTime(value).split(',')[0]
}

function formatValue(v?: string | number | null): string {
    if (v === undefined || v === null || v === '') return '—'
    return String(v)
}

function humanStatus(s?: string): string {
    if (!s) return '—'
    return s
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
}

function formatBytes(n?: number): string {
    if (!n && n !== 0) return ''
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    if (n < 1024 * 1024 * 1024)
        return `${(n / (1024 * 1024)).toFixed(1)} MB`
    return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

async function parseError(res: Response): Promise<string> {
    try {
        const j = await res.json()
        return (
            j?.message ||
            j?.error ||
            `Request failed with status ${res.status}`
        )
    } catch {
        return `Request failed with status ${res.status}`
    }
}

// ==================================================
// UI PRIMITIVES
// ==================================================

function StatusBadge({ status }: { status?: string }) {
    if (!status) return null
    const key = status.toLowerCase()
    const colors: Record<string, string> = {
        open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'in-progress':
            'bg-amber-500/10 text-amber-400 border-amber-500/20',
        resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
        closed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    }
    const cls =
        colors[key] || 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    return (
        <span
            className={`inline-flex rounded-lg border px-2 py-1 text-xs font-medium ${cls}`}
        >
            {humanStatus(status)}
        </span>
    )
}

function PriorityBadge({ priority }: { priority?: string }) {
    if (!priority) return null
    const key = priority.toLowerCase()
    const colors: Record<string, string> = {
        urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
        high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        low: 'bg-green-500/10 text-green-400 border-green-500/20',
    }
    return (
        <span
            className={`inline-flex rounded-lg border px-2 py-1 text-xs font-medium ${colors[key] || colors.low
                }`}
        >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
    )
}

function RoleBadge({ role }: { role?: string }) {
    if (!role) return null
    const key = role.toLowerCase()
    if (key === 'business') {
        return (
            <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                <Building2 className="h-3 w-3" />
                Business
            </span>
        )
    }
    if (key === 'lawyer') {
        return (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                <Scale className="h-3 w-3" />
                Lawyer
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {role}
        </span>
    )
}

function Skeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
                />
            ))}
        </div>
    )
}

function ErrorBanner({
    message,
    onRetry,
}: {
    message: string
    onRetry?: () => void
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{message}</span>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="text-xs font-medium underline hover:no-underline"
                >
                    Retry
                </button>
            )}
        </div>
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

const selectCls =
    'rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none transition focus:border-amber-400/40'

// ==================================================
// STAT CARDS
// ==================================================

function StatCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
    active,
    onClick,
}: {
    label: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    tone?: 'default' | 'open' | 'progress' | 'resolved' | 'closed' | 'urgent'
    active?: boolean
    onClick?: () => void
}) {
    const tones: Record<string, string> = {
        default: 'text-gray-400',
        open: 'text-blue-400',
        progress: 'text-amber-400',
        resolved: 'text-green-400',
        closed: 'text-zinc-400',
        urgent: 'text-red-400',
    }
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${active
                ? 'border-amber-400/40 bg-amber-400/[0.06]'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
        >
            <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-light text-white">
                    {value}
                </p>
            </div>
            <Icon className={`h-5 w-5 shrink-0 ${tones[tone]}`} />
        </button>
    )
}

// ==================================================
// MAIN PAGE
// ==================================================

export default function AdminSupportPage() {
    // ----- stats -----
    const [stats, setStats] = useState<SupportStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState<string | null>(null)

    // ----- list -----
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1,
    })
    const [listLoading, setListLoading] = useState(true)
    const [listRefreshing, setListRefreshing] = useState(false)
    const [listError, setListError] = useState<string | null>(null)

    // ----- filters -----
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [requesterFilter, setRequesterFilter] = useState('')
    const [page, setPage] = useState(1)

    // ----- selected ticket / detail -----
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [ticket, setTicket] = useState<SupportTicket | null>(null)
    const [business, setBusiness] = useState<SupportBusiness | null>(null)
    const [requester, setRequester] = useState<SupportRequester | null>(null)
    const [assignee, setAssignee] = useState<SupportAssignee | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)

    // ----- messages -----
    const [messages, setMessages] = useState<SupportMessage[]>([])
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [messagesError, setMessagesError] = useState<string | null>(null)

    // ----- reply composer -----
    const [replyText, setReplyText] = useState('')
    const [replyMode, setReplyMode] = useState<'reply' | 'internal'>(
        'reply'
    )
    const [sending, setSending] = useState(false)
    const [composerError, setComposerError] = useState<string | null>(null)
    const [composerSuccess, setComposerSuccess] = useState<string | null>(
        null
    )

    // ----- action states -----
    const [statusUpdating, setStatusUpdating] = useState(false)
    const [priorityUpdating, setPriorityUpdating] = useState(false)
    const [assignUpdating, setAssignUpdating] = useState(false)

    // ----- mobile view -----
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

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

    useEffect(() => {
        setPage(1)
    }, [
        statusFilter,
        priorityFilter,
        categoryFilter,
        requesterFilter,
    ])

    // ==================================================
    // FETCH STATS
    // ==================================================

    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        setStatsError(null)
        try {
            const token = getAuthToken()
            if (!token)
                throw new Error(
                    'Authentication required. Please sign in again.'
                )

            const res = await fetch(`${SUPPORT_API}/stats`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!res.ok) throw new Error(await parseError(res))

            const json = await res.json()
            const payload = json?.data || {}

            setStats({
                total: payload.total ?? 0,
                open: payload.open ?? 0,
                inProgress:
                    payload.inProgress ?? payload['in-progress'] ?? 0,
                resolved: payload.resolved ?? 0,
                closed: payload.closed ?? 0,
                urgent: payload.urgent ?? 0,
                businessTickets: payload.businessTickets ?? 0,
                lawyerTickets: payload.lawyerTickets ?? 0,
            })
        } catch (err) {
            setStatsError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load support stats.'
            )
        } finally {
            setStatsLoading(false)
        }
    }, [])

    // ==================================================
    // FETCH LIST
    // ==================================================

    const fetchTickets = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) setListRefreshing(true)
            else setListLoading(true)
            setListError(null)

            if (listAbortRef.current) listAbortRef.current.abort()
            const ctrl = new AbortController()
            listAbortRef.current = ctrl

            try {
                const token = getAuthToken()
                if (!token)
                    throw new Error(
                        'Authentication required. Please sign in again.'
                    )

                const params = new URLSearchParams()
                params.set('page', String(page))
                params.set('limit', String(pagination.limit))
                if (search) params.set('search', search)
                if (statusFilter) params.set('status', statusFilter)
                if (priorityFilter) params.set('priority', priorityFilter)
                if (categoryFilter) params.set('category', categoryFilter)
                if (requesterFilter)
                    params.set('requesterRole', requesterFilter)

                const res = await fetch(
                    `${SUPPORT_API}/tickets?${params.toString()}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: ctrl.signal,
                    }
                )

                if (!res.ok) throw new Error(await parseError(res))

                const json = await res.json()
                const list: SupportTicket[] = Array.isArray(json?.data)
                    ? json.data
                    : []

                setTickets(list)
                setPagination({
                    page: json?.pagination?.page ?? page,
                    limit:
                        json?.pagination?.limit ?? pagination.limit,
                    total:
                        json?.pagination?.total ?? list.length,
                    pages: json?.pagination?.pages ?? 1,
                })
            } catch (err) {
                if ((err as Error)?.name === 'AbortError') return
                setListError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load support tickets.'
                )
            } finally {
                setListLoading(false)
                setListRefreshing(false)
            }
        },
        [
            page,
            pagination.limit,
            search,
            statusFilter,
            priorityFilter,
            categoryFilter,
            requesterFilter,
        ]
    )

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    // ==================================================
    // FETCH DETAIL + MESSAGES
    // ==================================================

    const fetchDetail = useCallback(async (id: string) => {
        setDetailLoading(true)
        setDetailError(null)

        if (detailAbortRef.current) detailAbortRef.current.abort()
        const ctrl = new AbortController()
        detailAbortRef.current = ctrl

        try {
            const token = getAuthToken()
            if (!token)
                throw new Error(
                    'Authentication required. Please sign in again.'
                )

            const res = await fetch(`${SUPPORT_API}/tickets/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                signal: ctrl.signal,
            })

            if (!res.ok) throw new Error(await parseError(res))
            const json = await res.json()
            const payload = json?.data || {}

            setTicket(payload.ticket || null)
            setRequester(
                payload.requester || payload.ticket?.createdBy || null
            )
            setBusiness(payload.business || null)
            setAssignee(
                payload.assignedTo || payload.ticket?.assignedTo || null
            )
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') return
            setDetailError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load ticket details.'
            )
            setTicket(null)
        } finally {
            setDetailLoading(false)
        }
    }, [])

    const fetchMessages = useCallback(async (id: string) => {
        setMessagesLoading(true)
        setMessagesError(null)
        try {
            const token = getAuthToken()
            if (!token)
                throw new Error(
                    'Authentication required. Please sign in again.'
                )

            const res = await fetch(
                `${SUPPORT_API}/tickets/${id}/messages`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!res.ok) throw new Error(await parseError(res))
            const json = await res.json()
            const list: SupportMessage[] = Array.isArray(json?.data)
                ? json.data
                : []
            setMessages(list)
        } catch (err) {
            setMessagesError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load messages.'
            )
            setMessages([])
        } finally {
            setMessagesLoading(false)
        }
    }, [])

    const openTicket = (id: string) => {
        setSelectedId(id)
        setMobileDetailOpen(true)
        setReplyText('')
        setComposerError(null)
        setComposerSuccess(null)
        fetchDetail(id)
        fetchMessages(id)
    }

    const closeDetail = () => {
        setSelectedId(null)
        setTicket(null)
        setBusiness(null)
        setRequester(null)
        setAssignee(null)
        setMessages([])
        setMobileDetailOpen(false)
    }

    // ==================================================
    // REPLY / INTERNAL NOTE
    // ==================================================

    const handleSend = async () => {
        if (!selectedId) return
        const text = replyText.trim()
        if (!text) return

        setSending(true)
        setComposerError(null)
        setComposerSuccess(null)

        try {
            const token = getAuthToken()
            if (!token)
                throw new Error(
                    'Authentication required. Please sign in again.'
                )

            const res = await fetch(
                `${SUPPORT_API}/tickets/${selectedId}/reply`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: text,
                        isInternal: replyMode === 'internal',
                    }),
                }
            )

            if (!res.ok) throw new Error(await parseError(res))
            const json = await res.json().catch(() => ({}))

            setReplyText('')
            setComposerSuccess(
                json?.message ||
                (replyMode === 'internal'
                    ? 'Internal note added.'
                    : 'Reply sent.')
            )
            window.setTimeout(() => setComposerSuccess(null), 3500)

            // Refresh detail + messages + list
            await Promise.all([
                fetchDetail(selectedId),
                fetchMessages(selectedId),
                fetchTickets(true),
                fetchStats(),
            ])
        } catch (err) {
            setComposerError(
                err instanceof Error ? err.message : 'Failed to send.'
            )
        } finally {
            setSending(false)
        }
    }

    // ==================================================
    // ACTIONS: STATUS / PRIORITY / ASSIGN
    // ==================================================

    const patchTicket = async (
        path: string,
        body: Record<string, unknown>
    ) => {
        if (!selectedId) throw new Error('No ticket selected.')
        const token = getAuthToken()
        if (!token)
            throw new Error(
                'Authentication required. Please sign in again.'
            )

        const res = await fetch(
            `${SUPPORT_API}/tickets/${selectedId}/${path}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            }
        )
        if (!res.ok) throw new Error(await parseError(res))
        return res.json().catch(() => ({}))
    }

    const handleStatusChange = async (status: string) => {
        if (!ticket || ticket.status === status) return
        setStatusUpdating(true)
        setComposerError(null)
        try {
            await patchTicket('status', { status })
            await Promise.all([
                fetchDetail(selectedId!),
                fetchTickets(true),
                fetchStats(),
            ])
        } catch (err) {
            setComposerError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update status.'
            )
        } finally {
            setStatusUpdating(false)
        }
    }

    const handlePriorityChange = async (priority: string) => {
        if (!ticket || ticket.priority === priority) return
        setPriorityUpdating(true)
        setComposerError(null)
        try {
            await patchTicket('priority', { priority })
            await Promise.all([
                fetchDetail(selectedId!),
                fetchTickets(true),
            ])
        } catch (err) {
            setComposerError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update priority.'
            )
        } finally {
            setPriorityUpdating(false)
        }
    }

    const handleAssign = async (assignedTo: string) => {
        setAssignUpdating(true)
        setComposerError(null)
        try {
            await patchTicket('assign', { assignedTo })
            await Promise.all([
                fetchDetail(selectedId!),
                fetchTickets(true),
            ])
        } catch (err) {
            setComposerError(
                err instanceof Error
                    ? err.message
                    : 'Failed to assign ticket.'
            )
        } finally {
            setAssignUpdating(false)
        }
    }

    // ==================================================
    // REFRESH ALL
    // ==================================================

    const refreshAll = () => {
        fetchStats()
        fetchTickets(true)
        if (selectedId) {
            fetchDetail(selectedId)
            fetchMessages(selectedId)
        }
    }

    // ==================================================
    // DERIVED
    // ==================================================

    const pageLabel = useMemo(
        () => `Page ${pagination.page} of ${pagination.pages}`,
        [pagination.page, pagination.pages]
    )
    const canPrev = pagination.page > 1
    const canNext = pagination.page < pagination.pages

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="min-h-full text-white">
            {/* Header */}
            <div className="border-b border-white/[0.05] bg-black/40 backdrop-blur-md">
                <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-light tracking-tight text-white lg:text-5xl">
                                Support
                            </h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Manage support requests raised by
                                businesses and legal professionals.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={refreshAll}
                            disabled={listRefreshing || listLoading}
                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 transition hover:bg-white/[0.08] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-5 w-5 text-gray-400 ${listRefreshing
                                    ? 'animate-spin'
                                    : ''
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
                {/* Stat cards */}
                <div className="mb-6">
                    {statsError && (
                        <div className="mb-3">
                            <ErrorBanner
                                message={statsError}
                                onRetry={fetchStats}
                            />
                        </div>
                    )}

                    {statsLoading && !stats ? (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-[76px] animate-pulse rounded-xl bg-white/[0.04]"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                            <StatCard
                                label="Total"
                                value={stats?.total ?? 0}
                                icon={Ticket}
                                tone="default"
                                active={
                                    statusFilter === '' &&
                                    priorityFilter === '' &&
                                    requesterFilter === ''
                                }
                                onClick={() => {
                                    setStatusFilter('')
                                    setPriorityFilter('')
                                    setRequesterFilter('')
                                }}
                            />
                            <StatCard
                                label="Open"
                                value={stats?.open ?? 0}
                                icon={Inbox}
                                tone="open"
                                active={statusFilter === 'open'}
                                onClick={() => setStatusFilter('open')}
                            />
                            <StatCard
                                label="In Progress"
                                value={stats?.inProgress ?? 0}
                                icon={Clock}
                                tone="progress"
                                active={statusFilter === 'in-progress'}
                                onClick={() =>
                                    setStatusFilter('in-progress')
                                }
                            />
                            <StatCard
                                label="Resolved"
                                value={stats?.resolved ?? 0}
                                icon={CheckCircle2}
                                tone="resolved"
                                active={statusFilter === 'resolved'}
                                onClick={() => setStatusFilter('resolved')}
                            />
                            <StatCard
                                label="Closed"
                                value={stats?.closed ?? 0}
                                icon={XCircle}
                                tone="closed"
                                active={statusFilter === 'closed'}
                                onClick={() => setStatusFilter('closed')}
                            />
                            <StatCard
                                label="Urgent"
                                value={stats?.urgent ?? 0}
                                icon={AlertTriangle}
                                tone="urgent"
                                active={priorityFilter === 'urgent'}
                                onClick={() =>
                                    setPriorityFilter('urgent')
                                }
                            />
                        </div>
                    )}
                </div>

                {/* Two-panel layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                    {/* LEFT: list */}
                    <div
                        className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm ${mobileDetailOpen ? 'hidden lg:block' : ''
                            }`}
                    >
                        {/* Filters */}
                        <div className="border-b border-white/[0.06] p-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) =>
                                        setSearchInput(e.target.value)
                                    }
                                    placeholder="Search subject, ticket #, requester..."
                                    className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-amber-400/40"
                                />
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className={selectCls}
                                >
                                    {STATUS_OPTIONS.map((o) => (
                                        <option
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={priorityFilter}
                                    onChange={(e) =>
                                        setPriorityFilter(e.target.value)
                                    }
                                    className={selectCls}
                                >
                                    {PRIORITY_OPTIONS.map((o) => (
                                        <option
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) =>
                                        setCategoryFilter(e.target.value)
                                    }
                                    className={selectCls}
                                >
                                    {CATEGORY_OPTIONS.map((o) => (
                                        <option
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={requesterFilter}
                                    onChange={(e) =>
                                        setRequesterFilter(
                                            e.target.value
                                        )
                                    }
                                    className={selectCls}
                                >
                                    {REQUESTER_OPTIONS.map((o) => (
                                        <option
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* List body */}
                        <div className="max-h-[calc(100vh-360px)] overflow-y-auto p-2">
                            {listError && (
                                <div className="p-3">
                                    <ErrorBanner
                                        message={listError}
                                        onRetry={() => fetchTickets()}
                                    />
                                </div>
                            )}

                            {listLoading ? (
                                <div className="p-3">
                                    <Skeleton rows={6} />
                                </div>
                            ) : tickets.length === 0 ? (
                                <EmptyState
                                    title="No support requests found."
                                    description="Try changing your search or filters."
                                    icon={Inbox}
                                />
                            ) : (
                                <div className="space-y-1">
                                    {tickets.map((t) => {
                                        const isActive =
                                            selectedId === t._id
                                        return (
                                            <button
                                                key={t._id}
                                                type="button"
                                                onClick={() =>
                                                    openTicket(t._id)
                                                }
                                                className={`w-full rounded-xl border p-3 text-left transition ${isActive
                                                    ? 'border-amber-400/40 bg-amber-400/[0.06]'
                                                    : 'border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                                                    }`}
                                            >
                                                <div className="mb-1.5 flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-gray-500">
                                                        {t.ticketNumber ||
                                                            '—'}
                                                    </span>
                                                    <RoleBadge
                                                        role={
                                                            t.createdBy
                                                                ?.role
                                                        }
                                                    />
                                                    <span className="ml-auto text-[10px] text-gray-600">
                                                        {relativeTime(
                                                            t.lastMessageAt ||
                                                            t.updatedAt
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mb-1 truncate text-sm font-medium text-white">
                                                    {formatValue(
                                                        t.subject
                                                    )}
                                                </p>
                                                <p className="mb-2 truncate text-xs text-gray-500">
                                                    {formatValue(
                                                        t.createdBy
                                                            ?.fullName
                                                    )}{' '}
                                                    •{' '}
                                                    {formatValue(
                                                        t.createdBy?.email
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-1.5">
                                                    <StatusBadge
                                                        status={t.status}
                                                    />
                                                    <PriorityBadge
                                                        priority={
                                                            t.priority
                                                        }
                                                    />
                                                    {t.category && (
                                                        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400">
                                                            {t.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {!listLoading && tickets.length > 0 && (
                            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
                                <p className="text-xs text-gray-500">
                                    {pagination.total} total •{' '}
                                    {pageLabel}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={!canPrev}
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.max(1, p - 1)
                                            )
                                        }
                                        className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-gray-400 transition hover:bg-white/[0.08] disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!canNext}
                                        onClick={() =>
                                            setPage((p) => p + 1)
                                        }
                                        className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-gray-400 transition hover:bg-white/[0.08] disabled:opacity-40"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: detail */}
                    <div
                        className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm ${mobileDetailOpen ? '' : 'hidden lg:block'
                            }`}
                    >
                        {!selectedId ? (
                            <EmptyState
                                title="Select a ticket"
                                description="Pick a ticket from the list to view the conversation and take action."
                                icon={MessageSquare}
                            />
                        ) : (
                            <TicketDetail
                                ticket={ticket}
                                requester={requester}
                                business={business}
                                assignee={assignee}
                                loading={detailLoading}
                                error={detailError}
                                onRetry={() =>
                                    selectedId &&
                                    fetchDetail(selectedId)
                                }
                                messages={messages}
                                messagesLoading={messagesLoading}
                                messagesError={messagesError}
                                onRetryMessages={() =>
                                    selectedId &&
                                    fetchMessages(selectedId)
                                }
                                replyText={replyText}
                                setReplyText={setReplyText}
                                replyMode={replyMode}
                                setReplyMode={setReplyMode}
                                sending={sending}
                                onSend={handleSend}
                                composerError={composerError}
                                composerSuccess={composerSuccess}
                                statusUpdating={statusUpdating}
                                priorityUpdating={priorityUpdating}
                                assignUpdating={assignUpdating}
                                onStatusChange={handleStatusChange}
                                onPriorityChange={handlePriorityChange}
                                onAssign={handleAssign}
                                onClose={() => {
                                    closeDetail()
                                }}
                                onBackMobile={() =>
                                    setMobileDetailOpen(false)
                                }
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

// ==================================================
// TICKET DETAIL
// ==================================================

function TicketDetail({
    ticket,
    requester,
    business,
    assignee,
    loading,
    error,
    onRetry,
    messages,
    messagesLoading,
    messagesError,
    onRetryMessages,
    replyText,
    setReplyText,
    replyMode,
    setReplyMode,
    sending,
    onSend,
    composerError,
    composerSuccess,
    statusUpdating,
    priorityUpdating,
    assignUpdating,
    onStatusChange,
    onPriorityChange,
    onAssign,
    onBackMobile,
}: {
    ticket: SupportTicket | null
    requester: SupportRequester | null
    business: SupportBusiness | null
    assignee: SupportAssignee | null
    loading: boolean
    error: string | null
    onRetry: () => void
    messages: SupportMessage[]
    messagesLoading: boolean
    messagesError: string | null
    onRetryMessages: () => void
    replyText: string
    setReplyText: (v: string) => void
    replyMode: 'reply' | 'internal'
    setReplyMode: (m: 'reply' | 'internal') => void
    sending: boolean
    onSend: () => void
    composerError: string | null
    composerSuccess: string | null
    statusUpdating: boolean
    priorityUpdating: boolean
    assignUpdating: boolean
    onStatusChange: (s: string) => void
    onPriorityChange: (p: string) => void
    onAssign: (id: string) => void
    onClose: () => void
    onBackMobile: () => void
}) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
            })
        }
    }, [messages.length])

    if (loading && !ticket) {
        return (
            <div className="p-6">
                <Skeleton rows={8} />
            </div>
        )
    }

    if (error && !ticket) {
        return (
            <div className="p-6">
                <ErrorBanner message={error} onRetry={onRetry} />
            </div>
        )
    }

    if (!ticket) return null

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-white/[0.06] p-4">
                <div className="mb-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onBackMobile}
                        className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-gray-400 transition hover:bg-white/[0.08] lg:hidden"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-mono text-[11px] text-gray-500">
                        {ticket.ticketNumber || '—'}
                    </span>
                    <RoleBadge role={requester?.role} />
                    <span className="ml-auto text-[11px] text-gray-600">
                        {formatDateTime(
                            ticket.lastMessageAt || ticket.updatedAt
                        )}
                    </span>
                </div>

                <h2 className="mb-1 text-lg font-semibold text-white">
                    {formatValue(ticket.subject)}
                </h2>
                <p className="mb-3 whitespace-pre-wrap text-sm text-gray-400">
                    {formatValue(ticket.description)}
                </p>

                {/* Requester / Business */}
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-600">
                            Requester
                        </p>
                        <p className="text-xs font-medium text-gray-200">
                            {formatValue(requester?.fullName)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                            {formatValue(requester?.email)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-600">
                            Business
                        </p>
                        {business ? (
                            <>
                                <p className="text-xs font-medium text-gray-200">
                                    {formatValue(
                                        business.companyName
                                    )}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    {formatValue(
                                        business.owner?.fullName
                                    )}{' '}
                                    •{' '}
                                    {formatValue(
                                        business.owner?.email
                                    )}
                                </p>
                            </>
                        ) : (
                            <p className="text-xs text-gray-500">
                                Business information unavailable.
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">
                            Status
                        </span>
                        <select
                            value={ticket.status || ''}
                            onChange={(e) =>
                                onStatusChange(e.target.value)
                            }
                            disabled={statusUpdating}
                            className={selectCls}
                        >
                            {STATUS_OPTIONS.filter(
                                (o) => o.value !== ''
                            ).map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">
                            Priority
                        </span>
                        <select
                            value={ticket.priority || ''}
                            onChange={(e) =>
                                onPriorityChange(e.target.value)
                            }
                            disabled={priorityUpdating}
                            className={selectCls}
                        >
                            {PRIORITY_OPTIONS.filter(
                                (o) => o.value !== ''
                            ).map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">
                            Assigned
                        </span>
                        <select
                            value={assignee?._id || ''}
                            onChange={(e) =>
                                onAssign(e.target.value)
                            }
                            disabled={assignUpdating}
                            className={selectCls}
                        >
                            <option value="">Unassigned</option>
                            {assignee?._id && (
                                <option value={assignee._id}>
                                    {assignee.fullName ||
                                        assignee.email ||
                                        'Current assignee'}
                                </option>
                            )}
                        </select>
                    </div>

                    {ticket.resolvedAt && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Resolved {formatDateTime(ticket.resolvedAt)}
                        </span>
                    )}
                </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {messagesError && (
                    <div className="mb-3">
                        <ErrorBanner
                            message={messagesError}
                            onRetry={onRetryMessages}
                        />
                    </div>
                )}

                {messagesLoading && messages.length === 0 ? (
                    <Skeleton rows={5} />
                ) : messages.length === 0 ? (
                    <EmptyState
                        title="No messages yet."
                        description="Be the first to reply."
                        icon={MessageSquare}
                    />
                ) : (
                    <div className="space-y-3">
                        {messages.map((m) => (
                            <MessageBubble
                                key={m._id}
                                message={m}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/[0.06] p-4">
                {(composerError || composerSuccess) && (
                    <div className="mb-3">
                        {composerError && (
                            <ErrorBanner message={composerError} />
                        )}
                        {composerSuccess && (
                            <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-green-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {composerSuccess}
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-2 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setReplyMode('reply')}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${replyMode === 'reply'
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                            : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                            }`}
                    >
                        <Send className="h-3 w-3" />
                        Reply
                    </button>
                    <button
                        type="button"
                        onClick={() => setReplyMode('internal')}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${replyMode === 'internal'
                            ? 'border-indigo-400/40 bg-indigo-400/10 text-indigo-300'
                            : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                            }`}
                    >
                        <StickyNote className="h-3 w-3" />
                        Internal Note
                    </button>
                </div>

                <div className="relative">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        placeholder={
                            replyMode === 'internal'
                                ? 'Write an internal note (not visible to requester)...'
                                : 'Write a reply...'
                        }
                        className={`w-full resize-none rounded-xl border bg-black/40 px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:bg-black/60 ${replyMode === 'internal'
                            ? 'border-indigo-400/30 focus:border-indigo-400/50'
                            : 'border-white/10 focus:border-amber-400/40'
                            }`}
                    />

                    <button
                        type="button"
                        onClick={onSend}
                        disabled={sending || !replyText.trim()}
                        className={`absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${replyMode === 'internal'
                            ? 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300 hover:bg-indigo-400/20'
                            : 'border-amber-400/30 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                            }`}
                    >
                        {sending ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-3.5 w-3.5" />
                                {replyMode === 'internal'
                                    ? 'Add Note'
                                    : 'Send Reply'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==================================================
// MESSAGE BUBBLE
// ==================================================

function MessageBubble({ message }: { message: SupportMessage }) {
    const isAdmin =
        message.senderRole === 'admin' ||
        message.senderRole === 'support'
    const isInternal = Boolean(message.isInternal)

    if (isInternal) {
        return (
            <div className="flex justify-center">
                <div className="w-full max-w-2xl rounded-xl border border-indigo-400/30 bg-indigo-400/[0.06] p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                        <StickyNote className="h-3.5 w-3.5 text-indigo-300" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                            Internal Note
                        </span>
                        <span className="text-[10px] text-gray-500">
                            by{' '}
                            {message.sender?.fullName ||
                                message.senderRole ||
                                'admin'}
                        </span>
                        <span className="ml-auto text-[10px] text-gray-600">
                            {formatDateTime(message.createdAt)}
                        </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-200">
                        {message.message || ''}
                    </p>
                    <Attachments
                        attachments={message.attachments}
                    />
                </div>
            </div>
        )
    }

    return (
        <div
            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'
                }`}
        >
            <div
                className={`max-w-[85%] rounded-2xl border px-3.5 py-2.5 md:max-w-[75%] ${isAdmin
                    ? 'border-amber-400/20 bg-amber-400/[0.08]'
                    : 'border-white/[0.06] bg-white/[0.03]'
                    }`}
            >
                <div className="mb-1 flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-300">
                        {message.sender?.fullName ||
                            message.senderRole ||
                            'Unknown'}
                    </span>
                    {message.senderRole && (
                        <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gray-500">
                            {message.senderRole}
                        </span>
                    )}
                    <span className="ml-auto text-[10px] text-gray-600">
                        {formatDateTime(message.createdAt)}
                    </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-100">
                    {message.message || ''}
                </p>
                <Attachments attachments={message.attachments} />
            </div>
        </div>
    )
}

// ==================================================
// ATTACHMENTS
// ==================================================

function Attachments({
    attachments,
}: {
    attachments?: SupportAttachment[]
}) {
    if (!attachments || attachments.length === 0) return null

    return (
        <div className="mt-2 space-y-1.5 border-t border-white/[0.06] pt-2">
            {attachments.map((a, i) => {
                const name =
                    a.name || a.fileName || a.type || 'Attachment'
                const url = a.url || a.fileUrl || ''
                const size = a.size ?? a.fileSize
                return (
                    <a
                        key={a._id || `${i}-${name}`}
                        href={url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 transition hover:border-amber-400/30 hover:bg-white/[0.04]"
                    >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                        <span className="min-w-0 flex-1 truncate text-xs text-gray-300">
                            {name}
                        </span>
                        {size !== undefined && (
                            <span className="text-[10px] text-gray-600">
                                {formatBytes(size)}
                            </span>
                        )}
                        {url ? (
                            <Download className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                        ) : (
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                        )}
                    </a>
                )
            })}
        </div>
    )
}