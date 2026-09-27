'use client'

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    ArrowLeft,
    CalendarDays,
    FileText,
    Loader2,
    Download,
    ExternalLink,
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react'

import { useParams, useRouter } from 'next/navigation'

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

interface LegalRequest {
    _id: string
    requestNumber?: string
    title: string
    category: string
    description: string
    additionalInformation?: string
    priority: string
    deadline?: string | null
    preferredProfessionalType?: string
    status: string
    createdAt?: string
    updatedAt?: string

    assignedTo?: {
        _id?: string
        fullName?: string
        email?: string
    } | null

    business?: {
        _id?: string
        companyName?: string
        legalName?: string
    } | null
}

interface Attachment {
    _id: string
    originalName: string
    fileName: string
    storageKey: string
    mimeType: string
    fileSize: number
    uploadedBy?: string
    uploadedAt?: string
    downloadUrl?: string | null
}

interface Comment {
    _id: string
    message: string
    authorRole?: string
    isInternal?: boolean
    isEdited?: boolean
    createdAt?: string

    author?: {
        _id?: string
        fullName?: string
        email?: string
        role?: string
        profilePhoto?: string
        avatar?: string
    } | null
}

function getToken() {
    if (typeof window === 'undefined') {
        return ''
    }

    return (
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        ''
    )
}

function formatDate(value?: string | null) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return '—'
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatFileSize(bytes: number) {
    if (!bytes) return '—'

    if (bytes < 1024) {
        return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function LegalRequestDetailPage() {
    const router = useRouter()

    const params = useParams()
    const [comments, setComments] = useState<Comment[]>([])

    const [commentText, setCommentText] = useState('')

    const [commentsLoading, setCommentsLoading] = useState(true)

    const [commentPosting, setCommentPosting] = useState(false)

    const [commentsError, setCommentsError] = useState('')

    const requestId = String(params.requestId || '')

    const [request, setRequest] =
        useState<LegalRequest | null>(null)

    const [attachments, setAttachments] =
        useState<Attachment[]>([])

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')

    // ---- Upload state ----
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [uploadSuccess, setUploadSuccess] = useState('')
    const [uploadProgress, setUploadProgress] = useState<
        number | null
    >(null)

    const fetchComments = async () => {
        try {
            setCommentsLoading(true)
            setCommentsError('')

            const token = getToken()

            const response = await fetch(
                `${API_BASE_URL}/legal-requests/${requestId}/comments`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token
                            ? {
                                Authorization:
                                    `Bearer ${token}`,
                            }
                            : {}),
                    },
                    cache: 'no-store',
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    'Failed to fetch comments.'
                )
            }

            setComments(
                Array.isArray(result?.data)
                    ? result.data
                    : []
            )
        } catch (error) {
            console.error(
                'Fetch comments error:',
                error
            )

            setCommentsError(
                error instanceof Error
                    ? error.message
                    : 'Failed to fetch comments.'
            )

            setComments([])
        } finally {
            setCommentsLoading(false)
        }
    }

    const fetchAttachments = useCallback(async () => {
        try {
            const token = getToken()

            const response = await fetch(
                `${API_BASE_URL}/legal-requests/${requestId}/attachments`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token
                            ? {
                                Authorization:
                                    `Bearer ${token}`,
                            }
                            : {}),
                    },
                    cache: 'no-store',
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    'Failed to fetch attachments.'
                )
            }

            setAttachments(
                Array.isArray(result?.data)
                    ? result.data
                    : []
            )
        } catch (error) {
            console.error(
                'Fetch attachments error:',
                error
            )
            setAttachments([])
        }
    }, [requestId])

    useEffect(() => {
        if (!requestId) return

        const loadPage = async () => {
            try {
                setLoading(true)
                setError('')

                const token = getToken()

                const headers: HeadersInit = {
                    'Content-Type':
                        'application/json',
                }

                if (token) {
                    headers.Authorization =
                        `Bearer ${token}`
                }

                // Request
                const requestResponse =
                    await fetch(
                        `${API_BASE_URL}/legal-requests/${requestId}`,
                        {
                            method: 'GET',
                            headers,
                            cache: 'no-store',
                        }
                    )

                const requestResult =
                    await requestResponse.json()

                if (!requestResponse.ok) {
                    throw new Error(
                        requestResult?.message ||
                        'Failed to fetch legal request.'
                    )
                }

                setRequest(
                    requestResult?.data ||
                    requestResult?.request ||
                    requestResult
                )

                // Comments
                const commentResponse =
                    await fetch(
                        `${API_BASE_URL}/legal-requests/${requestId}/comments`,
                        {
                            method: 'GET',
                            headers,
                            cache: 'no-store',
                        }
                    )

                const commentResult =
                    await commentResponse.json()

                if (!commentResponse.ok) {
                    throw new Error(
                        commentResult?.message ||
                        'Failed to fetch comments.'
                    )
                }

                setComments(
                    Array.isArray(commentResult?.data)
                        ? commentResult.data
                        : []
                )

                // Attachments
                await fetchAttachments()
            } catch (error) {
                console.error(
                    'Legal request detail error:',
                    error
                )

                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load legal request.'
                )
            } finally {
                setLoading(false)
                setCommentsLoading(false)
            }
        }

        void loadPage()
    }, [requestId, fetchAttachments])

    const addComment = async () => {
        const message = commentText.trim()

        if (!message) return

        try {
            setCommentPosting(true)
            setCommentsError('')

            const token = getToken()

            const response = await fetch(
                `${API_BASE_URL}/legal-requests/${requestId}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                        ...(token
                            ? {
                                Authorization:
                                    `Bearer ${token}`,
                            }
                            : {}),
                    },
                    body: JSON.stringify({
                        message,
                        isInternal: false,
                    }),
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    'Failed to add comment.'
                )
            }

            const newComment =
                result?.data ||
                result?.comment ||
                result

            setComments((current) => [
                ...current,
                newComment,
            ])

            setCommentText('')
        } catch (error) {
            console.error(
                'Add comment error:',
                error
            )

            setCommentsError(
                error instanceof Error
                    ? error.message
                    : 'Failed to add comment.'
            )
        } finally {
            setCommentPosting(false)
        }
    }

    // ---- Upload document (multer on backend) ----
    // POST /legal-requests/:id/attachments
    // multipart/form-data with field name "file"
    const uploadDocument = async (file: File) => {
        if (!file || !requestId) return

        const MAX_MB = 25
        if (file.size > MAX_MB * 1024 * 1024) {
            setUploadError(
                `File is too large. Max ${MAX_MB} MB allowed.`
            )
            return
        }

        try {
            setUploading(true)
            setUploadError('')
            setUploadSuccess('')
            setUploadProgress(0)

            const token = getToken()

            const formData = new FormData()
            formData.append('file', file)

            // Use XHR so we get upload progress events
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest()

                xhr.open(
                    'POST',
                    `${API_BASE_URL}/legal-requests/${encodeURIComponent(
                        requestId
                    )}/attachments`
                )

                if (token) {
                    xhr.setRequestHeader(
                        'Authorization',
                        `Bearer ${token}`
                    )
                }

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const pct = Math.round(
                            (event.loaded / event.total) * 100
                        )
                        setUploadProgress(pct)
                    }
                }

                xhr.onload = () => {
                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {
                        resolve()
                    } else {
                        let message = `Upload failed (${xhr.status})`
                        try {
                            const parsed = JSON.parse(
                                xhr.responseText
                            )
                            message =
                                parsed?.message || message
                        } catch {
                            // ignore
                        }
                        reject(new Error(message))
                    }
                }

                xhr.onerror = () =>
                    reject(new Error('Network error'))

                xhr.send(formData)
            })

            setUploadProgress(100)
            setUploadSuccess(
                `"${file.name}" uploaded successfully.`
            )

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            await fetchAttachments()

            setTimeout(() => {
                setUploadSuccess('')
                setUploadProgress(null)
            }, 3000)
        } catch (error) {
            console.error(
                'Upload document error:',
                error
            )

            setUploadError(
                error instanceof Error
                    ? error.message
                    : 'Failed to upload document.'
            )

            setUploadProgress(null)
        } finally {
            setUploading(false)
        }
    }

    const handleFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (file) {
            void uploadDocument(file)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#070707] text-white">
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-7 w-7 animate-spin text-amber-400" />

                        <p className="mt-3 text-sm text-slate-500">
                            Loading legal request...
                        </p>
                    </div>
                </div>
            </main>
        )
    }

    if (error || !request) {
        return (
            <main className="min-h-screen bg-[#070707] text-white">
                <div className="mx-auto max-w-4xl px-4 py-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-6 text-sm text-red-300">
                        {error ||
                            'Legal request not found.'}
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#070707] text-white">
            <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="border-b border-white/[0.06] pb-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mb-5 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Legal Requests
                    </button>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400">
                                {request.requestNumber ||
                                    'Legal Request'}
                            </p>

                            <h1 className="mt-2 text-2xl font-semibold">
                                {request.title}
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                {request.description}
                            </p>
                        </div>

                        <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs text-violet-300">
                            {request.status}
                        </span>
                    </div>
                </div>

                {/* Request information */}
                <section className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Category
                        </p>

                        <p className="mt-2 text-sm text-white">
                            {request.category}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Priority
                        </p>

                        <p className="mt-2 text-sm capitalize text-white">
                            {request.priority}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Deadline
                        </p>

                        <div className="mt-2 flex items-center gap-2 text-sm text-white">
                            <CalendarDays className="h-4 w-4 text-slate-500" />
                            {formatDate(
                                request.deadline
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Assigned Professional
                        </p>

                        <p className="mt-2 text-sm text-white">
                            {request.assignedTo
                                ?.fullName ||
                                'Not assigned'}
                        </p>
                    </div>
                </section>

                {/* Additional information */}
                {request.additionalInformation && (
                    <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <h2 className="text-sm font-semibold">
                            Additional Information
                        </h2>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                            {
                                request.additionalInformation
                            }
                        </p>
                    </section>
                )}

                {/* Attachments */}
                <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Supporting Documents
                            </h2>

                            <p className="mt-1 text-xs text-slate-600">
                                Documents attached to this
                                legal request
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-600">
                                {attachments.length}{' '}
                                file
                                {attachments.length !== 1
                                    ? 's'
                                    : ''}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={uploading}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-3.5 w-3.5" />
                                        Upload Document
                                    </>
                                )}
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>

                    {/* Upload progress */}
                    {uploadProgress !== null && (
                        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-400" />
                                    <p className="truncate text-xs text-amber-200">
                                        Uploading document...
                                    </p>
                                </div>
                                <span className="shrink-0 text-xs font-medium text-amber-300">
                                    {uploadProgress}%
                                </span>
                            </div>

                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                                <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-200"
                                    style={{
                                        width: `${uploadProgress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {uploadSuccess && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-3 text-xs text-emerald-300">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span className="flex-1">
                                {uploadSuccess}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setUploadSuccess('')
                                }
                                className="rounded p-0.5 hover:bg-white/[0.05]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    {uploadError && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-3 text-xs text-red-300">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="flex-1">
                                {uploadError}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setUploadError('')
                                }
                                className="rounded p-0.5 hover:bg-white/[0.05]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    {attachments.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.015] p-8 text-center">
                            <FileText className="mx-auto h-7 w-7 text-slate-700" />

                            <p className="mt-3 text-xs text-slate-600">
                                No attachments yet. Upload
                                the first document.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 space-y-2">
                            {attachments.map(
                                (attachment) => (
                                    <div
                                        key={
                                            attachment._id
                                        }
                                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                                            <FileText className="h-4 w-4 text-amber-400" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium text-white">
                                                {
                                                    attachment.originalName
                                                }
                                            </p>

                                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-600">
                                                <span>
                                                    {formatFileSize(
                                                        attachment.fileSize
                                                    )}
                                                </span>

                                                <span>
                                                    •
                                                </span>

                                                <span>
                                                    {formatDate(
                                                        attachment.uploadedAt
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {attachment.downloadUrl && (
                                            <div className="flex shrink-0 gap-1">
                                                <a
                                                    href={
                                                        attachment.downloadUrl
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-slate-400 hover:bg-white/[0.05] hover:text-white"
                                                    title="View document"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>

                                                <a
                                                    href={
                                                        attachment.downloadUrl
                                                    }
                                                    download={
                                                        attachment.fileName
                                                    }
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-slate-400 hover:bg-white/[0.05] hover:text-white"
                                                    title="Download document"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>

                {/* Comments */}
                <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                    <div>
                        <h2 className="text-sm font-semibold">
                            Comments
                        </h2>

                        <p className="mt-1 text-xs text-slate-600">
                            Communicate with the legal professional
                            handling this request.
                        </p>
                    </div>

                    {commentsError && (
                        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-3 text-xs text-red-300">
                            {commentsError}
                        </div>
                    )}

                    <div className="mt-5 space-y-3">
                        {commentsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
                                <p className="text-xs text-slate-600">
                                    No comments yet.
                                </p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div
                                    key={comment._id}
                                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-xs font-semibold text-amber-400">
                                            {(
                                                comment.author
                                                    ?.fullName ||
                                                'U'
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-medium text-white">
                                                    {
                                                        comment.author
                                                            ?.fullName ||
                                                        'Unknown User'
                                                    }
                                                </span>

                                                {comment.authorRole && (
                                                    <span className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[9px] capitalize text-slate-500">
                                                        {
                                                            comment.authorRole
                                                        }
                                                    </span>
                                                )}

                                                <span className="text-[10px] text-slate-700">
                                                    {formatDate(
                                                        comment.createdAt
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                                {comment.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-5 border-t border-white/[0.06] pt-5">
                        <textarea
                            value={commentText}
                            onChange={(e) =>
                                setCommentText(e.target.value)
                            }
                            rows={4}
                            placeholder="Write a comment..."
                            className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-amber-400/30"
                        />

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={addComment}
                                disabled={
                                    commentPosting ||
                                    !commentText.trim()
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {commentPosting ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Add Comment'
                                )}
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    )
}