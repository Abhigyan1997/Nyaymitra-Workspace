'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Loader2,
    RefreshCw,
    FileCheck2,
    FileText,
    Gavel,
    History,
    MoreHorizontal,
    Search,
    ShieldCheck,
    UserRound,
    X,
} from 'lucide-react'

// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'

// =========================================================
// API TYPES
// =========================================================

type WorkType =
    | 'Contract'
    | 'Compliance'
    | 'Document'
    | 'Client Request'
    | 'Review'
    | 'Task'
    | 'Other'

type WorkStatus =
    | 'Pending'
    | 'In Progress'
    | 'Completed'
    | 'Overdue'
    | 'Cancelled'
    | 'Blocked'

type WorkPriority =
    | 'Low'
    | 'Medium'
    | 'High'
    | 'Urgent'

interface WorkItem {
    id: string
    title: string
    type: WorkType
    clientName: string
    clientId: string
    description: string
    status: WorkStatus
    priority: WorkPriority
    dueDate: string | null
    assignedDate: string | null
    lastUpdated: string | null
    sourceType?: string | null
    sourceId?: string | null
    completedAt?: string | null
    business?: unknown
    metadata?: Record<string, unknown>
}

interface WorkActivity {
    id: string
    action: string
    description?: string
    createdAt: string
    performedBy?: {
        fullName?: string
        email?: string
        role?: string | string[]
    } | null
}

interface ApiResponse<T = unknown> {
    success?: boolean
    message?: string
    data?: T
    error?: string
}

interface WorkListPayload {
    work?: unknown[]
    items?: unknown[]
    data?: unknown[]
    pagination?: {
        page?: number
        limit?: number
        total?: number
        totalPages?: number
    }
}

// =========================================================
// API HELPERS
// =========================================================

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
        throw new Error(
            'Authentication required. Please log in again.'
        )
    }

    const headers = new Headers(options.headers)

    headers.set(
        'Authorization',
        `Bearer ${token}`
    )

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers.set(
            'Content-Type',
            'application/json'
        )
    }

    const response = await fetch(
        `${API_BASE}${path}`,
        {
            ...options,
            headers,
        }
    )

    const contentType =
        response.headers.get(
            'content-type'
        ) || ''

    const result =
        contentType.includes(
            'application/json'
        )
            ? await response.json()
            : await response.text()

    if (!response.ok) {
        const message =
            typeof result === 'object' &&
                result
                ? (
                    result as ApiResponse
                ).message ||
                (
                    result as ApiResponse
                ).error
                : undefined

        throw new Error(
            message ||
            `Request failed with status ${response.status}`
        )
    }

    return result as T
}

// =========================================================
// FORMAT / NORMALIZATION HELPERS
// =========================================================

function asRecord(
    value: unknown
): Record<string, any> {
    return value &&
        typeof value === 'object'
        ? (value as Record<string, any>)
        : {}
}

function getId(value: unknown): string {
    const item = asRecord(value)

    return String(
        item._id ||
        item.id ||
        value ||
        ''
    )
}

function formatDate(
    value?: string | null
): string | null {
    if (!value) {
        return null
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString(
        'en-IN',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    )
}

function formatDateTime(
    value?: string | null
): string {
    if (!value) {
        return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString(
        'en-IN',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
    )
}

function isToday(
    value?: string | null
): boolean {
    if (!value) {
        return false
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return false
    }

    const now = new Date()

    return (
        date.getFullYear() ===
        now.getFullYear() &&
        date.getMonth() ===
        now.getMonth() &&
        date.getDate() ===
        now.getDate()
    )
}

function normalizeType(
    value?: string | null
): WorkType {
    switch (
    String(value || '').toLowerCase()
    ) {
        case 'contract':
            return 'Contract'

        case 'compliance':
            return 'Compliance'

        case 'document':
        case 'businessdocument':
            return 'Document'

        case 'document_review':
        case 'document-review':
        case 'review':
            return 'Review'

        case 'task':
            return 'Task'

        case 'client_request':
        case 'client-request':
            return 'Client Request'

        default:
            return 'Other'
    }
}

function normalizeStatus(
    value?: string | null
): WorkStatus {
    switch (
    String(value || '').toLowerCase()
    ) {
        case 'pending':
            return 'Pending'

        case 'in-progress':
        case 'in_progress':
        case 'in progress':
            return 'In Progress'

        case 'completed':
            return 'Completed'

        case 'overdue':
            return 'Overdue'

        case 'cancelled':
        case 'canceled':
            return 'Cancelled'

        case 'blocked':
            return 'Blocked'

        default:
            return 'Pending'
    }
}

function normalizePriority(
    value?: string | null
): WorkPriority {
    switch (
    String(value || '').toLowerCase()
    ) {
        case 'urgent':
            return 'Urgent'

        case 'high':
            return 'High'

        case 'medium':
            return 'Medium'

        case 'low':
            return 'Low'

        default:
            return 'Medium'
    }
}

function toApiStatus(
    value: WorkStatus
): string {
    switch (value) {
        case 'In Progress':
            return 'in-progress'

        case 'Completed':
            return 'completed'

        case 'Overdue':
            return 'overdue'

        case 'Cancelled':
            return 'cancelled'

        case 'Blocked':
            return 'blocked'

        case 'Pending':
        default:
            return 'pending'
    }
}

function extractWorkList(
    payload: unknown
): unknown[] {
    const root = asRecord(payload)
    const nested = asRecord(
        root.data
    )

    if (Array.isArray(root.work)) {
        return root.work
    }

    if (Array.isArray(root.items)) {
        return root.items
    }

    if (Array.isArray(root.data)) {
        return root.data
    }

    if (Array.isArray(nested.work)) {
        return nested.work
    }

    if (Array.isArray(nested.items)) {
        return nested.items
    }

    if (Array.isArray(nested.data)) {
        return nested.data
    }

    return []
}

function extractSingleWork(
    payload: unknown
): unknown {
    const root = asRecord(payload)
    const nested = asRecord(
        root.data
    )

    if (
        root.work &&
        !Array.isArray(root.work)
    ) {
        return root.work
    }

    if (root.item) {
        return root.item
    }

    if (
        nested.work &&
        !Array.isArray(nested.work)
    ) {
        return nested.work
    }

    if (nested.item) {
        return nested.item
    }

    return Object.keys(nested).length
        ? nested
        : root
}

function extractActivityList(
    payload: unknown
): unknown[] {
    const root = asRecord(payload)
    const nested = asRecord(
        root.data
    )

    if (Array.isArray(root.activity)) {
        return root.activity
    }

    if (Array.isArray(root.activities)) {
        return root.activities
    }

    if (Array.isArray(root.data)) {
        return root.data
    }

    if (
        Array.isArray(
            nested.activity
        )
    ) {
        return nested.activity
    }

    if (
        Array.isArray(
            nested.activities
        )
    ) {
        return nested.activities
    }

    if (Array.isArray(nested.data)) {
        return nested.data
    }

    return []
}

function normalizeWork(
    rawValue: unknown
): WorkItem {
    const raw = asRecord(rawValue)

    const business = asRecord(
        raw.business
    )

    const client = asRecord(
        raw.client
    )

    const businessId =
        business._id ||
        business.id ||
        raw.businessId ||
        client._id ||
        client.id ||
        raw.clientId ||
        ''

    const possibleRawClient =
        raw.client

    const rawClientName =
        typeof possibleRawClient === 'string'
            ? possibleRawClient
            : ''

    const clientName =
        business.companyName ||
        business.legalName ||
        client.companyName ||
        client.name ||
        raw.clientName ||
        rawClientName ||
        'Unknown Client'

    const createdAt =
        raw.createdAt ||
        raw.assignedAt ||
        raw.createdDate ||
        null

    const updatedAt =
        raw.updatedAt ||
        raw.lastUpdated ||
        createdAt

    const dueDate =
        raw.dueDate ||
        raw.deadline ||
        null

    return {
        id: getId(raw),

        title: String(
            raw.title ||
            raw.name ||
            'Untitled Work'
        ),

        type: normalizeType(
            raw.workType ||
            raw.type
        ),

        clientName: String(
            clientName
        ),

        clientId: String(
            businessId
        ),

        description: String(
            raw.description || ''
        ),

        status: normalizeStatus(
            raw.status
        ),

        priority: normalizePriority(
            raw.priority
        ),

        dueDate: dueDate
            ? String(dueDate)
            : null,

        assignedDate: createdAt
            ? String(createdAt)
            : null,

        lastUpdated: updatedAt
            ? String(updatedAt)
            : null,

        sourceType:
            raw.sourceType
                ? String(
                    raw.sourceType
                )
                : null,

        sourceId:
            raw.sourceId
                ? String(
                    getId(
                        raw.sourceId
                    )
                )
                : null,

        completedAt:
            raw.completedAt
                ? String(
                    raw.completedAt
                )
                : null,

        business:
            raw.business || null,

        metadata:
            asRecord(
                raw.metadata
            ),
    }
}

function normalizeActivity(
    rawValue: unknown
): WorkActivity {
    const raw = asRecord(rawValue)

    const performedBy =
        asRecord(
            raw.performedBy ||
            raw.user ||
            raw.actor
        )

    return {
        id: getId(raw),

        action: String(
            raw.action ||
            raw.event ||
            raw.title ||
            'Activity'
        ),

        description:
            raw.description ||
            raw.detail ||
            undefined,

        createdAt: String(
            raw.createdAt ||
            raw.timestamp ||
            raw.date ||
            new Date().toISOString()
        ),

        performedBy: {
            fullName:
                performedBy.fullName ||
                performedBy.name ||
                undefined,

            email:
                performedBy.email ||
                undefined,

            role:
                performedBy.role ||
                undefined,
        },
    }
}

function TypeIcon({
    type,
}: {
    type: WorkType
}) {
    if (type === 'Contract') {
        return (
            <FileCheck2 className="h-5 w-5 text-blue-400" />
        )
    }

    if (type === 'Compliance') {
        return (
            <ShieldCheck className="h-5 w-5 text-amber-400" />
        )
    }

    if (type === 'Document') {
        return (
            <FileText className="h-5 w-5 text-violet-400" />
        )
    }

    if (type === 'Client Request') {
        return (
            <UserRound className="h-5 w-5 text-emerald-400" />
        )
    }

    return (
        <Gavel className="h-5 w-5 text-blue-400" />
    )
}

function StatusBadge({
    status,
}: {
    status: WorkStatus
}) {
    const styles: Record<WorkStatus, string> = {
        Pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        'In Progress':
            'border-blue-500/20 bg-blue-500/10 text-blue-400',
        Completed:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Blocked:
            'border-red-500/20 bg-red-500/10 text-red-400',
        Overdue:
            'border-orange-500/20 bg-orange-500/10 text-orange-400',
        Cancelled:
            'border-slate-500/20 bg-slate-500/10 text-slate-400',
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
    priority: WorkPriority
}) {
    const styles: Record<WorkPriority, string> = {
        Urgent:
            'border-red-500/20 bg-red-500/10 text-red-400',
        High:
            'border-orange-500/15 bg-orange-500/10 text-orange-400',
        Medium:
            'border-amber-500/15 bg-amber-500/10 text-amber-400',
        Low:
            'border-zinc-500/15 bg-zinc-500/10 text-zinc-400',
    }

    return (
        <span
            className={`rounded-md border px-2 py-1 text-[10px] font-medium ${styles[priority]}`}
        >
            {priority}
        </span>
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
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
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

export default function LawyerMyWorkPage() {
    const router = useRouter()

    const [items, setItems] =
        useState<WorkItem[]>([])

    const [selectedId, setSelectedId] =
        useState('')

    const [selectedItem, setSelectedItem] =
        useState<WorkItem | null>(null)

    const [activities, setActivities] =
        useState<WorkActivity[]>([])

    const [search, setSearch] =
        useState('')

    const [statusFilter, setStatusFilter] =
        useState<
            'All' | WorkStatus
        >('All')

    const [typeFilter, setTypeFilter] =
        useState<
            'All' | WorkType
        >('All')

    const [mobileDetailOpen, setMobileDetailOpen] =
        useState(false)

    const [loading, setLoading] =
        useState(true)

    const [detailLoading, setDetailLoading] =
        useState(false)

    const [activityLoading, setActivityLoading] =
        useState(false)

    const [refreshing, setRefreshing] =
        useState(false)

    const [statusUpdating, setStatusUpdating] =
        useState(false)

    const [error, setError] =
        useState<string | null>(null)

    const [activityError, setActivityError] =
        useState<string | null>(null)

    // =====================================================
    // GET /lawyer/work
    // =====================================================

    const fetchWork = useCallback(
        async (showLoader = true) => {
            try {
                if (showLoader) {
                    setLoading(true)
                }

                setError(null)

                const response =
                    await apiRequest<
                        ApiResponse<
                            WorkListPayload |
                            unknown[]
                        >
                    >(
                        '/lawyer-works/work'
                    )

                const normalized =
                    extractWorkList(
                        response
                    )
                        .map(
                            normalizeWork
                        )
                        .filter(
                            (item) =>
                                Boolean(
                                    item.id
                                )
                        )

                setItems(normalized)

                setSelectedId(
                    (current) => {
                        if (
                            current &&
                            normalized.some(
                                (
                                    item
                                ) =>
                                    item.id ===
                                    current
                            )
                        ) {
                            return current
                        }

                        return (
                            normalized[0]
                                ?.id ||
                            ''
                        )
                    }
                )

                return normalized
            } catch (err) {
                console.error(
                    'Fetch lawyer work error:',
                    err
                )

                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to fetch your work.'

                setError(message)

                if (
                    message
                        .toLowerCase()
                        .includes(
                            'authentication'
                        )
                ) {
                    router.push(
                        '/login'
                    )
                }

                return []
            } finally {
                if (showLoader) {
                    setLoading(false)
                }
            }
        },
        [router]
    )

    // =====================================================
    // GET /lawyer/work/:workId
    // =====================================================

    const fetchWorkDetail = useCallback(
        async (
            workId: string
        ) => {
            if (!workId) {
                return
            }

            try {
                setDetailLoading(true)

                const response =
                    await apiRequest<
                        ApiResponse<unknown>
                    >(
                        `/lawyer/work/${workId}`
                    )

                const rawWork =
                    extractSingleWork(
                        response
                    )

                const detail =
                    normalizeWork(
                        rawWork
                    )

                setSelectedItem(
                    detail
                )

                setItems(
                    (current) =>
                        current.map(
                            (item) =>
                                item.id ===
                                    detail.id
                                    ? {
                                        ...item,
                                        ...detail,
                                    }
                                    : item
                        )
                )
            } catch (err) {
                console.error(
                    'Fetch lawyer work detail error:',
                    err
                )

                setSelectedItem(
                    items.find(
                        (item) =>
                            item.id ===
                            workId
                    ) || null
                )
            } finally {
                setDetailLoading(
                    false
                )
            }
        },
        [items]
    )

    // =====================================================
    // GET /lawyer/work/:workId/activity
    // =====================================================

    const fetchWorkActivity =
        useCallback(
            async (
                workId: string
            ) => {
                if (!workId) {
                    setActivities([])
                    return
                }

                try {
                    setActivityLoading(
                        true
                    )
                    setActivityError(
                        null
                    )

                    const response =
                        await apiRequest<
                            ApiResponse<unknown>
                        >(
                            `/lawyer/work/${workId}/activity`
                        )

                    const activity =
                        extractActivityList(
                            response
                        ).map(
                            normalizeActivity
                        )

                    setActivities(
                        activity
                    )
                } catch (err) {
                    console.error(
                        'Fetch lawyer work activity error:',
                        err
                    )

                    setActivities([])

                    setActivityError(
                        err instanceof
                            Error
                            ? err.message
                            : 'Failed to fetch activity.'
                    )
                } finally {
                    setActivityLoading(
                        false
                    )
                }
            },
            []
        )

    // =====================================================
    // SELECT WORK
    // =====================================================

    const selectWork = useCallback(
        async (
            workId: string,
            openMobile = false
        ) => {
            setSelectedId(
                workId
            )

            if (openMobile) {
                setMobileDetailOpen(
                    true
                )
            }

            const listItem =
                items.find(
                    (item) =>
                        item.id ===
                        workId
                ) || null

            setSelectedItem(
                listItem
            )

            await Promise.all([
                fetchWorkDetail(
                    workId
                ),
                fetchWorkActivity(
                    workId
                ),
            ])
        },
        [
            fetchWorkActivity,
            fetchWorkDetail,
            items,
        ]
    )

    // =====================================================
    // PATCH /lawyer/work/:workId/status
    // =====================================================

    const updateStatus = async (
        status: WorkStatus
    ) => {
        if (!selectedId) {
            return
        }

        try {
            setStatusUpdating(
                true
            )

            const response =
                await apiRequest<
                    ApiResponse<unknown>
                >(
                    `/lawyer/work/${selectedId}/status`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify(
                            {
                                status:
                                    toApiStatus(
                                        status
                                    ),
                            }
                        ),
                    }
                )

            const rawWork =
                extractSingleWork(
                    response
                )

            const rawRecord =
                asRecord(
                    rawWork
                )

            const updated =
                Object.keys(
                    rawRecord
                ).length > 0
                    ? normalizeWork(
                        rawWork
                    )
                    : null

            setItems(
                (current) =>
                    current.map(
                        (item) =>
                            item.id ===
                                selectedId
                                ? {
                                    ...item,
                                    status,
                                    ...(updated ||
                                        {}),
                                }
                                : item
                    )
            )

            setSelectedItem(
                (current) =>
                    current
                        ? {
                            ...current,
                            status,
                            ...(updated ||
                                {}),
                        }
                        : current
            )

            await fetchWorkActivity(
                selectedId
            )
        } catch (err) {
            console.error(
                'Update lawyer work status error:',
                err
            )

            window.alert(
                err instanceof Error
                    ? err.message
                    : 'Failed to update work status.'
            )
        } finally {
            setStatusUpdating(
                false
            )
        }
    }

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchWork()
    }, [fetchWork])

    // =====================================================
    // LOAD DETAIL WHEN SELECTION CHANGES
    // =====================================================

    useEffect(() => {
        if (!selectedId) {
            setSelectedItem(
                null
            )
            setActivities([])
            return
        }

        const loadSelected =
            async () => {
                await Promise.all([
                    fetchWorkDetail(
                        selectedId
                    ),
                    fetchWorkActivity(
                        selectedId
                    ),
                ])
            }

        loadSelected()
    }, [
        selectedId,
        fetchWorkActivity,
        fetchWorkDetail,
    ])

    // =====================================================
    // FILTERING
    // =====================================================

    const filteredItems =
        useMemo(() => {
            const term =
                search
                    .trim()
                    .toLowerCase()

            return items.filter(
                (item) => {
                    const matchesSearch =
                        !term ||
                        item.title
                            .toLowerCase()
                            .includes(
                                term
                            ) ||
                        item.clientName
                            .toLowerCase()
                            .includes(
                                term
                            ) ||
                        item.type
                            .toLowerCase()
                            .includes(
                                term
                            ) ||
                        item.description
                            .toLowerCase()
                            .includes(
                                term
                            )

                    const matchesStatus =
                        statusFilter ===
                        'All' ||
                        item.status ===
                        statusFilter

                    const matchesType =
                        typeFilter ===
                        'All' ||
                        item.type ===
                        typeFilter

                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesType
                    )
                }
            )
        }, [
            items,
            search,
            statusFilter,
            typeFilter,
        ])

    // =====================================================
    // SUMMARY
    // =====================================================

    const summary =
        useMemo(
            () => ({
                total:
                    items.length,

                active: items.filter(
                    (item) =>
                        item.status ===
                        'Pending' ||
                        item.status ===
                        'In Progress'
                ).length,

                urgent:
                    items.filter(
                        (item) =>
                            (
                                item.priority ===
                                'High' ||
                                item.priority ===
                                'Urgent'
                            ) &&
                            item.status !==
                            'Completed'
                    ).length,

                completed:
                    items.filter(
                        (item) =>
                            item.status ===
                            'Completed'
                    ).length,
            }),
            [items]
        )

    // =====================================================
    // DUE TODAY
    // =====================================================

    const todayItems =
        useMemo(
            () =>
                items.filter(
                    (item) =>
                        isToday(
                            item.dueDate
                        )
                ),
            [items]
        )

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh =
        async () => {
            try {
                setRefreshing(
                    true
                )

                const updated =
                    await fetchWork(
                        false
                    )

                const nextId =
                    updated.some(
                        (item) =>
                            item.id ===
                            selectedId
                    )
                        ? selectedId
                        : updated[0]
                            ?.id ||
                        ''

                if (nextId) {
                    await Promise.all(
                        [
                            fetchWorkDetail(
                                nextId
                            ),
                            fetchWorkActivity(
                                nextId
                            ),
                        ]
                    )
                }
            } finally {
                setRefreshing(
                    false
                )
            }
        }

    // =====================================================
    // NAVIGATION
    // =====================================================

    const handleViewClient =
        () => {
            if (
                !selectedItem?.clientId
            ) {
                return
            }

            router.push(
                `/lawyer/clients?clientId=${encodeURIComponent(
                    selectedItem.clientId
                )}`
            )
        }

    const handleDocuments =
        () => {
            router.push(
                '/lawyer/documents'
            )
        }

    // =====================================================
    // INITIAL LOADING
    // =====================================================

    if (
        loading &&
        items.length === 0
    ) {
        return (
            <div className="min-h-screen bg-[#06080b] text-white">
                <div className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-4">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" />
                        <p className="mt-4 text-sm text-zinc-500">
                            Loading your work...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[30%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="border-b border-white/[0.06] pb-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                                <span>
                                    Lawyer Dashboard
                                </span>

                                <ChevronRight className="h-3 w-3" />

                                <span className="text-zinc-300">
                                    My Work
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <BriefcaseIcon />

                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    My Work
                                </h1>
                            </div>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                One workspace for contracts,
                                compliance, documents and legal
                                work currently assigned to you.
                            </p>

                            {error && (
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.03] px-3 py-2 text-xs text-red-300">
                                    <AlertCircle className="h-4 w-4 shrink-0" />

                                    <span>
                                        {error}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            fetchWork()
                                        }
                                        className="ml-auto underline underline-offset-2"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleRefresh
                            }
                            disabled={
                                refreshing
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                className={
                                    refreshing
                                        ? 'h-4 w-4 animate-spin'
                                        : 'h-4 w-4'
                                }
                            />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <SummaryCard
                        icon={FileText}
                        value={
                            summary.total
                        }
                        label="Total Work"
                        description="Assigned legal work"
                    />

                    <SummaryCard
                        icon={Clock3}
                        value={
                            summary.active
                        }
                        label="Active"
                        description="Currently requiring action"
                    />

                    <SummaryCard
                        icon={
                            AlertCircle
                        }
                        value={
                            summary.urgent
                        }
                        label="High Priority"
                        description="Needs attention"
                    />

                    <SummaryCard
                        icon={
                            CheckCircle2
                        }
                        value={
                            summary.completed
                        }
                        label="Completed"
                        description="Successfully closed"
                    />
                </section>

                {/* Today */}
                {todayItems.length >
                    0 && (
                        <section className="mt-6 rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                </div>

                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Due Today
                                    </h2>

                                    <p className="text-xs text-zinc-600">
                                        Work items that need attention today
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {todayItems.map(
                                    (
                                        item
                                    ) => (
                                        <button
                                            key={
                                                item.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                selectWork(
                                                    item.id,
                                                    true
                                                )
                                            }
                                            className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-left transition hover:border-red-400/20"
                                        >
                                            <p className="text-xs font-medium text-white">
                                                {
                                                    item.title
                                                }
                                            </p>

                                            <p className="mt-1 text-[11px] text-zinc-600">
                                                {
                                                    item.clientName
                                                }
                                            </p>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <PriorityBadge
                                                    priority={
                                                        item.priority
                                                    }
                                                />

                                                <StatusBadge
                                                    status={
                                                        item.status
                                                    }
                                                />
                                            </div>
                                        </button>
                                    )
                                )}
                            </div>
                        </section>
                    )}

                {/* Main */}
                <section className="mt-6 grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)]">
                    {/* List */}
                    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                        <div className="border-b border-white/[0.06] p-4">
                            <h2 className="text-sm font-semibold">
                                Assigned Work
                            </h2>

                            <p className="mt-1 text-[11px] text-zinc-600">
                                {
                                    filteredItems.length
                                }{' '}
                                work item
                                {
                                    filteredItems.length !==
                                        1
                                        ? 's'
                                        : ''
                                }
                            </p>

                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                                <input
                                    value={
                                        search
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setSearch(
                                            e.target
                                                .value
                                        )
                                    }
                                    placeholder="Search your work..."
                                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400/30"
                                />
                            </div>

                            <div className="mt-3 flex gap-1.5 overflow-x-auto">
                                {(
                                    [
                                        'All',
                                        'Pending',
                                        'In Progress',
                                        'Completed',
                                        'Overdue',
                                        'Cancelled',
                                    ] as const
                                ).map(
                                    (
                                        status
                                    ) => (
                                        <button
                                            key={
                                                status
                                            }
                                            type="button"
                                            onClick={() =>
                                                setStatusFilter(
                                                    status
                                                )
                                            }
                                            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] ${statusFilter ===
                                                status
                                                ? 'bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20'
                                                : 'bg-white/[0.02] text-zinc-600 hover:text-zinc-300'
                                                }`}
                                        >
                                            {
                                                status
                                            }
                                        </button>
                                    )
                                )}
                            </div>

                            <div className="mt-2 flex gap-1.5 overflow-x-auto">
                                {(
                                    [
                                        'All',
                                        'Contract',
                                        'Compliance',
                                        'Document',
                                        'Client Request',
                                        'Review',
                                        'Task',
                                        'Other',
                                    ] as const
                                ).map(
                                    (
                                        type
                                    ) => (
                                        <button
                                            key={
                                                type
                                            }
                                            type="button"
                                            onClick={() =>
                                                setTypeFilter(
                                                    type
                                                )
                                            }
                                            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] ${typeFilter ===
                                                type
                                                ? 'bg-white/[0.07] text-white'
                                                : 'text-zinc-600 hover:text-zinc-300'
                                                }`}
                                        >
                                            {
                                                type
                                            }
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="max-h-[740px] overflow-y-auto p-2">
                            {filteredItems.length ===
                                0 ? (
                                <div className="px-4 py-16 text-center">
                                    <Gavel className="mx-auto h-9 w-9 text-zinc-700" />

                                    <p className="mt-4 text-sm text-zinc-400">
                                        No work found
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-700">
                                        Try a different search
                                        or filter.
                                    </p>
                                </div>
                            ) : (
                                filteredItems.map(
                                    (
                                        item
                                    ) => {
                                        const selected =
                                            selectedId ===
                                            item.id

                                        return (
                                            <button
                                                key={
                                                    item.id
                                                }
                                                type="button"
                                                onClick={() =>
                                                    selectWork(
                                                        item.id,
                                                        true
                                                    )
                                                }
                                                className={`mb-1 w-full rounded-xl p-3 text-left transition ${selected
                                                    ? 'bg-blue-400/[0.07] ring-1 ring-blue-400/15'
                                                    : 'hover:bg-white/[0.025]'
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]">
                                                        <TypeIcon
                                                            type={
                                                                item.type
                                                            }
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="truncate text-sm font-medium">
                                                                {
                                                                    item.title
                                                                }
                                                            </p>

                                                            {selected && (
                                                                <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" />
                                                            )}
                                                        </div>

                                                        <p className="mt-1 truncate text-[11px] text-zinc-500">
                                                            {
                                                                item.clientName
                                                            }
                                                        </p>

                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <StatusBadge
                                                                status={
                                                                    item.status
                                                                }
                                                            />

                                                            <PriorityBadge
                                                                priority={
                                                                    item.priority
                                                                }
                                                            />
                                                        </div>

                                                        <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-700">
                                                            <CalendarDays className="h-3 w-3" />

                                                            {item.dueDate
                                                                ? `Due ${formatDate(
                                                                    item.dueDate
                                                                )}`
                                                                : 'No due date'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    }
                                )
                            )}
                        </div>
                    </div>

                    {/* Desktop detail */}
                    <div className="hidden lg:block">
                        {detailLoading &&
                            !selectedItem ? (
                            <div className="flex min-h-[650px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                                <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
                            </div>
                        ) : (
                            <WorkDetails
                                item={
                                    selectedItem
                                }
                                activities={
                                    activities
                                }
                                activityLoading={
                                    activityLoading
                                }
                                activityError={
                                    activityError
                                }
                                statusUpdating={
                                    statusUpdating
                                }
                                onStatusChange={
                                    updateStatus
                                }
                                onViewClient={
                                    handleViewClient
                                }
                                onDocuments={
                                    handleDocuments
                                }
                            />
                        )}
                    </div>
                </section>
            </main>

            {/* Mobile detail */}
            <AnimatePresence>
                {mobileDetailOpen &&
                    selectedItem && (
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
                            <div className="sticky top-0 z-20 flex items-center border-b border-white/[0.06] bg-[#06080b]/95 px-4 py-3 backdrop-blur-xl">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setMobileDetailOpen(
                                            false
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06]"
                                >
                                    <ArrowLeft className="h-4 w-4 text-zinc-400" />
                                </button>

                                <span className="ml-3 text-sm font-medium">
                                    Work Details
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMobileDetailOpen(
                                            false
                                        )
                                    }
                                    className="ml-auto"
                                >
                                    <X className="h-4 w-4 text-zinc-500" />
                                </button>
                            </div>

                            <div className="p-4">
                                <WorkDetails
                                    item={
                                        selectedItem
                                    }
                                    activities={
                                        activities
                                    }
                                    activityLoading={
                                        activityLoading
                                    }
                                    activityError={
                                        activityError
                                    }
                                    statusUpdating={
                                        statusUpdating
                                    }
                                    onStatusChange={
                                        updateStatus
                                    }
                                    onViewClient={
                                        handleViewClient
                                    }
                                    onDocuments={
                                        handleDocuments
                                    }
                                />
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    )
}

function WorkDetails({
    item,
    activities,
    activityLoading,
    activityError,
    statusUpdating,
    onStatusChange,
    onViewClient,
    onDocuments,
}: {
    item: WorkItem | null
    activities: WorkActivity[]
    activityLoading: boolean
    activityError: string | null
    statusUpdating: boolean
    onStatusChange: (
        status: WorkStatus
    ) => void
    onViewClient: () => void
    onDocuments: () => void
}) {
    if (!item) {
        return (
            <div className="flex min-h-[650px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <div className="text-center">
                    <Gavel className="mx-auto h-10 w-10 text-zinc-700" />

                    <p className="mt-4 text-sm text-zinc-400">
                        Select a work item
                    </p>
                </div>
            </div>
        )
    }

    const statusOptions: WorkStatus[] = [
        'Pending',
        'In Progress',
        'Completed',
        'Overdue',
        'Cancelled',
    ]

    return (
        <motion.div
            key={item.id}
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
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-400/[0.06]">
                            <TypeIcon
                                type={item.type}
                            />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight">
                                    {item.title}
                                </h2>

                                <StatusBadge
                                    status={
                                        item.status
                                    }
                                />
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                                {item.type}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-zinc-600" />
                                    {
                                        item.clientName
                                    }
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-zinc-600" />

                                    {item.dueDate
                                        ? `Due ${formatDate(
                                            item.dueDate
                                        )}`
                                        : 'No due date'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="rounded-lg p-2 text-zinc-600 hover:text-white"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-6 border-t border-white/[0.06] pt-5">
                    <p className="text-xs leading-6 text-zinc-500">
                        {item.description ||
                            'No description provided for this work item.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                        Status
                    </p>

                    <div className="mt-2">
                        <select
                            value={
                                item.status
                            }
                            onChange={(
                                e
                            ) =>
                                onStatusChange(
                                    e.target
                                        .value as WorkStatus
                                )
                            }
                            disabled={
                                statusUpdating
                            }
                            className="w-full rounded-lg border border-white/[0.07] bg-[#0b0e12] px-2 py-2 text-xs text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {statusOptions.map(
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
                                    >
                                        {
                                            status
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        {statusUpdating && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-600">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Updating...
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                        Priority
                    </p>

                    <div className="mt-2">
                        <PriorityBadge
                            priority={
                                item.priority
                            }
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                        Assigned
                    </p>

                    <p className="mt-2 text-xs text-white">
                        {formatDate(
                            item.assignedDate
                        ) || '—'}
                    </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                        Updated
                    </p>

                    <p className="mt-2 text-xs text-white">
                        {formatDateTime(
                            item.lastUpdated
                        )}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                    type="button"
                    onClick={() =>
                        onStatusChange(
                            item.status ===
                                'Completed'
                                ? 'Pending'
                                : 'Completed'
                        )
                    }
                    disabled={
                        statusUpdating
                    }
                    className="rounded-xl bg-blue-500/10 py-3 text-xs font-medium text-blue-400 ring-1 ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {item.status ===
                        'Completed'
                        ? 'Reopen Work'
                        : 'Mark Completed'}
                </button>

                <button
                    type="button"
                    onClick={
                        onViewClient
                    }
                    className="rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                    View Client
                </button>

                <button
                    type="button"
                    onClick={
                        onDocuments
                    }
                    className="rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                    Documents
                </button>

                <button
                    type="button"
                    onClick={() =>
                        window.scrollTo(
                            {
                                top:
                                    document.body
                                        .scrollHeight,
                                behavior:
                                    'smooth',
                            }
                        )
                    }
                    className="rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                    Activity
                </button>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                        <History className="h-4 w-4 text-zinc-400" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">
                            Work Context
                        </h3>

                        <p className="text-xs text-zinc-600">
                            Information connected to this assignment
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                        <span className="text-xs text-zinc-600">
                            Client
                        </span>

                        <span className="text-xs text-white">
                            {
                                item.clientName
                            }
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                        <span className="text-xs text-zinc-600">
                            Work Type
                        </span>

                        <span className="text-xs text-white">
                            {
                                item.type
                            }
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                        <span className="text-xs text-zinc-600">
                            Due Date
                        </span>

                        <span className="text-xs text-white">
                            {formatDate(
                                item.dueDate
                            ) || '—'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                        <span className="text-xs text-zinc-600">
                            Source
                        </span>

                        <span className="text-xs text-zinc-400">
                            {
                                item.sourceType ||
                                'Other'
                            }
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-600">
                            Client ID
                        </span>

                        <span className="max-w-[60%] truncate text-right text-xs text-zinc-400">
                            {
                                item.clientId ||
                                '—'
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Activity */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/[0.06]">
                        <History className="h-4 w-4 text-blue-400" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">
                            Activity
                        </h3>

                        <p className="text-xs text-zinc-600">
                            Audit trail for this work item
                        </p>
                    </div>
                </div>

                {activityLoading ? (
                    <div className="mt-6 flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                ) : activityError ? (
                    <div className="mt-5 rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4 text-xs text-red-300">
                        {
                            activityError
                        }
                    </div>
                ) : activities.length ===
                    0 ? (
                    <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-center text-xs text-zinc-700">
                        No activity recorded yet.
                    </div>
                ) : (
                    <div className="mt-5 space-y-4">
                        {activities.map(
                            (
                                activity
                            ) => (
                                <div
                                    key={
                                        activity.id
                                    }
                                    className="relative pl-5"
                                >
                                    <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-blue-400" />

                                    <p className="text-xs font-medium text-zinc-300">
                                        {
                                            activity.action
                                        }
                                    </p>

                                    {activity.description && (
                                        <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                                            {
                                                activity.description
                                            }
                                        </p>
                                    )}

                                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-700">
                                        <span>
                                            {formatDateTime(
                                                activity.createdAt
                                            )}
                                        </span>

                                        {activity
                                            .performedBy
                                            ?.fullName && (
                                                <>
                                                    <span>
                                                        •
                                                    </span>

                                                    <span>
                                                        {
                                                            activity
                                                                .performedBy
                                                                .fullName
                                                        }
                                                    </span>
                                                </>
                                            )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

function BriefcaseIcon() {
    return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10">
            <FileCheck2 className="h-5 w-5 text-blue-400" />
        </div>
    )
}