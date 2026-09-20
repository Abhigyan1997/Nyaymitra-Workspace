'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    HelpCircle,
    History,
    Mail,
    MessageCircle,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    ShieldCheck,
    UserRound,
    X,
} from 'lucide-react'

type TicketStatus =
    | 'Open'
    | 'In Progress'
    | 'Waiting for Response'
    | 'Resolved'

type TicketPriority =
    | 'High'
    | 'Medium'
    | 'Low'

type TicketCategory =
    | 'Technical'
    | 'Client Access'
    | 'Contract'
    | 'Document'
    | 'Billing'
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

const SUPPORT_TICKETS: SupportTicket[] = [
    {
        id: 'ticket-001',
        ticketNumber: 'NM-1042',
        subject: 'Unable to access client document',
        category: 'Document',
        priority: 'High',
        status: 'In Progress',
        createdAt: '18 Sep 2026',
        updatedAt: 'Today, 10:12 AM',
        description:
            'The latest contract document shared by the client is visible in the workspace, but the preview is not loading.',
        messages: [
            {
                id: 'm1',
                sender: 'Bharat Rajak',
                role: 'Lawyer',
                message:
                    'The latest contract document is visible but the preview does not load.',
                timestamp: 'Today, 09:42 AM',
            },
            {
                id: 'm2',
                sender: 'NyayMitra Support',
                role: 'Support',
                message:
                    'Thanks. We are checking the document access and preview service.',
                timestamp: 'Today, 10:12 AM',
            },
        ],
    },
    {
        id: 'ticket-002',
        ticketNumber: 'NM-1037',
        subject: 'Client workspace access',
        category: 'Client Access',
        priority: 'Medium',
        status: 'Waiting for Response',
        createdAt: '17 Sep 2026',
        updatedAt: '17 Sep 2026',
        description:
            'Request regarding access permissions for a newly assigned client workspace.',
        messages: [
            {
                id: 'm3',
                sender: 'Bharat Rajak',
                role: 'Lawyer',
                message:
                    'I have been assigned to the client but cannot see the shared workspace.',
                timestamp: '17 Sep 2026, 03:05 PM',
            },
            {
                id: 'm4',
                sender: 'NyayMitra Support',
                role: 'Support',
                message:
                    'Please confirm the client company name so we can verify the assignment.',
                timestamp: '17 Sep 2026, 03:24 PM',
            },
        ],
    },
    {
        id: 'ticket-003',
        ticketNumber: 'NM-1028',
        subject: 'Contract status not updating',
        category: 'Contract',
        priority: 'Medium',
        status: 'Open',
        createdAt: '16 Sep 2026',
        updatedAt: '16 Sep 2026',
        description:
            'A contract remains in review even after the latest review action was submitted.',
        messages: [
            {
                id: 'm5',
                sender: 'Bharat Rajak',
                role: 'Lawyer',
                message:
                    'The contract status appears unchanged after submitting my review.',
                timestamp: '16 Sep 2026, 05:15 PM',
            },
        ],
    },
    {
        id: 'ticket-004',
        ticketNumber: 'NM-1019',
        subject: 'How to share a document with client',
        category: 'Document',
        priority: 'Low',
        status: 'Resolved',
        createdAt: '14 Sep 2026',
        updatedAt: '15 Sep 2026',
        description:
            'Question about sharing a reviewed document back with the client workspace.',
        messages: [
            {
                id: 'm6',
                sender: 'Bharat Rajak',
                role: 'Lawyer',
                message:
                    'How can I share a reviewed copy with the client?',
                timestamp: '14 Sep 2026, 11:10 AM',
            },
            {
                id: 'm7',
                sender: 'NyayMitra Support',
                role: 'Support',
                message:
                    'Open the document and use the Share action from the document toolbar.',
                timestamp: '14 Sep 2026, 11:28 AM',
            },
        ],
    },
]

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
        'Waiting for Response':
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        Resolved:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
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
    icon: React.ComponentType<{ className?: string }>
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
    const [tickets] =
        useState<SupportTicket[]>(
            SUPPORT_TICKETS
        )

    const [selectedTicketId, setSelectedTicketId] =
        useState(
            SUPPORT_TICKETS[0]?.id || ''
        )

    const [search, setSearch] =
        useState('')

    const [statusFilter, setStatusFilter] =
        useState<
            'All' | TicketStatus
        >('All')

    const [mobileDetailOpen, setMobileDetailOpen] =
        useState(false)

    const [newTicketOpen, setNewTicketOpen] =
        useState(false)

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
                ticket.id ===
                selectedTicketId
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
                    ticket.status ===
                    'In Progress'
            ).length,
            resolved: tickets.filter(
                (ticket) =>
                    ticket.status === 'Resolved'
            ).length,
        }),
        [tickets]
    )

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
                            onClick={() =>
                                setNewTicketOpen(true)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/15"
                        >
                            <Plus className="h-4 w-4" />
                            New Support Request
                        </button>
                    </div>
                </div>

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
                            <h2 className="text-sm font-semibold text-white">
                                My Support Requests
                            </h2>

                            <p className="mt-1 text-[11px] text-zinc-600">
                                Track your open and previous requests
                            </p>

                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
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
                                        'Waiting for Response',
                                        'Resolved',
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
                            {filteredTickets.map(
                                (ticket) => {
                                    const selected =
                                        selectedTicketId ===
                                        ticket.id

                                    return (
                                        <button
                                            key={ticket.id}
                                            onClick={() => {
                                                setSelectedTicketId(
                                                    ticket.id
                                                )
                                                setMobileDetailOpen(
                                                    true
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
                                                            {ticket.subject}
                                                        </p>

                                                        {selected && (
                                                            <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
                                                        )}
                                                    </div>

                                                    <p className="mt-1 text-[10px] text-zinc-600">
                                                        {ticket.ticketNumber} •{' '}
                                                        {ticket.category}
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
                            )}
                        </div>
                    </div>

                    {/* Desktop details */}
                    <div className="hidden lg:block">
                        <SupportDetails
                            ticket={selectedTicket}
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
                            onClick={() =>
                                setNewTicketOpen(false)
                            }
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
                                        setNewTicketOpen(false)
                                    }
                                >
                                    <X className="h-4 w-4 text-zinc-600" />
                                </button>
                            </div>

                            <div className="mt-5 space-y-3">
                                <input
                                    placeholder="Subject"
                                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700"
                                />

                                <textarea
                                    rows={5}
                                    placeholder="Describe your issue..."
                                    className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700"
                                />

                                <button
                                    onClick={() =>
                                        setNewTicketOpen(false)
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-3 text-xs font-medium text-blue-300 ring-1 ring-blue-400/20"
                                >
                                    <Send className="h-4 w-4" />
                                    Submit Request
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
}: {
    ticket: SupportTicket | null
}) {
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
                    <div>
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

                    <MoreHorizontal className="h-4 w-4 text-zinc-600" />
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <p className="text-xs leading-6 text-zinc-500">
                        {ticket.description}
                    </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <PriorityBadge
                        priority={ticket.priority}
                    />

                    <span className="text-[11px] text-zinc-600">
                        Last updated {ticket.updatedAt}
                    </span>
                </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <div className="border-b border-white/[0.06] px-5 py-4">
                    <h3 className="text-sm font-semibold">
                        Conversation
                    </h3>
                </div>

                <div className="space-y-4 p-5">
                    {ticket.messages.map(
                        (message) => (
                            <div
                                key={message.id}
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
                                        {message.sender}
                                    </p>

                                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                                        {message.message}
                                    </p>

                                    <p className="mt-2 text-[10px] text-zinc-700">
                                        {message.timestamp}
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>

                <div className="border-t border-white/[0.06] p-4">
                    <div className="flex gap-2">
                        <input
                            placeholder="Write a reply..."
                            className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-xs text-white outline-none placeholder:text-zinc-700"
                        />

                        <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-400/20">
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}