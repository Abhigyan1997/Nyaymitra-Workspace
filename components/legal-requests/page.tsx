'use client'

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    AlertCircle,
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FileCheck2,
    FileText,
    Filter,
    Flag,
    Loader2,
    MessageCircle,
    Paperclip,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    UserCheck,
    UserPlus,
    UserRound,
    X,
} from 'lucide-react'

type PortalMode = 'admin' | 'lawyer'

interface Props {
    mode: PortalMode
}

interface Person {
    _id?: string
    id?: string
    fullName?: string
    name?: string
    email?: string
    role?: string
}

interface Attachment {
    _id?: string
    originalName: string
    fileName: string
    storageKey: string
    mimeType: string
    fileSize: number
    uploadedBy?: Person | string
    uploadedAt?: string
}

interface Comment {
    _id: string
    author?: Person | string
    authorRole?: string
    message: string
    isInternal: boolean
    isEdited?: boolean
    isDeleted?: boolean
    createdAt?: string
    updatedAt?: string
    attachments?: Attachment[]
}

interface Activity {
    _id?: string
    action: string
    description?: string
    performedBy?: Person | string
    createdAt?: string
}

interface LegalRequest {
    _id: string
    requestNumber?: string
    business?: {
        _id?: string
        companyName?: string
        legalName?: string
    } | string
    createdBy?: Person | string
    title: string
    category: string
    customCategory?: string
    description: string
    additionalInformation?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    deadline?: string | null
    preferredProfessionalType?:
    | 'lawyer'
    | 'CA'
    | 'CS'
    | 'consultant'
    | 'not-sure'
    assignedTo?: Person | string | null
    status:
    | 'submitted'
    | 'under-review'
    | 'assigned'
    | 'in-progress'
    | 'waiting-for-client'
    | 'completed'
    | 'cancelled'
    resolution?: string | null
    completedAt?: string | null
    cancelledAt?: string | null
    attachments?: Attachment[]
    comments?: Comment[]
    activities?: Activity[]
    lastActivityAt?: string
    createdAt?: string
    updatedAt?: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

type ProfessionalType = 'lawyer' | 'CA' | 'CS'

interface Professional {
    id: string
    fullName: string
    email?: string
    phone?: string
    profilePhoto?: string
    type: ProfessionalType
    specialization?: string[]
    experience?: number
    city?: string
    raw?: any
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'

const REQUESTS_URL = `${API_BASE}/legal-requests`

// ---------------------------------------------------------------
// ASSIGN ENDPOINTS — edit here if paths change
// ---------------------------------------------------------------
const ASSIGN_ENDPOINTS = {
    listProfessionals: (params: {
        type?: string
        search?: string
        page?: number
        limit?: number
    }) => {
        const qs = new URLSearchParams()
        qs.set('page', String(params.page ?? 1))
        qs.set('limit', String(params.limit ?? 20))
        if (params.type && params.type !== 'all') {
            qs.set('type', params.type)
        }
        if (params.search) qs.set('search', params.search)
        return `${API_BASE}/lawyer/all?${qs.toString()}`
    },

    // ✅ Function — takes the request ID and interpolates it
    assign: (requestId: string) =>
        `${REQUESTS_URL}/${requestId}/assign`,
}
const ASSIGN_PAGE_SIZE = 20

const STATUS_OPTIONS = [
    'submitted',
    'under-review',
    'assigned',
    'in-progress',
    'waiting-for-client',
    'completed',
    'cancelled',
] as const

const CATEGORY_OPTIONS = [
    'contract',
    'compliance',
    'corporate',
    'employment',
    'ip',
    'dispute',
    'legal-notice',
    'documentation',
    'regulatory',
    'tax',
    'registration',
    'governance',
    'privacy',
    'due-diligence',
    'general',
    'other',
] as const

const PRIORITY_OPTIONS = [
    'low',
    'medium',
    'high',
    'urgent',
] as const

const formatStatus = (value?: string) => {
    if (!value) return 'Unknown'
    return value
        .split('-')
        .map(
            (item) =>
                item.charAt(0).toUpperCase() + item.slice(1)
        )
        .join(' ')
}

const formatCategory = (value?: string) => {
    if (!value) return 'General'
    const map: Record<string, string> = {
        ip: 'IP / Trademark',
        'legal-notice': 'Legal Notice',
        'due diligence': 'Due Diligence',
        'due-diligence': 'Due Diligence',
    }
    if (map[value]) return map[value]
    return value
        .split('-')
        .map(
            (item) =>
                item.charAt(0).toUpperCase() + item.slice(1)
        )
        .join(' ')
}

const formatDate = (date?: string | null) => {
    if (!date) return '—'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return '—'
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed)
}

const formatDateTime = (date?: string | null) => {
    if (!date) return '—'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return '—'
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsed)
}

const getId = (value?: string | Person | null) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    return value._id || value.id || ''
}

const getName = (
    value?: string | Person | null,
    fallback = 'Unknown user'
) => {
    if (!value) return fallback
    if (typeof value === 'string') return value
    return (
        value.fullName || value.name || value.email || fallback
    )
}

const getInitials = (name: string) => {
    if (!name) return 'NM'
    const pieces = name.trim().split(/\s+/)
    if (pieces.length === 1) {
        return pieces[0].slice(0, 2).toUpperCase()
    }
    return (
        pieces[0].charAt(0) +
        pieces[pieces.length - 1].charAt(0)
    ).toUpperCase()
}

const priorityClasses = (priority: string) => {
    switch (priority) {
        case 'urgent':
            return 'bg-red-500/10 text-red-400 border-red-500/20'
        case 'high':
            return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        case 'medium':
            return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        default:
            return 'bg-white/5 text-white/60 border-white/10'
    }
}

const statusClasses = (status: string) => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        case 'in-progress':
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        case 'under-review':
            return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        case 'waiting-for-client':
            return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        case 'cancelled':
            return 'bg-red-500/10 text-red-400 border-red-500/20'
        default:
            return 'bg-white/5 text-white/60 border-white/10'
    }
}

const parseResponse = async (response: Response) => {
    const contentType =
        response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const data = isJson
        ? await response.json()
        : await response.text()

    if (!response.ok) {
        const message =
            typeof data === 'object'
                ? data?.message ||
                data?.error ||
                'Request failed.'
                : data || 'Request failed.'
        throw new Error(message)
    }
    return data
}

// ---------------------------------------------------------------
// Response extractors
// ---------------------------------------------------------------
function extractProfessionalsList(result: any): any[] {
    if (Array.isArray(result)) return result
    if (Array.isArray(result?.data)) return result.data
    if (Array.isArray(result?.lawyers)) return result.lawyers
    if (Array.isArray(result?.professionals))
        return result.professionals
    if (Array.isArray(result?.data?.lawyers))
        return result.data.lawyers
    if (Array.isArray(result?.data?.professionals))
        return result.data.professionals
    if (Array.isArray(result?.items)) return result.items
    return []
}

function extractProfessionalsTotal(
    result: any,
    fallback: number
): number {
    const total = Number(
        result?.count ??
        result?.total ??
        result?.pagination?.total ??
        result?.meta?.total ??
        0
    )
    return Number.isFinite(total) && total > 0 ? total : fallback
}

// ---------------------------------------------------------------
// Professional normalizer
// ---------------------------------------------------------------
function normalizeProfessional(
    item: any,
    fallbackType: ProfessionalType
): Professional {
    const user = item?.userInfo || item?.user || item
    const details =
        item?.lawyerDetails ||
        item?.professionalDetails ||
        item?.details ||
        item

    const rawType = String(
        details?.type ||
        item?.professionalType ||
        item?.type ||
        item?.role ||
        fallbackType
    ).toLowerCase()

    const type: ProfessionalType =
        rawType === 'ca'
            ? 'CA'
            : rawType === 'cs'
                ? 'CS'
                : 'lawyer'

    return {
        id: String(
            details?._id ||
            item?._id ||
            item?.id ||
            user?._id ||
            ''
        ),
        fullName:
            user?.fullName ||
            details?.fullName ||
            item?.fullName ||
            item?.name ||
            'Unnamed professional',
        email: user?.email || item?.email,
        phone: user?.phone || item?.phone,
        profilePhoto:
            details?.profilePhoto ||
            user?.profilePhoto ||
            user?.profileImage,
        type,
        specialization:
            (Array.isArray(details?.specialization) &&
                details.specialization) ||
            (Array.isArray(details?.practiceAreas) &&
                details.practiceAreas) ||
            (Array.isArray(item?.specialization) &&
                item.specialization) ||
            [],
        experience:
            Number(
                details?.experience ??
                item?.experience ??
                0
            ) || undefined,
        city: details?.city || item?.city,
        raw: item,
    }
}

export default function LegalRequestManagementPage({
    mode,
}: Props) {
    const [requests, setRequests] = useState<LegalRequest[]>([])
    const [selectedRequest, setSelectedRequest] =
        useState<LegalRequest | null>(null)
    const [comments, setComments] = useState<Comment[]>([])

    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })

    const [filters, setFilters] = useState({
        status: '',
        category: '',
        priority: '',
    })

    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [commentLoading, setCommentLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const [commentText, setCommentText] = useState('')
    const [isInternalComment, setIsInternalComment] = useState(
        mode === 'admin'
    )
    const [selectedFile, setSelectedFile] = useState<File | null>(
        null
    )
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        additionalInformation: '',
        priority: '',
        deadline: '',
        assignedTo: '',
    })

    const [updatingStatus, setUpdatingStatus] = useState(false)

    // ---- Assign modal state ----
    const [assignOpen, setAssignOpen] = useState(false)
    const [assignType, setAssignType] = useState<
        'all' | ProfessionalType
    >('lawyer')
    const [assignSearch, setAssignSearch] = useState('')
    const [assignDebounced, setAssignDebounced] = useState('')
    const [professionals, setProfessionals] = useState<
        Professional[]
    >([])
    const [professionalsLoading, setProfessionalsLoading] =
        useState(false)
    const [
        professionalsLoadingMore,
        setProfessionalsLoadingMore,
    ] = useState(false)
    const [professionalsError, setProfessionalsError] =
        useState('')
    const [assigningId, setAssigningId] = useState<
        string | null
    >(null)

    // Modal pagination
    const [assignPage, setAssignPage] = useState(1)
    const [assignTotal, setAssignTotal] = useState(0)
    const [assignHasMore, setAssignHasMore] = useState(false)

    const token =
        typeof window !== 'undefined'
            ? localStorage.getItem('token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('authToken')
            : null

    const authHeaders = useMemo(() => {
        const headers: Record<string, string> = {
            Accept: 'application/json',
        }
        if (token) {
            headers.Authorization = `Bearer ${token}`
        }
        return headers
    }, [token])

    // ----------------------------------------------------------------
    // Load list
    // ----------------------------------------------------------------
    const loadRequests = useCallback(
        async (page = 1) => {
            try {
                setLoading(true)
                setError('')

                const params = new URLSearchParams()
                params.set('page', String(page))
                params.set('limit', String(pagination.limit))

                if (filters.status) {
                    params.set('status', filters.status)
                }
                if (filters.category) {
                    params.set('category', filters.category)
                }
                if (filters.priority) {
                    params.set('priority', filters.priority)
                }

                const response = await fetch(
                    `${REQUESTS_URL}?${params.toString()}`,
                    {
                        method: 'GET',
                        headers: authHeaders,
                        cache: 'no-store',
                    }
                )

                const result = await parseResponse(response)

                const requestData = Array.isArray(result?.data)
                    ? result.data
                    : Array.isArray(result)
                        ? result
                        : result?.data?.requests ||
                        result?.data?.legalRequests ||
                        result?.data?.items ||
                        []

                setRequests(requestData)

                const apiPagination =
                    result?.pagination ||
                    result?.data?.pagination ||
                    {}

                setPagination({
                    page: Number(apiPagination.page) || page,
                    limit:
                        Number(apiPagination.limit) ||
                        pagination.limit,
                    total: Number(apiPagination.total) || 0,
                    totalPages:
                        Number(apiPagination.pages) ||
                        Number(apiPagination.totalPages) ||
                        0,
                })
            } catch (err) {
                console.error('LOAD ERROR:', err)
                setRequests([])
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load legal requests.'
                )
            } finally {
                setLoading(false)
            }
        },
        [
            authHeaders,
            filters.status,
            filters.category,
            filters.priority,
            pagination.limit,
        ]
    )

    const loadRequest = useCallback(
        async (requestId: string) => {
            try {
                setDetailLoading(true)
                setError('')

                const response = await fetch(
                    `${REQUESTS_URL}/${requestId}`,
                    {
                        method: 'GET',
                        headers: authHeaders,
                        cache: 'no-store',
                    }
                )

                const result = await parseResponse(response)
                const request = result?.data ?? result

                setSelectedRequest(request)

                setEditForm({
                    title: request.title || '',
                    description: request.description || '',
                    additionalInformation:
                        request.additionalInformation || '',
                    priority: request.priority || 'medium',
                    deadline: request.deadline
                        ? new Date(request.deadline)
                            .toISOString()
                            .slice(0, 10)
                        : '',
                    assignedTo: getId(request.assignedTo),
                })

                await loadComments(requestId)
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load request.'
                )
            } finally {
                setDetailLoading(false)
            }
        },
        [authHeaders]
    )

    const loadComments = async (requestId: string) => {
        try {
            const response = await fetch(
                `${REQUESTS_URL}/${requestId}/comments`,
                {
                    method: 'GET',
                    headers: authHeaders,
                    cache: 'no-store',
                }
            )

            const result = await parseResponse(response)
            const data = result?.data ?? result

            setComments(data?.comments || data?.items || [])
        } catch (err) {
            console.error('Failed to load comments:', err)
        }
    }

    useEffect(() => {
        loadRequests(1)
    }, [filters.status, filters.category, filters.priority])

    // ----------------------------------------------------------------
    // Debounce inside modal
    // ----------------------------------------------------------------
    useEffect(() => {
        const t = setTimeout(() => {
            setAssignDebounced(assignSearch.trim())
        }, 300)
        return () => clearTimeout(t)
    }, [assignSearch])

    // ----------------------------------------------------------------
    // Load professionals — page 1 (fresh)
    // ----------------------------------------------------------------
    const loadProfessionals = useCallback(async () => {
        if (!assignOpen) return

        try {
            setProfessionalsLoading(true)
            setProfessionalsError('')

            const url = ASSIGN_ENDPOINTS.listProfessionals({
                type: 'lawyer',
                search: assignDebounced || undefined,
                page: 1,
                limit: ASSIGN_PAGE_SIZE,
            })

            const response = await fetch(url, {
                method: 'GET',
                headers: authHeaders,
                cache: 'no-store',
            })

            const result = await parseResponse(response)

            const list = extractProfessionalsList(result)
            const total = extractProfessionalsTotal(
                result,
                list.length
            )

            const normalized = list.map((item: any) =>
                normalizeProfessional(item, 'lawyer')
            )

            setProfessionals(normalized)
            setAssignPage(1)
            setAssignTotal(total)
            setAssignHasMore(normalized.length < total)
        } catch (err) {
            setProfessionalsError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load professionals.'
            )
            setProfessionals([])
            setAssignTotal(0)
            setAssignHasMore(false)
        } finally {
            setProfessionalsLoading(false)
        }
    }, [assignOpen, assignDebounced, authHeaders])

    // ----------------------------------------------------------------
    // Load more (append page N+1)
    // ----------------------------------------------------------------
    const loadMoreProfessionals = useCallback(async () => {
        if (!assignOpen) return
        if (professionalsLoading || professionalsLoadingMore)
            return
        if (!assignHasMore) return

        try {
            setProfessionalsLoadingMore(true)

            const nextPage = assignPage + 1

            const url = ASSIGN_ENDPOINTS.listProfessionals({
                type: 'lawyer',
                search: assignDebounced || undefined,
                page: nextPage,
                limit: ASSIGN_PAGE_SIZE,
            })

            const response = await fetch(url, {
                method: 'GET',
                headers: authHeaders,
                cache: 'no-store',
            })

            const result = await parseResponse(response)
            const list = extractProfessionalsList(result)

            const normalized = list.map((item: any) =>
                normalizeProfessional(item, 'lawyer')
            )

            setProfessionals((prev) => {
                const seen = new Set(prev.map((p) => p.id))
                const additions = normalized.filter(
                    (p) => p.id && !seen.has(p.id)
                )
                return [...prev, ...additions]
            })

            setAssignPage(nextPage)

            setAssignHasMore(
                normalized.length >= ASSIGN_PAGE_SIZE
            )
        } catch (err) {
            setProfessionalsError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load more.'
            )
        } finally {
            setProfessionalsLoadingMore(false)
        }
    }, [
        assignOpen,
        assignPage,
        assignDebounced,
        assignHasMore,
        professionalsLoading,
        professionalsLoadingMore,
        authHeaders,
    ])

    useEffect(() => {
        loadProfessionals()
    }, [loadProfessionals])

    // ----------------------------------------------------------------
    // Open / refresh
    // ----------------------------------------------------------------
    const openRequest = async (request: LegalRequest) => {
        setSelectedRequest(request)
        await loadRequest(request._id)
    }

    const refresh = async () => {
        await loadRequests(pagination.page)

        if (selectedRequest?._id) {
            await loadRequest(selectedRequest._id)
        }
    }

    // ----------------------------------------------------------------
    // Assign professional
    // ----------------------------------------------------------------
    const assignProfessional = async (
        professional: Professional
    ) => {
        if (!selectedRequest) return

        try {
            setAssigningId(professional.id)
            setError('')
            setSuccessMessage('')

            // Sanity: make sure we actually have a request ID
            if (!selectedRequest._id) {
                setError('Missing request ID — cannot assign.')
                return
            }

            const url = ASSIGN_ENDPOINTS.assign(selectedRequest._id)

            // Debug — check the URL in DevTools Network tab
            console.log('[assign] POST →', url)
            console.log('[assign] body →', {
                assignedTo: professional.id,
            })

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assignedTo: professional.id,
                }),
            })

            await parseResponse(response)

            setSuccessMessage(
                `${professional.fullName} assigned successfully.`
            )
            setAssignOpen(false)

            await loadRequest(selectedRequest._id)
            await loadRequests(pagination.page)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to assign professional.'
            )
        } finally {
            setAssigningId(null)
        }
    }
    // ----------------------------------------------------------------
    // Update status
    // ----------------------------------------------------------------
    const updateStatus = async (status: string) => {
        if (!selectedRequest) return

        try {
            setUpdatingStatus(true)
            setError('')
            setSuccessMessage('')

            const response = await fetch(
                `${REQUESTS_URL}/${selectedRequest._id}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        ...authHeaders,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status }),
                }
            )

            await parseResponse(response)

            setSuccessMessage(
                'Request status updated successfully.'
            )

            await loadRequest(selectedRequest._id)
            await loadRequests(pagination.page)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update status.'
            )
        } finally {
            setUpdatingStatus(false)
        }
    }

    // ----------------------------------------------------------------
    // Save request
    // ----------------------------------------------------------------
    const saveRequest = async () => {
        if (!selectedRequest) return

        if (!editForm.title.trim()) {
            setError('Request title is required.')
            return
        }

        if (!editForm.description.trim()) {
            setError('Request description is required.')
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccessMessage('')

            const body: Record<string, unknown> = {
                title: editForm.title.trim(),
                description: editForm.description.trim(),
                additionalInformation:
                    editForm.additionalInformation.trim(),
                priority: editForm.priority,
                deadline: editForm.deadline
                    ? new Date(editForm.deadline).toISOString()
                    : null,
            }

            if (mode === 'admin') {
                body.assignedTo =
                    editForm.assignedTo.trim() || null
            }

            const response = await fetch(
                `${REQUESTS_URL}/${selectedRequest._id}`,
                {
                    method: 'PATCH',
                    headers: {
                        ...authHeaders,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }
            )

            await parseResponse(response)

            setSuccessMessage(
                'Legal request updated successfully.'
            )
            setEditMode(false)

            await loadRequest(selectedRequest._id)
            await loadRequests(pagination.page)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update request.'
            )
        } finally {
            setSaving(false)
        }
    }

    // ----------------------------------------------------------------
    // Submit comment
    // ----------------------------------------------------------------
    const submitComment = async () => {
        if (!selectedRequest || !commentText.trim()) return

        try {
            setCommentLoading(true)
            setError('')
            setSuccessMessage('')

            const response = await fetch(
                `${REQUESTS_URL}/${selectedRequest._id}/comments`,
                {
                    method: 'POST',
                    headers: {
                        ...authHeaders,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: commentText.trim(),
                        isInternal: isInternalComment,
                    }),
                }
            )

            await parseResponse(response)

            setCommentText('')
            setSuccessMessage('Comment added successfully.')

            await loadComments(selectedRequest._id)
            await loadRequest(selectedRequest._id)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to add comment.'
            )
        } finally {
            setCommentLoading(false)
        }
    }

    // ----------------------------------------------------------------
    // Upload attachment
    // ----------------------------------------------------------------
    const uploadAttachment = async () => {
        if (!selectedRequest || !selectedFile) return

        try {
            setUploading(true)
            setError('')
            setSuccessMessage('')

            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await fetch(
                `${REQUESTS_URL}/${selectedRequest._id}/attachments`,
                {
                    method: 'POST',
                    headers: authHeaders,
                    body: formData,
                }
            )

            await parseResponse(response)

            setSelectedFile(null)

            const fileInput = document.getElementById(
                'legal-request-file'
            ) as HTMLInputElement | null

            if (fileInput) {
                fileInput.value = ''
            }

            setSuccessMessage(
                'Attachment uploaded successfully.'
            )

            await loadRequest(selectedRequest._id)
            await loadRequests(pagination.page)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to upload attachment.'
            )
        } finally {
            setUploading(false)
        }
    }

    const loadedStats = useMemo(() => {
        return {
            total: requests.length,
            urgent: requests.filter(
                (item) => item.priority === 'urgent'
            ).length,
            inProgress: requests.filter(
                (item) => item.status === 'in-progress'
            ).length,
            completed: requests.filter(
                (item) => item.status === 'completed'
            ).length,
        }
    }, [requests])

    return (
        <div className="min-h-screen bg-[#070707] text-white">
            {/* Header */}
            <div className="border-b border-white/[0.07] bg-black/30 backdrop-blur-xl">
                <div className="px-4 py-5 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {mode === 'admin'
                                    ? 'Admin Portal'
                                    : 'Lawyer Portal'}
                            </div>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                                Legal Requests
                            </h1>
                            <p className="mt-1 text-sm text-white/45">
                                {mode === 'admin'
                                    ? 'Review, assign and manage legal requests across NyayMitra.'
                                    : 'Review assigned legal requests and manage client communication.'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={refresh}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? 'animate-spin' : ''
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 py-5 sm:px-6 lg:px-8">
                {/* Alerts */}
                {error && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button
                            type="button"
                            onClick={() => setError('')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{successMessage}</span>
                        <button
                            type="button"
                            className="ml-auto"
                            onClick={() => setSuccessMessage('')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <StatCard
                        label="Loaded Requests"
                        value={loadedStats.total}
                        icon={FileText}
                    />
                    <StatCard
                        label="Urgent"
                        value={loadedStats.urgent}
                        icon={Flag}
                    />
                    <StatCard
                        label="In Progress"
                        value={loadedStats.inProgress}
                        icon={Clock3}
                    />
                    <StatCard
                        label="Completed"
                        value={loadedStats.completed}
                        icon={CheckCircle2}
                    />
                </div>

                {/* Filters */}
                <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Filter className="h-4 w-4 text-amber-400" />
                        Filters
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <SelectField
                            label="Status"
                            value={filters.status}
                            onChange={(value) =>
                                setFilters((current) => ({
                                    ...current,
                                    status: value,
                                }))
                            }
                            options={[
                                { value: '', label: 'All statuses' },
                                ...STATUS_OPTIONS.map((value) => ({
                                    value,
                                    label: formatStatus(value),
                                })),
                            ]}
                        />

                        <SelectField
                            label="Category"
                            value={filters.category}
                            onChange={(value) =>
                                setFilters((current) => ({
                                    ...current,
                                    category: value,
                                }))
                            }
                            options={[
                                { value: '', label: 'All categories' },
                                ...CATEGORY_OPTIONS.map((value) => ({
                                    value,
                                    label: formatCategory(value),
                                })),
                            ]}
                        />

                        <SelectField
                            label="Priority"
                            value={filters.priority}
                            onChange={(value) =>
                                setFilters((current) => ({
                                    ...current,
                                    priority: value,
                                }))
                            }
                            options={[
                                { value: '', label: 'All priorities' },
                                ...PRIORITY_OPTIONS.map((value) => ({
                                    value,
                                    label:
                                        value.charAt(0).toUpperCase() +
                                        value.slice(1),
                                })),
                            ]}
                        />
                    </div>
                </div>

                <div className="grid min-h-[650px] gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                    {/* Request List */}
                    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                        <div className="border-b border-white/[0.07] px-4 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">
                                        Request Queue
                                    </p>
                                    <p className="mt-0.5 text-xs text-white/35">
                                        {pagination.total} total requests
                                    </p>
                                </div>
                                {loading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                                )}
                            </div>
                        </div>

                        <div className="max-h-[720px] overflow-y-auto">
                            {!loading && requests.length === 0 && (
                                <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                                    <FileText className="h-10 w-10 text-white/10" />
                                    <p className="mt-4 text-sm font-medium text-white/60">
                                        No legal requests
                                    </p>
                                    <p className="mt-1 text-xs text-white/30">
                                        Try changing the filters.
                                    </p>
                                </div>
                            )}

                            {requests.map((request) => {
                                const active =
                                    selectedRequest?._id === request._id
                                return (
                                    <button
                                        key={request._id}
                                        type="button"
                                        onClick={() => openRequest(request)}
                                        className={`block w-full border-b border-white/[0.06] p-4 text-left transition ${active
                                            ? 'bg-amber-400/[0.07]'
                                            : 'hover:bg-white/[0.025]'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-white">
                                                    {request.title}
                                                </p>
                                                <p className="mt-1 text-[11px] font-medium text-amber-400/80">
                                                    {request.requestNumber ||
                                                        request._id}
                                                </p>
                                            </div>
                                            <span
                                                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${priorityClasses(
                                                    request.priority
                                                )}`}
                                            >
                                                {request.priority}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full border px-2 py-1 text-[10px] font-medium ${statusClasses(
                                                    request.status
                                                )}`}
                                            >
                                                {formatStatus(request.status)}
                                            </span>
                                            <span className="text-[10px] text-white/35">
                                                {formatCategory(request.category)}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-[10px] text-white/30">
                                            <span>
                                                {formatDate(request.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="h-3 w-3" />
                                                {request.comments?.length || 0}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3">
                                <button
                                    type="button"
                                    disabled={
                                        pagination.page <= 1 || loading
                                    }
                                    onClick={() =>
                                        loadRequests(pagination.page - 1)
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Previous
                                </button>
                                <span className="text-xs text-white/35">
                                    Page {pagination.page} of{' '}
                                    {pagination.totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={
                                        pagination.page >=
                                        pagination.totalPages || loading
                                    }
                                    onClick={() =>
                                        loadRequests(pagination.page + 1)
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Detail */}
                    <section className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                        {!selectedRequest ? (
                            <div className="flex min-h-[650px] flex-col items-center justify-center px-6 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                                    <FileText className="h-7 w-7 text-white/20" />
                                </div>
                                <h3 className="mt-5 text-base font-semibold text-white/70">
                                    Select a legal request
                                </h3>
                                <p className="mt-2 max-w-md text-sm leading-6 text-white/35">
                                    Select a request from the queue to review
                                    its details, update status, communicate
                                    with the requester, and manage documents.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Detail header */}
                                <div className="border-b border-white/[0.07] p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedRequest(null)
                                                }
                                                className="mb-3 inline-flex items-center gap-1 text-xs text-white/35 transition hover:text-white/70 xl:hidden"
                                            >
                                                <ArrowLeft className="h-3.5 w-3.5" />
                                                Back
                                            </button>

                                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-400">
                                                {selectedRequest.requestNumber}
                                            </p>
                                            <h2 className="mt-1 text-xl font-semibold leading-tight">
                                                {selectedRequest.title}
                                            </h2>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClasses(
                                                        selectedRequest.status
                                                    )}`}
                                                >
                                                    {formatStatus(
                                                        selectedRequest.status
                                                    )}
                                                </span>
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${priorityClasses(
                                                        selectedRequest.priority
                                                    )}`}
                                                >
                                                    {selectedRequest.priority}
                                                </span>
                                                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/55">
                                                    {formatCategory(
                                                        selectedRequest.category
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            {mode === 'admin' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAssignOpen(true)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    {selectedRequest.assignedTo
                                                        ? 'Reassign Professional'
                                                        : 'Assign Professional'}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditMode((value) => !value)
                                                }
                                                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.06]"
                                            >
                                                {editMode
                                                    ? 'Cancel Edit'
                                                    : 'Edit Request'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={refresh}
                                                className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-black transition hover:bg-amber-300"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {detailLoading ? (
                                    <div className="flex min-h-[500px] items-center justify-center">
                                        <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
                                    </div>
                                ) : (
                                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_330px]">
                                        <div className="min-w-0 border-b border-white/[0.07] lg:border-b-0 lg:border-r">
                                            <div className="space-y-6 p-5">
                                                {editMode ? (
                                                    <EditRequestForm
                                                        mode={mode}
                                                        form={editForm}
                                                        setForm={setEditForm}
                                                        onSave={saveRequest}
                                                        saving={saving}
                                                    />
                                                ) : (
                                                    <>
                                                        <div>
                                                            <SectionHeading title="Request Details" />
                                                            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                                                                <p className="whitespace-pre-wrap text-sm leading-6 text-white/70">
                                                                    {
                                                                        selectedRequest.description
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {selectedRequest.additionalInformation && (
                                                            <div>
                                                                <SectionHeading title="Additional Information" />
                                                                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-white/60">
                                                                        {
                                                                            selectedRequest.additionalInformation
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <SectionHeading title="Request Status" />
                                                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                                                {STATUS_OPTIONS.map(
                                                                    (status) => (
                                                                        <button
                                                                            key={status}
                                                                            type="button"
                                                                            disabled={
                                                                                updatingStatus ||
                                                                                selectedRequest.status ===
                                                                                status
                                                                            }
                                                                            onClick={() =>
                                                                                updateStatus(
                                                                                    status
                                                                                )
                                                                            }
                                                                            className={`rounded-xl border px-3 py-3 text-left text-xs font-medium transition ${selectedRequest.status ===
                                                                                status
                                                                                ? 'border-amber-400/30 bg-amber-400/[0.08] text-amber-300'
                                                                                : 'border-white/[0.07] bg-white/[0.02] text-white/55 hover:bg-white/[0.05] hover:text-white'
                                                                                } disabled:cursor-not-allowed disabled:opacity-60`}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                {selectedRequest.status ===
                                                                                    status ? (
                                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                ) : (
                                                                                    <Clock3 className="h-3.5 w-3.5" />
                                                                                )}
                                                                                {formatStatus(
                                                                                    status
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <SectionHeading title="Communication" />

                                                            <div className="space-y-3">
                                                                {comments.length === 0 ? (
                                                                    <div className="rounded-xl border border-dashed border-white/10 bg-black/10 p-5 text-center">
                                                                        <MessageCircle className="mx-auto h-5 w-5 text-white/20" />
                                                                        <p className="mt-2 text-xs text-white/35">
                                                                            No comments yet.
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    comments.map(
                                                                        (comment) => (
                                                                            <CommentCard
                                                                                key={
                                                                                    comment._id
                                                                                }
                                                                                comment={
                                                                                    comment
                                                                                }
                                                                            />
                                                                        )
                                                                    )
                                                                )}
                                                            </div>

                                                            <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                                                                <textarea
                                                                    value={commentText}
                                                                    onChange={(event) =>
                                                                        setCommentText(
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    rows={4}
                                                                    placeholder="Write a message..."
                                                                    className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                                                                />

                                                                <div className="mt-3 flex flex-col gap-3 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
                                                                    <label className="flex items-center gap-2 text-xs text-white/40">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                isInternalComment
                                                                            }
                                                                            onChange={(event) =>
                                                                                setIsInternalComment(
                                                                                    event
                                                                                        .target
                                                                                        .checked
                                                                                )
                                                                            }
                                                                            className="h-3.5 w-3.5 rounded border-white/20 bg-black"
                                                                        />
                                                                        Internal note
                                                                    </label>

                                                                    <button
                                                                        type="button"
                                                                        onClick={submitComment}
                                                                        disabled={
                                                                            commentLoading ||
                                                                            !commentText.trim()
                                                                        }
                                                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        {commentLoading ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            <Send className="h-3.5 w-3.5" />
                                                                        )}
                                                                        Send Comment
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <SectionHeading title="Attachments" />

                                                            <div className="space-y-2">
                                                                {selectedRequest.attachments?.map(
                                                                    (attachment) => (
                                                                        <AttachmentCard
                                                                            key={
                                                                                attachment._id ||
                                                                                attachment.storageKey
                                                                            }
                                                                            attachment={
                                                                                attachment
                                                                            }
                                                                        />
                                                                    )
                                                                )}

                                                                {(!selectedRequest.attachments ||
                                                                    selectedRequest
                                                                        .attachments
                                                                        .length ===
                                                                    0) && (
                                                                        <p className="text-xs text-white/30">
                                                                            No attachments.
                                                                        </p>
                                                                    )}
                                                            </div>

                                                            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/10 p-4">
                                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                                    <input
                                                                        id="legal-request-file"
                                                                        type="file"
                                                                        onChange={(event) =>
                                                                            setSelectedFile(
                                                                                event
                                                                                    .target
                                                                                    .files?.[0] ||
                                                                                null
                                                                            )
                                                                        }
                                                                        className="block w-full text-xs text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-white/15"
                                                                    />

                                                                    <button
                                                                        type="button"
                                                                        onClick={
                                                                            uploadAttachment
                                                                        }
                                                                        disabled={
                                                                            uploading ||
                                                                            !selectedFile
                                                                        }
                                                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        {uploading ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            <Paperclip className="h-3.5 w-3.5" />
                                                                        )}
                                                                        Upload
                                                                    </button>
                                                                </div>
                                                                <p className="mt-2 text-[10px] text-white/25">
                                                                    Maximum file
                                                                    size supported by
                                                                    the API: 15 MB.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <aside className="space-y-5 p-5">
                                            <DetailCard title="Requester">
                                                <PersonBlock
                                                    person={
                                                        selectedRequest.createdBy
                                                    }
                                                />
                                            </DetailCard>

                                            <DetailCard title="Business">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                                                        <BuildingIcon />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-white/80">
                                                            {typeof selectedRequest.business ===
                                                                'object'
                                                                ? selectedRequest
                                                                    .business
                                                                    ?.companyName ||
                                                                selectedRequest
                                                                    .business
                                                                    ?.legalName ||
                                                                'Business'
                                                                : selectedRequest.business ||
                                                                'Business'}
                                                        </p>
                                                        {typeof selectedRequest.business ===
                                                            'object' &&
                                                            selectedRequest
                                                                .business
                                                                ?.legalName && (
                                                                <p className="mt-0.5 text-xs text-white/30">
                                                                    {
                                                                        selectedRequest
                                                                            .business
                                                                            .legalName
                                                                    }
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>
                                            </DetailCard>

                                            <DetailCard title="Assignment">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                                                        <UserRound className="h-4 w-4 text-blue-400" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-white/75">
                                                            {selectedRequest.assignedTo
                                                                ? getName(
                                                                    selectedRequest.assignedTo
                                                                )
                                                                : 'Unassigned'}
                                                        </p>
                                                        {typeof selectedRequest.assignedTo ===
                                                            'object' &&
                                                            selectedRequest
                                                                .assignedTo
                                                                ?.email && (
                                                                <p className="truncate text-xs text-white/30">
                                                                    {
                                                                        selectedRequest
                                                                            .assignedTo
                                                                            .email
                                                                    }
                                                                </p>
                                                            )}
                                                    </div>
                                                    {mode === 'admin' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setAssignOpen(true)
                                                            }
                                                            className="shrink-0 rounded-lg border border-amber-400/20 bg-amber-400/10 p-1.5 text-amber-300 transition hover:bg-amber-400/20"
                                                            title={
                                                                selectedRequest.assignedTo
                                                                    ? 'Reassign'
                                                                    : 'Assign'
                                                            }
                                                        >
                                                            <UserPlus className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </DetailCard>

                                            <DetailCard title="Request Metadata">
                                                <div className="space-y-4">
                                                    <MetaRow
                                                        icon={FileCheck2}
                                                        label="Professional"
                                                        value={formatCategory(
                                                            selectedRequest.preferredProfessionalType
                                                        )}
                                                    />
                                                    <MetaRow
                                                        icon={Calendar}
                                                        label="Deadline"
                                                        value={formatDate(
                                                            selectedRequest.deadline
                                                        )}
                                                    />
                                                    <MetaRow
                                                        icon={Clock3}
                                                        label="Created"
                                                        value={formatDateTime(
                                                            selectedRequest.createdAt
                                                        )}
                                                    />
                                                    <MetaRow
                                                        icon={RefreshCw}
                                                        label="Last activity"
                                                        value={formatDateTime(
                                                            selectedRequest.lastActivityAt
                                                        )}
                                                    />
                                                </div>
                                            </DetailCard>

                                            {selectedRequest.resolution && (
                                                <DetailCard title="Resolution">
                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-white/55">
                                                        {
                                                            selectedRequest.resolution
                                                        }
                                                    </p>
                                                </DetailCard>
                                            )}

                                            <DetailCard title="Activity Timeline">
                                                <div className="space-y-4">
                                                    {selectedRequest.activities &&
                                                        selectedRequest.activities
                                                            .length > 0 ? (
                                                        selectedRequest.activities
                                                            .slice()
                                                            .reverse()
                                                            .slice(0, 10)
                                                            .map((activity) => (
                                                                <div
                                                                    key={
                                                                        activity._id
                                                                    }
                                                                    className="relative pl-5"
                                                                >
                                                                    <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-amber-400" />
                                                                    <p className="text-xs font-medium text-white/70">
                                                                        {
                                                                            activity.action
                                                                        }
                                                                    </p>
                                                                    {activity.description && (
                                                                        <p className="mt-0.5 text-[11px] leading-5 text-white/35">
                                                                            {
                                                                                activity.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                    <p className="mt-1 text-[10px] text-white/20">
                                                                        {formatDateTime(
                                                                            activity.createdAt
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <p className="text-xs text-white/30">
                                                            No activity recorded.
                                                        </p>
                                                    )}
                                                </div>
                                            </DetailCard>
                                        </aside>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>

            {/* Assign Professional Modal */}
            <AssignProfessionalModal
                open={assignOpen}
                onClose={() => setAssignOpen(false)}
                type={assignType}
                onTypeChange={setAssignType}
                search={assignSearch}
                onSearchChange={setAssignSearch}
                professionals={professionals}
                loading={professionalsLoading}
                loadingMore={professionalsLoadingMore}
                error={professionalsError}
                assigningId={assigningId}
                onAssign={assignProfessional}
                onLoadMore={loadMoreProfessionals}
                hasMore={assignHasMore}
                total={assignTotal}
            />
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string
    value: number
    icon: typeof FileText
}) {
    return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
                <span className="text-xs text-white/35">{label}</span>
                <Icon className="h-4 w-4 text-amber-400/70" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
        </div>
    )
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-white/35">
                {label}
            </span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-400/40"
            >
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        className="bg-[#111111]"
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    )
}

function SectionHeading({ title }: { title: string }) {
    return (
        <div className="mb-3 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-amber-400" />
            <h3 className="text-sm font-semibold text-white/80">
                {title}
            </h3>
        </div>
    )
}

function DetailCard({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                {title}
            </p>
            {children}
        </div>
    )
}

function MetaRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Calendar
    label: string
    value: string
}) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
            <div className="min-w-0">
                <p className="text-[10px] text-white/25">{label}</p>
                <p className="mt-0.5 break-words text-xs text-white/60">
                    {value}
                </p>
            </div>
        </div>
    )
}

function PersonBlock({ person }: { person?: Person | string }) {
    const name = getName(person, 'Unknown requester')
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-xs font-semibold text-amber-300">
                {getInitials(name)}
            </div>
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white/75">
                    {name}
                </p>
                {typeof person === 'object' && person?.email && (
                    <p className="truncate text-xs text-white/30">
                        {person.email}
                    </p>
                )}
                {typeof person === 'object' && person?.role && (
                    <p className="mt-0.5 text-[10px] capitalize text-white/20">
                        {person.role}
                    </p>
                )}
            </div>
        </div>
    )
}

function CommentCard({ comment }: { comment: Comment }) {
    const author = getName(comment.author, 'Unknown user')
    return (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-semibold text-white/60">
                        {getInitials(author)}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white/75">
                            {author}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/25">
                            {comment.authorRole || 'User'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    {comment.isInternal && (
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1 text-[9px] font-semibold text-amber-300">
                            INTERNAL
                        </span>
                    )}
                    <p className="mt-1 text-[9px] text-white/20">
                        {formatDateTime(comment.createdAt)}
                    </p>
                </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">
                {comment.isDeleted
                    ? 'This comment has been deleted.'
                    : comment.message}
            </p>
            {comment.isEdited && (
                <p className="mt-2 text-[9px] text-white/20">Edited</p>
            )}
        </div>
    )
}

function AttachmentCard({
    attachment,
}: {
    attachment: Attachment
}) {
    const size =
        attachment.fileSize >= 1024 * 1024
            ? `${(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.max(
                1,
                Math.round(attachment.fileSize / 1024)
            )} KB`

    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                <Paperclip className="h-4 w-4 text-white/40" />
            </div>
            <div className="min-w-0 flex-1">
                <p
                    className="truncate text-xs font-medium text-white/70"
                    title={attachment.originalName}
                >
                    {attachment.originalName}
                </p>
                <p className="mt-0.5 text-[10px] text-white/25">
                    {size}
                    {attachment.uploadedAt
                        ? ` • ${formatDate(attachment.uploadedAt)}`
                        : ''}
                </p>
            </div>
        </div>
    )
}

function EditRequestForm({
    mode,
    form,
    setForm,
    onSave,
    saving,
}: {
    mode: PortalMode
    form: {
        title: string
        description: string
        additionalInformation: string
        priority: string
        deadline: string
        assignedTo: string
    }
    setForm: React.Dispatch<
        React.SetStateAction<{
            title: string
            description: string
            additionalInformation: string
            priority: string
            deadline: string
            assignedTo: string
        }>
    >
    onSave: () => void
    saving: boolean
}) {
    return (
        <div>
            <SectionHeading title="Edit Request" />
            <div className="space-y-4">
                <Field
                    label="Title"
                    value={form.title}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            title: value,
                        }))
                    }
                />
                <TextAreaField
                    label="Description"
                    value={form.description}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            description: value,
                        }))
                    }
                />
                <TextAreaField
                    label="Additional Information"
                    value={form.additionalInformation}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            additionalInformation: value,
                        }))
                    }
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                        label="Priority"
                        value={form.priority}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                priority: value,
                            }))
                        }
                        options={PRIORITY_OPTIONS.map((value) => ({
                            value,
                            label:
                                value.charAt(0).toUpperCase() +
                                value.slice(1),
                        }))}
                    />
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-medium text-white/35">
                            Deadline
                        </span>
                        <input
                            type="date"
                            value={form.deadline}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    deadline: event.target.value,
                                }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
                        />
                    </label>
                </div>
                {mode === 'admin' && (
                    <Field
                        label="Assigned User ID"
                        value={form.assignedTo}
                        placeholder="Paste AuthUser ObjectId"
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                assignedTo: value,
                            }))
                        }
                    />
                )}
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Save Changes
                </button>
            </div>
        </div>
    )
}

function Field({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-white/35">
                {label}
            </span>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-amber-400/40"
            />
        </label>
    )
}

function TextAreaField({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-white/35">
                {label}
            </span>
            <textarea
                value={value}
                rows={5}
                onChange={(event) => onChange(event.target.value)}
                className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-amber-400/40"
            />
        </label>
    )
}

function BuildingIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-amber-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
        >
            <path d="M3 21h18" />
            <path d="M5 21V5l7-2v18" />
            <path d="M12 21V8l7-2v15" />
            <path d="M8 8h1" />
            <path d="M8 11h1" />
            <path d="M8 14h1" />
            <path d="M15 10h1" />
            <path d="M15 13h1" />
            <path d="M15 16h1" />
        </svg>
    )
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

/* -------------------------------------------------------------------------- */
/* Assign Professional Modal                                                  */
/* -------------------------------------------------------------------------- */

function AssignProfessionalModal({
    open,
    onClose,
    type,
    onTypeChange,
    search,
    onSearchChange,
    professionals,
    loading,
    loadingMore,
    error,
    assigningId,
    onAssign,
    onLoadMore,
    hasMore,
    total,
}: {
    open: boolean
    onClose: () => void
    type: 'all' | ProfessionalType
    onTypeChange: (t: 'all' | ProfessionalType) => void
    search: string
    onSearchChange: (s: string) => void
    professionals: Professional[]
    loading: boolean
    loadingMore: boolean
    error: string
    assigningId: string | null
    onAssign: (p: Professional) => void
    onLoadMore: () => void
    hasMore: boolean
    total: number
}) {
    const sentinelRef = useRef<HTMLDivElement | null>(null)

    // Infinite scroll — fire onLoadMore when sentinel enters view
    useEffect(() => {
        if (!open) return
        const node = sentinelRef.current
        if (!node) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    onLoadMore()
                }
            },
            { rootMargin: '120px' }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [open, onLoadMore])

    if (!open) return null

    const tabs: {
        label: string
        value: 'all' | ProfessionalType
        icon: any
    }[] = [
            { label: 'Lawyers', value: 'lawyer', icon: Briefcase },
            { label: 'All', value: 'all', icon: UsersIcon },
        ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b0b] shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-white/[0.07] px-5 py-4">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-400">
                            <UserPlus className="h-3.5 w-3.5" />
                            Assign Professional
                        </div>
                        <h3 className="mt-1 text-lg font-semibold">
                            Choose from database
                        </h3>
                        <p className="mt-0.5 text-xs text-white/40">
                            {total > 0
                                ? `${total} available · scroll to load more`
                                : 'Search, filter, and click a person to assign.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs + search */}
                <div className="border-b border-white/[0.07] px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((t) => {
                            const Icon = t.icon
                            const active = type === t.value
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => onTypeChange(t.value)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${active
                                        ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                                        : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white'
                                        }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {t.label}
                                </button>
                            )
                        })}
                    </div>

                    <div className="relative mt-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search by name, email, city…"
                            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-9 text-sm text-white placeholder-white/25 outline-none transition focus:border-amber-400/40 focus:bg-white/[0.05]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex min-h-[240px] items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                        </div>
                    ) : error ? (
                        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                            <p className="mt-3 text-sm text-red-300">
                                {error}
                            </p>
                            <p className="mt-1 max-w-sm text-xs text-white/35">
                                Check that{' '}
                                <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-amber-400">
                                    GET /lawyer/all
                                </code>{' '}
                                returns a list.
                            </p>
                        </div>
                    ) : professionals.length === 0 ? (
                        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                            <UserCheck className="h-8 w-8 text-white/10" />
                            <p className="mt-3 text-sm font-medium text-white/60">
                                No professionals found
                            </p>
                            <p className="mt-1 text-xs text-white/30">
                                Try a different filter or search term.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-white/[0.05]">
                                {professionals.map((p) => {
                                    const assigning = assigningId === p.id
                                    const initials = getInitials(p.fullName)
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            disabled={!!assigningId}
                                            onClick={() => onAssign(p)}
                                            className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-400/15">
                                                {p.profilePhoto ? (
                                                    <img
                                                        src={p.profilePhoto}
                                                        alt={p.fullName}
                                                        className="h-10 w-10 object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-amber-300">
                                                        {initials}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-medium text-white">
                                                        {p.fullName}
                                                    </p>
                                                    <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                                                        {p.type}
                                                    </span>
                                                </div>

                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/35">
                                                    {p.email && (
                                                        <span className="truncate">
                                                            {p.email}
                                                        </span>
                                                    )}
                                                    {p.city && <span>{p.city}</span>}
                                                    {p.experience ? (
                                                        <span>
                                                            {p.experience} yrs
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {p.specialization?.length ? (
                                                    <p className="mt-0.5 truncate text-[11px] text-amber-400/70">
                                                        {p.specialization
                                                            .slice(0, 3)
                                                            .join(' · ')}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="shrink-0">
                                                {assigning ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1.5 text-[10px] font-semibold text-amber-300">
                                                        Assign
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Infinite scroll sentinel */}
                            <div
                                ref={sentinelRef}
                                className="h-12 w-full"
                                aria-hidden
                            />

                            {loadingMore && (
                                <div className="flex items-center justify-center gap-2 py-4 text-xs text-white/40">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                                    Loading more…
                                </div>
                            )}

                            {!hasMore && professionals.length > 0 && (
                                <div className="py-4 text-center text-[10px] text-white/25">
                                    End of list
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.07] px-5 py-3 text-[10px] text-white/30">
                    Showing {professionals.length}
                    {total > 0 ? ` of ${total}` : ''} professional
                    {professionals.length === 1 ? '' : 's'}
                </div>
            </div>
        </div>
    )
}