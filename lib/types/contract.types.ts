// lib/contracts.ts

import type {
    Contract,
    ContractRequest,
    ContractStatus,
    ContractRequestStatus,
    ContractPriority,
    ContractRequestPriority,
    ContractType,
    ContractRequestFormData,
    ContractUpdateData,
} from "@/lib/services/contract.service"

// Re-export API/domain types so existing components can import them
// from "@/lib/contracts" without duplicating the models.
export type {
    Contract,
    ContractRequest,
    ContractStatus,
    ContractRequestStatus,
    ContractPriority,
    ContractRequestPriority,
    ContractType,
    ContractRequestFormData,
    ContractUpdateData,
}

// Backward-compatible aliases for UI components.
// These are type aliases only — no mock/static data.
export type Priority = ContractPriority | ContractRequestPriority
export type RequestStatus = ContractRequestStatus

/**
 * Contract type options used by filters/forms.
 *
 * Keep these aligned with the backend Contract schema.
 */
export const contractTypes: ContractType[] = [
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
]

/**
 * Contract statuses used by the contracts UI.
 *
 * "All statuses" is a UI-only filter value and is intentionally
 * not part of ContractStatus.
 */
export const statuses = [
    "All statuses",
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
] as const

/**
 * Request statuses used by the requests UI.
 */
export const requestStatuses = [
    "All statuses",
    "Pending",
    "Under Review",
    "Assigned",
    "Converted",
    "Completed",
    "Cancelled",
] as const

/**
 * Priority filter options.
 */
export const priorities = [
    "All priorities",
    "Low",
    "Medium",
    "High",
    "Urgent",
] as const

/**
 * Convert a status into the Tailwind classes used by the UI.
 */
export function statusClass(status: string): string {
    const classes: Record<string, string> = {
        Active:
            "bg-emerald-500/10 text-emerald-700 border-emerald-200",

        "Internal Review":
            "bg-violet-500/10 text-violet-700 border-violet-200",

        "Client Review":
            "bg-sky-500/10 text-sky-700 border-sky-200",

        "Revision Requested":
            "bg-orange-500/10 text-orange-700 border-orange-200",

        Approved:
            "bg-emerald-500/10 text-emerald-700 border-emerald-200",

        "Pending Signature":
            "bg-amber-500/10 text-amber-700 border-amber-200",

        Executed:
            "bg-emerald-500/10 text-emerald-700 border-emerald-200",

        Draft:
            "bg-slate-100 text-slate-700 border-slate-200",

        Expired:
            "bg-red-500/10 text-red-700 border-red-200",

        Terminated:
            "bg-red-500/10 text-red-700 border-red-200",

        Archived:
            "bg-slate-100 text-slate-600 border-slate-200",

        Pending:
            "bg-amber-500/10 text-amber-700 border-amber-200",

        "Under Review":
            "bg-violet-500/10 text-violet-700 border-violet-200",

        Assigned:
            "bg-blue-500/10 text-blue-700 border-blue-200",

        Converted:
            "bg-sky-500/10 text-sky-700 border-sky-200",

        Completed:
            "bg-emerald-500/10 text-emerald-700 border-emerald-200",

        Cancelled:
            "bg-red-500/10 text-red-700 border-red-200",
    }

    return (
        classes[status] ??
        "bg-slate-100 text-slate-700 border-slate-200"
    )
}

/**
 * Convert priority into the Tailwind text class used by the UI.
 */
export function priorityClass(priority: Priority): string {
    return {
        Low: "text-slate-500",
        Medium: "text-amber-600",
        High: "text-orange-600",
        Urgent: "text-red-600",
    }[priority]
}

/**
 * Generate initials from a person's name.
 */
export function initials(name?: string | null): string {
    if (!name) {
        return "—"
    }

    return name
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
}

/**
 * Safely extract a display name from an API populated user object
 * or a plain string/ObjectId.
 */
export function displayUserName(
    user:
        | string
        | {
            _id?: string
            userId?: string
            name?: string
            firstName?: string
            lastName?: string
            email?: string
        }
        | null
        | undefined
): string {
    if (!user) {
        return "Unassigned"
    }

    if (typeof user === "string") {
        return user
    }

    if (user.name) {
        return user.name
    }

    const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()

    if (fullName) {
        return fullName
    }

    if (user.email) {
        return user.email
    }

    if (user.userId) {
        return user.userId
    }

    return user._id ?? "Unassigned"
}

/**
 * Safely extract a business/company display name.
 *
 * The backend may return either an ObjectId/string or a populated object.
 */
export function displayBusinessName(
    business:
        | string
        | {
            _id?: string
            name?: string
            companyName?: string
            legalName?: string
        }
        | null
        | undefined
): string {
    if (!business) {
        return "—"
    }

    if (typeof business === "string") {
        return business
    }

    return (
        business.name ??
        business.companyName ??
        business.legalName ??
        business._id ??
        "—"
    )
}

/**
 * Safely extract counterparty name.
 */
export function displayCounterparty(
    counterparty:
        | Contract["counterparty"]
        | null
        | undefined
): string {
    if (!counterparty) {
        return "—"
    }

    return counterparty.name || counterparty.company || "—"
}

/**
 * Format a date returned by the API.
 *
 * This function deliberately accepts null/undefined because many
 * contract dates are optional in the backend schema.
 */
export function formatContractDate(
    value?: string | Date | null
): string {
    if (!value) {
        return "—"
    }

    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
        return "—"
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date)
}

/**
 * Format contract monetary value.
 */
export function formatContractValue(
    value?: number | null,
    currency = "INR"
): string {
    if (value === null || value === undefined) {
        return "—"
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Get a contract's display version.
 *
 * The actual Contract model stores currentVersion as an ObjectId
 * or populated ContractVersion object.
 */
export function getContractVersionLabel(
    currentVersion: Contract["currentVersion"]
): string {
    if (!currentVersion) {
        return "—"
    }

    if (typeof currentVersion === "string") {
        return currentVersion
    }

    if (typeof currentVersion === "object") {
        if ("versionNumber" in currentVersion) {
            return String(currentVersion.versionNumber)
        }

        // if ("version" in currentVersion) {
        //     return String(currentVersion.version)
        // }

        // Some populated version shapes may expose a name even though it is
        // not included in the ContractVersion type.
        const versionRecord = currentVersion as Record<string, unknown>
        if (versionRecord.name) {
            return String(versionRecord.name)
        }
    }

    return "—"
}

/**
 * Get assigned professional display name.
 */
export function getAssignedProfessional(
    professional: Contract["assignedProfessional"]
): string {
    return displayUserName(professional)
}

/**
 * Get requester's display name.
 */
export function getRequesterName(
    requester: ContractRequest["requestedBy"]
): string {
    return displayUserName(requester)
}

/**
 * Get request assignee display name.
 */
export function getRequestProfessional(
    professional: ContractRequest["assignedProfessional"]
): string {
    return displayUserName(professional)
}

/**
 * Filter contracts on the client.
 *
 * API remains the source of truth. This only handles the UI's
 * already-loaded collection.
 */
export function filterContracts(
    contracts: Contract[],
    filters: {
        search?: string
        status?: string
        contractType?: string
        priority?: string
    }
): Contract[] {
    const search = filters.search?.trim().toLowerCase() ?? ""
    const status = filters.status ?? "All statuses"
    const contractType = filters.contractType ?? "All types"
    const priority = filters.priority ?? "All priorities"

    return contracts.filter((contract) => {
        const matchesSearch =
            !search ||
            contract.title.toLowerCase().includes(search) ||
            contract.contractNumber.toLowerCase().includes(search) ||
            displayCounterparty(contract.counterparty)
                .toLowerCase()
                .includes(search)

        const matchesStatus =
            status === "All statuses" ||
            contract.status === status

        const matchesType =
            contractType === "All types" ||
            contract.contractType === contractType

        const matchesPriority =
            priority === "All priorities" ||
            contract.priority === priority

        return (
            matchesSearch &&
            matchesStatus &&
            matchesType &&
            matchesPriority
        )
    })
}

/**
 * Filter contract requests on the client.
 */
export function filterContractRequests(
    requests: ContractRequest[],
    filters: {
        search?: string
        status?: string
        priority?: string
        contractType?: string
    }
): ContractRequest[] {
    const search = filters.search?.trim().toLowerCase() ?? ""
    const status = filters.status ?? "All statuses"
    const priority = filters.priority ?? "All priorities"
    const contractType = filters.contractType ?? "All types"

    return requests.filter((request) => {
        const requester = getRequesterName(request.requestedBy)

        const matchesSearch =
            !search ||
            request.title.toLowerCase().includes(search) ||
            request.requestNumber.toLowerCase().includes(search) ||
            request.description?.toLowerCase().includes(search) ||
            requester.toLowerCase().includes(search)

        const matchesStatus =
            status === "All statuses" ||
            request.status === status

        const matchesPriority =
            priority === "All priorities" ||
            request.priority === priority

        const matchesType =
            contractType === "All types" ||
            request.contractType === contractType

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesType
        )
    })
}

/**
 * Backward-compatible type for request creation.
 *
 * NewRequest is intentionally based on the API request form,
 * not the old fake ContractRequest model.
 */
export type NewRequest = ContractRequestFormData

/**
 * IMPORTANT:
 *
 * There is intentionally NO:
 *
 * - requests[]
 * - contracts[]
 * - stats[]
 * - currentUser
 * - createRequest()
 * - fake getContract()
 * - fake contractService
 *
 * All API operations belong to:
 *
 *   @/lib/services/contract.service
 *
 * Example:
 *
 * import { contractService } from "@/lib/services/contract.service"
 *
 * const response = await contractService.getContracts({
 *   page: 1,
 *   limit: 50,
 * })
 */