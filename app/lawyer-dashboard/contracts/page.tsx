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
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Download,
    Eye,
    FileCheck2,
    FileText,
    Gavel,
    History,
    Mail,
    MessageSquare,
    RefreshCw,
    Search,
    Send,
    Upload,
    Users,
    X,
} from 'lucide-react'

/**
 * Lawyer Contracts
 *
 * Backend base:
 * http://localhost:5000/api/v1
 *
 * Live APIs used:
 * GET    /lawyer/contracts
 * GET    /lawyer/contracts/:contractId
 * POST   /lawyer/contracts/:contractId/comments
 * GET    /lawyer/contracts/:contractId/comments
 * GET    /lawyer/contracts/:contractId/activity
 * GET    /lawyer/contracts/:contractId/documents
 * POST   /lawyer/contracts/:contractId/documents       (multipart upload)
 * GET    /lawyer/documents/:documentId/download
 */

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'

type ContractStatus =
    | 'Draft'
    | 'Internal Review'
    | 'Client Review'
    | 'Revision Requested'
    | 'Approved'
    | 'Pending Signature'
    | 'Executed'
    | 'Active'
    | 'Expired'
    | 'Terminated'
    | 'Archived'

type ContractPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

interface ContractActivity {
    id: string
    action: string
    description?: string
    by: string
    timestamp: string
    role?: string
}

interface ContractComment {
    id: string
    message: string
    authorName: string
    authorRole?: string
    createdAt: string
    isInternal?: boolean
    isEdited?: boolean
}

interface ContractDocument {
    id: string
    name: string
    type: string
    size: string
    category?: string
    key?: string
    status?: string
    uploadedBy?: string
    source?: 'client' | 'lawyer' | 'system' | string
}

interface Contract {
    id: string
    contractNumber?: string
    title: string
    contractType: string
    clientName: string
    clientIndustry: string
    clientId: string
    status: ContractStatus
    priority: ContractPriority
    assignedDate: string
    dueDate: string
    lastUpdated: string
    description: string
    parties: string[]
    assignedLawyer: {
        name: string
        email: string
    }
    documents: ContractDocument[]
    activities: ContractActivity[]
    comments: ContractComment[]
    raw?: any
}

const STATUS_OPTIONS: ContractStatus[] = [
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
]

const PRIORITY_OPTIONS: ContractPriority[] = [
    'Low',
    'Medium',
    'High',
    'Urgent',
]

function getToken() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
}

async function apiRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()

    if (!token) {
        throw new Error('NO_TOKEN')
    }

    const isFormData =
        typeof FormData !== 'undefined' &&
        options.body instanceof FormData

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body && !isFormData
                ? { 'Content-Type': 'application/json' }
                : {}),
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
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
            message =
                body?.message ||
                body?.error ||
                body?.errors?.[0]?.message ||
                message
        } catch {
            // Ignore non-JSON error bodies.
        }

        throw new Error(message)
    }

    if (response.status === 204) {
        return {} as T
    }

    return response.json()
}

function extractArray<T>(response: any): T[] {
    if (!response) return []
    if (Array.isArray(response)) return response
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.items)) return response.items
    if (Array.isArray(response?.contracts)) return response.contracts
    if (Array.isArray(response?.comments)) return response.comments
    if (Array.isArray(response?.activity)) return response.activity
    if (Array.isArray(response?.activities)) return response.activities
    if (Array.isArray(response?.documents)) return response.documents
    if (Array.isArray(response?.data?.comments))
        return response.data.comments
    if (Array.isArray(response?.data?.activity))
        return response.data.activity
    if (Array.isArray(response?.data?.activities))
        return response.data.activities
    if (Array.isArray(response?.data?.documents))
        return response.data.documents
    return []
}

function extractObject(response: any) {
    return (
        response?.data ||
        response?.contract ||
        response?.client ||
        response
    )
}

function getId(value: any) {
    return String(
        value?._id ||
        value?.id ||
        value?.contractId ||
        value?.documentId ||
        ''
    )
}

function getBusinessId(contract: any) {
    return String(
        contract?.business?._id ||
        contract?.business?.id ||
        contract?.business ||
        ''
    )
}

function getBusinessName(contract: any) {
    return (
        contract?.business?.companyName ||
        contract?.business?.legalName ||
        contract?.client?.companyName ||
        contract?.client?.legalName ||
        contract?.companyName ||
        'Client'
    )
}

function getBusinessIndustry(contract: any) {
    return (
        contract?.business?.industry ||
        contract?.client?.industry ||
        '—'
    )
}

function normalizeStatus(value: any): ContractStatus {
    const valueString = String(value || 'Draft')

    const exact = STATUS_OPTIONS.find(
        (status) =>
            status.toLowerCase() === valueString.toLowerCase()
    )

    if (exact) return exact

    const slug = valueString
        .toLowerCase()
        .replace(/[_\s]+/g, '-')

    const aliases: Record<string, ContractStatus> = {
        'in-review': 'Internal Review',
        'internal-review': 'Internal Review',
        'client-review': 'Client Review',
        'revision-requested': 'Revision Requested',
        'awaiting-signature': 'Pending Signature',
        'pending-signature': 'Pending Signature',
        'changes-requested': 'Revision Requested',
        approved: 'Approved',
        executed: 'Executed',
        active: 'Active',
        expired: 'Expired',
        terminated: 'Terminated',
        archived: 'Archived',
        draft: 'Draft',
    }

    return aliases[slug] || 'Draft'
}

function normalizePriority(value: any): ContractPriority {
    const valueString = String(value || 'Medium').toLowerCase()

    if (valueString === 'urgent') return 'Urgent'
    if (valueString === 'high') return 'High'
    if (valueString === 'low') return 'Low'

    return 'Medium'
}

function formatDate(value?: string, includeTime = false) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    if (includeTime) {
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatRelativeOrDate(value?: string) {
    if (!value) return '—'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const now = Date.now()
    const diff = now - date.getTime()

    if (diff >= 0 && diff < 60 * 60 * 1000) {
        const minutes = Math.max(1, Math.floor(diff / 60000))
        return `${minutes} min ago`
    }

    if (diff >= 0 && diff < 24 * 60 * 60 * 1000) {
        const hours = Math.max(1, Math.floor(diff / 3600000))
        return `${hours}h ago`
    }

    return formatDate(value)
}

function formatFileSize(size: any) {
    const numericSize = Number(size)

    if (!Number.isFinite(numericSize) || numericSize <= 0) {
        return '—'
    }

    if (numericSize < 1024) {
        return `${numericSize} B`
    }

    if (numericSize < 1024 * 1024) {
        return `${(numericSize / 1024).toFixed(1)} KB`
    }

    return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`
}

function mapContractSummary(item: any): Contract {
    const assignedProfessional =
        item?.assignedProfessional || item?.assignedLawyer

    return {
        id: getId(item),
        contractNumber: item?.contractNumber,
        title: item?.title || 'Untitled Contract',
        contractType: item?.contractType || 'Custom Contract',
        clientName: getBusinessName(item),
        clientIndustry: getBusinessIndustry(item),
        clientId: getBusinessId(item),
        status: normalizeStatus(item?.status),
        priority: normalizePriority(item?.priority),
        assignedDate:
            item?.createdAt ||
            item?.assignedAt ||
            item?.effectiveDate ||
            '',
        dueDate:
            item?.expiryDate ||
            item?.renewalDate ||
            item?.effectiveDate ||
            '',
        lastUpdated: item?.updatedAt || '',
        description: item?.description || '',
        parties: [
            getBusinessName(item),
            item?.counterparty?.name ||
            item?.counterparty?.companyName ||
            (typeof item?.counterparty === 'string'
                ? item.counterparty
                : null),
        ].filter(Boolean),
        assignedLawyer: {
            name:
                assignedProfessional?.fullName ||
                assignedProfessional?.name ||
                'Assigned Lawyer',
            email: assignedProfessional?.email || '',
        },
        documents: [],
        activities: [],
        comments: [],
        raw: item,
    }
}

/**
 * Merge API detail with a fallback (previous state) — but IMPORTANTLY,
 * do NOT wipe activities/comments/documents that were separately fetched.
 * Only fill them from the detail response if the detail response actually
 * contains them.
 */
function mapContractDetail(
    item: any,
    fallback?: Contract
): Contract {
    const base = mapContractSummary({
        ...(fallback?.raw || {}),
        ...(item || {}),
    })

    const assignedProfessional =
        item?.assignedProfessional ||
        item?.assignedLawyer ||
        fallback?.raw?.assignedProfessional

    const supportingDocuments = Array.isArray(
        item?.supportingDocuments
    )
        ? item.supportingDocuments
        : []

    const directDocuments = [
        ...supportingDocuments,
        item?.currentDocument,
        item?.signedDocument,
    ].filter(Boolean)

    const uniqueDocuments = new Map<string, ContractDocument>()

    directDocuments.forEach((doc: any) => {
        const id = getId(doc)

        if (!id && !doc?.key) return

        const uniqueKey = id || doc?.key

        uniqueDocuments.set(uniqueKey, {
            id: id || doc?.key || '',
            name:
                doc?.name ||
                doc?.originalName ||
                'Contract Document',
            type:
                doc?.mimeType ||
                doc?.type ||
                'Document',
            size: formatFileSize(doc?.size),
            category: doc?.category,
            key: doc?.key,
            status: doc?.status,
            uploadedBy:
                doc?.uploadedBy?.fullName ||
                doc?.uploadedBy?.name ||
                doc?.uploadedBy?.email,
            source: doc?.source || doc?.uploadedByRole,
        })
    })

    const detailDocuments = Array.from(uniqueDocuments.values())

    // Only use detail-provided documents if we didn't already have a
    // separately-fetched document list from the documents endpoint.
    const documents =
        detailDocuments.length > 0
            ? detailDocuments
            : fallback?.documents || []

    const activitiesFromDetail = Array.isArray(item?.activity)
        ? item.activity
        : Array.isArray(item?.activities)
            ? item.activities
            : null

    const commentsFromDetail = Array.isArray(item?.comments)
        ? item.comments
        : null

    return {
        ...base,
        assignedDate:
            item?.createdAt ||
            item?.assignedAt ||
            fallback?.assignedDate ||
            '',
        dueDate:
            item?.expiryDate ||
            item?.renewalDate ||
            item?.effectiveDate ||
            fallback?.dueDate ||
            '',
        lastUpdated:
            item?.updatedAt || fallback?.lastUpdated || '',
        assignedLawyer: {
            name:
                assignedProfessional?.fullName ||
                assignedProfessional?.name ||
                fallback?.assignedLawyer.name ||
                'Assigned Lawyer',
            email:
                assignedProfessional?.email ||
                fallback?.assignedLawyer.email ||
                '',
        },
        parties: [
            getBusinessName(item),
            item?.counterparty?.name ||
            item?.counterparty?.companyName ||
            (typeof item?.counterparty === 'string'
                ? item.counterparty
                : null),
        ].filter(Boolean),
        documents,
        activities: activitiesFromDetail
            ? activitiesFromDetail.map(mapActivity)
            : fallback?.activities || [],
        comments: commentsFromDetail
            ? commentsFromDetail.map(mapComment)
            : fallback?.comments || [],
        raw: item,
    }
}

function mapActivity(item: any): ContractActivity {
    const performedBy =
        item?.performedBy || item?.author || item?.user

    return {
        id: getId(item),
        action:
            item?.description ||
            item?.action ||
            'Contract activity',
        description: item?.description,
        by:
            performedBy?.fullName ||
            performedBy?.name ||
            performedBy?.email ||
            'User',
        timestamp: item?.createdAt || item?.timestamp || '',
        role: Array.isArray(performedBy?.role)
            ? performedBy.role.join(', ')
            : performedBy?.role,
    }
}

function mapComment(item: any): ContractComment {
    const author =
        item?.author || item?.createdBy || item?.user

    return {
        id: getId(item),
        message: item?.message || '',
        authorName:
            author?.fullName ||
            author?.name ||
            author?.email ||
            'User',
        authorRole:
            item?.authorRole ||
            (Array.isArray(author?.role)
                ? author.role.join(', ')
                : author?.role),
        createdAt: item?.createdAt || item?.updatedAt || '',
        isInternal: Boolean(item?.isInternal),
        isEdited: Boolean(item?.isEdited),
    }
}

function mapDocument(item: any): ContractDocument {
    return {
        id: getId(item),
        name:
            item?.name ||
            item?.originalName ||
            'Contract Document',
        type: item?.mimeType || item?.type || 'Document',
        size: formatFileSize(item?.size),
        category: item?.category,
        key: item?.key,
        status: item?.status,
        uploadedBy:
            item?.uploadedBy?.fullName ||
            item?.uploadedBy?.name ||
            item?.uploadedBy?.email,
        source: item?.source || item?.uploadedByRole,
    }
}

function StatusBadge({ status }: { status: ContractStatus }) {
    const styles: Record<ContractStatus, string> = {
        Draft: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
        'Internal Review':
            'border-blue-500/20 bg-blue-500/10 text-blue-400',
        'Client Review':
            'border-purple-500/20 bg-purple-500/10 text-purple-400',
        'Revision Requested':
            'border-red-500/20 bg-red-500/10 text-red-400',
        Approved:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        'Pending Signature':
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        Executed:
            'border-violet-500/20 bg-violet-500/10 text-violet-400',
        Active:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Expired:
            'border-orange-500/20 bg-orange-500/10 text-orange-400',
        Terminated:
            'border-red-500/20 bg-red-500/10 text-red-400',
        Archived:
            'border-zinc-500/20 bg-zinc-500/10 text-zinc-500',
    }

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status]}`}
        >
            {status}
        </span>
    )
}

function PriorityBadge({
    priority,
}: {
    priority: ContractPriority
}) {
    const styles: Record<ContractPriority, string> = {
        Low: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/15',
        Medium:
            'text-amber-400 bg-amber-500/10 border-amber-500/15',
        High: 'text-red-400 bg-red-500/10 border-red-500/15',
        Urgent:
            'text-red-300 bg-red-600/10 border-red-500/20',
    }

    return (
        <span
            className={`rounded-md border px-2 py-1 text-[10px] font-medium ${styles[priority]}`}
        >
            {priority}
        </span>
    )
}

function ContractIcon() {
    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-400/[0.06]">
            <FileCheck2 className="h-5 w-5 text-blue-400" />
        </div>
    )
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number
    description: string
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
        >
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.035]">
                <Icon className="h-4 w-4 text-blue-400" />
            </div>

            <p className="text-2xl font-semibold text-white">
                {value}
            </p>

            <p className="mt-1 text-sm font-medium text-zinc-300">
                {label}
            </p>

            <p className="mt-1 text-[11px] text-zinc-600">
                {description}
            </p>
        </motion.div>
    )
}

function LoadingState() {
    return (
        <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="h-8 w-40 animate-pulse rounded bg-white/[0.05]" />
                <div className="mt-5 space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-20 animate-pulse rounded-xl bg-white/[0.04]"
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-5">
                <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
                <div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />
            </div>
        </div>
    )
}

type DetailTab = 'overview' | 'activity' | 'comments' | 'documents'

export default function LawyerContractPage() {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [selectedContract, setSelectedContract] =
        useState<Contract | null>(null)

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<
        'All' | ContractStatus
    >('All')
    const [priorityFilter, setPriorityFilter] = useState<
        'All' | ContractPriority
    >('All')

    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [mobileDetail, setMobileDetail] = useState(false)
    const [activeTab, setActiveTab] = useState<DetailTab>('overview')

    const [newComment, setNewComment] = useState('')
    const [sendingComment, setSendingComment] = useState(false)
    const [commentsLoading, setCommentsLoading] = useState(false)

    const [activityLoading, setActivityLoading] = useState(false)

    const [documentsLoading, setDocumentsLoading] = useState(false)
    const [uploadingDocument, setUploadingDocument] = useState(false)
    const [downloadingDocumentId, setDownloadingDocumentId] =
        useState('')
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    // ----------------------- FETCH LIST -----------------------
    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await apiRequest<any>(
                '/lawyer/contracts?page=1&limit=100'
            )

            const mapped = extractArray<any>(response).map(
                mapContractSummary
            )

            setContracts(mapped)

            setSelectedContract((current) => {
                if (!current) return mapped[0] || null
                return (
                    mapped.find((item) => item.id === current.id) ||
                    current
                )
            })
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to load contracts'
            setError(message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    // ----------------------- FETCH DETAIL -----------------------
    // Preserves previously-loaded activity/comments/documents so the
    // separate tab fetches aren't clobbered.
    const fetchContractDetail = useCallback(
        async (contractId: string) => {
            if (!contractId) return
            try {
                setDetailLoading(true)

                const response = await apiRequest<any>(
                    `/lawyer/contracts/${encodeURIComponent(
                        contractId
                    )}`
                )
                const detail = extractObject(response)

                setSelectedContract((current) => {
                    if (current?.id !== contractId) {
                        // Different contract selected in the meantime
                        return mapContractDetail(detail, current || undefined)
                    }
                    return mapContractDetail(detail, current)
                })
            } catch (err) {
                console.error('Contract detail error:', err)
            } finally {
                setDetailLoading(false)
            }
        },
        []
    )

    // ----------------------- FETCH ACTIVITY -----------------------
    const fetchContractActivity = useCallback(
        async (contractId: string) => {
            if (!contractId) return
            try {
                setActivityLoading(true)

                const response = await apiRequest<any>(
                    `/lawyer/contracts/${encodeURIComponent(
                        contractId
                    )}/activity`
                )

                const activity = extractArray<any>(response).map(
                    mapActivity
                )

                setSelectedContract((current) =>
                    current && current.id === contractId
                        ? { ...current, activities: activity }
                        : current
                )
            } catch (err) {
                console.error('Contract activity error:', err)
            } finally {
                setActivityLoading(false)
            }
        },
        []
    )

    // ----------------------- FETCH COMMENTS -----------------------
    const fetchContractComments = useCallback(
        async (contractId: string) => {
            if (!contractId) return
            try {
                setCommentsLoading(true)

                const response = await apiRequest<any>(
                    `/lawyer/contracts/${encodeURIComponent(
                        contractId
                    )}/comments`
                )

                const comments = extractArray<any>(response).map(
                    mapComment
                )

                setSelectedContract((current) =>
                    current && current.id === contractId
                        ? { ...current, comments }
                        : current
                )
            } catch (err) {
                console.error('Contract comments error:', err)
            } finally {
                setCommentsLoading(false)
            }
        },
        []
    )

    // ----------------------- FETCH DOCUMENTS -----------------------
    const fetchContractDocuments = useCallback(
        async (contractId: string) => {
            if (!contractId) return
            try {
                setDocumentsLoading(true)

                const response = await apiRequest<any>(
                    `/lawyer/contracts/${encodeURIComponent(
                        contractId
                    )}/documents`
                )

                const documents = extractArray<any>(response).map(
                    mapDocument
                )

                setSelectedContract((current) =>
                    current && current.id === contractId
                        ? { ...current, documents }
                        : current
                )
            } catch (err) {
                console.error('Contract documents error:', err)
            } finally {
                setDocumentsLoading(false)
            }
        },
        []
    )

    useEffect(() => {
        fetchContracts()
    }, [fetchContracts])

    // Fetch detail once when selected contract id changes, then
    // lazily fetch tab data only when that tab is opened.
    useEffect(() => {
        if (!selectedContract?.id) return
        fetchContractDetail(selectedContract.id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContract?.id])

    // Load tab-specific data on demand
    useEffect(() => {
        const id = selectedContract?.id
        if (!id) return

        if (activeTab === 'activity') {
            fetchContractActivity(id)
        } else if (activeTab === 'comments') {
            fetchContractComments(id)
        } else if (activeTab === 'documents') {
            fetchContractDocuments(id)
        }
    }, [
        activeTab,
        selectedContract?.id,
        fetchContractActivity,
        fetchContractComments,
        fetchContractDocuments,
    ])

    const filteredContracts = useMemo(() => {
        const term = search.trim().toLowerCase()

        return contracts.filter((contract) => {
            const matchesSearch =
                !term ||
                contract.title.toLowerCase().includes(term) ||
                contract.clientName.toLowerCase().includes(term) ||
                contract.contractType.toLowerCase().includes(term) ||
                contract.contractNumber
                    ?.toLowerCase()
                    .includes(term)

            const matchesStatus =
                statusFilter === 'All' ||
                contract.status === statusFilter

            const matchesPriority =
                priorityFilter === 'All' ||
                contract.priority === priorityFilter

            return (
                matchesSearch && matchesStatus && matchesPriority
            )
        })
    }, [contracts, search, statusFilter, priorityFilter])

    const summary = useMemo(
        () => ({
            total: contracts.length,
            inReview: contracts.filter(
                (contract) =>
                    contract.status === 'Internal Review' ||
                    contract.status === 'Client Review' ||
                    contract.status === 'Revision Requested'
            ).length,
            pendingSignature: contracts.filter(
                (contract) =>
                    contract.status === 'Pending Signature'
            ).length,
            executed: contracts.filter(
                (contract) =>
                    contract.status === 'Executed' ||
                    contract.status === 'Active'
            ).length,
        }),
        [contracts]
    )

    const selectContract = (contract: Contract) => {
        setSelectedContract(contract)
        setMobileDetail(true)
        setActiveTab('overview')
    }

    // ----------------------- ADD COMMENT -----------------------
    const addComment = async () => {
        const message = newComment.trim()

        if (!message || !selectedContract?.id) return

        try {
            setSendingComment(true)

            await apiRequest<any>(
                `/lawyer/contracts/${encodeURIComponent(
                    selectedContract.id
                )}/comments`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        message,
                        isInternal: false,
                    }),
                }
            )

            setNewComment('')

            await Promise.all([
                fetchContractComments(selectedContract.id),
                fetchContractActivity(selectedContract.id),
            ])
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to add comment'
            setError(message)
        } finally {
            setSendingComment(false)
        }
    }

    // ----------------------- UPLOAD DOCUMENT -----------------------
    const uploadDocument = async (file: File) => {
        if (!file || !selectedContract?.id) return

        try {
            setUploadingDocument(true)

            const form = new FormData()
            form.append('document', file)
            // Some backends expect `file` — send both keys to be safe.
            form.append('file', file)

            await apiRequest<any>(
                `/lawyer/contracts/${encodeURIComponent(
                    selectedContract.id
                )}/documents`,
                {
                    method: 'POST',
                    body: form,
                }
            )

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            await Promise.all([
                fetchContractDocuments(selectedContract.id),
                fetchContractActivity(selectedContract.id),
            ])
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to upload document'
            setError(message)
        } finally {
            setUploadingDocument(false)
        }
    }

    // ----------------------- DOWNLOAD DOCUMENT -----------------------
    const downloadDocument = async (
        document: ContractDocument
    ) => {
        if (!document.id) return

        try {
            setDownloadingDocumentId(document.id)

            const response = await apiRequest<any>(
                `/lawyer/documents/${encodeURIComponent(
                    document.id
                )}/download`
            )

            const result = extractObject(response)

            const url =
                result?.url ||
                result?.downloadUrl ||
                result?.signedUrl

            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer')
                return
            }

            if (document.key) {
                console.warn(
                    'Download API returned no URL for document',
                    document.id
                )
            }
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to download document'
            setError(message)
        } finally {
            setDownloadingDocumentId('')
        }
    }

    if (error === 'NO_TOKEN') {
        return (
            <div className="min-h-screen bg-[#06080b] px-6 py-12 text-white">
                <div className="mx-auto mt-24 max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-center">
                    <Gavel className="mx-auto h-10 w-10 text-amber-400" />
                    <h2 className="mt-4 text-lg font-semibold">
                        Authentication Required
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        Please sign in again to access your contracts.
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            (window.location.href = '/signin')
                        }
                        className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[28%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
                <div className="absolute right-0 top-[35%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.02] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-white/[0.06] pb-6"
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                                <span>Lawyer Dashboard</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-zinc-300">
                                    Contracts
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <Gavel className="h-7 w-7 text-blue-400" />
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Contracts
                                </h1>
                            </div>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Review and manage contracts assigned to you
                                across your client portfolio.
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={loading || refreshing}
                            onClick={async () => {
                                setRefreshing(true)
                                await fetchContracts()
                            }}
                            className="flex items-center gap-2 self-start rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.05] disabled:opacity-50 lg:self-auto"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </motion.div>

                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <SummaryCard
                        icon={FileText}
                        label="Assigned Contracts"
                        value={summary.total}
                        description="Contracts in your workspace"
                    />
                    <SummaryCard
                        icon={Eye}
                        label="Needs Review"
                        value={summary.inReview}
                        description="Contracts requiring your action"
                    />
                    <SummaryCard
                        icon={Clock3}
                        label="Awaiting Signature"
                        value={summary.pendingSignature}
                        description="Waiting for final execution"
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        label="Executed"
                        value={summary.executed}
                        description="Executed or active contracts"
                    />
                </section>

                {loading ? (
                    <section className="mt-6">
                        <LoadingState />
                    </section>
                ) : (
                    <section className="mt-6 grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
                        {/* LEFT LIST */}
                        <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                            <div className="border-b border-white/[0.06] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">
                                            My Contracts
                                        </h2>
                                        <p className="mt-1 text-[11px] text-zinc-600">
                                            {filteredContracts.length}{' '}
                                            contract
                                            {filteredContracts.length !== 1
                                                ? 's'
                                                : ''}
                                        </p>
                                    </div>
                                    <FileCheck2 className="h-4 w-4 text-zinc-600" />
                                </div>

                                <div className="relative mt-4">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                    <input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Search contracts or clients..."
                                        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                    />
                                </div>

                                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                                    {(
                                        [
                                            'All',
                                            'Internal Review',
                                            'Client Review',
                                            'Revision Requested',
                                            'Pending Signature',
                                            'Approved',
                                            'Executed',
                                            'Active',
                                        ] as const
                                    ).map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() =>
                                                setStatusFilter(status)
                                            }
                                            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] transition ${statusFilter === status
                                                ? 'border border-blue-400/20 bg-blue-400/10 text-blue-400'
                                                : 'border border-white/[0.05] bg-white/[0.02] text-zinc-600 hover:text-zinc-300'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                                    {(
                                        [
                                            'All',
                                            ...PRIORITY_OPTIONS,
                                        ] as const
                                    ).map((priority) => (
                                        <button
                                            key={priority}
                                            type="button"
                                            onClick={() =>
                                                setPriorityFilter(
                                                    priority
                                                )
                                            }
                                            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] transition ${priorityFilter ===
                                                priority
                                                ? 'border border-blue-400/20 bg-blue-400/10 text-blue-400'
                                                : 'border border-white/[0.05] bg-white/[0.02] text-zinc-600 hover:text-zinc-300'
                                                }`}
                                        >
                                            {priority}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="max-h-[720px] overflow-y-auto p-2">
                                {filteredContracts.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <FileText className="mx-auto h-8 w-8 text-zinc-700" />
                                        <p className="mt-3 text-sm text-zinc-400">
                                            No contracts found
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-700">
                                            Try changing your search or
                                            filters.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredContracts.map(
                                            (contract, index) => {
                                                const selected =
                                                    selectedContract?.id ===
                                                    contract.id

                                                return (
                                                    <motion.button
                                                        key={contract.id}
                                                        type="button"
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
                                                                0.035,
                                                        }}
                                                        onClick={() =>
                                                            selectContract(
                                                                contract
                                                            )
                                                        }
                                                        className={`w-full rounded-xl p-3 text-left transition ${selected
                                                            ? 'border border-blue-400/15 bg-blue-400/[0.07]'
                                                            : 'border border-transparent hover:border-white/[0.05] hover:bg-white/[0.025]'
                                                            }`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <ContractIcon />

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="truncate text-sm font-medium text-white">
                                                                        {
                                                                            contract.title
                                                                        }
                                                                    </p>

                                                                    {selected && (
                                                                        <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
                                                                    )}
                                                                </div>

                                                                <p className="mt-1 truncate text-[11px] text-zinc-500">
                                                                    {
                                                                        contract.clientName
                                                                    }
                                                                </p>

                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                    <StatusBadge
                                                                        status={
                                                                            contract.status
                                                                        }
                                                                    />
                                                                    <PriorityBadge
                                                                        priority={
                                                                            contract.priority
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-600">
                                                                    <CalendarDays className="h-3 w-3" />
                                                                    <span>
                                                                        Due{' '}
                                                                        {formatDate(
                                                                            contract.dueDate
                                                                        )}
                                                                    </span>
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

                        {/* RIGHT DETAIL (desktop) */}
                        <div className="hidden min-w-0 lg:block">
                            <ContractDetails
                                contract={selectedContract}
                                loading={detailLoading}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                activityLoading={activityLoading}
                                commentsLoading={commentsLoading}
                                documentsLoading={documentsLoading}
                                uploadingDocument={uploadingDocument}
                                newComment={newComment}
                                setNewComment={setNewComment}
                                sendingComment={sendingComment}
                                onSendComment={addComment}
                                onUploadDocument={uploadDocument}
                                fileInputRef={fileInputRef}
                                onDownloadDocument={downloadDocument}
                                downloadingDocumentId={
                                    downloadingDocumentId
                                }
                                onRefreshComments={() => {
                                    if (selectedContract?.id) {
                                        fetchContractComments(
                                            selectedContract.id
                                        )
                                    }
                                }}
                                onRefreshActivity={() => {
                                    if (selectedContract?.id) {
                                        fetchContractActivity(
                                            selectedContract.id
                                        )
                                    }
                                }}
                                onRefreshDocuments={() => {
                                    if (selectedContract?.id) {
                                        fetchContractDocuments(
                                            selectedContract.id
                                        )
                                    }
                                }}
                            />
                        </div>
                    </section>
                )}

                {error && error !== 'NO_TOKEN' && (
                    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}
            </main>

            {/* MOBILE DETAIL */}
            <AnimatePresence>
                {mobileDetail && selectedContract && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed inset-0 z-50 overflow-y-auto bg-[#06080b] lg:hidden"
                    >
                        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/[0.06] bg-[#06080b]/95 px-4 py-3 backdrop-blur-xl">
                            <button
                                type="button"
                                onClick={() =>
                                    setMobileDetail(false)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]"
                            >
                                <ArrowLeft className="h-4 w-4 text-zinc-400" />
                            </button>

                            <span className="text-sm font-medium text-white">
                                Contract Details
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setMobileDetail(false)
                                }
                                className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]"
                            >
                                <X className="h-4 w-4 text-zinc-400" />
                            </button>
                        </div>

                        <div className="p-4">
                            <ContractDetails
                                contract={selectedContract}
                                loading={detailLoading}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                activityLoading={activityLoading}
                                commentsLoading={commentsLoading}
                                documentsLoading={documentsLoading}
                                uploadingDocument={uploadingDocument}
                                newComment={newComment}
                                setNewComment={setNewComment}
                                sendingComment={sendingComment}
                                onSendComment={addComment}
                                onUploadDocument={uploadDocument}
                                fileInputRef={fileInputRef}
                                onDownloadDocument={downloadDocument}
                                downloadingDocumentId={
                                    downloadingDocumentId
                                }
                                onRefreshComments={() => {
                                    if (selectedContract.id) {
                                        fetchContractComments(
                                            selectedContract.id
                                        )
                                    }
                                }}
                                onRefreshActivity={() => {
                                    if (selectedContract.id) {
                                        fetchContractActivity(
                                            selectedContract.id
                                        )
                                    }
                                }}
                                onRefreshDocuments={() => {
                                    if (selectedContract.id) {
                                        fetchContractDocuments(
                                            selectedContract.id
                                        )
                                    }
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ----------------------------- DETAILS -----------------------------

function ContractDetails({
    contract,
    loading,
    activeTab,
    onTabChange,
    activityLoading,
    commentsLoading,
    documentsLoading,
    uploadingDocument,
    newComment,
    setNewComment,
    sendingComment,
    onSendComment,
    onUploadDocument,
    fileInputRef,
    onDownloadDocument,
    downloadingDocumentId,
    onRefreshComments,
    onRefreshActivity,
    onRefreshDocuments,
}: {
    contract: Contract | null
    loading: boolean
    activeTab: DetailTab
    onTabChange: (tab: DetailTab) => void
    activityLoading: boolean
    commentsLoading: boolean
    documentsLoading: boolean
    uploadingDocument: boolean
    newComment: string
    setNewComment: (value: string) => void
    sendingComment: boolean
    onSendComment: () => void
    onUploadDocument: (file: File) => void
    fileInputRef: React.MutableRefObject<HTMLInputElement | null>
    onDownloadDocument: (document: ContractDocument) => void
    downloadingDocumentId: string
    onRefreshComments: () => void
    onRefreshActivity: () => void
    onRefreshDocuments: () => void
}) {
    if (!contract) {
        return (
            <div className="flex min-h-[650px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <div className="text-center">
                    <FileText className="mx-auto h-10 w-10 text-zinc-700" />
                    <p className="mt-4 text-sm text-zinc-400">
                        Select a contract
                    </p>
                    <p className="mt-1 text-xs text-zinc-700">
                        Select a contract from the list to view its
                        details.
                    </p>
                </div>
            </div>
        )
    }

    const tabs: { id: DetailTab; label: string; count?: number }[] = [
        { id: 'overview', label: 'Overview' },
        {
            id: 'activity',
            label: 'Activity',
            count: contract.activities.length,
        },
        {
            id: 'comments',
            label: 'Comments',
            count: contract.comments.length,
        },
        {
            id: 'documents',
            label: 'Documents',
            count: contract.documents.length,
        },
    ]

    return (
        <motion.div
            key={contract.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            {/* Header */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <ContractIcon />

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight text-white">
                                    {contract.title}
                                </h2>
                                <StatusBadge status={contract.status} />
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                                {contract.contractType}
                            </p>

                            {contract.contractNumber && (
                                <p className="mt-1 text-[11px] text-zinc-700">
                                    {contract.contractNumber}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-zinc-600" />
                                    {contract.clientName}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-zinc-600" />
                                    Due {formatDate(contract.dueDate)}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="h-3.5 w-3.5 text-zinc-600" />
                                    Updated{' '}
                                    {formatRelativeOrDate(
                                        contract.lastUpdated
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <PriorityBadge priority={contract.priority} />
                    </div>
                </div>

                {loading && (
                    <div className="mt-5 h-2 w-full animate-pulse rounded-full bg-white/[0.05]" />
                )}

                <div className="mt-6 border-t border-white/[0.06] pt-5">
                    <p className="text-xs leading-6 text-zinc-500">
                        {contract.description ||
                            'No description has been provided for this contract.'}
                    </p>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                        <Gavel className="h-4 w-4 text-blue-400" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                            Assigned Lawyer
                        </p>
                        <p className="text-xs font-medium text-white">
                            {contract.assignedLawyer.name}
                        </p>
                    </div>

                    <div className="ml-auto hidden items-center gap-2 text-[11px] text-zinc-600 sm:flex">
                        <Mail className="h-3.5 w-3.5" />
                        {contract.assignedLawyer.email}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${isActive
                                ? 'bg-blue-400/10 text-blue-400'
                                : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
                                }`}
                        >
                            {tab.label}
                            {typeof tab.count === 'number' && (
                                <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${isActive
                                        ? 'bg-blue-400/15 text-blue-300'
                                        : 'bg-white/[0.05] text-zinc-500'
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
                <div className="grid gap-5 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                                <Users className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">
                                    Parties
                                </h3>
                                <p className="text-xs text-zinc-600">
                                    Parties involved in this contract
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {contract.parties.length ? (
                                contract.parties.map((party, index) => (
                                    <div
                                        key={`${party}-${index}`}
                                        className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.035]">
                                            <Users className="h-3.5 w-3.5 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-white">
                                                {party}
                                            </p>
                                            <p className="mt-1 text-[10px] text-zinc-600">
                                                {index === 0
                                                    ? 'Client'
                                                    : 'Counterparty'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-600">
                                    No party information available.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                                <FileText className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">
                                    Snapshot
                                </h3>
                                <p className="text-xs text-zinc-600">
                                    Quick contract metadata
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                            <MetaCell
                                label="Status"
                                value={contract.status}
                            />
                            <MetaCell
                                label="Priority"
                                value={contract.priority}
                            />
                            <MetaCell
                                label="Type"
                                value={contract.contractType || '—'}
                            />
                            <MetaCell
                                label="Contract #"
                                value={
                                    contract.contractNumber || '—'
                                }
                            />
                            <MetaCell
                                label="Assigned"
                                value={formatDate(
                                    contract.assignedDate
                                )}
                            />
                            <MetaCell
                                label="Due"
                                value={formatDate(contract.dueDate)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                                <History className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">
                                    Contract Timeline
                                </h3>
                                <p className="text-xs text-zinc-600">
                                    Live audit activity
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onRefreshActivity}
                            disabled={activityLoading}
                            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-zinc-400 hover:bg-white/[0.05] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${activityLoading
                                    ? 'animate-spin'
                                    : ''
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>

                    <div className="mt-5 space-y-4">
                        {activityLoading &&
                            contract.activities.length === 0 ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map(
                                    (_, index) => (
                                        <div
                                            key={index}
                                            className="h-14 animate-pulse rounded-xl bg-white/[0.03]"
                                        />
                                    )
                                )}
                            </div>
                        ) : contract.activities.length ? (
                            contract.activities.map(
                                (activity, index) => (
                                    <div
                                        key={
                                            activity.id ||
                                            `${activity.action}-${index}`
                                        }
                                        className="relative flex gap-3"
                                    >
                                        {index <
                                            contract.activities
                                                .length -
                                            1 && (
                                                <div className="absolute left-[7px] top-5 h-full w-px bg-white/[0.06]" />
                                            )}

                                        <div className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-400/10">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-white">
                                                {activity.action}
                                            </p>
                                            <p className="mt-1 text-[10px] text-zinc-600">
                                                {activity.by}
                                                {' • '}
                                                {formatDate(
                                                    activity.timestamp,
                                                    true
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )
                        ) : (
                            <div className="py-8 text-center text-xs text-zinc-600">
                                No activity recorded yet.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'comments' && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                                <MessageSquare className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">
                                    Comments
                                </h3>
                                <p className="text-xs text-zinc-600">
                                    Discussion thread on this contract
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onRefreshComments}
                            disabled={commentsLoading}
                            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-zinc-400 hover:bg-white/[0.05] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${commentsLoading
                                    ? 'animate-spin'
                                    : ''
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>

                    <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
                        {commentsLoading &&
                            contract.comments.length === 0 ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map(
                                    (_, index) => (
                                        <div
                                            key={index}
                                            className="h-20 animate-pulse rounded-xl bg-white/[0.03]"
                                        />
                                    )
                                )}
                            </div>
                        ) : contract.comments.length ? (
                            contract.comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-medium text-white">
                                                {comment.authorName}
                                            </p>
                                            <p className="mt-1 text-[10px] text-zinc-700">
                                                {comment.authorRole ||
                                                    'User'}
                                                {' • '}
                                                {formatDate(
                                                    comment.createdAt,
                                                    true
                                                )}
                                            </p>
                                        </div>
                                        {comment.isInternal && (
                                            <span className="rounded-md border border-amber-500/15 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400">
                                                Internal
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-zinc-400">
                                        {comment.message}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <MessageSquare className="mx-auto h-8 w-8 text-zinc-700" />
                                <p className="mt-3 text-sm text-zinc-400">
                                    No comments yet
                                </p>
                                <p className="mt-1 text-xs text-zinc-700">
                                    Start the discussion below.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-white/[0.06] p-4">
                        <div className="flex gap-2">
                            <textarea
                                value={newComment}
                                onChange={(e) =>
                                    setNewComment(e.target.value)
                                }
                                rows={3}
                                placeholder="Write a comment..."
                                className="min-h-[86px] flex-1 resize-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                            />

                            <button
                                type="button"
                                disabled={
                                    sendingComment ||
                                    !newComment.trim()
                                }
                                onClick={onSendComment}
                                className="self-end rounded-xl bg-blue-600 px-4 py-3 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
                            >
                                {sendingComment ? (
                                    'Sending...'
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <Send className="h-3.5 w-3.5" />
                                        Send
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'documents' && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Contract Documents
                            </h3>
                            <p className="mt-1 text-xs text-zinc-600">
                                Files shared between client and lawyer
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onRefreshDocuments}
                                disabled={documentsLoading}
                                className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-zinc-400 hover:bg-white/[0.05] disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${documentsLoading
                                        ? 'animate-spin'
                                        : ''
                                        }`}
                                />
                                Refresh
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={uploadingDocument}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                                {uploadingDocument ? (
                                    <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-3.5 w-3.5" />
                                        Upload
                                    </>
                                )}
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    const file =
                                        e.target.files?.[0]
                                    if (file) {
                                        onUploadDocument(file)
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-white/[0.05]">
                        {documentsLoading &&
                            contract.documents.length === 0 ? (
                            <div className="space-y-2 p-4">
                                {Array.from({ length: 3 }).map(
                                    (_, index) => (
                                        <div
                                            key={index}
                                            className="h-16 animate-pulse rounded-xl bg-white/[0.03]"
                                        />
                                    )
                                )}
                            </div>
                        ) : contract.documents.length ? (
                            contract.documents.map((document) => (
                                <div
                                    key={document.id || document.key}
                                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.015]"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
                                        <FileText className="h-4 w-4 text-zinc-400" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-white">
                                            {document.name}
                                        </p>
                                        <p className="mt-1 text-[10px] text-zinc-600">
                                            {document.type} • {document.size}
                                            {document.category
                                                ? ` • ${document.category}`
                                                : ''}
                                            {document.source
                                                ? ` • ${document.source}`
                                                : ''}
                                        </p>
                                        {document.uploadedBy && (
                                            <p className="mt-0.5 text-[10px] text-zinc-700">
                                                Uploaded by{' '}
                                                {document.uploadedBy}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        disabled={
                                            !document.id ||
                                            downloadingDocumentId ===
                                            document.id
                                        }
                                        onClick={() =>
                                            onDownloadDocument(document)
                                        }
                                        className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
                                    >
                                        {downloadingDocumentId ===
                                            document.id ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <FileText className="mx-auto h-8 w-8 text-zinc-700" />
                                <p className="mt-3 text-xs text-zinc-600">
                                    No documents attached to this
                                    contract.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

function MetaCell({
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