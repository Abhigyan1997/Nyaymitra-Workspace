// app/dashboard/contracts/[id]/page.tsx

"use client"

import * as React from "react"

import {
    useCallback,
    useEffect,
    useState,
} from "react"

import Link from "next/link"

import {
    ArrowLeft,
    CalendarDays,
    Download,
    FileText,
    Loader2,
    MoreHorizontal,
    Pencil,
    RefreshCw,
    ShieldCheck,
    Trash2,
    Upload,
    X,
} from "lucide-react"

import {
    CommentComposer,
    ContractActivity,
    ContractDocuments,
    ContractOverview,
    PriorityBadge,
    StatusBadge,
} from "@/components/contracts/contracts"

import {
    contractService,
    type Contract,
    type ContractActivity as ApiContractActivity,
    type ContractComment,
    type ContractRequest,
    type ContractType,
    type ContractPriority,
    type ContractStatus,
} from "@/lib/services/contract.service"

import {
    formatContractDate,
    getContractVersionLabel,
} from "@/lib/contracts"

import { premiumToast } from "@/lib/premium-toast"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type PageState =
    | "loading"
    | "contract"
    | "request"
    | "not-found"
    | "error"

type TabKey =
    | "overview"
    | "versions"
    | "documents"
    | "activity"

type DetailComment = {
    _id?: string
    id?: string
    message?: string
    comment?: string
    text?: string
    content?: string
    createdAt?: string

    user?: unknown
    createdBy?: unknown
    author?: unknown

    authorRole?: string
    isInternal?: boolean
    attachments?: unknown[]
}

type FinalFileType = "pdf" | "docx" | "signedPdf"

interface EditFormState {
    title: string
    contractType: ContractType | ""
    counterpartyName: string
    counterpartyCompany: string
    counterpartyEmail: string
    counterpartyPhone: string
    counterpartyAddress: string
    description: string
    priority: ContractPriority | ""
    status: ContractStatus | ""
    effectiveDate: string
    expiryDate: string
    renewalDate: string
    contractValue: string
    currency: string
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CONTRACT_TYPE_OPTIONS: ContractType[] = [
    "NDA",
    "Employment Agreement",
    "Vendor Agreement",
    "Service Agreement",
    "Consulting Agreement",
    "Partnership Agreement",
    "Shareholder Agreement",
    "Lease Agreement",
    "MSA",
    "SLA",
    "Privacy Policy",
    "Terms & Conditions",
    "Website Policy",
    "Founders Agreement",
    "Investment Agreement",
    "Custom Contract",
    "Other",
]

const PRIORITY_OPTIONS: ContractPriority[] = [
    "Low",
    "Medium",
    "High",
    "Urgent",
]

const STATUS_OPTIONS: ContractStatus[] = [
    "Draft",
    "Internal Review",
    "Client Review",
    "Revision Requested",
    "Approved",
    "Pending Signature",
    "Executed",
    "Active",
    "Expired",
    "Terminated",
    "Archived",
]

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false
    }

    const message = error.message.toLowerCase()

    return (
        message.includes("404") ||
        message.includes("not found")
    )
}

function normalizeComments(
    comments: ContractComment[]
): DetailComment[] {
    if (!Array.isArray(comments)) {
        return []
    }

    return comments.map((c) => {
        const author = c.author

        return {
            _id: c._id,
            id: c._id,

            message: c.message,
            comment: c.message,
            text: c.message,
            content: c.message,

            createdAt: c.createdAt,

            author,
            user: author,
            createdBy: author,

            authorRole: c.authorRole,
            isInternal: c.isInternal,
            attachments: c.attachments ?? [],
        }
    })
}

function normalizeActivities(
    activities: ApiContractActivity[]
) {
    return activities as unknown as Array<{
        _id?: string
        id?: string
        action?: string
        event?: string
        type?: string
        title?: string
        label?: string
        description?: string
        detail?: string
        createdAt?: string
        date?: string
        performedBy?: unknown
        user?: unknown
    }>
}

function hasAnyFinalDocument(contract: Contract): boolean {
    const isPresent = (value: unknown): boolean => {
        if (!value) return false
        if (typeof value === "string") return value.length > 0
        if (typeof value === "object") return true
        return false
    }

    return (
        isPresent(contract.currentDocument) ||
        isPresent(contract.signedDocument)
    )
}

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value)
}

function formatBytes(bytes: number | undefined): string {
    if (!bytes || bytes <= 0) return "—"

    const units = ["B", "KB", "MB", "GB"]

    let value = bytes
    let unit = 0

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024
        unit += 1
    }

    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

function getDocumentDisplayName(doc: {
    name?: string
    originalName?: string
    fileName?: string
}): string {
    return (
        doc.originalName ||
        doc.fileName ||
        doc.name ||
        "Untitled document"
    )
}

function getDocumentSize(doc: {
    size?: number
    fileSize?: number
}): number | undefined {
    return doc.size ?? doc.fileSize
}

function toDateInputValue(value?: string | null): string {
    if (!value) return ""
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ""
    return d.toISOString().slice(0, 10)
}

function extractCounterparty(raw: unknown): {
    name: string
    company: string
    email: string
    phone: string
    address: string
} {
    if (!raw) {
        return {
            name: "",
            company: "",
            email: "",
            phone: "",
            address: "",
        }
    }

    if (typeof raw === "string") {
        return {
            name: raw,
            company: "",
            email: "",
            phone: "",
            address: "",
        }
    }

    const obj = raw as Record<string, unknown>

    return {
        name: String(obj.name ?? ""),
        company: String(obj.company ?? ""),
        email: String(obj.email ?? ""),
        phone: String(obj.phone ?? ""),
        address: String(obj.address ?? ""),
    }
}

function buildEditForm(contract: Contract): EditFormState {
    const cp = extractCounterparty(
        (contract as unknown as Record<string, unknown>)
            .counterparty
    )

    return {
        title: contract.title ?? "",
        contractType: contract.contractType ?? "",
        counterpartyName: cp.name,
        counterpartyCompany: cp.company,
        counterpartyEmail: cp.email,
        counterpartyPhone: cp.phone,
        counterpartyAddress: cp.address,
        description: contract.description ?? "",
        priority: contract.priority ?? "Medium",
        status: contract.status ?? "Draft",
        effectiveDate: toDateInputValue(contract.effectiveDate),
        expiryDate: toDateInputValue(contract.expiryDate),
        renewalDate: toDateInputValue(contract.renewalDate),
        contractValue:
            contract.contractValue !== undefined &&
                contract.contractValue !== null
                ? String(contract.contractValue)
                : "",
        currency: contract.currency ?? "INR",
    }
}

/* -------------------------------------------------------------------------- */
/* Final document download (R2)                                               */
/* -------------------------------------------------------------------------- */

const FINAL_FILE_CANDIDATES: FinalFileType[] = [
    "signedPdf",
    "pdf",
    "docx",
]

function buildFinalFilename(
    contractId: string,
    fileType: FinalFileType
): string {
    const ext = fileType === "docx" ? "docx" : "pdf"

    const suffix =
        fileType === "signedPdf"
            ? "signed"
            : fileType === "pdf"
                ? "final"
                : "source"

    return `contract-${contractId}-${suffix}.${ext}`
}

async function downloadFromR2(
    signedUrl: string,
    filename: string
): Promise<void> {
    const response = await fetch(signedUrl, {
        method: "GET",
        credentials: "omit",
        mode: "cors",
    })

    if (!response.ok) {
        throw new Error(
            `Failed to fetch file from R2 (${response.status} ${response.statusText})`
        )
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    try {
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = filename
        a.rel = "noopener noreferrer"
        document.body.appendChild(a)
        a.click()
        a.remove()
    } finally {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    }
}

function FinalDocumentButton({
    contractId,
    hasDocument,
}: {
    contractId: string
    hasDocument: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const download = async () => {
        if (!hasDocument || loading) return

        setLoading(true)
        setError(null)

        let lastError: unknown = null

        for (const fileType of FINAL_FILE_CANDIDATES) {
            try {
                const result =
                    await contractService.getFinalFileUrl(
                        contractId,
                        fileType
                    )

                if (!result?.url) {
                    continue
                }

                if (!isAbsoluteUrl(result.url)) {
                    throw new Error(
                        "Backend returned a non-absolute URL for the R2 object."
                    )
                }

                const filename = buildFinalFilename(
                    contractId,
                    fileType
                )

                await downloadFromR2(result.url, filename)

                setLoading(false)

                // ===== SUCCESS TOAST =====
                premiumToast.success('Download started', {
                    description: filename,
                })

                return
            } catch (err) {
                lastError = err
            }
        }

        setLoading(false)

        const message =
            lastError instanceof Error
                ? lastError.message
                : "No final document is available for this contract."

        setError(message)
        window.alert(message)

        // ===== ERROR TOAST =====
        premiumToast.error('Download failed', {
            description: message,
        })
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={download}
                disabled={!hasDocument || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title={
                    hasDocument
                        ? "Download final document"
                        : "No final document available yet"
                }
            >
                <Download className="size-4" />

                {loading ? "Preparing…" : "Download"}
            </button>

            {error && (
                <span className="max-w-[200px] text-right text-[11px] text-red-400">
                    {error}
                </span>
            )}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Edit modal                                                                 */
/* -------------------------------------------------------------------------- */

function ContractEditModal({
    contract,
    onClose,
    onSaved,
}: {
    contract: Contract
    onClose: () => void
    onSaved: (updated: Contract) => void
}) {
    const [form, setForm] = React.useState<EditFormState>(() =>
        buildEditForm(contract)
    )

    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const update = <K extends keyof EditFormState>(
        key: K,
        value: EditFormState[K]
    ) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }))
    }

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        if (!form.counterpartyName.trim()) {
            setError("Counterparty name is required.")

            premiumToast.warning('Missing information', {
                description: 'Counterparty name is required.',
            })

            return
        }

        try {
            setSaving(true)
            setError(null)

            const payload = {
                title: form.title.trim() || undefined,
                contractType: form.contractType || undefined,
                description: form.description,
                priority: form.priority || undefined,
                status: form.status || undefined,
                effectiveDate: form.effectiveDate || null,
                expiryDate: form.expiryDate || null,
                renewalDate: form.renewalDate || null,
                contractValue: form.contractValue
                    ? Number(form.contractValue)
                    : undefined,
                currency: form.currency || undefined,
                counterparty: {
                    name: form.counterpartyName.trim(),
                    company:
                        form.counterpartyCompany.trim() || undefined,
                    email:
                        form.counterpartyEmail.trim() || undefined,
                    phone:
                        form.counterpartyPhone.trim() || undefined,
                    address:
                        form.counterpartyAddress.trim() || undefined,
                },
            }

            const updated =
                await contractService.updateContract(
                    contract._id,
                    payload
                )

            onSaved(updated)
            onClose()

            // ===== SUCCESS TOAST =====
            premiumToast.success('Contract updated', {
                description: updated?.title
                    ? `Changes saved to "${updated.title}".`
                    : 'Your changes have been saved.',
            })
        } catch (err) {
            console.error("Update contract error:", err)

            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to update contract."

            setError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Update failed', {
                description: message,
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="my-8 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-zinc-800 px-5 py-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-400">
                            Edit Contract
                        </p>

                        <h2 className="mt-2 truncate text-lg font-semibold text-white">
                            {contract.title}
                        </h2>

                        <p className="mt-1 text-xs text-zinc-500">
                            {contract.contractNumber}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-5"
                >
                    <EditField label="Title">
                        <input
                            value={form.title}
                            onChange={(e) =>
                                update("title", e.target.value)
                            }
                            className="edit-input"
                        />
                    </EditField>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <EditField label="Contract type">
                            <select
                                value={form.contractType}
                                onChange={(e) =>
                                    update(
                                        "contractType",
                                        e.target.value as
                                        | ContractType
                                        | ""
                                    )
                                }
                                className="edit-input"
                            >
                                <option value="">Select type</option>
                                {CONTRACT_TYPE_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </EditField>

                        <EditField label="Priority">
                            <select
                                value={form.priority}
                                onChange={(e) =>
                                    update(
                                        "priority",
                                        e.target.value as
                                        | ContractPriority
                                        | ""
                                    )
                                }
                                className="edit-input"
                            >
                                <option value="">Select priority</option>
                                {PRIORITY_OPTIONS.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </EditField>

                        <EditField label="Status">
                            <select
                                value={form.status}
                                onChange={(e) =>
                                    update(
                                        "status",
                                        e.target.value as
                                        | ContractStatus
                                        | ""
                                    )
                                }
                                className="edit-input"
                            >
                                <option value="">Select status</option>
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </EditField>

                        <EditField label="Contract value">
                            <input
                                type="number"
                                min={0}
                                value={form.contractValue}
                                onChange={(e) =>
                                    update(
                                        "contractValue",
                                        e.target.value
                                    )
                                }
                                className="edit-input"
                            />
                        </EditField>

                        <EditField label="Currency">
                            <input
                                value={form.currency}
                                onChange={(e) =>
                                    update("currency", e.target.value)
                                }
                                className="edit-input"
                            />
                        </EditField>

                        <EditField label="Effective date">
                            <input
                                type="date"
                                value={form.effectiveDate}
                                onChange={(e) =>
                                    update(
                                        "effectiveDate",
                                        e.target.value
                                    )
                                }
                                className="edit-input"
                            />
                        </EditField>

                        <EditField label="Expiry date">
                            <input
                                type="date"
                                value={form.expiryDate}
                                onChange={(e) =>
                                    update(
                                        "expiryDate",
                                        e.target.value
                                    )
                                }
                                className="edit-input"
                            />
                        </EditField>

                        <EditField label="Renewal date">
                            <input
                                type="date"
                                value={form.renewalDate}
                                onChange={(e) =>
                                    update(
                                        "renewalDate",
                                        e.target.value
                                    )
                                }
                                className="edit-input"
                            />
                        </EditField>
                    </div>

                    {/* Counterparty section */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            Counterparty
                        </p>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <EditField label="Name *">
                                <input
                                    value={form.counterpartyName}
                                    onChange={(e) =>
                                        update(
                                            "counterpartyName",
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="edit-input"
                                />
                            </EditField>

                            <EditField label="Company">
                                <input
                                    value={form.counterpartyCompany}
                                    onChange={(e) =>
                                        update(
                                            "counterpartyCompany",
                                            e.target.value
                                        )
                                    }
                                    className="edit-input"
                                />
                            </EditField>

                            <EditField label="Email">
                                <input
                                    type="email"
                                    value={form.counterpartyEmail}
                                    onChange={(e) =>
                                        update(
                                            "counterpartyEmail",
                                            e.target.value
                                        )
                                    }
                                    className="edit-input"
                                />
                            </EditField>

                            <EditField label="Phone">
                                <input
                                    value={form.counterpartyPhone}
                                    onChange={(e) =>
                                        update(
                                            "counterpartyPhone",
                                            e.target.value
                                        )
                                    }
                                    className="edit-input"
                                />
                            </EditField>

                            <div className="sm:col-span-2">
                                <EditField label="Address">
                                    <input
                                        value={form.counterpartyAddress}
                                        onChange={(e) =>
                                            update(
                                                "counterpartyAddress",
                                                e.target.value
                                            )
                                        }
                                        className="edit-input"
                                    />
                                </EditField>
                            </div>
                        </div>
                    </div>

                    <EditField label="Description">
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) =>
                                update("description", e.target.value)
                            }
                            className="edit-input resize-none"
                        />
                    </EditField>

                    {error && (
                        <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:opacity-40"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>Save changes</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Scoped styles for the edit form */}
            <style jsx>{`
                :global(.edit-input) {
                    width: 100%;
                    height: 2.5rem;
                    padding: 0 0.75rem;
                    border-radius: 0.75rem;
                    border: 1px solid rgb(39 39 42);
                    background: rgb(24 24 27);
                    color: white;
                    font-size: 0.875rem;
                    outline: none;
                }
                :global(textarea.edit-input) {
                    height: auto;
                    padding: 0.5rem 0.75rem;
                    line-height: 1.5;
                }
                :global(.edit-input:focus) {
                    border-color: rgb(250 204 21 / 0.4);
                }
            `}</style>
        </div>
    )
}

function EditField({
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

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

const TAB_LABELS: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "versions", label: "Versions" },
    { key: "documents", label: "Documents" },
    { key: "activity", label: "Activity" },
]

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ContractDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const [id, setId] = useState<string | null>(null)

    const [contract, setContract] =
        useState<Contract | null>(null)

    const [request, setRequest] =
        useState<ContractRequest | null>(null)

    const [comments, setComments] =
        useState<DetailComment[]>([])

    const [activities, setActivities] =
        useState<ReturnType<typeof normalizeActivities>>([])

    const [pageState, setPageState] =
        useState<PageState>("loading")

    const [error, setError] =
        useState<string | null>(null)

    const [refreshing, setRefreshing] =
        useState(false)

    const [commentSubmitting, setCommentSubmitting] =
        useState(false)

    const [tab, setTab] = useState<TabKey>("overview")

    const [documentUploading, setDocumentUploading] =
        useState(false)

    const [documentError, setDocumentError] =
        useState<string | null>(null)

    // Inline edit modal state
    const [editOpen, setEditOpen] = useState(false)

    /* ---------------------------------------------------------------------- */
    /* Resolve route params                                                    */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true

        void params.then((resolvedParams) => {
            if (mounted) {
                setId(resolvedParams.id)
            }
        })

        return () => {
            mounted = false
        }
    }, [params])

    /* ---------------------------------------------------------------------- */
    /* Load contract/request                                                   */
    /* ---------------------------------------------------------------------- */

    const loadContract = useCallback(
        async (
            contractId: string,
            options?: { silent?: boolean }
        ) => {
            try {
                if (!options?.silent) {
                    setPageState("loading")
                }

                setError(null)

                try {
                    const actualContract =
                        await contractService.getContractById(
                            contractId
                        )

                    setContract(actualContract)
                    setRequest(null)
                    setPageState("contract")

                    const [
                        activityResult,
                        commentsResult,
                    ] = await Promise.allSettled([
                        contractService.getActivities(
                            actualContract._id
                        ),
                        contractService.getComments(
                            actualContract._id
                        ),
                    ])

                    if (activityResult.status === "fulfilled") {
                        setActivities(
                            normalizeActivities(
                                activityResult.value
                            )
                        )
                    } else {
                        console.warn(
                            "Failed to load contract activity:",
                            activityResult.reason
                        )
                        setActivities([])
                    }

                    if (commentsResult.status === "fulfilled") {
                        setComments(
                            normalizeComments(
                                commentsResult.value
                            )
                        )
                    } else {
                        console.warn(
                            "Failed to load contract comments:",
                            commentsResult.reason
                        )
                        setComments([])
                    }

                    return
                } catch (contractError) {
                    if (!isNotFoundError(contractError)) {
                        throw contractError
                    }
                }

                const actualRequest =
                    await contractService.getContractRequestById(
                        contractId
                    )

                setRequest(actualRequest)
                setContract(null)
                setActivities([])
                setComments([])
                setPageState("request")
            } catch (loadError) {
                console.error(
                    "Failed to load contract detail:",
                    loadError
                )

                const message =
                    loadError instanceof Error
                        ? loadError.message
                        : "Failed to load contract."

                setError(message)

                if (!options?.silent) {
                    setPageState("error")

                    // ===== ERROR TOAST =====
                    premiumToast.error('Could not load contract', {
                        description: message,
                    })
                }
            }
        },
        []
    )

    /* ---------------------------------------------------------------------- */
    /* Initial load                                                            */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (!id) return
        void loadContract(id)
    }, [id, loadContract])

    /* ---------------------------------------------------------------------- */
    /* Refresh                                                                 */
    /* ---------------------------------------------------------------------- */

    const refresh = async () => {
        if (!id || refreshing) return

        try {
            setRefreshing(true)
            await loadContract(id, { silent: true })

            // ===== SUCCESS TOAST =====
            premiumToast.success('Refreshed', {
                description: 'Latest contract data loaded.',
                duration: 2000,
            })
        } finally {
            setRefreshing(false)
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Add comment                                                             */
    /* ---------------------------------------------------------------------- */

    const handleAddComment = async (message: string) => {
        if (!contract) return

        try {
            setCommentSubmitting(true)

            const createdComment =
                await contractService.addComment(
                    contract._id,
                    message
                )

            const normalized = normalizeComments([
                createdComment as unknown as ContractComment,
            ])

            setComments((current) => [
                ...current,
                ...normalized,
            ])

            // ===== SUCCESS TOAST =====
            premiumToast.success('Comment posted', {
                description: 'Your comment was added to the thread.',
            })
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Failed to add comment.'

            // ===== ERROR TOAST =====
            premiumToast.error('Comment failed', {
                description: msg,
            })

            throw err
        } finally {
            setCommentSubmitting(false)
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Upload supporting document                                              */
    /* ---------------------------------------------------------------------- */

    const handleUploadDocument = async (file: File) => {
        if (!contract) return

        try {
            setDocumentUploading(true)
            setDocumentError(null)

            await contractService.uploadSupportingDocument(
                contract._id,
                file,
                "contract"
            )

            await loadContract(contract._id, { silent: true })

            // ===== SUCCESS TOAST =====
            premiumToast.success('Document uploaded', {
                description: file.name,
            })
        } catch (uploadErr) {
            console.error(
                "Failed to upload supporting document:",
                uploadErr
            )

            const message =
                uploadErr instanceof Error
                    ? uploadErr.message
                    : "Failed to upload document."

            setDocumentError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Upload failed', {
                description: message,
            })
        } finally {
            setDocumentUploading(false)
        }
    }

    /* ---------------------------------------------------------------------- */
    /* After edit save                                                         */
    /* ---------------------------------------------------------------------- */

    const handleContractSaved = (updated: Contract) => {
        setContract(updated)
    }

    /* ---------------------------------------------------------------------- */
    /* Loading                                                                 */
    /* ---------------------------------------------------------------------- */

    if (pageState === "loading" || !id) {
        return (
            <main className="contracts-theme flex min-h-screen items-center justify-center bg-black text-zinc-100">
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="size-2 animate-pulse rounded-full bg-yellow-400" />
                    Loading contract...
                </div>
            </main>
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Error                                                                   */
    /* ---------------------------------------------------------------------- */

    if (pageState === "error") {
        return (
            <main className="contracts-theme flex min-h-screen items-center justify-center bg-black p-6 text-zinc-100">
                <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-white">
                        Unable to load contract
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {error ??
                            "Something went wrong while loading this legal record."}
                    </p>

                    <div className="mt-5 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={refresh}
                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300"
                        >
                            <RefreshCw className="size-4" />
                            Try again
                        </button>

                        <Link
                            href="/dashboard/contracts"
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Request detail                                                          */
    /* ---------------------------------------------------------------------- */

    if (pageState === "request" && request) {
        return (
            <RequestDetail
                request={request}
                onRefresh={refresh}
                refreshing={refreshing}
            />
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Contract missing                                                        */
    /* ---------------------------------------------------------------------- */

    if (!contract) {
        return (
            <main className="contracts-theme flex min-h-screen items-center justify-center bg-black p-6 text-zinc-100">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-white">
                        Contract not found
                    </h1>

                    <p className="mt-2 text-sm text-zinc-400">
                        This contract may have been archived or removed.
                    </p>

                    <Link
                        href="/dashboard/contracts"
                        className="mt-5 inline-flex rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300"
                    >
                        Back to workspace
                    </Link>
                </div>
            </main>
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Contract page                                                           */
    /* ---------------------------------------------------------------------- */

    return (
        <main className="contracts-theme min-h-screen bg-black text-zinc-100">
            <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/contracts"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-yellow-400"
                    >
                        <ArrowLeft className="size-4" />
                        Back to contracts
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={refresh}
                            disabled={refreshing}
                            aria-label="Refresh contract"
                            className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`size-5 ${refreshing ? "animate-spin" : ""
                                    }`}
                            />
                        </button>

                        <button
                            type="button"
                            aria-label="More contract actions"
                            className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
                        >
                            <MoreHorizontal className="size-5" />
                        </button>
                    </div>
                </div>

                <header className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-zinc-500">
                                    {contract.contractNumber}
                                </span>

                                <StatusBadge status={contract.status} />
                                <PriorityBadge priority={contract.priority} />
                            </div>

                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                {contract.title}
                            </h1>

                            <p className="mt-2 text-sm text-zinc-400">
                                {contract.contractType}
                                {" · "}
                                Last updated{" "}
                                {formatContractDate(contract.updatedAt)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setEditOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                            >
                                <Pencil className="size-4" />
                                Edit
                            </button>

                            <FinalDocumentButton
                                contractId={contract._id}
                                hasDocument={hasAnyFinalDocument(
                                    contract
                                )}
                            />

                            <button
                                type="button"
                                onClick={refresh}
                                disabled={refreshing}
                                className="rounded-xl bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                            >
                                {refreshing ? "Refreshing…" : "Refresh"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-zinc-800 pt-5 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="size-4 text-yellow-400" />
                            Access limited to your organization
                        </span>

                        <span>
                            Current version{" "}
                            <strong className="text-zinc-200">
                                {getContractVersionLabel(
                                    contract.currentVersion
                                )}
                            </strong>
                        </span>

                        <span>
                            Renewal{" "}
                            <strong className="text-zinc-200">
                                {formatContractDate(
                                    contract.renewalDate
                                )}
                            </strong>
                        </span>

                        <span>
                            Created{" "}
                            <strong className="text-zinc-200">
                                {formatContractDate(
                                    contract.createdAt
                                )}
                            </strong>
                        </span>
                    </div>
                </header>

                <div
                    role="tablist"
                    aria-label="Contract sections"
                    className="mt-5 flex gap-1 overflow-x-auto border-b border-zinc-800"
                >
                    {TAB_LABELS.map(({ key, label }) => {
                        const isActive = tab === key

                        return (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setTab(key)}
                                className={
                                    isActive
                                        ? "border-b-2 border-yellow-400 px-4 py-3 text-sm font-semibold text-white"
                                        : "border-b-2 border-transparent px-4 py-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-300"
                                }
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>

                <div className="mt-5 flex flex-col gap-4">
                    {tab === "overview" && (
                        <>
                            <ContractOverview contract={contract} />

                            <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                                <ContractDocuments contract={contract} />

                                <ContractActivity
                                    contract={contract}
                                    activities={activities}
                                />
                            </div>

                            <CommentComposer
                                comments={comments}
                                onSubmit={handleAddComment}
                                submitting={commentSubmitting}
                            />
                        </>
                    )}

                    {tab === "versions" && (
                        <ContractVersionsTab
                            contractId={contract._id}
                        />
                    )}

                    {tab === "documents" && (
                        <ContractDocumentsTab
                            contract={contract}
                            uploading={documentUploading}
                            error={documentError}
                            onUpload={handleUploadDocument}
                        />
                    )}

                    {tab === "activity" && (
                        <ContractActivityTab
                            activities={activities}
                        />
                    )}
                </div>
            </div>

            {/* Inline edit modal */}
            {editOpen && (
                <ContractEditModal
                    contract={contract}
                    onClose={() => setEditOpen(false)}
                    onSaved={handleContractSaved}
                />
            )}
        </main>
    )
}

/* -------------------------------------------------------------------------- */
/* Tab panels                                                                 */
/* -------------------------------------------------------------------------- */

function ContractVersionsTab({
    contractId,
}: {
    contractId: string
}) {
    return (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-white">
                Versions
            </h2>

            <p className="mt-3 text-sm text-zinc-400">
                Version history for this contract will appear here.
            </p>

            <p className="mt-2 text-xs text-zinc-600">
                Contract ID: {contractId}
            </p>
        </section>
    )
}

function ContractDocumentsTab({
    contract,
    uploading,
    error,
    onUpload,
}: {
    contract: Contract
    uploading: boolean
    error: string | null
    onUpload: (file: File) => Promise<void>
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    const [deletingId, setDeletingId] =
        React.useState<string | null>(null)

    const [downloadingId, setDownloadingId] =
        React.useState<string | null>(null)

    const [rowError, setRowError] =
        React.useState<string | null>(null)

    const documents = Array.isArray(
        contract.supportingDocuments
    )
        ? contract.supportingDocuments
        : []

    const triggerFileDialog = () => {
        if (uploading) return
        inputRef.current?.click()
    }

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]

        event.target.value = ""

        if (!file) return

        await onUpload(file)
    }

    const handleDelete = async (documentId: string) => {
        if (!documentId || deletingId) return

        const confirmed = window.confirm(
            "Delete this document? This cannot be undone."
        )

        if (!confirmed) return

        const doc = documents.find((d) => d._id === documentId)
        const displayName = doc
            ? getDocumentDisplayName(doc)
            : "Document"

        try {
            setDeletingId(documentId)
            setRowError(null)

            await contractService.deleteSupportingDocument(
                contract._id,
                documentId
            )

            // ===== SUCCESS TOAST =====
            premiumToast.success('Document deleted', {
                description: displayName,
            })

            window.location.reload()
        } catch (deleteErr) {
            console.error(
                "Failed to delete document:",
                deleteErr
            )

            const message =
                deleteErr instanceof Error
                    ? deleteErr.message
                    : "Failed to delete document."

            setRowError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Delete failed', {
                description: message,
            })
        } finally {
            setDeletingId(null)
        }
    }

    const handleDownload = async (
        documentId: string,
        name: string
    ) => {
        if (!documentId || downloadingId) return

        try {
            setDownloadingId(documentId)
            setRowError(null)

            const result =
                await contractService.getSupportingDocumentUrl(
                    contract._id,
                    documentId
                )

            if (!result?.url) {
                throw new Error(
                    "Backend did not return a download URL."
                )
            }

            await downloadFromR2(result.url, name)

            // ===== SUCCESS TOAST =====
            premiumToast.success('Download started', {
                description: name,
            })
        } catch (downloadErr) {
            console.error(
                "Failed to download document:",
                downloadErr
            )

            const message =
                downloadErr instanceof Error
                    ? downloadErr.message
                    : "Failed to download document."

            setRowError(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Download failed', {
                description: message,
            })
        } finally {
            setDownloadingId(null)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-white">
                            Documents
                        </h2>

                        <p className="mt-1 text-xs text-zinc-500">
                            Upload supporting files (PDF, DOC, DOCX, JPG, PNG, WEBP · up to 25 MB).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />

                        <button
                            type="button"
                            onClick={triggerFileDialog}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <Upload className="size-4" />
                                    Upload document
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="mt-3 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                        {error}
                    </p>
                )}

                {rowError && (
                    <p className="mt-3 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                        {rowError}
                    </p>
                )}
            </section>

            {documents.length > 0 && (
                <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Supporting documents
                    </h3>

                    <ul className="mt-4 flex flex-col divide-y divide-zinc-800">
                        {documents.map((doc) => {
                            const docId = doc._id
                            const displayName =
                                getDocumentDisplayName(doc)
                            const size = getDocumentSize(doc)

                            const isDeleting =
                                deletingId === docId
                            const isDownloading =
                                downloadingId === docId

                            return (
                                <li
                                    key={docId}
                                    className="flex items-center justify-between gap-3 py-3"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                                            <FileText className="size-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-zinc-100">
                                                {displayName}
                                            </p>

                                            <p className="mt-0.5 text-xs text-zinc-500">
                                                {formatBytes(size)}
                                                {doc.mimeType
                                                    ? ` · ${doc.mimeType}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleDownload(
                                                    docId,
                                                    displayName
                                                )
                                            }
                                            disabled={isDownloading}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                                        >
                                            {isDownloading ? (
                                                <Loader2 className="size-3.5 animate-spin" />
                                            ) : (
                                                <Download className="size-3.5" />
                                            )}
                                            Download
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleDelete(docId)
                                            }
                                            disabled={isDeleting}
                                            aria-label="Delete document"
                                            className="inline-flex items-center justify-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition hover:border-red-900/60 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="size-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="size-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}
        </div>
    )
}

function ContractActivityTab({
    activities,
}: {
    activities: ReturnType<typeof normalizeActivities>
}) {
    return (
        <div className="flex flex-col gap-4">
            <ContractActivity
                contract={{} as Contract}
                activities={activities}
            />
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Request detail                                                             */
/* -------------------------------------------------------------------------- */

function RequestDetail({
    request,
    onRefresh,
    refreshing,
}: {
    request: ContractRequest
    onRefresh: () => Promise<void>
    refreshing: boolean
}) {
    const requestedBy =
        typeof request.requestedBy === "string"
            ? request.requestedBy
            : request.requestedBy?.name ??
            request.requestedBy?.email ??
            "Business user"

    const professional =
        typeof request.assignedProfessional === "string"
            ? request.assignedProfessional
            : request.assignedProfessional?.name ??
            request.assignedProfessional?.email ??
            "Not assigned"

    return (
        <main className="contracts-theme min-h-screen bg-black text-zinc-100">
            <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/contracts"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-yellow-400"
                    >
                        <ArrowLeft className="size-4" />
                        Back to contracts
                    </Link>

                    <button
                        type="button"
                        onClick={() => void onRefresh()}
                        disabled={refreshing}
                        aria-label="Refresh request"
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`size-5 ${refreshing ? "animate-spin" : ""
                                }`}
                        />
                    </button>
                </div>

                <header className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-zinc-500">
                                    {request.requestNumber}
                                </span>

                                <StatusBadge status={request.status} />
                                <PriorityBadge priority={request.priority} />
                            </div>

                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                {request.title}
                            </h1>

                            <p className="mt-2 text-sm text-zinc-400">
                                {request.contractType}
                                {" · "}
                                Request submitted{" "}
                                {formatContractDate(request.createdAt)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void onRefresh()}
                            disabled={refreshing}
                            className="rounded-xl bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                        >
                            {refreshing ? "Refreshing…" : "Refresh"}
                        </button>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-zinc-800 pt-5 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="size-4 text-yellow-400" />
                            Request belongs to your organization
                        </span>

                        <span>
                            Expected delivery{" "}
                            <strong className="text-zinc-200">
                                {formatContractDate(
                                    request.expectedDeliveryDate
                                )}
                            </strong>
                        </span>
                    </div>
                </header>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-white">
                            Request details
                        </h2>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                            {request.description || "No description provided."}
                        </p>

                        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Request number
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {request.requestNumber}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Contract type
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {request.contractType}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Requested by
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {requestedBy}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Assigned professional
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {professional}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Created
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {formatContractDate(request.createdAt)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-zinc-500">
                                    Expected delivery
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-zinc-100">
                                    {formatContractDate(
                                        request.expectedDeliveryDate
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-white">
                            Request status
                        </h2>

                        <div className="mt-5 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                                <CalendarDays className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {request.status}
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Priority: {request.priority}
                                </p>
                            </div>
                        </div>

                        {request.specialInstructions && (
                            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                <p className="text-xs font-semibold text-zinc-300">
                                    Special instructions
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-500">
                                    {request.specialInstructions}
                                </p>
                            </div>
                        )}

                        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs leading-5 text-zinc-400">
                            This is a legal request. Once it is converted into
                            an actual contract, the contract record will be
                            available in the Contracts workspace.
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}