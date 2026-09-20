'use client'

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Download,
    Eye,
    File,
    FileArchive,
    FileCheck2,
    FileImage,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    History,
    Mail,
    MoreHorizontal,
    RefreshCw,
    Search,
    ShieldCheck,
    Upload,
    UserRound,
    X,
} from 'lucide-react'

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'

type DocumentStatus =
    | 'Available'
    | 'Needs Review'
    | 'Reviewed'
    | 'Restricted'

type DocumentCategory =
    | 'Contract'
    | 'Corporate'
    | 'Compliance'
    | 'Financial'
    | 'Identity'
    | 'Agreement'
    | 'Incorporation'
    | 'Tax'
    | 'Other'

interface DocumentActivity {
    id: string
    action: string
    by: string
    timestamp: string
    role?: string
}

interface ClientDocument {
    id: string
    name: string
    category: DocumentCategory
    fileType: string
    fileSize: string
    clientName: string
    clientId: string
    uploadedBy: string
    uploadedDate: string
    updatedDate: string
    status: DocumentStatus
    description: string
    version: string
    confidential: boolean
    visibility: string
    reviewStatus?: 'pending' | 'reviewed'
    reviewNotes?: string
    activities: DocumentActivity[]
    raw?: any
}

function getToken() {
    if (typeof window === 'undefined') {
        return null
    }

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

    const response = await fetch(
        `${API_BASE}${path}`,
        {
            ...options,
            headers: {
                ...(options.body
                    ? {
                        'Content-Type':
                            'application/json',
                    }
                    : {}),
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        }
    )

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
    if (Array.isArray(response?.data)) {
        return response.data
    }

    if (Array.isArray(response?.items)) {
        return response.items
    }

    if (Array.isArray(response?.documents)) {
        return response.documents
    }

    if (Array.isArray(response?.activity)) {
        return response.activity
    }

    return []
}

function extractObject(response: any) {
    return (
        response?.data ||
        response?.document ||
        response?.item ||
        response
    )
}

function getId(value: any) {
    return String(
        value?._id ||
        value?.id ||
        value?.documentId ||
        ''
    )
}

function getBusinessId(value: any) {
    return String(
        value?.business?._id ||
        value?.business?.id ||
        value?.business ||
        ''
    )
}

function getBusinessName(value: any) {
    return (
        value?.business?.companyName ||
        value?.business?.legalName ||
        value?.client?.companyName ||
        value?.client?.legalName ||
        value?.companyName ||
        (typeof value?.client === 'string'
            ? value.client
            : '') ||
        'Client'
    )
}

function normalizeCategory(
    category: any
): DocumentCategory {
    const value = String(
        category || 'other'
    ).toLowerCase()

    const map: Record<
        string,
        DocumentCategory
    > = {
        contract: 'Contract',
        agreement: 'Agreement',
        corporate: 'Corporate',
        compliance: 'Compliance',
        financial: 'Financial',
        identity: 'Identity',
        incorporation: 'Incorporation',
        tax: 'Tax',
        other: 'Other',
    }

    return map[value] || 'Other'
}

function deriveStatus(
    document: any
): DocumentStatus {
    const visibility = String(
        document?.visibility || ''
    ).toLowerCase()

    if (visibility === 'private') {
        return 'Restricted'
    }

    const reviewStatus =
        String(
            document?.reviewStatus || 'pending'
        ).toLowerCase()

    if (reviewStatus === 'reviewed') {
        return 'Reviewed'
    }

    if (
        document?.status === 'uploaded' &&
        reviewStatus === 'pending'
    ) {
        return 'Needs Review'
    }

    if (document?.status === 'pending') {
        return 'Needs Review'
    }

    if (document?.status === 'failed') {
        return 'Restricted'
    }

    return 'Available'
}

function formatFileSize(size: any) {
    const numericSize = Number(size)

    if (
        !Number.isFinite(numericSize) ||
        numericSize <= 0
    ) {
        return '—'
    }

    if (numericSize < 1024) {
        return `${numericSize} B`
    }

    if (numericSize < 1024 * 1024) {
        return `${(
            numericSize / 1024
        ).toFixed(1)} KB`
    }

    return `${(
        numericSize /
        (1024 * 1024)
    ).toFixed(1)} MB`
}

function formatDate(
    value?: string,
    includeTime = false
) {
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

function getFileType(
    document: any
) {
    const mimeType = String(
        document?.mimeType || ''
    ).toLowerCase()

    const originalName = String(
        document?.originalName ||
        document?.name ||
        ''
    )

    const extension =
        originalName
            .split('.')
            .pop()
            ?.toUpperCase() || ''

    if (mimeType.includes('pdf')) return 'PDF'
    if (
        mimeType.includes(
            'spreadsheet'
        ) ||
        extension === 'XLSX' ||
        extension === 'XLS'
    ) {
        return 'XLSX'
    }

    if (
        mimeType.includes('word') ||
        extension === 'DOCX' ||
        extension === 'DOC'
    ) {
        return 'DOCX'
    }

    if (
        mimeType.includes('zip') ||
        extension === 'ZIP'
    ) {
        return 'ZIP'
    }

    if (
        mimeType.startsWith('image/')
    ) {
        return extension || 'IMAGE'
    }

    return extension || 'FILE'
}

function mapDocument(
    item: any
): ClientDocument {
    const uploader =
        item?.uploadedBy || item?.createdBy

    return {
        id: getId(item),
        name:
            item?.name ||
            item?.originalName ||
            'Untitled document',
        category: normalizeCategory(
            item?.category
        ),
        fileType: getFileType(item),
        fileSize: formatFileSize(
            item?.size
        ),
        clientName: getBusinessName(item),
        clientId: getBusinessId(item),
        uploadedBy:
            uploader?.fullName ||
            uploader?.name ||
            uploader?.email ||
            'User',
        uploadedDate:
            item?.uploadedAt ||
            item?.createdAt ||
            '',
        updatedDate:
            item?.updatedAt ||
            item?.uploadedAt ||
            item?.createdAt ||
            '',
        status: deriveStatus(item),
        description:
            item?.description ||
            item?.reviewNotes ||
            '',
        version:
            item?.version ||
            'v1',
        confidential:
            item?.visibility === 'private' ||
            Boolean(item?.confidential),
        visibility:
            item?.visibility ||
            'business',
        reviewStatus:
            item?.reviewStatus,
        reviewNotes:
            item?.reviewNotes || '',
        activities: [],
        raw: item,
    }
}

function mapActivity(
    item: any
): DocumentActivity {
    const performer =
        item?.performedBy ||
        item?.author ||
        item?.user

    return {
        id: getId(item),
        action:
            item?.description ||
            item?.action ||
            'Document activity',
        by:
            performer?.fullName ||
            performer?.name ||
            performer?.email ||
            'User',
        timestamp:
            item?.createdAt ||
            item?.timestamp ||
            '',
        role: Array.isArray(
            performer?.role
        )
            ? performer.role.join(', ')
            : performer?.role,
    }
}

function DocumentIcon({
    type,
}: {
    type: string
}) {
    if (type === 'XLSX') {
        return (
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
        )
    }

    if (type === 'DOCX') {
        return (
            <FileText className="h-5 w-5 text-blue-400" />
        )
    }

    if (type === 'ZIP') {
        return (
            <FileArchive className="h-5 w-5 text-amber-400" />
        )
    }

    if (
        type === 'JPG' ||
        type === 'JPEG' ||
        type === 'PNG' ||
        type === 'WEBP' ||
        type === 'IMAGE'
    ) {
        return (
            <FileImage className="h-5 w-5 text-violet-400" />
        )
    }

    return (
        <FileText className="h-5 w-5 text-blue-400" />
    )
}

function StatusBadge({
    status,
}: {
    status: DocumentStatus
}) {
    const styles: Record<
        DocumentStatus,
        string
    > = {
        Available:
            'border-blue-500/20 bg-blue-500/10 text-blue-400',
        'Needs Review':
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        Reviewed:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Restricted:
            'border-red-500/20 bg-red-500/10 text-red-400',
    }

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status]}`}
        >
            {status}
        </span>
    )
}

function CategoryBadge({
    category,
}: {
    category: DocumentCategory
}) {
    return (
        <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[10px] text-zinc-500">
            {category}
        </span>
    )
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: React.ComponentType<{
        className?: string
    }>
    label: string
    value: number
    description: string
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
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
        <div className="grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="h-8 w-44 animate-pulse rounded bg-white/[0.05]" />

                <div className="mt-5 space-y-2">
                    {Array.from({
                        length: 6,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="h-20 animate-pulse rounded-xl bg-white/[0.04]"
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-5">
                <div className="h-72 animate-pulse rounded-2xl bg-white/[0.04]" />
                <div className="h-56 animate-pulse rounded-2xl bg-white/[0.04]" />
            </div>
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
        <div className="min-h-screen bg-[#06080b] px-6 py-12 text-white">
            <div className="mx-auto mt-24 max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-red-400" />

                <h2 className="mt-4 text-lg font-semibold">
                    Unable to load documents
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                    Try Again
                </button>
            </div>
        </div>
    )
}

export default function LawyerDocumentsPage() {
    const [documents, setDocuments] =
        useState<ClientDocument[]>([])

    const [
        selectedDocumentId,
        setSelectedDocumentId,
    ] = useState('')

    const [
        selectedDocument,
        setSelectedDocument,
    ] =
        useState<ClientDocument | null>(
            null
        )

    const [search, setSearch] = useState('')

    const [categoryFilter, setCategoryFilter] =
        useState<
            'All' | DocumentCategory
        >('All')

    const [statusFilter, setStatusFilter] =
        useState<
            'All' | DocumentStatus
        >('All')

    const [
        mobileDetailOpen,
        setMobileDetailOpen,
    ] = useState(false)

    const [loading, setLoading] =
        useState(true)

    const [
        detailLoading,
        setDetailLoading,
    ] = useState(false)

    const [refreshing, setRefreshing] =
        useState(false)

    const [actionLoading, setActionLoading] =
        useState(false)

    const [
        downloadingDocumentId,
        setDownloadingDocumentId,
    ] = useState('')

    const [error, setError] =
        useState<string | null>(null)

    const fetchDocuments =
        useCallback(async () => {
            try {
                setLoading(true)
                setError(null)

                const response =
                    await apiRequest<any>(
                        '/lawyer/documents?page=1&limit=100'
                    )

                const mapped =
                    extractArray<any>(
                        response
                    ).map(mapDocument)

                setDocuments(mapped)

                setSelectedDocumentId(
                    (current) =>
                        current ||
                        mapped[0]?.id ||
                        ''
                )
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load documents'

                setError(message)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }, [])

    const fetchDocumentDetail =
        useCallback(
            async (documentId: string) => {
                if (!documentId) return

                try {
                    setDetailLoading(true)

                    const response =
                        await apiRequest<any>(
                            `/lawyer/documents/${encodeURIComponent(
                                documentId
                            )}`
                        )

                    const detail =
                        extractObject(response)

                    const mapped =
                        mapDocument(detail)

                    setSelectedDocument(
                        (current) => ({
                            ...(current ||
                                {}),
                            ...mapped,
                            activities:
                                current?.activities ||
                                [],
                        })
                    )

                    setDocuments((current) =>
                        current.map((document) =>
                            document.id ===
                                documentId
                                ? {
                                    ...document,
                                    ...mapped,
                                }
                                : document
                        )
                    )
                } catch (err) {
                    console.error(
                        'Document detail error:',
                        err
                    )
                } finally {
                    setDetailLoading(false)
                }
            },
            []
        )

    const fetchDocumentActivity =
        useCallback(
            async (documentId: string) => {
                try {
                    const response =
                        await apiRequest<any>(
                            `/lawyer/documents/${encodeURIComponent(
                                documentId
                            )}/activity`
                        )

                    const activity =
                        extractArray<any>(
                            response
                        ).map(mapActivity)

                    setSelectedDocument(
                        (current) =>
                            current
                                ? {
                                    ...current,
                                    activities:
                                        activity,
                                }
                                : current
                    )
                } catch (err) {
                    console.error(
                        'Document activity error:',
                        err
                    )
                }
            },
            []
        )

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    useEffect(() => {
        if (!selectedDocumentId) {
            setSelectedDocument(null)
            return
        }

        const listDocument =
            documents.find(
                (document) =>
                    document.id ===
                    selectedDocumentId
            ) || null

        setSelectedDocument(
            listDocument
        )

        fetchDocumentDetail(
            selectedDocumentId
        )

        fetchDocumentActivity(
            selectedDocumentId
        )
    }, [
        selectedDocumentId,
        documents,
        fetchDocumentDetail,
        fetchDocumentActivity,
    ])

    const filteredDocuments = useMemo(() => {
        const term =
            search.trim().toLowerCase()

        return documents.filter(
            (document) => {
                const matchesSearch =
                    !term ||
                    document.name
                        .toLowerCase()
                        .includes(term) ||
                    document.clientName
                        .toLowerCase()
                        .includes(term) ||
                    document.category
                        .toLowerCase()
                        .includes(term) ||
                    document.fileType
                        .toLowerCase()
                        .includes(term)

                const matchesCategory =
                    categoryFilter ===
                    'All' ||
                    document.category ===
                    categoryFilter

                const matchesStatus =
                    statusFilter ===
                    'All' ||
                    document.status ===
                    statusFilter

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesStatus
                )
            }
        )
    }, [
        documents,
        search,
        categoryFilter,
        statusFilter,
    ])

    const summary = useMemo(
        () => ({
            total: documents.length,

            needsReview:
                documents.filter(
                    (document) =>
                        document.status ===
                        'Needs Review'
                ).length,

            reviewed:
                documents.filter(
                    (document) =>
                        document.status ===
                        'Reviewed'
                ).length,

            clients: new Set(
                documents
                    .map(
                        (document) =>
                            document.clientId
                    )
                    .filter(Boolean)
            ).size,
        }),
        [documents]
    )

    const selectDocument = (
        document: ClientDocument
    ) => {
        setSelectedDocumentId(
            document.id
        )
        setMobileDetailOpen(true)
    }

    const handleDownload =
        async (
            documentId: string,
            preview = false
        ) => {
            if (!documentId) return

            try {
                setDownloadingDocumentId(
                    documentId
                )
                setError(null)

                const response =
                    await apiRequest<any>(
                        `/lawyer/documents/${encodeURIComponent(
                            documentId
                        )}/download`
                    )

                const result =
                    extractObject(response)

                const url =
                    result?.url ||
                    result?.downloadUrl ||
                    result?.signedUrl

                if (!url) {
                    throw new Error(
                        'Download URL was not returned by the server'
                    )
                }

                window.open(
                    url,
                    '_blank',
                    'noopener,noreferrer'
                )
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to download document'

                setError(message)
            } finally {
                setDownloadingDocumentId(
                    ''
                )
            }
        }

    const handleReview = async () => {
        if (!selectedDocument?.id) {
            return
        }

        if (
            selectedDocument.status ===
            'Reviewed'
        ) {
            return
        }

        try {
            setActionLoading(true)
            setError(null)

            const response =
                await apiRequest<any>(
                    `/lawyer/documents/${encodeURIComponent(
                        selectedDocument.id
                    )}/review`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify({
                            reviewStatus:
                                'reviewed',
                            reviewNotes:
                                selectedDocument
                                    .reviewNotes ||
                                '',
                        }),
                    }
                )

            const result =
                extractObject(response)

            const mapped =
                mapDocument(result)

            setSelectedDocument(
                (current) =>
                    current
                        ? {
                            ...current,
                            ...mapped,
                        }
                        : current
            )

            setDocuments((current) =>
                current.map(
                    (document) =>
                        document.id ===
                            selectedDocument.id
                            ? {
                                ...document,
                                ...mapped,
                                status:
                                    'Reviewed',
                            }
                            : document
                )
            )

            await fetchDocumentActivity(
                selectedDocument.id
            )
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to mark document reviewed'

            setError(message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleShare = async () => {
        if (!selectedDocument?.id) {
            return
        }

        try {
            setActionLoading(true)
            setError(null)

            const response =
                await apiRequest<any>(
                    `/lawyer/documents/${encodeURIComponent(
                        selectedDocument.id
                    )}/share`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            visibility:
                                'business',
                        }),
                    }
                )

            const result =
                extractObject(response)

            const mapped =
                mapDocument(result)

            setSelectedDocument(
                (current) =>
                    current
                        ? {
                            ...current,
                            ...mapped,
                        }
                        : current
            )

            setDocuments((current) =>
                current.map(
                    (document) =>
                        document.id ===
                            selectedDocument.id
                            ? {
                                ...document,
                                ...mapped,
                            }
                            : document
                )
            )

            await fetchDocumentActivity(
                selectedDocument.id
            )
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to share document'

            setError(message)
        } finally {
            setActionLoading(false)
        }
    }

    const viewClient = () => {
        if (!selectedDocument?.clientId) {
            return
        }

        window.location.href =
            `/lawyer/clients?clientId=${encodeURIComponent(
                selectedDocument.clientId
            )}`
    }

    if (error === 'NO_TOKEN') {
        return (
            <div className="min-h-screen bg-[#06080b] px-6 py-12 text-white">
                <div className="mx-auto mt-24 max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-center">
                    <ShieldCheck className="mx-auto h-10 w-10 text-amber-400" />

                    <h2 className="mt-4 text-lg font-semibold">
                        Authentication Required
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                        Please sign in again to access your documents.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                        (window.location.href =
                            '/signin')
                        }
                        className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        )
    }

    if (
        error &&
        !loading &&
        documents.length === 0
    ) {
        return (
            <ErrorState
                message={error}
                onRetry={fetchDocuments}
            />
        )
    }

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[26%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
                <div className="absolute right-0 top-[35%] h-[380px] w-[380px] rounded-full bg-violet-500/[0.02] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                <motion.div
                    initial={{
                        opacity: 0,
                        y: -8,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="border-b border-white/[0.06] pb-6"
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                                <span>
                                    Lawyer Dashboard
                                </span>

                                <ChevronRight className="h-3 w-3" />

                                <span className="text-zinc-300">
                                    Documents
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <FolderOpen className="h-7 w-7 text-blue-400" />

                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Documents
                                </h1>
                            </div>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Access documents shared with you by your assigned clients and manage legal review work securely.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={async () => {
                                setRefreshing(
                                    true
                                )
                                await fetchDocuments()
                            }}
                            disabled={
                                loading ||
                                refreshing
                            }
                            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-50 lg:self-auto"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing
                                    ? 'animate-spin'
                                    : ''
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </motion.div>

                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <SummaryCard
                        icon={FileText}
                        label="Documents"
                        value={
                            summary.total
                        }
                        description="Available in your workspace"
                    />

                    <SummaryCard
                        icon={Eye}
                        label="Needs Review"
                        value={
                            summary.needsReview
                        }
                        description="Documents requiring legal review"
                    />

                    <SummaryCard
                        icon={ShieldCheck}
                        label="Reviewed"
                        value={
                            summary.reviewed
                        }
                        description="Previously reviewed documents"
                    />

                    <SummaryCard
                        icon={Building2}
                        label="Client Businesses"
                        value={
                            summary.clients
                        }
                        description="Clients with shared documents"
                    />
                </section>

                {loading ? (
                    <section className="mt-6">
                        <LoadingState />
                    </section>
                ) : (
                    <section className="mt-6 grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)]">
                        <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                            <div className="border-b border-white/[0.06] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">
                                            Shared Documents
                                        </h2>

                                        <p className="mt-1 text-[11px] text-zinc-600">
                                            {
                                                filteredDocuments.length
                                            }{' '}
                                            document
                                            {filteredDocuments.length !==
                                                1
                                                ? 's'
                                                : ''}
                                        </p>
                                    </div>

                                    <FolderOpen className="h-4 w-4 text-zinc-600" />
                                </div>

                                <div className="relative mt-4">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                                    <input
                                        value={
                                            search
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSearch(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Search documents or clients..."
                                        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                    />
                                </div>

                                <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                                    {[
                                        'All',
                                        'Contract',
                                        'Corporate',
                                        'Compliance',
                                        'Financial',
                                        'Identity',
                                        'Agreement',
                                        'Incorporation',
                                        'Tax',
                                    ].map(
                                        (category) => (
                                            <button
                                                key={
                                                    category
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setCategoryFilter(
                                                        category as
                                                        | 'All'
                                                        | DocumentCategory
                                                    )
                                                }
                                                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] transition ${categoryFilter ===
                                                    category
                                                    ? 'border border-blue-400/20 bg-blue-400/10 text-blue-400'
                                                    : 'border border-white/[0.05] bg-white/[0.02] text-zinc-600 hover:text-zinc-300'
                                                    }`}
                                            >
                                                {category}
                                            </button>
                                        )
                                    )}
                                </div>

                                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                                    {[
                                        'All',
                                        'Needs Review',
                                        'Reviewed',
                                        'Available',
                                        'Restricted',
                                    ].map(
                                        (status) => (
                                            <button
                                                key={
                                                    status
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setStatusFilter(
                                                        status as
                                                        | 'All'
                                                        | DocumentStatus
                                                    )
                                                }
                                                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] transition ${statusFilter ===
                                                    status
                                                    ? 'border border-white/[0.1] bg-white/[0.07] text-white'
                                                    : 'border border-transparent text-zinc-600 hover:text-zinc-300'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="max-h-[740px] overflow-y-auto p-2">
                                {filteredDocuments.length ===
                                    0 ? (
                                    <div className="py-16 text-center">
                                        <FolderOpen className="mx-auto h-8 w-8 text-zinc-700" />

                                        <p className="mt-3 text-sm text-zinc-400">
                                            No documents found
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-700">
                                            Try changing your search or filters.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredDocuments.map(
                                            (
                                                document,
                                                index
                                            ) => {
                                                const selected =
                                                    selectedDocumentId ===
                                                    document.id

                                                return (
                                                    <motion.button
                                                        key={
                                                            document.id
                                                        }
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
                                                            selectDocument(
                                                                document
                                                            )
                                                        }
                                                        className={`w-full rounded-xl p-3 text-left transition ${selected
                                                            ? 'border border-blue-400/15 bg-blue-400/[0.07]'
                                                            : 'border border-transparent hover:border-white/[0.05] hover:bg-white/[0.025]'
                                                            }`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]">
                                                                <DocumentIcon
                                                                    type={
                                                                        document.fileType
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="truncate text-sm font-medium text-white">
                                                                        {
                                                                            document.name
                                                                        }
                                                                    </p>

                                                                    {selected && (
                                                                        <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
                                                                    )}
                                                                </div>

                                                                <p className="mt-1 truncate text-[11px] text-zinc-500">
                                                                    {
                                                                        document.clientName
                                                                    }
                                                                </p>

                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                    <CategoryBadge
                                                                        category={
                                                                            document.category
                                                                        }
                                                                    />

                                                                    <StatusBadge
                                                                        status={
                                                                            document.status
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-700">
                                                                    <span>
                                                                        {
                                                                            document.fileType
                                                                        }
                                                                    </span>

                                                                    <span>
                                                                        •
                                                                    </span>

                                                                    <span>
                                                                        {
                                                                            document.fileSize
                                                                        }
                                                                    </span>

                                                                    <span>
                                                                        •
                                                                    </span>

                                                                    <span>
                                                                        Updated{' '}
                                                                        {formatDate(
                                                                            document.updatedDate
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

                        <div className="hidden min-w-0 lg:block">
                            <DocumentDetails
                                document={
                                    selectedDocument
                                }
                                loading={
                                    detailLoading
                                }
                                actionLoading={
                                    actionLoading
                                }
                                downloading={
                                    downloadingDocumentId
                                }
                                onDownload={
                                    handleDownload
                                }
                                onReview={
                                    handleReview
                                }
                                onShare={
                                    handleShare
                                }
                                onViewClient={
                                    viewClient
                                }
                            />
                        </div>
                    </section>
                )}

                {error &&
                    error !== 'NO_TOKEN' && (
                        <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={() =>
                                    setError(
                                        null
                                    )
                                }
                                className="shrink-0 text-xs text-red-300/70 hover:text-red-200"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
            </main>

            <AnimatePresence>
                {mobileDetailOpen &&
                    selectedDocument && (
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
                            <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/[0.06] bg-[#06080b]/95 px-4 py-3 backdrop-blur-xl">
                                <button
                                    type="button"
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
                                    Document Details
                                </span>

                                <button
                                    type="button"
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
                                <DocumentDetails
                                    document={
                                        selectedDocument
                                    }
                                    loading={
                                        detailLoading
                                    }
                                    actionLoading={
                                        actionLoading
                                    }
                                    downloading={
                                        downloadingDocumentId
                                    }
                                    onDownload={
                                        handleDownload
                                    }
                                    onReview={
                                        handleReview
                                    }
                                    onShare={
                                        handleShare
                                    }
                                    onViewClient={
                                        viewClient
                                    }
                                />
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    )
}

function DocumentDetails({
    document,
    loading,
    actionLoading,
    downloading,
    onDownload,
    onReview,
    onShare,
    onViewClient,
}: {
    document:
    | ClientDocument
    | null
    loading: boolean
    actionLoading: boolean
    downloading: string
    onDownload: (
        documentId: string,
        preview?: boolean
    ) => void
    onReview: () => void
    onShare: () => void
    onViewClient: () => void
}) {
    if (!document) {
        return (
            <div className="flex min-h-[650px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <div className="text-center">
                    <FileText className="mx-auto h-10 w-10 text-zinc-700" />

                    <p className="mt-4 text-sm text-zinc-400">
                        Select a document
                    </p>

                    <p className="mt-1 text-xs text-zinc-700">
                        Select a document from the list to view its details.
                    </p>
                </div>
            </div>
        )
    }

    const reviewed =
        document.status ===
        'Reviewed'

    const downloadBusy =
        downloading === document.id

    return (
        <motion.div
            key={document.id}
            initial={{
                opacity: 0,
                y: 8,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            className="space-y-5"
        >
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-400/[0.06]">
                            <DocumentIcon
                                type={
                                    document.fileType
                                }
                            />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight text-white">
                                    {
                                        document.name
                                    }
                                </h2>

                                <StatusBadge
                                    status={
                                        document.status
                                    }
                                />
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                                {
                                    document.category
                                }{' '}
                                document
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-zinc-600" />
                                    {
                                        document.clientName
                                    }
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-zinc-600" />
                                    Updated{' '}
                                    {formatDate(
                                        document.updatedDate
                                    )}
                                </span>

                                <span>
                                    {
                                        document.fileType
                                    }{' '}
                                    •{' '}
                                    {
                                        document.fileSize
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onReview}
                            disabled={
                                actionLoading ||
                                reviewed
                            }
                            className={`rounded-lg border px-3 py-2 text-[11px] font-medium transition ${reviewed
                                ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-400'
                                : 'border-blue-400/20 bg-blue-400/10 text-blue-400 hover:bg-blue-400/15'
                                } disabled:opacity-50`}
                        >
                            {reviewed
                                ? 'Reviewed'
                                : actionLoading
                                    ? 'Saving...'
                                    : 'Mark Reviewed'}
                        </button>

                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-500 hover:text-white"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="mt-5 flex items-center gap-2 text-[11px] text-zinc-600">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Loading latest document details...
                    </div>
                )}

                <div className="mt-6 border-t border-white/[0.06] pt-5">
                    <p className="text-xs leading-6 text-zinc-500">
                        {document.description ||
                            'No description has been provided for this document.'}
                    </p>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />

                    <div>
                        <p className="text-xs font-medium text-emerald-300">
                            {document.visibility ===
                                'private'
                                ? 'Restricted document'
                                : 'Client-shared document'}
                        </p>

                        <p className="mt-0.5 text-[10px] text-zinc-600">
                            Visibility:{' '}
                            {
                                document.visibility
                            }
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                    type="button"
                    disabled={
                        !document.id ||
                        downloadBusy
                    }
                    onClick={() =>
                        onDownload(
                            document.id,
                            true
                        )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-3 text-xs font-medium text-blue-400 transition hover:bg-blue-400/15 disabled:opacity-40"
                >
                    {downloadBusy ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                    Preview
                </button>

                <button
                    type="button"
                    disabled={
                        !document.id ||
                        downloadBusy
                    }
                    onClick={() =>
                        onDownload(
                            document.id
                        )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-40"
                >
                    <Download className="h-4 w-4" />
                    Download
                </button>

                <button
                    type="button"
                    disabled={
                        actionLoading
                    }
                    onClick={
                        onShare
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-40"
                >
                    <Mail className="h-4 w-4" />
                    Share
                </button>

                <button
                    type="button"
                    disabled={
                        actionLoading ||
                        reviewed
                    }
                    onClick={
                        onReview
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-40"
                >
                    <FileCheck2 className="h-4 w-4" />
                    {reviewed
                        ? 'Reviewed'
                        : 'Mark Reviewed'}
                </button>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                            <File className="h-4 w-4 text-zinc-400" />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                File Information
                            </h3>

                            <p className="text-xs text-zinc-600">
                                Document metadata
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        <InfoRow
                            label="File type"
                            value={
                                document.fileType
                            }
                        />

                        <InfoRow
                            label="File size"
                            value={
                                document.fileSize
                            }
                        />

                        <InfoRow
                            label="Version"
                            value={
                                document.version
                            }
                        />

                        <InfoRow
                            label="Uploaded by"
                            value={
                                document.uploadedBy
                            }
                        />

                        <InfoRow
                            label="Uploaded"
                            value={formatDate(
                                document.uploadedDate
                            )}
                        />

                        <InfoRow
                            label="Visibility"
                            value={
                                document.visibility
                            }
                        />

                        <InfoRow
                            label="Confidential"
                            value={
                                document.confidential
                                    ? 'Yes'
                                    : 'No'
                            }
                        />

                        <InfoRow
                            label="Review status"
                            value={
                                document.reviewStatus ===
                                    'reviewed'
                                    ? 'Reviewed'
                                    : 'Pending'
                            }
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                            <Building2 className="h-4 w-4 text-zinc-400" />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Client
                            </h3>

                            <p className="text-xs text-zinc-600">
                                Document owner / source
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-blue-500/[0.06]">
                            <Building2 className="h-4 w-4 text-blue-400" />
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white">
                                {
                                    document.clientName
                                }
                            </p>

                            <p className="mt-1 truncate text-[10px] text-zinc-600">
                                Client ID:{' '}
                                {
                                    document.clientId
                                }
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onViewClient
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-xs text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                    >
                        View Client
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {document.reviewNotes && (
                <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.025] p-5">
                    <p className="text-[10px] uppercase tracking-wider text-amber-500/70">
                        Review Notes
                    </p>

                    <p className="mt-2 text-xs leading-6 text-zinc-400">
                        {
                            document.reviewNotes
                        }
                    </p>
                </div>
            )}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                        <History className="h-4 w-4 text-zinc-400" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Document Activity
                        </h3>

                        <p className="text-xs text-zinc-600">
                            Live AuditLog activity
                        </p>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    {document.activities
                        .length ? (
                        document.activities.map(
                            (
                                activity,
                                index
                            ) => (
                                <div
                                    key={
                                        activity.id ||
                                        `${activity.action}-${index}`
                                    }
                                    className="relative flex gap-3"
                                >
                                    {index <
                                        document
                                            .activities
                                            .length -
                                        1 && (
                                            <div className="absolute left-[7px] top-5 h-full w-px bg-white/[0.06]" />
                                        )}

                                    <div className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-400/10">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-white">
                                            {
                                                activity.action
                                            }
                                        </p>

                                        <p className="mt-1 text-[10px] text-zinc-600">
                                            {
                                                activity.by
                                            }
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
                        <div className="py-10 text-center">
                            <History className="mx-auto h-7 w-7 text-zinc-700" />

                            <p className="mt-3 text-sm text-zinc-400">
                                No activity recorded yet
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function InfoRow({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
            <span className="text-xs text-zinc-600">
                {label}
            </span>

            <span className="truncate text-xs text-zinc-300">
                {value}
            </span>
        </div>
    )
}
