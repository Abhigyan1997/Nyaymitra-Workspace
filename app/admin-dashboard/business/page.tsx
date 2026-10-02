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
    Plus,
    Eye,
    EyeOff,
} from 'lucide-react'
import { premiumToast } from '@/lib/premium-toast'

// ==================================================
// API BASE
// ==================================================

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const BUSINESSES_API = `${API_BASE}/admin/businesses`
const LAWYERS_API = `${API_BASE}/lawyer/all`
const REGISTER_BUSINESS_API = `${API_BASE}/business/register`
const ASSIGN_LAWYER_API = (businessId: string) =>
    `${API_BASE}/admin/businesses/${businessId}/lawyer`

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

    // string id of the assigned lawyer (auth user ObjectId)
    assignedLawyer?: string | null

    createdAt?: string
    updatedAt?: string
}

interface BusinessPagination {
    page: number
    limit: number
    total: number
    pages: number
}

// ---- Lawyer types (matching backend nested shape) ----

interface LawyerUserInfo {
    _id?: string // auth user ObjectId (6ab38080bc0e2a4134fb9e7f)
    userId?: string // custom string id (L01M36JVX5PP457MAR00AS03F53)
    fullName?: string
    email?: string
    phone?: string
    profileImage?: string | null
    profilePhoto?: string | null
    gender?: string | null
    address?: Record<string, unknown>
}

interface LawyerDetails {
    _id: string // lawyer profile doc id (6ab38080bc0e2a4134fb9e81)
    userId?: string
    specialization?: string[] | string
    experience?: number | null
    yearsPracticing?: number
    city?: string
    state?: string
    status?: string
    consultationFee?: number
    kycStatus?: string
    verifiedByPlatform?: boolean
    isPremium?: boolean
    averageRating?: number
    totalReviews?: number
    isDeleted?: boolean
    bio?: string
    lawFirm?: string | null
    barCouncilId?: string
    languagesSpoken?: string[]
    timeSlots?: unknown[]
    consultationModes?: Record<string, boolean>
    [key: string]: unknown
}

interface LawyerApiItem {
    userInfo?: LawyerUserInfo
    lawyerDetails?: LawyerDetails
    _id?: string
    fullName?: string
    name?: string
    email?: string
    phone?: string
    specialization?: string | string[]
}

// Normalized shape used throughout the UI
interface Lawyer {
    _id: string // auth user ObjectId (userInfo._id) — sent to backend + React key
    profileId?: string // lawyerDetails._id — reference only
    authUserId?: string // userInfo.userId / lawyerDetails.userId — reference only
    fullName: string
    email: string
    phone: string
    specialization: string
    specializations: string[]
    experience?: number | null
    city?: string
    state?: string
    status?: string
    consultationFee?: number
    kycVerified: boolean
    verifiedByPlatform: boolean
    isPremium: boolean
    averageRating: number
    totalReviews: number
    profileImage?: string | null
    bio?: string
    lawFirm?: string | null
    barCouncilId?: string
    languagesSpoken: string[]
    raw: LawyerApiItem
}

interface AssignedLawyer {
    _id?: string
    lawyerId?: string
    userId?: string
    fullName?: string
    name?: string
    email?: string
    phone?: string
    specialization?: string
    assignedAt?: string
    assignedBy?: string
    status?: string
}

// ---- Add Business form types ----

interface AddBusinessForm {
    fullName: string
    email: string
    phone: string
    password: string
    companyName: string
    legalName: string
    companyType: string
    registrationStatus: string
    industry: string
    website: string
    companyEmail: string
    companyPhone: string
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
const SUBSCRIPTION_STATUSES = ['Trial', 'Active', 'Expired', 'Cancelled']

const EMPTY_ADD_FORM: AddBusinessForm = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    legalName: '',
    companyType: '',
    registrationStatus: 'Registered',
    industry: '',
    website: '',
    companyEmail: '',
    companyPhone: '',
}

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

function normalizeSpecs(spec?: string | string[] | null): string[] {
    if (!spec) return []
    if (Array.isArray(spec)) {
        return spec.map((s) => String(s).trim()).filter(Boolean)
    }
    return String(spec)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

function mapLawyer(item: LawyerApiItem, index: number): Lawyer {
    const user = item.userInfo ?? {}
    const details = item.lawyerDetails ?? ({} as LawyerDetails)

    // ⬇️ Prefer auth user ObjectId (userInfo._id) — this is what backend expects.
    // Falls back to top-level item._id, then lawyerDetails._id, then synthesised.
    const authObjectId =
        user._id ||
        item._id ||
        details._id ||
        `${user.email ?? 'lawyer'}-${index}`

    const profileId = details._id

    const specs = normalizeSpecs(
        details.specialization ?? item.specialization
    )

    const fullName =
        user.fullName?.trim() ||
        item.fullName?.trim() ||
        item.name?.trim() ||
        user.email?.split('@')[0] ||
        'Unnamed Lawyer'

    const profileImage =
        (user.profilePhoto as string | null | undefined) ||
        (user.profileImage as string | null | undefined) ||
        null

    return {
        _id: authObjectId,
        profileId,
        authUserId: details.userId || user.userId,
        fullName,
        email: user.email ?? item.email ?? '',
        phone: user.phone ?? item.phone ?? '',
        specialization: specs.join(', '),
        specializations: specs,
        experience:
            details.experience ?? details.yearsPracticing ?? undefined,
        city: details.city,
        state: details.state,
        status: details.status,
        consultationFee: details.consultationFee,
        kycVerified:
            String(details.kycStatus || '').toLowerCase() === 'verified',
        verifiedByPlatform: Boolean(details.verifiedByPlatform),
        isPremium: Boolean(details.isPremium),
        averageRating: details.averageRating ?? 0,
        totalReviews: details.totalReviews ?? 0,
        profileImage,
        bio: details.bio,
        lawFirm: details.lawFirm,
        barCouncilId: details.barCouncilId,
        languagesSpoken: Array.isArray(details.languagesSpoken)
            ? details.languagesSpoken
            : [],
        raw: item,
    }
}

function lawyerToAssignedLawyer(l: Lawyer): AssignedLawyer {
    return {
        _id: l._id,
        lawyerId: l._id,
        userId: l.authUserId,
        fullName: l.fullName,
        name: l.fullName,
        email: l.email,
        phone: l.phone,
        specialization: l.specialization,
        status: l.status,
    }
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
    required,
}: {
    label: string
    children: React.ReactNode
    required?: boolean
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs text-gray-500">
                {label}
                {required && <span className="ml-0.5 text-amber-400">*</span>}
            </span>
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

    // ----- lawyer assignment -----
    const [assignedLawyer, setAssignedLawyer] = useState<AssignedLawyer | null>(
        null
    )
    const [assignedLawyerLoading, setAssignedLawyerLoading] = useState(false)
    const [assignedLawyerError, setAssignedLawyerError] = useState<
        string | null
    >(null)

    const [lawyers, setLawyers] = useState<Lawyer[]>([])
    const [lawyersLoading, setLawyersLoading] = useState(false)
    const [lawyersError, setLawyersError] = useState<string | null>(null)
    const [lawyerSearch, setLawyerSearch] = useState('')

    const [showAssignModal, setShowAssignModal] = useState(false)
    const [assigning, setAssigning] = useState(false)
    const [assignError, setAssignError] = useState<string | null>(null)
    const [removingLawyer, setRemovingLawyer] = useState(false)

    // ----- add business modal -----
    const [showAddModal, setShowAddModal] = useState(false)
    const [addForm, setAddForm] = useState<AddBusinessForm>(EMPTY_ADD_FORM)
    const [addSaving, setAddSaving] = useState(false)
    const [addError, setAddError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

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

                // ===== SUCCESS TOAST (only on manual refresh) =====
                if (isRefresh) {
                    premiumToast.success('Refreshed', {
                        description: `Loaded ${list.length} business${list.length === 1 ? '' : 'es'}.`,
                        duration: 2000,
                    })
                }
            } catch (err) {
                if ((err as Error)?.name === 'AbortError') return

                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load businesses.'

                setListError(message)

                // ===== ERROR TOAST (context-aware) =====
                if (isRefresh) {
                    premiumToast.error('Refresh failed', {
                        description: message,
                    })
                } else {
                    premiumToast.error('Could not load businesses', {
                        description: message,
                    })
                }
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
    // ADD BUSINESS
    // ==================================================

    const openAddModal = () => {
        setAddForm(EMPTY_ADD_FORM)
        setAddError(null)
        setShowPassword(false)
        setShowAddModal(true)
    }

    const closeAddModal = () => {
        if (addSaving) return
        setShowAddModal(false)
        setAddForm(EMPTY_ADD_FORM)
        setAddError(null)
    }

    const updateAddField = <K extends keyof AddBusinessForm>(
        key: K,
        value: AddBusinessForm[K]
    ) => {
        setAddForm((prev) => ({ ...prev, [key]: value }))
    }

    const validateAddForm = (): string | null => {
        const f = addForm
        if (!f.fullName.trim()) return 'Full name is required.'
        if (!f.email.trim()) return 'Owner email is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
            return 'Please enter a valid owner email address.'
        if (!f.phone.trim()) return 'Owner phone is required.'
        if (!f.password.trim()) return 'Password is required.'
        if (f.password.length < 8)
            return 'Password must be at least 8 characters long.'
        if (!f.companyName.trim()) return 'Company name is required.'
        if (!f.legalName.trim()) return 'Legal name is required.'
        if (!f.companyType.trim()) return 'Company type is required.'
        if (!f.registrationStatus.trim())
            return 'Registration status is required.'
        if (!f.industry.trim()) return 'Industry is required.'
        if (f.companyEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.companyEmail.trim()))
            return 'Please enter a valid company email address.'
        return null
    }

    const handleAddBusiness = async () => {
        const validationError = validateAddForm()
        if (validationError) {
            setAddError(validationError)
            premiumToast.error('Validation failed', {
                description: validationError,
            })
            return
        }

        setAddSaving(true)
        setAddError(null)

        try {
            const token = getAuthToken()
            if (!token) {
                throw new Error(
                    'Authentication required. Please sign in again.'
                )
            }

            // Build payload — only send non-empty optional fields
            const payload: Record<string, string> = {
                fullName: addForm.fullName.trim(),
                email: addForm.email.trim(),
                phone: addForm.phone.trim(),
                password: addForm.password,
                companyName: addForm.companyName.trim(),
                legalName: addForm.legalName.trim(),
                companyType: addForm.companyType.trim(),
                registrationStatus: addForm.registrationStatus.trim(),
                industry: addForm.industry.trim(),
            }
            if (addForm.website.trim())
                payload.website = addForm.website.trim()
            if (addForm.companyEmail.trim())
                payload.companyEmail = addForm.companyEmail.trim()
            if (addForm.companyPhone.trim())
                payload.companyPhone = addForm.companyPhone.trim()

            const res = await fetch(REGISTER_BUSINESS_API, {
                method: 'POST',
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
                if (res.status === 409)
                    throw new Error(
                        json?.message ||
                        'A business or user with these details already exists.'
                    )
                throw new Error(
                    json?.message ||
                    `Registration failed with status ${res.status}`
                )
            }

            const createdName = addForm.companyName.trim()

            setShowAddModal(false)
            setAddForm(EMPTY_ADD_FORM)

            // Refresh the list so the new business appears
            await fetchBusinesses(true)

            // ===== SUCCESS TOAST =====
            premiumToast.success('Business added', {
                description: `${createdName} has been registered successfully.`,
            })
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to add business.'

            setAddError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Could not add business', {
                description: message,
            })
        } finally {
            setAddSaving(false)
        }
    }

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
                    throw new Error(json?.message || 'Business not found.')
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
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to load business details.'

            setDetailError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Could not load details', {
                description: message,
            })
        } finally {
            setDetailLoading(false)
        }
    }, [])

    // ==================================================
    // LAWYER ASSIGNMENT
    // ==================================================

    const fetchAssignedLawyer = useCallback(
        async (businessId: string, businessAssignedId?: string | null) => {
            setAssignedLawyerLoading(true)
            setAssignedLawyerError(null)
            setAssignedLawyer(null)

            try {
                const token = getAuthToken()
                if (!token) throw new Error('Authentication required.')

                // ---- Try dedicated endpoint first ----
                try {
                    const res = await fetch(ASSIGN_LAWYER_API(businessId), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    })

                    // 404 = nothing assigned — fall through to string fallback
                    if (res.status !== 404) {
                        const json = await res.json().catch(() => ({}))
                        if (res.ok) {
                            const payload: AssignedLawyer | null =
                                json?.data?.lawyer || json?.data || null
                            if (
                                payload &&
                                (payload._id || payload.lawyerId)
                            ) {
                                setAssignedLawyer(payload)
                                return
                            }
                        }
                    }
                } catch {
                    // swallow — fall through to string lookup
                }

                // ---- Fallback: use the string id on the business ----
                const idToFind = businessAssignedId
                if (!idToFind) {
                    setAssignedLawyer(null)
                    return
                }

                // 1) Check if we already have the lawyer loaded
                const local = lawyers.find(
                    (l) =>
                        l._id === idToFind ||
                        l.profileId === idToFind ||
                        l.authUserId === idToFind
                )
                if (local) {
                    setAssignedLawyer(lawyerToAssignedLawyer(local))
                    return
                }

                // 2) Not loaded yet — fetch the full lawyers list once and look it up
                try {
                    const res = await fetch(`${LAWYERS_API}?limit=500`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    })
                    const json = await res.json().catch(() => ({}))
                    if (res.ok) {
                        const rawList: LawyerApiItem[] = Array.isArray(
                            json?.lawyers
                        )
                            ? json.lawyers
                            : Array.isArray(json?.data?.lawyers)
                                ? json.data.lawyers
                                : Array.isArray(json?.data)
                                    ? json.data
                                    : []
                        const normalized = rawList.map(mapLawyer)
                        setLawyers(normalized)
                        const found = normalized.find(
                            (l) =>
                                l._id === idToFind ||
                                l.profileId === idToFind ||
                                l.authUserId === idToFind
                        )
                        if (found) {
                            setAssignedLawyer(lawyerToAssignedLawyer(found))
                            return
                        }
                    }
                } catch {
                    // ignore — show placeholder below
                }

                // 3) We know it's assigned, just don't have details
                setAssignedLawyer({
                    _id: idToFind,
                    lawyerId: idToFind,
                    fullName: 'Assigned Lawyer',
                    name: 'Assigned Lawyer',
                })
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load assigned lawyer.'

                setAssignedLawyerError(message)

                // ===== ERROR TOAST =====
                premiumToast.error('Could not load assigned lawyer', {
                    description: message,
                })
            } finally {
                setAssignedLawyerLoading(false)
            }
        },
        [lawyers]
    )

    const fetchLawyers = useCallback(async () => {
        setLawyersLoading(true)
        setLawyersError(null)

        try {
            const token = getAuthToken()
            if (!token) throw new Error('Authentication required.')

            const params = new URLSearchParams()
            params.set('limit', '200')
            if (lawyerSearch) params.set('search', lawyerSearch)

            const res = await fetch(`${LAWYERS_API}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })

            const json = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(
                    json?.message || `Failed to load lawyers (${res.status})`
                )
            }

            // Backend returns: { lawyers: [{ userInfo, lawyerDetails }] }
            const rawList: LawyerApiItem[] = Array.isArray(json?.lawyers)
                ? json.lawyers
                : Array.isArray(json?.data?.lawyers)
                    ? json.data.lawyers
                    : Array.isArray(json?.data)
                        ? json.data
                        : []

            setLawyers(rawList.map(mapLawyer))
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to load lawyers.'

            setLawyersError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Could not load lawyers', {
                description: message,
            })
        } finally {
            setLawyersLoading(false)
        }
    }, [lawyerSearch])

    const handleView = (id: string) => {
        setDetailId(id)
        setEditing(false)
        setSuccessMessage(null)
        setSaveError(null)
        setAssignedLawyer(null)
        setAssignedLawyerError(null)
        fetchDetails(id)
        // Assigned lawyer will be resolved once `detail` is loaded — see effect below
    }

    // Resolve assigned lawyer whenever the business detail is loaded / refreshed
    useEffect(() => {
        if (!detailId || !detail) return
        fetchAssignedLawyer(detailId, detail.assignedLawyer ?? null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailId, detail?._id, detail?.assignedLawyer])

    const closeDrawer = () => {
        setDetailId(null)
        setDetail(null)
        setEditing(false)
        setSaveError(null)
        setSuccessMessage(null)
        setAssignedLawyer(null)
        setAssignedLawyerError(null)
        setShowAssignModal(false)
    }

    const openAssignModal = () => {
        setShowAssignModal(true)
        setAssignError(null)
        setLawyerSearch('')
        fetchLawyers()
    }

    // Pass the full Lawyer object; we send lawyer._id (auth user ObjectId)
    const handleAssignLawyer = async (lawyer: Lawyer) => {
        if (!detailId) return
        setAssigning(true)
        setAssignError(null)

        try {
            const token = getAuthToken()
            if (!token) throw new Error('Authentication required.')

            // Send the AUTH USER ObjectId (userInfo._id) — e.g. 6ab38080bc0e2a4134fb9e7f
            const payload = {
                lawyerId: lawyer._id,
            }

            const res = await fetch(ASSIGN_LAWYER_API(detailId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            const json = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(
                    json?.message ||
                    `Failed to assign lawyer (${res.status})`
                )
            }

            setShowAssignModal(false)
            setSuccessMessage(
                json?.message || 'Lawyer assigned successfully.'
            )

            // Optimistically update drawer, then re-fetch business detail
            setAssignedLawyer(lawyerToAssignedLawyer(lawyer))
            if (detailId) {
                await fetchDetails(detailId)
            }

            // ===== SUCCESS TOAST =====
            premiumToast.success('Lawyer assigned', {
                description: `${lawyer.fullName} is now assigned to this business.`,
            })

            window.setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to assign lawyer.'

            setAssignError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Assignment failed', {
                description: message,
            })
        } finally {
            setAssigning(false)
        }
    }

    const handleRemoveLawyer = async () => {
        if (!detailId) return
        if (
            !window.confirm('Remove the assigned lawyer from this business?')
        )
            return

        const removedName =
            assignedLawyer?.fullName ||
            assignedLawyer?.name ||
            'Lawyer'

        setRemovingLawyer(true)
        setAssignedLawyerError(null)

        try {
            const token = getAuthToken()
            if (!token) throw new Error('Authentication required.')

            const res = await fetch(ASSIGN_LAWYER_API(detailId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })

            const json = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(
                    json?.message ||
                    `Failed to remove lawyer (${res.status})`
                )
            }

            setAssignedLawyer(null)
            setSuccessMessage(json?.message || 'Lawyer removed successfully.')

            if (detailId) {
                await fetchDetails(detailId)
            }

            // ===== SUCCESS TOAST =====
            premiumToast.success('Lawyer removed', {
                description: `${removedName} is no longer assigned.`,
            })

            window.setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to remove lawyer.'

            setAssignedLawyerError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Remove failed', {
                description: message,
            })
        } finally {
            setRemovingLawyer(false)
        }
    }

    // Debounced lawyer search while modal is open
    useEffect(() => {
        if (!showAssignModal) return
        const t = window.setTimeout(() => {
            fetchLawyers()
        }, 350)
        return () => window.clearTimeout(t)
    }, [lawyerSearch, showAssignModal, fetchLawyers])

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
                    throw new Error(json?.message || 'Business not found.')
                throw new Error(
                    json?.message || `Save failed with status ${res.status}`
                )
            }

            setSuccessMessage(json?.message || 'Business updated successfully.')
            setEditing(false)

            await Promise.all([
                fetchDetails(detailId),
                fetchBusinesses(true),
            ])

            // ===== SUCCESS TOAST =====
            premiumToast.success('Business updated', {
                description: form.companyName?.trim()
                    ? `Changes saved to "${form.companyName.trim()}".`
                    : 'Your changes have been saved.',
            })

            window.setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to save changes.'

            setSaveError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Save failed', {
                description: message,
            })
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

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-sm font-medium text-amber-400 transition hover:bg-amber-400/20"
                            >
                                <Plus className="h-4 w-4" />
                                Add Business
                            </button>

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
                    </div>

                    {/* Filters */}
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by name, email, CIN..."
                                className={`${inputCls} pl-9`}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
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
                            onChange={(e) => setIndustryFilter(e.target.value)}
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
                            description="Try adjusting your search or filters, or click 'Add Business' to create one."
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
                                            setPage((p) => Math.max(1, p - 1))
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
                                        onClick={() => setPage((p) => p + 1)}
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
                                            ? formatValue(detail.companyName)
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
                                {detailLoading && <Skeleton rows={8} />}

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

                                        {/* Assigned Lawyer Section (view mode only) */}
                                        {!editing && (
                                            <AssignedLawyerSection
                                                assignedLawyer={assignedLawyer}
                                                loading={assignedLawyerLoading}
                                                error={assignedLawyerError}
                                                removing={removingLawyer}
                                                onAssign={openAssignModal}
                                                onRemove={handleRemoveLawyer}
                                                onRetry={() =>
                                                    detailId &&
                                                    fetchAssignedLawyer(
                                                        detailId,
                                                        detail.assignedLawyer ??
                                                        null
                                                    )
                                                }
                                            />
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

            {/* ---------- Assign Lawyer Modal ---------- */}
            <AnimatePresence>
                {showAssignModal && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() =>
                                !assigning && setShowAssignModal(false)
                            }
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]"
                        >
                            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-white">
                                        {assignedLawyer
                                            ? 'Change Lawyer'
                                            : 'Assign Lawyer'}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-gray-600">
                                        Select a lawyer to assign to this
                                        business.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        !assigning && setShowAssignModal(false)
                                    }
                                    className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-gray-400 transition hover:bg-white/[0.08]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="border-b border-white/[0.06] px-5 py-3">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={lawyerSearch}
                                        onChange={(e) =>
                                            setLawyerSearch(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter')
                                                fetchLawyers()
                                        }}
                                        placeholder="Search lawyers by name, email..."
                                        className={`${inputCls} pl-9`}
                                    />
                                </div>
                            </div>

                            {assignError && (
                                <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>{assignError}</span>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto px-5 py-3">
                                {lawyersLoading ? (
                                    <Skeleton rows={5} />
                                ) : lawyersError ? (
                                    <div className="flex items-center gap-2 py-6 text-xs text-red-400">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>{lawyersError}</span>
                                    </div>
                                ) : lawyers.length === 0 ? (
                                    <EmptyState
                                        title="No lawyers found"
                                        description="Try a different search term."
                                        icon={User}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        {lawyers.map((l) => {
                                            // Match against auth ObjectId OR profileId OR authUserId
                                            // so the "Current" badge works regardless of
                                            // what the backend stored.
                                            const isCurrent =
                                                assignedLawyer?.lawyerId ===
                                                l._id ||
                                                assignedLawyer?._id === l._id ||
                                                assignedLawyer?.lawyerId ===
                                                l.profileId ||
                                                assignedLawyer?._id ===
                                                l.profileId ||
                                                assignedLawyer?.userId ===
                                                l.authUserId

                                            return (
                                                <button
                                                    key={l._id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleAssignLawyer(l)
                                                    }
                                                    disabled={
                                                        assigning || isCurrent
                                                    }
                                                    className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-left transition hover:border-amber-400/30 hover:bg-amber-400/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {l.profileImage ? (
                                                        <img
                                                            src={l.profileImage}
                                                            alt=""
                                                            className="h-9 w-9 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                                                            <User className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-white">
                                                            {l.fullName}
                                                            {isCurrent && (
                                                                <span className="ml-2 rounded-md border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400">
                                                                    Current
                                                                </span>
                                                            )}
                                                            {l.verifiedByPlatform && (
                                                                <span className="ml-2 rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">
                                                                    Verified
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="truncate text-xs text-gray-500">
                                                            {l.email || '—'}
                                                            {l.phone
                                                                ? ` • ${l.phone}`
                                                                : ''}
                                                        </p>
                                                        {l.specialization && (
                                                            <p className="truncate text-[11px] text-gray-600">
                                                                {
                                                                    l.specialization
                                                                }
                                                                {l.experience
                                                                    ? ` • ${l.experience} yr exp`
                                                                    : ''}
                                                                {l.city
                                                                    ? ` • ${l.city}`
                                                                    : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {assigning ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---------- Add Business Modal ---------- */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={closeAddModal}
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-white">
                                        Add Business
                                    </h3>
                                    <p className="mt-0.5 text-xs text-gray-600">
                                        Register a new business and owner
                                        account.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeAddModal}
                                    disabled={addSaving}
                                    className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-gray-400 transition hover:bg-white/[0.08] disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {addError && (
                                <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>{addError}</span>
                                </div>
                            )}

                            {/* Modal body */}
                            <div className="flex-1 overflow-y-auto px-5 py-5">
                                {/* Owner details */}
                                <div className="mb-5">
                                    <div className="mb-2 flex items-center gap-2">
                                        <User className="h-4 w-4 text-amber-400" />
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Owner Account
                                        </h3>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-4">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <Field label="Full Name" required>
                                                <input
                                                    className={inputCls}
                                                    value={addForm.fullName}
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'fullName',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. Alok Abhigyan"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                            <Field label="Email" required>
                                                <input
                                                    type="email"
                                                    className={inputCls}
                                                    value={addForm.email}
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'email',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="owner@example.com"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                            <Field label="Phone" required>
                                                <input
                                                    className={inputCls}
                                                    value={addForm.phone}
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'phone',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="9876543210"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                            <Field label="Password" required>
                                                <div className="relative">
                                                    <input
                                                        type={
                                                            showPassword
                                                                ? 'text'
                                                                : 'password'
                                                        }
                                                        className={`${inputCls} pr-10`}
                                                        value={addForm.password}
                                                        onChange={(e) =>
                                                            updateAddField(
                                                                'password',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Min. 8 characters"
                                                        disabled={addSaving}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPassword(
                                                                (v) => !v
                                                            )
                                                        }
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition hover:text-gray-300"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {/* Company details */}
                                <div className="mb-5">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-amber-400" />
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Company Details
                                        </h3>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-4">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <Field
                                                label="Company Name"
                                                required
                                            >
                                                <input
                                                    className={inputCls}
                                                    value={
                                                        addForm.companyName
                                                    }
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'companyName',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. NyayMitra Technologies Pvt Ltd"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                            <Field
                                                label="Legal Name"
                                                required
                                            >
                                                <input
                                                    className={inputCls}
                                                    value={addForm.legalName}
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'legalName',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. NyayMitra Technologies Private Limited"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                            <Field
                                                label="Company Type"
                                                required
                                            >
                                                <select
                                                    className={inputCls}
                                                    value={addForm.companyType}
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'companyType',
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={addSaving}
                                                >
                                                    <option value="">
                                                        Select...
                                                    </option>
                                                    {COMPANY_TYPES.map((c) => (
                                                        <option
                                                            key={c}
                                                            value={c}
                                                        >
                                                            {c}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>
                                            <Field
                                                label="Registration Status"
                                                required
                                            >
                                                <select
                                                    className={inputCls}
                                                    value={
                                                        addForm.registrationStatus
                                                    }
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'registrationStatus',
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={addSaving}
                                                >
                                                    {REGISTRATION_STATUSES.map(
                                                        (r) => (
                                                            <option
                                                                key={r}
                                                                value={r}
                                                            >
                                                                {r}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </Field>
                                            <Field
                                                label="Industry"
                                                required
                                            >
                                                <input
                                                    className={inputCls}
                                                    value={addForm.industry}
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'industry',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. LegalTech"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                            <Field label="Website">
                                                <input
                                                    className={inputCls}
                                                    value={addForm.website}
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'website',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="https://example.com"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                            <Field label="Company Email">
                                                <input
                                                    type="email"
                                                    className={inputCls}
                                                    value={
                                                        addForm.companyEmail
                                                    }
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'companyEmail',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="contact@example.com"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                            <Field label="Company Phone">
                                                <input
                                                    className={inputCls}
                                                    value={
                                                        addForm.companyPhone
                                                    }
                                                    onChange={(e) =>
                                                        updateAddField(
                                                            'companyPhone',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="9876543210"
                                                    disabled={addSaving}
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sticky action bar */}
                            <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-[#0a0a0a]/95 px-5 py-3 backdrop-blur">
                                <button
                                    type="button"
                                    onClick={closeAddModal}
                                    disabled={addSaving}
                                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddBusiness}
                                    disabled={addSaving}
                                    className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-400/20 disabled:opacity-50"
                                >
                                    {addSaving ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Business
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
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
                    value={formatValue(business.primaryContact?.fullName)}
                />
                <DetailRow
                    label="Designation"
                    value={formatValue(business.primaryContact?.designation)}
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
                {business.businessNeeds && business.businessNeeds.length > 0 ? (
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
                        <span className={`text-sm font-semibold ${scoreColor}`}>
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
                    value={
                        <StatusBadge status={business.subscription?.status} />
                    }
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
// ASSIGNED LAWYER SECTION
// ==================================================

function AssignedLawyerSection({
    assignedLawyer,
    loading,
    error,
    removing,
    onAssign,
    onRemove,
    onRetry,
}: {
    assignedLawyer: AssignedLawyer | null
    loading: boolean
    error: string | null
    removing: boolean
    onAssign: () => void
    onRemove: () => void
    onRetry: () => void
}) {
    const name =
        assignedLawyer?.fullName || assignedLawyer?.name || 'Unnamed Lawyer'

    return (
        <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Assigned Lawyer
                    </h3>
                </div>

                {!loading && (
                    <button
                        type="button"
                        onClick={onAssign}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-400 transition hover:bg-amber-400/20"
                    >
                        {assignedLawyer ? 'Change' : 'Assign Lawyer'}
                    </button>
                )}
            </div>

            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                {loading && (
                    <div className="space-y-2">
                        <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.06]" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.04]" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.04]" />
                    </div>
                )}

                {!loading && error && (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="ml-auto underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && !assignedLawyer && (
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">
                            No lawyer assigned to this business yet.
                        </p>
                    </div>
                )}

                {!loading && !error && assignedLawyer && (
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1.5">
                            <p className="truncate text-sm font-medium text-white">
                                {name}
                            </p>
                            {assignedLawyer.email && (
                                <p className="flex items-center gap-1.5 truncate text-xs text-gray-400">
                                    <Mail className="h-3 w-3 text-gray-600" />
                                    {assignedLawyer.email}
                                </p>
                            )}
                            {assignedLawyer.phone && (
                                <p className="flex items-center gap-1.5 truncate text-xs text-gray-400">
                                    <Phone className="h-3 w-3 text-gray-600" />
                                    {assignedLawyer.phone}
                                </p>
                            )}
                            {assignedLawyer.specialization && (
                                <p className="flex items-center gap-1.5 truncate text-xs text-gray-400">
                                    <Briefcase className="h-3 w-3 text-gray-600" />
                                    {assignedLawyer.specialization}
                                </p>
                            )}
                            {assignedLawyer.assignedAt && (
                                <p className="text-[11px] text-gray-600">
                                    Assigned on{' '}
                                    {formatDate(assignedLawyer.assignedAt)}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onRemove}
                            disabled={removing}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                            {removing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <X className="h-3 w-3" />
                            )}
                            Remove
                        </button>
                    </div>
                )}
            </div>
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
                            onChange={(e) => updateField('CIN', e.target.value)}
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
                            onChange={(e) => updateField('PAN', e.target.value)}
                        />
                    </Field>
                    <Field label="TAN">
                        <input
                            className={inputCls}
                            value={form.TAN ?? ''}
                            onChange={(e) => updateField('TAN', e.target.value)}
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
                                checked={Boolean(form.currentSetup?.[key])}
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
                            value={toInputDate(form.subscription?.startDate)}
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
                                updateField('workspaceStatus', e.target.value)
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