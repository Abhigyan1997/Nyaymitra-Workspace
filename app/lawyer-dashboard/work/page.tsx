'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Download,
    Globe,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    FileCheck2,
    FileText,
    Gavel,
    History,
    MessageSquare,
    MoreHorizontal,
    Search,
    Send,
    ShieldCheck,
    Trash2,
    Upload,
    UserRound,
    Users,
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

interface WorkClientAddress {
    street?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
}

interface WorkClientContact {
    fullName?: string
    designation?: string
    email?: string
    phone?: string
}

interface WorkClientStats {
    openWork: number
    contracts: number
    compliance: number
    documents: number
    pendingActions: number
}

interface WorkClient {
    id: string
    companyName: string
    legalName: string
    industry: string
    companyType: string
    status: 'Active' | 'Pending' | 'Inactive'
    email: string
    phone: string
    website: string
    logo?: string
    legalHealthScore: number
    address: WorkClientAddress
    primaryContact: WorkClientContact
    businessNeeds: string[]
    stats: WorkClientStats
    assignedAt?: string
    assignmentStatus?: string
    workspaceRole?: string
}

interface WorkDocument {
    id: string
    name: string
    fileName: string
    fileUrl: string
    downloadUrl: string
    fileType: string
    fileSize: number
    uploadedAt: string
    uploadedBy?: {
        fullName?: string
        email?: string
    } | null
    description?: string
}
interface WorkComment {
    id: string
    message: string
    createdAt: string
    author?: {
        id?: string
        fullName?: string
        email?: string
        role?: string | string[]
        avatar?: string
    } | null
    attachments?: Array<{
        id: string
        name: string
        url: string
    }>
}

type DetailTab = 'overview' | 'documents' | 'comments'

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

function formatRelativeTime(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return formatDate(value) || value
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

function getInitials(name: string) {
    if (!name) return 'NA'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase()
    }
    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase()
}

function formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '—'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let i = 0
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024
        i++
    }
    return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
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

        case 'legal_request':
        case 'legal-request':
        case 'legalrequest':
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

function extractWorkClient(payload: unknown): unknown {
    const root = asRecord(payload)
    const nested = asRecord(root.data)

    if (root.client) return root.client
    if (root.business) return root.business
    if (nested.client) return nested.client
    if (nested.business) return nested.business

    if (Object.keys(nested).length) return nested
    return root
}

function extractDocumentList(payload: unknown): unknown[] {
    const root = asRecord(payload)
    const nested = asRecord(root.data)

    if (Array.isArray(root.documents)) return root.documents
    if (Array.isArray(root.files)) return root.files
    if (Array.isArray(root.attachments)) return root.attachments
    if (Array.isArray(root.data)) return root.data
    if (Array.isArray(nested.documents)) return nested.documents
    if (Array.isArray(nested.files)) return nested.files
    if (Array.isArray(nested.attachments)) return nested.attachments
    if (Array.isArray(nested.data)) return nested.data

    return []
}

function extractCommentList(payload: unknown): unknown[] {
    const root = asRecord(payload)
    const nested = asRecord(root.data)

    if (Array.isArray(root.comments)) return root.comments
    if (Array.isArray(root.data)) return root.data
    if (Array.isArray(nested.comments)) return nested.comments
    if (Array.isArray(nested.data)) return nested.data

    return []
}

function extractSingleComment(payload: unknown): unknown {
    const root = asRecord(payload)
    const nested = asRecord(root.data)

    if (root.comment && !Array.isArray(root.comment)) return root.comment
    if (nested.comment && !Array.isArray(nested.comment)) return nested.comment
    if (Object.keys(nested).length) return nested
    return root
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

    const metadata = asRecord(
        raw.metadata
    )

    const createdBy = asRecord(
        raw.createdBy
    )

    const businessId =
        business._id ||
        business.id ||
        metadata.businessId ||
        raw.businessId ||
        client._id ||
        client.id ||
        raw.clientId ||
        ''

    const clientName =
        business.companyName ||
        business.legalName ||
        client.companyName ||
        client.name ||
        raw.clientName ||
        metadata.requesterName ||
        metadata.businessName ||
        createdBy.fullName ||
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
            raw.sourceType ||
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
                ? String(raw.sourceType)
                : null,

        sourceId:
            raw.sourceId
                ? String(getId(raw.sourceId))
                : null,

        completedAt:
            raw.completedAt
                ? String(raw.completedAt)
                : null,

        business:
            raw.business || null,

        metadata,
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

function normalizeWorkClient(rawValue: unknown): WorkClient {
    const raw = asRecord(rawValue)

    const address = asRecord(raw.address)
    const contact = asRecord(
        raw.primaryContact ||
        raw.contactPerson ||
        raw.contact
    )
    const stats = asRecord(raw.stats)

    const statusRaw = String(raw.status || 'Active').toLowerCase()
    let status: WorkClient['status'] = 'Active'
    if (statusRaw === 'inactive') status = 'Inactive'
    else if (statusRaw === 'pending') status = 'Pending'

    return {
        id: String(raw._id || raw.id || ''),
        companyName:
            raw.companyName ||
            raw.legalName ||
            'Unnamed Business',
        legalName:
            raw.legalName || raw.companyName || '—',
        industry: raw.industry || '—',
        companyType:
            raw.companyType ||
            raw.businessType ||
            raw.entityType ||
            '—',
        status,
        email:
            raw.email ||
            contact.email ||
            '—',
        phone:
            raw.phone ||
            contact.phone ||
            '—',
        website: raw.website || '—',
        logo: raw.logo || raw.profilePhoto || undefined,
        legalHealthScore: Number(
            raw.legalHealthScore ??
            raw.legalHealth ??
            0
        ) || 0,
        address: {
            street: address.street || address.line1 || '',
            city: address.city || '—',
            state: address.state || '—',
            country: address.country || 'India',
            pincode: address.pincode || address.zip || '—',
        },
        primaryContact: {
            fullName:
                contact.fullName ||
                contact.name ||
                raw.contactName ||
                '—',
            designation:
                contact.designation ||
                raw.contactDesignation ||
                '—',
            email: contact.email || raw.email || '—',
            phone: contact.phone || raw.phone || '—',
        },
        businessNeeds: Array.isArray(raw.businessNeeds)
            ? raw.businessNeeds
            : Array.isArray(raw.practiceAreas)
                ? raw.practiceAreas
                : [],
        stats: {
            openWork: Number(stats.openWork ?? 0) || 0,
            contracts: Number(stats.contracts ?? 0) || 0,
            compliance: Number(stats.compliance ?? 0) || 0,
            documents: Number(stats.documents ?? 0) || 0,
            pendingActions:
                Number(stats.pendingActions ?? 0) || 0,
        },
        assignedAt: raw.assignedAt,
        assignmentStatus: raw.assignmentStatus,
        workspaceRole: raw.workspaceRole,
    }
}

function normalizeDocument(
    rawValue: unknown
): WorkDocument {
    const raw = asRecord(rawValue)

    const uploadedBy = asRecord(
        raw.uploadedBy ||
        raw.uploader ||
        raw.createdBy
    )

    const downloadUrl = String(
        raw.downloadUrl ||
        raw.fileUrl ||
        raw.url ||
        raw.path ||
        raw.location ||
        ''
    )

    return {
        id: getId(raw),

        name: String(
            raw.originalName ||
            raw.name ||
            raw.title ||
            'Untitled Document'
        ),

        fileName: String(
            raw.fileName ||
            raw.originalName ||
            raw.originalname ||
            raw.name ||
            'file'
        ),

        fileUrl: downloadUrl,

        downloadUrl,

        fileType: String(
            raw.fileType ||
            raw.mimetype ||
            raw.mimeType ||
            ''
        ),

        fileSize:
            Number(
                raw.fileSize ||
                raw.size ||
                0
            ) || 0,

        uploadedAt: String(
            raw.uploadedAt ||
            raw.createdAt ||
            new Date().toISOString()
        ),

        uploadedBy: {
            fullName:
                uploadedBy.fullName ||
                uploadedBy.name ||
                undefined,

            email:
                uploadedBy.email ||
                undefined,
        },

        description: raw.description
            ? String(raw.description)
            : undefined,
    }
}

function normalizeComment(rawValue: unknown): WorkComment {
    const raw = asRecord(rawValue)

    const author = asRecord(
        raw.author || raw.user || raw.createdBy || raw.performedBy
    )

    return {
        id: getId(raw),
        message: String(
            raw.message || raw.text || raw.content || raw.comment || ''
        ),
        createdAt: String(
            raw.createdAt ||
            raw.timestamp ||
            new Date().toISOString()
        ),
        author: {
            id: author._id
                ? String(author._id)
                : author.id
                    ? String(author.id)
                    : undefined,
            fullName:
                author.fullName || author.name || undefined,
            email: author.email || undefined,
            role: author.role || undefined,
            avatar: author.avatar || author.profilePhoto || undefined,
        },
        attachments: Array.isArray(raw.attachments)
            ? raw.attachments.map((a: unknown) => {
                const att = asRecord(a)
                return {
                    id: getId(att),
                    name: String(att.name || att.fileName || 'file'),
                    url: String(att.url || att.fileUrl || ''),
                }
            })
            : undefined,
    }
}

// =========================================================
// UI ATOMS
// =========================================================

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

function ClientStatusBadge({
    status,
}: {
    status: WorkClient['status']
}) {
    const styles = {
        Active:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        Inactive:
            'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles[status]}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
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

// =========================================================
// MAIN PAGE
// =========================================================

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

    // ---- Client drawer state ----
    const [clientDrawerOpen, setClientDrawerOpen] =
        useState(false)
    const [workClient, setWorkClient] =
        useState<WorkClient | null>(null)
    const [clientLoading, setClientLoading] =
        useState(false)
    const [clientError, setClientError] =
        useState<string | null>(null)

    // =====================================================
    // GET /lawyer-works/work
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
                            `/lawyer-works/work/${workId}/activity`
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
    // GET /lawyer-works/:workId/client
    // =====================================================

    const fetchWorkClient = useCallback(
        async (workId: string) => {
            if (!workId) {
                setWorkClient(null)
                return
            }

            try {
                setClientLoading(true)
                setClientError(null)

                const response = await apiRequest<
                    ApiResponse<unknown>
                >(`/lawyer-works/${workId}/client`)

                const raw = extractWorkClient(response)
                const normalized = normalizeWorkClient(raw)

                setWorkClient(normalized)
            } catch (err) {
                console.error(
                    'Fetch work client error:',
                    err
                )
                setWorkClient(null)
                setClientError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to fetch client.'
                )
            } finally {
                setClientLoading(false)
            }
        },
        []
    )

    // =====================================================
    // SELECT WORK (no more detail API call — uses list item)
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

            await fetchWorkActivity(
                workId
            )
        },
        [
            fetchWorkActivity,
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

            setItems(
                (current) =>
                    current.map(
                        (item) =>
                            item.id ===
                                selectedId
                                ? {
                                    ...item,
                                    status,
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
    // SYNC SELECTED ITEM FROM LIST + LOAD ACTIVITY
    // =====================================================

    useEffect(() => {
        if (!selectedId) {
            setSelectedItem(
                null
            )
            setActivities([])
            return
        }

        const listItem =
            items.find(
                (item) =>
                    item.id ===
                    selectedId
            ) || null

        setSelectedItem(
            listItem
        )

        fetchWorkActivity(
            selectedId
        )
    }, [
        selectedId,
        items,
        fetchWorkActivity,
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
                                item.priority === 'High' ||
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
                    setSelectedId(nextId)
                    await fetchWorkActivity(
                        nextId
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

    const handleViewClient = async () => {
        if (!selectedItem?.id) return

        setClientDrawerOpen(true)
        setWorkClient(null)
        setClientError(null)

        await fetchWorkClient(selectedItem.id)
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
                        />
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
                                />
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>

            {/* Client Details Drawer */}
            <AnimatePresence>
                {clientDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() =>
                                setClientDrawerOpen(false)
                            }
                            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{
                                type: 'tween',
                                duration: 0.3,
                            }}
                            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-white/[0.08] bg-[#08090c] shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                                        <Building2 className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Client Details
                                        </h3>
                                        <p className="text-[11px] text-zinc-600">
                                            Business assigned to
                                            this work item
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setClientDrawerOpen(
                                            false
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {clientLoading ? (
                                    <div className="flex min-h-[400px] items-center justify-center">
                                        <div className="text-center">
                                            <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-400" />
                                            <p className="mt-3 text-xs text-zinc-500">
                                                Loading client
                                                details...
                                            </p>
                                        </div>
                                    </div>
                                ) : clientError ? (
                                    <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
                                        <AlertCircle className="h-8 w-8 text-red-400" />
                                        <p className="mt-4 text-sm font-medium text-zinc-300">
                                            Unable to load client
                                        </p>
                                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                                            {clientError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                selectedItem?.id &&
                                                fetchWorkClient(
                                                    selectedItem.id
                                                )
                                            }
                                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.06]"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            Retry
                                        </button>
                                    </div>
                                ) : workClient ? (
                                    <ClientDrawerContent
                                        client={workClient}
                                    />
                                ) : (
                                    <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
                                        <Building2 className="h-8 w-8 text-zinc-700" />
                                        <p className="mt-4 text-sm text-zinc-400">
                                            No client data
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

// =========================================================
// WORK DETAILS PANEL
// =========================================================

function WorkDetails({
    item,
    activities,
    activityLoading,
    activityError,
    statusUpdating,
    onStatusChange,
    onViewClient,
}: {
    item: WorkItem | null
    activities: WorkActivity[]
    activityLoading: boolean
    activityError: string | null
    statusUpdating: boolean
    onStatusChange: (status: WorkStatus) => void
    onViewClient: () => void
}) {
    const [activeTab, setActiveTab] = useState<DetailTab>('overview')

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

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
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
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                {(
                    [
                        { key: 'overview', label: 'Overview', icon: History },
                        { key: 'documents', label: 'Documents', icon: FileText },
                        { key: 'comments', label: 'Comments', icon: MessageSquare },
                    ] as const
                ).map((tab) => {
                    const Icon = tab.icon
                    const active = activeTab === tab.key
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition ${active
                                ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-400/20'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                >
                    {activeTab === 'overview' && (
                        <>
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
                        </>
                    )}

                    {activeTab === 'documents' && (
                        <DocumentsPanel
                            workId={item.id}
                            sourceId={item.sourceId}
                            sourceType={item.sourceType}
                        />
                    )}

                    {activeTab === 'comments' && (
                        <CommentsPanel
                            workId={item.id}
                            sourceId={item.sourceId}
                            sourceType={item.sourceType}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    )
}

// =========================================================
// DOCUMENTS PANEL
// =========================================================

function DocumentsPanel({
    workId,
    sourceId,
    sourceType,
}: {
    workId: string
    sourceId?: string | null
    sourceType?: string | null
}) {
    // Documents are tied to the original source (legal request) entity,
    // not the work item itself. Fall back to workId only if no source exists.
    const requestId = sourceId || workId

    const [documents, setDocuments] = useState<WorkDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragOver, setDragOver] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchDocuments = useCallback(async () => {
        if (!requestId) {
            setDocuments([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await apiRequest<ApiResponse<unknown>>(
                `/legal-requests/${requestId}/attachments`
            )

            setDocuments(extractDocumentList(response).map(normalizeDocument))
        } catch (err) {
            console.error('Fetch documents error:', err)
            setError(
                err instanceof Error ? err.message : 'Failed to fetch documents.'
            )
            setDocuments([])
        } finally {
            setLoading(false)
        }
    }, [requestId])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    const uploadFiles = useCallback(
        async (files: FileList | File[]) => {
            const list = Array.from(files)
            if (!list.length || !requestId) return

            setUploading(true)
            setUploadProgress(0)
            setError(null)

            try {
                for (let i = 0; i < list.length; i++) {
                    const file = list[i]
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('name', file.name)

                    await apiRequest<ApiResponse<unknown>>(
                        `/legal-requests/${requestId}/attachments`,
                        {
                            method: 'POST',
                            body: formData,
                        }
                    )

                    setUploadProgress(
                        Math.round(((i + 1) / list.length) * 100)
                    )
                }

                await fetchDocuments()
            } catch (err) {
                console.error('Upload document error:', err)
                setError(
                    err instanceof Error ? err.message : 'Upload failed.'
                )
            } finally {
                setUploading(false)
                setUploadProgress(0)
            }
        },
        [requestId, fetchDocuments]
    )

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            uploadFiles(e.target.files)
            e.target.value = ''
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files?.length) {
            uploadFiles(e.dataTransfer.files)
        }
    }

    const handleDelete = async (docId: string) => {
        if (!window.confirm('Delete this document?')) return
        if (!requestId) return

        try {
            setDeletingId(docId)
            await apiRequest(
                `/legal-requests/${requestId}/documents/${docId}`,
                { method: 'DELETE' }
            )
            setDocuments((curr) => curr.filter((d) => d.id !== docId))
        } catch (err) {
            console.error('Delete document error:', err)
            window.alert(
                err instanceof Error ? err.message : 'Failed to delete document.'
            )
        } finally {
            setDeletingId(null)
        }
    }

    // If no source request is linked, show a message instead of an empty panel
    if (!requestId) {
        return (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/[0.08]">
                        <FileText className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Documents</h3>
                        <p className="text-xs text-zinc-600">
                            Upload and manage files for this work item
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.015] p-6 text-center text-xs text-zinc-700">
                    Documents are only available for work items linked to a request.
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/[0.08]">
                    <FileText className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Documents</h3>
                    <p className="text-xs text-zinc-600">
                        Upload and manage files for this work item
                    </p>
                </div>
                <span className="ml-auto text-xs text-zinc-600">
                    {documents.length} file{documents.length === 1 ? '' : 's'}
                </span>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`mt-5 rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver
                    ? 'border-blue-400/40 bg-blue-400/[0.04]'
                    : 'border-white/[0.08] bg-white/[0.01]'
                    }`}
            >
                <input
                    id={`doc-upload-${requestId}`}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={uploading}
                />

                <Upload className="mx-auto h-6 w-6 text-zinc-600" />

                <p className="mt-3 text-xs text-zinc-400">
                    Drag &amp; drop files here, or{' '}
                    <label
                        htmlFor={`doc-upload-${requestId}`}
                        className="cursor-pointer text-blue-400 underline underline-offset-2"
                    >
                        browse
                    </label>
                </p>

                <p className="mt-1 text-[10px] text-zinc-700">
                    PDF, DOCX, images and other legal documents
                </p>

                {uploading && (
                    <div className="mt-4">
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                            <div
                                className="h-full rounded-full bg-blue-400 transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-zinc-500">
                            Uploading… {uploadProgress}%
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.03] px-3 py-2 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={fetchDocuments}
                        className="ml-auto underline underline-offset-2"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* List */}
            <div className="mt-5">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-6 text-center text-xs text-zinc-700">
                        No documents uploaded yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-white/[0.12]"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-400/[0.08]">
                                    <FileText className="h-4 w-4 text-violet-400" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-white">
                                        {doc.name}
                                    </p>
                                    <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-zinc-600">
                                        <span>{formatFileSize(doc.fileSize)}</span>
                                        <span>•</span>
                                        <span>{formatDateTime(doc.uploadedAt)}</span>
                                        {doc.uploadedBy?.fullName && (
                                            <>
                                                <span>•</span>
                                                <span>{doc.uploadedBy.fullName}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    {doc.fileUrl && (
                                        <a
                                            href={doc.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                                            title="Download"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deletingId === doc.id}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                        title="Delete"
                                    >
                                        {deletingId === doc.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// =========================================================
// COMMENTS PANEL
// =========================================================

function CommentsPanel({
    workId,
    sourceId,
    sourceType,
}: {
    workId: string
    sourceId?: string | null
    sourceType?: string | null
}) {
    // Comments are tied to the original source (request) entity,
    // not the work item itself. Fall back to workId only if no source exists.
    const requestId = sourceId || workId

    const [comments, setComments] = useState<WorkComment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState('')
    const [posting, setPosting] = useState(false)
    const bottomRef = useRef<HTMLDivElement | null>(null)

    const fetchComments = useCallback(async () => {
        if (!requestId) {
            setComments([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await apiRequest<ApiResponse<unknown>>(
                `/legal-requests/${requestId}/comments`
            )

            setComments(extractCommentList(response).map(normalizeComment))
        } catch (err) {
            console.error('Fetch comments error:', err)
            setError(
                err instanceof Error ? err.message : 'Failed to fetch comments.'
            )
            setComments([])
        } finally {
            setLoading(false)
        }
    }, [requestId])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    const handlePost = async () => {
        const trimmed = message.trim()
        if (!trimmed || posting || !requestId) return

        try {
            setPosting(true)
            setError(null)

            const response = await apiRequest<ApiResponse<unknown>>(
                `/legal-requests/${requestId}/comments`,
                {
                    method: 'POST',
                    body: JSON.stringify({ message: trimmed }),
                }
            )

            const rawComment = extractSingleComment(response)
            const newComment = normalizeComment(rawComment)

            // Fall back to a locally-built comment if the API
            // didn't return a well-formed comment object.
            if (!newComment.id || !newComment.message) {
                setComments((curr) => [
                    ...curr,
                    {
                        id: `local-${Date.now()}`,
                        message: trimmed,
                        createdAt: new Date().toISOString(),
                    },
                ])
            } else {
                setComments((curr) => [...curr, newComment])
            }

            setMessage('')

            // Scroll to newest
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
            })
        } catch (err) {
            console.error('Post comment error:', err)
            setError(
                err instanceof Error ? err.message : 'Failed to post comment.'
            )
        } finally {
            setPosting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handlePost()
        }
    }

    // If no source request is linked, show a message instead of an empty thread
    if (!requestId) {
        return (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/[0.08]">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Comments</h3>
                        <p className="text-xs text-zinc-600">
                            Discussion thread for this work item
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.015] p-6 text-center text-xs text-zinc-700">
                    Comments are only available for work items linked to a request.
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/[0.08]">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Comments</h3>
                    <p className="text-xs text-zinc-600">
                        Discussion thread for this work item
                    </p>
                </div>
                <span className="ml-auto text-xs text-zinc-600">
                    {comments.length} comment{comments.length === 1 ? '' : 's'}
                </span>
            </div>

            {/* List */}
            <div className="mt-5 max-h-[480px] space-y-3 overflow-y-auto pr-1">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-6 text-center text-xs text-zinc-700">
                        No comments yet. Start the conversation.
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-400/10 text-[10px] font-semibold text-blue-300">
                                {comment.author?.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={comment.author.avatar}
                                        alt={comment.author.fullName || 'User'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    getInitials(
                                        comment.author?.fullName ||
                                        comment.author?.email ||
                                        'User'
                                    )
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-2">
                                    <p className="text-xs font-medium text-white">
                                        {comment.author?.fullName || 'Anonymous'}
                                    </p>
                                    <span className="text-[10px] text-zinc-600">
                                        {formatRelativeTime(comment.createdAt)}
                                    </span>
                                </div>

                                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-300">
                                    {comment.message}
                                </p>

                                {comment.attachments &&
                                    comment.attachments.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {comment.attachments.map((att) => (
                                                <a
                                                    key={att.id}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    {att.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.03] px-3 py-2 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Composer */}
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a comment… (Ctrl/Cmd + Enter to send)"
                    rows={3}
                    disabled={posting}
                    className="w-full resize-none rounded-lg bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-zinc-700 disabled:opacity-50"
                />

                <div className="flex items-center justify-between px-1 pb-1">
                    <p className="text-[10px] text-zinc-700">
                        {message.length > 0
                            ? `${message.length} character${message.length === 1 ? '' : 's'}`
                            : 'Be respectful and stay on topic.'}
                    </p>

                    <button
                        type="button"
                        onClick={handlePost}
                        disabled={posting || !message.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/15 px-3 py-1.5 text-[11px] font-medium text-blue-400 ring-1 ring-blue-400/20 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {posting ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Posting…
                            </>
                        ) : (
                            <>
                                <Send className="h-3 w-3" />
                                Post
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

// =========================================================
// CLIENT DRAWER CONTENT
// =========================================================

function ClientDrawerContent({
    client,
}: {
    client: WorkClient
}) {
    return (
        <div className="space-y-5">
            {/* Hero */}
            <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-blue-500/[0.07]">
                    {client.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={client.logo}
                            alt={client.companyName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-lg font-bold text-blue-300">
                            {getInitials(client.companyName)}
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                            {client.companyName}
                        </h3>
                        <ClientStatusBadge
                            status={client.status}
                        />
                    </div>

                    {client.legalName &&
                        client.legalName !==
                        client.companyName && (
                            <p className="mt-0.5 text-xs text-zinc-500">
                                {client.legalName}
                            </p>
                        )}

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        {client.industry &&
                            client.industry !== '—' && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-zinc-600" />
                                    {client.industry}
                                </span>
                            )}
                        {client.companyType &&
                            client.companyType !== '—' && (
                                <span className="inline-flex items-center gap-1.5">
                                    <FileCheck2 className="h-3.5 w-3.5 text-zinc-600" />
                                    {client.companyType}
                                </span>
                            )}
                    </div>
                </div>
            </div>

            {/* Contact row */}
            <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile
                    icon={Mail}
                    label="Email"
                    value={client.email}
                />
                <InfoTile
                    icon={Phone}
                    label="Phone"
                    value={client.phone}
                />
                <InfoTile
                    icon={Globe}
                    label="Website"
                    value={client.website}
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                    label="Open Work"
                    value={client.stats.openWork}
                />
                <StatTile
                    label="Contracts"
                    value={client.stats.contracts}
                />
                <StatTile
                    label="Compliance"
                    value={client.stats.compliance}
                />
                <StatTile
                    label="Documents"
                    value={client.stats.documents}
                />
            </div>

            {/* Legal health */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                        <ShieldCheck className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-white">
                            Legal Health
                        </p>
                        <p className="text-[11px] text-zinc-600">
                            Overall legal readiness
                        </p>
                    </div>
                    <span className="ml-auto text-sm font-semibold text-white">
                        {client.legalHealthScore}/100
                    </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{
                            width: `${Math.min(
                                100,
                                Math.max(
                                    0,
                                    client.legalHealthScore
                                )
                            )}%`,
                        }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${client.legalHealthScore >= 80
                            ? 'bg-emerald-400'
                            : client.legalHealthScore >= 60
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                    />
                </div>
            </div>

            {/* Primary contact */}
            {client.primaryContact.fullName &&
                client.primaryContact.fullName !== '—' && (
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                                <UserRound className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-white">
                                    Primary Contact
                                </p>
                                <p className="text-[11px] text-zinc-600">
                                    Client-side point of contact
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-white">
                                {client.primaryContact.fullName}
                            </p>
                            {client.primaryContact
                                .designation &&
                                client.primaryContact
                                    .designation !== '—' && (
                                    <p className="text-xs text-zinc-500">
                                        {
                                            client
                                                .primaryContact
                                                .designation
                                        }
                                    </p>
                                )}
                            <div className="mt-3 flex flex-col gap-1.5 text-xs text-zinc-500">
                                {client.primaryContact.email &&
                                    client.primaryContact
                                        .email !== '—' && (
                                        <span className="inline-flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5" />
                                            {
                                                client
                                                    .primaryContact
                                                    .email
                                            }
                                        </span>
                                    )}
                                {client.primaryContact.phone &&
                                    client.primaryContact
                                        .phone !== '—' && (
                                        <span className="inline-flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5" />
                                            {
                                                client
                                                    .primaryContact
                                                    .phone
                                            }
                                        </span>
                                    )}
                            </div>
                        </div>
                    </div>
                )}

            {/* Business needs */}
            {client.businessNeeds.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                            <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white">
                                Legal Areas
                            </p>
                            <p className="text-[11px] text-zinc-600">
                                Areas of legal work for this client
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {client.businessNeeds.map((area) => (
                            <span
                                key={area}
                                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] text-zinc-300"
                            >
                                {area}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Address */}
            {(client.address.city &&
                client.address.city !== '—') ||
                (client.address.state &&
                    client.address.state !== '—') ? (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                            <MapPin className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white">
                                Company Address
                            </p>
                            <p className="text-[11px] text-zinc-600">
                                Registered business location
                            </p>
                        </div>
                    </div>

                    <div className="text-sm text-zinc-400">
                        {client.address.street && (
                            <p>{client.address.street}</p>
                        )}
                        <p>
                            {client.address.city},{' '}
                            {client.address.state}
                        </p>
                        <p className="mt-1 text-xs text-zinc-600">
                            {client.address.country}{' '}
                            {client.address.pincode}
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

function InfoTile({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
                <Icon className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    {label}
                </p>
                <p className="mt-0.5 break-words text-xs text-zinc-300">
                    {value || '—'}
                </p>
            </div>
        </div>
    )
}

function StatTile({
    label,
    value,
}: {
    label: string
    value: number
}) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                {label}
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
                {value}
            </p>
        </div>
    )
}

// =========================================================
// MISC
// =========================================================

function BriefcaseIcon() {
    return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10">
            <FileCheck2 className="h-5 w-5 text-blue-400" />
        </div>
    )
}