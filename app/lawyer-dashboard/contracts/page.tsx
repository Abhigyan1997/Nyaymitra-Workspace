'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
    MoreHorizontal,
    RefreshCw,
    Search,
    Send,
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
 * PATCH  /lawyer/contracts/:contractId/status
 * POST   /lawyer/contracts/:contractId/comments
 * GET    /lawyer/contracts/:contractId/comments
 * GET    /lawyer/contracts/:contractId/activity
 * GET    /lawyer/contracts/:contractId/documents
 *
 * Document download is intentionally handled by the lawyer document API
 * when a document id is available:
 * GET /lawyer/documents/:documentId/download
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

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body
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
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.items)) return response.items
    if (Array.isArray(response?.contracts)) return response.contracts
    if (Array.isArray(response?.comments)) return response.comments
    if (Array.isArray(response?.activity)) return response.activity
    if (Array.isArray(response?.documents)) return response.documents
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

    const aliases: Record<string, ContractStatus> = {
        'in review': 'Internal Review',
        'awaiting signature': 'Pending Signature',
        'changes requested': 'Revision Requested',
        approved: 'Approved',
        executed: 'Executed',
        active: 'Active',
        expired: 'Expired',
        terminated: 'Terminated',
        archived: 'Archived',
        draft: 'Draft',
    }

    return (
        aliases[valueString.toLowerCase()] ||
        'Draft'
    )
}

function normalizePriority(value: any): ContractPriority {
    const valueString = String(value || 'Medium').toLowerCase()

    if (valueString === 'urgent') return 'Urgent'
    if (valueString === 'high') return 'High'
    if (valueString === 'low') return 'Low'

    return 'Medium'
}

function prettyStatus(status: string) {
    return status
        .replace(/-/g, ' ')
        .replace(
            /\w\S*/g,
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase()
        )
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

function formatRelativeOrDate(value?: string) {
    if (!value) return '—'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const now = Date.now()
    const diff = now - date.getTime()

    if (diff >= 0 && diff < 60 * 60 * 1000) {
        const minutes = Math.max(
            1,
            Math.floor(diff / 60000)
        )
        return `${minutes} min ago`
    }

    if (
        diff >= 0 &&
        diff < 24 * 60 * 60 * 1000
    ) {
        const hours = Math.max(
            1,
            Math.floor(diff / 3600000)
        )
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
        contractType:
            item?.contractType || 'Custom Contract',
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
            email:
                assignedProfessional?.email || '',
        },
        documents: [],
        activities: [],
        comments: [],
        raw: item,
    }
}

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

    const uniqueDocuments = new Map<
        string,
        ContractDocument
    >()

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
        })
    })

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
            item?.updatedAt ||
            fallback?.lastUpdated ||
            '',
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
        parties:
            [
                getBusinessName(item),
                item?.counterparty?.name ||
                item?.counterparty?.companyName ||
                (typeof item?.counterparty === 'string'
                    ? item.counterparty
                    : null),
            ].filter(Boolean),
        documents: Array.from(uniqueDocuments.values()),
        activities: fallback?.activities || [],
        comments: fallback?.comments || [],
        raw: item,
    }
}

function mapActivity(item: any): ContractActivity {
    const performedBy =
        item?.performedBy ||
        item?.author ||
        item?.user

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
        timestamp:
            item?.createdAt ||
            item?.timestamp ||
            '',
        role:
            Array.isArray(performedBy?.role)
                ? performedBy.role.join(', ')
                : performedBy?.role,
    }
}

function mapComment(item: any): ContractComment {
    const author =
        item?.author ||
        item?.createdBy ||
        item?.user

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
        createdAt:
            item?.createdAt ||
            item?.updatedAt ||
            '',
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
        type:
            item?.mimeType ||
            item?.type ||
            'Document',
        size: formatFileSize(item?.size),
        category: item?.category,
        key: item?.key,
        status: item?.status,
    }
}

function StatusBadge({
    status,
}: {
    status: ContractStatus
}) {
    const styles: Record<
        ContractStatus,
        string
    > = {
        Draft:
            'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
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
    const styles: Record<
        ContractPriority,
        string
    > = {
        Low:
            'text-zinc-400 bg-zinc-500/10 border-zinc-500/15',
        Medium:
            'text-amber-400 bg-amber-500/10 border-amber-500/15',
        High:
            'text-red-400 bg-red-500/10 border-red-500/15',
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
                    {Array.from({ length: 6 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="h-20 animate-pulse rounded-xl bg-white/[0.04]"
                            />
                        )
                    )}
                </div>
            </div>

            <div className="space-y-5">
                <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
                <div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />
            </div>
        </div>
    )
}

export default function LawyerContractPage() {
    const [contracts, setContracts] = useState<
        Contract[]
    >([])

    const [
        selectedContract,
        setSelectedContract,
    ] = useState<Contract | null>(null)

    const [search, setSearch] = useState('')

    const [statusFilter, setStatusFilter] =
        useState<'All' | ContractStatus>('All')

    const [priorityFilter, setPriorityFilter] =
        useState<'All' | ContractPriority>('All')

    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] =
        useState(false)

    const [refreshing, setRefreshing] =
        useState(false)

    const [error, setError] = useState<string | null>(
        null
    )

    const [mobileDetail, setMobileDetail] =
        useState(false)

    const [commentsOpen, setCommentsOpen] =
        useState(false)

    const [newComment, setNewComment] =
        useState('')

    const [sendingComment, setSendingComment] =
        useState(false)

    const [changingStatus, setChangingStatus] =
        useState(false)

    const [
        downloadingDocumentId,
        setDownloadingDocumentId,
    ] = useState('')

    const fetchContracts =
        useCallback(async () => {
            try {
                setLoading(true)
                setError(null)

                const response =
                    await apiRequest<any>(
                        '/lawyer/contracts?page=1&limit=100'
                    )

                const mapped = extractArray<any>(
                    response
                ).map(mapContractSummary)

                setContracts(mapped)

                setSelectedContract((current) => {
                    if (!current) {
                        return mapped[0] || null
                    }

                    return (
                        mapped.find(
                            (item) =>
                                item.id === current.id
                        ) || current
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

    const fetchContractDetail =
        useCallback(
            async (contractId: string) => {
                if (!contractId) return

                try {
                    setDetailLoading(true)

                    const response =
                        await apiRequest<any>(
                            `/lawyer/contracts/${encodeURIComponent(
                                contractId
                            )}`
                        )

                    const detail =
                        extractObject(response)

                    setSelectedContract(
                        (current) =>
                            mapContractDetail(
                                detail,
                                current ||
                                contracts.find(
                                    (item) =>
                                        item.id ===
                                        contractId
                                )
                            )
                    )
                } catch (err) {
                    console.error(
                        'Contract detail error:',
                        err
                    )
                } finally {
                    setDetailLoading(false)
                }
            },
            [contracts]
        )

    const fetchContractActivity =
        useCallback(
            async (contractId: string) => {
                try {
                    const response =
                        await apiRequest<any>(
                            `/lawyer/contracts/${encodeURIComponent(
                                contractId
                            )}/activity`
                        )

                    const activity =
                        extractArray<any>(
                            response
                        ).map(mapActivity)

                    setSelectedContract(
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
                        'Contract activity error:',
                        err
                    )
                }
            },
            []
        )

    const fetchContractComments =
        useCallback(
            async (contractId: string) => {
                try {
                    const response =
                        await apiRequest<any>(
                            `/lawyer/contracts/${encodeURIComponent(
                                contractId
                            )}/comments`
                        )

                    const comments =
                        extractArray<any>(
                            response
                        ).map(mapComment)

                    setSelectedContract(
                        (current) =>
                            current
                                ? {
                                    ...current,
                                    comments,
                                }
                                : current
                    )
                } catch (err) {
                    console.error(
                        'Contract comments error:',
                        err
                    )
                }
            },
            []
        )

    const fetchContractDocuments =
        useCallback(
            async (contractId: string) => {
                try {
                    const response =
                        await apiRequest<any>(
                            `/lawyer/contracts/${encodeURIComponent(
                                contractId
                            )}/documents`
                        )

                    const documents =
                        extractArray<any>(
                            response
                        ).map(mapDocument)

                    setSelectedContract(
                        (current) =>
                            current
                                ? {
                                    ...current,
                                    documents,
                                }
                                : current
                    )
                } catch (err) {
                    console.error(
                        'Contract documents error:',
                        err
                    )
                }
            },
            []
        )

    useEffect(() => {
        fetchContracts()
    }, [fetchContracts])

    useEffect(() => {
        if (!selectedContract?.id) return

        fetchContractDetail(
            selectedContract.id
        )
        fetchContractActivity(
            selectedContract.id
        )
        fetchContractComments(
            selectedContract.id
        )
        fetchContractDocuments(
            selectedContract.id
        )
    }, [
        selectedContract?.id,
        fetchContractDetail,
        fetchContractActivity,
        fetchContractComments,
        fetchContractDocuments,
    ])

    const filteredContracts = useMemo(() => {
        const term = search.trim().toLowerCase()

        return contracts.filter((contract) => {
            const matchesSearch =
                !term ||
                contract.title
                    .toLowerCase()
                    .includes(term) ||
                contract.clientName
                    .toLowerCase()
                    .includes(term) ||
                contract.contractType
                    .toLowerCase()
                    .includes(term) ||
                contract.contractNumber
                    ?.toLowerCase()
                    .includes(term)

            const matchesStatus =
                statusFilter === 'All' ||
                contract.status === statusFilter

            const matchesPriority =
                priorityFilter === 'All' ||
                contract.priority ===
                priorityFilter

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            )
        })
    }, [
        contracts,
        search,
        statusFilter,
        priorityFilter,
    ])

    const summary = useMemo(
        () => ({
            total: contracts.length,

            inReview: contracts.filter(
                (contract) =>
                    contract.status ===
                    'Internal Review' ||
                    contract.status ===
                    'Client Review' ||
                    contract.status ===
                    'Revision Requested'
            ).length,

            pendingSignature:
                contracts.filter(
                    (contract) =>
                        contract.status ===
                        'Pending Signature'
                ).length,

            executed:
                contracts.filter(
                    (contract) =>
                        contract.status ===
                        'Executed' ||
                        contract.status === 'Active'
                ).length,
        }),
        [contracts]
    )

    const selectContract = (
        contract: Contract
    ) => {
        setSelectedContract(contract)
        setMobileDetail(true)
    }

    const updateStatus =
        async (status: ContractStatus) => {
            if (!selectedContract?.id) return

            try {
                setChangingStatus(true)

                const response =
                    await apiRequest<any>(
                        `/lawyer/contracts/${encodeURIComponent(
                            selectedContract.id
                        )}/status`,
                        {
                            method: 'PATCH',
                            body: JSON.stringify({
                                status,
                            }),
                        }
                    )

                const updated =
                    extractObject(response)

                const mapped =
                    mapContractDetail(
                        updated,
                        {
                            ...selectedContract,
                            status,
                        }
                    )

                setSelectedContract(
                    mapped
                )

                setContracts((current) =>
                    current.map((item) =>
                        item.id ===
                            selectedContract.id
                            ? {
                                ...item,
                                status,
                            }
                            : item
                    )
                )

                await Promise.all([
                    fetchContractActivity(
                        selectedContract.id
                    ),
                    fetchContractDetail(
                        selectedContract.id
                    ),
                ])
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to update contract status'

                setError(message)
            } finally {
                setChangingStatus(false)
            }
        }

    const addComment = async () => {
        const message = newComment.trim()

        if (
            !message ||
            !selectedContract?.id
        ) {
            return
        }

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
                fetchContractComments(
                    selectedContract.id
                ),
                fetchContractActivity(
                    selectedContract.id
                ),
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

    const downloadDocument = async (
        document: ContractDocument
    ) => {
        if (!document.id) return

        try {
            setDownloadingDocumentId(
                document.id
            )

            const response =
                await apiRequest<any>(
                    `/lawyer/documents/${encodeURIComponent(
                        document.id
                    )}/download`
                )

            const result =
                extractObject(response)

            const url =
                result?.url ||
                result?.downloadUrl ||
                result?.signedUrl

            if (url) {
                window.open(
                    url,
                    '_blank',
                    'noopener,noreferrer'
                )
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
            setDownloadingDocumentId(
                ''
            )
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

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[28%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
                <div className="absolute right-0 top-[35%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.02] blur-3xl" />
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
                                Review and manage contracts assigned to you across your client portfolio.
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={
                                loading ||
                                refreshing
                            }
                            onClick={async () => {
                                setRefreshing(true)
                                await fetchContracts()
                            }}
                            className="flex items-center gap-2 self-start rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.05] disabled:opacity-50 lg:self-auto"
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
                        value={
                            summary.pendingSignature
                        }
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
                        <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                            <div className="border-b border-white/[0.06] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">
                                            My Contracts
                                        </h2>
                                        <p className="mt-1 text-[11px] text-zinc-600">
                                            {
                                                filteredContracts.length
                                            }{' '}
                                            contract
                                            {filteredContracts.length !==
                                                1
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
                                            setSearch(
                                                e.target.value
                                            )
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
                                    ).map(
                                        (status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() =>
                                                    setStatusFilter(
                                                        status
                                                    )
                                                }
                                                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] transition ${statusFilter ===
                                                    status
                                                    ? 'border border-blue-400/20 bg-blue-400/10 text-blue-400'
                                                    : 'border border-white/[0.05] bg-white/[0.02] text-zinc-600 hover:text-zinc-300'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        )
                                    )}
                                </div>

                                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                                    {(
                                        [
                                            'All',
                                            ...PRIORITY_OPTIONS,
                                        ] as const
                                    ).map(
                                        (priority) => (
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
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="max-h-[720px] overflow-y-auto p-2">
                                {filteredContracts.length ===
                                    0 ? (
                                    <div className="py-16 text-center">
                                        <FileText className="mx-auto h-8 w-8 text-zinc-700" />
                                        <p className="mt-3 text-sm text-zinc-400">
                                            No contracts found
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-700">
                                            Try changing your search or filters.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredContracts.map(
                                            (
                                                contract,
                                                index
                                            ) => {
                                                const selected =
                                                    selectedContract?.id ===
                                                    contract.id

                                                return (
                                                    <motion.button
                                                        key={
                                                            contract.id
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

                        <div className="hidden min-w-0 lg:block">
                            <ContractDetails
                                contract={
                                    selectedContract
                                }
                                loading={
                                    detailLoading
                                }
                                changingStatus={
                                    changingStatus
                                }
                                onStatusChange={
                                    updateStatus
                                }
                                onOpenComments={() => {
                                    setCommentsOpen(
                                        true
                                    )

                                    if (
                                        selectedContract?.id
                                    ) {
                                        fetchContractComments(
                                            selectedContract.id
                                        )
                                    }
                                }}
                                onDownloadDocument={
                                    downloadDocument
                                }
                                downloadingDocumentId={
                                    downloadingDocumentId
                                }
                            />
                        </div>
                    </section>
                )}

                {error &&
                    error !== 'NO_TOKEN' && (
                        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}
            </main>

            <AnimatePresence>
                {mobileDetail &&
                    selectedContract && (
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
                                        setMobileDetail(
                                            false
                                        )
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
                                        setMobileDetail(
                                            false
                                        )
                                    }
                                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]"
                                >
                                    <X className="h-4 w-4 text-zinc-400" />
                                </button>
                            </div>

                            <div className="p-4">
                                <ContractDetails
                                    contract={
                                        selectedContract
                                    }
                                    loading={
                                        detailLoading
                                    }
                                    changingStatus={
                                        changingStatus
                                    }
                                    onStatusChange={
                                        updateStatus
                                    }
                                    onOpenComments={() => {
                                        setCommentsOpen(
                                            true
                                        )

                                        if (
                                            selectedContract.id
                                        ) {
                                            fetchContractComments(
                                                selectedContract.id
                                            )
                                        }
                                    }}
                                    onDownloadDocument={
                                        downloadDocument
                                    }
                                    downloadingDocumentId={
                                        downloadingDocumentId
                                    }
                                />
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>

            <AnimatePresence>
                {commentsOpen &&
                    selectedContract && (
                        <CommentsModal
                            contract={
                                selectedContract
                            }
                            message={
                                newComment
                            }
                            setMessage={
                                setNewComment
                            }
                            sending={
                                sendingComment
                            }
                            onClose={() =>
                                setCommentsOpen(
                                    false
                                )
                            }
                            onSend={addComment}
                        />
                    )}
            </AnimatePresence>
        </div>
    )
}

function ContractDetails({
    contract,
    loading,
    changingStatus,
    onStatusChange,
    onOpenComments,
    onDownloadDocument,
    downloadingDocumentId,
}: {
    contract: Contract | null
    loading: boolean
    changingStatus: boolean
    onStatusChange: (
        status: ContractStatus
    ) => void
    onOpenComments: () => void
    onDownloadDocument: (
        document: ContractDocument
    ) => void
    downloadingDocumentId: string
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
                        Select a contract from the list to view its details.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            key={contract.id}
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
                        <ContractIcon />

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight text-white">
                                    {contract.title}
                                </h2>

                                <StatusBadge
                                    status={
                                        contract.status
                                    }
                                />
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
                                    {
                                        contract.clientName
                                    }
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-zinc-600" />
                                    Due{' '}
                                    {formatDate(
                                        contract.dueDate
                                    )}
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
                        <PriorityBadge
                            priority={
                                contract.priority
                            }
                        />

                        <div className="relative">
                            <select
                                value={
                                    contract.status
                                }
                                disabled={
                                    changingStatus
                                }
                                onChange={(event) =>
                                    onStatusChange(
                                        event
                                            .target
                                            .value as ContractStatus
                                    )
                                }
                                className="h-9 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 text-[11px] text-zinc-300 outline-none focus:border-blue-400/30"
                            >
                                {STATUS_OPTIONS.map(
                                    (
                                        status
                                    ) => (
                                        <option
                                            key={
                                                status
                                            }
                                            value={
                                                status
                                            }
                                            className="bg-[#111318]"
                                        >
                                            {status}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-500 hover:text-white"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
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
                            {
                                contract
                                    .assignedLawyer
                                    .name
                            }
                        </p>
                    </div>

                    <div className="ml-auto hidden items-center gap-2 text-[11px] text-zinc-600 sm:flex">
                        <Mail className="h-3.5 w-3.5" />
                        {
                            contract
                                .assignedLawyer
                                .email
                        }
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                    type="button"
                    onClick={onOpenComments}
                    className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-3 text-xs font-medium text-blue-400 transition hover:bg-blue-400/15"
                >
                    <MessageSquare className="h-4 w-4" />
                    Comments
                </button>

                <button
                    type="button"
                    onClick={() =>
                        document
                            .getElementById(
                                'contract-documents'
                            )
                            ?.scrollIntoView({
                                behavior: 'smooth',
                            })
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                    <FileText className="h-4 w-4" />
                    Documents
                </button>

                <button
                    type="button"
                    onClick={() =>
                        document
                            .getElementById(
                                'contract-timeline'
                            )
                            ?.scrollIntoView({
                                behavior: 'smooth',
                            })
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                    <History className="h-4 w-4" />
                    Activity
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onStatusChange(
                            'Executed'
                        )
                    }
                    disabled={
                        changingStatus ||
                        contract.status ===
                        'Executed'
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-40"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Executed
                </button>
            </div>

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
                            contract.parties.map(
                                (
                                    party,
                                    index
                                ) => (
                                    <div
                                        key={`${party}-${index}`}
                                        className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.035]">
                                            <Users className="h-3.5 w-3.5 text-zinc-500" />
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-white">
                                                {
                                                    party
                                                }
                                            </p>

                                            <p className="mt-1 text-[10px] text-zinc-600">
                                                {index ===
                                                    0
                                                    ? 'Client'
                                                    : 'Counterparty'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )
                        ) : (
                            <p className="text-xs text-zinc-600">
                                No party information available.
                            </p>
                        )}
                    </div>
                </div>

                <div
                    id="contract-timeline"
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
                >
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

                    <div className="mt-5 space-y-4">
                        {contract.activities.length ? (
                            contract.activities.map(
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
                                            contract
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
                            <div className="py-8 text-center text-xs text-zinc-600">
                                No activity recorded yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div
                id="contract-documents"
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025]"
            >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Contract Documents
                        </h3>

                        <p className="mt-1 text-xs text-zinc-600">
                            Files returned by the contract documents API
                        </p>
                    </div>

                    <span className="text-[10px] text-zinc-700">
                        {contract.documents.length}{' '}
                        file
                        {contract.documents.length !==
                            1
                            ? 's'
                            : ''}
                    </span>
                </div>

                <div className="divide-y divide-white/[0.05]">
                    {contract.documents.length ? (
                        contract.documents.map(
                            (document) => (
                                <div
                                    key={
                                        document.id ||
                                        document.key
                                    }
                                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.015]"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
                                        <FileText className="h-4 w-4 text-zinc-400" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-white">
                                            {
                                                document.name
                                            }
                                        </p>

                                        <p className="mt-1 text-[10px] text-zinc-600">
                                            {
                                                document.type
                                            }{' '}
                                            •{' '}
                                            {
                                                document.size
                                            }
                                            {document.category
                                                ? ` • ${document.category}`
                                                : ''}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={
                                            !document.id
                                        }
                                        onClick={() =>
                                            onDownloadDocument(
                                                document
                                            )
                                        }
                                        className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            )
                        )
                    ) : (
                        <div className="py-12 text-center">
                            <FileText className="mx-auto h-8 w-8 text-zinc-700" />
                            <p className="mt-3 text-xs text-zinc-600">
                                No documents attached to this contract.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function CommentsModal({
    contract,
    message,
    setMessage,
    sending,
    onClose,
    onSend,
}: {
    contract: Contract
    message: string
    setMessage: (
        value: string
    ) => void
    sending: boolean
    onClose: () => void
    onSend: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
            <motion.div
                initial={{
                    opacity: 0,
                    y: 12,
                    scale: 0.98,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                }}
                className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0d11]"
            >
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">
                            Contract Comments
                        </p>
                        <p className="truncate text-xs text-zinc-600">
                            {contract.title}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.04] hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {contract.comments.length === 0 ? (
                        <div className="py-12 text-center">
                            <MessageSquare className="mx-auto h-8 w-8 text-zinc-700" />
                            <p className="mt-3 text-sm text-zinc-400">
                                No comments yet
                            </p>
                            <p className="mt-1 text-xs text-zinc-700">
                                Start the discussion below.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contract.comments.map(
                                (
                                    comment
                                ) => (
                                    <div
                                        key={
                                            comment.id
                                        }
                                        className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-medium text-white">
                                                    {
                                                        comment.authorName
                                                    }
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
                                            {
                                                comment.message
                                            }
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-white/[0.06] p-4">
                    <div className="flex gap-2">
                        <textarea
                            value={message}
                            onChange={(event) =>
                                setMessage(
                                    event
                                        .target
                                        .value
                                )
                            }
                            rows={3}
                            placeholder="Write a comment..."
                            className="min-h-[86px] flex-1 resize-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                        />

                        <button
                            type="button"
                            disabled={
                                sending ||
                                !message.trim()
                            }
                            onClick={onSend}
                            className="self-end rounded-xl bg-blue-600 px-4 py-3 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
                        >
                            {sending ? (
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
            </motion.div>
        </motion.div>
    )
}
