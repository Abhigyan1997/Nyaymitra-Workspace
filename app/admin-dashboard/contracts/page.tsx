'use client'

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    AlertCircle,
    BriefcaseBusiness,
    CalendarDays,
    ChevronDown,
    FileText,
    Loader2,
    Pencil,
    RefreshCw,
    Search,
    Trash2,
    UserRoundCheck,
    X,
} from 'lucide-react'

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const REQUESTS_API = `${API_BASE}/admin/contract-requests`
const contractDetailUrl = (contractId: string) =>
    `${REQUESTS_API}/${contractId}`

// Status update endpoint (adjust if your route differs)
const contractStatusUrl = (contractId: string) =>
    `${REQUESTS_API}/${contractId}/status`

const LAWYERS_API = `${API_BASE}/lawyer/all`

// Allowed contract statuses per backend
const CONTRACT_STATUSES = [
    'Draft',
    'Internal Review',
    'Client Review',
    'Revision Requested',
    'Approved',
    'Pending Signature',
    'Executed',
    'Active',
    'Expired',
    'Terminated',
    'Archived',
] as const

type ContractStatus = (typeof CONTRACT_STATUSES)[number]

type RequestStatus =
    | 'draft'
    | 'submitted'
    | 'under-review'
    | 'assigned'
    | 'in-progress'
    | 'waiting-for-client'
    | 'completed'
    | 'cancelled'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

interface Lawyer {
    _id: string
    userId?: string
    fullName?: string
    name?: string
    email?: string
    role?: string
    profilePhoto?: string
    profileImage?: string
    specialization?: string[]
    experience?: number
    city?: string
    state?: string
    userInfo?: {
        fullName?: string
        email?: string
        phone?: string
        profileImage?: string | null
    }
    lawyerDetails?: {
        _id?: string
        specialization?: string[]
        experience?: number
        city?: string
        state?: string
        email?: string
    }
}

interface Business {
    _id: string
    companyName?: string
    legalName?: string
    industry?: string
}

interface AssignedProfessional {
    _id?: string
    userId?: string
    fullName?: string
    email?: string
    role?: string
}

interface ContractRequest {
    _id: string
    requestNumber?: string
    contractNumber?: string

    business: string | Business | null

    createdBy?:
    | string
    | {
        _id?: string
        fullName?: string
        email?: string
    }
    | null

    owner?: {
        _id?: string
        userId?: string
        fullName?: string
        email?: string
    }

    title: string
    category?: string
    customCategory?: string
    contractType?: string
    description?: string
    additionalInformation?: string
    currency?: string

    priority: Priority
    deadline?: string | null

    preferredProfessionalType?: string

    counterparty?: { name?: string }

    currentDocument?: {
        _id?: string
        category?: string
        status?: string
        visibility?: string
        url?: string
        fileName?: string
        fileUrl?: string
    }

    supportingDocuments?: Array<{
        _id?: string
        category?: string
        status?: string
        visibility?: string
        url?: string
        fileName?: string
        fileUrl?: string
    }>

    assignedTo?: string | Lawyer | null
    assignedProfessional?:
    | string
    | AssignedProfessional
    | Lawyer
    | null

    status: RequestStatus | string
    isArchived?: boolean

    createdAt?: string
    updatedAt?: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

interface RequestsResponse {
    success: boolean
    data?: ContractRequest[]
    pagination?: Pagination
    message?: string
}

interface LawyersResponse {
    success: boolean
    lawyers?: any[]
    data?: any[]
    count?: number
    page?: number
    limit?: number
    totalPages?: number
    message?: string
}

interface ContractDetailResponse {
    success: boolean
    data?: ContractRequest
    message?: string
}

function getToken() {
    if (typeof window === 'undefined') return ''
    return (
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        ''
    )
}

async function apiFetch<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
        cache: 'no-store',
    })

    let result: any = null
    try {
        result = await response.json()
    } catch {
        // ignore non-JSON
    }

    if (!response.ok) {
        throw new Error(
            result?.message || `Request failed (${response.status})`
        )
    }

    return result as T
}

function formatDate(value?: string | null) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

/**
 * Map any backend status label to a slug used for badge colors/stats.
 */
function normalizeStatus(status?: string): RequestStatus {
    if (!status) return 'submitted'

    const slug = status
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-')

    switch (slug) {
        case 'draft':
            return 'draft'
        case 'submitted':
            return 'submitted'
        case 'internal-review':
        case 'under-review':
        case 'review':
        case 'client-review':
        case 'revision-requested':
            return 'under-review'
        case 'approved':
        case 'pending-signature':
            return 'assigned'
        case 'assigned':
            return 'assigned'
        case 'executed':
        case 'active':
        case 'in-progress':
            return 'in-progress'
        case 'waiting-for-client':
            return 'waiting-for-client'
        case 'completed':
            return 'completed'
        case 'expired':
        case 'terminated':
        case 'archived':
        case 'cancelled':
        case 'canceled':
            return 'cancelled'
        default:
            return 'submitted'
    }
}

function formatStatus(status?: string) {
    if (!status) return '—'
    return String(status)
        .split(/[-\s]/)
        .map(
            (part) =>
                part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join(' ')
}

function getBusinessName(
    business: string | Business | null | undefined
) {
    if (!business) return 'Unknown Business'
    if (typeof business === 'string') return business
    return (
        business.companyName ||
        business.legalName ||
        'Unknown Business'
    )
}

/**
 * Return the assigned professional object regardless of whether the
 * backend used `assignedTo` or `assignedProfessional`.
 */
function getAssigned(
    request: ContractRequest | null | undefined
):
    | string
    | AssignedProfessional
    | Lawyer
    | null
    | undefined {
    if (!request) return null
    return (
        (request as any).assignedProfessional ??
        request.assignedTo ??
        null
    )
}

function getLawyerName(
    lawyer:
        | string
        | AssignedProfessional
        | Lawyer
        | null
        | undefined
) {
    if (!lawyer) return 'Not assigned'
    if (typeof lawyer === 'string') return lawyer
    return (
        (lawyer as any).fullName ||
        (lawyer as any).userInfo?.fullName ||
        (lawyer as any).name ||
        'Unknown Lawyer'
    )
}

function getLawyerEmail(
    lawyer:
        | string
        | AssignedProfessional
        | Lawyer
        | null
        | undefined
) {
    if (!lawyer || typeof lawyer === 'string') return ''
    return (
        (lawyer as any).email ||
        (lawyer as any).userInfo?.email ||
        (lawyer as any).lawyerDetails?.email ||
        ''
    )
}

function statusClass(status: RequestStatus) {
    switch (status) {
        case 'draft':
            return 'border-zinc-700 bg-zinc-800 text-zinc-300'
        case 'submitted':
            return 'border-blue-400/20 bg-blue-400/10 text-blue-300'
        case 'under-review':
            return 'border-amber-400/20 bg-amber-400/10 text-amber-300'
        case 'assigned':
            return 'border-violet-400/20 bg-violet-400/10 text-violet-300'
        case 'in-progress':
            return 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
        case 'waiting-for-client':
            return 'border-orange-400/20 bg-orange-400/10 text-orange-300'
        case 'completed':
            return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
        case 'cancelled':
            return 'border-red-400/20 bg-red-400/10 text-red-300'
        default:
            return 'border-zinc-700 bg-zinc-800 text-zinc-300'
    }
}

function priorityClass(priority: Priority) {
    switch (priority) {
        case 'urgent':
            return 'text-red-400'
        case 'high':
            return 'text-amber-400'
        case 'medium':
            return 'text-blue-400'
        case 'low':
            return 'text-emerald-400'
        default:
            return 'text-zinc-400'
    }
}

function getInitials(name?: string) {
    if (!name) return 'U'
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
}

function Avatar({ name }: { name: string }) {
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-[11px] font-semibold text-amber-400">
            {getInitials(name)}
        </div>
    )
}

function normalizeLawyer(raw: any): Lawyer {
    const info = raw?.userInfo || {}
    const details = raw?.lawyerDetails || {}
    return {
        _id: raw?._id || details?._id || '',
        userId: raw?.userId,
        fullName:
            raw?.fullName ||
            info?.fullName ||
            raw?.name ||
            'Unknown Lawyer',
        name: raw?.name,
        email: raw?.email || info?.email || details?.email || '',
        profilePhoto:
            raw?.profilePhoto ||
            raw?.profileImage ||
            info?.profileImage ||
            undefined,
        specialization:
            raw?.specialization || details?.specialization || [],
        experience: raw?.experience ?? details?.experience,
        city: raw?.city || details?.city,
        state: raw?.state || details?.state,
        userInfo: raw?.userInfo,
        lawyerDetails: raw?.lawyerDetails,
    }
}

interface EditFormState {
    title: string
    contractType: string
    category: string
    priority: Priority | ''
    status: string
    deadline: string
    description: string
    additionalInformation: string
    counterpartyName: string
}

const EMPTY_EDIT_FORM: EditFormState = {
    title: '',
    contractType: '',
    category: '',
    priority: 'medium',
    status: 'Draft',
    deadline: '',
    description: '',
    additionalInformation: '',
    counterpartyName: '',
}

function toDateInput(value?: string | null) {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
}

export default function AdminContractsPage() {
    const [requests, setRequests] = useState<ContractRequest[]>([])
    const [lawyers, setLawyers] = useState<Lawyer[]>([])

    const [loading, setLoading] = useState(true)
    const [lawyersLoading, setLawyersLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')

    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    })

    // Assign modal
    const [selectedRequest, setSelectedRequest] =
        useState<ContractRequest | null>(null)
    const [selectedLawyer, setSelectedLawyer] = useState('')
    const [lawyerQuery, setLawyerQuery] = useState('')
    const [assigning, setAssigning] = useState(false)
    const [assignError, setAssignError] = useState('')

    // Details modal
    const [detailsRequest, setDetailsRequest] =
        useState<ContractRequest | null>(null)
    const [details, setDetails] = useState<ContractRequest | null>(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [detailsError, setDetailsError] = useState('')

    // Inline status update
    const [statusUpdating, setStatusUpdating] = useState(false)
    const [statusError, setStatusError] = useState('')

    // Edit modal
    const [editRequest, setEditRequest] =
        useState<ContractRequest | null>(null)
    const [editForm, setEditForm] =
        useState<EditFormState>(EMPTY_EDIT_FORM)
    const [saving, setSaving] = useState(false)
    const [editError, setEditError] = useState('')

    // Delete modal
    const [deleteRequest, setDeleteRequest] =
        useState<ContractRequest | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    // -------- Fetch contract requests (list) --------
    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            const params = new URLSearchParams()
            params.set('page', String(page))
            params.set('limit', '10')

            if (search.trim()) params.set('search', search.trim())
            if (statusFilter !== 'all') params.set('status', statusFilter)
            if (priorityFilter !== 'all')
                params.set('priority', priorityFilter)

            const result = await apiFetch<RequestsResponse>(
                `${REQUESTS_API}?${params.toString()}`
            )

            setRequests(
                Array.isArray(result?.data) ? result.data : []
            )

            setPagination(
                result?.pagination || {
                    page,
                    limit: 10,
                    total: result?.data?.length || 0,
                    pages: 1,
                }
            )
        } catch (error) {
            console.error('Fetch contract requests:', error)
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to fetch contract requests.'
            )
            setRequests([])
        } finally {
            setLoading(false)
        }
    }, [page, search, statusFilter, priorityFilter])

    // -------- Fetch all lawyers (paginated) --------
    const fetchLawyers = useCallback(async () => {
        try {
            setLawyersLoading(true)

            const collected: Lawyer[] = []
            const seen = new Set<string>()

            let currentPage = 1
            let totalPages = 1

            do {
                const result = await apiFetch<LawyersResponse>(
                    `${LAWYERS_API}?page=${currentPage}&limit=50`
                )

                const rawList =
                    (Array.isArray(result?.lawyers) &&
                        result.lawyers) ||
                    (Array.isArray(result?.data) && result.data) ||
                    []

                for (const raw of rawList) {
                    const normalized = normalizeLawyer(raw)
                    if (
                        normalized._id &&
                        !seen.has(normalized._id)
                    ) {
                        seen.add(normalized._id)
                        collected.push(normalized)
                    }
                }

                const reported =
                    result?.totalPages ??
                    (result as any)?.pagination?.pages

                totalPages =
                    typeof reported === 'number' && reported > 0
                        ? reported
                        : rawList.length > 0
                            ? currentPage + 1
                            : currentPage

                currentPage += 1
            } while (currentPage <= totalPages && currentPage <= 20)

            setLawyers(collected)
        } catch (error) {
            console.error('Fetch lawyers:', error)
        } finally {
            setLawyersLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetchRequests()
    }, [fetchRequests])

    useEffect(() => {
        void fetchLawyers()
    }, [fetchLawyers])

    const refresh = async () => {
        setRefreshing(true)
        try {
            await Promise.all([fetchRequests(), fetchLawyers()])
        } finally {
            setRefreshing(false)
        }
    }

    // -------- Details modal --------
    const openDetails = async (request: ContractRequest) => {
        setDetailsRequest(request)
        setDetails(null)
        setDetailsError('')
        setStatusError('')
        setDetailsLoading(true)

        try {
            const result = await apiFetch<ContractDetailResponse>(
                contractDetailUrl(request._id)
            )
            setDetails(result?.data || request)
        } catch (error) {
            console.error('Fetch contract details:', error)
            setDetailsError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load contract details.'
            )
            setDetails(request)
        } finally {
            setDetailsLoading(false)
        }
    }

    const closeDetails = () => {
        if (detailsLoading) return
        setDetailsRequest(null)
        setDetails(null)
        setDetailsError('')
        setStatusError('')
    }

    // -------- Inline status update --------
    const updateStatus = async (newStatus: ContractStatus) => {
        const current = details || detailsRequest
        if (!current) return
        if ((current.status as string) === newStatus) return

        try {
            setStatusUpdating(true)
            setStatusError('')

            const result = await apiFetch<{
                success: boolean
                data?: ContractRequest
                message?: string
            }>(contractStatusUrl(current._id), {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            })

            const updated = result?.data

            if (updated) {
                setDetails((d) =>
                    d && d._id === updated._id ? updated : d
                )
                setRequests((list) =>
                    list.map((item) =>
                        item._id === updated._id ? updated : item
                    )
                )
            } else {
                setDetails((d) =>
                    d ? { ...d, status: newStatus } : d
                )
                setRequests((list) =>
                    list.map((item) =>
                        item._id === current._id
                            ? { ...item, status: newStatus }
                            : item
                    )
                )
            }
        } catch (error) {
            console.error('Update contract status:', error)
            setStatusError(
                error instanceof Error
                    ? error.message
                    : 'Failed to update status.'
            )
        } finally {
            setStatusUpdating(false)
        }
    }

    // -------- Assign modal --------
    const openAssignModal = (request: ContractRequest) => {
        setSelectedRequest(request)
        setAssignError('')
        setLawyerQuery('')

        const assigned = getAssigned(request)
        if (assigned && typeof assigned !== 'string') {
            setSelectedLawyer((assigned as any)._id || '')
        } else if (typeof assigned === 'string') {
            setSelectedLawyer(assigned)
        } else {
            setSelectedLawyer('')
        }
    }

    const closeAssignModal = () => {
        if (assigning) return
        setSelectedRequest(null)
        setSelectedLawyer('')
        setLawyerQuery('')
        setAssignError('')
    }

    const assignLawyer = async () => {
        if (!selectedRequest) return
        if (!selectedLawyer) {
            setAssignError('Please select a lawyer.')
            return
        }

        try {
            setAssigning(true)
            setAssignError('')

            const result = await apiFetch<{
                success: boolean
                data?: ContractRequest
                message?: string
            }>(
                `${REQUESTS_API}/${selectedRequest._id}/assign`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        lawyerId: selectedLawyer,
                    }),
                }
            )

            const updated = result?.data

            if (updated) {
                setRequests((current) =>
                    current.map((item) =>
                        item._id === updated._id ? updated : item
                    )
                )
                if (details?._id === updated._id) {
                    setDetails(updated)
                }
            } else {
                await fetchRequests()
            }

            closeAssignModal()
        } catch (error) {
            console.error('Assign lawyer:', error)
            setAssignError(
                error instanceof Error
                    ? error.message
                    : 'Failed to assign lawyer.'
            )
        } finally {
            setAssigning(false)
        }
    }

    // -------- Edit modal --------
    const openEditModal = (request: ContractRequest) => {
        setEditRequest(request)
        setEditError('')
        setEditForm({
            title: request.title || '',
            contractType: request.contractType || '',
            category:
                request.category ||
                request.customCategory ||
                '',
            priority: request.priority || 'medium',
            status:
                (request.status as string) || 'Draft',
            deadline: toDateInput(request.deadline),
            description: request.description || '',
            additionalInformation:
                request.additionalInformation || '',
            counterpartyName:
                request.counterparty?.name || '',
        })
    }

    const closeEditModal = () => {
        if (saving) return
        setEditRequest(null)
        setEditForm(EMPTY_EDIT_FORM)
        setEditError('')
    }

    const saveEdit = async () => {
        if (!editRequest) return

        try {
            setSaving(true)
            setEditError('')

            const payload: Record<string, any> = {
                title: editForm.title.trim(),
                contractType:
                    editForm.contractType.trim() || undefined,
                category:
                    editForm.category.trim() || undefined,
                priority: editForm.priority || undefined,
                status: editForm.status || undefined,
                deadline: editForm.deadline || null,
                description: editForm.description,
                additionalInformation:
                    editForm.additionalInformation,
                counterparty: {
                    name:
                        editForm.counterpartyName.trim() ||
                        'Unknown',
                },
            }

            const result = await apiFetch<{
                success: boolean
                data?: ContractRequest
                message?: string
            }>(contractDetailUrl(editRequest._id), {
                method: 'PATCH',
                body: JSON.stringify(payload),
            })

            const updated = result?.data

            if (updated) {
                setRequests((current) =>
                    current.map((item) =>
                        item._id === updated._id ? updated : item
                    )
                )
                if (details?._id === updated._id) {
                    setDetails(updated)
                }
            } else {
                await fetchRequests()
            }

            closeEditModal()
        } catch (error) {
            console.error('Update contract:', error)
            setEditError(
                error instanceof Error
                    ? error.message
                    : 'Failed to update contract.'
            )
        } finally {
            setSaving(false)
        }
    }

    // -------- Delete modal --------
    const openDeleteModal = (request: ContractRequest) => {
        setDeleteRequest(request)
        setDeleteError('')
    }

    const closeDeleteModal = () => {
        if (deleting) return
        setDeleteRequest(null)
        setDeleteError('')
    }

    const confirmDelete = async () => {
        if (!deleteRequest) return

        try {
            setDeleting(true)
            setDeleteError('')

            await apiFetch<{
                success: boolean
                message?: string
            }>(contractDetailUrl(deleteRequest._id), {
                method: 'DELETE',
            })

            setRequests((current) =>
                current.filter(
                    (item) => item._id !== deleteRequest._id
                )
            )

            if (details?._id === deleteRequest._id) {
                setDetails(null)
                setDetailsRequest(null)
            }

            closeDeleteModal()
        } catch (error) {
            console.error('Delete contract:', error)
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete contract.'
            )
        } finally {
            setDeleting(false)
        }
    }

    // Filter lawyers shown in the assign modal
    const filteredLawyers = useMemo(() => {
        const q = lawyerQuery.trim().toLowerCase()
        if (!q) return lawyers
        return lawyers.filter((l) => {
            const name = (l.fullName || '').toLowerCase()
            const email = (l.email || '').toLowerCase()
            return name.includes(q) || email.includes(q)
        })
    }, [lawyers, lawyerQuery])

    const stats = useMemo(() => {
        return {
            total: pagination.total,
            submitted: requests.filter(
                (i) =>
                    normalizeStatus(i.status as string) ===
                    'submitted'
            ).length,
            assigned: requests.filter(
                (i) =>
                    normalizeStatus(i.status as string) ===
                    'assigned'
            ).length,
            inProgress: requests.filter(
                (i) =>
                    normalizeStatus(i.status as string) ===
                    'in-progress'
            ).length,
            urgent: requests.filter(
                (i) => i.priority === 'urgent'
            ).length,
        }
    }, [requests, pagination.total])

    const activeDetails = details || detailsRequest
    const activeStatusSlug = normalizeStatus(
        activeDetails?.status as string
    )

    return (
        <main className="min-h-screen bg-[#070707] text-white">
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                {/* HEADER */}
                <header className="border-b border-white/[0.06] pb-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                                Admin · Legal Operations
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                Contract Requests
                            </h1>
                            <p className="mt-1 text-sm text-zinc-500">
                                Review business contract requests and
                                assign the appropriate legal
                                professional.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={refresh}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </header>

                {/* ERROR */}
                {error && (
                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => void fetchRequests()}
                            className="ml-auto underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* STATS */}
                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <StatCard
                        label="Total Requests"
                        value={stats.total}
                    />
                    <StatCard
                        label="Submitted"
                        value={stats.submitted}
                    />
                    <StatCard
                        label="Assigned"
                        value={stats.assigned}
                    />
                    <StatCard
                        label="In Progress"
                        value={stats.inProgress}
                    />
                    <StatCard
                        label="Urgent"
                        value={stats.urgent}
                    />
                </section>

                {/* FILTERS */}
                <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setPage(1)
                                }}
                                placeholder="Search request number, title or business..."
                                className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.02] pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-amber-400/30"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                setPage(1)
                            }}
                            className="h-11 rounded-xl border border-white/[0.07] bg-[#101318] px-3 text-xs text-white outline-none"
                        >
                            <option value="all">All statuses</option>
                            {CONTRACT_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => {
                                setPriorityFilter(e.target.value)
                                setPage(1)
                            }}
                            className="h-11 rounded-xl border border-white/[0.07] bg-[#101318] px-3 text-xs text-white outline-none"
                        >
                            <option value="all">All priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </section>

                {/* TABLE */}
                <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1150px] text-left">
                            <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                                <tr>
                                    {[
                                        'Request',
                                        'Business',
                                        'Type',
                                        'Priority',
                                        'Status',
                                        'Assigned Lawyer',
                                        'Deadline',
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/[0.05]">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-16 text-center"
                                        >
                                            <Loader2 className="mx-auto h-5 w-5 animate-spin text-amber-400" />
                                            <p className="mt-3 text-xs text-zinc-600">
                                                Loading contract
                                                requests...
                                            </p>
                                        </td>
                                    </tr>
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-16 text-center"
                                        >
                                            <FileText className="mx-auto h-7 w-7 text-zinc-700" />
                                            <p className="mt-3 text-sm font-medium text-zinc-400">
                                                No contract requests
                                                found
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-700">
                                                Try changing your
                                                filters.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((request) => {
                                        const assignedObj =
                                            getAssigned(request)
                                        const assigned =
                                            getLawyerName(
                                                assignedObj
                                            )
                                        const assignedEmail =
                                            getLawyerEmail(
                                                assignedObj
                                            )
                                        const slugStatus =
                                            normalizeStatus(
                                                request.status as string
                                            )

                                        return (
                                            <tr
                                                key={request._id}
                                                onClick={() =>
                                                    void openDetails(
                                                        request
                                                    )
                                                }
                                                className="cursor-pointer transition hover:bg-white/[0.02]"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="max-w-[280px] truncate text-sm font-semibold text-white">
                                                                {
                                                                    request.title
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                                                                {request.contractNumber ||
                                                                    request.requestNumber}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="max-w-[220px] truncate text-xs font-medium text-zinc-300">
                                                        {getBusinessName(
                                                            request.business
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-zinc-400">
                                                        {request.contractType ||
                                                            request.category ||
                                                            request.customCategory ||
                                                            'General'}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`text-xs font-medium capitalize ${priorityClass(
                                                            request.priority
                                                        )}`}
                                                    >
                                                        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                                                        {
                                                            request.priority
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusClass(
                                                            slugStatus
                                                        )}`}
                                                    >
                                                        {formatStatus(
                                                            request.status as string
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar
                                                            name={
                                                                assigned
                                                            }
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="max-w-[180px] truncate text-xs font-medium text-zinc-300">
                                                                {
                                                                    assigned
                                                                }
                                                            </p>
                                                            {assignedEmail && (
                                                                <p className="max-w-[180px] truncate text-[10px] text-zinc-600">
                                                                    {
                                                                        assignedEmail
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                        {formatDate(
                                                            request.deadline
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={(
                                                            e
                                                        ) => {
                                                            e.stopPropagation()
                                                            openAssignModal(
                                                                request
                                                            )
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/10"
                                                    >
                                                        <UserRoundCheck className="h-3.5 w-3.5" />
                                                        {assignedObj
                                                            ? 'Reassign'
                                                            : 'Assign Lawyer'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
                        <p className="text-xs text-zinc-600">
                            {pagination.total} request
                            {pagination.total !== 1 ? 's' : ''}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() =>
                                    setPage((c) =>
                                        Math.max(1, c - 1)
                                    )
                                }
                                className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] text-zinc-400 disabled:opacity-30"
                            >
                                Previous
                            </button>
                            <span className="text-[11px] text-zinc-600">
                                Page {page} of {pagination.pages}
                            </span>
                            <button
                                type="button"
                                disabled={
                                    page >= pagination.pages
                                }
                                onClick={() =>
                                    setPage((c) => c + 1)
                                }
                                className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] text-zinc-400 disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* ============ DETAILS MODAL ============ */}
            {detailsRequest && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                    onClick={closeDetails}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0b0d10] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-5">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                                    Contract Details
                                </p>
                                <h2 className="mt-2 truncate text-lg font-semibold text-white">
                                    {details?.title ||
                                        detailsRequest.title}
                                </h2>
                                <p className="mt-1 text-xs text-zinc-600">
                                    {details?.contractNumber ||
                                        details?.requestNumber ||
                                        detailsRequest.contractNumber ||
                                        detailsRequest.requestNumber ||
                                        detailsRequest._id}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeDetails}
                                className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.04] hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            {detailsLoading && (
                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                                    Loading contract details...
                                </div>
                            )}

                            {detailsError && (
                                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-3 py-2.5 text-xs text-red-300">
                                    {detailsError}
                                </div>
                            )}

                            {/* STATUS PICKER */}
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                                            Contract Status
                                        </p>
                                        <p className="mt-1 flex items-center gap-2 text-xs text-zinc-300">
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusClass(
                                                    activeStatusSlug
                                                )}`}
                                            >
                                                {formatStatus(
                                                    activeDetails?.status as string
                                                )}
                                            </span>
                                            {statusUpdating && (
                                                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Updating...
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="relative w-full sm:w-64">
                                        <select
                                            value={
                                                (activeDetails?.status as string) ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                void updateStatus(
                                                    e.target
                                                        .value as ContractStatus
                                                )
                                            }
                                            disabled={
                                                statusUpdating ||
                                                detailsLoading
                                            }
                                            className="h-10 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#101318] px-3 pr-10 text-xs text-white outline-none focus:border-amber-400/30 disabled:opacity-50"
                                        >
                                            {CONTRACT_STATUSES.map(
                                                (s) => (
                                                    <option
                                                        key={s}
                                                        value={s}
                                                    >
                                                        {s}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                    </div>
                                </div>

                                {statusError && (
                                    <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-[11px] text-red-300">
                                        {statusError}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <DetailRow
                                    label="Business"
                                    value={getBusinessName(
                                        details?.business
                                    )}
                                />
                                <DetailRow
                                    label="Contract Type"
                                    value={
                                        details?.contractType ||
                                        details?.category ||
                                        '—'
                                    }
                                />
                                <DetailRow
                                    label="Priority"
                                    value={
                                        details?.priority || '—'
                                    }
                                />
                                <DetailRow
                                    label="Status"
                                    value={formatStatus(
                                        details?.status as string
                                    )}
                                />
                                <DetailRow
                                    label="Assigned Lawyer"
                                    value={getLawyerName(
                                        getAssigned(details)
                                    )}
                                />
                                <DetailRow
                                    label="Assigned Email"
                                    value={getLawyerEmail(
                                        getAssigned(details)
                                    )}
                                />
                                <DetailRow
                                    label="Deadline"
                                    value={formatDate(
                                        details?.deadline
                                    )}
                                />
                                <DetailRow
                                    label="Created"
                                    value={formatDate(
                                        details?.createdAt
                                    )}
                                />
                                <DetailRow
                                    label="Counterparty"
                                    value={
                                        details?.counterparty
                                            ?.name || '—'
                                    }
                                />
                                <DetailRow
                                    label="Currency"
                                    value={
                                        details?.currency || '—'
                                    }
                                />
                            </div>

                            {details?.description && (
                                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                                        Description
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-300">
                                        {details.description}
                                    </p>
                                </div>
                            )}

                            {details?.additionalInformation && (
                                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                                        Additional Information
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-300">
                                        {
                                            details.additionalInformation
                                        }
                                    </p>
                                </div>
                            )}

                            {details?.currentDocument && (
                                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                                        Current Document
                                    </p>
                                    <p className="mt-2 text-xs text-zinc-300">
                                        {details.currentDocument
                                            .fileName ||
                                            details
                                                .currentDocument
                                                .category ||
                                            'Document attached'}
                                        {' · '}
                                        <span className="text-zinc-500">
                                            {
                                                details
                                                    .currentDocument
                                                    .status
                                            }
                                        </span>
                                    </p>
                                    {(details.currentDocument
                                        .fileUrl ||
                                        details.currentDocument
                                            .url) && (
                                            <a
                                                href={
                                                    details
                                                        .currentDocument
                                                        .fileUrl ||
                                                    details
                                                        .currentDocument
                                                        .url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-block text-[11px] font-medium text-amber-400 underline"
                                            >
                                                Open document
                                            </a>
                                        )}
                                </div>
                            )}

                            <div className="flex flex-wrap justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const req =
                                            details ||
                                            detailsRequest
                                        closeDetails()
                                        openDeleteModal(req)
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-400/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const req =
                                            details ||
                                            detailsRequest
                                        closeDetails()
                                        openEditModal(req)
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/[0.08]"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const req =
                                            details ||
                                            detailsRequest
                                        closeDetails()
                                        openAssignModal(req)
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black hover:bg-amber-300"
                                >
                                    <UserRoundCheck className="h-3.5 w-3.5" />
                                    {getAssigned(details) ||
                                        getAssigned(detailsRequest)
                                        ? 'Reassign Lawyer'
                                        : 'Assign Lawyer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ EDIT MODAL ============ */}
            {editRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0b0d10] shadow-2xl">
                        <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-5">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                                    Edit Contract
                                </p>
                                <h2 className="mt-2 truncate text-lg font-semibold text-white">
                                    {editRequest.title}
                                </h2>
                                <p className="mt-1 text-xs text-zinc-600">
                                    {editRequest.contractNumber ||
                                        editRequest.requestNumber}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.04] hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <FormRow label="Title">
                                <input
                                    value={editForm.title}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            title: e.target.value,
                                        }))
                                    }
                                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#101318] px-3 text-sm text-white outline-none focus:border-amber-400/30"
                                />
                            </FormRow>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormRow label="Contract Type">
                                    <input
                                        value={
                                            editForm.contractType
                                        }
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                contractType:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Vendor Agreement"
                                        className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#101318] px-3 text-sm text-white outline-none focus:border-amber-400/30"
                                    />
                                </FormRow>

                                <FormRow label="Category">
                                    <input
                                        value={editForm.category}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                category:
                                                    e.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#101318] px-3 text-sm text-white outline-none focus:border-amber-400/30"
                                    />
                                </FormRow>

                                <FormRow label="Priority">
                                    <div className="relative">
                                        <select
                                            value={
                                                editForm.priority
                                            }
                                            onChange={(e) =>
                                                setEditForm(
                                                    (f) => ({
                                                        ...f,
                                                        priority:
                                                            e
                                                                .target
                                                                .value as Priority,
                                                    })
                                                )
                                            }
                                            className="h-10 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#101318] px-3 pr-10 text-sm text-white outline-none focus:border-amber-400/30"
                                        >
                                            <option value="low">
                                                Low
                                            </option>
                                            <option value="medium">
                                                Medium
                                            </option>
                                            <option value="high">
                                                High
                                            </option>
                                            <option value="urgent">
                                                Urgent
                                            </option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                    </div>
                                </FormRow>

                                <FormRow label="Status">
                                    <div className="relative">
                                        <select
                                            value={
                                                editForm.status
                                            }
                                            onChange={(e) =>
                                                setEditForm(
                                                    (f) => ({
                                                        ...f,
                                                        status: e
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                            className="h-10 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#101318] px-3 pr-10 text-sm text-white outline-none focus:border-amber-400/30"
                                        >
                                            {CONTRACT_STATUSES.map(
                                                (s) => (
                                                    <option
                                                        key={s}
                                                        value={s}
                                                    >
                                                        {s}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                    </div>
                                </FormRow>

                                <FormRow label="Deadline">
                                    <input
                                        type="date"
                                        value={
                                            editForm.deadline
                                        }
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                deadline:
                                                    e.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#101318] px-3 text-sm text-white outline-none focus:border-amber-400/30"
                                    />
                                </FormRow>

                                <FormRow label="Counterparty Name">
                                    <input
                                        value={
                                            editForm.counterpartyName
                                        }
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                counterpartyName:
                                                    e.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#101318] px-3 text-sm text-white outline-none focus:border-amber-400/30"
                                    />
                                </FormRow>
                            </div>

                            <FormRow label="Description">
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            description:
                                                e.target.value,
                                        }))
                                    }
                                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#101318] px-3 py-2 text-sm text-white outline-none focus:border-amber-400/30"
                                />
                            </FormRow>

                            <FormRow label="Additional Information">
                                <textarea
                                    rows={3}
                                    value={
                                        editForm.additionalInformation
                                    }
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            additionalInformation:
                                                e.target.value,
                                        }))
                                    }
                                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#101318] px-3 py-2 text-sm text-white outline-none focus:border-amber-400/30"
                                />
                            </FormRow>

                            {editError && (
                                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-3 py-2.5 text-xs text-red-300">
                                    {editError}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    disabled={saving}
                                    className="rounded-xl border border-white/[0.07] px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={saveEdit}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>Save Changes</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ DELETE MODAL ============ */}
            {deleteRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0b0d10] shadow-2xl">
                        <div className="flex items-start gap-3 border-b border-white/[0.06] px-5 py-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-400">
                                <Trash2 className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Delete contract request?
                                </h2>
                                <p className="mt-1 text-xs text-zinc-500">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                                <p className="text-xs font-medium text-zinc-300">
                                    {deleteRequest.title}
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                                    {deleteRequest.contractNumber ||
                                        deleteRequest.requestNumber ||
                                        deleteRequest._id}
                                </p>
                            </div>

                            {deleteError && (
                                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-3 py-2.5 text-xs text-red-300">
                                    {deleteError}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={deleting}
                                    className="rounded-xl border border-white/[0.07] px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ ASSIGN MODAL ============ */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0b0d10] shadow-2xl">
                        <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-5">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                                    Assign legal professional
                                </p>
                                <h2 className="mt-2 text-lg font-semibold text-white">
                                    {selectedRequest.title}
                                </h2>
                                <p className="mt-1 text-xs text-zinc-600">
                                    {selectedRequest.contractNumber ||
                                        selectedRequest.requestNumber}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeAssignModal}
                                className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.04] hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                                <div className="flex items-start gap-3">
                                    <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-amber-400" />
                                    <div>
                                        <p className="text-xs font-medium text-zinc-300">
                                            Business
                                        </p>
                                        <p className="mt-1 text-sm text-white">
                                            {getBusinessName(
                                                selectedRequest.business
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <label className="mt-5 block">
                                <span className="mb-2 block text-[11px] font-medium text-zinc-400">
                                    Search lawyer
                                </span>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                    <input
                                        value={lawyerQuery}
                                        onChange={(e) =>
                                            setLawyerQuery(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search by name or email..."
                                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#101318] pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-amber-400/30"
                                    />
                                </div>
                            </label>

                            <label className="mt-4 block">
                                <span className="mb-2 block text-[11px] font-medium text-zinc-400">
                                    Select lawyer
                                </span>
                                <div className="relative">
                                    <select
                                        value={selectedLawyer}
                                        onChange={(e) =>
                                            setSelectedLawyer(
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            lawyersLoading ||
                                            assigning
                                        }
                                        className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#101318] px-3 pr-10 text-sm text-white outline-none focus:border-amber-400/30 disabled:opacity-50"
                                    >
                                        <option value="">
                                            {lawyersLoading
                                                ? 'Loading lawyers...'
                                                : lawyers.length ===
                                                    0
                                                    ? 'No lawyers available'
                                                    : `Select a lawyer (${filteredLawyers.length})`}
                                        </option>

                                        {filteredLawyers.map(
                                            (lawyer) => (
                                                <option
                                                    key={
                                                        lawyer._id
                                                    }
                                                    value={
                                                        lawyer._id
                                                    }
                                                >
                                                    {
                                                        lawyer.fullName
                                                    }
                                                    {lawyer.email
                                                        ? ` — ${lawyer.email}`
                                                        : ''}
                                                </option>
                                            )
                                        )}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                </div>
                            </label>

                            {selectedLawyer && (
                                <div className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px] text-zinc-400">
                                    Selected:{' '}
                                    <span className="text-zinc-200">
                                        {lawyers.find(
                                            (l) =>
                                                l._id ===
                                                selectedLawyer
                                        )?.fullName || '—'}
                                    </span>
                                </div>
                            )}

                            {assignError && (
                                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-3 py-2.5 text-xs text-red-300">
                                    {assignError}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    disabled={assigning}
                                    className="rounded-xl border border-white/[0.07] px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={assignLawyer}
                                    disabled={
                                        assigning ||
                                        !selectedLawyer
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {assigning ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <UserRoundCheck className="h-3.5 w-3.5" />
                                            Assign Lawyer
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

function StatCard({
    label,
    value,
}: {
    label: string
    value: number
}) {
    return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                {label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
                {value}
            </p>
        </div>
    )
}

function DetailRow({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                {label}
            </p>
            <p className="mt-1 truncate text-xs text-zinc-200">
                {value || '—'}
            </p>
        </div>
    )
}

function FormRow({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                {label}
            </span>
            {children}
        </label>
    )
}