'use client'

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    AlertCircle,
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileCheck2,
    FileText,
    Globe,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Shield,
    Users,
} from 'lucide-react'

// =========================================================
// API
// =========================================================

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1'

function getToken() {
    if (typeof window === 'undefined') return null
    return (
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken')
    )
}

async function apiRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()
    if (!token) throw new Error('Authentication required.')

    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${token}`)
    if (options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        cache: 'no-store',
    })

    const contentType =
        response.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text()

    if (!response.ok) {
        const message =
            typeof data === 'object' && data
                ? (data as any).message ||
                (data as any).error ||
                `Request failed (${response.status})`
                : String(data) || 'Request failed'
        throw new Error(message)
    }

    return data as T
}

// =========================================================
// Types
// =========================================================

interface BusinessAddress {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
}

interface ClientDetail {
    id: string
    companyName: string
    legalName?: string
    email?: string
    phone?: string
    website?: string
    industry?: string
    logo?: string
    description?: string
    gstin?: string
    panNumber?: string
    cinNumber?: string
    address?: BusinessAddress
    status: string
    verified: boolean
    createdAt?: string
}

interface ContractItem {
    id: string
    title: string
    status?: string
    dueDate?: string | null
    createdAt?: string
}

interface ComplianceItem {
    id: string
    name: string
    status?: string
    dueDate?: string | null
    priority?: string
}

interface WorkItem {
    id: string
    title: string
    status?: string
    priority?: string
    workType?: string
    dueDate?: string | null
}

interface DocumentItem {
    id: string
    name: string
    category?: string
    createdAt?: string
}

// =========================================================
// Helpers
// =========================================================

function asRecord(v: unknown): Record<string, any> {
    return v && typeof v === 'object'
        ? (v as Record<string, any>)
        : {}
}

function getId(v: any) {
    return String(v?._id || v?.id || v || '')
}

function formatDate(v?: string | null) {
    if (!v) return '—'
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function getInitials(name: string) {
    if (!name) return 'NA'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (
        parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase()
}

function getArray<T = any>(payload: any): T[] {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.businesses)) return payload.businesses
    if (Array.isArray(payload?.contracts)) return payload.contracts
    if (Array.isArray(payload?.compliance)) return payload.compliance
    if (Array.isArray(payload?.work)) return payload.work
    if (Array.isArray(payload?.documents)) return payload.documents
    if (Array.isArray(payload?.items)) return payload.items
    if (Array.isArray(payload?.data?.items)) return payload.data.items
    if (Array.isArray(payload?.data?.contracts))
        return payload.data.contracts
    if (Array.isArray(payload?.data?.compliance))
        return payload.data.compliance
    if (Array.isArray(payload?.data?.work)) return payload.data.work
    if (Array.isArray(payload?.data?.documents))
        return payload.data.documents
    return []
}

function normalizeClient(raw: any): ClientDetail {
    const r = asRecord(raw)
    const details = asRecord(r.businessDetails)
    const user = asRecord(r.userInfo || r.user)

    return {
        id: getId(r),
        companyName:
            details.companyName ||
            r.companyName ||
            user.companyName ||
            'Unnamed Business',
        legalName: details.legalName || r.legalName,
        email: user.email || r.email || details.email,
        phone: user.phone || r.phone || details.phone,
        website: details.website || r.website,
        industry: details.industry || r.industry,
        logo:
            details.logo ||
            user.profilePhoto ||
            user.profileImage ||
            r.logo,
        description: details.description || r.description,
        gstin: details.gstin || r.gstin,
        panNumber: details.panNumber || r.panNumber,
        cinNumber: details.cinNumber || r.cinNumber,
        address:
            details.address || r.address || undefined,
        status:
            details.status || r.status || 'active',
        verified: Boolean(
            details.verified ||
            r.verified ||
            details.kycStatus === 'verified'
        ),
        createdAt:
            r.createdAt || details.createdAt || user.createdAt,
    }
}

function normalizeContract(raw: any): ContractItem {
    return {
        id: getId(raw),
        title: raw?.title || raw?.name || 'Contract',
        status: raw?.status,
        dueDate:
            raw?.expiryDate ||
            raw?.renewalDate ||
            raw?.effectiveDate ||
            raw?.dueDate ||
            null,
        createdAt: raw?.createdAt,
    }
}

function normalizeCompliance(raw: any): ComplianceItem {
    return {
        id: getId(raw),
        name:
            raw?.name || raw?.title || 'Compliance item',
        status: raw?.status,
        dueDate: raw?.dueDate,
        priority: raw?.priority,
    }
}

function normalizeWork(raw: any): WorkItem {
    return {
        id: getId(raw),
        title: raw?.title || 'Work item',
        status: raw?.status,
        priority: raw?.priority,
        workType: raw?.workType || raw?.sourceType,
        dueDate: raw?.dueDate,
    }
}

function normalizeDocument(raw: any): DocumentItem {
    return {
        id: getId(raw),
        name:
            raw?.name ||
            raw?.originalName ||
            raw?.fileName ||
            'Document',
        category: raw?.category || raw?.type,
        createdAt:
            raw?.createdAt ||
            raw?.uploadedAt ||
            raw?.updatedAt,
    }
}

// =========================================================
// UI atoms
// =========================================================

function StatusBadge({ status }: { status?: string }) {
    if (!status) return null
    const key = status.toLowerCase()
    const map: Record<string, string> = {
        active:
            'border-green-500/20 bg-green-500/10 text-green-400',
        verified:
            'border-green-500/20 bg-green-500/10 text-green-400',
        completed:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        approved:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        'in-progress':
            'border-blue-500/20 bg-blue-500/10 text-blue-400',
        pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        review:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        overdue:
            'border-red-500/20 bg-red-500/10 text-red-400',
        suspended:
            'border-red-500/20 bg-red-500/10 text-red-400',
        inactive:
            'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
    }
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize ${map[key] ||
                'border-blue-500/20 bg-blue-500/10 text-blue-400'
                }`}
        >
            {status.replace(/-/g, ' ')}
        </span>
    )
}

function PriorityBadge({ priority }: { priority?: string }) {
    if (!priority) return null
    const key = priority.toLowerCase()
    const map: Record<string, string> = {
        urgent:
            'border-red-500/20 bg-red-500/10 text-red-400',
        high:
            'border-orange-500/20 bg-orange-500/10 text-orange-400',
        medium:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        low:
            'border-green-500/20 bg-green-500/10 text-green-400',
    }
    return (
        <span
            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${map[key] ||
                'border-white/10 bg-white/5 text-zinc-400'
                }`}
        >
            {priority}
        </span>
    )
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon className="mb-4 h-9 w-9 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-400">
                {title}
            </p>
            <p className="mt-1 text-xs text-zinc-700">
                {description}
            </p>
        </div>
    )
}

function Card({
    title,
    count,
    icon: Icon,
    children,
    action,
}: {
    title: string
    count?: number
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
    action?: React.ReactNode
}) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                        <Icon className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">
                            {title}
                        </h2>
                        {typeof count === 'number' && (
                            <p className="text-[11px] text-zinc-600">
                                {count} item
                                {count === 1 ? '' : 's'}
                            </p>
                        )}
                    </div>
                </div>
                {action}
            </div>
            <div className="p-4">{children}</div>
        </div>
    )
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value?: string | null
}) {
    return (
        <div className="flex items-start gap-3 border-b border-white/[0.05] py-3 last:border-b-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
                <Icon className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    {label}
                </p>
                <p className="mt-0.5 break-words text-sm text-white">
                    {value || '—'}
                </p>
            </div>
        </div>
    )
}

// =========================================================
// Page
// =========================================================

export default function LawyerClientDetailPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()

    // params.id is the clientId from the URL /lawyer/clients/[id]
    const clientId = String(params?.id || '')

    const [client, setClient] = useState<ClientDetail | null>(
        null
    )
    const [contracts, setContracts] = useState<ContractItem[]>([])
    const [compliance, setCompliance] = useState<
        ComplianceItem[]
    >([])
    const [work, setWork] = useState<WorkItem[]>([])
    const [documents, setDocuments] = useState<DocumentItem[]>(
        []
    )

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(
        async (showLoader = true) => {
            if (!clientId) {
                setError('No client ID provided.')
                setLoading(false)
                return
            }

            try {
                if (showLoader) setLoading(true)
                setError(null)

                const [
                    clientRes,
                    contractsRes,
                    complianceRes,
                    workRes,
                    docsRes,
                ] = await Promise.allSettled([
                    apiRequest<any>(`/business/${clientId}`),
                    apiRequest<any>(
                        `/lawyer/contracts?clientId=${clientId}&limit=20`
                    ),
                    apiRequest<any>(
                        `/lawyer/compliance?clientId=${clientId}&limit=20`
                    ),
                    apiRequest<any>(
                        `/lawyer-works/work?clientId=${clientId}&limit=20`
                    ),
                    apiRequest<any>(
                        `/lawyer/documents?clientId=${clientId}&limit=20`
                    ),
                ])

                if (clientRes.status === 'fulfilled') {
                    const raw =
                        clientRes.value?.data ||
                        clientRes.value?.business ||
                        clientRes.value
                    setClient(normalizeClient(raw))
                } else {
                    setError(
                        clientRes.reason instanceof Error
                            ? clientRes.reason.message
                            : 'Failed to load client.'
                    )
                }

                if (contractsRes.status === 'fulfilled') {
                    setContracts(
                        getArray(contractsRes.value)
                            .map(normalizeContract)
                            .filter((c) => c.id)
                    )
                }

                if (complianceRes.status === 'fulfilled') {
                    setCompliance(
                        getArray(complianceRes.value)
                            .map(normalizeCompliance)
                            .filter((c) => c.id)
                    )
                }

                if (workRes.status === 'fulfilled') {
                    setWork(
                        getArray(workRes.value)
                            .map(normalizeWork)
                            .filter((w) => w.id)
                    )
                }

                if (docsRes.status === 'fulfilled') {
                    setDocuments(
                        getArray(docsRes.value)
                            .map(normalizeDocument)
                            .filter((d) => d.id)
                    )
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load client.'
                )
            } finally {
                if (showLoader) setLoading(false)
                setRefreshing(false)
            }
        },
        [clientId]
    )

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const refresh = async () => {
        setRefreshing(true)
        await fetchAll(false)
    }

    const counts = useMemo(
        () => ({
            contracts: contracts.length,
            compliance: compliance.length,
            work: work.length,
            documents: documents.length,
            pendingCompliance: compliance.filter(
                (c) =>
                    c.status === 'pending' ||
                    c.status === 'overdue'
            ).length,
            openWork: work.filter(
                (w) =>
                    w.status !== 'completed' &&
                    w.status !== 'cancelled'
            ).length,
        }),
        [contracts, compliance, work, documents]
    )

    // =====================================================
    // States
    // =====================================================

    if (!clientId) {
        return (
            <div className="min-h-screen bg-[#06080b] text-white">
                <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-amber-400" />
                    <h1 className="mt-4 text-xl font-semibold">
                        Missing client ID
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        The URL segment{' '}
                        <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-amber-400">
                            [id]
                        </code>{' '}
                        is empty.
                    </p>
                    <button
                        onClick={() =>
                            router.push('/lawyer/clients')
                        }
                        className="mt-6 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
                    >
                        Back to Clients
                    </button>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#06080b] text-white">
                <div className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-400" />
                        <p className="mt-4 text-sm text-zinc-500">
                            Loading client details...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (error && !client) {
        return (
            <div className="min-h-screen bg-[#06080b] text-white">
                <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
                    <h1 className="mt-4 text-xl font-semibold">
                        Unable to load client
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        {error}
                    </p>
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            onClick={() => fetchAll()}
                            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() =>
                                router.push('/lawyer/clients')
                            }
                            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05]"
                        >
                            Back to Clients
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const address = client?.address
    const addressLine = address
        ? [
            address.line1,
            address.line2,
            address.city,
            address.state,
            address.pincode,
            address.country,
        ]
            .filter(Boolean)
            .join(', ')
        : null

    // =====================================================
    // Main render
    // =====================================================

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[25%] top-0 h-[420px] w-[420px] rounded-full bg-amber-500/[0.02] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-3 text-xs text-zinc-600">
                    <button
                        onClick={() => router.back()}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] transition hover:bg-white/[0.05]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <span>Lawyer Dashboard</span>
                    <ChevronRight className="h-3 w-3" />
                    <button
                        onClick={() =>
                            router.push('/lawyer/clients')
                        }
                        className="transition hover:text-zinc-300"
                    >
                        Clients
                    </button>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-zinc-300">
                        {client?.companyName || 'Client'}
                    </span>
                </div>

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6"
                >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-5">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-400/10 ring-2 ring-amber-400/20">
                                {client?.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={client.logo}
                                        alt={
                                            client.companyName
                                        }
                                        className="h-20 w-20 object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-amber-300">
                                        {getInitials(
                                            client?.companyName ||
                                            ''
                                        )}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                                    <Building2 className="h-3.5 w-3.5" />
                                    Client
                                </div>

                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {client?.companyName ||
                                        'Unnamed Business'}
                                </h1>

                                {client?.legalName && (
                                    <p className="mt-1 text-sm text-zinc-500">
                                        {client.legalName}
                                    </p>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <StatusBadge
                                        status={client?.status}
                                    />
                                    {client?.verified && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-medium text-green-400">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Verified
                                        </span>
                                    )}
                                    {client?.industry && (
                                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-400">
                                            {client.industry}
                                        </span>
                                    )}
                                    {client?.createdAt && (
                                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-400">
                                            Client since{' '}
                                            {formatDate(
                                                client.createdAt
                                            )}
                                        </span>
                                    )}
                                </div>

                                {client?.description && (
                                    <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-zinc-400">
                                        {client.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {client?.email && (
                                <a
                                    href={`mailto:${client.email}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05]"
                                >
                                    <Mail className="h-3.5 w-3.5" />
                                    Email
                                </a>
                            )}
                            {client?.phone && (
                                <a
                                    href={`tel:${client.phone}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05]"
                                >
                                    <Phone className="h-3.5 w-3.5" />
                                    Call
                                </a>
                            )}
                            <button
                                onClick={refresh}
                                disabled={refreshing}
                                className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${refreshing
                                            ? 'animate-spin'
                                            : ''
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                        {
                            label: 'Contracts',
                            value: counts.contracts,
                            icon: FileCheck2,
                        },
                        {
                            label: 'Compliance',
                            value: counts.compliance,
                            icon: Shield,
                        },
                        {
                            label: 'Open Work',
                            value: counts.openWork,
                            icon: Briefcase,
                        },
                        {
                            label: 'Documents',
                            value: counts.documents,
                            icon: FileText,
                        },
                    ].map((s) => {
                        const Icon = s.icon
                        return (
                            <motion.div
                                key={s.label}
                                initial={{
                                    opacity: 0,
                                    y: 8,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                                        {s.label}
                                    </span>
                                    <Icon className="h-4 w-4 text-amber-400/70" />
                                </div>
                                <p className="text-2xl font-semibold">
                                    {s.value}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Two columns */}
                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    {/* Left sections */}
                    <div className="space-y-5">
                        <Card
                            title="Contracts"
                            count={counts.contracts}
                            icon={FileCheck2}
                            action={
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/lawyer/contracts?clientId=${clientId}`
                                        )
                                    }
                                    className="text-[11px] text-amber-400 hover:text-amber-300"
                                >
                                    View all
                                </button>
                            }
                        >
                            {contracts.length === 0 ? (
                                <EmptyState
                                    icon={FileCheck2}
                                    title="No contracts"
                                    description="This client has no contracts yet."
                                />
                            ) : (
                                <div className="space-y-2">
                                    {contracts
                                        .slice(0, 5)
                                        .map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() =>
                                                    router.push(
                                                        `/lawyer/contracts/${c.id}`
                                                    )
                                                }
                                                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-left transition hover:border-amber-400/20"
                                            >
                                                <FileCheck2 className="h-4 w-4 shrink-0 text-amber-400" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {c.title}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-zinc-600">
                                                        {c.dueDate
                                                            ? `Due ${formatDate(
                                                                c.dueDate
                                                            )}`
                                                            : 'No due date'}
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    status={c.status}
                                                />
                                                <ChevronRight className="h-4 w-4 text-zinc-600" />
                                            </button>
                                        ))}
                                </div>
                            )}
                        </Card>

                        <Card
                            title="Compliance"
                            count={counts.compliance}
                            icon={Shield}
                            action={
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/lawyer/compliance?clientId=${clientId}`
                                        )
                                    }
                                    className="text-[11px] text-amber-400 hover:text-amber-300"
                                >
                                    View all
                                </button>
                            }
                        >
                            {compliance.length === 0 ? (
                                <EmptyState
                                    icon={Shield}
                                    title="No compliance items"
                                    description="No compliance items assigned."
                                />
                            ) : (
                                <div className="space-y-2">
                                    {compliance
                                        .slice(0, 5)
                                        .map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() =>
                                                    router.push(
                                                        `/lawyer/compliance/${c.id}`
                                                    )
                                                }
                                                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-left transition hover:border-amber-400/20"
                                            >
                                                <Shield className="h-4 w-4 shrink-0 text-amber-400" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {c.name}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-zinc-600">
                                                        {c.dueDate
                                                            ? `Due ${formatDate(
                                                                c.dueDate
                                                            )}`
                                                            : 'No due date'}
                                                    </p>
                                                </div>
                                                <PriorityBadge
                                                    priority={
                                                        c.priority
                                                    }
                                                />
                                                <StatusBadge
                                                    status={c.status}
                                                />
                                                <ChevronRight className="h-4 w-4 text-zinc-600" />
                                            </button>
                                        ))}
                                </div>
                            )}
                        </Card>

                        <Card
                            title="Legal Work"
                            count={counts.work}
                            icon={Briefcase}
                            action={
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/lawyer/work?clientId=${clientId}`
                                        )
                                    }
                                    className="text-[11px] text-amber-400 hover:text-amber-300"
                                >
                                    View all
                                </button>
                            }
                        >
                            {work.length === 0 ? (
                                <EmptyState
                                    icon={Briefcase}
                                    title="No work items"
                                    description="No work assigned for this client."
                                />
                            ) : (
                                <div className="space-y-2">
                                    {work.slice(0, 5).map((w) => (
                                        <button
                                            key={w.id}
                                            onClick={() =>
                                                router.push(
                                                    `/lawyer/work/${w.id}`
                                                )
                                            }
                                            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-left transition hover:border-amber-400/20"
                                        >
                                            <Briefcase className="h-4 w-4 shrink-0 text-blue-400" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {w.title}
                                                </p>
                                                <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                                                    {w.workType ||
                                                        'Task'}
                                                    {w.dueDate
                                                        ? ` • Due ${formatDate(
                                                            w.dueDate
                                                        )}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <PriorityBadge
                                                priority={
                                                    w.priority
                                                }
                                            />
                                            <StatusBadge
                                                status={w.status}
                                            />
                                            <ChevronRight className="h-4 w-4 text-zinc-600" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card
                            title="Documents"
                            count={counts.documents}
                            icon={FileText}
                            action={
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/lawyer/documents?clientId=${clientId}`
                                        )
                                    }
                                    className="text-[11px] text-amber-400 hover:text-amber-300"
                                >
                                    View all
                                </button>
                            }
                        >
                            {documents.length === 0 ? (
                                <EmptyState
                                    icon={FileText}
                                    title="No documents"
                                    description="No documents uploaded for this client."
                                />
                            ) : (
                                <div className="space-y-2">
                                    {documents
                                        .slice(0, 5)
                                        .map((d) => (
                                            <button
                                                key={d.id}
                                                onClick={() =>
                                                    router.push(
                                                        `/lawyer/documents/${d.id}`
                                                    )
                                                }
                                                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-left transition hover:border-amber-400/20"
                                            >
                                                <FileText className="h-4 w-4 shrink-0 text-violet-400" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {d.name}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                                                        {d.category ||
                                                            'document'}
                                                        {d.createdAt
                                                            ? ` • ${formatDate(
                                                                d.createdAt
                                                            )}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-zinc-600" />
                                            </button>
                                        ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right sidebar */}
                    <aside className="space-y-5">
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                            <h2 className="mb-3 text-sm font-semibold">
                                Company Information
                            </h2>
                            <div>
                                <DetailRow
                                    icon={Building2}
                                    label="Company"
                                    value={client?.companyName}
                                />
                                <DetailRow
                                    icon={FileText}
                                    label="Legal Name"
                                    value={client?.legalName}
                                />
                                <DetailRow
                                    icon={Globe}
                                    label="Website"
                                    value={client?.website}
                                />
                                <DetailRow
                                    icon={Users}
                                    label="Industry"
                                    value={client?.industry}
                                />
                                <DetailRow
                                    icon={FileText}
                                    label="GSTIN"
                                    value={client?.gstin}
                                />
                                <DetailRow
                                    icon={FileText}
                                    label="PAN"
                                    value={client?.panNumber}
                                />
                                <DetailRow
                                    icon={FileText}
                                    label="CIN"
                                    value={client?.cinNumber}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                            <h2 className="mb-3 text-sm font-semibold">
                                Contact
                            </h2>
                            <div>
                                <DetailRow
                                    icon={Mail}
                                    label="Email"
                                    value={client?.email}
                                />
                                <DetailRow
                                    icon={Phone}
                                    label="Phone"
                                    value={client?.phone}
                                />
                                <DetailRow
                                    icon={MapPin}
                                    label="Address"
                                    value={addressLine}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                            <h2 className="mb-3 text-sm font-semibold">
                                Engagement
                            </h2>
                            <div>
                                <DetailRow
                                    icon={Calendar}
                                    label="Client Since"
                                    value={
                                        client?.createdAt
                                            ? formatDate(
                                                client.createdAt
                                            )
                                            : undefined
                                    }
                                />
                                <DetailRow
                                    icon={Clock3}
                                    label="Pending Compliance"
                                    value={String(
                                        counts.pendingCompliance
                                    )}
                                />
                                <DetailRow
                                    icon={Briefcase}
                                    label="Open Work"
                                    value={String(
                                        counts.openWork
                                    )}
                                />
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}