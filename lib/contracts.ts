/* ==========================================================================
   lib/contracts.ts

   UI-only helpers/constants for the Contracts module.

   IMPORTANT:
   - No mock contracts
   - No mock requests
   - No fake API calls
   - Backend communication belongs to:
       @/lib/services/contract.service
   ========================================================================== */

import type {
    Contract,
    ContractRequest,
    ContractStatus,
    ContractRequestStatus,
    ContractRequestPriority,
    ContractType,
    ContractVersion,
} from "@/lib/services/contract.service"

/* --------------------------------------------------------------------------
   Type re-exports
   -------------------------------------------------------------------------- */

export type {
    Contract,
    ContractRequest,
    ContractStatus,
    ContractRequestStatus,
    ContractRequestPriority,
    ContractType,
    ContractVersion,
}

/* --------------------------------------------------------------------------
   Contract types
   -------------------------------------------------------------------------- */

export const contractTypes = [
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
] as const

/* --------------------------------------------------------------------------
   Contract statuses
   -------------------------------------------------------------------------- */

export const statuses = [
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

/* --------------------------------------------------------------------------
   Request statuses
   -------------------------------------------------------------------------- */

export const requestStatuses = [
    "Pending",
    "Under Review",
    "Assigned",
    "Converted",
    "Completed",
    "Cancelled",
] as const

/* --------------------------------------------------------------------------
   Priorities
   -------------------------------------------------------------------------- */

export const priorities = [
    "Low",
    "Medium",
    "High",
    "Urgent",
] as const

/* --------------------------------------------------------------------------
   UI class helpers
   -------------------------------------------------------------------------- */

export function statusClass(status?: string | null): string {
    switch (status) {
        case "Draft":
            return "bg-slate-100 text-slate-700"

        case "Internal Review":
            return "bg-blue-100 text-blue-700"

        case "Client Review":
            return "bg-indigo-100 text-indigo-700"

        case "Revision Requested":
            return "bg-orange-100 text-orange-700"

        case "Approved":
            return "bg-emerald-100 text-emerald-700"

        case "Pending Signature":
            return "bg-yellow-100 text-yellow-700"

        case "Executed":
            return "bg-green-100 text-green-700"

        case "Active":
            return "bg-green-100 text-green-700"

        case "Expired":
            return "bg-red-100 text-red-700"

        case "Terminated":
            return "bg-red-100 text-red-700"

        case "Archived":
            return "bg-gray-100 text-gray-700"

        /* Contract Request statuses */

        case "Pending":
            return "bg-yellow-100 text-yellow-700"

        case "Under Review":
            return "bg-blue-100 text-blue-700"

        case "Assigned":
            return "bg-indigo-100 text-indigo-700"

        case "Converted":
            return "bg-purple-100 text-purple-700"

        case "Completed":
            return "bg-green-100 text-green-700"

        case "Cancelled":
            return "bg-red-100 text-red-700"

        default:
            return "bg-slate-100 text-slate-700"
    }
}

export function priorityClass(priority?: string | null): string {
    switch (priority) {
        case "Low":
            return "bg-slate-100 text-slate-700"

        case "Medium":
            return "bg-blue-100 text-blue-700"

        case "High":
            return "bg-orange-100 text-orange-700"

        case "Urgent":
            return "bg-red-100 text-red-700"

        default:
            return "bg-slate-100 text-slate-700"
    }
}

/* --------------------------------------------------------------------------
   Initials
   -------------------------------------------------------------------------- */

export function initials(
    value?: string | null,
): string {
    if (!value) return "—"

    const parts = value
        .trim()
        .split(/\s+/)
        .filter(Boolean)

    if (!parts.length) return "—"

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase()
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/* --------------------------------------------------------------------------
   Generic object helpers
   -------------------------------------------------------------------------- */

type PopulatedUser = {
    _id?: string
    id?: string
    name?: string
    fullName?: string
    firstName?: string
    lastName?: string
    userId?: string
    email?: string
}

type PopulatedCounterparty = {
    name?: string
    company?: string
    email?: string
    phone?: string
    address?: string
}

function isObject(
    value: unknown,
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

/* --------------------------------------------------------------------------
   User display helper
   -------------------------------------------------------------------------- */

export function displayUserName(
    user?: unknown,
): string {
    if (!user) return "Unassigned"

    if (typeof user === "string") {
        return user
    }

    if (!isObject(user)) {
        return "Unassigned"
    }

    const typedUser = user as PopulatedUser

    if (typedUser.name) {
        return typedUser.name
    }

    if (typedUser.fullName) {
        return typedUser.fullName
    }

    const firstName = typedUser.firstName?.trim() ?? ""
    const lastName = typedUser.lastName?.trim() ?? ""

    const fullName = `${firstName} ${lastName}`.trim()

    if (fullName) {
        return fullName
    }

    if (typedUser.userId) {
        return typedUser.userId
    }

    if (typedUser.email) {
        return typedUser.email
    }

    return "Unassigned"
}

/* --------------------------------------------------------------------------
   Counterparty display helper
   -------------------------------------------------------------------------- */

export function displayCounterparty(
    counterparty?: unknown,
): string {
    if (!counterparty) {
        return "Not specified"
    }

    if (typeof counterparty === "string") {
        return counterparty
    }

    if (!isObject(counterparty)) {
        return "Not specified"
    }

    const typedCounterparty =
        counterparty as PopulatedCounterparty

    if (
        typedCounterparty.name &&
        typedCounterparty.company
    ) {
        return `${typedCounterparty.name} • ${typedCounterparty.company}`
    }

    if (typedCounterparty.company) {
        return typedCounterparty.company
    }

    if (typedCounterparty.name) {
        return typedCounterparty.name
    }

    if (typedCounterparty.email) {
        return typedCounterparty.email
    }

    return "Not specified"
}

/* --------------------------------------------------------------------------
   Date formatting
   -------------------------------------------------------------------------- */

export function formatContractDate(
    value?: string | Date | null,
    fallback = "—",
): string {
    if (!value) {
        return fallback
    }

    const date = value instanceof Date
        ? value
        : new Date(value)

    if (Number.isNaN(date.getTime())) {
        return fallback
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date)
}

/* --------------------------------------------------------------------------
   Currency formatting
   -------------------------------------------------------------------------- */

export function formatContractValue(
    value?: number | string | null,
    currency = "INR",
): string {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—"
    }

    const numericValue =
        typeof value === "number"
            ? value
            : Number(value)

    if (!Number.isFinite(numericValue)) {
        return "—"
    }

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(numericValue)
    } catch {
        return `${currency} ${numericValue.toLocaleString("en-IN")}`
    }
}

/* --------------------------------------------------------------------------
   Contract version helper
   -------------------------------------------------------------------------- */

type VersionLike =
    | ContractVersion
    | string
    | {
        _id?: string
        id?: string
        versionNumber?: number | string
        version?: number | string
        label?: string
        versionLabel?: string
    }
    | null
    | undefined

export function getContractVersionLabel(
    version?: VersionLike,
): string {
    if (!version) {
        return "No version"
    }

    if (typeof version === "string") {
        return version
    }

    if (!isObject(version)) {
        return "No version"
    }

    const value = version as {
        versionNumber?: number | string
        version?: number | string
        label?: string
        versionLabel?: string
    }

    if (value.versionLabel) {
        return value.versionLabel
    }

    if (value.label) {
        return value.label
    }

    if (
        value.versionNumber !== undefined &&
        value.versionNumber !== null
    ) {
        return `v${value.versionNumber}`
    }

    if (
        value.version !== undefined &&
        value.version !== null
    ) {
        return `v${value.version}`
    }

    return "Version"
}

/* --------------------------------------------------------------------------
   Safe ID helper
   -------------------------------------------------------------------------- */

export function getEntityId(
    value?: unknown,
): string | null {
    if (!value) {
        return null
    }

    if (typeof value === "string") {
        return value
    }

    if (!isObject(value)) {
        return null
    }

    const object = value as {
        _id?: unknown
        id?: unknown
    }

    if (typeof object._id === "string") {
        return object._id
    }

    if (typeof object.id === "string") {
        return object.id
    }

    return null
}

/* --------------------------------------------------------------------------
   Contract type label
   -------------------------------------------------------------------------- */

export function formatContractType(
    type?: string | null,
): string {
    if (!type) return "—"

    return type
}

/* --------------------------------------------------------------------------
   Status label
   -------------------------------------------------------------------------- */

export function formatContractStatus(
    status?: string | null,
): string {
    if (!status) return "—"

    return status
}

/* --------------------------------------------------------------------------
   Priority label
   -------------------------------------------------------------------------- */

export function formatContractPriority(
    priority?: string | null,
): string {
    if (!priority) return "—"

    return priority
}

/* --------------------------------------------------------------------------
   Request number
   -------------------------------------------------------------------------- */

export function getRequestNumber(
    request?: ContractRequest | null,
): string {
    return request?.requestNumber ?? "—"
}

/* --------------------------------------------------------------------------
   Contract number
   -------------------------------------------------------------------------- */

export function getContractNumber(
    contract?: Contract | null,
): string {
    return contract?.contractNumber ?? "—"
}

/* --------------------------------------------------------------------------
   Archive helper
   -------------------------------------------------------------------------- */

export function isContractArchived(
    contract?: Contract | null,
): boolean {
    return Boolean(
        contract?.isArchived ||
        contract?.status === "Archived",
    )
}

/* --------------------------------------------------------------------------
   Expiry helper
   -------------------------------------------------------------------------- */

export function isContractExpired(
    contract?: Contract | null,
): boolean {
    if (!contract?.expiryDate) {
        return false
    }

    const expiry = new Date(contract.expiryDate)

    if (Number.isNaN(expiry.getTime())) {
        return false
    }

    return expiry.getTime() < Date.now()
}

/* --------------------------------------------------------------------------
   Renewal helper
   -------------------------------------------------------------------------- */

export function isContractDueForRenewal(
    contract?: Contract | null,
    days = 90,
): boolean {
    if (!contract?.renewalDate) {
        return false
    }

    const renewal = new Date(contract.renewalDate)

    if (Number.isNaN(renewal.getTime())) {
        return false
    }

    const now = Date.now()

    const threshold =
        now + days * 24 * 60 * 60 * 1000

    return (
        renewal.getTime() >= now &&
        renewal.getTime() <= threshold
    )
}