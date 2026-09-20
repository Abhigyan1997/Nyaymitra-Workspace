'use client'

import { useMemo, useState } from 'react'
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
    FileCheck2,
    FileText,
    Gavel,
    History,
    MoreHorizontal,
    Search,
    ShieldCheck,
    UserRound,
    X,
} from 'lucide-react'

type WorkType =
    | 'Contract'
    | 'Compliance'
    | 'Document'
    | 'Client Request'
    | 'Review'

type WorkStatus =
    | 'Pending'
    | 'In Progress'
    | 'Completed'
    | 'Blocked'

type WorkPriority =
    | 'High'
    | 'Medium'
    | 'Low'

interface WorkItem {
    id: string
    title: string
    type: WorkType
    clientName: string
    clientId: string
    description: string
    status: WorkStatus
    priority: WorkPriority
    dueDate: string
    assignedDate: string
    lastUpdated: string
}

const WORK_ITEMS: WorkItem[] = [
    {
        id: 'work-001',
        title: 'Review Master Service Agreement',
        type: 'Contract',
        clientName: 'NyayMitra Technologies Pvt Ltd',
        clientId: 'client-001',
        description:
            'Review the latest MSA and provide legal comments on commercial and liability provisions.',
        status: 'In Progress',
        priority: 'High',
        dueDate: '20 Sep 2026',
        assignedDate: '16 Sep 2026',
        lastUpdated: 'Today, 10:42 AM',
    },
    {
        id: 'work-002',
        title: 'Annual ROC Filing Review',
        type: 'Compliance',
        clientName: 'NyayMitra Technologies Pvt Ltd',
        clientId: 'client-001',
        description:
            'Review annual corporate compliance documents before filing.',
        status: 'In Progress',
        priority: 'High',
        dueDate: '25 Sep 2026',
        assignedDate: '16 Sep 2026',
        lastUpdated: 'Today, 09:32 AM',
    },
    {
        id: 'work-003',
        title: 'Vendor Agreement Revision',
        type: 'Contract',
        clientName: 'CloudEdge Technologies',
        clientId: 'client-002',
        description:
            'Review revised vendor agreement after changes were requested.',
        status: 'Pending',
        priority: 'High',
        dueDate: '19 Sep 2026',
        assignedDate: '15 Sep 2026',
        lastUpdated: 'Yesterday, 05:21 PM',
    },
    {
        id: 'work-004',
        title: 'Privacy Compliance Assessment',
        type: 'Compliance',
        clientName: 'CloudEdge Technologies',
        clientId: 'client-002',
        description:
            'Assess privacy documentation and data processing obligations.',
        status: 'Blocked',
        priority: 'High',
        dueDate: '18 Sep 2026',
        assignedDate: '10 Sep 2026',
        lastUpdated: 'Today, 08:00 AM',
    },
    {
        id: 'work-005',
        title: 'Review Employment Agreement',
        type: 'Contract',
        clientName: 'Apex Finserve',
        clientId: 'client-003',
        description:
            'Complete legal review of senior executive employment agreement.',
        status: 'In Progress',
        priority: 'Medium',
        dueDate: '22 Sep 2026',
        assignedDate: '14 Sep 2026',
        lastUpdated: 'Yesterday, 01:42 PM',
    },
    {
        id: 'work-006',
        title: 'Board Resolution Review',
        type: 'Document',
        clientName: 'Apex Finserve',
        clientId: 'client-003',
        description:
            'Review board resolution and verify authorization language.',
        status: 'Pending',
        priority: 'Medium',
        dueDate: '21 Sep 2026',
        assignedDate: '14 Sep 2026',
        lastUpdated: '16 Sep 2026',
    },
    {
        id: 'work-007',
        title: 'Company Licence Renewal',
        type: 'Compliance',
        clientName: 'Northstar Retail LLP',
        clientId: 'client-004',
        description:
            'Verify documentation required for company licence renewal.',
        status: 'Completed',
        priority: 'Low',
        dueDate: '30 Sep 2026',
        assignedDate: '05 Sep 2026',
        lastUpdated: '15 Sep 2026',
    },
]

function TypeIcon({
    type,
}: {
    type: WorkType
}) {
    if (type === 'Contract') {
        return (
            <FileCheck2 className="h-5 w-5 text-blue-400" />
        )
    }

    if (type === 'Compliance') {
        return (
            <ShieldCheck className="h-5 w-5 text-amber-400" />
        )
    }

    if (type === 'Document') {
        return (
            <FileText className="h-5 w-5 text-violet-400" />
        )
    }

    if (type === 'Client Request') {
        return (
            <UserRound className="h-5 w-5 text-emerald-400" />
        )
    }

    return (
        <Gavel className="h-5 w-5 text-blue-400" />
    )
}

function StatusBadge({
    status,
}: {
    status: WorkStatus
}) {
    const styles: Record<WorkStatus, string> = {
        Pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        'In Progress':
            'border-blue-500/20 bg-blue-500/10 text-blue-400',
        Completed:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Blocked:
            'border-red-500/20 bg-red-500/10 text-red-400',
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
    priority: WorkPriority
}) {
    const styles: Record<WorkPriority, string> = {
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

function SummaryCard({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number
    description: string
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

            <p className="mt-1 text-sm font-medium text-zinc-300">
                {label}
            </p>

            <p className="mt-1 text-[11px] text-zinc-600">
                {description}
            </p>
        </motion.div>
    )
}

export default function LawyerMyWorkPage() {
    const [items] =
        useState<WorkItem[]>(WORK_ITEMS)

    const [selectedId, setSelectedId] =
        useState(
            WORK_ITEMS[0]?.id || ''
        )

    const [search, setSearch] =
        useState('')

    const [statusFilter, setStatusFilter] =
        useState<
            'All' | WorkStatus
        >('All')

    const [typeFilter, setTypeFilter] =
        useState<
            'All' | WorkType
        >('All')

    const [mobileDetailOpen, setMobileDetailOpen] =
        useState(false)

    const filteredItems = useMemo(() => {
        const term =
            search.trim().toLowerCase()

        return items.filter((item) => {
            const matchesSearch =
                !term ||
                item.title
                    .toLowerCase()
                    .includes(term) ||
                item.clientName
                    .toLowerCase()
                    .includes(term) ||
                item.type
                    .toLowerCase()
                    .includes(term)

            const matchesStatus =
                statusFilter === 'All' ||
                item.status === statusFilter

            const matchesType =
                typeFilter === 'All' ||
                item.type === typeFilter

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            )
        })
    }, [
        items,
        search,
        statusFilter,
        typeFilter,
    ])

    const selectedItem =
        items.find(
            (item) =>
                item.id === selectedId
        ) || null

    const summary = useMemo(
        () => ({
            total: items.length,

            active: items.filter(
                (item) =>
                    item.status ===
                    'Pending' ||
                    item.status ===
                    'In Progress'
            ).length,

            urgent: items.filter(
                (item) =>
                    item.priority ===
                    'High' &&
                    item.status !==
                    'Completed'
            ).length,

            completed: items.filter(
                (item) =>
                    item.status ===
                    'Completed'
            ).length,
        }),
        [items]
    )

    const todayItems = items.filter(
        (item) =>
            item.dueDate ===
            '18 Sep 2026'
    )

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[30%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="border-b border-white/[0.06] pb-6">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                            <span>Lawyer Dashboard</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-zinc-300">
                                My Work
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <BriefcaseIcon />

                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                My Work
                            </h1>
                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                            One workspace for contracts, compliance, documents and legal
                            work currently assigned to you.
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <SummaryCard
                        icon={FileText}
                        value={summary.total}
                        label="Total Work"
                        description="Assigned legal work"
                    />

                    <SummaryCard
                        icon={Clock3}
                        value={summary.active}
                        label="Active"
                        description="Currently requiring action"
                    />

                    <SummaryCard
                        icon={AlertCircle}
                        value={summary.urgent}
                        label="High Priority"
                        description="Needs attention"
                    />

                    <SummaryCard
                        icon={CheckCircle2}
                        value={summary.completed}
                        label="Completed"
                        description="Successfully closed"
                    />
                </section>

                {/* Today */}
                {todayItems.length > 0 && (
                    <section className="mt-6 rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                                <AlertCircle className="h-4 w-4 text-red-400" />
                            </div>

                            <div>
                                <h2 className="text-sm font-semibold">
                                    Due Today
                                </h2>

                                <p className="text-xs text-zinc-600">
                                    Work items that need attention today
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {todayItems.map(
                                (item) => (
                                    <button
                                        key={item.id}
                                        onClick={() =>
                                            setSelectedId(
                                                item.id
                                            )
                                        }
                                        className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-left transition hover:border-red-400/20"
                                    >
                                        <p className="text-xs font-medium text-white">
                                            {item.title}
                                        </p>

                                        <p className="mt-1 text-[11px] text-zinc-600">
                                            {item.clientName}
                                        </p>

                                        <div className="mt-3 flex gap-2">
                                            <PriorityBadge
                                                priority={
                                                    item.priority
                                                }
                                            />

                                            <StatusBadge
                                                status={
                                                    item.status
                                                }
                                            />
                                        </div>
                                    </button>
                                )
                            )}
                        </div>
                    </section>
                )}

                {/* Main */}
                <section className="mt-6 grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)]">
                    {/* List */}
                    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                        <div className="border-b border-white/[0.06] p-4">
                            <h2 className="text-sm font-semibold">
                                Assigned Work
                            </h2>

                            <p className="mt-1 text-[11px] text-zinc-600">
                                {filteredItems.length} work item
                                {filteredItems.length !==
                                    1
                                    ? 's'
                                    : ''}
                            </p>

                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search your work..."
                                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                />
                            </div>

                            <div className="mt-3 flex gap-1.5 overflow-x-auto">
                                {(
                                    [
                                        'All',
                                        'Pending',
                                        'In Progress',
                                        'Completed',
                                        'Blocked',
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

                            <div className="mt-2 flex gap-1.5 overflow-x-auto">
                                {(
                                    [
                                        'All',
                                        'Contract',
                                        'Compliance',
                                        'Document',
                                        'Client Request',
                                        'Review',
                                    ] as const
                                ).map(
                                    (type) => (
                                        <button
                                            key={type}
                                            onClick={() =>
                                                setTypeFilter(
                                                    type
                                                )
                                            }
                                            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] ${typeFilter ===
                                                    type
                                                    ? 'bg-white/[0.07] text-white'
                                                    : 'text-zinc-600 hover:text-zinc-300'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="max-h-[740px] overflow-y-auto p-2">
                            {filteredItems.map(
                                (item) => {
                                    const selected =
                                        selectedId ===
                                        item.id

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedId(
                                                    item.id
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
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]">
                                                    <TypeIcon
                                                        type={
                                                            item.type
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="truncate text-sm font-medium">
                                                            {item.title}
                                                        </p>

                                                        {selected && (
                                                            <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
                                                        )}
                                                    </div>

                                                    <p className="mt-1 truncate text-[11px] text-zinc-500">
                                                        {item.clientName}
                                                    </p>

                                                    <div className="mt-2 flex flex-wrap gap-2">
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

                                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-700">
                                                        <CalendarDays className="h-3 w-3" />
                                                        Due {item.dueDate}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                }
                            )}
                        </div>
                    </div>

                    {/* Desktop detail */}
                    <div className="hidden lg:block">
                        <WorkDetails
                            item={selectedItem}
                        />
                    </div>
                </section>
            </main>

            {/* Mobile detail */}
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
                                    Work Details
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
                                <WorkDetails
                                    item={selectedItem}
                                />
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    )
}

function WorkDetails({
    item,
}: {
    item: WorkItem | null
}) {
    if (!item) {
        return (
            <div className="flex min-h-[650px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <div className="text-center">
                    <Gavel className="mx-auto h-10 w-10 text-zinc-700" />
                    <p className="mt-4 text-sm text-zinc-400">
                        Select a work item
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
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-400/[0.06]">
                            <TypeIcon
                                type={item.type}
                            />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight">
                                    {item.title}
                                </h2>

                                <StatusBadge
                                    status={
                                        item.status
                                    }
                                />
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                                {item.type}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-zinc-600" />
                                    {item.clientName}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-zinc-600" />
                                    Due {item.dueDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button className="rounded-lg p-2 text-zinc-600 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-6 border-t border-white/[0.06] pt-5">
                    <p className="text-xs leading-6 text-zinc-500">
                        {item.description}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                        Status
                    </p>
                    <div className="mt-2">
                        <StatusBadge
                            status={
                                item.status
                            }
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                        Priority
                    </p>
                    <div className="mt-2">
                        <PriorityBadge
                            priority={
                                item.priority
                            }
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                        Assigned
                    </p>
                    <p className="mt-2 text-xs text-white">
                        {item.assignedDate}
                    </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                        Updated
                    </p>
                    <p className="mt-2 text-xs text-white">
                        {item.lastUpdated}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button className="rounded-xl bg-blue-500/10 py-3 text-xs font-medium text-blue-400 ring-1 ring-blue-400/20">
                    Open Work
                </button>

                <button className="rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-xs text-zinc-300">
                    View Client
                </button>

                <button className="rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-xs text-zinc-300">
                    Documents
                </button>

                <button className="rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-xs text-zinc-300">
                    Activity
                </button>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                        <History className="h-4 w-4 text-zinc-400" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">
                            Work Context
                        </h3>

                        <p className="text-xs text-zinc-600">
                            Information connected to this assignment
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                        <span className="text-xs text-zinc-600">
                            Client
                        </span>

                        <span className="text-xs text-white">
                            {item.clientName}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                        <span className="text-xs text-zinc-600">
                            Work Type
                        </span>

                        <span className="text-xs text-white">
                            {item.type}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                        <span className="text-xs text-zinc-600">
                            Due Date
                        </span>

                        <span className="text-xs text-white">
                            {item.dueDate}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-600">
                            Client ID
                        </span>

                        <span className="text-xs text-zinc-400">
                            {item.clientId}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function BriefcaseIcon() {
    return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10">
            <FileCheck2 className="h-5 w-5 text-blue-400" />
        </div>
    )
}