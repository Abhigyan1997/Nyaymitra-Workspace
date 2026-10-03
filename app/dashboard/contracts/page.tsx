// app/dashboard/contracts/page.tsx
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
    AlertTriangle, ArrowUpRight, Building2, CalendarClock, ChevronDown, ChevronUp,
    ClipboardList, FileText, FileUp, LayoutGrid, List, Mail, MapPin, Phone, Plus,
    RefreshCw, Search, ShieldCheck, Upload, User, X,
} from "lucide-react"

import { NewRequestModal, PriorityBadge, StatusBadge } from "@/components/contracts/contracts"
import {
    contractService,
    type Contract,
    type ContractRequest,
    type ContractRequestFormData,
    type ContractType,
} from "@/lib/services/contract.service"
import { formatContractDate, getContractVersionLabel } from "@/lib/contracts"
import { premiumToast } from "@/lib/premium-toast"

/* -------------------------------------------------------------------------- */
/* Constants + helpers                                                         */
/* -------------------------------------------------------------------------- */

const CONTRACT_TYPES = [
    "NDA", "Employment Agreement", "Vendor Agreement", "Service Agreement",
    "Consulting Agreement", "Partnership Agreement", "Shareholder Agreement",
    "Lease Agreement", "MSA", "SLA", "Privacy Policy", "Terms & Conditions",
    "Website Policy", "Founders Agreement", "Investment Agreement", "Custom Contract", "Other",
]

const STATUSES = [
    "Draft", "Internal Review", "Client Review", "Revision Requested", "Approved",
    "Pending Signature", "Executed", "Active", "Expired", "Terminated", "Archived",
]

const PRIORITIES = ["Low", "Medium", "High", "Urgent"]

const ALLOWED_MIME = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const ALL = { status: "All statuses", type: "All types", priority: "All priorities" }

type Cp = { name: string; company: string; email: string; phone: string; address: string }

function cpOf(c: Contract): Cp {
    const raw = (c as unknown as Record<string, unknown>).counterparty
    if (!raw) return { name: "", company: "", email: "", phone: "", address: "" }
    if (typeof raw === "string") return { name: raw, company: "", email: "", phone: "", address: "" }
    const o = raw as Record<string, unknown>
    return {
        name: String(o.name ?? ""), company: String(o.company ?? ""), email: String(o.email ?? ""),
        phone: String(o.phone ?? ""), address: String(o.address ?? ""),
    }
}

const personName = (v: unknown, fallback = "—") =>
    !v ? fallback : typeof v === "string" ? v : ((v as { name?: string; email?: string }).name ?? (v as { email?: string }).email ?? fallback)

function money(value?: number | null, currency?: string) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return "—"
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency", currency: currency || "INR", maximumFractionDigits: 0,
        }).format(Number(value))
    } catch {
        return `${currency ?? ""} ${value}`
    }
}

const daysUntil = (v?: string | null) => {
    if (!v) return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : Math.ceil((d.getTime() - Date.now()) / 86_400_000)
}

function DateCell({ value, label }: { value?: string | null; label?: string }) {
    const d = daysUntil(value)
    if (!value || d === null) return <span className="text-zinc-600">—</span>
    const tone = d < 0 ? "text-red-300" : d <= 30 ? "text-amber-300" : "text-zinc-200"
    const hint = d < 0 ? `${Math.abs(d)} days overdue` : d <= 30 ? `in ${d} days` : label
    return (
        <div className="leading-tight">
            <div className={`text-sm ${tone}`}>{formatContractDate(value)}</div>
            {hint && <div className={`text-xs ${d <= 30 ? tone : "text-zinc-500"} opacity-90`}>{hint}</div>}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Upload modal                                                                */
/* -------------------------------------------------------------------------- */

function UploadContractModal({ open, onClose, onUploaded }: {
    open: boolean; onClose: () => void; onUploaded: (c: Contract) => void
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [title, setTitle] = useState("")
    const [contractType, setContractType] = useState<ContractType>("NDA")
    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [error, setError] = useState("")

    const reset = () => {
        setTitle(""); setContractType("NDA"); setFile(null); setError(""); setDragging(false)
        if (inputRef.current) inputRef.current.value = ""
    }
    const close = () => { if (!saving) { reset(); onClose() } }

    const choose = (f: File | null) => {
        if (!f) return
        if (!ALLOWED_MIME.includes(f.type) && !f.type.startsWith("image/")) {
            return setError("Please upload a PDF, DOC, DOCX, or image file.")
        }
        setFile(f); setError("")
        if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""))
    }

    useEffect(() => {
        if (!open) return
        const h = (e: KeyboardEvent) => e.key === "Escape" && close()
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, saving])

    if (!open) return null

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (saving) return
        if (!title.trim()) return setError("Contract title is required.")
        if (!file) return setError("Please choose a file to upload.")
        try {
            setSaving(true); setError("")
            const fd = new FormData()
            fd.append("title", title.trim())
            fd.append("contractType", contractType)
            fd.append("file", file)
            const created = await contractService.uploadContract(fd)
            if (!created?._id) throw new Error("Upload completed but no contract was returned.")
            onUploaded(created)
            premiumToast.success("Contract uploaded", { description: `${created.title || title.trim()} added to your workspace.` })
            reset(); onClose()
        } catch (err) {
            console.error("Contract upload failed:", err)
            const message = err instanceof Error ? err.message : "Unable to upload contract."
            setError(message)
            premiumToast.error("Upload failed", { description: message })
        } finally { setSaving(false) }
    }

    const field = "h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-yellow-400 disabled:opacity-60"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(e) => e.target === e.currentTarget && close()}>
            <div role="dialog" aria-modal="true" aria-labelledby="upload-title"
                className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                <div className="flex items-start justify-between border-b border-zinc-800 p-6">
                    <div>
                        <h2 id="upload-title" className="text-lg font-semibold text-white">Upload a contract</h2>
                        <p className="mt-1 text-sm text-zinc-400">Add an existing agreement for review and record-keeping.</p>
                    </div>
                    <button type="button" onClick={close} disabled={saving} aria-label="Close"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white disabled:opacity-50"><X className="size-5" /></button>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-5 p-6">
                    {error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">{error}</div>}
                    <div role="button" tabIndex={0}
                        onClick={() => !saving && inputRef.current?.click()}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!saving) choose(e.dataTransfer.files?.[0] ?? null) }}
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center transition ${dragging ? "border-yellow-400 bg-yellow-400/5" : "border-zinc-700 bg-zinc-900/40 hover:border-yellow-400/50"}`}>
                        {file ? (<>
                            <FileText className="size-8 text-yellow-400" />
                            <p className="max-w-full truncate text-sm font-medium text-white">{file.name}</p>
                            <p className="text-xs text-zinc-500">{(file.size / 1048576).toFixed(2)} MB · click to replace</p>
                        </>) : (<>
                            <Upload className="size-8 text-zinc-500" />
                            <p className="text-sm font-medium text-zinc-200">Drop a file here, or click to browse</p>
                            <p className="text-xs text-zinc-500">PDF, DOC, DOCX or image</p>
                        </>)}
                        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" disabled={saving}
                            onChange={(e) => choose(e.target.files?.[0] ?? null)} />
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">Contract title
                        <input value={title} disabled={saving} placeholder="e.g. Vendor agreement – Acme"
                            onChange={(e) => { setTitle(e.target.value); setError("") }} className={field} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">Contract type
                        <select value={contractType} disabled={saving} className={field}
                            onChange={(e) => setContractType(e.target.value as ContractType)}>
                            {CONTRACT_TYPES.map((o) => <option key={o} value={o} className="bg-zinc-950">{o}</option>)}
                        </select>
                    </label>
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={close} disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60">
                            <FileUp className="size-4" />{saving ? "Uploading…" : "Upload contract"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Quick-view drawer                                                           */
/* -------------------------------------------------------------------------- */

type Selected = { kind: "contract"; item: Contract } | { kind: "request"; item: ContractRequest } | null

function Row({ k, children }: { k: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
            <dt className="shrink-0 text-zinc-500">{k}</dt>
            <dd className="text-right text-zinc-100">{children}</dd>
        </div>
    )
}

function ContactLine({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
    return <div className="flex items-start gap-2.5 text-sm text-zinc-300"><Icon className="mt-0.5 size-4 shrink-0 text-zinc-500" /><span className="min-w-0 break-words">{children}</span></div>
}

function DetailDrawer({ selected, onClose }: { selected: Selected; onClose: () => void }) {
    useEffect(() => {
        if (!selected) return
        const h = (e: KeyboardEvent) => e.key === "Escape" && onClose()
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [selected, onClose])

    if (!selected) return null

    const box = "divide-y divide-zinc-900 rounded-xl border border-zinc-800 bg-zinc-900/30"

    return (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <aside role="dialog" aria-modal="true" className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950">
                {selected.kind === "contract" ? (() => {
                    const c = selected.item
                    const cp = cpOf(c)
                    return (<>
                        <div className="border-b border-zinc-800 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs text-zinc-500">{c.contractNumber}</p>
                                    <h2 className="mt-1 text-xl font-semibold text-white">{c.title}</h2>
                                    <p className="mt-1 text-sm text-zinc-400">{c.contractType}</p>
                                </div>
                                <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"><X className="size-5" /></button>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={c.status} /><PriorityBadge priority={c.priority} /></div>
                        </div>

                        <div className="flex flex-col gap-6 p-6">
                            <section>
                                <h3 className="text-sm font-semibold text-white">Counterparty</h3>
                                <div className="mt-3 space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                                    {!cp.name && !cp.company && !cp.email && !cp.phone && !cp.address && (
                                        <p className="text-sm text-zinc-500">No counterparty details added yet.</p>
                                    )}
                                    {cp.name && <ContactLine icon={User}><span className="font-medium text-white">{cp.name}</span></ContactLine>}
                                    {cp.company && <ContactLine icon={Building2}>{cp.company}</ContactLine>}
                                    {cp.email && <ContactLine icon={Mail}><a href={`mailto:${cp.email}`} className="text-yellow-400 hover:underline">{cp.email}</a></ContactLine>}
                                    {cp.phone && <ContactLine icon={Phone}><a href={`tel:${cp.phone}`} className="hover:text-white">{cp.phone}</a></ContactLine>}
                                    {cp.address && <ContactLine icon={MapPin}>{cp.address}</ContactLine>}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold text-white">Terms</h3>
                                <dl className={`mt-3 ${box}`}>
                                    <Row k="Contract value">{money(c.contractValue, c.currency)}</Row>
                                    <Row k="Effective date">{formatContractDate(c.effectiveDate)}</Row>
                                    <Row k="Expiry date"><DateCell value={c.expiryDate} /></Row>
                                    <Row k="Renewal date"><DateCell value={c.renewalDate} /></Row>
                                    <Row k="Version">{getContractVersionLabel(c.currentVersion)}</Row>
                                    <Row k="Last updated">{formatContractDate(c.updatedAt)}</Row>
                                </dl>
                            </section>

                            {c.description && (
                                <section>
                                    <h3 className="text-sm font-semibold text-white">Description</h3>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{c.description}</p>
                                </section>
                            )}
                        </div>

                        <div className="mt-auto border-t border-zinc-800 p-6">
                            <Link href={`/dashboard/contracts/${c._id}`}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-black hover:bg-yellow-300">
                                Open full contract <ArrowUpRight className="size-4" />
                            </Link>
                        </div>
                    </>)
                })() : (() => {
                    const r = selected.item
                    return (<>
                        <div className="border-b border-zinc-800 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs text-zinc-500">{r.requestNumber}</p>
                                    <h2 className="mt-1 text-xl font-semibold text-white">{r.title}</h2>
                                    <p className="mt-1 text-sm text-zinc-400">{r.contractType}</p>
                                </div>
                                <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"><X className="size-5" /></button>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={r.status} /><PriorityBadge priority={r.priority} /></div>
                        </div>
                        <div className="flex flex-col gap-6 p-6">
                            <dl className={box}>
                                <Row k="Requested by">{personName(r.requestedBy, "Business user")}</Row>
                                <Row k="Assigned professional">{personName(r.assignedProfessional, "Not assigned")}</Row>
                                <Row k="Submitted">{formatContractDate(r.createdAt)}</Row>
                                <Row k="Expected delivery">{formatContractDate(r.expectedDeliveryDate)}</Row>
                            </dl>
                            {r.description && (
                                <section><h3 className="text-sm font-semibold text-white">Description</h3>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{r.description}</p></section>
                            )}
                            {r.specialInstructions && (
                                <section><h3 className="text-sm font-semibold text-white">Special instructions</h3>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{r.specialInstructions}</p></section>
                            )}
                        </div>
                        <div className="mt-auto border-t border-zinc-800 p-6">
                            <Link href={`/dashboard/contracts/${r._id}`}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-black hover:bg-yellow-300">
                                Open full request <ArrowUpRight className="size-4" />
                            </Link>
                        </div>
                    </>)
                })()}
            </aside>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Small UI pieces                                                             */
/* -------------------------------------------------------------------------- */

function Kpi({ label, value, hint, tone = "text-white", onClick }: {
    label: string; value: number | string; hint?: string; tone?: string; onClick?: () => void
}) {
    const Tag = onClick ? "button" : "div"
    return (
        <Tag onClick={onClick} className={`rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-left ${onClick ? "transition hover:border-zinc-700" : ""}`}>
            <p className="text-sm text-zinc-400">{label}</p>
            <p className={`mt-2 text-3xl font-semibold tabular-nums ${tone}`}>{value}</p>
            {hint && <p className="mt-1 truncate text-xs text-zinc-500">{hint}</p>}
        </Tag>
    )
}

function EmptyState({ icon: Icon, title, body, action }: { icon: typeof FileText; title: string; body: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3"><Icon className="size-6 text-yellow-400" /></div>
            <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-400">{body}</p>
            {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
        </div>
    )
}

type SortKey = "title" | "status" | "expiryDate" | "createdAt" | "value"
type Sort = { key: SortKey; dir: 1 | -1 }

function SortHead({ label, k, sort, setSort }: { label: string; k: SortKey; sort: Sort; setSort: (s: Sort) => void }) {
    const active = sort.key === k
    return (
        <th scope="col" className="px-4 py-3 text-left font-medium">
            <button onClick={() => setSort({ key: k, dir: active ? (sort.dir === 1 ? -1 : 1) : 1 })} className="inline-flex items-center gap-1 hover:text-zinc-200">
                {label}{active && (sort.dir === 1 ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
            </button>
        </th>
    )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ContractsPage() {
    const [view, setView] = useState<"contracts" | "requests">("contracts")
    const [layout, setLayout] = useState<"table" | "grid">("table")
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState(ALL.status)
    const [type, setType] = useState(ALL.type)
    const [priority, setPriority] = useState(ALL.priority)
    const [sort, setSort] = useState<Sort>({ key: "createdAt", dir: -1 })

    const [showRequestModal, setShowRequestModal] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selected, setSelected] = useState<Selected>(null)

    const [contracts, setContracts] = useState<Contract[]>([])
    const [requests, setRequests] = useState<ContractRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [creatingRequest, setCreatingRequest] = useState(false)

    const loadData = useCallback(async () => {
        try {
            setLoading(true); setError(null)
            const [c, r] = await Promise.all([
                contractService.getContracts({ page: 1, limit: 50 }),
                contractService.getContractRequests({ page: 1, limit: 50 }),
            ])
            setContracts(c?.data ?? [])
            setRequests(r?.requests ?? [])
        } catch (err) {
            console.error("Failed to load contracts:", err)
            const message = err instanceof Error ? err.message : "Failed to load contracts."
            setError(message)
            premiumToast.error("Could not load contracts", { description: message })
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { void loadData() }, [loadData])

    const clearFilters = () => { setSearch(""); setStatus(ALL.status); setType(ALL.type); setPriority(ALL.priority) }
    const filtersActive = !!search || status !== ALL.status || type !== ALL.type || priority !== ALL.priority
    const switchView = (v: "contracts" | "requests") => { setView(v); clearFilters(); setSort({ key: "createdAt", dir: -1 }) }

    /* ----- stats ----- */
    const stats = useMemo(() => {
        const within30 = (v?: string | null) => { const d = daysUntil(v); return d !== null && d >= 0 && d <= 30 }
        const expiring = contracts.filter((c) => within30(c.expiryDate))
        const renewals = contracts.filter((c) => within30(c.renewalDate))
        const active = contracts.filter((c) => c.status === "Active" || c.status === "Executed").length
        const inr = contracts.reduce((s, c) => s + ((c.currency ?? "INR") === "INR" ? Number(c.contractValue) || 0 : 0), 0)
        const open = requests.filter((r) => !["Completed", "Rejected", "Cancelled", "Delivered"].includes(String(r.status))).length
        return { expiring, renewals, active, inr, open }
    }, [contracts, requests])

    const requestStatuses = useMemo(() => Array.from(new Set(requests.map((r) => String(r.status)).filter(Boolean))), [requests])
    const statusOptions = [ALL.status, ...(view === "contracts" ? STATUSES : requestStatuses)]

    /* ----- filter + sort ----- */
    const q = search.trim().toLowerCase()

    const filteredContracts = useMemo(() => {
        const list = contracts.filter((c) => {
            const cp = cpOf(c)
            const hay = [c.title, c.contractNumber, c.contractType, cp.name, cp.company, cp.email, cp.phone].join(" ").toLowerCase()
            return (!q || hay.includes(q)) &&
                (status === ALL.status || c.status === status) &&
                (type === ALL.type || c.contractType === type) &&
                (priority === ALL.priority || c.priority === priority)
        })
        const get = (c: Contract): string | number =>
            sort.key === "title" ? String(c.title).toLowerCase()
                : sort.key === "status" ? String(c.status)
                    : sort.key === "value" ? Number(c.contractValue) || 0
                        : sort.key === "expiryDate" ? (c.expiryDate ? new Date(c.expiryDate).getTime() : 8.64e15)
                            : new Date(c.createdAt ?? 0).getTime()
        return [...list].sort((a, b) => (get(a) > get(b) ? 1 : get(a) < get(b) ? -1 : 0) * sort.dir)
    }, [contracts, q, status, type, priority, sort])

    const filteredRequests = useMemo(() => {
        const list = requests.filter((r) => {
            const hay = [r.title, r.requestNumber, r.contractType, r.description, personName(r.requestedBy, ""), personName(r.assignedProfessional, "")].join(" ").toLowerCase()
            return (!q || hay.includes(q)) &&
                (status === ALL.status || r.status === status) &&
                (type === ALL.type || r.contractType === type) &&
                (priority === ALL.priority || r.priority === priority)
        })
        const get = (r: ContractRequest): string | number =>
            sort.key === "title" ? String(r.title).toLowerCase()
                : sort.key === "status" ? String(r.status)
                    : new Date(r.createdAt ?? 0).getTime()
        return [...list].sort((a, b) => (get(a) > get(b) ? 1 : get(a) < get(b) ? -1 : 0) * sort.dir)
    }, [requests, q, status, type, priority, sort])

    /* ----- actions ----- */
    const handleCreateRequest = async (data: ContractRequestFormData) => {
        try {
            setCreatingRequest(true)
            const created = await contractService.createContractRequest(data)
            setRequests((cur) => [created, ...cur])
            premiumToast.success("Legal request created", {
                description: created?.title ? `"${created.title}" is now in your request queue.` : "It is now in your request queue.",
            })
            setShowRequestModal(false); setView("requests"); clearFilters()
        } catch (err) {
            console.error("Failed to create legal request:", err)
            const message = err instanceof Error ? err.message : "Failed to create legal request."
            premiumToast.error("Request failed", { description: message })
            throw err
        } finally { setCreatingRequest(false) }
    }

    const handleUploaded = (created: Contract) => {
        setContracts((cur) => [created, ...cur]); setView("contracts"); clearFilters()
    }

    const shown = view === "contracts" ? filteredContracts.length : filteredRequests.length
    const total = view === "contracts" ? contracts.length : requests.length
    const selectCls = "h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus:border-yellow-400"
    const thead = "border-b border-zinc-800 bg-zinc-950/80 text-xs text-zinc-500"
    const rowCls = "cursor-pointer outline-none transition hover:bg-zinc-900/60 focus:bg-zinc-900/60"

    return (
        <main className="contracts-theme min-h-screen bg-black text-zinc-100">
            <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-yellow-400"><ShieldCheck className="size-4" />NyayMitra Legal Operations</div>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Contracts</h1>
                        <p className="mt-1 max-w-2xl text-sm text-zinc-400">Store agreements, request new ones from our legal team, and stay ahead of renewals.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button onClick={() => setShowUploadModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-semibold hover:border-yellow-400/40 hover:bg-zinc-900"><Upload className="size-4" />Upload contract</button>
                        <button onClick={() => setShowRequestModal(true)} disabled={creatingRequest} className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-50"><Plus className="size-4" />New contract request</button>
                    </div>
                </header>

                {error && (
                    <div role="alert" className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                        <span>{error}</span>
                        <button onClick={() => void loadData()} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-900/50 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-900/30"><RefreshCw className="size-3.5" />Retry</button>
                    </div>
                )}

                {/* KPIs */}
                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary">
                    <Kpi label="Total contracts" value={contracts.length} hint={stats.inr > 0 ? `${money(stats.inr, "INR")} total value` : "In your workspace"} />
                    <Kpi label="Active" value={stats.active} tone="text-emerald-300" hint="Active or executed" />
                    <Kpi label="Expiring in 30 days" value={stats.expiring.length} tone={stats.expiring.length ? "text-amber-300" : "text-white"}
                        hint={stats.renewals.length ? `${stats.renewals.length} renewal${stats.renewals.length > 1 ? "s" : ""} due` : "Nothing due soon"}
                        onClick={stats.expiring.length ? () => { switchView("contracts"); setSort({ key: "expiryDate", dir: 1 }) } : undefined} />
                    <Kpi label="Open requests" value={stats.open} tone="text-sky-300" hint="With our legal team" onClick={() => switchView("requests")} />
                </section>

                {stats.expiring.length > 0 && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>{stats.expiring.length} contract{stats.expiring.length > 1 ? "s" : ""} expire within 30 days, including <span className="font-medium">{stats.expiring[0].title}</span>. Open a request to renew or renegotiate.</p>
                    </div>
                )}

                {/* Workspace */}
                <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/50">
                    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 pt-3">
                        <div role="tablist" className="flex gap-1">
                            {([["contracts", "Contracts", contracts.length], ["requests", "Requests", requests.length]] as const).map(([k, label, n]) => (
                                <button key={k} role="tab" aria-selected={view === k} onClick={() => switchView(k)}
                                    className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition ${view === k ? "border-yellow-400 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                                    {label}<span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums text-zinc-300">{n}</span>
                                </button>
                            ))}
                        </div>
                        {view === "contracts" && (
                            <div className="mb-2 hidden rounded-lg border border-zinc-800 p-0.5 sm:flex">
                                {([["table", List], ["grid", LayoutGrid]] as const).map(([k, Icon]) => (
                                    <button key={k} onClick={() => setLayout(k)} aria-label={`${k} view`} aria-pressed={layout === k}
                                        className={`rounded-md p-1.5 ${layout === k ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}><Icon className="size-4" /></button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 border-b border-zinc-800 p-4 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder={view === "contracts" ? "Search title, number, counterparty, email or phone" : "Search requests"}
                                className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-9 pr-3 text-sm outline-none placeholder:text-zinc-500 focus:border-yellow-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls} aria-label="Status">{statusOptions.map((o) => <option key={o}>{o}</option>)}</select>
                            <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls} aria-label="Type">{[ALL.type, ...CONTRACT_TYPES].map((o) => <option key={o}>{o}</option>)}</select>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectCls} aria-label="Priority">{[ALL.priority, ...PRIORITIES].map((o) => <option key={o}>{o}</option>)}</select>
                            {filtersActive && <button onClick={clearFilters} className="h-10 rounded-xl px-3 text-sm text-zinc-400 hover:text-white">Clear</button>}
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading">
                            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-900" />)}
                        </div>
                    ) : shown === 0 ? (
                        view === "contracts" ? (
                            <EmptyState icon={FileText} title={filtersActive ? "No contracts match your filters" : "No contracts yet"}
                                body={filtersActive ? "Try a different search or clear the filters." : "Upload an existing agreement or ask our team to draft a new one."}
                                action={filtersActive ? <button onClick={clearFilters} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm hover:bg-zinc-900">Clear filters</button> : (<>
                                    <button onClick={() => setShowUploadModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300"><Upload className="size-4" />Upload contract</button>
                                    <button onClick={() => setShowRequestModal(true)} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm hover:bg-zinc-900">New request</button></>)} />
                        ) : (
                            <EmptyState icon={ClipboardList} title={filtersActive ? "No requests match your filters" : "No legal requests yet"}
                                body={filtersActive ? "Try a different search or clear the filters." : "Ask our legal team to draft, review or renew a contract."}
                                action={filtersActive ? <button onClick={clearFilters} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm hover:bg-zinc-900">Clear filters</button>
                                    : <button onClick={() => setShowRequestModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300"><Plus className="size-4" />New contract request</button>} />
                        )
                    ) : view === "contracts" && layout === "grid" ? (
                        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredContracts.map((c) => {
                                const cp = cpOf(c)
                                return (
                                    <button key={c._id} onClick={() => setSelected({ kind: "contract", item: c })}
                                        className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left transition hover:border-yellow-400/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="truncate font-medium text-white">{c.title}</h3>
                                                <p className="mt-0.5 text-xs text-zinc-500">{c.contractNumber} · {c.contractType}</p>
                                            </div>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        <div className="mt-4 space-y-1.5">
                                            <ContactLine icon={Building2}>{cp.company || cp.name || "No counterparty"}</ContactLine>
                                            {cp.email && <ContactLine icon={Mail}>{cp.email}</ContactLine>}
                                            {cp.phone && <ContactLine icon={Phone}>{cp.phone}</ContactLine>}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3 text-sm">
                                            <span className="font-medium text-zinc-100">{money(c.contractValue, c.currency)}</span>
                                            <span className="flex items-center gap-1.5 text-xs text-zinc-500"><CalendarClock className="size-3.5" />{formatContractDate(c.expiryDate)}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : view === "contracts" ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-sm">
                                <thead className={thead}>
                                    <tr>
                                        <SortHead label="Contract" k="title" sort={sort} setSort={setSort} />
                                        <th className="px-4 py-3 text-left font-medium">Counterparty</th>
                                        <th className="px-4 py-3 text-left font-medium">Contact</th>
                                        <SortHead label="Status" k="status" sort={sort} setSort={setSort} />
                                        <th className="px-4 py-3 text-left font-medium">Priority</th>
                                        <SortHead label="Value" k="value" sort={sort} setSort={setSort} />
                                        <SortHead label="Expires" k="expiryDate" sort={sort} setSort={setSort} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {filteredContracts.map((c) => {
                                        const cp = cpOf(c)
                                        return (
                                            <tr key={c._id} tabIndex={0} className={rowCls}
                                                onClick={() => setSelected({ kind: "contract", item: c })}
                                                onKeyDown={(e) => e.key === "Enter" && setSelected({ kind: "contract", item: c })}>
                                                <td className="max-w-[280px] px-4 py-3.5">
                                                    <Link href={`/dashboard/contracts/${c._id}`} onClick={(e) => e.stopPropagation()}
                                                        className="block truncate font-medium text-white hover:text-yellow-400">{c.title}</Link>
                                                    <div className="mt-0.5 truncate text-xs text-zinc-500">{c.contractNumber} · {c.contractType} · {getContractVersionLabel(c.currentVersion)}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="text-zinc-100">{cp.company || cp.name || "—"}</div>
                                                    {cp.company && cp.name && <div className="text-xs text-zinc-500">{cp.name}</div>}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-zinc-400">
                                                    {cp.email || cp.phone ? (<>
                                                        {cp.email && <div className="truncate">{cp.email}</div>}
                                                        {cp.phone && <div>{cp.phone}</div>}
                                                    </>) : <span className="text-zinc-600">—</span>}
                                                </td>
                                                <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                                                <td className="px-4 py-3.5"><PriorityBadge priority={c.priority} /></td>
                                                <td className="px-4 py-3.5 tabular-nums text-zinc-200">{money(c.contractValue, c.currency)}</td>
                                                <td className="px-4 py-3.5"><DateCell value={c.expiryDate} label={c.renewalDate ? `Renews ${formatContractDate(c.renewalDate)}` : undefined} /></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className={thead}>
                                    <tr>
                                        <SortHead label="Request" k="title" sort={sort} setSort={setSort} />
                                        <th className="px-4 py-3 text-left font-medium">Requested by</th>
                                        <th className="px-4 py-3 text-left font-medium">Assigned to</th>
                                        <SortHead label="Status" k="status" sort={sort} setSort={setSort} />
                                        <th className="px-4 py-3 text-left font-medium">Priority</th>
                                        <th className="px-4 py-3 text-left font-medium">Expected delivery</th>
                                        <SortHead label="Submitted" k="createdAt" sort={sort} setSort={setSort} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {filteredRequests.map((r) => (
                                        <tr key={r._id ?? r.requestNumber} tabIndex={0} className={rowCls}
                                            onClick={() => setSelected({ kind: "request", item: r })}
                                            onKeyDown={(e) => e.key === "Enter" && setSelected({ kind: "request", item: r })}>
                                            <td className="max-w-[280px] px-4 py-3.5">
                                                <Link href={`/dashboard/contracts/${r._id}`} onClick={(e) => e.stopPropagation()}
                                                    className="block truncate font-medium text-white hover:text-yellow-400">{r.title}</Link>
                                                <div className="mt-0.5 text-xs text-zinc-500">{r.requestNumber} · {r.contractType}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-zinc-300">{personName(r.requestedBy)}</td>
                                            <td className="px-4 py-3.5 text-zinc-300">{personName(r.assignedProfessional, "Not assigned")}</td>
                                            <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                                            <td className="px-4 py-3.5"><PriorityBadge priority={r.priority} /></td>
                                            <td className="px-4 py-3.5 text-zinc-300">{formatContractDate(r.expectedDeliveryDate)}</td>
                                            <td className="px-4 py-3.5 text-zinc-300">{formatContractDate(r.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && shown > 0 && (
                        <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">Showing {shown} of {total} {view}</div>
                    )}
                </section>

                <footer className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-5 text-xs text-zinc-500">
                    <span>© 2026 NyayMitra</span><span>Confidential workspace</span>
                </footer>
            </div>

            <NewRequestModal open={showRequestModal} onClose={() => { if (!creatingRequest) setShowRequestModal(false) }} onCreated={handleCreateRequest} />
            <UploadContractModal open={showUploadModal} onClose={() => setShowUploadModal(false)} onUploaded={handleUploaded} />
            <DetailDrawer selected={selected} onClose={() => setSelected(null)} />
        </main>
    )
}