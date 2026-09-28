// app/admin/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    FileText,
    RefreshCw,
    Shield,
    Scale,
    Building2,
    TrendingUp,
    Activity,
    UserCog,
    BarChart3,
    Clock,
    AlertCircle,
    Users,
    Inbox,
} from 'lucide-react'

// ---------- API base ----------
const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'

// ---------- Types (matching the real API response) ----------

type Overview = {
    totalBusinesses: number
    totalUsers: number
    totalLawyers: number
    totalContractRequests: number
    pendingContractRequests: number
    assignedContractRequests: number
    convertedContractRequests: number
    totalContracts: number
    activeContracts: number
    reviewContracts: number
    executedContracts: number
    pendingInvitations: number
}

type StatusCount = { _id: string; count: number }

type ProfessionalRef = {
    _id: string
    fullName: string
    email: string
    role: string
}

type BusinessRef = {
    _id: string
    companyName: string
}

type RecentContractRequest = {
    _id: string
    priority?: string
    status?: string
    title?: string
    contractType?: string
    description?: string
    requestNumber?: string
    expectedDeliveryDate?: string
    createdAt?: string
    business?: BusinessRef
    assignedProfessional?: ProfessionalRef
}

type RecentContract = {
    _id: string
    status?: string
    priority?: string
    title?: string
    contractType?: string
    contractNumber?: string
    createdAt?: string
    updatedAt?: string
    effectiveDate?: string
    expiryDate?: string
    business?: BusinessRef
    assignedProfessional?: ProfessionalRef
    counterparty?: { name?: string; company?: string }
}

type AdminStatsData = {
    overview: Overview
    requestStatusStats: StatusCount[]
    contractStatusStats: StatusCount[]
    userRoleStats: StatusCount[]
    recentContractRequests: RecentContractRequest[]
    recentContracts: RecentContract[]
}

type AdminStatsResponse = {
    success: boolean
    message: string
    data: AdminStatsData
}

// ---------- UI types ----------

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
    status?: string
    priority?: string
    dueDate?: string
}

type ContractRow = {
    id: string
    title: string
    contractNumber: string
    contractType: string
    business: string
    professional: string
    status: string
    priority?: string
    date?: string
}

type BusinessRow = {
    id: string
    name: string
    contracts: number
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

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return (
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('token')
    )
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

    // Normalise keys like "Internal Review" -> "internal-review"
    const key = status.toLowerCase().trim().replace(/\s+/g, '-')
    const colors: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        executed: 'bg-green-500/10 text-green-400 border-green-500/20',
        verified: 'bg-green-500/10 text-green-400 border-green-500/20',
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
        approved: 'bg-green-500/10 text-green-400 border-green-500/20',
        converted: 'bg-green-500/10 text-green-400 border-green-500/20',
        'internal-review':
            'bg-amber-500/10 text-amber-400 border-amber-500/20',
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
            {status}
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

function ErrorState({
    message,
    onRetry,
}: {
    message: string
    onRetry: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-red-400/70" />
            <h3 className="text-sm font-medium text-gray-300">
                Failed to load data
            </h3>
            <p className="mt-1 max-w-sm text-xs text-gray-600">{message}</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-400/20"
            >
                Try again
            </button>
        </div>
    )
}

// ---------- Quick actions ----------

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

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState<AdminStatsData | null>(null)

    // ----- Fetch -----
    const fetchStats = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        setError(null)

        try {
            const token = getAuthToken()

            const res = await fetch(`${API_BASE}/admin/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                // credentials: 'include', // if using httpOnly cookies
            })

            if (!res.ok) {
                if (res.status === 401)
                    throw new Error('Unauthorized. Please sign in again.')
                if (res.status === 403)
                    throw new Error('Forbidden. You do not have admin access.')
                throw new Error(`Request failed with status ${res.status}`)
            }

            const json: AdminStatsResponse = await res.json()

            // ⬇️ KEY FIX: unwrap the `data` envelope
            if (!json.success || !json.data) {
                throw new Error(json.message || 'Malformed response from server.')
            }

            setStats(json.data)
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Something went wrong while fetching stats.'
            setError(message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const handleRefresh = () => fetchStats(true)

    // ----- Derive stat cards -----
    const statCards: StatCard[] = useMemo(() => {
        if (!stats) return []
        const o = stats.overview

        return [
            {
                label: 'Total Lawyers',
                value: o.totalLawyers ?? 0,
                delta: `${o.totalUsers ?? 0} total users`,
                trend: 'up',
                icon: Scale,
                href: '/admin-dashboard/lawyers',
            },
            {
                label: 'Businesses',
                value: o.totalBusinesses ?? 0,
                delta: `${o.pendingInvitations ?? 0} pending invites`,
                trend: 'up',
                icon: Building2,
                href: '/admin-dashboard/businesses',
            },
            {
                label: 'Active Contracts',
                value: o.activeContracts ?? 0,
                delta: `${o.totalContracts ?? 0} total contracts`,
                trend: 'up',
                icon: FileText,
                href: '/admin-dashboard/contracts',
            },
            {
                label: 'Review Contracts',
                value: o.reviewContracts ?? 0,
                delta: `${o.pendingContractRequests ?? 0} pending requests`,
                trend: o.reviewContracts > 0 ? 'down' : 'flat',
                icon: Shield,
                href: '/admin/contracts',
            },
        ]
    }, [stats])

    // ----- Derive "Revenue Snapshot" as request/contract pipeline -----
    const pipeline = useMemo(() => {
        if (!stats) return []
        const o = stats.overview
        return [
            {
                label: 'Contract Requests',
                value: String(o.totalContractRequests ?? 0),
                delta: `${o.pendingContractRequests ?? 0} pending`,
            },
            {
                label: 'Converted',
                value: String(o.convertedContractRequests ?? 0),
                delta: `${o.assignedContractRequests ?? 0} assigned`,
            },
            {
                label: 'Total Contracts',
                value: String(o.totalContracts ?? 0),
                delta: `${o.executedContracts ?? 0} executed`,
            },
            {
                label: 'Pending Invites',
                value: String(o.pendingInvitations ?? 0),
                delta: `${o.totalUsers ?? 0} users`,
            },
        ]
    }, [stats])

    // ----- "Needs Attention" from recentContractRequests -----
    const attention: ActivityItem[] = useMemo(() => {
        if (!stats) return []
        return stats.recentContractRequests.slice(0, 6).map((r) => ({
            id: r._id,
            title: r.title || r.contractType || 'Contract request',
            meta: `${r.business?.companyName ?? 'Unknown business'} • ${r.assignedProfessional?.fullName ?? 'Unassigned'
                }${r.requestNumber ? ` • ${r.requestNumber}` : ''}`,
            status: r.status,
            priority: r.priority,
            dueDate: r.expectedDeliveryDate,
        }))
    }, [stats])

    // ----- "Recent Activity" from recentContracts -----
    const recentContracts: ContractRow[] = useMemo(() => {
        if (!stats) return []
        return stats.recentContracts.map((c) => ({
            id: c._id,
            title: c.title || c.contractType || 'Contract',
            contractNumber: c.contractNumber ?? '—',
            contractType: c.contractType ?? '—',
            business: c.business?.companyName ?? '—',
            professional: c.assignedProfessional?.fullName ?? 'Unassigned',
            status: c.status ?? '—',
            priority: c.priority,
            date: c.createdAt,
        }))
    }, [stats])

    // ----- Businesses aggregated from recentContracts -----
    const businesses: BusinessRow[] = useMemo(() => {
        if (!stats) return []
        const map = new Map<string, BusinessRow>()
        for (const c of stats.recentContracts) {
            const id = c.business?._id
            const name = c.business?.companyName
            if (!id || !name) continue
            const existing = map.get(id)
            if (existing) {
                existing.contracts += 1
            } else {
                map.set(id, {
                    id,
                    name,
                    contracts: 1,
                    status: 'active',
                })
            }
        }
        return Array.from(map.values())
    }, [stats])

    // ----- Platform health from status stats + role stats -----
    const platformHealth = useMemo(() => {
        if (!stats) return []
        const o = stats.overview
        const totalRoleUsers = stats.userRoleStats.reduce(
            (sum, r) => sum + r.count,
            0
        )
        return [
            {
                label: 'Total Users',
                value: String(totalRoleUsers || o.totalUsers || 0),
                status: 'Healthy',
                tone: 'good' as const,
            },
            {
                label: 'Contract Requests',
                value: `${o.convertedContractRequests}/${o.totalContractRequests} converted`,
                status:
                    o.pendingContractRequests > 0 ? 'Needs review' : 'Healthy',
                tone:
                    o.pendingContractRequests > 0
                        ? ('warn' as const)
                        : ('good' as const),
            },
            {
                label: 'Contracts in Review',
                value: String(o.reviewContracts ?? 0),
                status: o.reviewContracts > 0 ? 'Needs review' : 'Healthy',
                tone:
                    o.reviewContracts > 0
                        ? ('warn' as const)
                        : ('good' as const),
            },
            {
                label: 'Pending Invitations',
                value: String(o.pendingInvitations ?? 0),
                status: o.pendingInvitations > 0 ? 'Needs review' : 'Healthy',
                tone:
                    o.pendingInvitations > 0
                        ? ('warn' as const)
                        : ('good' as const),
            },
        ]
    }, [stats])

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
                            disabled={refreshing || loading}
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
                {/* Loading / error */}
                {loading && !stats && (
                    <Card className="mb-8">
                        <Skeleton rows={6} />
                    </Card>
                )}

                {error && !stats && (
                    <Card className="mb-8">
                        <ErrorState
                            message={error}
                            onRetry={() => fetchStats()}
                        />
                    </Card>
                )}

                {stats && (
                    <>
                        {error && (
                            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Stat cards */}
                        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {statCards.map((item, index) => {
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
                                            onClick={() =>
                                                router.push(item.href)
                                            }
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
                                                            className={`mt-1 text-xs ${item.trend ===
                                                                'up'
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

                        {/* Pipeline snapshot */}
                        <Card className="mb-8">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Pipeline Snapshot
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Contract request &amp; execution
                                        health
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push('/admin/analytics')
                                    }
                                    className="text-xs text-amber-400 hover:text-amber-300"
                                >
                                    View analytics
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {pipeline.map((item) => (
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
                                            Recent Contract Requests
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Newest requests across the platform
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                '/admin/contract-requests'
                                            )
                                        }
                                        className="text-xs text-amber-400 hover:text-amber-300"
                                    >
                                        View all
                                    </button>
                                </div>

                                {attention.length === 0 ? (
                                    <EmptyState
                                        title="No requests yet"
                                        description="Incoming contract requests will appear here."
                                        icon={Inbox}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        {attention.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/contract-requests/${item.id}`
                                                    )
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
                                            Recent Contracts
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Latest contracts created
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.push('/admin/contracts')
                                        }
                                        className="text-xs text-amber-400 hover:text-amber-300"
                                    >
                                        View all
                                    </button>
                                </div>

                                {recentContracts.length === 0 ? (
                                    <EmptyState
                                        title="No contracts yet"
                                        description="Contracts will appear here once created."
                                        icon={Activity}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        {recentContracts.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/contracts/${c.id}`
                                                    )
                                                }
                                                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-left transition hover:border-amber-400/30 hover:bg-white/[0.05]"
                                            >
                                                <FileText className="h-4 w-4 shrink-0 text-amber-400" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {c.title}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-gray-600">
                                                        {c.contractNumber} •{' '}
                                                        {c.business} •{' '}
                                                        {c.professional}
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    status={c.status}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Businesses + Role breakdown */}
                        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card>
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            Businesses
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Active on the platform
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

                                {businesses.length === 0 ? (
                                    <EmptyState
                                        title="No businesses yet"
                                        description="Business profiles will appear here once onboarded."
                                        icon={Building2}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        {businesses.map((b) => (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/businesses/${b.id}`
                                                    )
                                                }
                                                className="grid w-full grid-cols-[minmax(0,1fr)_80px_90px_20px] items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-left transition hover:border-amber-400/30 hover:bg-white/[0.05]"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-white">
                                                        {b.name}
                                                    </p>
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-sm text-gray-300">
                                                        {b.contracts}
                                                    </p>
                                                    <p className="text-[10px] text-gray-700">
                                                        Contracts
                                                    </p>
                                                </div>

                                                <div className="text-center">
                                                    <StatusBadge
                                                        status={b.status}
                                                    />
                                                </div>

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
                                            Users by Role
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Platform composition
                                        </p>
                                    </div>
                                </div>

                                {stats.userRoleStats.length === 0 ? (
                                    <EmptyState
                                        title="No user data"
                                        description="Role breakdown will appear here."
                                        icon={Users}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        {stats.userRoleStats.map((r) => (
                                            <div
                                                key={r._id}
                                                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Users className="h-4 w-4 text-gray-500" />
                                                    <p className="text-sm capitalize text-gray-300">
                                                        {r._id}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-medium text-white">
                                                    {r.count}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    {platformHealth.map((row) => (
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
                                            Jump directly into your admin
                                            workspace
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
                    </>
                )}

                <div className="mt-6 text-center text-xs text-gray-700">
                    Admin dashboard
                </div>
            </main>
        </div>
    )
}