'use client'

import {
    useEffect,
    useState,
} from 'react'

import {
    ArrowLeft,
    CalendarDays,
    FileText,
    Loader2,
    Download,
    ExternalLink,
} from 'lucide-react'

import { useParams, useRouter } from 'next/navigation'

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1'
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

    const requestId = String(
        params.requestId || ''
    )

    const [request, setRequest] =
        useState<LegalRequest | null>(null)

    const [attachments, setAttachments] =
        useState<Attachment[]>([])

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')
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

                // Attachments
                const attachmentResponse =
                    await fetch(
                        `${API_BASE_URL}/legal-requests/${requestId}/attachments`,
                        {
                            method: 'GET',
                            headers,
                            cache: 'no-store',
                        }
                    )

                const attachmentResult =
                    await attachmentResponse.json()

                if (!attachmentResponse.ok) {
                    throw new Error(
                        attachmentResult?.message ||
                        'Failed to fetch attachments.'
                    )
                }

                setAttachments(
                    Array.isArray(
                        attachmentResult?.data
                    )
                        ? attachmentResult.data
                        : []
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
    }, [requestId])

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
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Supporting Documents
                            </h2>

                            <p className="mt-1 text-xs text-slate-600">
                                Documents attached to this
                                legal request
                            </p>
                        </div>

                        <span className="text-xs text-slate-600">
                            {attachments.length}{' '}
                            file
                            {attachments.length !== 1
                                ? 's'
                                : ''}
                        </span>
                    </div>

                    {attachments.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.015] p-8 text-center">
                            <FileText className="mx-auto h-7 w-7 text-slate-700" />

                            <p className="mt-3 text-xs text-slate-600">
                                No attachments found.
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

                    {/* Comment list */}
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

                    {/* Add comment */}
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