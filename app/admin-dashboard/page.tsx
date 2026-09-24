// app/admin/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Briefcase,
    CheckCircle2,
    ChevronRight,
    FileText,
    MessageCircle,
    RefreshCw,
    Shield,
    Users,
    Building2,
    Scale,
    TrendingUp,
    DollarSign,
    Activity,
    UserCog,
    BarChart3,
    Clock,
} from 'lucide-react'

// ---------- Static demo data ----------

type StatCard = {
    label: string
    value: number
    delta?: string
    trend?: 'up' | 'down' | 'flat'
    icon: React.ComponentType<{ className?: string }>
    href: string
}

type ActivityItem = {
    id: string
    title: string
    meta: string
    kind: 'lawyer' | 'business' | 'contract' | 'compliance' | 'work'
    status?: string
    priority?: string
    dueDate?: string
}

type LawyerRow = {
    id: string
    name: string
    email: string
    specialization: string
    activeClients: number
    openWork: number
    status: string
}

type BusinessRow = {
    id: string
    name: string
    industry: string
    assignedLawyer: string
    contracts: number
    compliance: number
    status: string
}

// ---------- Helpers ----------

function formatDate(value?: string) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function getGreeting(hour: number) {
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

// ---------- Reusable UI ----------

const Card = ({
    children,
    className = '',
    clickable = false,
    onClick,
}: {
    children: React.ReactNode
    className?: string
    clickable?: boolean
    onClick?: () => void
}) => {
    const content = (
        <div
            className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 to-black/20 p-6 backdrop-blur-sm transition-all duration-300 ${clickable
                ? 'cursor-pointer hover:border-amber-400/40 hover:bg-black/50'
                : ''
                } ${className}`}
        >
            {children}
        </div>
    )

    if (!clickable) return content

    return (
        <button type="button" onClick={onClick} className="w-full text-left">
            {content}
        </button>
    )
}

function StatusBadge({ status }: { status?: string }) {
    if (!status) return null

    const key = status.toLowerCase()
    const colors: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        verified: 'bg-green-500/10 text-green-400 border-green-500/20',
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
        approved: 'bg-green-500/10 text-green-400 border-green-500/20',
        'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
        suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
        inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    }

    const className =
        colors[key] || 'bg-amber-500/10 text-amber-400 border-amber-500/20'

    return (
        <span
            className={`inline-flex rounded-lg border px-2 py-1 text-xs font-medium ${className}`}
        >
            {status.replace(/-/g, ' ')}
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
            {priority}
        </span>
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon className="mb-4 h-10 w-10 text-gray-700" />
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
            <p className="mt-1 text-xs text-gray-600">{description}</p>
        </div>
    )
}

function Skeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="h-12 animate-pulse rounded-xl bg-white/[0.04]"
                />
            ))}
        </div>
    )
}

// ---------- Static demo data ----------

const STAT_CARDS: StatCard[] = [
    {
        label: 'Total Lawyers',
        value: 148,
        delta: '+6 this month',
        trend: 'up',
        icon: Scale,
        href: '/admin/lawyers',
    },
    {
        label: 'Businesses',
        value: 312,
        delta: '+18 this month',
        trend: 'up',
        icon: Building2,
        href: '/admin/businesses',
    },
    {
        label: 'Active Contracts',
        value: 487,
        delta: '+24 this week',
        trend: 'up',
        icon: FileText,
        href: '/admin/contracts',
    },
    {
        label: 'Pending Compliance',
        value: 37,
        delta: '8 overdue',
        trend: 'down',
        icon: Shield,
        href: '/admin/compliance',
    },
]

const REVENUE_SNAPSHOT = [
    { label: 'MRR', value: '₹12.4L', delta: '+8.2%' },
    { label: 'ARR', value: '₹1.48Cr', delta: '+11.5%' },
    { label: 'Active Subscriptions', value: '286', delta: '+14' },
    { label: 'Churn', value: '2.1%', delta: '-0.4%' },
]

const ACTIVITY: ActivityItem[] = [
    {
        id: 'a1',
        title: 'Compliance deadline missed — GST filing',
        meta: 'Acme Industries • Assigned to Adv. Rao',
        kind: 'compliance',
        status: 'overdue',
        priority: 'urgent',
        dueDate: '2026-09-18',
    },
    {
        id: 'a2',
        title: 'New lawyer application pending review',
        meta: 'Adv. Priya Menon • Corporate Law',
        kind: 'lawyer',
        status: 'review',
        priority: 'high',
    },
    {
        id: 'a3',
        title: 'Contract renewal requires approval',
        meta: 'Vertex Solutions • MSA Renewal',
        kind: 'contract',
        status: 'pending',
        priority: 'high',
        dueDate: '2026-09-28',
    },
    {
        id: 'a4',
        title: 'Business onboarding incomplete',
        meta: 'Nova Retail • KYC pending',
        kind: 'business',
        status: 'pending',
        priority: 'medium',
    },
    {
        id: 'a5',
        title: 'Legal work item escalated',
        meta: 'Zenith Pharma • Employment dispute',
        kind: 'work',
        priority: 'urgent',
        status: 'in-progress',
        dueDate: '2026-09-25',
    },
    {
        id: 'a6',
        title: 'New compliance item assigned',
        meta: 'Bright Logistics • PF filing',
        kind: 'compliance',
        status: 'pending',
        priority: 'medium',
        dueDate: '2026-10-05',
    },
]

const LAWYERS: LawyerRow[] = [
    {
        id: 'l1',
        name: 'Adv. Ananya Rao',
        email: 'ananya.rao@nyaymitra.in',
        specialization: 'Corporate & M&A',
        activeClients: 12,
        openWork: 9,
        status: 'active',
    },
    {
        id: 'l2',
        name: 'Adv. Rohit Sharma',
        email: 'rohit.sharma@nyaymitra.in',
        specialization: 'Tax & Compliance',
        activeClients: 8,
        openWork: 14,
        status: 'active',
    },
    {
        id: 'l3',
        name: 'Adv. Priya Menon',
        email: 'priya.menon@nyaymitra.in',
        specialization: 'Employment Law',
        activeClients: 5,
        openWork: 3,
        status: 'review',
    },
    {
        id: 'l4',
        name: 'Adv. Karan Verma',
        email: 'karan.verma@nyaymitra.in',
        specialization: 'IP & Tech',
        activeClients: 10,
        openWork: 7,
        status: 'active',
    },
    {
        id: 'l5',
        name: 'Adv. Sneha Iyer',
        email: 'sneha.iyer@nyaymitra.in',
        specialization: 'Real Estate',
        activeClients: 0,
        openWork: 0,
        status: 'suspended',
    },
]

const BUSINESSES: BusinessRow[] = [
    {
        id: 'b1',
        name: 'Acme Industries Pvt Ltd',
        industry: 'Manufacturing',
        assignedLawyer: 'Adv. Rohit Sharma',
        contracts: 14,
        compliance: 6,
        status: 'active',
    },
    {
        id: 'b2',
        name: 'Vertex Solutions',
        industry: 'IT Services',
        assignedLawyer: 'Adv. Ananya Rao',
        contracts: 9,
        compliance: 3,
        status: 'active',
    },
    {
        id: 'b3',
        name: 'Nova Retail',
        industry: 'Retail',
        assignedLawyer: 'Unassigned',
        contracts: 0,
        compliance: 2,
        status: 'pending',
    },
    {
        id: 'b4',
        name: 'Zenith Pharma',
        industry: 'Healthcare',
        assignedLawyer: 'Adv. Karan Verma',
        contracts: 11,
        compliance: 4,
        status: 'active',
    },
    {
        id: 'b5',
        name: 'Bright Logistics',
        industry: 'Logistics',
        assignedLawyer: 'Adv. Priya Menon',
        contracts: 6,
        compliance: 5,
        status: 'active',
    },
]

const QUICK_ACTIONS = [
    { label: 'Lawyers', icon: Scale, href: '/admin/lawyers' },
    { label: 'Businesses', icon: Building2, href: '/admin/businesses' },
    { label: 'Contracts', icon: FileText, href: '/admin/contracts' },
    { label: 'Compliance', icon: Shield, href: '/admin/compliance' },
    { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { label: 'Team', icon: UserCog, href: '/admin/team' },
]

// ---------- Page ----------

export default function AdminDashboardPage() {
    const router = useRouter()
    const [greeting] = useState(() => getGreeting(new Date().getHours()))
    const [refreshing, setRefreshing] = useState(false)

    // Purely for demo — simulates a refresh
    const handleRefresh = () => {
        setRefreshing(true)
        window.setTimeout(() => setRefreshing(false), 700)
    }

    const attention = useMemo(() => ACTIVITY.slice(0, 6), [])

    const recentLawyers = useMemo(() => LAWYERS.slice(0, 5), [])
    const recentBusinesses = useMemo(() => BUSINESSES.slice(0, 5), [])

    return (
        <div className="min-h-full text-white">
            {/* Header */}
            <div className="border-b border-white/[0.05] bg-black/40 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="mb-1 text-sm font-medium text-amber-400">
                                {greeting},
                            </p>

                            <h1 className="text-4xl font-light tracking-tight text-white lg:text-5xl">
                                Admin Console
                            </h1>

                            <p className="mt-2 text-sm text-gray-500">
                                Platform-wide overview of lawyers, businesses,
                                contracts, and compliance.
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-400">
                                    Super Admin
                                </span>
                                <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs text-green-400">
                                    All systems operational
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 transition hover:bg-white/[0.08] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-5 w-5 text-gray-400 ${refreshing ? 'animate-spin' : ''
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                {/* Stat cards */}
                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {STAT_CARDS.map((item, index) => {
                        const Icon = item.icon

                        return (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    clickable
                                    onClick={() => router.push(item.href)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                {item.label}
                                            </p>
                                            <p className="mt-2 text-4xl font-light">
                                                {item.value}
                                            </p>
                                            {item.delta && (
                                                <p
                                                    className={`mt-1 text-xs ${item.trend === 'up'
                                                        ? 'text-green-400'
                                                        : item.trend ===
                                                            'down'
                                                            ? 'text-red-400'
                                                            : 'text-gray-500'
                                                        }`}
                                                >
                                                    {item.delta}
                                                </p>
                                            )}
                                        </div>

                                        <Icon className="h-5 w-5 text-amber-400/70" />
                                    </div>

                                    <div className="mt-4 flex items-center gap-1 text-xs text-amber-400">
                                        Open
                                        <ArrowRight className="h-3 w-3" />
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Revenue snapshot */}
                <Card className="mb-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Revenue Snapshot
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Subscription health at a glance
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push('/admin/analytics')}
                            className="text-xs text-amber-400 hover:text-amber-300"
                        >
                            View analytics
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {REVENUE_SNAPSHOT.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        {item.label}
                                    </p>
                                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                                </div>
                                <p className="mt-2 text-2xl font-light">
                                    {item.value}
                                </p>
                                <p className="mt-1 text-xs text-green-400">
                                    {item.delta}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Attention + Activity */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Needs Your Attention
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Urgent and high-priority items across the
                                    platform
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push('/admin/alerts')}
                                className="text-xs text-amber-400 hover:text-amber-300"
                            >
                                View all
                            </button>
                        </div>

                        {attention.length === 0 ? (
                            <EmptyState
                                title="You're all caught up"
                                description="No urgent items require your attention."
                                icon={CheckCircle2}
                            />
                        ) : (
                            <div className="space-y-2">
                                {attention.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            router.push('/admin/alerts')
                                        }
                                        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] p-4 text-left transition hover:border-amber-400/30 hover:bg-white/[0.05]"
                                    >
                                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-600">
                                                {item.meta}
                                                {item.dueDate
                                                    ? ` • Due ${formatDate(
                                                        item.dueDate
                                                    )}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <PriorityBadge
                                            priority={item.priority}
                                        />
                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Recent Activity
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    What's happening across the platform
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push('/admin/analytics/activity')}
                                className="text-xs text-amber-400 hover:text-amber-300"
                            >
                                View all
                            </button>
                        </div>

                        <div className="space-y-2">
                            {ACTIVITY.map((item) => (
                                <div
                                    key={`act-${item.id}`}
                                    className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                                >
                                    <Activity className="h-4 w-4 shrink-0 text-amber-400" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-gray-600">
                                            {item.meta}
                                        </p>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Lawyers + Businesses */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Lawyers
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Recently active on the platform
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push('/admin/lawyers')}
                                className="flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300"
                            >
                                View all
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {recentLawyers.map((lawyer) => (
                                <button
                                    key={lawyer.id}
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/admin/lawyers/${lawyer.id}`
                                        )
                                    }
                                    className="grid w-full grid-cols-[minmax(0,1fr)_70px_70px_90px_20px] items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-left transition hover:border-amber-400/30 hover:bg-white/[0.05]"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">
                                            {lawyer.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-gray-600">
                                            {lawyer.specialization}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-300">
                                            {lawyer.activeClients}
                                        </p>
                                        <p className="text-[10px] text-gray-700">
                                            Clients
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-300">
                                            {lawyer.openWork}
                                        </p>
                                        <p className="text-[10px] text-gray-700">
                                            Work
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <StatusBadge
                                            status={lawyer.status}
                                        />
                                    </div>

                                    <ChevronRight className="h-4 w-4 text-gray-600" />
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Businesses
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Recently onboarded clients
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push('/admin/businesses')
                                }
                                className="flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300"
                            >
                                View all
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {recentBusinesses.map((business) => (
                                <button
                                    key={business.id}
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/admin/businesses/${business.id}`
                                        )
                                    }
                                    className="grid w-full grid-cols-[minmax(0,1fr)_70px_80px_90px_20px] items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-left transition hover:border-amber-400/30 hover:bg-white/[0.05]"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">
                                            {business.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-gray-600">
                                            {business.industry} •{' '}
                                            {business.assignedLawyer}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-300">
                                            {business.contracts}
                                        </p>
                                        <p className="text-[10px] text-gray-700">
                                            Contracts
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-300">
                                            {business.compliance}
                                        </p>
                                        <p className="text-[10px] text-gray-700">
                                            Compliance
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <StatusBadge
                                            status={business.status}
                                        />
                                    </div>

                                    <ChevronRight className="h-4 w-4 text-gray-600" />
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Platform health + Quick actions */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Platform Health
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Live operational status
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    label: 'API uptime (30d)',
                                    value: '99.98%',
                                    status: 'Healthy',
                                    tone: 'good',
                                },
                                {
                                    label: 'Avg. response time',
                                    value: '142 ms',
                                    status: 'Healthy',
                                    tone: 'good',
                                },
                                {
                                    label: 'Failed contract syncs',
                                    value: '3',
                                    status: 'Needs review',
                                    tone: 'warn',
                                },
                                {
                                    label: 'Compliance cron jobs',
                                    value: 'All passing',
                                    status: 'Healthy',
                                    tone: 'good',
                                },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <p className="text-sm text-gray-300">
                                            {row.label}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm text-white">
                                            {row.value}
                                        </p>
                                        <span
                                            className={`rounded-lg border px-2 py-1 text-xs font-medium ${row.tone === 'good'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}
                                        >
                                            {row.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Quick Actions
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Jump directly into your admin workspace
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            {QUICK_ACTIONS.map((action) => {
                                const Icon = action.icon

                                return (
                                    <motion.button
                                        key={action.label}
                                        type="button"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() =>
                                            router.push(action.href)
                                        }
                                        className="rounded-xl border border-white/[0.06] bg-black/40 p-4 transition hover:border-amber-400/30 hover:bg-white/[0.04]"
                                    >
                                        <Icon className="mx-auto mb-2 h-5 w-5 text-amber-400" />
                                        <p className="text-center text-xs font-medium text-white">
                                            {action.label}
                                        </p>
                                    </motion.button>
                                )
                            })}
                        </div>
                    </Card>
                </div>

                <div className="mt-6 text-center text-xs text-gray-700">
                    Admin dashboard • Static demo data
                </div>
            </main>
        </div>
    )
}