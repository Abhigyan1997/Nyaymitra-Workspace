// components/contracts/contracts.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowUpRight,
    CalendarDays,
    Check,
    ChevronDown,
    Download,
    FileText,
    Filter,
    Loader2,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    UserRound,
    X,
} from "lucide-react"

import {
    contractTypes,
    displayCounterparty,
    displayUserName,
    formatContractDate,
    formatContractValue,
    getContractVersionLabel,
    initials,
    priorityClass,
    priorities,
    statusClass,
    statuses,
} from "@/lib/contracts"

import {
    contractService,
    type Contract,
    type ContractRequest,
    type ContractRequestFormData,
} from "@/lib/services/contract.service"

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Priority = "Low" | "Medium" | "High" | "Urgent"

type StatTone = "emerald" | "violet" | "amber" | "sky"

type ContractDocumentLike = {
    _id?: string
    id?: string
    name?: string
    fileName?: string
    originalName?: string
    title?: string
    type?: string
    mimeType?: string
    fileType?: string
    size?: number
    fileSize?: number
    url?: string
    downloadUrl?: string
    createdAt?: string
}

type ActivityLike = {
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
}

type FinalFileType = "pdf" | "docx" | "signedPdf"

type DocumentRow = {
    id: string
    name: string
    mimeType?: string
    size?: number
    source:
    | { kind: "final"; fileType: FinalFileType }
    | { kind: "supporting"; documentId: string }
}

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

function Badge({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${className}`}
        >
            {children}
        </span>
    )
}

export function StatusBadge({ status }: { status: string }) {
    return <Badge className={statusClass(status)}>{status}</Badge>
}

export function PriorityBadge({
    priority,
}: {
    priority: Priority | string
}) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${priorityClass(
                priority as Priority
            )}`}
        >
            <span className="size-1.5 rounded-full bg-current" />
            {priority}
        </span>
    )
}

function Avatar({
    name,
    tone = "bg-zinc-800 text-zinc-300",
}: {
    name: string
    tone?: string
}) {
    return (
        <span
            className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${tone}`}
        >
            {initials(name)}
        </span>
    )
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-100">
                {value}
            </dd>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Stat cards                                                                  */
/* -------------------------------------------------------------------------- */

export function StatCards({
    contracts = [],
    requests = [],
}: {
    contracts?: Contract[]
    requests?: ContractRequest[]
}) {
    const activeContracts = contracts.filter(
        (contract) => contract.status === "Active"
    ).length

    const underReview = contracts.filter((contract) =>
        [
            "Internal Review",
            "Client Review",
            "Revision Requested",
        ].includes(contract.status)
    ).length

    const pendingRequests = requests.filter((request) =>
        ["Pending", "Under Review"].includes(request.status)
    ).length

    const renewalsThisQuarter = contracts.filter((contract) => {
        if (!contract.renewalDate) return false

        const renewal = new Date(contract.renewalDate)
        if (Number.isNaN(renewal.getTime())) return false

        const now = new Date()
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3

        const quarterStart = new Date(
            now.getFullYear(),
            quarterStartMonth,
            1
        )

        const quarterEnd = new Date(
            now.getFullYear(),
            quarterStartMonth + 3,
            0,
            23,
            59,
            59
        )

        return renewal >= quarterStart && renewal <= quarterEnd
    }).length

    const stats: Array<{
        label: string
        value: string
        trend: string
        tone: StatTone
    }> = [
            {
                label: "Active contracts",
                value: String(activeContracts).padStart(2, "0"),
                trend: "Currently active",
                tone: "emerald",
            },
            {
                label: "Under review",
                value: String(underReview).padStart(2, "0"),
                trend: "Need attention",
                tone: "violet",
            },
            {
                label: "Pending requests",
                value: String(pendingRequests).padStart(2, "0"),
                trend: "Awaiting action",
                tone: "amber",
            },
            {
                label: "Renewals this quarter",
                value: String(renewalsThisQuarter).padStart(2, "0"),
                trend: "Upcoming renewals",
                tone: "sky",
            },
        ]

    const toneClasses: Record<StatTone, string> = {
        emerald: "text-emerald-400",
        violet: "text-violet-400",
        amber: "text-amber-400",
        sky: "text-sky-400",
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-zinc-400">
                            {stat.label}
                        </p>

                        <span
                            className={`size-2 rounded-full bg-current ${toneClasses[stat.tone]}`}
                        />
                    </div>

                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                        {stat.value}
                    </p>

                    <p
                        className={`mt-1 text-xs ${toneClasses[stat.tone]}`}
                    >
                        {stat.trend}
                    </p>
                </div>
            ))}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

function FilterSelect({
    value,
    onChange,
    options,
}: {
    value: string
    onChange: (value: string) => void
    options: readonly string[]
}) {
    return (
        <label className="relative">
            <span className="sr-only">Filter</span>

            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 appearance-none rounded-xl border border-zinc-800 bg-zinc-950 py-0 pl-3 pr-8 text-xs font-medium text-zinc-200 outline-none transition focus:border-yellow-400"
            >
                {options.map((option) => (
                    <option
                        key={option}
                        value={option}
                        className="bg-zinc-950 text-zinc-100"
                    >
                        {option}
                    </option>
                ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        </label>
    )
}

export function ContractFilters({
    search,
    setSearch,
    status,
    setStatus,
    type,
    setType,
    priority,
    setPriority,
}: {
    search: string
    setSearch: (value: string) => void
    status: string
    setStatus: (value: string) => void
    type: string
    setType: (value: string) => void
    priority: string
    setPriority: (value: string) => void
}) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-sm lg:flex-row">
            <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search contracts, counterparties, or IDs"
                    className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-zinc-950"
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <FilterSelect
                    value={status}
                    onChange={setStatus}
                    options={statuses}
                />

                <FilterSelect
                    value={type}
                    onChange={setType}
                    options={["All types", ...contractTypes]}
                />

                <FilterSelect
                    value={priority}
                    onChange={setPriority}
                    options={priorities}
                />
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Contract table                                                              */
/* -------------------------------------------------------------------------- */

export function ContractTable({
    contracts,
}: {
    contracts: Contract[]
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                    <thead className="border-b border-zinc-800 bg-zinc-900">
                        <tr>
                            {[
                                "Contract",
                                "Type",
                                "Status",
                                "Priority",
                                "Counterparty",
                                "Assigned Professional",
                                "Expiry",
                                "Created",
                                "",
                            ].map((heading, index) => (
                                <th
                                    key={`${heading}-${index}`}
                                    className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                        {contracts.map((contract) => {
                            const professional = displayUserName(
                                contract.assignedProfessional
                            )

                            const counterparty = displayCounterparty(
                                contract.counterparty
                            )

                            return (
                                <tr
                                    key={contract._id}
                                    className="group transition hover:bg-zinc-900"
                                >
                                    <td className="px-5 py-4">
                                        <Link
                                            href={`/dashboard/contracts/${contract._id}`}
                                            className="group/link flex items-center gap-3"
                                        >
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                                                <FileText className="size-4" />
                                            </span>

                                            <span className="min-w-0">
                                                <span className="block max-w-[230px] truncate text-sm font-semibold text-white group-hover/link:text-yellow-400">
                                                    {contract.title}
                                                </span>

                                                <span className="mt-0.5 block text-xs text-zinc-500">
                                                    {contract.contractNumber}
                                                </span>
                                            </span>
                                        </Link>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="text-sm text-zinc-300">
                                            {contract.contractType}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <StatusBadge status={contract.status} />
                                    </td>

                                    <td className="px-5 py-4">
                                        <PriorityBadge
                                            priority={contract.priority}
                                        />
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="block max-w-[180px] truncate text-sm text-zinc-300">
                                            {counterparty}
                                        </span>

                                        {contract.counterparty.company && (
                                            <span className="mt-0.5 block max-w-[180px] truncate text-[11px] text-zinc-500">
                                                {contract.counterparty.company}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                name={professional}
                                                tone="bg-yellow-400/10 text-yellow-400"
                                            />

                                            <div className="min-w-0">
                                                <span className="block max-w-[150px] truncate text-sm text-zinc-300">
                                                    {professional}
                                                </span>

                                                {contract.assignedProfessional &&
                                                    typeof contract.assignedProfessional !==
                                                    "string" &&
                                                    contract.assignedProfessional.email && (
                                                        <span className="block max-w-[150px] truncate text-[11px] text-zinc-500">
                                                            {
                                                                contract
                                                                    .assignedProfessional
                                                                    .email
                                                            }
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                                            <CalendarDays className="size-4" />
                                            {formatContractDate(
                                                contract.expiryDate
                                            )}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="text-xs text-zinc-500">
                                            {formatContractDate(
                                                contract.createdAt
                                            )}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4 text-right">
                                        <Link
                                            href={`/dashboard/contracts/${contract._id}`}
                                            aria-label={`View ${contract.title}`}
                                            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-yellow-400"
                                        >
                                            <ArrowUpRight className="size-4" />
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {contracts.length === 0 && (
                <div className="p-12 text-center">
                    <FileText className="mx-auto size-6 text-zinc-700" />

                    <h3 className="mt-3 text-sm font-semibold text-white">
                        No contracts found
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                        Contracts created for your business will appear here.
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">
                <span>
                    Showing {contracts.length} contract
                    {contracts.length !== 1 ? "s" : ""}
                </span>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Request table                                                               */
/* -------------------------------------------------------------------------- */

export function RequestTable({
    requests,
}: {
    requests: ContractRequest[]
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                    <thead className="border-b border-zinc-800 bg-zinc-900">
                        <tr>
                            {[
                                "Request",
                                "Type",
                                "Status",
                                "Priority",
                                "Assigned Professional",
                                "Expected Delivery",
                                "Created",
                                "",
                            ].map((heading, index) => (
                                <th
                                    key={`${heading}-${index}`}
                                    className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                        {requests.map((request) => {
                            const professional = displayUserName(
                                request.assignedProfessional
                            )

                            return (
                                <tr
                                    key={request._id}
                                    className="group transition hover:bg-zinc-900"
                                >
                                    <td className="px-5 py-4">
                                        <Link
                                            href={`/dashboard/contracts/${request._id}`}
                                            className="group/link flex items-center gap-3"
                                        >
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                                                <FileText className="size-4" />
                                            </span>

                                            <span className="min-w-0">
                                                <span className="block max-w-[240px] truncate text-sm font-semibold text-white group-hover/link:text-yellow-400">
                                                    {request.title}
                                                </span>

                                                <span className="mt-0.5 block text-xs text-zinc-500">
                                                    {request.requestNumber}
                                                </span>
                                            </span>
                                        </Link>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300">
                                            {request.contractType}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <StatusBadge status={request.status} />
                                    </td>

                                    <td className="px-5 py-4">
                                        <PriorityBadge
                                            priority={request.priority}
                                        />
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                name={professional}
                                                tone="bg-yellow-400/10 text-yellow-400"
                                            />

                                            <div className="min-w-0">
                                                <span className="block max-w-[180px] truncate text-sm text-zinc-300">
                                                    {professional}
                                                </span>

                                                {request.assignedProfessional &&
                                                    typeof request.assignedProfessional !==
                                                    "string" &&
                                                    request.assignedProfessional.email && (
                                                        <span className="block max-w-[180px] truncate text-[11px] text-zinc-500">
                                                            {
                                                                request
                                                                    .assignedProfessional
                                                                    .email
                                                            }
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                                            <CalendarDays className="size-4 shrink-0" />
                                            {formatContractDate(
                                                request.expectedDeliveryDate
                                            )}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="text-xs text-zinc-500">
                                            {formatContractDate(
                                                request.createdAt
                                            )}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4 text-right">
                                        <Link
                                            href={`/dashboard/contracts/${request._id}`}
                                            aria-label={`View ${request.title}`}
                                            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-yellow-400"
                                        >
                                            <ArrowUpRight className="size-4" />
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {requests.length === 0 && (
                <div className="p-12 text-center">
                    <FileText className="mx-auto size-6 text-zinc-700" />

                    <h3 className="mt-3 text-sm font-semibold text-white">
                        No contract requests found
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                        Contract requests submitted by your business will
                        appear here.
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">
                <span>
                    Showing {requests.length} request
                    {requests.length !== 1 ? "s" : ""}
                </span>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* New request modal                                                           */
/* -------------------------------------------------------------------------- */

export function NewRequestModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean
    onClose: () => void
    onCreated: (
        data: ContractRequestFormData
    ) => Promise<void> | void
}) {
    const [form, setForm] = useState<ContractRequestFormData>({
        title: "",
        contractType: "NDA",
        priority: "Medium",
        expectedDeliveryDate: "",
        description: "",
    })

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    if (!open) return null

    const update = (
        key: keyof ContractRequestFormData,
        value: string
    ) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const reset = () => {
        setForm({
            title: "",
            contractType: "NDA",
            priority: "Medium",
            expectedDeliveryDate: "",
            description: "",
        })
        setError("")
    }

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!form.title?.trim()) {
            setError("Request title is required.")
            return
        }

        if (!form.description?.trim()) {
            setError("Description is required.")
            return
        }

        if (!form.expectedDeliveryDate) {
            setError("Expected delivery date is required.")
            return
        }

        try {
            setSaving(true)
            setError("")

            await onCreated({
                ...form,
                title: form.title.trim(),
                description: form.description.trim(),
            })

            reset()
            onClose()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create request."
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="request-dialog-title"
                className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400">
                            Legal operations
                        </p>

                        <h2
                            id="request-dialog-title"
                            className="mt-1 text-xl font-semibold text-white"
                        >
                            New legal request
                        </h2>

                        <p className="mt-1 text-sm text-zinc-400">
                            Tell us what your business needs. A professional
                            will be assigned shortly.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        disabled={saving}
                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">
                        Request title

                        <input
                            required
                            value={form.title ?? ""}
                            onChange={(event) =>
                                update("title", event.target.value)
                            }
                            placeholder="e.g. Mutual NDA with a new partner"
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-yellow-400"
                        />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">
                            Contract type

                            <select
                                value={form.contractType ?? "NDA"}
                                onChange={(event) =>
                                    update(
                                        "contractType",
                                        event.target.value
                                    )
                                }
                                className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-yellow-400"
                            >
                                {contractTypes.map((type) => (
                                    <option
                                        key={type}
                                        value={type}
                                        className="bg-zinc-950 text-zinc-100"
                                    >
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">
                            Priority

                            <select
                                value={form.priority ?? "Medium"}
                                onChange={(event) =>
                                    update(
                                        "priority",
                                        event.target.value
                                    )
                                }
                                className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-yellow-400"
                            >
                                {priorities.map((priority) => (
                                    <option
                                        key={priority}
                                        value={priority}
                                        className="bg-zinc-950 text-zinc-100"
                                    >
                                        {priority}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">
                        Target date

                        <input
                            type="date"
                            required
                            value={form.expectedDeliveryDate ?? ""}
                            onChange={(event) =>
                                update(
                                    "expectedDeliveryDate",
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-yellow-400"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">
                        Brief description

                        <textarea
                            required
                            value={form.description ?? ""}
                            onChange={(event) =>
                                update(
                                    "description",
                                    event.target.value
                                )
                            }
                            rows={4}
                            placeholder="Add context, counterparties, or specific clauses you need."
                            className="resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-yellow-400"
                        />
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-60"
                        >
                            {saving ? "Submitting…" : "Submit request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Contract overview                                                           */
/* -------------------------------------------------------------------------- */

export function ContractOverview({
    contract,
}: {
    contract: Contract
}) {
    const professional = displayUserName(contract.assignedProfessional)

    return (
        <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">
                        Contract overview
                    </h2>

                    <Badge className="border-yellow-400/30 bg-yellow-400/10 text-yellow-400">
                        <ShieldCheck className="mr-1 size-3.5" />
                        Confidential
                    </Badge>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
                    {contract.description ||
                        "No contract description available."}
                </p>

                <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Info
                        label="Counterparty"
                        value={displayCounterparty(contract.counterparty)}
                    />

                    <Info
                        label="Contract value"
                        value={formatContractValue(
                            contract.contractValue,
                            contract.currency
                        )}
                    />

                    <Info
                        label="Effective date"
                        value={formatContractDate(contract.effectiveDate)}
                    />

                    <Info
                        label="Expiry date"
                        value={formatContractDate(contract.expiryDate)}
                    />

                    <Info
                        label="Renewal date"
                        value={formatContractDate(contract.renewalDate)}
                    />

                    <Info
                        label="Current version"
                        value={getContractVersionLabel(
                            contract.currentVersion
                        )}
                    />

                    <Info
                        label="Contract number"
                        value={contract.contractNumber}
                    />

                    <Info label="Status" value={contract.status} />
                </dl>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-white">
                    Assigned professional
                </h2>

                <div className="mt-5 flex items-center gap-3">
                    <Avatar
                        name={professional}
                        tone="bg-yellow-400/10 text-yellow-400"
                    />

                    <div>
                        <p className="text-sm font-semibold text-white">
                            {professional}
                        </p>

                        <p className="text-xs text-zinc-500">
                            Legal professional · NyayMitra
                        </p>

                        {contract.assignedProfessional &&
                            typeof contract.assignedProfessional !==
                            "string" &&
                            contract.assignedProfessional.email && (
                                <p className="mt-0.5 text-xs text-zinc-500">
                                    {contract.assignedProfessional.email}
                                </p>
                            )}
                    </div>
                </div>

                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        className="flex-1 rounded-xl border border-zinc-800 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                    >
                        <MessageSquare className="mr-1 inline size-3.5" />
                        Message
                    </button>

                    <button
                        type="button"
                        className="flex-1 rounded-xl border border-zinc-800 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                    >
                        Schedule call
                    </button>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs leading-5 text-zinc-400">
                    Your legal professional is notified when you add a
                    comment or upload a new document.
                </div>
            </section>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Documents — real R2 download                                               */
/* -------------------------------------------------------------------------- */

function formatFileSize(size?: number | null): string {
    if (!size || size <= 0) return "Unknown size"
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024)
        return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function isBusinessDocumentLike(
    value: unknown
): value is ContractDocumentLike & { _id: string } {
    return (
        isObject(value) &&
        typeof (value as { _id?: unknown })._id === "string"
    )
}

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value)
}

function guessExtension(mimeType?: string, name?: string): string {
    if (name && name.includes(".")) {
        return name.split(".").pop()!.toLowerCase()
    }
    if (!mimeType) return "bin"
    if (mimeType.includes("pdf")) return "pdf"
    if (mimeType.includes("word")) return "docx"
    if (mimeType.includes("sheet")) return "xlsx"
    if (mimeType.includes("png")) return "png"
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg"
    return "bin"
}

/**
 * Convert a contract into a flat list of downloadable rows.
 *
 * Every row carries a "source" so we know which backend endpoint
 * to hit for a fresh signed R2 URL at click time.
 */
function collectDocumentRows(contract: Contract): DocumentRow[] {
    const rows: DocumentRow[] = []
    const seen = new Set<string>()

    const push = (row: DocumentRow) => {
        if (seen.has(row.id)) return
        seen.add(row.id)
        rows.push(row)
    }

    // currentDocument → final "pdf"
    if (isBusinessDocumentLike(contract.currentDocument)) {
        const doc = contract.currentDocument
        push({
            id: doc._id,
            name: doc.originalName || doc.name || "Contract (final PDF)",
            mimeType: doc.mimeType,
            size: doc.size,
            source: { kind: "final", fileType: "pdf" },
        })
    } else if (typeof contract.currentDocument === "string") {
        push({
            id: contract.currentDocument,
            name: "Contract (final PDF)",
            source: { kind: "final", fileType: "pdf" },
        })
    }

    // signedDocument → final "signedPdf"
    if (isBusinessDocumentLike(contract.signedDocument)) {
        const doc = contract.signedDocument
        push({
            id: doc._id,
            name: doc.originalName || doc.name || "Contract (signed PDF)",
            mimeType: doc.mimeType,
            size: doc.size,
            source: { kind: "final", fileType: "signedPdf" },
        })
    } else if (typeof contract.signedDocument === "string") {
        push({
            id: contract.signedDocument,
            name: "Contract (signed PDF)",
            source: { kind: "final", fileType: "signedPdf" },
        })
    }

    // supportingDocuments[]
    if (Array.isArray(contract.supportingDocuments)) {
        for (const doc of contract.supportingDocuments) {
            if (!isBusinessDocumentLike(doc)) continue
            push({
                id: doc._id,
                name: doc.originalName || doc.name || "Supporting document",
                mimeType: doc.mimeType,
                size: doc.size,
                source: { kind: "supporting", documentId: doc._id },
            })
        }
    }

    return rows
}

/**
 * Fetch an R2 object from a signed URL and force a browser save.
 *
 * We do NOT send an Authorization header to R2 — the signed URL
 * is self-authorizing and extra headers invalidate the signature.
 */
async function saveFromUrl(signedUrl: string, filename: string) {
    const response = await fetch(signedUrl, {
        method: "GET",
        credentials: "omit",
        mode: "cors",
    })

    if (!response.ok) {
        throw new Error(
            `Failed to fetch file (${response.status} ${response.statusText})`
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

export function ContractDocuments({
    contract,
    onUpload,
}: {
    contract: Contract
    onUpload?: () => void
}) {
    const rows = collectDocumentRows(contract)

    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [errorById, setErrorById] = useState<Record<string, string>>({})

    const handleDownload = async (row: DocumentRow) => {
        if (downloadingId) return

        setDownloadingId(row.id)
        setErrorById((prev) => {
            const next = { ...prev }
            delete next[row.id]
            return next
        })

        try {
            // 1) Ask backend for a fresh signed R2 URL.
            const urlResponse =
                row.source.kind === "final"
                    ? await contractService.getFinalFileUrl(
                        contract._id,
                        row.source.fileType
                    )
                    : await contractService.getSupportingDocumentUrl(
                        contract._id,
                        row.source.documentId
                    )

            const signedUrl = urlResponse?.url

            if (!signedUrl) {
                throw new Error("Backend did not return a download URL.")
            }

            if (!isAbsoluteUrl(signedUrl)) {
                throw new Error(
                    "Backend returned a non-absolute URL for the R2 object."
                )
            }

            // 2) Fetch and force save.
            const ext = guessExtension(row.mimeType, row.name)
            const filename = row.name.includes(".")
                ? row.name
                : `${row.name}.${ext}`

            await saveFromUrl(signedUrl, filename)
        } catch (err) {
            console.error("Document download failed:", err)

            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to download this document."

            setErrorById((prev) => ({ ...prev, [row.id]: message }))
        } finally {
            setDownloadingId(null)
        }
    }

    return (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-white">
                        Documents
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Files associated with this contract.
                    </p>
                </div>

                {onUpload && (
                    <button
                        type="button"
                        onClick={onUpload}
                        className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                    >
                        <Plus className="mr-1 inline size-3.5" />
                        Upload
                    </button>
                )}
            </div>

            {rows.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                    <FileText className="mx-auto size-6 text-zinc-700" />

                    <p className="mt-3 text-sm text-zinc-400">
                        No documents attached to this contract.
                    </p>
                </div>
            ) : (
                <ul className="mt-4 flex flex-col divide-y divide-zinc-800/70">
                    {rows.map((row) => {
                        const isDownloading = downloadingId === row.id
                        const rowError = errorById[row.id]

                        return (
                            <li
                                key={row.id}
                                className="flex items-center justify-between gap-3 py-3"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400">
                                        <FileText className="size-4" />
                                    </span>

                                    <div className="min-w-0">
                                        <p className="max-w-[220px] truncate text-xs font-semibold text-zinc-100">
                                            {row.name}
                                        </p>

                                        <p className="mt-1 truncate text-[11px] text-zinc-500">
                                            {row.mimeType ||
                                                "application/octet-stream"}
                                            {row.size
                                                ? ` · ${formatFileSize(row.size)}`
                                                : ""}
                                        </p>

                                        {rowError && (
                                            <p className="mt-1 text-[11px] text-red-400">
                                                {rowError}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleDownload(row)}
                                    disabled={isDownloading}
                                    aria-label={`Download ${row.name}`}
                                    title={`Download ${row.name}`}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isDownloading ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Download className="size-3.5" />
                                    )}

                                    {isDownloading ? "Preparing" : "Download"}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}

/* -------------------------------------------------------------------------- */
/* Activity                                                                    */
/* -------------------------------------------------------------------------- */

export function ContractActivity({
    contract,
    activities = [],
}: {
    contract: Contract
    activities?: ActivityLike[]
}) {
    const fallbackActivity: ActivityLike[] = [
        {
            id: "created",
            label: "Contract created",
            description: "Contract record was created.",
            createdAt: contract.createdAt,
        },
    ]

    const items = activities.length > 0 ? activities : fallbackActivity

    return (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-white">
                        Activity
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Recent activity on this contract.
                    </p>
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-5">
                {items.map((item, index) => {
                    const label =
                        item.title ??
                        item.label ??
                        item.action ??
                        item.event ??
                        item.type ??
                        "Contract activity"

                    const detail = item.description ?? item.detail ?? ""
                    const date = item.createdAt ?? item.date

                    const performedBy = item.performedBy ?? item.user
                    const performedByName = performedBy
                        ? displayUserName(performedBy as never)
                        : null

                    return (
                        <div
                            key={
                                item._id ??
                                item.id ??
                                `${label}-${index}`
                            }
                            className="relative flex gap-3"
                        >
                            <div className="flex flex-col items-center">
                                <span
                                    className={`mt-1 flex size-7 items-center justify-center rounded-full ${index === 0
                                        ? "bg-yellow-400/10 text-yellow-400"
                                        : "bg-zinc-800 text-zinc-400"
                                        }`}
                                >
                                    <Check className="size-3.5" />
                                </span>

                                {index < items.length - 1 && (
                                    <span className="mt-1 h-full w-px bg-zinc-800" />
                                )}
                            </div>

                            <div className="pb-2">
                                <p className="text-sm font-semibold text-zinc-100">
                                    {label}
                                </p>

                                {date && (
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {formatContractDate(date)}
                                    </p>
                                )}

                                {performedByName && (
                                    <p className="mt-1 text-xs text-zinc-500">
                                        By {performedByName}
                                    </p>
                                )}

                                {detail && (
                                    <p className="mt-2 text-sm leading-5 text-zinc-400">
                                        {detail}
                                    </p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

/* -------------------------------------------------------------------------- */
/* Comments                                                                    */
/* -------------------------------------------------------------------------- */

export type ContractComment = {
    _id?: string
    id?: string
    comment?: string
    text?: string
    content?: string
    createdAt?: string
    user?: unknown
    createdBy?: unknown
}

export function CommentComposer({
    comments = [],
    currentUser,
    onSubmit,
    submitting = false,
}: {
    comments?: ContractComment[]
    currentUser?: unknown
    onSubmit?: (comment: string) => Promise<void> | void
    submitting?: boolean
}) {
    const [comment, setComment] = useState("")
    const [error, setError] = useState("")

    const userName = displayUserName(currentUser as never)

    const submit = async () => {
        const value = comment.trim()

        if (!value || !onSubmit || submitting) return

        try {
            setError("")
            await onSubmit(value)
            setComment("")
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to post comment."
            )
        }
    }

    return (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-white">Comments</h2>

            <div className="mt-4 flex items-start gap-3">
                <Avatar
                    name={userName}
                    tone="bg-yellow-400/10 text-yellow-400"
                />

                <div className="min-w-0 flex-1">
                    <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Add a note for your legal professional…"
                        rows={3}
                        disabled={submitting}
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-yellow-400 disabled:opacity-60"
                    />

                    {error && (
                        <p className="mt-2 text-xs text-red-400">{error}</p>
                    )}

                    <div className="mt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={submit}
                            disabled={
                                !comment.trim() || !onSubmit || submitting
                            }
                            className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-40"
                        >
                            {submitting ? "Posting…" : "Post comment"}
                        </button>
                    </div>
                </div>
            </div>

            {comments.length > 0 && (
                <div className="mt-4">
                    {comments.map((item, index) => {
                        const text =
                            item.comment ?? item.text ?? item.content ?? ""

                        const author = displayUserName(
                            item.user ?? item.createdBy
                        )

                        return (
                            <div
                                key={
                                    item._id ??
                                    item.id ??
                                    `${index}-${text}`
                                }
                                className="flex gap-3 border-t border-zinc-800 py-4"
                            >
                                <Avatar
                                    name={author}
                                    tone="bg-yellow-400/10 text-yellow-400"
                                />

                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-zinc-100">
                                        {author}

                                        {item.createdAt && (
                                            <span className="ml-2 font-normal text-zinc-500">
                                                {formatContractDate(
                                                    item.createdAt
                                                )}
                                            </span>
                                        )}
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
                                        {text}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {comments.length === 0 && (
                <p className="mt-5 border-t border-zinc-800 pt-4 text-xs text-zinc-600">
                    No comments yet.
                </p>
            )}
        </section>
    )
}

/* -------------------------------------------------------------------------- */
/* Mobile section tabs                                                         */
/* -------------------------------------------------------------------------- */

export function MobileSectionTabs({
    active,
    setActive,
}: {
    active: "contracts" | "requests"
    setActive: (value: "contracts" | "requests") => void
}) {
    return (
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
            <button
                type="button"
                onClick={() => setActive("contracts")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${active === "contracts"
                    ? "bg-yellow-400 text-black shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                    }`}
            >
                Contracts
            </button>

            <button
                type="button"
                onClick={() => setActive("requests")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${active === "requests"
                    ? "bg-yellow-400 text-black shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                    }`}
            >
                Requests
            </button>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */

export const UIIcons = {
    SlidersHorizontal,
    UserRound,
    MoreHorizontal,
    FileText,
    Filter,
}