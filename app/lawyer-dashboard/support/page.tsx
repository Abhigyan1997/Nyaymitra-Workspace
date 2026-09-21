'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    HelpCircle,
    MessageCircle,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    ShieldCheck,
    UserRound,
    X,
    type LucideIcon,
} from 'lucide-react'

type TicketStatus =
    | 'Open'
    | 'In Progress'
    | 'Resolved'
    | 'Closed'

type TicketPriority =
    | 'High'
    | 'Medium'
    | 'Low'
    | 'Urgent'

type TicketCategory =
    | 'Technical'
    | 'Account'
    | 'Billing'
    | 'Payment'
    | 'Client Access'
    | 'Contract'
    | 'Document'
    | 'Compliance'
    | 'Other'

interface Message {
    id: string
    sender: string
    role: 'Lawyer' | 'Support'
    message: string
    timestamp: string
}

interface SupportTicket {
    id: string
    ticketNumber: string
    subject: string
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    createdAt: string
    updatedAt: string
    description: string
    messages: Message[]
}

interface ApiTicket {
    _id?: string
    id?: string
    ticketNumber?: string
    subject?: string
    category?: string
    priority?: string
    status?: string
    createdAt?: string
    updatedAt?: string
    lastMessageAt?: string
    description?: string
}

interface ApiMessage {
    _id?: string
    id?: string
    sender?: {
        _id?: string
        fullName?: string
        email?: string
        role?: string | string[]
    } | string
    senderRole?: string
    message?: string
    createdAt?: string
}

interface ApiResponse<T = unknown> {
    success?: boolean
    message?: string
    ticket?: ApiTicket
    tickets?: ApiTicket[]
    messages?: ApiMessage[]
    supportMessage?: ApiMessage
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

const API_BASE_URL =
    'https://nyaymitra-backend-production.up.railway.app/api/v1/lawyer-works/support'

const CATEGORY_OPTIONS = [
    { value: 'technical', label: 'Technical' },
    { value: 'account', label: 'Account' },
    { value: 'billing', label: 'Billing' },
    { value: 'payment', label: 'Payment' },
    { value: 'client', label: 'Client Access' },
    { value: 'contract', label: 'Contract' },
    { value: 'document', label: 'Document' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'other', label: 'Other' },
] as const

const STATUS_OPTIONS = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
] as const

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
] as const

function getToken() {
    if (typeof window === 'undefined') return ''

    return localStorage.getItem('token') || ''
}

async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()

    const headers = new Headers(options.headers)

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
    }

    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
    })

    const text = await response.text()

    let data: any = {}

    try {
        data = text ? JSON.parse(text) : {}
    } catch {
        throw new Error(
            `Server returned an invalid response (${response.status}).`
        )
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            `Request failed with status ${response.status}`
        )
    }

    return data as T
}

function formatDate(value?: string) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date)
}

function formatDateTime(value?: string) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}


function normalizeStatus(value?: string): TicketStatus {
    switch (value) {
        case 'in-progress':
            return 'In Progress'
        case 'resolved':
            return 'Resolved'
        case 'closed':
            return 'Closed'
        case 'open':
        default:
            return 'Open'
    }
}

function normalizePriority(value?: string): TicketPriority {
    switch (value) {
        case 'urgent':
            return 'Urgent'
        case 'high':
            return 'High'
        case 'low':
            return 'Low'
        case 'medium':
        default:
            return 'Medium'
    }
}

function normalizeCategory(value?: string): TicketCategory {
    switch (value) {
        case 'technical':
            return 'Technical'
        case 'account':
            return 'Account'
        case 'billing':
            return 'Billing'
        case 'payment':
            return 'Payment'
        case 'client':
            return 'Client Access'
        case 'contract':
            return 'Contract'
        case 'document':
            return 'Document'
        case 'compliance':
            return 'Compliance'
        case 'other':
        default:
            return 'Other'
    }
}

function normalizeMessage(message: ApiMessage): Message {
    const senderObject =
        message.sender &&
            typeof message.sender === 'object'
            ? message.sender
            : null

    const sender =
        senderObject?.fullName ||
        senderObject?.email ||
        (typeof message.sender === 'string'
            ? message.sender
            : 'NyayMitra Support')

    const role =
        message.senderRole === 'lawyer'
            ? 'Lawyer'
            : 'Support'

    return {
        id:
            message._id ||
            message.id ||
            `${Date.now()}-${Math.random()}`,
        sender,
        role,
        message: message.message || '',
        timestamp: formatDateTime(message.createdAt),
    }
}

function normalizeTicket(
    ticket: ApiTicket,
    messages: ApiMessage[] = []
): SupportTicket {
    return {
        id: ticket._id || ticket.id || '',
        ticketNumber:
            ticket.ticketNumber ||
            (ticket._id
                ? `NM-${ticket._id.slice(-6).toUpperCase()}`
                : 'N/A'),
        subject: ticket.subject || 'Untitled support request',
        category: normalizeCategory(ticket.category),
        priority: normalizePriority(ticket.priority),
        status: normalizeStatus(ticket.status),
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDateTime(
            ticket.lastMessageAt || ticket.updatedAt
        ),
        description: ticket.description || '',
        messages: messages.map(normalizeMessage),
    }
}

function statusToApi(status: TicketStatus) {
    switch (status) {
        case 'In Progress':
            return 'in-progress'
        case 'Resolved':
            return 'resolved'
        case 'Closed':
            return 'closed'
        case 'Open':
        default:
            return 'open'
    }
}

function StatusBadge({
    status,
}: {
    status: TicketStatus
}) {
    const styles: Record<TicketStatus, string> = {
        Open:
            'border-blue-500/20 bg-blue-500/10 text-blue-400',
        'In Progress':
            'border-violet-500/20 bg-violet-500/10 text-violet-400',
        Resolved:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Closed:
            'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
    }

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status]}`}
        >
            {status}
        </span>
    )
}

function PriorityBadge({
    priority,
}: {
    priority: TicketPriority
}) {
    const styles: Record<TicketPriority, string> = {
        High:
            'border-red-500/20 bg-red-500/10 text-red-400',
        Urgent:
            'border-red-500/30 bg-red-500/15 text-red-300',
        Medium:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        Low:
            'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
    }

    return (
        <span
            className={`rounded-md border px-2 py-1 text-[10px] font-medium ${styles[priority]}`}
        >
            {priority}
        </span>
    )
}

function SummaryCard({
    icon: Icon,
    value,
    label,
}: {
    icon: LucideIcon
    value: number
    label: string
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
        >
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                <Icon className="h-4 w-4 text-blue-400" />
            </div>

            <p className="text-2xl font-semibold text-white">
                {value}
            </p>

            <p className="mt-1 text-sm text-zinc-400">
                {label}
            </p>
        </motion.div>
    )
}

export default function LawyerSupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [selectedTicketId, setSelectedTicketId] =
        useState('')

    const [search, setSearch] = useState('')

    const [statusFilter, setStatusFilter] =
        useState<'All' | TicketStatus>('All')

    const [mobileDetailOpen, setMobileDetailOpen] =
        useState(false)

    const [newTicketOpen, setNewTicketOpen] =
        useState(false)

    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] =
        useState(false)
    const [submittingTicket, setSubmittingTicket] =
        useState(false)
    const [replyLoading, setReplyLoading] =
        useState(false)
    const [statusLoading, setStatusLoading] =
        useState(false)
    const [error, setError] = useState('')
    const [actionError, setActionError] = useState('')

    const [subject, setSubject] = useState('')
    const [description, setDescription] =
        useState('')
    const [category, setCategory] =
        useState('technical')
    const [priority, setPriority] =
        useState('medium')

    const loadTickets = async () => {
        try {
            setLoading(true)
            setError('')

            const data = await apiRequest<ApiResponse>(
                `${API_BASE_URL}?page=1&limit=100`
            )

            const normalizedTickets =
                (data.tickets || []).map((ticket) =>
                    normalizeTicket(ticket)
                )

            setTickets(normalizedTickets)

            setSelectedTicketId((current) => {
                if (
                    current &&
                    normalizedTickets.some(
                        (ticket) => ticket.id === current
                    )
                ) {
                    return current
                }

                return normalizedTickets[0]?.id || ''
            })
        } catch (err: any) {
            console.error('Support tickets load error:', err)
            setError(
                err?.message ||
                'Failed to load support requests.'
            )
        } finally {
            setLoading(false)
        }
    }

    const loadTicketDetails = async (
        ticketId: string
    ) => {
        if (!ticketId) return

        try {
            setDetailLoading(true)
            setActionError('')

            const data =
                await apiRequest<ApiResponse>(
                    `${API_BASE_URL}/${ticketId}`
                )

            if (!data.ticket) return

            const normalized =
                normalizeTicket(
                    data.ticket,
                    data.messages || []
                )

            setTickets((current) =>
                current.map((ticket) =>
                    ticket.id === normalized.id
                        ? normalized
                        : ticket
                )
            )
        } catch (err: any) {
            console.error(
                'Support ticket detail error:',
                err
            )

            setActionError(
                err?.message ||
                'Failed to load ticket details.'
            )
        } finally {
            setDetailLoading(false)
        }
    }

    useEffect(() => {
        loadTickets()
    }, [])

    useEffect(() => {
        if (selectedTicketId) {
            loadTicketDetails(selectedTicketId)
        }
    }, [selectedTicketId])

    const filteredTickets = useMemo(() => {
        const term =
            search.trim().toLowerCase()

        return tickets.filter((ticket) => {
            const matchesSearch =
                !term ||
                ticket.subject
                    .toLowerCase()
                    .includes(term) ||
                ticket.ticketNumber
                    .toLowerCase()
                    .includes(term) ||
                ticket.category
                    .toLowerCase()
                    .includes(term)

            const matchesStatus =
                statusFilter === 'All' ||
                ticket.status === statusFilter

            return (
                matchesSearch &&
                matchesStatus
            )
        })
    }, [
        tickets,
        search,
        statusFilter,
    ])

    const selectedTicket =
        tickets.find(
            (ticket) =>
                ticket.id === selectedTicketId
        ) || null

    const summary = useMemo(
        () => ({
            total: tickets.length,
            open: tickets.filter(
                (ticket) =>
                    ticket.status === 'Open'
            ).length,
            inProgress: tickets.filter(
                (ticket) =>
                    ticket.status === 'In Progress'
            ).length,
            resolved: tickets.filter(
                (ticket) =>
                    ticket.status === 'Resolved'
            ).length,
        }),
        [tickets]
    )

    const handleCreateTicket = async () => {
        if (!subject.trim()) {
            setActionError('Subject is required.')
            return
        }

        if (!description.trim()) {
            setActionError(
                'Please describe the issue.'
            )
            return
        }

        try {
            setSubmittingTicket(true)
            setActionError('')

            const data =
                await apiRequest<ApiResponse>(
                    API_BASE_URL,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            subject: subject.trim(),
                            description:
                                description.trim(),
                            category,
                            priority,
                        }),
                    }
                )

            const createdId =
                data.ticket?._id ||
                data.ticket?.id ||
                ''

            setSubject('')
            setDescription('')
            setCategory('technical')
            setPriority('medium')
            setNewTicketOpen(false)

            await loadTickets()

            if (createdId) {
                setSelectedTicketId(createdId)
                setMobileDetailOpen(true)
                await loadTicketDetails(createdId)
            }
        } catch (err: any) {
            console.error(
                'Create support ticket error:',
                err
            )

            setActionError(
                err?.message ||
                'Failed to create support request.'
            )
        } finally {
            setSubmittingTicket(false)
        }
    }

    const handleReply = async (message: string) => {
        if (!selectedTicketId || !message.trim()) {
            return
        }

        try {
            setReplyLoading(true)
            setActionError('')

            await apiRequest<ApiResponse>(
                `${API_BASE_URL}/${selectedTicketId}/reply`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        message: message.trim(),
                    }),
                }
            )

            await loadTickets()
            await loadTicketDetails(
                selectedTicketId
            )
        } catch (err: any) {
            console.error(
                'Support reply error:',
                err
            )

            setActionError(
                err?.message ||
                'Failed to send reply.'
            )
        } finally {
            setReplyLoading(false)
        }
    }

    const handleStatusChange = async (
        status: TicketStatus
    ) => {
        if (!selectedTicketId) return

        try {
            setStatusLoading(true)
            setActionError('')

            await apiRequest<ApiResponse>(
                `${API_BASE_URL}/${selectedTicketId}/status`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        status: statusToApi(status),
                    }),
                }
            )

            await loadTickets()
            await loadTicketDetails(
                selectedTicketId
            )
        } catch (err: any) {
            console.error(
                'Support status update error:',
                err
            )

            setActionError(
                err?.message ||
                'Failed to update ticket status.'
            )
        } finally {
            setStatusLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[28%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="border-b border-white/[0.06] pb-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                                <span>Lawyer Dashboard</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-zinc-300">
                                    Support
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <HelpCircle className="h-7 w-7 text-blue-400" />

                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Support
                                </h1>
                            </div>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Get help with your lawyer workspace, client access,
                                documents, contracts, and platform issues.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setActionError('')
                                setNewTicketOpen(true)
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/15"
                        >
                            <Plus className="h-4 w-4" />
                            New Support Request
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-red-300">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>

                        <button
                            onClick={loadTickets}
                            className="rounded-lg border border-red-500/20 px-3 py-1.5 text-[10px] text-red-300 hover:bg-red-500/10"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {actionError && !newTicketOpen && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-amber-300">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {actionError}
                        </div>

                        <button
                            onClick={() =>
                                setActionError('')
                            }
                            className="rounded-lg px-2 py-1 text-zinc-500 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Summary */}
                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <SummaryCard
                        icon={FileText}
                        value={summary.total}
                        label="Total Requests"
                    />

                    <SummaryCard
                        icon={AlertCircle}
                        value={summary.open}
                        label="Open"
                    />

                    <SummaryCard
                        icon={Clock3}
                        value={summary.inProgress}
                        label="In Progress"
                    />

                    <SummaryCard
                        icon={CheckCircle2}
                        value={summary.resolved}
                        label="Resolved"
                    />
                </section>

                {/* Main */}
                <section className="mt-6 grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)]">
                    {/* Tickets */}
                    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                        <div className="border-b border-white/[0.06] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-white">
                                        My Support Requests
                                    </h2>

                                    <p className="mt-1 text-[11px] text-zinc-600">
                                        Track your open and previous requests
                                    </p>
                                </div>

                                <button
                                    onClick={loadTickets}
                                    disabled={loading}
                                    className="rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-zinc-500 hover:text-white disabled:opacity-50"
                                >
                                    Refresh
                                </button>
                            </div>

                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search requests..."
                                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                />
                            </div>

                            <div className="mt-3 flex gap-1.5 overflow-x-auto">
                                {(
                                    [
                                        'All',
                                        'Open',
                                        'In Progress',
                                        'Resolved',
                                        'Closed',
                                    ] as const
                                ).map(
                                    (status) => (
                                        <button
                                            key={status}
                                            onClick={() =>
                                                setStatusFilter(
                                                    status
                                                )
                                            }
                                            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] ${statusFilter ===
                                                status
                                                ? 'bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20'
                                                : 'bg-white/[0.02] text-zinc-600 hover:text-zinc-300'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="max-h-[700px] overflow-y-auto p-2">
                            {loading ? (
                                <div className="space-y-2 p-2">
                                    {Array.from(
                                        { length: 4 }
                                    ).map(
                                        (_, index) => (
                                            <div
                                                key={index}
                                                className="h-24 animate-pulse rounded-xl bg-white/[0.02]"
                                            />
                                        )
                                    )}
                                </div>
                            ) : filteredTickets.length ===
                                0 ? (
                                <div className="px-5 py-16 text-center">
                                    <MessageCircle className="mx-auto h-8 w-8 text-zinc-700" />

                                    <p className="mt-4 text-sm text-zinc-400">
                                        No support requests found
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-700">
                                        Create a request when you need help.
                                    </p>
                                </div>
                            ) : (
                                filteredTickets.map(
                                    (ticket) => {
                                        const selected =
                                            selectedTicketId ===
                                            ticket.id

                                        return (
                                            <button
                                                key={
                                                    ticket.id
                                                }
                                                onClick={() => {
                                                    setSelectedTicketId(
                                                        ticket.id
                                                    )
                                                    setMobileDetailOpen(
                                                        true
                                                    )
                                                    setActionError(
                                                        ''
                                                    )
                                                }}
                                                className={`mb-1 w-full rounded-xl p-3 text-left transition ${selected
                                                    ? 'bg-blue-400/[0.07] ring-1 ring-blue-400/15'
                                                    : 'hover:bg-white/[0.025]'
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]">
                                                        <MessageCircle className="h-4 w-4 text-blue-400" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="truncate text-sm font-medium text-white">
                                                                {
                                                                    ticket.subject
                                                                }
                                                            </p>

                                                            {selected && (
                                                                <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
                                                            )}
                                                        </div>

                                                        <p className="mt-1 text-[10px] text-zinc-600">
                                                            {
                                                                ticket.ticketNumber
                                                            }{' '}
                                                            •{' '}
                                                            {
                                                                ticket.category
                                                            }
                                                        </p>

                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <StatusBadge
                                                                status={
                                                                    ticket.status
                                                                }
                                                            />

                                                            <PriorityBadge
                                                                priority={
                                                                    ticket.priority
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    }
                                )
                            )}
                        </div>
                    </div>

                    {/* Desktop details */}
                    <div className="hidden lg:block">
                        <SupportDetails
                            ticket={selectedTicket}
                            loading={
                                detailLoading
                            }
                            onReply={
                                handleReply
                            }
                            onStatusChange={
                                handleStatusChange
                            }
                            statusLoading={
                                statusLoading
                            }
                            replyLoading={
                                replyLoading
                            }
                        />
                    </div>
                </section>
            </main>

            {/* Mobile details */}
            <AnimatePresence>
                {mobileDetailOpen &&
                    selectedTicket && (
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
                            <div className="sticky top-0 z-20 flex items-center border-b border-white/[0.06] bg-[#06080b]/95 px-4 py-3 backdrop-blur-xl">
                                <button
                                    onClick={() =>
                                        setMobileDetailOpen(
                                            false
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06]"
                                >
                                    <ArrowLeft className="h-4 w-4 text-zinc-400" />
                                </button>

                                <span className="ml-3 text-sm font-medium">
                                    Support Request
                                </span>

                                <button
                                    onClick={() =>
                                        setMobileDetailOpen(
                                            false
                                        )
                                    }
                                    className="ml-auto"
                                >
                                    <X className="h-4 w-4 text-zinc-500" />
                                </button>
                            </div>

                            <div className="p-4">
                                <SupportDetails
                                    ticket={selectedTicket}
                                    loading={
                                        detailLoading
                                    }
                                    onReply={
                                        handleReply
                                    }
                                    onStatusChange={
                                        handleStatusChange
                                    }
                                    statusLoading={
                                        statusLoading
                                    }
                                    replyLoading={
                                        replyLoading
                                    }
                                />
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>

            {/* New request modal */}
            <AnimatePresence>
                {newTicketOpen && (
                    <>
                        <motion.div
                            initial={{
                                opacity: 0,
                            }}
                            animate={{
                                opacity: 1,
                            }}
                            exit={{
                                opacity: 0,
                            }}
                            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                            onClick={() => {
                                if (!submittingTicket) {
                                    setNewTicketOpen(false)
                                }
                            }}
                        />

                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.97,
                                y: 10,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.97,
                                y: 10,
                            }}
                            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.09] bg-[#0b0e12] p-5 shadow-2xl"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold">
                                        New Support Request
                                    </h3>

                                    <p className="mt-1 text-xs text-zinc-600">
                                        Tell the NyayMitra support team what you need.
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        !submittingTicket &&
                                        setNewTicketOpen(
                                            false
                                        )
                                    }
                                    disabled={
                                        submittingTicket
                                    }
                                >
                                    <X className="h-4 w-4 text-zinc-600" />
                                </button>
                            </div>

                            {actionError && (
                                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                                    {actionError}
                                </div>
                            )}

                            <div className="mt-5 space-y-3">
                                <input
                                    value={subject}
                                    onChange={(e) =>
                                        setSubject(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Subject"
                                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={category}
                                        onChange={(e) =>
                                            setCategory(
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-white/[0.07] bg-[#0b0e12] px-3 py-3 text-xs text-zinc-300 outline-none focus:border-blue-400/30"
                                    >
                                        {CATEGORY_OPTIONS.map(
                                            (
                                                option
                                            ) => (
                                                <option
                                                    key={
                                                        option.value
                                                    }
                                                    value={
                                                        option.value
                                                    }
                                                >
                                                    {
                                                        option.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <select
                                        value={priority}
                                        onChange={(e) =>
                                            setPriority(
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-white/[0.07] bg-[#0b0e12] px-3 py-3 text-xs text-zinc-300 outline-none focus:border-blue-400/30"
                                    >
                                        {PRIORITY_OPTIONS.map(
                                            (
                                                option
                                            ) => (
                                                <option
                                                    key={
                                                        option.value
                                                    }
                                                    value={
                                                        option.value
                                                    }
                                                >
                                                    {
                                                        option.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(
                                            e.target.value
                                        )
                                    }
                                    rows={5}
                                    placeholder="Describe your issue..."
                                    className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                />

                                <button
                                    onClick={
                                        handleCreateTicket
                                    }
                                    disabled={
                                        submittingTicket
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-3 text-xs font-medium text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />

                                    {submittingTicket
                                        ? 'Submitting...'
                                        : 'Submit Request'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

function SupportDetails({
    ticket,
    loading,
    onReply,
    onStatusChange,
    statusLoading,
    replyLoading,
}: {
    ticket: SupportTicket | null
    loading: boolean
    onReply: (message: string) => Promise<void>
    onStatusChange: (
        status: TicketStatus
    ) => Promise<void>
    statusLoading: boolean
    replyLoading: boolean
}) {
    const [reply, setReply] = useState('')

    useEffect(() => {
        setReply('')
    }, [ticket?.id])

    const submitReply = async () => {
        if (!reply.trim()) return

        await onReply(reply)
        setReply('')
    }

    if (!ticket) {
        return (
            <div className="flex min-h-[650px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <div className="text-center">
                    <HelpCircle className="mx-auto h-10 w-10 text-zinc-700" />

                    <p className="mt-4 text-sm text-zinc-400">
                        Select a support request
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold">
                                {ticket.subject}
                            </h2>

                            <StatusBadge
                                status={ticket.status}
                            />
                        </div>

                        <p className="mt-2 text-xs text-zinc-600">
                            {ticket.ticketNumber} •{' '}
                            {ticket.category} • Created{' '}
                            {ticket.createdAt}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={
                                statusToApi(
                                    ticket.status
                                )
                            }
                            onChange={(e) =>
                                onStatusChange(
                                    normalizeStatus(
                                        e.target.value
                                    )
                                )
                            }
                            disabled={statusLoading}
                            className="rounded-lg border border-white/[0.07] bg-[#0b0e12] px-2.5 py-2 text-[10px] text-zinc-300 outline-none disabled:opacity-50"
                        >
                            {STATUS_OPTIONS.map(
                                (option) => (
                                    <option
                                        key={
                                            option.value
                                        }
                                        value={
                                            option.value
                                        }
                                    >
                                        {option.label}
                                    </option>
                                )
                            )}
                        </select>

                        <MoreHorizontal className="h-4 w-4 text-zinc-600" />
                    </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <p className="text-xs leading-6 text-zinc-500">
                        {ticket.description}
                    </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <PriorityBadge
                        priority={ticket.priority}
                    />

                    <span className="text-[11px] text-zinc-600">
                        Last updated{' '}
                        {ticket.updatedAt}
                    </span>

                    {loading && (
                        <span className="text-[10px] text-blue-400">
                            Refreshing...
                        </span>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <div className="border-b border-white/[0.06] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                            Conversation
                        </h3>

                        <span className="text-[10px] text-zinc-600">
                            {ticket.messages.length}{' '}
                            {ticket.messages.length ===
                                1
                                ? 'message'
                                : 'messages'}
                        </span>
                    </div>
                </div>

                <div className="max-h-[520px] space-y-4 overflow-y-auto p-5">
                    {loading &&
                        ticket.messages.length === 0 ? (
                        <div className="space-y-3">
                            <div className="h-20 animate-pulse rounded-xl bg-white/[0.02]" />
                            <div className="ml-auto h-20 w-4/5 animate-pulse rounded-xl bg-white/[0.02]" />
                        </div>
                    ) : ticket.messages.length ===
                        0 ? (
                        <div className="py-10 text-center text-xs text-zinc-600">
                            No messages yet.
                        </div>
                    ) : (
                        ticket.messages.map(
                            (message) => (
                                <div
                                    key={
                                        message.id
                                    }
                                    className={`flex gap-3 ${message.role ===
                                        'Lawyer'
                                        ? ''
                                        : 'flex-row-reverse'
                                        }`}
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/10">
                                        {message.role ===
                                            'Lawyer' ? (
                                            <UserRound className="h-4 w-4 text-blue-400" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                        )}
                                    </div>

                                    <div
                                        className={`max-w-[80%] rounded-xl border border-white/[0.05] bg-white/[0.025] p-3 ${message.role ===
                                            'Support'
                                            ? 'text-right'
                                            : ''
                                            }`}
                                    >
                                        <p className="text-xs font-medium text-white">
                                            {
                                                message.sender
                                            }
                                        </p>

                                        <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-500">
                                            {
                                                message.message
                                            }
                                        </p>

                                        <p className="mt-2 text-[10px] text-zinc-700">
                                            {
                                                message.timestamp
                                            }
                                        </p>
                                    </div>
                                </div>
                            )
                        )
                    )}
                </div>

                <div className="border-t border-white/[0.06] p-4">
                    {ticket.status ===
                        'Closed' ? (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center text-xs text-zinc-600">
                            This support request is closed.
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                value={reply}
                                onChange={(e) =>
                                    setReply(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (
                                        e.key ===
                                        'Enter' &&
                                        !e.shiftKey
                                    ) {
                                        e.preventDefault()
                                        submitReply()
                                    }
                                }}
                                disabled={
                                    replyLoading
                                }
                                placeholder="Write a reply..."
                                className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30 disabled:opacity-50"
                            />

                            <button
                                onClick={submitReply}
                                disabled={
                                    replyLoading ||
                                    !reply.trim()
                                }
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-400/20 transition hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
