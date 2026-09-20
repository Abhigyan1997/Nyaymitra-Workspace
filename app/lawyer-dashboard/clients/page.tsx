'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    ChevronRight,
    Clock3,
    FileCheck2,
    FileText,
    Globe,
    Mail,
    MapPin,
    MoreHorizontal,
    Phone,
    Search,
    ShieldCheck,
    UserRound,
    Users,
    X,
    AlertCircle,
    Loader2,
    RefreshCw,
} from 'lucide-react'

interface Client {
    id: string
    companyName: string
    legalName: string
    industry: string
    companyType: string
    status: 'Active' | 'Pending' | 'Inactive'
    email: string
    phone: string
    website: string
    logo?: string

    address: {
        street: string
        city: string
        state: string
        country: string
        pincode: string
    }

    contactPerson: {
        name: string
        designation: string
        email: string
        phone: string
    }

    legalHealth: number

    stats: {
        openWork: number
        contracts: number
        compliance: number
        documents: number
        pendingActions: number
    }

    assignedDate: string
    assignmentStatus?: string
    workspaceRole?: string
    permissions?: string[]

    practiceAreas: string[]

    recentWork: {
        id: string
        title: string
        type: 'Contract' | 'Compliance' | 'Document'
        status: 'In Review' | 'Pending' | 'Completed' | 'Urgent'
        date: string
    }[]
}

type ApiClient = {
    _id?: string
    id?: string
    companyName?: string
    legalName?: string
    industry?: string
    companyType?: string
    status?: string
    email?: string
    phone?: string
    website?: string
    logo?: string
    legalHealthScore?: number
    legalHealth?: number
    businessNeeds?: string[]
    primaryContact?: {
        fullName?: string
        designation?: string
        email?: string
        phone?: string
    }
    address?: {
        street?: string
        city?: string
        state?: string
        country?: string
        pincode?: string
    }
    stats?: Partial<Client['stats']>
    recentWork?: Client['recentWork']
    createdAt?: string
    updatedAt?: string
    workspaceStatus?: string
}


type ApiClientListItem = {
    client?: ApiClient
    assignmentId?: string
    assignmentStatus?: string
    workspaceRole?: string
    permissions?: string[]
    assignedAt?: string
} & ApiClient

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

function getAuthHeaders(): HeadersInit {
    const token =
        typeof window !== 'undefined'
            ? localStorage.getItem('token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('authToken')
            : null

    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

async function apiRequest<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
    })

    let payload: any = null

    try {
        payload = await response.json()
    } catch {
        throw new Error(
            `Server returned an invalid response (${response.status})`
        )
    }

    if (!response.ok || payload?.success === false) {
        throw new Error(
            payload?.message ||
            `Request failed with status ${response.status}`
        )
    }

    return payload as T
}

function formatDate(value?: string) {
    if (!value) return '—'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date)
}

function normalizeClient(item: ApiClientListItem | ApiClient): Client {
    const nestedClient = 'client' in item && item.client ? item.client : item
    const assignment = 'client' in item ? item : {}
    const source = nestedClient || {}
    const contact = source.primaryContact || {}
    const address = source.address || {}

    const assignmentStatus = assignment.assignmentStatus
    const businessStatus = source.status

    let status: Client['status'] = 'Active'

    if (businessStatus === 'Inactive') {
        status = 'Inactive'
    } else if (
        assignmentStatus === 'invited' ||
        assignmentStatus === 'pending' ||
        source.workspaceStatus === 'Suspended'
    ) {
        status = 'Pending'
    }

    const rawStats = source.stats || {}

    return {
        id: String(source._id || source.id || ''),
        companyName: source.companyName || 'Unnamed business',
        legalName: source.legalName || source.companyName || '—',
        industry: source.industry || '—',
        companyType: source.companyType || '—',
        status,
        email: source.email || contact.email || '—',
        phone: source.phone || contact.phone || '—',
        website: source.website || '—',
        logo: source.logo,
        address: {
            street: address.street || '',
            city: address.city || '—',
            state: address.state || '—',
            country: address.country || 'India',
            pincode: address.pincode || '—',
        },
        contactPerson: {
            name: contact.fullName || '—',
            designation: contact.designation || '—',
            email: contact.email || source.email || '—',
            phone: contact.phone || source.phone || '—',
        },
        legalHealth: Number(
            source.legalHealthScore ?? source.legalHealth ?? 0
        ),
        stats: {
            openWork: Number(rawStats.openWork || 0),
            contracts: Number(rawStats.contracts || 0),
            compliance: Number(rawStats.compliance || 0),
            documents: Number(rawStats.documents || 0),
            pendingActions: Number(rawStats.pendingActions || 0),
        },
        assignedDate: formatDate(
            assignment.assignedAt || source.createdAt
        ),
        assignmentStatus,
        workspaceRole: assignment.workspaceRole,
        permissions: assignment.permissions || [],
        practiceAreas: Array.isArray(source.businessNeeds)
            ? source.businessNeeds
            : [],
        recentWork: Array.isArray(source.recentWork)
            ? source.recentWork
            : [],
    }
}

function StatusBadge({
    status,
}: {
    status: Client['status']
}) {
    const styles = {
        Active:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        Inactive:
            'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles[status]}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
        </span>
    )
}

function WorkStatusBadge({
    status,
}: {
    status: Client['recentWork'][number]['status']
}) {
    const styles = {
        'In Review':
            'border-blue-500/20 bg-blue-500/10 text-blue-400',
        Pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        Completed:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Urgent:
            'border-red-500/20 bg-red-500/10 text-red-400',
    }

    return (
        <span
            className={`rounded-full border px-2 py-1 text-[10px] font-medium ${styles[status]}`}
        >
            {status}
        </span>
    )
}

function HealthIndicator({
    score,
}: {
    score: number
}) {
    const state =
        score >= 80
            ? {
                label: 'Healthy',
                text: 'text-emerald-400',
                bar: 'bg-emerald-400',
            }
            : score >= 60
                ? {
                    label: 'Moderate',
                    text: 'text-amber-400',
                    bar: 'bg-amber-400',
                }
                : {
                    label: 'Needs Attention',
                    text: 'text-red-400',
                    bar: 'bg-red-400',
                }

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-medium ${state.text}`}>
                    {state.label}
                </span>

                <span className="text-xs text-zinc-500">
                    {score}/100
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.7 }}
                    className={`h-full rounded-full ${state.bar}`}
                />
            </div>
        </div>
    )
}

function StatBox({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number
}) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]">
                <Icon className="h-4 w-4 text-blue-400" />
            </div>

            <p className="text-xl font-semibold text-white">
                {value}
            </p>

            <p className="mt-1 text-[11px] text-zinc-500">
                {label}
            </p>
        </div>
    )
}

function ClientLogo({
    client,
    large = false,
}: {
    client: Client
    large?: boolean
}) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-blue-500/[0.07] ${large ? 'h-16 w-16' : 'h-11 w-11'
                }`}
        >
            {client.logo ? (
                <img
                    src={client.logo}
                    alt={`${client.companyName} logo`}
                    className="h-full w-full object-cover"
                />
            ) : (
                <Building2
                    className={`text-blue-400 ${large ? 'h-7 w-7' : 'h-5 w-5'
                        }`}
                />
            )}
        </div>
    )
}

type ApiCollectionPayload = {
    success: boolean
    data?: any[]
    items?: any[]
    clients?: any[]
}

function collectionFromPayload(payload: ApiCollectionPayload) {
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.items)) return payload.items
    if (Array.isArray(payload?.clients)) return payload.clients
    return []
}

function recordBusinessId(record: any): string | null {
    const business = record?.business

    if (typeof business === 'string') return business
    if (business?._id) return String(business._id)

    return null
}

function formatRecentDate(value?: string) {
    if (!value) return '—'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const day = 24 * 60 * 60 * 1000

    if (diff >= 0 && diff < day) return 'Today'
    if (diff >= day && diff < 2 * day) return 'Yesterday'

    return formatDate(value)
}

function toRecentWorkStatus(
    status?: string,
    priority?: string,
    completed?: boolean
): Client['recentWork'][number]['status'] {
    if (completed || status === 'completed' || status === 'Executed' || status === 'Active') {
        return 'Completed'
    }

    if (
        priority === 'urgent' ||
        status === 'overdue' ||
        status === 'Urgent'
    ) {
        return 'Urgent'
    }

    if (
        status === 'in-progress' ||
        status === 'Internal Review' ||
        status === 'Client Review' ||
        status === 'Revision Requested' ||
        status === 'Approved'
    ) {
        return 'In Review'
    }

    return 'Pending'
}

async function loadClientOperationalData(businessId: string) {
    const [workResult, contractsResult, documentsResult, complianceResult] =
        await Promise.allSettled([
            apiRequest<ApiCollectionPayload>('/lawyer/work?limit=100'),
            apiRequest<ApiCollectionPayload>('/lawyer/contracts?limit=100'),
            apiRequest<ApiCollectionPayload>('/lawyer/documents?limit=100'),
            apiRequest<ApiCollectionPayload>('/lawyer/compliance?limit=100'),
        ])

    const work =
        workResult.status === 'fulfilled'
            ? collectionFromPayload(workResult.value)
            : []
    const contracts =
        contractsResult.status === 'fulfilled'
            ? collectionFromPayload(contractsResult.value)
            : []
    const documents =
        documentsResult.status === 'fulfilled'
            ? collectionFromPayload(documentsResult.value)
            : []
    const compliance =
        complianceResult.status === 'fulfilled'
            ? collectionFromPayload(complianceResult.value)
            : []

    const clientWork = work.filter(
        (item) => recordBusinessId(item) === businessId
    )
    const clientContracts = contracts.filter(
        (item) => recordBusinessId(item) === businessId
    )
    const clientDocuments = documents.filter(
        (item) => recordBusinessId(item) === businessId
    )
    const clientCompliance = compliance.filter(
        (item) => recordBusinessId(item) === businessId
    )

    const recentItems: Client['recentWork'] = [
        ...clientWork.map((item) => ({
            id: String(item._id || item.id),
            title: item.title || 'Untitled work',
            type:
                item.workType === 'compliance'
                    ? ('Compliance' as const)
                    : item.workType === 'document_review'
                        ? ('Document' as const)
                        : ('Contract' as const),
            status: toRecentWorkStatus(item.status, item.priority),
            date: formatRecentDate(item.updatedAt || item.createdAt),
            sortDate: item.updatedAt || item.createdAt || '',
        })),
        ...clientContracts.map((item) => ({
            id: String(item._id || item.id),
            title: item.title || item.contractNumber || 'Untitled contract',
            type: 'Contract' as const,
            status: toRecentWorkStatus(item.status, item.priority),
            date: formatRecentDate(item.updatedAt || item.createdAt),
            sortDate: item.updatedAt || item.createdAt || '',
        })),
        ...clientCompliance.map((item) => ({
            id: String(item._id || item.id),
            title: item.name || 'Compliance item',
            type: 'Compliance' as const,
            status: toRecentWorkStatus(item.status, item.priority),
            date: formatRecentDate(item.updatedAt || item.createdAt),
            sortDate: item.updatedAt || item.createdAt || '',
        })),
        ...clientDocuments.map((item) => ({
            id: String(item._id || item.id),
            title: item.name || item.originalName || 'Document',
            type: 'Document' as const,
            status: item.reviewStatus === 'reviewed' ? 'Completed' as const : 'Pending' as const,
            date: formatRecentDate(item.updatedAt || item.createdAt || item.uploadedAt),
            sortDate: item.updatedAt || item.createdAt || item.uploadedAt || '',
        })),
    ]
        .sort(
            (a, b) =>
                new Date(b.sortDate).getTime() -
                new Date(a.sortDate).getTime()
        )
        .slice(0, 5)
        .map(({ sortDate, ...item }) => item)

    return {
        stats: {
            openWork: clientWork.filter(
                (item) =>
                    !['completed', 'cancelled'].includes(item.status)
            ).length,
            contracts: clientContracts.length,
            compliance: clientCompliance.length,
            documents: clientDocuments.length,
            pendingActions:
                clientWork.filter(
                    (item) =>
                        !['completed', 'cancelled'].includes(item.status)
                ).length +
                clientCompliance.filter(
                    (item) => item.status !== 'completed'
                ).length,
        },
        recentWork: recentItems,
    }
}

export default function LawyerClientPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [selectedClientId, setSelectedClientId] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<
        'All' | Client['status']
    >('All')
    const [mobileDetailOpen, setMobileDetailOpen] =
        useState(false)

    const [lawyerName, setLawyerName] =
        useState('Lawyer')
    const [loading, setLoading] = useState(true)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [error, setError] = useState('')
    const [detailsError, setDetailsError] = useState('')

    const loadClients = async () => {
        try {
            setLoading(true)
            setError('')

            const payload = await apiRequest<{
                success: boolean
                data?: ApiClientListItem[]
                clients?: ApiClientListItem[]
            }>('/lawyer/clients')

            const rawClients =
                Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.clients)
                        ? payload.clients
                        : []

            const normalizedClients = rawClients
                .map(normalizeClient)
                .filter((client) => Boolean(client.id))

            setClients(normalizedClients)

            setSelectedClientId((current) =>
                current &&
                    normalizedClients.some(
                        (client) => client.id === current
                    )
                    ? current
                    : normalizedClients[0]?.id || ''
            )
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load clients'
            )
            setClients([])
            setSelectedClientId('')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user')

            if (storedUser) {
                const parsedUser = JSON.parse(storedUser)

                if (parsedUser?.fullName) {
                    setLawyerName(
                        parsedUser.fullName
                            .split(' ')[0]
                    )
                }
            }
        } catch {
            // Keep default lawyer name.
        }

        void loadClients()
    }, [])

    useEffect(() => {
        if (!selectedClientId) return

        let cancelled = false

        const loadClientDetails = async () => {
            try {
                setDetailsLoading(true)
                setDetailsError('')

                const payload = await apiRequest<{
                    success: boolean
                    client?: ApiClient
                    data?: ApiClient | { client?: ApiClient }
                }>(`/lawyer/client/${selectedClientId}`)

                const rawClient =
                    payload?.client ||
                    (payload?.data &&
                        !Array.isArray(payload.data)
                        ? 'client' in payload.data
                            ? payload.data.client
                            : payload.data
                        : null)

                if (!rawClient || cancelled) return

                const operationalData =
                    await loadClientOperationalData(selectedClientId)

                if (cancelled) return

                setClients((current) =>
                    current.map((client) => {
                        if (client.id !== selectedClientId) return client

                        const detailedClient = normalizeClient({
                            ...rawClient,
                            assignmentStatus:
                                client.assignmentStatus,
                            workspaceRole:
                                client.workspaceRole,
                            permissions:
                                client.permissions,
                            assignedAt:
                                client.assignedDate,
                        })

                        return {
                            ...client,
                            ...detailedClient,
                            stats: operationalData.stats,
                            recentWork: operationalData.recentWork,
                        }
                    })
                )
            } catch (err) {
                if (!cancelled) {
                    setDetailsError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load client details'
                    )
                }
            } finally {
                if (!cancelled) setDetailsLoading(false)
            }
        }

        void loadClientDetails()

        return () => {
            cancelled = true
        }
    }, [selectedClientId])

    const filteredClients = useMemo(() => {
        const term = search.toLowerCase().trim()

        return clients.filter((client) => {
            const matchesSearch =
                !term ||
                client.companyName
                    .toLowerCase()
                    .includes(term) ||
                client.legalName
                    .toLowerCase()
                    .includes(term) ||
                client.industry
                    .toLowerCase()
                    .includes(term) ||
                client.email
                    .toLowerCase()
                    .includes(term)

            const matchesStatus =
                statusFilter === 'All' ||
                client.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [clients, search, statusFilter])

    const selectedClient =
        clients.find(
            (client) =>
                client.id === selectedClientId
        ) || null

    const totals = useMemo(() => {
        return clients.reduce(
            (acc, client) => {
                acc.clients += 1
                acc.openWork += client.stats.openWork
                acc.contracts += client.stats.contracts
                acc.documents += client.stats.documents

                return acc
            },
            {
                clients: 0,
                openWork: 0,
                contracts: 0,
                documents: 0,
            }
        )
    }, [clients])

    const selectClient = (client: Client) => {
        setSelectedClientId(client.id)
        setMobileDetailOpen(true)
    }

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            {/* subtle background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[25%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
                <div className="absolute right-0 top-[35%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.02] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-white/[0.06] pb-6"
                >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                                <span>Lawyer Dashboard</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-zinc-300">
                                    Clients
                                </span>
                            </div>

                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Clients
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Good to see you, {lawyerName}. Manage
                                businesses assigned to you and stay on top
                                of their legal operations.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
                            <div className="px-4 py-3 text-center">
                                <p className="text-lg font-semibold text-white">
                                    {totals.clients}
                                </p>
                                <p className="text-[10px] text-zinc-600">
                                    Clients
                                </p>
                            </div>

                            <div className="border-l border-white/[0.06] px-4 py-3 text-center">
                                <p className="text-lg font-semibold text-white">
                                    {totals.openWork}
                                </p>
                                <p className="text-[10px] text-zinc-600">
                                    Open Work
                                </p>
                            </div>

                            <div className="border-l border-white/[0.06] px-4 py-3 text-center">
                                <p className="text-lg font-semibold text-white">
                                    {totals.contracts}
                                </p>
                                <p className="text-[10px] text-zinc-600">
                                    Contracts
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main */}
                <div className="mt-6 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
                    {/* Client List */}
                    <section className="min-w-0">
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                            <div className="border-b border-white/[0.06] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">
                                            Assigned Clients
                                        </h2>

                                        <p className="mt-1 text-[11px] text-zinc-600">
                                            {filteredClients.length} businesses
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => void loadClients()}
                                        disabled={loading}
                                        aria-label="Refresh clients"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative mt-4">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                                    <input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search clients..."
                                        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                    />
                                </div>

                                {/* Filters */}
                                <div className="mt-3 flex gap-1.5 overflow-x-auto">
                                    {(
                                        [
                                            'All',
                                            'Active',
                                            'Pending',
                                            'Inactive',
                                        ] as const
                                    ).map((status) => (
                                        <button
                                            key={status}
                                            onClick={() =>
                                                setStatusFilter(
                                                    status
                                                )
                                            }
                                            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] transition ${statusFilter ===
                                                status
                                                ? 'border border-blue-400/20 bg-blue-400/10 text-blue-400'
                                                : 'border border-white/[0.05] bg-white/[0.02] text-zinc-600 hover:text-zinc-300'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[680px] overflow-y-auto p-2">
                                {loading ? (
                                    <div className="py-16 text-center">
                                        <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-400" />
                                        <p className="mt-3 text-sm text-zinc-400">
                                            Loading assigned clients...
                                        </p>
                                    </div>
                                ) : error ? (
                                    <div className="px-6 py-12 text-center">
                                        <AlertCircle className="mx-auto h-7 w-7 text-red-400" />
                                        <p className="mt-3 text-sm text-zinc-300">
                                            Unable to load clients
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-zinc-600">
                                            {error}
                                        </p>
                                        <button
                                            onClick={() => void loadClients()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.06]"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            Retry
                                        </button>
                                    </div>
                                ) : filteredClients.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Search className="mx-auto h-7 w-7 text-zinc-700" />

                                        <p className="mt-3 text-sm text-zinc-400">
                                            No clients found
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-700">
                                            Try changing your search
                                            or filter.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredClients.map(
                                            (client, index) => {
                                                const selected =
                                                    selectedClientId ===
                                                    client.id

                                                return (
                                                    <motion.button
                                                        key={client.id}
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
                                                                0.03,
                                                        }}
                                                        onClick={() =>
                                                            selectClient(
                                                                client
                                                            )
                                                        }
                                                        className={`group w-full rounded-xl p-3 text-left transition ${selected
                                                            ? 'border border-blue-400/15 bg-blue-400/[0.07]'
                                                            : 'border border-transparent hover:border-white/[0.05] hover:bg-white/[0.025]'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <ClientLogo
                                                                client={
                                                                    client
                                                                }
                                                            />

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="truncate text-sm font-medium text-white">
                                                                        {
                                                                            client.companyName
                                                                        }
                                                                    </p>

                                                                    {selected && (
                                                                        <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
                                                                    )}
                                                                </div>

                                                                <p className="mt-1 truncate text-[11px] text-zinc-600">
                                                                    {
                                                                        client.industry
                                                                    }{' '}
                                                                    •{' '}
                                                                    {
                                                                        client.companyType
                                                                    }
                                                                </p>

                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <StatusBadge
                                                                        status={
                                                                            client.status
                                                                        }
                                                                    />

                                                                    {client.stats
                                                                        .pendingActions >
                                                                        0 && (
                                                                            <span className="text-[10px] text-zinc-600">
                                                                                {
                                                                                    client
                                                                                        .stats
                                                                                        .pendingActions
                                                                                }{' '}
                                                                                pending
                                                                            </span>
                                                                        )}
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
                    </section>

                    {/* Desktop Detail */}
                    <section className="hidden min-w-0 lg:block">
                        {detailsLoading ? (
                            <div className="flex min-h-[600px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                                <div className="text-center">
                                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-400" />
                                    <p className="mt-3 text-sm text-zinc-400">
                                        Loading client details...
                                    </p>
                                </div>
                            </div>
                        ) : detailsError ? (
                            <div className="flex min-h-[600px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                                <div className="max-w-sm px-6 text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                                    <p className="mt-4 text-sm font-medium text-zinc-300">
                                        Unable to load client details
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                                        {detailsError}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ClientDetails
                                client={selectedClient}
                            />
                        )}
                    </section>
                </div>
            </main>

            {/* Mobile Detail */}
            <AnimatePresence>
                {mobileDetailOpen &&
                    selectedClient && (
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
                            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/[0.06] bg-[#06080b]/95 px-4 py-3 backdrop-blur-xl">
                                <button
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
                                    Client Profile
                                </span>

                                <button
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
                                {detailsLoading ? (
                                    <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                                        <div className="text-center">
                                            <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-400" />
                                            <p className="mt-3 text-sm text-zinc-400">
                                                Loading client details...
                                            </p>
                                        </div>
                                    </div>
                                ) : detailsError ? (
                                    <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                                        <div className="px-6 text-center">
                                            <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                                            <p className="mt-4 text-sm font-medium text-zinc-300">
                                                Unable to load client details
                                            </p>
                                            <p className="mt-2 text-xs leading-5 text-zinc-600">
                                                {detailsError}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <ClientDetails
                                        client={selectedClient}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    )
}

function ClientDetails({
    client,
}: {
    client: Client | null
}) {
    if (!client) {
        return (
            <div className="flex min-h-[600px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <div className="text-center">
                    <Building2 className="mx-auto h-10 w-10 text-zinc-700" />

                    <p className="mt-4 text-sm text-zinc-400">
                        Select a client
                    </p>

                    <p className="mt-1 text-xs text-zinc-700">
                        Select a client from the list to view
                        their profile.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            key={client.id}
            initial={{
                opacity: 0,
                y: 8,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.25,
            }}
            className="space-y-5"
        >
            {/* Profile Header */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <ClientLogo
                            client={client}
                            large
                        />

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight text-white">
                                    {client.companyName}
                                </h2>

                                <StatusBadge
                                    status={
                                        client.status
                                    }
                                />
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                                {client.legalName}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-zinc-600" />
                                    {client.companyType}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <BriefcaseBusiness className="h-3.5 w-3.5 text-zinc-600" />
                                    {client.industry}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-zinc-600" />
                                    {client.address.city},{' '}
                                    {client.address.state}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button className="flex h-9 w-9 items-center justify-center self-start rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-500 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>

                {/* Contact row */}
                <div className="mt-6 grid gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03]">
                            <Mail className="h-3.5 w-3.5 text-zinc-500" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                                Email
                            </p>

                            <p className="truncate text-xs text-zinc-300">
                                {client.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03]">
                            <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        </div>

                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                                Phone
                            </p>

                            <p className="text-xs text-zinc-300">
                                {client.phone}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03]">
                            <Globe className="h-3.5 w-3.5 text-zinc-500" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                                Website
                            </p>

                            <p className="truncate text-xs text-zinc-300">
                                {client.website}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legal Workload */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Legal Workload
                        </h3>

                        <p className="mt-1 text-xs text-zinc-600">
                            Current legal activity for this client
                        </p>
                    </div>

                    <span className="text-[11px] text-zinc-600">
                        Assigned {client.assignedDate}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatBox
                        icon={BriefcaseBusiness}
                        label="Open Work"
                        value={
                            client.stats.openWork
                        }
                    />

                    <StatBox
                        icon={FileCheck2}
                        label="Contracts"
                        value={
                            client.stats.contracts
                        }
                    />

                    <StatBox
                        icon={ShieldCheck}
                        label="Compliance"
                        value={
                            client.stats.compliance
                        }
                    />

                    <StatBox
                        icon={FileText}
                        label="Documents"
                        value={
                            client.stats.documents
                        }
                    />
                </div>
            </div>

            {/* Health + Contact */}
            <div className="grid gap-5 xl:grid-cols-2">
                {/* Legal Health */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                            <ShieldCheck className="h-4 w-4 text-blue-400" />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Legal Health
                            </h3>

                            <p className="text-xs text-zinc-600">
                                Overall legal readiness
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <HealthIndicator
                            score={
                                client.legalHealth
                            }
                        />
                    </div>
                </div>

                {/* Primary Contact */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                            <UserRound className="h-4 w-4 text-zinc-400" />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Primary Contact
                            </h3>

                            <p className="text-xs text-zinc-600">
                                Client-side point of contact
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <p className="text-sm font-medium text-white">
                            {
                                client.contactPerson
                                    .name
                            }
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                            {
                                client.contactPerson
                                    .designation
                            }
                        </p>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Mail className="h-3.5 w-3.5" />
                                {
                                    client
                                        .contactPerson
                                        .email
                                }
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Phone className="h-3.5 w-3.5" />
                                {
                                    client
                                        .contactPerson
                                        .phone
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Practice Areas */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                    <GavelIcon />

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Legal Areas
                        </h3>

                        <p className="text-xs text-zinc-600">
                            Areas of legal work assigned for this client
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {client.practiceAreas.map(
                        (area) => (
                            <span
                                key={area}
                                className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-300"
                            >
                                {area}
                            </span>
                        )
                    )}
                </div>
            </div>

            {/* Recent Work */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Recent Work
                        </h3>

                        <p className="mt-1 text-xs text-zinc-600">
                            Latest activity for this client
                        </p>
                    </div>

                    <button className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                        View all
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="divide-y divide-white/[0.05]">
                    {client.recentWork.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <Clock3 className="mx-auto h-6 w-6 text-zinc-700" />
                            <p className="mt-3 text-xs text-zinc-500">
                                No recent activity found for this client.
                            </p>
                        </div>
                    ) : (
                        client.recentWork.map((work) => (
                            <div
                                key={work.id}
                                className="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.015]"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
                                    {work.type === 'Contract' ? (
                                        <FileCheck2 className="h-4 w-4 text-blue-400" />
                                    ) : work.type === 'Compliance' ? (
                                        <ShieldCheck className="h-4 w-4 text-amber-400" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-zinc-400" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-white">
                                        {work.title}
                                    </p>

                                    <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-600">
                                        <span>{work.type}</span>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="h-3 w-3" />
                                            {work.date}
                                        </span>
                                    </div>
                                </div>

                                <WorkStatusBadge status={work.status} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Client Address */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                        <MapPin className="h-4 w-4 text-zinc-400" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Company Address
                        </h3>

                        <p className="text-xs text-zinc-600">
                            Registered business location
                        </p>
                    </div>
                </div>

                <div className="mt-4 text-sm text-zinc-400">
                    <p>
                        {client.address.city},{' '}
                        {client.address.state}
                    </p>

                    <p className="mt-1">
                        {client.address.country}{' '}
                        {client.address.pincode}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}

function GavelIcon() {
    return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
            <span className="text-sm text-blue-400">
                ⚖
            </span>
        </div>
    )
}