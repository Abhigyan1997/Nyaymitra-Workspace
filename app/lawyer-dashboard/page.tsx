'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
    Upload,
    Users,
    Building2,
} from 'lucide-react'

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'

async function apiFetch<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
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
            message = body?.message || body?.error || message
        } catch {
            // Ignore non-JSON responses.
        }

        throw new Error(message)
    }

    return response.json()
}

function getArray<T>(result: any): T[] {
    if (Array.isArray(result?.data)) return result.data
    if (Array.isArray(result?.clients)) return result.clients
    if (Array.isArray(result?.contracts)) return result.contracts
    if (Array.isArray(result?.compliance)) return result.compliance
    if (Array.isArray(result?.documents)) return result.documents
    if (Array.isArray(result?.work)) return result.work
    return []
}

function getId(item: any) {
    return String(item?._id || item?.id || '')
}

function getBusinessName(item: any) {
    return (
        item?.business?.companyName ||
        item?.client?.companyName ||
        item?.business?.legalName ||
        item?.client?.legalName ||
        item?.companyName ||
        item?.client ||
        'Client'
    )
}

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

type Client = {
    id: string
    name: string
    openWork: number
    contracts: number
    status: string
}

type WorkItem = {
    id: string
    title: string
    type: string
    client: string
    dueDate?: string
    status?: string
    priority?: string
    description?: string
}

type Contract = {
    id: string
    title: string
    client: string
    status?: string
    dueDate?: string
}

type ComplianceItem = {
    id: string
    name: string
    client: string
    status?: string
    dueDate?: string
    priority?: string
    description?: string
}

type Document = {
    id: string
    name: string
    client: string
    createdAt?: string
    category?: string
}

type Lawyer = {
    id: string
    fullName: string
    email: string
    profilePhoto?: string
    specialization?: string[]
    practiceAreas?: string[]
}

type DashboardData = {
    lawyer: Lawyer
    clients: Client[]
    work: WorkItem[]
    contracts: Contract[]
    compliance: ComplianceItem[]
    documents: Document[]
}

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
                ? 'cursor-pointer hover:border-blue-400/40 hover:bg-black/50'
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
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
        'in-progress':
            'bg-blue-500/10 text-blue-400 border-blue-500/20',
        pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
        cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        approved: 'bg-green-500/10 text-green-400 border-green-500/20',
        executed: 'bg-green-500/10 text-green-400 border-green-500/20',
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
    }

    const className =
        colors[key] ||
        'bg-blue-500/10 text-blue-400 border-blue-500/20'

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

function ErrorState({
    message,
    onRetry,
}: {
    message: string
    onRetry: () => void
}) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-950 px-6 py-12">
            <Card className="mx-auto mt-20 max-w-md">
                <div className="text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
                    <h2 className="text-lg font-semibold text-white">
                        Unable to load dashboard
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">{message}</p>
                    <button
                        onClick={onRetry}
                        className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                    >
                        Try Again
                    </button>
                </div>
            </Card>
        </div>
    )
}

export default function LawyerDashboardPage() {
    const router = useRouter()

    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [greeting, setGreeting] = useState('Hello')

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const token = localStorage.getItem('token')

            if (!token) {
                setError('NO_TOKEN')
                return
            }

            const [
                clientsResponse,
                workResponse,
                contractsResponse,
                complianceResponse,
                documentsResponse,
            ] = await Promise.all([
                apiFetch<any>('/lawyer/clients', token),
                apiFetch<any>('/lawyer-works/work?page=1&limit=20', token),
                apiFetch<any>('/lawyer/contracts?page=1&limit=20', token),
                apiFetch<any>('/lawyer/compliance?page=1&limit=20', token),
                apiFetch<any>('/lawyer/documents?page=1&limit=20', token),
            ])

            const rawClients = getArray<any>(clientsResponse)
            const rawWork = getArray<any>(workResponse)
            const rawContracts = getArray<any>(contractsResponse)
            const rawCompliance = getArray<any>(complianceResponse)
            const rawDocuments = getArray<any>(documentsResponse)

            let storedUser: any = {}

            try {
                storedUser = JSON.parse(
                    localStorage.getItem('user') || '{}'
                )
            } catch {
                storedUser = {}
            }

            const clients: Client[] = rawClients.map((item: any) => {
                const client = item?.client || item?.business || item

                return {
                    id: String(
                        client?._id ||
                        item?._id ||
                        item?.id ||
                        item?.assignmentId ||
                        ''
                    ),
                    name:
                        client?.companyName ||
                        item?.companyName ||
                        client?.legalName ||
                        'Client',
                    openWork:
                        Number(
                            item?.openWork ??
                            item?.stats?.openWork ??
                            0
                        ) || 0,
                    contracts:
                        Number(
                            item?.contracts ??
                            item?.stats?.contracts ??
                            0
                        ) || 0,
                    status:
                        client?.status ||
                        item?.status ||
                        item?.assignmentStatus ||
                        'Active',
                }
            })

            const work: WorkItem[] = rawWork.map((item: any) => ({
                id: getId(item),
                title: item?.title || 'Work item',
                type:
                    item?.workType ||
                    item?.sourceType ||
                    'Task',
                client: getBusinessName(item),
                dueDate: item?.dueDate,
                status: item?.status,
                priority: item?.priority,
                description: item?.description,
            }))

            const contracts: Contract[] = rawContracts.map(
                (item: any) => ({
                    id: getId(item),
                    title: item?.title || 'Contract',
                    client: getBusinessName(item),
                    status: item?.status,
                    dueDate:
                        item?.expiryDate ||
                        item?.renewalDate ||
                        item?.effectiveDate,
                })
            )

            const compliance: ComplianceItem[] =
                rawCompliance.map((item: any) => ({
                    id: getId(item),
                    name: item?.name || 'Compliance item',
                    client: getBusinessName(item),
                    status: item?.status,
                    dueDate: item?.dueDate,
                    priority: item?.priority,
                    description: item?.description,
                }))

            const documents: Document[] = rawDocuments.map(
                (item: any) => ({
                    id: getId(item),
                    name:
                        item?.name ||
                        item?.originalName ||
                        'Document',
                    client: getBusinessName(item),
                    createdAt:
                        item?.createdAt ||
                        item?.uploadedAt ||
                        item?.updatedAt,
                    category: item?.category,
                })
            )

            setGreeting(getGreeting(new Date().getHours()))

            setData({
                lawyer: {
                    id: String(
                        storedUser?._id ||
                        storedUser?.id ||
                        ''
                    ),
                    fullName:
                        storedUser?.fullName ||
                        'Legal Professional',
                    email: storedUser?.email || '',
                    profilePhoto:
                        storedUser?.profilePhoto,
                    specialization:
                        storedUser?.specialization,
                    practiceAreas:
                        storedUser?.practiceAreas,
                },
                clients,
                work,
                contracts,
                compliance,
                documents,
            })
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Something went wrong while loading your legal workspace.'

            if (message === 'NO_TOKEN') {
                setError('NO_TOKEN')
            } else {
                setError(message)
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        setGreeting(getGreeting(new Date().getHours()))
        fetchDashboard()

        const interval = window.setInterval(() => {
            setGreeting(getGreeting(new Date().getHours()))
        }, 60_000)

        return () => window.clearInterval(interval)
    }, [fetchDashboard])

    const totals = useMemo(() => {
        const clients = data?.clients || []
        const work = data?.work || []

        return {
            clients: clients.length,
            openWork: work.filter(
                (item) =>
                    item.status !== 'completed' &&
                    item.status !== 'cancelled'
            ).length,
            pendingActions:
                work.filter(
                    (item) =>
                        item.status === 'pending' ||
                        item.status === 'overdue'
                ).length +
                (data?.compliance || []).filter(
                    (item) =>
                        item.status === 'pending' ||
                        item.status === 'overdue'
                ).length,
            contracts: data?.contracts?.length || 0,
        }
    }, [data])

    const firstName =
        data?.lawyer?.fullName?.split(' ')[0] ||
        'Legal Professional'

    const openWork = (id: string) =>
        id
            ? router.push(`/lawyer/work/${encodeURIComponent(id)}`)
            : router.push('/lawyer/work')

    const openContract = (id: string) =>
        id
            ? router.push(
                `/lawyer/contracts/${encodeURIComponent(id)}`
            )
            : router.push('/lawyer/contracts')

    const openCompliance = (id: string) =>
        id
            ? router.push(
                `/lawyer/compliance/${encodeURIComponent(id)}`
            )
            : router.push('/lawyer/compliance')

    const openDocument = (id: string) =>
        id
            ? router.push(
                `/lawyer/documents/${encodeURIComponent(id)}`
            )
            : router.push('/lawyer/documents')

    const openClient = (id: string) => {
        router.push(
            `/lawyer/clients?clientId=${encodeURIComponent(id)}`
        )
    }

    if (error === 'NO_TOKEN') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-slate-950 px-6 py-12">
                <Card className="mx-auto mt-20 max-w-md">
                    <div className="text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
                        <h2 className="text-lg font-semibold text-white">
                            Authentication Required
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Please sign in again to access your dashboard.
                        </p>
                        <button
                            onClick={() => router.push('/signin')}
                            className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
                        >
                            Sign In
                        </button>
                    </div>
                </Card>
            </div>
        )
    }

    if (error && !loading) {
        return (
            <ErrorState
                message={error}
                onRetry={fetchDashboard}
            />
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-950 text-white">
            <div className="border-b border-white/[0.05] bg-black/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="mb-1 text-sm font-medium text-blue-400">
                                {greeting},
                            </p>

                            <h1 className="text-4xl font-light tracking-tight text-white lg:text-5xl">
                                {loading ? 'Loading...' : firstName}
                            </h1>

                            <p className="mt-2 text-sm text-gray-500">
                                Your legal workspace at a glance.
                            </p>

                            {data?.lawyer?.specialization?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {data.lawyer.specialization
                                        .slice(0, 3)
                                        .map((item) => (
                                            <span
                                                key={item}
                                                className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs text-blue-400"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                </div>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={async () => {
                                setRefreshing(true)
                                await fetchDashboard()
                            }}
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
                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            label: 'Active Clients',
                            value: totals.clients,
                            icon: Building2,
                            href: '/dashboard/clients',
                        },
                        {
                            label: 'Open Work',
                            value: totals.openWork,
                            icon: Briefcase,
                            href: '/dashboard/work',
                        },
                        {
                            label: 'Pending Actions',
                            value: totals.pendingActions,
                            icon: AlertCircle,
                            href: '/dashboard/compliance',
                        },
                        {
                            label: 'Contracts',
                            value: totals.contracts,
                            icon: FileText,
                            href: '/dashboard/contracts',
                        },
                    ].map((item, index) => {
                        const Icon = item.icon

                        return (
                            <motion.div
                                key={item.label}
                                initial={{
                                    opacity: 0,
                                    y: 15,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    delay: index * 0.05,
                                }}
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
                                            {loading ? (
                                                <div className="mt-3 h-10 w-16 animate-pulse rounded bg-white/[0.05]" />
                                            ) : (
                                                <p className="mt-2 text-4xl font-light">
                                                    {item.value}
                                                </p>
                                            )}
                                        </div>

                                        <Icon className="h-5 w-5 text-blue-400/70" />
                                    </div>

                                    <div className="mt-4 flex items-center gap-1 text-xs text-blue-400">
                                        Open
                                        <ArrowRight className="h-3 w-3" />
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Needs Your Attention
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Urgent and high-priority items
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push('/lawyer/work')
                                }
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                View all
                            </button>
                        </div>

                        {loading ? (
                            <Skeleton rows={4} />
                        ) : (
                            (() => {
                                const attention = [
                                    ...(data?.work || [])
                                        .filter(
                                            (item) =>
                                                item.status === 'overdue' ||
                                                item.priority === 'urgent' ||
                                                item.priority === 'high'
                                        )
                                        .slice(0, 5)
                                        .map((item) => ({
                                            kind: 'work',
                                            id: item.id,
                                            title: item.title,
                                            client: item.client,
                                            dueDate: item.dueDate,
                                            priority: item.priority,
                                        })),
                                    ...(data?.compliance || [])
                                        .filter(
                                            (item) =>
                                                item.status === 'overdue' ||
                                                item.priority === 'high'
                                        )
                                        .slice(0, 5)
                                        .map((item) => ({
                                            kind: 'compliance',
                                            id: item.id,
                                            title: item.name,
                                            client: item.client,
                                            dueDate: item.dueDate,
                                            priority: item.priority,
                                        })),
                                ].slice(0, 6)

                                return attention.length === 0 ? (
                                    <EmptyState
                                        title="You're all caught up"
                                        description="No urgent work requires your attention."
                                        icon={CheckCircle2}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        {attention.map((item) => (
                                            <button
                                                key={`${item.kind}-${item.id}`}
                                                type="button"
                                                onClick={() =>
                                                    item.kind === 'work'
                                                        ? openWork(item.id)
                                                        : openCompliance(
                                                            item.id
                                                        )
                                                }
                                                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] p-4 text-left transition hover:border-blue-400/30 hover:bg-white/[0.05]"
                                            >
                                                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-600">
                                                        {item.client}
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
                                )
                            })()
                        )}
                    </Card>

                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    My Work
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Current assigned work items
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push('/lawyer/work')
                                }
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                View all
                            </button>
                        </div>

                        {loading ? (
                            <Skeleton rows={4} />
                        ) : data?.work?.length ? (
                            <div className="space-y-2">
                                {data.work.slice(0, 6).map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            openWork(item.id)
                                        }
                                        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] p-4 text-left transition hover:border-blue-400/30 hover:bg-white/[0.05]"
                                    >
                                        <Briefcase className="h-4 w-4 shrink-0 text-blue-400" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-gray-600">
                                                {item.type} •{' '}
                                                {item.client}
                                            </p>
                                        </div>
                                        <StatusBadge status={item.status} />
                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No work assigned"
                                description="New assigned work will appear here."
                                icon={Briefcase}
                            />
                        )}
                    </Card>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Clients
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Assigned businesses
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push('/lawyer/clients')
                                }
                                className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300"
                            >
                                View all
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {loading ? (
                            <Skeleton rows={5} />
                        ) : data?.clients?.length ? (
                            <div className="space-y-2">
                                {data.clients.slice(0, 8).map((client) => (
                                    <button
                                        key={client.id}
                                        type="button"
                                        onClick={() =>
                                            openClient(client.id)
                                        }
                                        className="grid w-full grid-cols-[minmax(0,1fr)_70px_80px_90px_20px] items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-left transition hover:border-blue-400/30 hover:bg-white/[0.05]"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">
                                                {client.name}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-600">
                                                Assigned client
                                            </p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-300">
                                                {client.openWork}
                                            </p>
                                            <p className="text-[10px] text-gray-700">
                                                Work
                                            </p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-300">
                                                {client.contracts}
                                            </p>
                                            <p className="text-[10px] text-gray-700">
                                                Contracts
                                            </p>
                                        </div>

                                        <div className="text-center text-xs capitalize text-gray-500">
                                            {client.status}
                                        </div>

                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No clients yet"
                                description="Assigned clients will appear here."
                                icon={Users}
                            />
                        )}
                    </Card>

                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Contract Activity
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Latest assigned contracts
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push('/lawyer/contracts')
                                }
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                View all
                            </button>
                        </div>

                        {loading ? (
                            <Skeleton rows={5} />
                        ) : data?.contracts?.length ? (
                            <div className="space-y-2">
                                {data.contracts
                                    .slice(0, 6)
                                    .map((contract) => (
                                        <button
                                            key={contract.id}
                                            type="button"
                                            onClick={() =>
                                                openContract(
                                                    contract.id
                                                )
                                            }
                                            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-left transition hover:border-blue-400/30 hover:bg-white/[0.05]"
                                        >
                                            <FileText className="h-4 w-4 shrink-0 text-blue-400" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {contract.title}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-gray-600">
                                                    {contract.client}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={
                                                    contract.status
                                                }
                                            />
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                        </button>
                                    ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No contracts"
                                description="Your contract list will appear here."
                                icon={FileText}
                            />
                        )}
                    </Card>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Compliance Deadlines
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Assigned compliance items
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push('/lawyer/compliance')
                                }
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                View all
                            </button>
                        </div>

                        {loading ? (
                            <Skeleton rows={5} />
                        ) : data?.compliance?.length ? (
                            <div className="space-y-2">
                                {data.compliance
                                    .slice(0, 6)
                                    .map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() =>
                                                openCompliance(
                                                    item.id
                                                )
                                            }
                                            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-left transition hover:border-blue-400/30 hover:bg-white/[0.05]"
                                        >
                                            <Shield className="h-4 w-4 shrink-0 text-amber-400" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {item.name}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-600">
                                                    {item.client}
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
                                            <StatusBadge
                                                status={item.status}
                                            />
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                        </button>
                                    ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No compliance items"
                                description="No compliance items are assigned."
                                icon={Shield}
                            />
                        )}
                    </Card>

                    <Card>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Recent Documents
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Latest client documents
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push('/lawyer/documents')
                                }
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                View all
                            </button>
                        </div>

                        {loading ? (
                            <Skeleton rows={5} />
                        ) : data?.documents?.length ? (
                            <div className="space-y-2">
                                {data.documents
                                    .slice(0, 6)
                                    .map((document) => (
                                        <button
                                            key={document.id}
                                            type="button"
                                            onClick={() =>
                                                openDocument(
                                                    document.id
                                                )
                                            }
                                            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-left transition hover:border-blue-400/30 hover:bg-white/[0.05]"
                                        >
                                            <FileText className="h-4 w-4 shrink-0 text-blue-400" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {document.name}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-gray-600">
                                                    {document.client}
                                                    {document.createdAt
                                                        ? ` • ${formatDate(
                                                            document.createdAt
                                                        )}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <span className="text-[10px] capitalize text-gray-600">
                                                {document.category ||
                                                    'document'}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                        </button>
                                    ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No documents"
                                description="Your recent documents will appear here."
                                icon={FileText}
                            />
                        )}
                    </Card>
                </div>

                <Card>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Quick Actions
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Jump directly into your workspace
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                        {[
                            {
                                label: 'Clients',
                                icon: Users,
                                href: '/lawyer/clients',
                            },
                            {
                                label: 'Contracts',
                                icon: FileText,
                                href: '/lawyer/contracts',
                            },
                            {
                                label: 'Documents',
                                icon: Upload,
                                href: '/lawyer/documents',
                            },
                            {
                                label: 'My Work',
                                icon: CheckCircle2,
                                href: '/lawyer/work',
                            },
                            {
                                label: 'Compliance',
                                icon: Shield,
                                href: '/lawyer/compliance',
                            },
                            {
                                label: 'Messages',
                                icon: MessageCircle,
                                href: '/lawyer/messages',
                            },
                        ].map((action) => {
                            const Icon = action.icon

                            return (
                                <motion.button
                                    key={action.label}
                                    type="button"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() =>
                                        router.push(
                                            action.href
                                        )
                                    }
                                    className="rounded-xl border border-white/[0.06] bg-black/40 p-4 transition hover:border-blue-400/30 hover:bg-white/[0.04]"
                                >
                                    <Icon className="mx-auto mb-2 h-5 w-5 text-blue-400" />
                                    <p className="text-center text-xs font-medium text-white">
                                        {action.label}
                                    </p>
                                </motion.button>
                            )
                        })}
                    </div>
                </Card>

                <div className="mt-6 text-center text-xs text-gray-700">
                    Live data source: {API_BASE}
                </div>
            </main>
        </div>
    )
}
