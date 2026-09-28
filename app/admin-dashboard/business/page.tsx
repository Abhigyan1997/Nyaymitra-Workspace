// app/admin-dashboard/businesses/page.tsx
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
    Building2,
    ChevronRight,
    X,
    Edit3,
    Save,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Globe,
    Mail,
    Phone,
    MapPin,
    User,
    Briefcase,
    Shield,
    CreditCard,
    Activity,
    Users,
    Calendar,
    FileText,
    ExternalLink,
} from 'lucide-react'

// ==================================================
// API BASE
// ==================================================

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const BUSINESSES_API = `${API_BASE}/admin/businesses`

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

interface BusinessOwner {
    _id?: string
    userId?: string
    fullName?: string
    email?: string
    phone?: string
    role?: string
    accountStatus?: string
}

interface PrimaryContact {
    fullName?: string
    designation?: string
    email?: string
    phone?: string
}

interface BusinessAddress {
    street?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
}

interface CurrentSetup {
    hasCA?: boolean
    hasLawyer?: boolean
    hasCS?: boolean
}

interface Subscription {
    plan?: string
    status?: string
    startDate?: string
    endDate?: string
}

interface Business {
    _id: string
    companyName?: string
    legalName?: string
    companyType?: string
    industry?: string
    teamSize?: string
    employeeCount?: number
    foundedYear?: number
    description?: string
    logo?: string

    registrationStatus?: string
    CIN?: string
    GSTIN?: string
    PAN?: string
    TAN?: string

    email?: string
    phone?: string
    website?: string

    primaryContact?: PrimaryContact
    address?: BusinessAddress
    currentSetup?: CurrentSetup

    businessNeeds?: string[]

    legalHealthScore?: number

    subscription?: Subscription

    status?: string
    workspaceStatus?: string
    onboardingCompleted?: boolean

    owner?: BusinessOwner

    createdAt?: string
    updatedAt?: string
}

interface BusinessPagination {
    page: number
    limit: number
    total: number
    pages: number
}

// ==================================================
// CONSTANTS
// ==================================================

const COMPANY_TYPES = [
    'Private Limited',
    'LLP',
    'Partnership',
    'Proprietorship',
    'OPC',
    'Public Limited',
    'Other',
]

const TEAM_SIZES = [
    '1–10 (Micro)',
    '11–50 (Small)',
    '51–200 (Mid-size)',
    '201–500',
    '500+ (Enterprise)',
]

const REGISTRATION_STATUSES = ['Registered', 'Unregistered']

const BUSINESS_NEEDS = [
    'Compliance Management',
    'Contract Management',
    'Documentation Support',
    'Investor Readiness',
    'Vendor Agreements',
    'Employment Documentation',
    'Legal Desk Retainer',
]

const STATUSES = ['Active', 'Inactive']
const WORKSPACE_STATUSES = ['Active', 'Suspended']
const SUBSCRIPTION_PLANS = ['Starter', 'Growth', 'Enterprise']
const SUBSCRIPTION_STATUSES = [
    'Trial',
    'Active',
    'Expired',
    'Cancelled',
]

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

function formatValue(value?: string | number | null): string {
    if (value === undefined || value === null || value === '') return '—'
    return String(value)
}

function formatBoolean(value?: boolean | null): string {
    if (value === undefined || value === null) return '—'
    return value ? 'Yes' : 'No'
}

function toInputDate(value?: string | null): string {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
}

// ==================================================
// UI PRIMITIVES
// ==================================================

function StatusBadge({ status }: { status?: string }) {
    if (!status) return <span className="text-gray-600">—</span>
    const key = status.toLowerCase()
    const colors: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
        trial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        expired: 'bg-red-500/10 text-red-400 border-red-500/20',
        cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        registered: 'bg-green-500/10 text-green-400 border-green-500/20',
        unregistered: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    }
    const cls =
        colors[key] || 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    return (
        <span
            className={`inline-flex rounded-lg border px-2 py-1 text-xs font-medium ${cls}`}
        >
            {status}
        </span>
    )
}

function Skeleton({ rows = 5 }: { rows?: number }) {
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

function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs text-gray-500">{label}</span>
            {children}
        </label>
    )
}

const inputCls =
    'w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition focus:border-amber-400/40 focus:bg-black/60 disabled:opacity-50'

// ==================================================
// PAGE
// ==================================================

export default function AdminBusinessesPage() {
    // ----- list state -----
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [pagination, setPagination] = useState<BusinessPagination>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    })

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [listError, setListError] = useState<string | null>(null)

    // ----- filters -----
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [companyTypeFilter, setCompanyTypeFilter] = useState('')
    const [industryFilter, setIndustryFilter] = useState('')
    const [page, setPage] = useState(1)

    // ----- details drawer -----
    const [detailId, setDetailId] = useState<string | null>(null)
    const [detail, setDetail] = useState<Business | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)

    // ----- edit mode -----
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState<Partial<Business>>({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const abortRef = useRef<AbortController | null>(null)

    // ----- debounce search input -----
    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 400)
        return () => window.clearTimeout(t)
    }, [searchInput])

    // ----- reset page when filters change -----
    useEffect(() => {
        setPage(1)
    }, [statusFilter, companyTypeFilter, industryFilter])

    // ==================================================
    // FETCH LIST
    // ==================================================

    const fetchBusinesses = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)
            setListError(null)

            if (abortRef.current) abortRef.current.abort()
            const ctrl = new AbortController()
            abortRef.current = ctrl

            try {
                const token = getAuthToken()
                if (!token) {
                    throw new Error(
                        'Authentication required. Please sign in again.'
                    )
                }

                const params = new URLSearchParams()
                params.set('page', String(page))
                params.set('limit', String(pagination.limit))
                if (search) params.set('search', search)
                if (statusFilter) params.set('status', statusFilter)
                if (companyTypeFilter)
                    params.set('companyType', companyTypeFilter)
                if (industryFilter) params.set('industry', industryFilter)

                const res = await fetch(
                    `${BUSINESSES_API}?${params.toString()}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: ctrl.signal,
                    }
                )

                const json = await res.json().catch(() => ({}))

                if (!res.ok) {
                    if (res.status === 401)
                        throw new Error(
                            json?.message ||
                            'Unauthorized. Please sign in again.'
                        )
                    if (res.status === 403)
                        throw new Error(
                            json?.message ||
                            'Forbidden. You do not have admin access.'
                        )
                    throw new Error(
                        json?.message ||
                        `Request failed with status ${res.status}`
                    )
                }

                const list: Business[] = Array.isArray(json?.data)
                    ? json.data
                    : []

                setBusinesses(list)
                setPagination({
                    page: json?.pagination?.page ?? page,
                    limit: json?.pagination?.limit ?? pagination.limit,
                    total: json?.pagination?.total ?? list.length,
                    pages: json?.pagination?.pages ?? 1,
                })
            } catch (err) {
                if ((err as Error)?.name === 'AbortError') return
                setListError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load businesses.'
                )
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        },
        [
            page,
            pagination.limit,
            search,
            statusFilter,
            companyTypeFilter,
            industryFilter,
        ]
    )

    useEffect(() => {
        fetchBusinesses()
    }, [fetchBusinesses])

    // ==================================================
    // FETCH DETAILS
    // ==================================================

    const fetchDetails = useCallback(async (id: string) => {
        setDetailLoading(true)
        setDetailError(null)
        setDetail(null)

        try {
            const token = getAuthToken()
            if (!token)
                throw new Error(
                    'Authentication required. Please sign in again.'
                )

            const res = await fetch(`${BUSINESSES_API}/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })

            const json = await res.json().catch(() => ({}))

            if (!res.ok) {
                if (res.status === 404)
                    throw new Error(
                        json?.message || 'Business not found.'
                    )
                if (res.status === 401)
                    throw new Error(
                        json?.message || 'Unauthorized. Please sign in again.'
                    )
                if (res.status === 403)
                    throw new Error(
                        json?.message || 'Forbidden. Admin access required.'
                    )
                throw new Error(
                    json?.message ||
                    `Request failed with status ${res.status}`
                )
            }

            const payload: Business =
                json?.data?.business || json?.data || null
            if (!payload)
                throw new Error('Malformed response from server.')

            setDetail(payload)
        } catch (err) {
            setDetailError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load business details.'
            )
        } finally {
            setDetailLoading(false)
        }
    }, [])

    const handleView = (id: string) => {
        setDetailId(id)
        setEditing(false)
        setSuccessMessage(null)
        setSaveError(null)
        fetchDetails(id)
    }

    const closeDrawer = () => {
        setDetailId(null)
        setDetail(null)
        setEditing(false)
        setSaveError(null)
        setSuccessMessage(null)
    }

    // ==================================================
    // EDIT
    // ==================================================

    const startEditing = () => {
        if (!detail) return
        setForm({
            companyName: detail.companyName ?? '',
            legalName: detail.legalName ?? '',
            companyType: detail.companyType ?? '',
            industry: detail.industry ?? '',
            teamSize: detail.teamSize ?? '',
            registrationStatus: detail.registrationStatus ?? '',
            CIN: detail.CIN ?? '',
            GSTIN: detail.GSTIN ?? '',
            PAN: detail.PAN ?? '',
            TAN: detail.TAN ?? '',
            website: detail.website ?? '',
            email: detail.email ?? '',
            phone: detail.phone ?? '',
            description: detail.description ?? '',
            employeeCount: detail.employeeCount,
            foundedYear: detail.foundedYear,
            legalHealthScore: detail.legalHealthScore,
            status: detail.status ?? '',
            workspaceStatus: detail.workspaceStatus ?? '',
            primaryContact: { ...(detail.primaryContact || {}) },
            address: { ...(detail.address || {}) },
            currentSetup: { ...(detail.currentSetup || {}) },
            subscription: { ...(detail.subscription || {}) },
            businessNeeds: [...(detail.businessNeeds || [])],
        })
        setSaveError(null)
        setEditing(true)
    }

    const cancelEditing = () => {
        setEditing(false)
        setForm({})
        setSaveError(null)
    }

    const updateField = <K extends keyof Business>(
        key: K,
        value: Business[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const updateNested = <
        K extends 'primaryContact' | 'address' | 'currentSetup' | 'subscription'
    >(
        key: K,
        patch: Partial<NonNullable<Business[K]>>
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: { ...(prev[key] as object), ...patch },
        }))
    }

    const toggleNeed = (need: string) => {
        setForm((prev) => {
            const list = new Set(prev.businessNeeds || [])
            if (list.has(need)) list.delete(need)
            else list.add(need)
            return { ...prev, businessNeeds: Array.from(list) }
        })
    }

    const buildPatchPayload = (): Record<string, unknown> => {
        const out: Record<string, unknown> = {}
        const push = (k: string, v: unknown) => {
            if (v === undefined) return
            if (typeof v === 'string' && v.trim() === '') return
            out[k] = v
        }

        push('companyName', form.companyName)
        push('legalName', form.legalName)
        push('companyType', form.companyType)
        push('industry', form.industry)
        push('teamSize', form.teamSize)
        push('registrationStatus', form.registrationStatus)
        push('CIN', form.CIN)
        push('GSTIN', form.GSTIN)
        push('PAN', form.PAN)
        push('TAN', form.TAN)
        push('website', form.website)
        push('email', form.email)
        push('phone', form.phone)
        push('description', form.description)
        if (form.employeeCount !== undefined)
            push('employeeCount', form.employeeCount)
        if (form.foundedYear !== undefined)
            push('foundedYear', form.foundedYear)
        if (form.legalHealthScore !== undefined)
            push('legalHealthScore', form.legalHealthScore)
        push('status', form.status)
        push('workspaceStatus', form.workspaceStatus)

        if (form.primaryContact && Object.keys(form.primaryContact).length)
            out.primaryContact = form.primaryContact
        if (form.address && Object.keys(form.address).length)
            out.address = form.address
        if (form.currentSetup && Object.keys(form.currentSetup).length)
            out.currentSetup = form.currentSetup
        if (form.subscription && Object.keys(form.subscription).length)
            out.subscription = form.subscription
        if (Array.isArray(form.businessNeeds))
            out.businessNeeds = form.businessNeeds

        return out
    }

    const handleSave = async () => {
        if (!detailId) return
        setSaving(true)
        setSaveError(null)
        setSuccessMessage(null)

        try {
            const token = getAuthToken()
            if (!token)
                throw new Error(
                    'Authentication required. Please sign in again.'
                )

            const payload = buildPatchPayload()

            const res = await fetch(`${BUSINESSES_API}/${detailId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            const json = await res.json().catch(() => ({}))

            if (!res.ok) {
                if (res.status === 401)
                    throw new Error(
                        json?.message || 'Unauthorized. Please sign in again.'
                    )
                if (res.status === 403)
                    throw new Error(
                        json?.message || 'Forbidden. Admin access required.'
                    )
                if (res.status === 404)
                    throw new Error(
                        json?.message || 'Business not found.'
                    )
                throw new Error(
                    json?.message ||
                    `Save failed with status ${res.status}`
                )
            }

            setSuccessMessage(json?.message || 'Business updated successfully.')
            setEditing(false)

            // Refresh detail and list
            await Promise.all([
                fetchDetails(detailId),
                fetchBusinesses(true),
            ])

            // Auto-clear success message
            window.setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            setSaveError(
                err instanceof Error
                    ? err.message
                    : 'Failed to save changes.'
            )
        } finally {
            setSaving(false)
        }
    }

    // ==================================================
    // DERIVED
    // ==================================================

    const pageLabel = useMemo(() => {
        return `Page ${pagination.page} of ${pagination.pages}`
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
                                Businesses
                            </h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Manage all registered business workspaces.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchBusinesses(true)}
                            disabled={refreshing || loading}
                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 transition hover:bg-white/[0.08] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-5 w-5 text-gray-400 ${refreshing ? 'animate-spin' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) =>
                                    setSearchInput(e.target.value)
                                }
                                placeholder="Search by name, email, CIN..."
                                className={`${inputCls} pl-9`}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className={inputCls}
                        >
                            <option value="">All statuses</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <select
                            value={companyTypeFilter}
                            onChange={(e) =>
                                setCompanyTypeFilter(e.target.value)
                            }
                            className={inputCls}
                        >
                            <option value="">All company types</option>
                            {COMPANY_TYPES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            value={industryFilter}
                            onChange={(e) =>
                                setIndustryFilter(e.target.value)
                            }
                            placeholder="Filter by industry"
                            className={inputCls}
                        />
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                {/* Error banner */}
                {listError && (
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{listError}</span>
                        <button
                            type="button"
                            onClick={() => fetchBusinesses()}
                            className="ml-auto text-xs font-medium underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm">
                    {loading ? (
                        <div className="p-6">
                            <Skeleton rows={6} />
                        </div>
                    ) : businesses.length === 0 ? (
                        <EmptyState
                            title="No businesses found"
                            description="Try adjusting your search or filters, or wait for new businesses to register."
                            icon={Building2}
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-gray-500">
                                            <th className="px-4 py-3 font-medium">
                                                Business
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Industry
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Company Type
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Owner
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Contact
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Created
                                            </th>
                                            <th className="px-4 py-3 font-medium text-right">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {businesses.map((b) => (
                                            <tr
                                                key={b._id}
                                                className="border-b border-white/[0.03] transition hover:bg-white/[0.02]"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {b.logo ? (
                                                            <img
                                                                src={b.logo}
                                                                alt=""
                                                                className="h-8 w-8 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                                                                <Building2 className="h-4 w-4 text-gray-500" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-white">
                                                                {formatValue(
                                                                    b.companyName
                                                                )}
                                                            </p>
                                                            <p className="truncate text-xs text-gray-600">
                                                                {formatValue(
                                                                    b.legalName
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-300">
                                                    {formatValue(b.industry)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-300">
                                                    {formatValue(b.companyType)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="truncate text-sm text-gray-200">
                                                        {formatValue(
                                                            b.owner?.fullName
                                                        )}
                                                    </p>
                                                    <p className="truncate text-xs text-gray-600">
                                                        {formatValue(
                                                            b.owner?.email
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="truncate text-xs text-gray-300">
                                                        {formatValue(b.email)}
                                                    </p>
                                                    <p className="truncate text-xs text-gray-600">
                                                        {formatValue(b.phone)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge
                                                        status={b.status}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-400">
                                                    {formatDate(b.createdAt)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleView(b._id)
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-400/20"
                                                    >
                                                        View
                                                        <ChevronRight className="h-3 w-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
                                <p className="text-xs text-gray-500">
                                    {pagination.total} total • {pageLabel}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={!canPrev || loading}
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.max(1, p - 1)
                                            )
                                        }
                                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        {pageLabel}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={!canNext || loading}
                                        onClick={() =>
                                            setPage((p) => p + 1)
                                        }
                                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* ---------- Details Drawer ---------- */}
            <AnimatePresence>
                {detailId && (
                    <motion.div
                        className="fixed inset-0 z-50 flex"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={closeDrawer}
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
                            className="relative ml-auto flex h-full w-full max-w-3xl flex-col border-l border-white/[0.08] bg-[#0a0a0a]"
                        >
                            {/* Drawer header */}
                            <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-semibold">
                                        {detail
                                            ? formatValue(
                                                detail.companyName
                                            )
                                            : 'Business Details'}
                                    </h2>
                                    <p className="mt-0.5 truncate text-xs text-gray-600">
                                        {detail
                                            ? formatValue(detail.legalName)
                                            : 'Loading...'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {detail && !editing && (
                                        <button
                                            type="button"
                                            onClick={startEditing}
                                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-400/20"
                                        >
                                            <Edit3 className="h-3 w-3" />
                                            Edit Business
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={closeDrawer}
                                        className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-gray-400 transition hover:bg-white/[0.08]"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {detailLoading && (
                                    <Skeleton rows={8} />
                                )}

                                {detailError && (
                                    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{detailError}</span>
                                    </div>
                                )}

                                {detail && !detailLoading && (
                                    <>
                                        {successMessage && (
                                            <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                <span>{successMessage}</span>
                                            </div>
                                        )}

                                        {saveError && (
                                            <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <span>{saveError}</span>
                                            </div>
                                        )}

                                        {editing ? (
                                            <EditForm
                                                form={form}
                                                updateField={updateField}
                                                updateNested={updateNested}
                                                toggleNeed={toggleNeed}
                                                saving={saving}
                                                onCancel={cancelEditing}
                                                onSave={handleSave}
                                            />
                                        ) : (
                                            <DetailsView business={detail} />
                                        )}
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

// ==================================================
// DETAILS VIEW
// ==================================================

function DetailsView({ business }: { business: Business }) {
    const score = business.legalHealthScore ?? 0
    const clamped = Math.max(0, Math.min(100, score))
    const scoreColor =
        clamped >= 75
            ? 'text-green-400'
            : clamped >= 40
                ? 'text-amber-400'
                : 'text-red-400'

    return (
        <div className="space-y-5">
            <Section title="Company Information" icon={Building2}>
                <DetailRow
                    label="Company Name"
                    value={formatValue(business.companyName)}
                />
                <DetailRow
                    label="Legal Name"
                    value={formatValue(business.legalName)}
                />
                <DetailRow
                    label="Company Type"
                    value={formatValue(business.companyType)}
                />
                <DetailRow
                    label="Industry"
                    value={formatValue(business.industry)}
                />
                <DetailRow
                    label="Team Size"
                    value={formatValue(business.teamSize)}
                />
                <DetailRow
                    label="Employee Count"
                    value={formatValue(business.employeeCount)}
                />
                <DetailRow
                    label="Founded Year"
                    value={formatValue(business.foundedYear)}
                />
                <DetailRow
                    label="Description"
                    value={
                        <span className="whitespace-pre-wrap">
                            {formatValue(business.description)}
                        </span>
                    }
                />
            </Section>

            <Section title="Registration" icon={Shield}>
                <DetailRow
                    label="Registration Status"
                    value={<StatusBadge status={business.registrationStatus} />}
                />
                <DetailRow label="CIN" value={formatValue(business.CIN)} />
                <DetailRow label="GSTIN" value={formatValue(business.GSTIN)} />
                <DetailRow label="PAN" value={formatValue(business.PAN)} />
                <DetailRow label="TAN" value={formatValue(business.TAN)} />
            </Section>

            <Section title="Contact" icon={Mail}>
                <DetailRow
                    label="Email"
                    value={formatValue(business.email)}
                    icon={Mail}
                />
                <DetailRow
                    label="Phone"
                    value={formatValue(business.phone)}
                    icon={Phone}
                />
                <DetailRow
                    label="Website"
                    icon={Globe}
                    value={
                        business.website ? (
                            <a
                                href={business.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300"
                            >
                                {business.website}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        ) : (
                            '—'
                        )
                    }
                />
            </Section>

            <Section title="Primary Contact" icon={User}>
                <DetailRow
                    label="Full Name"
                    value={formatValue(
                        business.primaryContact?.fullName
                    )}
                />
                <DetailRow
                    label="Designation"
                    value={formatValue(
                        business.primaryContact?.designation
                    )}
                />
                <DetailRow
                    label="Email"
                    value={formatValue(business.primaryContact?.email)}
                />
                <DetailRow
                    label="Phone"
                    value={formatValue(business.primaryContact?.phone)}
                />
            </Section>

            <Section title="Address" icon={MapPin}>
                <DetailRow
                    label="Street"
                    value={formatValue(business.address?.street)}
                />
                <DetailRow
                    label="City"
                    value={formatValue(business.address?.city)}
                />
                <DetailRow
                    label="State"
                    value={formatValue(business.address?.state)}
                />
                <DetailRow
                    label="Country"
                    value={formatValue(business.address?.country)}
                />
                <DetailRow
                    label="Pincode"
                    value={formatValue(business.address?.pincode)}
                />
            </Section>

            <Section title="Business Needs" icon={FileText}>
                {business.businessNeeds &&
                    business.businessNeeds.length > 0 ? (
                    <div className="flex flex-wrap gap-2 py-2">
                        {business.businessNeeds.map((n) => (
                            <span
                                key={n}
                                className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300"
                            >
                                {n}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="py-2 text-xs text-gray-600">—</p>
                )}
            </Section>

            <Section title="Current Setup" icon={Briefcase}>
                <DetailRow
                    label="CA"
                    value={formatBoolean(business.currentSetup?.hasCA)}
                />
                <DetailRow
                    label="Lawyer"
                    value={formatBoolean(business.currentSetup?.hasLawyer)}
                />
                <DetailRow
                    label="CS"
                    value={formatBoolean(business.currentSetup?.hasCS)}
                />
            </Section>

            <Section title="Legal Health" icon={Activity}>
                <div className="py-2">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Legal Health Score
                        </span>
                        <span
                            className={`text-sm font-semibold ${scoreColor}`}
                        >
                            {clamped}/100
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                            className={`h-full rounded-full ${clamped >= 75
                                ? 'bg-green-500'
                                : clamped >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                            style={{ width: `${clamped}%` }}
                        />
                    </div>
                </div>
            </Section>

            <Section title="Subscription" icon={CreditCard}>
                <DetailRow
                    label="Plan"
                    value={formatValue(business.subscription?.plan)}
                />
                <DetailRow
                    label="Status"
                    value={<StatusBadge status={business.subscription?.status} />}
                />
                <DetailRow
                    label="Start Date"
                    value={formatDate(business.subscription?.startDate)}
                />
                <DetailRow
                    label="End Date"
                    value={formatDate(business.subscription?.endDate)}
                />
            </Section>

            <Section title="Workspace" icon={Activity}>
                <DetailRow
                    label="Status"
                    value={<StatusBadge status={business.status} />}
                />
                <DetailRow
                    label="Workspace Status"
                    value={<StatusBadge status={business.workspaceStatus} />}
                />
                <DetailRow
                    label="Onboarding Completed"
                    value={formatBoolean(business.onboardingCompleted)}
                />
            </Section>

            <Section title="Owner" icon={User}>
                <DetailRow
                    label="Full Name"
                    value={formatValue(business.owner?.fullName)}
                />
                <DetailRow
                    label="User ID"
                    value={formatValue(business.owner?.userId)}
                />
                <DetailRow
                    label="Email"
                    value={formatValue(business.owner?.email)}
                />
                <DetailRow
                    label="Phone"
                    value={formatValue(business.owner?.phone)}
                />
                <DetailRow
                    label="Role"
                    value={formatValue(business.owner?.role)}
                />
                <DetailRow
                    label="Account Status"
                    value={formatValue(business.owner?.accountStatus)}
                />
            </Section>
        </div>
    )
}

// ==================================================
// EDIT FORM
// ==================================================

function EditForm({
    form,
    updateField,
    updateNested,
    toggleNeed,
    saving,
    onCancel,
    onSave,
}: {
    form: Partial<Business>
    updateField: <K extends keyof Business>(
        key: K,
        value: Business[K]
    ) => void
    updateNested: (
        key: 'primaryContact' | 'address' | 'currentSetup' | 'subscription',
        patch: Record<string, unknown>
    ) => void
    toggleNeed: (need: string) => void
    saving: boolean
    onCancel: () => void
    onSave: () => void
}) {
    return (
        <div className="space-y-5">
            <Section title="Company Information" icon={Building2}>
                <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
                    <Field label="Company Name">
                        <input
                            className={inputCls}
                            value={form.companyName ?? ''}
                            onChange={(e) =>
                                updateField('companyName', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="Legal Name">
                        <input
                            className={inputCls}
                            value={form.legalName ?? ''}
                            onChange={(e) =>
                                updateField('legalName', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="Company Type">
                        <select
                            className={inputCls}
                            value={form.companyType ?? ''}
                            onChange={(e) =>
                                updateField('companyType', e.target.value)
                            }
                        >
                            <option value="">Select...</option>
                            {COMPANY_TYPES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Industry">
                        <input
                            className={inputCls}
                            value={form.industry ?? ''}
                            onChange={(e) =>
                                updateField('industry', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="Team Size">
                        <select
                            className={inputCls}
                            value={form.teamSize ?? ''}
                            onChange={(e) =>
                                updateField('teamSize', e.target.value)
                            }
                        >
                            <option value="">Select...</option>
                            {TEAM_SIZES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Employee Count">
                        <input
                            type="number"
                            className={inputCls}
                            value={form.employeeCount ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'employeeCount',
                                    e.target.value === ''
                                        ? undefined
                                        : Number(e.target.value)
                                )
                            }
                        />
                    </Field>
                    <Field label="Founded Year">
                        <input
                            type="number"
                            className={inputCls}
                            value={form.foundedYear ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'foundedYear',
                                    e.target.value === ''
                                        ? undefined
                                        : Number(e.target.value)
                                )
                            }
                        />
                    </Field>
                    <Field label="Legal Health Score (0–100)">
                        <input
                            type="number"
                            min={0}
                            max={100}
                            className={inputCls}
                            value={form.legalHealthScore ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'legalHealthScore',
                                    e.target.value === ''
                                        ? undefined
                                        : Number(e.target.value)
                                )
                            }
                        />
                    </Field>
                    <div className="md:col-span-2">
                        <Field label="Description">
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={form.description ?? ''}
                                onChange={(e) =>
                                    updateField('description', e.target.value)
                                }
                            />
                        </Field>
                    </div>
                </div>
            </Section>

            <Section title="Registration" icon={Shield}>
                <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
                    <Field label="Registration Status">
                        <select
                            className={inputCls}
                            value={form.registrationStatus ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'registrationStatus',
                                    e.target.value
                                )
                            }
                        >
                            <option value="">Select...</option>
                            {REGISTRATION_STATUSES.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="CIN">
                        <input
                            className={inputCls}
                            value={form.CIN ?? ''}
                            onChange={(e) =>
                                updateField('CIN', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="GSTIN">
                        <input
                            className={inputCls}
                            value={form.GSTIN ?? ''}
                            onChange={(e) =>
                                updateField('GSTIN', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="PAN">
                        <input
                            className={inputCls}
                            value={form.PAN ?? ''}
                            onChange={(e) =>
                                updateField('PAN', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="TAN">
                        <input
                            className={inputCls}
                            value={form.TAN ?? ''}
                            onChange={(e) =>
                                updateField('TAN', e.target.value)
                            }
                        />
                    </Field>
                </div>
            </Section>

            <Section title="Contact" icon={Mail}>
                <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
                    <Field label="Email">
                        <input
                            className={inputCls}
                            value={form.email ?? ''}
                            onChange={(e) =>
                                updateField('email', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="Phone">
                        <input
                            className={inputCls}
                            value={form.phone ?? ''}
                            onChange={(e) =>
                                updateField('phone', e.target.value)
                            }
                        />
                    </Field>
                    <div className="md:col-span-2">
                        <Field label="Website">
                            <input
                                className={inputCls}
                                value={form.website ?? ''}
                                onChange={(e) =>
                                    updateField('website', e.target.value)
                                }
                            />
                        </Field>
                    </div>
                </div>
            </Section>

            <Section title="Primary Contact" icon={User}>
                <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
                    <Field label="Full Name">
                        <input
                            className={inputCls}
                            value={form.primaryContact?.fullName ?? ''}
                            onChange={(e) =>
                                updateNested('primaryContact', {
                                    fullName: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="Designation">
                        <input
                            className={inputCls}
                            value={form.primaryContact?.designation ?? ''}
                            onChange={(e) =>
                                updateNested('primaryContact', {
                                    designation: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="Email">
                        <input
                            className={inputCls}
                            value={form.primaryContact?.email ?? ''}
                            onChange={(e) =>
                                updateNested('primaryContact', {
                                    email: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="Phone">
                        <input
                            className={inputCls}
                            value={form.primaryContact?.phone ?? ''}
                            onChange={(e) =>
                                updateNested('primaryContact', {
                                    phone: e.target.value,
                                })
                            }
                        />
                    </Field>
                </div>
            </Section>

            <Section title="Address" icon={MapPin}>
                <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Field label="Street">
                            <input
                                className={inputCls}
                                value={form.address?.street ?? ''}
                                onChange={(e) =>
                                    updateNested('address', {
                                        street: e.target.value,
                                    })
                                }
                            />
                        </Field>
                    </div>
                    <Field label="City">
                        <input
                            className={inputCls}
                            value={form.address?.city ?? ''}
                            onChange={(e) =>
                                updateNested('address', {
                                    city: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="State">
                        <input
                            className={inputCls}
                            value={form.address?.state ?? ''}
                            onChange={(e) =>
                                updateNested('address', {
                                    state: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="Country">
                        <input
                            className={inputCls}
                            value={form.address?.country ?? ''}
                            onChange={(e) =>
                                updateNested('address', {
                                    country: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="Pincode">
                        <input
                            className={inputCls}
                            value={form.address?.pincode ?? ''}
                            onChange={(e) =>
                                updateNested('address', {
                                    pincode: e.target.value,
                                })
                            }
                        />
                    </Field>
                </div>
            </Section>

            <Section title="Business Needs" icon={FileText}>
                <div className="flex flex-wrap gap-2 py-2">
                    {BUSINESS_NEEDS.map((need) => {
                        const selected = (form.businessNeeds || []).includes(
                            need
                        )
                        return (
                            <button
                                key={need}
                                type="button"
                                onClick={() => toggleNeed(need)}
                                className={`rounded-lg border px-2.5 py-1 text-xs transition ${selected
                                    ? 'border-amber-400/40 bg-amber-400/20 text-amber-200'
                                    : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                                    }`}
                            >
                                {need}
                            </button>
                        )
                    })}
                </div>
            </Section>

            <Section title="Current Setup" icon={Briefcase}>
                <div className="flex flex-wrap gap-4 py-2">
                    {(
                        [
                            ['hasCA', 'CA'],
                            ['hasLawyer', 'Lawyer'],
                            ['hasCS', 'CS'],
                        ] as const
                    ).map(([key, label]) => (
                        <label
                            key={key}
                            className="flex cursor-pointer items-center gap-2 text-xs text-gray-300"
                        >
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-amber-500"
                                checked={Boolean(
                                    form.currentSetup?.[key]
                                )}
                                onChange={(e) =>
                                    updateNested('currentSetup', {
                                        [key]: e.target.checked,
                                    })
                                }
                            />
                            {label}
                        </label>
                    ))}
                </div>
            </Section>

            <Section title="Subscription" icon={CreditCard}>
                <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
                    <Field label="Plan">
                        <select
                            className={inputCls}
                            value={form.subscription?.plan ?? ''}
                            onChange={(e) =>
                                updateNested('subscription', {
                                    plan: e.target.value,
                                })
                            }
                        >
                            <option value="">Select...</option>
                            {SUBSCRIPTION_PLANS.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Status">
                        <select
                            className={inputCls}
                            value={form.subscription?.status ?? ''}
                            onChange={(e) =>
                                updateNested('subscription', {
                                    status: e.target.value,
                                })
                            }
                        >
                            <option value="">Select...</option>
                            {SUBSCRIPTION_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Start Date">
                        <input
                            type="date"
                            className={inputCls}
                            value={toInputDate(
                                form.subscription?.startDate
                            )}
                            onChange={(e) =>
                                updateNested('subscription', {
                                    startDate: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="End Date">
                        <input
                            type="date"
                            className={inputCls}
                            value={toInputDate(form.subscription?.endDate)}
                            onChange={(e) =>
                                updateNested('subscription', {
                                    endDate: e.target.value,
                                })
                            }
                        />
                    </Field>
                </div>
            </Section>

            <Section title="Workspace" icon={Activity}>
                <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
                    <Field label="Status">
                        <select
                            className={inputCls}
                            value={form.status ?? ''}
                            onChange={(e) =>
                                updateField('status', e.target.value)
                            }
                        >
                            <option value="">Select...</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Workspace Status">
                        <select
                            className={inputCls}
                            value={form.workspaceStatus ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'workspaceStatus',
                                    e.target.value
                                )
                            }
                        >
                            <option value="">Select...</option>
                            {WORKSPACE_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>
            </Section>

            {/* Sticky action bar */}
            <div className="sticky bottom-0 -mx-6 mt-4 flex items-center justify-end gap-2 border-t border-white/[0.06] bg-[#0a0a0a]/95 px-6 py-3 backdrop-blur">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-400/20 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-3.5 w-3.5" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}