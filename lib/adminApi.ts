// lib/adminApi.ts

// =================================================================
// CONFIG
// =================================================================

export const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

// =================================================================
// ENDPOINT MAP
// =================================================================

export const ENDPOINTS = {
    // ---------- Admin ----------
    admin: {
        profile: '/admin/settings/profile',
    },

    // ---------- Lawyers ----------
    lawyers: {
        list: '/lawyer/all',
        stats: '/lawyer/stats',
        detail: (id: string) => `/lawyer/details/${id}`,
        verify: (id: string) => `/lawyer/${id}/verify`,
        suspend: (id: string) => `/lawyer/${id}/suspend`,
        activate: (id: string) => `/lawyer/${id}/activate`,

        // Admin-scoped related data
        work: (id: string) => `/admin/lawyers/${id}/work`,
        contracts: (id: string) => `/admin/lawyers/${id}/contracts`,
        compliance: (id: string) => `/admin/lawyers/${id}/compliance`,
    },

    // ---------- Businesses ----------
    businesses: {
        list: '/business',
        stats: '/business/stats',
        detail: (id: string) => `/business/${id}`,
        verify: (id: string) => `/business/${id}/verify`,
        suspend: (id: string) => `/business/${id}/suspend`,
        activate: (id: string) => `/business/${id}/activate`,
    },

    // ---------- Contracts ----------
    contracts: {
        list: '/contracts',
        stats: '/contracts/dashboard/stats',
        detail: (id: string) => `/contracts/${id}`,
        approve: (id: string) => `/contracts/${id}/approve`,
        reject: (id: string) => `/contracts/${id}/reject`,
    },

    // ---------- Compliance ----------
    compliance: {
        list: '/compliance',
        stats: '/compliance/stats',
        detail: (id: string) => `/compliance/${id}`,
        resolve: (id: string) => `/compliance/${id}/resolve`,
    },

    // ---------- Legal Work ----------
    work: {
        list: '/lawyer-works/work',
        stats: '/lawyer-works/stats',
        detail: (id: string) => `/lawyer-works/work/${id}`,
    },

    // ---------- Documents ----------
    documents: {
        list: '/documents',
        detail: (id: string) => `/documents/${id}`,
    },

    // ---------- Team ----------
    team: {
        list: '/team',
        stats: '/team/stats',
        detail: (id: string) => `/team/${id}`,
        invite: '/team/invite',
    },

    // ---------- Alerts ----------
    alerts: {
        list: '/alerts',
        stats: '/alerts/stats',
        resolve: (id: string) => `/alerts/${id}/resolve`,
    },

    // ---------- Messages ----------
    messages: {
        threads: '/messages/threads',
        thread: (id: string) => `/messages/threads/${id}`,
        send: (id: string) => `/messages/threads/${id}/send`,
    },

    // ---------- Analytics ----------
    analytics: {
        overview: '/analytics/overview',
        revenue: '/analytics/revenue',
        activity: '/analytics/activity',
        reports: '/analytics/reports',
    },
} as const

// =================================================================
// ERROR TYPE
// =================================================================

export class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.status = status
        this.name = 'ApiError'
    }
}

// =================================================================
// TOKEN
// =================================================================

export function getToken(): string | null {
    if (typeof window === 'undefined') return null

    const token =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('userToken')

    try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const parsed = JSON.parse(userStr)
            if (parsed.token) return parsed.token
            if (parsed.accessToken) return parsed.accessToken
        }
    } catch {
        // ignore
    }

    return token || null
}

// =================================================================
// CORE FETCH
// =================================================================

type FetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    token?: string | null
    signal?: AbortSignal
}

export async function apiFetch<T>(
    path: string,
    options: FetchOptions = {}
): Promise<T> {
    const { method = 'GET', body, token, signal } = options
    const authToken = token ?? getToken()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (authToken) headers.Authorization = `Bearer ${authToken}`

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal,
    })

    if (!response.ok) {
        if (response.status === 401) throw new ApiError('NO_TOKEN', 401)

        let message = `Request failed (${response.status})`
        try {
            const data = await response.json()
            message = data?.message || data?.error || message
        } catch {
            // ignore
        }
        throw new ApiError(message, response.status)
    }

    return response.json()
}

// =================================================================
// RESPONSE SHAPE HELPERS
// =================================================================

export function getArray<T>(result: any): T[] {
    if (!result) return []
    if (Array.isArray(result)) return result
    if (Array.isArray(result.data)) return result.data
    if (Array.isArray(result.lawyers)) return result.lawyers
    if (Array.isArray(result.businesses)) return result.businesses
    if (Array.isArray(result.contracts)) return result.contracts
    if (Array.isArray(result.compliance)) return result.compliance
    if (Array.isArray(result.documents)) return result.documents
    if (Array.isArray(result.team)) return result.team
    if (Array.isArray(result.work)) return result.work
    if (Array.isArray(result.alerts)) return result.alerts
    if (Array.isArray(result.messages)) return result.messages
    if (Array.isArray(result.threads)) return result.threads
    if (Array.isArray(result.items)) return result.items
    if (Array.isArray(result.results)) return result.results
    return []
}

export function getPagination(result: any, fallbackLimit = 20) {
    const total =
        Number(
            result?.count ??
            result?.total ??
            result?.pagination?.total ??
            result?.meta?.total ??
            0
        ) || 0

    const limit =
        Number(
            result?.pagination?.limit ??
            result?.meta?.limit ??
            result?.limit ??
            fallbackLimit
        ) || fallbackLimit

    const page =
        Number(
            result?.pagination?.page ??
            result?.meta?.page ??
            result?.page ??
            1
        ) || 1

    const pages =
        Number(
            result?.pagination?.pages ??
            result?.meta?.pages ??
            result?.totalPages ??
            (limit > 0 ? Math.ceil(total / limit) : 1)
        ) || 1

    return { total, page, limit, pages }
}

// =================================================================
// FORMATTERS
// =================================================================

export function formatDate(value?: string | Date | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

export function formatDateTime(value?: string | Date | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function getId(item: any) {
    if (!item) return ''
    return String(
        item._id ||
        item.id ||
        item.userInfo?._id ||
        item.lawyerDetails?._id ||
        item.businessDetails?._id ||
        ''
    )
}

export function getInitials(name?: string) {
    if (!name) return 'NA'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (
        parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase()
}

export function getBusinessName(item: any) {
    return (
        item?.businessDetails?.companyName ||
        item?.businessInfo?.companyName ||
        item?.userInfo?.companyName ||
        item?.business?.companyName ||
        item?.client?.companyName ||
        item?.businessDetails?.legalName ||
        item?.businessInfo?.legalName ||
        item?.companyName ||
        item?.client ||
        'Client'
    )
}

// =================================================================
// TYPES
// =================================================================

export type LawyerStatus = 'active' | 'pending' | 'suspended' | 'inactive'

export type Lawyer = {
    id: string
    fullName: string
    email: string
    phone?: string
    profilePhoto?: string
    specialization: string[]
    practiceAreas: string[]
    experience?: number
    barCouncilId?: string
    activeClients: number
    openWork: number
    contracts: number
    status: LawyerStatus | string
    verified: boolean
    createdAt?: string

    bio?: string
    city?: string
    state?: string
    accountStatus?: string
    kycStatus?: string
    availabilityStatus?: string
    isPremium?: boolean
    verifiedByPlatform?: boolean
    payoutVerified?: boolean
    consultationFee?: number
    consultationDurationMinutes?: number
    consultationCount?: number
    averageRating?: number
    totalReviews?: number
    profileViews?: number
    languagesSpoken?: string[]
    courtType?: string[]
    consultationModes?: {
        video?: boolean
        call?: boolean
        chat?: boolean
        inPerson?: boolean
    }
    maxBookingsPerDay?: number
    advanceNoticeHours?: number
    userId?: string

    raw?: any
}

export type Business = {
    id: string
    companyName: string
    legalName?: string
    email: string
    phone?: string
    industry?: string
    logo?: string
    assignedLawyer?: string
    contracts: number
    compliance: number
    openWork: number
    status: string
    verified: boolean
    createdAt?: string
    raw?: any
}

export type Contract = {
    id: string
    title: string
    client: string
    lawyer?: string
    status?: string
    dueDate?: string
    createdAt?: string
    raw?: any
}

export type ComplianceItem = {
    id: string
    name: string
    client: string
    status?: string
    priority?: string
    dueDate?: string
    description?: string
    raw?: any
}

export type WorkItem = {
    id: string
    title: string
    type: string
    client: string
    lawyer?: string
    status?: string
    priority?: string
    dueDate?: string
    description?: string
    raw?: any
}

export type DocumentItem = {
    id: string
    name: string
    client: string
    category?: string
    createdAt?: string
    url?: string
    raw?: any
}

export type TeamMember = {
    id: string
    fullName: string
    email: string
    role: string
    profilePhoto?: string
    createdAt?: string
    raw?: any
}

export type AlertItem = {
    id: string
    title: string
    message: string
    severity?: 'low' | 'medium' | 'high' | 'urgent' | string
    status?: string
    createdAt?: string
    raw?: any
}

// ---------- Admin Profile ----------

export interface AdminProfile {
    _id: string
    userId?: string
    fullName: string
    email: string
    phone: string
    profilePhoto: string
    avatar: string
    role: string
    accountStatus: string
    createdAt?: string
    updatedAt?: string
}

export interface UpdateAdminProfilePayload {
    fullName: string
    phone: string
}

// =================================================================
// NORMALIZERS
// =================================================================

export function normalizeLawyer(item: any): Lawyer {
    const l = item?.lawyer || item?.data?.lawyer || item?.data || item

    const user = l?.userInfo || {}
    const details = l?.lawyerDetails || {}
    const stats = l?.stats || {}

    const id = String(
        l?._id ||
        l?.id ||
        l?.userId?._id ||
        (typeof l?.userId === 'string' ? l.userId : '') ||
        user?._id ||
        user?.userId ||
        details?._id ||
        details?.userId ||
        ''
    )

    const specialization =
        (Array.isArray(l?.specialization) && l.specialization) ||
        (Array.isArray(l?.specializations) && l.specializations) ||
        (Array.isArray(details?.specialization) &&
            details.specialization) ||
        []

    const practiceAreas =
        (Array.isArray(l?.practiceAreas) && l.practiceAreas) ||
        (Array.isArray(l?.courtType) && l.courtType) ||
        (Array.isArray(details?.practiceAreas) &&
            details.practiceAreas) ||
        []

    const accountStatus =
        l?.accountStatus ||
        details?.accountStatus ||
        (l?.isDeleted ? 'inactive' : 'active')

    const merged = { ...l, ...details }

    return {
        id,
        fullName:
            user?.fullName ||
            merged?.fullName ||
            'Unnamed Lawyer',
        email: user?.email || merged?.email || '',
        phone: user?.phone || merged?.phone || '',
        profilePhoto:
            merged?.profilePhoto ||
            user?.profilePhoto ||
            user?.profileImage ||
            undefined,
        specialization,
        practiceAreas,
        experience: Number(merged?.experience ?? 0) || undefined,
        barCouncilId: merged?.barCouncilId,
        activeClients:
            Number(stats.activeClients ?? merged?.activeClients ?? 0) || 0,
        openWork: Number(stats.openWork ?? merged?.openWork ?? 0) || 0,
        contracts:
            Number(stats.contracts ?? merged?.contracts ?? 0) || 0,
        status: String(accountStatus).toLowerCase(),
        verified: merged?.kycStatus === 'verified',
        createdAt: merged?.createdAt,

        bio: merged?.bio,
        city: merged?.city,
        state: merged?.state,
        accountStatus: merged?.accountStatus,
        kycStatus: merged?.kycStatus,
        availabilityStatus: merged?.status,
        isPremium: Boolean(merged?.isPremium),
        verifiedByPlatform: Boolean(merged?.verifiedByPlatform),
        payoutVerified: Boolean(merged?.payoutVerified),
        consultationFee:
            Number(merged?.consultationFee ?? 0) || undefined,
        consultationDurationMinutes:
            Number(merged?.consultationDurationMinutes ?? 0) ||
            undefined,
        consultationCount:
            Number(merged?.consultationCount ?? 0) || 0,
        averageRating: Number(merged?.averageRating ?? 0) || 0,
        totalReviews: Number(merged?.totalReviews ?? 0) || 0,
        profileViews: Number(merged?.profileViews ?? 0) || 0,
        languagesSpoken: Array.isArray(merged?.languagesSpoken)
            ? merged.languagesSpoken
            : [],
        courtType: Array.isArray(merged?.courtType)
            ? merged.courtType
            : [],
        consultationModes: merged?.consultationModes,
        maxBookingsPerDay:
            Number(merged?.maxBookingsPerDay ?? 0) || undefined,
        advanceNoticeHours:
            Number(merged?.advanceNoticeHours ?? 0) || undefined,
        userId: merged?.userId,

        raw: l,
    }
}

export function normalizeBusiness(item: any): Business {
    const user = item?.userInfo || item?.user || item?.businessInfo || {}
    const details =
        item?.businessDetails || item?.details || item?.business || item || {}

    return {
        id: getId(item),
        companyName:
            details?.companyName ||
            details?.legalName ||
            user?.companyName ||
            'Unnamed Business',
        legalName: details?.legalName,
        email: user?.email || details?.email || '',
        phone: user?.phone || details?.phone || '',
        industry: details?.industry || details?.sector || '',
        logo:
            user?.profilePhoto ||
            user?.logo ||
            details?.logo ||
            undefined,
        assignedLawyer:
            item?.assignedLawyer?.userInfo?.fullName ||
            item?.assignedLawyer?.fullName ||
            details?.assignedLawyer ||
            undefined,
        contracts:
            Number(
                item?.stats?.contracts ??
                item?.contracts ??
                details?.contractCount ??
                0
            ) || 0,
        compliance:
            Number(
                item?.stats?.compliance ??
                item?.compliance ??
                details?.complianceCount ??
                0
            ) || 0,
        openWork:
            Number(item?.stats?.openWork ?? item?.openWork ?? 0) || 0,
        status:
            details?.status ||
            item?.status ||
            (details?.verified || item?.verified ? 'active' : 'pending'),
        verified: Boolean(details?.verified || item?.verified),
        createdAt: details?.createdAt || item?.createdAt,
        raw: item,
    }
}

export function normalizeContract(item: any): Contract {
    const c = item?.contract || item?.item || item

    return {
        id: String(c?._id || c?.id || ''),
        title: c?.title || c?.name || 'Untitled contract',
        client: getBusinessName(c) || getBusinessName(item),
        lawyer:
            c?.lawyer?.userInfo?.fullName ||
            c?.lawyer?.fullName ||
            c?.assignedProfessional?.fullName ||
            c?.assignedLawyer?.fullName ||
            item?.lawyer?.fullName ||
            undefined,
        status: c?.status,
        dueDate:
            c?.expiryDate ||
            c?.renewalDate ||
            c?.effectiveDate ||
            c?.dueDate,
        createdAt: c?.createdAt,
        raw: item,
    }
}

export function normalizeCompliance(item: any): ComplianceItem {
    const c = item?.compliance || item?.item || item

    return {
        id: String(c?._id || c?.id || ''),
        name:
            c?.name ||
            c?.title ||
            c?.complianceName ||
            'Compliance item',
        client: getBusinessName(c) || getBusinessName(item),
        status: c?.status,
        priority: c?.priority,
        dueDate: c?.dueDate || c?.deadline,
        description: c?.description,
        raw: item,
    }
}

export function normalizeWork(item: any): WorkItem {
    const w = item?.work || item?.item || item

    return {
        id: String(w?._id || w?.id || ''),
        title: w?.title || w?.name || 'Work item',
        type: w?.workType || w?.sourceType || 'Task',
        client: getBusinessName(w) || getBusinessName(item),
        lawyer:
            w?.assignedTo?.userInfo?.fullName ||
            w?.assignedTo?.fullName ||
            w?.lawyer?.fullName ||
            w?.lawyer?.userInfo?.fullName ||
            item?.lawyer?.fullName ||
            undefined,
        status: w?.status,
        priority: w?.priority,
        dueDate: w?.dueDate || w?.deadline || w?.expectedDeliveryDate,
        description: w?.description,
        raw: item,
    }
}

export function normalizeDocument(item: any): DocumentItem {
    return {
        id: getId(item),
        name:
            item?.name ||
            item?.originalName ||
            item?.fileName ||
            'Document',
        client: getBusinessName(item),
        category: item?.category || item?.type,
        createdAt:
            item?.createdAt || item?.uploadedAt || item?.updatedAt,
        url: item?.url || item?.fileUrl,
        raw: item,
    }
}

export function normalizeTeamMember(item: any): TeamMember {
    const user = item?.userInfo || item?.user || item
    return {
        id: getId(item),
        fullName: user?.fullName || user?.name || 'Team member',
        email: user?.email || '',
        role: user?.role || item?.role || 'admin',
        profilePhoto: user?.profilePhoto || user?.profileImage,
        createdAt: item?.createdAt,
        raw: item,
    }
}

export function normalizeAlert(item: any): AlertItem {
    return {
        id: getId(item),
        title: item?.title || 'Alert',
        message: item?.message || item?.description || '',
        severity: item?.severity || item?.priority,
        status: item?.status,
        createdAt: item?.createdAt,
        raw: item,
    }
}

// =================================================================
// ENDPOINT WRAPPERS
// =================================================================

function buildQuery(params: Record<string, any>) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (key === 'status' && value === 'all') return
        qs.set(key, String(value))
    })
    const q = qs.toString()
    return q ? `?${q}` : ''
}

function unwrap<T>(result: any): T {
    if (result && typeof result === 'object' && 'success' in result) {
        if (result.success === false) {
            throw new ApiError(
                result.message || 'Request failed',
                400
            )
        }
        if ('data' in result) return result.data as T
    }
    return result as T
}

export const adminApi = {
    // ---------------- Admin Profile ----------------
    getAdminProfile: async (): Promise<AdminProfile> => {
        const res = await apiFetch<any>(ENDPOINTS.admin.profile)
        return unwrap<AdminProfile>(res)
    },

    updateAdminProfile: async (
        payload: UpdateAdminProfilePayload
    ): Promise<AdminProfile> => {
        const res = await apiFetch<any>(ENDPOINTS.admin.profile, {
            method: 'PATCH',
            body: payload,
        })
        return unwrap<AdminProfile>(res)
    },

    // ---------------- Lawyers ----------------
    listLawyers: (params: {
        page?: number
        limit?: number
        search?: string
        status?: string
    }) =>
        apiFetch<any>(`${ENDPOINTS.lawyers.list}${buildQuery(params)}`),

    lawyerStats: () => apiFetch<any>(ENDPOINTS.lawyers.stats),

    lawyerDetail: (id: string) =>
        apiFetch<any>(ENDPOINTS.lawyers.detail(id)),

    verifyLawyer: (id: string) =>
        apiFetch<any>(ENDPOINTS.lawyers.verify(id), { method: 'PATCH' }),

    suspendLawyer: (id: string) =>
        apiFetch<any>(ENDPOINTS.lawyers.suspend(id), { method: 'PATCH' }),

    activateLawyer: (id: string) =>
        apiFetch<any>(ENDPOINTS.lawyers.activate(id), { method: 'PATCH' }),

    // ---- Lawyer-scoped related data (admin) ----
    lawyerWork: (
        id: string,
        params?: { page?: number; limit?: number }
    ) =>
        apiFetch<any>(
            `${ENDPOINTS.lawyers.work(id)}${buildQuery(params || {})}`
        ),

    lawyerContracts: (
        id: string,
        params?: { page?: number; limit?: number }
    ) =>
        apiFetch<any>(
            `${ENDPOINTS.lawyers.contracts(id)}${buildQuery(
                params || {}
            )}`
        ),

    lawyerCompliance: (
        id: string,
        params?: { page?: number; limit?: number }
    ) =>
        apiFetch<any>(
            `${ENDPOINTS.lawyers.compliance(id)}${buildQuery(
                params || {}
            )}`
        ),

    // ---------------- Businesses ----------------
    listBusinesses: (params: {
        page?: number
        limit?: number
        search?: string
        status?: string
    }) =>
        apiFetch<any>(
            `${ENDPOINTS.businesses.list}${buildQuery(params)}`
        ),

    businessStats: () => apiFetch<any>(ENDPOINTS.businesses.stats),

    businessDetail: (id: string) =>
        apiFetch<any>(ENDPOINTS.businesses.detail(id)),

    verifyBusiness: (id: string) =>
        apiFetch<any>(ENDPOINTS.businesses.verify(id), { method: 'PATCH' }),

    suspendBusiness: (id: string) =>
        apiFetch<any>(ENDPOINTS.businesses.suspend(id), {
            method: 'PATCH',
        }),

    activateBusiness: (id: string) =>
        apiFetch<any>(ENDPOINTS.businesses.activate(id), {
            method: 'PATCH',
        }),

    // ---------------- Contracts ----------------
    listContracts: (params: {
        page?: number
        limit?: number
        search?: string
        status?: string
    }) =>
        apiFetch<any>(`${ENDPOINTS.contracts.list}${buildQuery(params)}`),

    contractStats: () => apiFetch<any>(ENDPOINTS.contracts.stats),

    contractDetail: (id: string) =>
        apiFetch<any>(ENDPOINTS.contracts.detail(id)),

    approveContract: (id: string) =>
        apiFetch<any>(ENDPOINTS.contracts.approve(id), {
            method: 'PATCH',
        }),

    rejectContract: (id: string) =>
        apiFetch<any>(ENDPOINTS.contracts.reject(id), {
            method: 'PATCH',
        }),

    // ---------------- Compliance ----------------
    listCompliance: (params: {
        page?: number
        limit?: number
        search?: string
        status?: string
        priority?: string
    }) =>
        apiFetch<any>(
            `${ENDPOINTS.compliance.list}${buildQuery(params)}`
        ),

    complianceStats: () => apiFetch<any>(ENDPOINTS.compliance.stats),

    complianceDetail: (id: string) =>
        apiFetch<any>(ENDPOINTS.compliance.detail(id)),

    resolveCompliance: (id: string) =>
        apiFetch<any>(ENDPOINTS.compliance.resolve(id), {
            method: 'PATCH',
        }),

    // ---------------- Work ----------------
    listWork: (params: {
        page?: number
        limit?: number
        search?: string
        status?: string
        priority?: string
    }) =>
        apiFetch<any>(`${ENDPOINTS.work.list}${buildQuery(params)}`),

    workStats: () => apiFetch<any>(ENDPOINTS.work.stats),

    workDetail: (id: string) =>
        apiFetch<any>(ENDPOINTS.work.detail(id)),

    // ---------------- Documents ----------------
    listDocuments: (params: {
        page?: number
        limit?: number
        search?: string
        category?: string
    }) =>
        apiFetch<any>(
            `${ENDPOINTS.documents.list}${buildQuery(params)}`
        ),

    documentDetail: (id: string) =>
        apiFetch<any>(ENDPOINTS.documents.detail(id)),

    // ---------------- Team ----------------
    listTeam: (params: {
        page?: number
        limit?: number
        search?: string
    }) => apiFetch<any>(`${ENDPOINTS.team.list}${buildQuery(params)}`),

    teamStats: () => apiFetch<any>(ENDPOINTS.team.stats),

    teamDetail: (id: string) =>
        apiFetch<any>(ENDPOINTS.team.detail(id)),

    inviteTeamMember: (payload: {
        email: string
        role: string
        fullName?: string
    }) =>
        apiFetch<any>(ENDPOINTS.team.invite, {
            method: 'POST',
            body: payload,
        }),

    // ---------------- Alerts ----------------
    listAlerts: (params: {
        page?: number
        limit?: number
        severity?: string
        status?: string
    }) =>
        apiFetch<any>(`${ENDPOINTS.alerts.list}${buildQuery(params)}`),

    alertStats: () => apiFetch<any>(ENDPOINTS.alerts.stats),

    resolveAlert: (id: string) =>
        apiFetch<any>(ENDPOINTS.alerts.resolve(id), { method: 'PATCH' }),

    // ---------------- Messages ----------------
    listThreads: (params: { page?: number; limit?: number }) =>
        apiFetch<any>(
            `${ENDPOINTS.messages.threads}${buildQuery(params)}`
        ),

    getThread: (id: string) =>
        apiFetch<any>(ENDPOINTS.messages.thread(id)),

    sendMessage: (threadId: string, body: { content: string }) =>
        apiFetch<any>(ENDPOINTS.messages.send(threadId), {
            method: 'POST',
            body,
        }),

    // ---------------- Analytics ----------------
    analyticsOverview: () => apiFetch<any>(ENDPOINTS.analytics.overview),

    analyticsRevenue: () => apiFetch<any>(ENDPOINTS.analytics.revenue),

    analyticsActivity: () => apiFetch<any>(ENDPOINTS.analytics.activity),

    analyticsReports: () => apiFetch<any>(ENDPOINTS.analytics.reports),
}

// =================================================================
// STANDALONE EXPORTS
// =================================================================

export const getAdminProfile = async (): Promise<AdminProfile> => {
    return adminApi.getAdminProfile()
}

export const updateAdminProfile = async (
    payload: UpdateAdminProfilePayload
): Promise<AdminProfile> => {
    return adminApi.updateAdminProfile(payload)
}

// =================================================================
// BADGE COUNTS (for sidebar)
// =================================================================

export async function fetchSidebarBadges(): Promise<
    Record<string, number | null>
> {
    const token = getToken()
    if (!token) return {}

    const results: Record<string, number | null> = {}

    const jobs: Array<[string, string, string]> = [
        [
            '/admin-dashboard/lawyers',
            ENDPOINTS.lawyers.stats,
            'totalLawyers',
        ],
        [
            '/admin-dashboard/businesses',
            ENDPOINTS.businesses.stats,
            'totalBusinesses',
        ],
        [
            '/admin-dashboard/contracts',
            ENDPOINTS.contracts.stats,
            'totalContracts',
        ],
        [
            '/admin-dashboard/compliance',
            ENDPOINTS.compliance.stats,
            'totalCompliance',
        ],
        [
            '/admin-dashboard/alerts',
            ENDPOINTS.alerts.stats,
            'totalAlerts',
        ],
    ]

    await Promise.all(
        jobs.map(async ([key, endpoint, statKey]) => {
            try {
                const response = await apiFetch<any>(endpoint, { token })
                const stats = response?.data || response || {}
                results[key] =
                    stats?.[statKey] ??
                    stats?.total ??
                    stats?.count ??
                    stats?.pending ??
                    0
            } catch {
                results[key] = null
            }
        })
    )

    return results
}