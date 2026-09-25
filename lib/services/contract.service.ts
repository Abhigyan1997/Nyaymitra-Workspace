// lib/services/contract.service.ts

// ============================================================
// API CONFIG
// ============================================================

const API_ROOT =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://nyaymitra-backend-production.up.railway.app/api/v1";

const CONTRACT_REQUESTS_URL = `${API_ROOT}/contracts/requests`;
const CONTRACTS_URL = `${API_ROOT}/contracts`;


// ============================================================
// AUTH
// ============================================================

const getAuthToken = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const directToken =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("userToken");

    if (directToken) {
        return directToken;
    }

    try {
        const userStr = localStorage.getItem("user");

        if (userStr) {
            const user = JSON.parse(userStr);

            return (
                user?.token ||
                user?.accessToken ||
                user?.access_token ||
                null
            );
        }
    } catch {
        // Ignore invalid localStorage JSON
    }

    return null;
};


const getHeaders = (): HeadersInit => {
    const token = getAuthToken();

    if (!token) {
        throw new Error(
            "Authorization token is required. Please log in again."
        );
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};


// ============================================================
// COMMON TYPES
// ============================================================

export interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    data?: T;
    requests?: ContractRequest[];
    pagination?: Pagination;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}


// ============================================================
// CONTRACT REQUEST TYPES
// ============================================================

export type ContractRequestStatus =
    | "Pending"
    | "Under Review"
    | "Assigned"
    | "Converted"
    | "Completed"
    | "Cancelled";

export type ContractRequestPriority =
    | "Low"
    | "Medium"
    | "High"
    | "Urgent";


// ============================================================
// CONTRACT TYPES
// ============================================================

export type ContractType =
    | "NDA"
    | "Employment Agreement"
    | "Vendor Agreement"
    | "Service Agreement"
    | "Consulting Agreement"
    | "Partnership Agreement"
    | "Shareholder Agreement"
    | "Lease Agreement"
    | "MSA"
    | "SLA"
    | "Privacy Policy"
    | "Terms & Conditions"
    | "Website Policy"
    | "Founders Agreement"
    | "Investment Agreement"
    | "Custom Contract"
    | "Other";


export type ContractStatus =
    | "Draft"
    | "Internal Review"
    | "Client Review"
    | "Revision Requested"
    | "Approved"
    | "Pending Signature"
    | "Executed"
    | "Active"
    | "Expired"
    | "Terminated"
    | "Archived";


export type ContractPriority =
    | "Low"
    | "Medium"
    | "High"
    | "Urgent";


// ============================================================
// SHARED POPULATED TYPES
// ============================================================

export interface AuthUserReference {
    _id: string;
    userId?: string;
    fullName?: string;
    name?: string;
    email?: string;
    role?: string;
    profilePhoto?: string;
    avatar?: string;
}

export interface AssignedProfessional {
    _id: string;
    fullName?: string;
    name?: string;
    email?: string;
    profilePhoto?: string;
}


// ============================================================
// COUNTERPARTY
// ============================================================

export interface Counterparty {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
}


// ============================================================
// CONTRACT REQUEST FORM
// ============================================================

export interface ContractRequestFormData {
    title: string;
    contractType: ContractType;
    description?: string;
    priority?: ContractRequestPriority;
    expectedDeliveryDate?: string | null;
    specialInstructions?: string;
}


// ============================================================
// CONTRACT REQUEST
// ============================================================

export interface ContractRequest {
    _id: string;

    business:
    | string
    | {
        _id: string;
        name?: string;
        businessName?: string;
    };

    requestedBy:
    | string
    | {
        _id: string;
        userId?: string;
        name?: string;
        fullName?: string;
        email?: string;
    };


    requestNumber: string;

    title: string;

    contractType: ContractType;

    description?: string;

    priority: ContractRequestPriority;

    status: ContractRequestStatus;

    assignedProfessional?: AssignedProfessional | null;

    contract?: string | Contract | null;

    expectedDeliveryDate?: string | null;

    specialInstructions?: string;

    isDeleted: boolean;

    deletedAt?: string | null;

    createdAt: string;

    updatedAt: string;
}


// ============================================================
// REQUEST LIST RESPONSE
// ============================================================

export interface ContractRequestListResponse {
    requests: ContractRequest[];

    pagination: Pagination;
}


// ============================================================
// BUSINESS DOCUMENT
// ============================================================

export type DocumentCategory =
    | "incorporation"
    | "tax"
    | "compliance"
    | "financial"
    | "identity"
    | "agreement"
    | "contract"
    | "other";


export type BusinessDocumentStatus =
    | "pending"
    | "uploaded"
    | "failed"
    | "deleted";


export type BusinessDocumentVisibility =
    | "business"
    | "lawyer"
    | "private";


export interface BusinessDocument {
    _id: string;

    business:
    | string
    | {
        _id: string;
        name?: string;
        businessName?: string;
    };

    uploadedBy:
    | string
    | AuthUserReference;

    name: string;

    originalName: string;

    key: string;

    mimeType: string;

    size: number;

    category: DocumentCategory;

    status: BusinessDocumentStatus;

    visibility: BusinessDocumentVisibility;

    uploadedAt?: string;

    createdAt: string;

    updatedAt: string;
}


// ============================================================
// CONTRACT
// ============================================================

export interface Contract {
    _id: string;

    business:
    | string
    | {
        _id: string;
        name?: string;
        businessName?: string;
    };

    contractNumber: string;

    title: string;

    contractType: ContractType;

    description?: string;

    counterparty: Counterparty;

    contractValue?: number;

    currency?: string;

    status: ContractStatus;

    priority: ContractPriority;

    owner?:
    | string
    | AuthUserReference
    | null;

    createdBy:
    | string
    | AuthUserReference;

    assignedProfessional?: AssignedProfessional | null;

    contractRequest?:
    | string
    | ContractRequest
    | null;

    currentVersion?:
    | string
    | ContractVersion
    | null;

    effectiveDate?: string | null;

    expiryDate?: string | null;

    renewalDate?: string | null;

    autoRenewal: boolean;

    supportingDocuments?: BusinessDocument[];

    currentDocument?:
    | BusinessDocument
    | string
    | null;

    signedDocument?:
    | BusinessDocument
    | string
    | null;

    isArchived: boolean;

    isDeleted: boolean;

    deletedAt?: string | null;

    createdAt: string;

    updatedAt: string;
}


// ============================================================
// CONTRACT LIST RESPONSE
// ============================================================

export interface ContractListResponse {
    data: Contract[];

    pagination: Pagination;
}


// ============================================================
// CONTRACT UPDATE DATA
// ============================================================

export interface ContractUpdateData {
    title?: string;

    description?: string;

    contractType?: ContractType;

    counterparty?: Counterparty;

    contractValue?: number;

    currency?: string;

    priority?: ContractPriority;

    effectiveDate?: string | null;

    expiryDate?: string | null;

    renewalDate?: string | null;

    autoRenewal?: boolean;
}


// ============================================================
// CONTRACT VERSION
// ============================================================

export type ContractVersionStatus =
    | "Draft"
    | "Internal Review"
    | "Client Review"
    | "Approved"
    | "Executed"
    | "Superseded";


export interface ContractVersion {
    _id: string;

    contract:
    | string
    | Contract;

    business:
    | string
    | {
        _id: string;
        name?: string;
    };

    versionNumber: number;

    document: BusinessDocument;

    uploadedBy:
    | string
    | AuthUserReference;

    status: ContractVersionStatus;

    changeSummary?: string;

    isCurrent: boolean;

    createdAt: string;

    updatedAt: string;
}


// ============================================================
// COMMENTS
// ============================================================

export type ContractCommentRole =
    | "business"
    | "lawyer"
    | "admin";


export interface ContractComment {
    _id: string;

    business: string;

    contract: string;

    version?:
    | string
    | ContractVersion
    | null;

    author: AuthUserReference;

    authorRole: ContractCommentRole;

    message: string;

    isInternal: boolean;

    attachments: BusinessDocument[];

    isEdited: boolean;

    editedAt?: string | null;

    isDeleted: boolean;

    createdAt: string;

    updatedAt: string;
}


// ============================================================
// ASSIGNMENT
// ============================================================

export type AssignmentType =
    | "Drafting"
    | "Review"
    | "Negotiation"
    | "Legal Opinion"
    | "Execution"
    | "General";


export type AssignmentStatus =
    | "Assigned"
    | "Accepted"
    | "In Progress"
    | "Completed"
    | "Rejected"
    | "Cancelled";


export interface LegalAssignment {
    _id: string;

    business: string;

    contract: string;

    professional: AssignedProfessional;

    assignedBy:
    | string
    | AuthUserReference;

    assignmentType: AssignmentType;

    instructions?: string;

    status: AssignmentStatus;

    dueDate?: string | null;

    acceptedAt?: string | null;

    completedAt?: string | null;

    rejectedAt?: string | null;

    rejectionReason?: string;

    createdAt: string;

    updatedAt: string;
}


// ============================================================
// APPROVAL
// ============================================================

export type ApprovalType =
    | "Legal Review"
    | "Business Approval"
    | "Final Approval";


export type ApprovalStatus =
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Cancelled";


export interface ContractApproval {
    _id: string;

    business: string;

    contract: string;

    version?: string | null;

    requestedFrom:
    | string
    | AuthUserReference;

    requestedBy:
    | string
    | AuthUserReference;

    approvalType: ApprovalType;

    status: ApprovalStatus;

    comments?: string;

    approvedAt?: string | null;

    rejectedAt?: string | null;

    createdAt: string;

    updatedAt: string;
}


// ============================================================
// ACTIVITY
// ============================================================

export type ContractActivityEntityType =
    | "Contract"
    | "ContractRequest"
    | "ContractVersion"
    | "Assignment"
    | "Approval"
    | "Document";


export interface ContractActivity {
    _id: string;

    business: string;

    entityType: ContractActivityEntityType;

    entityId: string;

    action: string;

    description?: string;

    performedBy: AuthUserReference;

    metadata?: Record<string, unknown>;

    createdAt: string;
}


// ============================================================
// DASHBOARD STATS
// ============================================================

export interface DashboardStats {
    totalRequests: number;

    pending: number;

    underReview: number;

    assigned: number;

    converted: number;

    completed: number;

    cancelled: number;

    lowPriority: number;

    mediumPriority: number;

    highPriority: number;

    urgentPriority: number;

    activeContracts?: number;

    pendingReview?: number;

    expiringSoon?: number;

    openRequests?: number;

    recentRequests?: ContractRequest[];

    totalContracts?: number;

    recentContracts?: Contract[];
}


// ============================================================
// FILE UPLOAD TYPES
// ============================================================

export interface SignedUploadResponse {
    uploadUrl: string;

    key?: string;

    storageKey?: string;

    documentId?: string;

    expiresIn?: number;

    /**
     * Present on the final-file upload URL response.
     * Echoes back the requested type: "pdf" | "docx" | "signedPdf".
     */
    fileType?: string;

    [key: string]: unknown;
}

export interface ContractUploadUrlResponse {
    uploadUrl: string;
    key: string;
    documentId: string;
    contractId: string;
    expiresIn?: number;
}


export interface FileUrlResponse {
    url: string;

    expiresIn?: number;
}


// ============================================================
// REQUEST HELPERS
// ============================================================

const buildQueryString = (
    params: Record<string, unknown>
): string => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(
        ([key, value]) => {
            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                query.set(key, String(value));
            }
        }
    );

    return query.toString();
};


// ============================================================
// RESPONSE HANDLER
// ============================================================

const handleResponse = async <T>(
    response: Response,
    fallbackMessage: string
): Promise<T> => {
    let result: any = null;

    try {
        result = await response.json();
    } catch {
        // Backend returned no JSON
    }

    if (!response.ok) {
        let message =
            result?.message ||
            result?.error ||
            fallbackMessage;

        if (response.status === 401) {
            message =
                result?.message ||
                "Your session has expired. Please log in again.";
        }

        if (response.status === 403) {
            message =
                result?.message ||
                "You are not authorized to perform this action.";
        }

        throw new Error(
            `${message} (${response.status})`
        );
    }

    if (
        result &&
        Object.prototype.hasOwnProperty.call(
            result,
            "data"
        )
    ) {
        return result.data as T;
    }

    return result as T;
};


// ============================================================
// SERVICE
// ============================================================

class ContractService {
    // ==========================================================
    // CONTRACT REQUESTS
    // ==========================================================

    async createContractRequest(
        data: ContractRequestFormData
    ): Promise<ContractRequest> {
        const payload = {
            title: data.title.trim(),

            contractType: data.contractType,

            ...(data.description?.trim()
                ? { description: data.description.trim() }
                : {}),

            ...(data.priority
                ? { priority: data.priority }
                : {}),

            ...(data.expectedDeliveryDate
                ? {
                    expectedDeliveryDate:
                        data.expectedDeliveryDate,
                }
                : {}),

            ...(data.specialInstructions?.trim()
                ? {
                    specialInstructions:
                        data.specialInstructions.trim(),
                }
                : {}),
        };

        const response = await fetch(
            CONTRACT_REQUESTS_URL,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(payload),
            }
        );

        return handleResponse<ContractRequest>(
            response,
            "Failed to create contract request"
        );
    }

    async uploadContract(formData: FormData): Promise<Contract> {
        const file = formData.get("file");

        const title = formData.get("title");
        const contractType = formData.get("contractType");

        if (!(file instanceof File)) {
            throw new Error("Contract file is required.");
        }

        if (typeof title !== "string" || !title.trim()) {
            throw new Error("Contract title is required.");
        }

        if (
            typeof contractType !== "string" ||
            !contractType.trim()
        ) {
            throw new Error("Contract type is required.");
        }

        const mimeType =
            file.type || "application/octet-stream";

        const size = file.size;
        const originalName = file.name;

        const uploadUrlResponse = await fetch(
            `${CONTRACTS_URL}/upload-url`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    title: title.trim(),
                    contractType: contractType.trim(),
                    fileName: originalName,
                    mimeType,
                    size,
                }),
            }
        );

        const uploadData =
            await handleResponse<ContractUploadUrlResponse>(
                uploadUrlResponse,
                "Failed to generate contract upload URL"
            );

        if (!uploadData?.uploadUrl) {
            throw new Error(
                "Backend did not return a valid upload URL."
            );
        }

        if (!uploadData?.key) {
            throw new Error(
                "Backend did not return the storage key."
            );
        }

        if (!uploadData?.documentId) {
            throw new Error(
                "Backend did not return the document ID."
            );
        }

        if (!uploadData?.contractId) {
            throw new Error(
                "Backend did not return the contract ID."
            );
        }

        await this.uploadToSignedUrl(
            uploadData.uploadUrl,
            file
        );

        const completeResponse = await fetch(
            `${CONTRACTS_URL}/upload/complete`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    contractId: uploadData.contractId,
                    documentId: uploadData.documentId,
                    key: uploadData.key,
                    originalName,
                    mimeType,
                    size,
                }),
            }
        );

        return handleResponse<Contract>(
            completeResponse,
            "Failed to complete contract upload"
        );
    }

    async getContractRequests(params: {
        page?: number;
        limit?: number;
        status?: ContractRequestStatus | string;
        priority?: ContractRequestPriority | string;
        contractType?: string;
        search?: string;
    } = {}): Promise<ContractRequestListResponse> {
        const query = new URLSearchParams();

        if (params.page) {
            query.set("page", params.page.toString());
        }

        if (params.limit) {
            query.set("limit", params.limit.toString());
        }

        if (params.status) {
            query.set("status", params.status);
        }

        if (params.priority) {
            query.set("priority", params.priority);
        }

        if (params.contractType) {
            query.set("contractType", params.contractType);
        }

        if (params.search) {
            query.set("search", params.search);
        }

        const queryString = query.toString();

        const url = queryString
            ? `${CONTRACT_REQUESTS_URL}?${queryString}`
            : CONTRACT_REQUESTS_URL;

        const response = await fetch(url, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const text = await response.text();

            let message = "Failed to fetch contract requests";

            try {
                const error = JSON.parse(text);
                message = error?.message || message;
            } catch {
                if (text) {
                    message = text;
                }
            }

            throw new Error(message);
        }

        const result = await response.json();

        console.log(
            "[Contract Requests API]",
            `${response.status} ${url}`,
            result
        );

        const payload = result?.data ?? result;

        if (Array.isArray(payload)) {
            return {
                requests: payload,
                pagination: {
                    page: params.page ?? 1,
                    limit: params.limit ?? payload.length,
                    total: payload.length,
                    pages: 1,
                },
            };
        }

        const requests = Array.isArray(payload?.requests)
            ? payload.requests
            : Array.isArray(payload?.data)
                ? payload.data
                : [];

        const pagination = payload?.pagination ?? {
            page: params.page ?? 1,
            limit: params.limit ?? 50,
            total: requests.length,
            pages: 1,
        };

        return {
            requests,
            pagination,
        };
    }


    async getContractRequestById(
        requestId: string
    ): Promise<ContractRequest> {
        if (!requestId) {
            throw new Error(
                "Contract request ID is required."
            );
        }

        const response = await fetch(
            `${CONTRACT_REQUESTS_URL}/${requestId}`,
            {
                method: "GET",
                headers: getHeaders(),
            }
        );

        return handleResponse<ContractRequest>(
            response,
            "Failed to fetch contract request"
        );
    }


    async updateContractRequest(
        requestId: string,
        data: Partial<ContractRequestFormData>
    ): Promise<ContractRequest> {
        if (!requestId) {
            throw new Error(
                "Contract request ID is required."
            );
        }

        const response = await fetch(
            `${CONTRACT_REQUESTS_URL}/${requestId}`,
            {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<ContractRequest>(
            response,
            "Failed to update contract request"
        );
    }


    async updateContractRequestStatus(
        requestId: string,
        status: ContractRequestStatus
    ): Promise<ContractRequest> {
        if (!requestId) {
            throw new Error(
                "Contract request ID is required."
            );
        }

        const response = await fetch(
            `${CONTRACT_REQUESTS_URL}/${requestId}/status`,
            {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ status }),
            }
        );

        return handleResponse<ContractRequest>(
            response,
            "Failed to update contract request status"
        );
    }


    async deleteContractRequest(
        requestId: string
    ): Promise<void> {
        if (!requestId) {
            throw new Error(
                "Contract request ID is required."
            );
        }

        const response = await fetch(
            `${CONTRACT_REQUESTS_URL}/${requestId}`,
            {
                method: "DELETE",
                headers: getHeaders(),
            }
        );

        await handleResponse<unknown>(
            response,
            "Failed to delete contract request"
        );
    }


    // ==========================================================
    // ACTUAL CONTRACTS
    // ==========================================================

    async createContract(
        data: {
            title: string;
            contractType: ContractType;
            description?: string;
            counterparty: Counterparty;
            contractValue?: number;
            currency?: string;
            priority?: ContractPriority;
            effectiveDate?: string | null;
            expiryDate?: string | null;
            renewalDate?: string | null;
            autoRenewal?: boolean;
            contractRequest?: string;
        }
    ): Promise<Contract> {
        const payload = {
            ...data,

            title: data.title.trim(),

            ...(data.contractValue !== undefined
                ? {
                    contractValue:
                        Number(data.contractValue) || 0,
                }
                : {}),

            ...(data.description?.trim()
                ? { description: data.description.trim() }
                : {}),
        };

        const response = await fetch(
            CONTRACTS_URL,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(payload),
            }
        );

        return handleResponse<Contract>(
            response,
            "Failed to create contract"
        );
    }


    async getContracts(
        params: {
            page?: number;
            limit?: number;
            status?: ContractStatus | string;
            priority?: ContractPriority | string;
            contractType?: string;
            search?: string;
        } = {}
    ): Promise<ContractListResponse> {
        const queryString = buildQueryString(params);

        const url = queryString
            ? `${CONTRACTS_URL}?${queryString}`
            : CONTRACTS_URL;

        const response = await fetch(url, {
            method: "GET",
            headers: getHeaders(),
        });

        let result: any = null;

        try {
            result = await response.json();
        } catch {
            // Backend returned no JSON
        }

        if (!response.ok) {
            throw new Error(
                result?.message ||
                `Failed to fetch contracts (${response.status})`
            );
        }

        const payload = result?.data ?? result;

        if (Array.isArray(payload)) {
            return {
                data: payload,
                pagination:
                    result?.pagination ?? {
                        page: params.page ?? 1,
                        limit: params.limit ?? payload.length,
                        total: payload.length,
                        pages: 1,
                    },
            };
        }

        const contracts = Array.isArray(payload?.contracts)
            ? payload.contracts
            : Array.isArray(payload?.data)
                ? payload.data
                : [];

        const pagination =
            result?.pagination ??
            payload?.pagination ?? {
                page: params.page ?? 1,
                limit: params.limit ?? contracts.length,
                total: contracts.length,
                pages: 1,
            };

        return {
            data: contracts,
            pagination,
        };
    }

    async getContractById(
        contractId: string
    ): Promise<Contract> {
        if (!contractId) {
            throw new Error(
                "Contract ID is required."
            );
        }

        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}`,
            {
                method: "GET",
                headers: getHeaders(),
            }
        );

        return handleResponse<Contract>(
            response,
            "Failed to fetch contract"
        );
    }


    async updateContract(
        contractId: string,
        data: ContractUpdateData
    ): Promise<Contract> {
        if (!contractId) {
            throw new Error(
                "Contract ID is required."
            );
        }

        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}`,
            {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<Contract>(
            response,
            "Failed to update contract"
        );
    }


    async updateContractStatus(
        contractId: string,
        status: ContractStatus
    ): Promise<Contract> {
        if (!contractId) {
            throw new Error(
                "Contract ID is required."
            );
        }

        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/status`,
            {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ status }),
            }
        );

        return handleResponse<Contract>(
            response,
            "Failed to update contract status"
        );
    }


    // ==========================================================
    // ASSIGNMENT
    // ==========================================================

    async assignProfessional(
        contractId: string,
        professionalId: string,
        data?: {
            assignmentType?: AssignmentType;
            instructions?: string;
            dueDate?: string;
        }
    ): Promise<LegalAssignment | Contract> {
        if (!contractId) {
            throw new Error(
                "Contract ID is required."
            );
        }

        if (!professionalId) {
            throw new Error(
                "Professional ID is required."
            );
        }

        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/assign`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    professionalId,
                    ...(data || {}),
                }),
            }
        );

        return handleResponse<
            LegalAssignment | Contract
        >(
            response,
            "Failed to assign professional"
        );
    }


    // ==========================================================
    // COMMENTS
    // ==========================================================

    async addComment(
        contractId: string,
        message: string,
        options?: {
            isInternal?: boolean;
            versionId?: string;
            attachmentIds?: string[];
        }
    ): Promise<ContractComment> {
        if (!contractId) {
            throw new Error("Contract ID is required.");
        }

        const cleanMessage = message.trim();

        if (!cleanMessage) {
            throw new Error("Comment message is required.");
        }

        const payload = {
            message: cleanMessage,

            isInternal: options?.isInternal ?? false,

            ...(options?.versionId
                ? { versionId: options.versionId }
                : {}),

            ...(options?.attachmentIds?.length
                ? { attachmentIds: options.attachmentIds }
                : {}),
        };

        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/comments`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(payload),
            }
        );

        return handleResponse<ContractComment>(
            response,
            "Failed to add comment"
        );
    }


    /**
     * GET /contracts/:id/comments
     *
     * Backend shape:
     * {
     *   success: true,
     *   message: "...",
     *   data: {
     *     contract: { ... },
     *     comments: [ ... ]
     *   }
     * }
     *
     * `handleResponse` returns `result.data`, i.e.:
     *   { contract, comments }
     *
     * We return the `comments` array directly.
     */
    async getComments(
        contractId: string
    ): Promise<ContractComment[]> {
        if (!contractId) {
            throw new Error("Contract ID is required.");
        }

        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/comments`,
            {
                method: "GET",
                headers: getHeaders(),
            }
        );

        const result =
            await handleResponse<
                | { contract?: unknown; comments?: ContractComment[] }
                | ContractComment[]
            >(response, "Failed to fetch comments");

        // Case A: { contract, comments }
        if (
            result &&
            !Array.isArray(result) &&
            Array.isArray((result as any).comments)
        ) {
            return (result as any).comments as ContractComment[];
        }

        // Case B: already an array
        if (Array.isArray(result)) {
            return result as ContractComment[];
        }

        // Fallback
        return [];
    }


    // ==========================================================
    // SUPPORTING DOCUMENTS - R2
    // ==========================================================

    async getSupportingDocumentUploadUrl(
        contractId: string,
        data: {
            fileName: string;
            mimeType: string;
            size: number;
            category?: DocumentCategory;
        }
    ): Promise<SignedUploadResponse> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/supporting-documents/upload-url`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<SignedUploadResponse>(
            response,
            "Failed to get document upload URL"
        );
    }


    async uploadToSignedUrl(
        uploadUrl: string,
        file: File
    ): Promise<void> {
        if (!uploadUrl) {
            throw new Error(
                "Signed upload URL is required."
            );
        }

        const response = await fetch(
            uploadUrl,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        file.type ||
                        "application/octet-stream",
                },
                body: file,
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to upload file to storage (${response.status})`
            );
        }
    }


    async completeSupportingDocumentUpload(
        contractId: string,
        data: {
            key: string;
            originalName: string;
            mimeType: string;
            size: number;
            category?: DocumentCategory;
        }
    ): Promise<BusinessDocument> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/supporting-documents/complete`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<BusinessDocument>(
            response,
            "Failed to complete document upload"
        );
    }


    /**
     * End-to-end supporting document upload.
     *
     * Runs the 3-step R2 flow so the UI doesn't have to:
     *   1. Ask backend for a signed upload URL
     *   2. PUT the file directly to R2
     *   3. Tell backend the upload completed, receive the
     *      created BusinessDocument
     *
     * The backend's upload-url endpoint returns the key under
     * `storageKey`, so we fall back to `key` as well.
     */
    async uploadSupportingDocument(
        contractId: string,
        file: File,
        category: DocumentCategory = "contract"
    ): Promise<BusinessDocument> {
        if (!contractId) {
            throw new Error("Contract ID is required.");
        }

        if (!file) {
            throw new Error("File is required.");
        }

        const mimeType =
            file.type || "application/octet-stream";

        // ---------------------------------------------------------
        // Step 1 — signed upload URL
        // ---------------------------------------------------------

        const uploadData =
            await this.getSupportingDocumentUploadUrl(
                contractId,
                {
                    fileName: file.name,
                    mimeType,
                    size: file.size,
                    category,
                }
            );

        const uploadUrl =
            (uploadData as any)?.uploadUrl as
            | string
            | undefined;

        const storageKey =
            ((uploadData as any)?.storageKey ??
                (uploadData as any)?.key) as
            | string
            | undefined;

        if (!uploadUrl) {
            throw new Error(
                "Backend did not return a signed upload URL."
            );
        }

        if (!storageKey) {
            throw new Error(
                "Backend did not return a storage key."
            );
        }

        // ---------------------------------------------------------
        // Step 2 — PUT the file directly to R2
        // ---------------------------------------------------------

        await this.uploadToSignedUrl(uploadUrl, file);

        // ---------------------------------------------------------
        // Step 3 — finalize on the backend
        // ---------------------------------------------------------

        return this.completeSupportingDocumentUpload(
            contractId,
            {
                key: storageKey,
                originalName: file.name,
                mimeType,
                size: file.size,
                category,
            }
        );
    }


    async getSupportingDocumentUrl(
        contractId: string,
        documentId: string
    ): Promise<FileUrlResponse> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/supporting-documents/${documentId}/url`,
            {
                method: "GET",
                headers: getHeaders(),
            }
        );

        const raw = await handleResponse<any>(
            response,
            "Failed to get document URL"
        );

        // Backend returns `downloadUrl` for supporting documents
        // but `url` for final files. Normalize both into `url`.
        const url: string | undefined =
            raw?.url ?? raw?.downloadUrl;

        if (!url) {
            throw new Error(
                "Backend did not return a download URL."
            );
        }

        return {
            url,
            expiresIn: raw?.expiresIn,
        };
    }

    async deleteSupportingDocument(
        contractId: string,
        documentId: string
    ): Promise<void> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/supporting-documents/${documentId}`,
            {
                method: "DELETE",
                headers: getHeaders(),
            }
        );

        await handleResponse<unknown>(
            response,
            "Failed to delete supporting document"
        );
    }


    // ==========================================================
    // CONTRACT VERSIONS - R2
    // ==========================================================

    async getVersionUploadUrl(
        contractId: string,
        data: {
            fileName: string;
            mimeType: string;
            size: number;
        }
    ): Promise<SignedUploadResponse> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/versions/upload-url`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<SignedUploadResponse>(
            response,
            "Failed to get version upload URL"
        );
    }


    async completeVersionUpload(
        contractId: string,
        data: {
            key: string;
            originalName: string;
            mimeType: string;
            size: number;
            changeSummary?: string;
        }
    ): Promise<ContractVersion> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/versions/complete`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<ContractVersion>(
            response,
            "Failed to complete contract version upload"
        );
    }


    async getVersionUrl(
        contractId: string,
        versionId: string
    ): Promise<FileUrlResponse> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/versions/${versionId}/url`,
            {
                method: "GET",
                headers: getHeaders(),
            }
        );

        return handleResponse<FileUrlResponse>(
            response,
            "Failed to get contract version URL"
        );
    }


    // ==========================================================
    // FINAL FILES - R2
    // ==========================================================

    async getFinalFileUploadUrl(
        contractId: string,
        data: {
            fileName: string;
            mimeType: string;
            size: number;
            fileType:
            | "pdf"
            | "docx"
            | "signedPdf";
        }
    ): Promise<SignedUploadResponse> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/final-files/upload-url`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<SignedUploadResponse>(
            response,
            "Failed to get final file upload URL"
        );
    }


    async completeFinalFileUpload(
        contractId: string,
        data: {
            key: string;
            originalName: string;
            mimeType: string;
            size: number;
            fileType:
            | "pdf"
            | "docx"
            | "signedPdf";
        }
    ): Promise<BusinessDocument> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/final-files/complete`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<BusinessDocument>(
            response,
            "Failed to complete final file upload"
        );
    }


    async getFinalFileUrl(
        contractId: string,
        fileType:
            | "pdf"
            | "docx"
            | "signedPdf"
    ): Promise<FileUrlResponse> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId
            }/final-files/${fileType}/url`,
            {
                method: "GET",
                headers: getHeaders(),
            }
        );

        return handleResponse<FileUrlResponse>(
            response,
            "Failed to get final file URL"
        );
    }


    // ==========================================================
    // APPROVALS
    // ==========================================================

    async createApproval(
        contractId: string,
        data: {
            requestedFrom: string;
            approvalType: ApprovalType;
            versionId?: string;
        }
    ): Promise<ContractApproval> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/approvals`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<ContractApproval>(
            response,
            "Failed to create approval"
        );
    }


    async respondToApproval(
        approvalId: string,
        data: {
            status:
            | "Approved"
            | "Rejected";
            comments?: string;
        }
    ): Promise<ContractApproval> {
        const response = await fetch(
            `${CONTRACTS_URL}/approvals/${approvalId}`,
            {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }
        );

        return handleResponse<ContractApproval>(
            response,
            "Failed to respond to approval"
        );
    }


    // ==========================================================
    // ACTIVITY
    // ==========================================================

    async getActivities(
        contractId: string
    ): Promise<ContractActivity[]> {
        if (!contractId) {
            throw new Error("Contract ID is required.");
        }

        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/activity`,
            {
                method: "GET",
                headers: getHeaders(),
            }
        );

        const result =
            await handleResponse<any>(
                response,
                "Failed to fetch contract activity"
            );

        // Backend may wrap as { activities: [...] } inside data.
        if (Array.isArray(result)) {
            return result;
        }

        if (Array.isArray(result?.activities)) {
            return result.activities;
        }

        if (Array.isArray(result?.data)) {
            return result.data;
        }

        return [];
    }


    // ==========================================================
    // DASHBOARD
    // ==========================================================

    async getDashboardStats(): Promise<DashboardStats> {
        const response = await fetch(
            `${CONTRACTS_URL}/dashboard/stats`,
            {
                method: "GET",
                headers: getHeaders(),
            }
        );

        return handleResponse<DashboardStats>(
            response,
            "Failed to fetch dashboard statistics"
        );
    }


    // ==========================================================
    // ARCHIVE
    // ==========================================================

    async archiveContract(
        contractId: string
    ): Promise<Contract> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}/archive`,
            {
                method: "PATCH",
                headers: getHeaders(),
            }
        );

        return handleResponse<Contract>(
            response,
            "Failed to archive contract"
        );
    }


    // ==========================================================
    // DELETE CONTRACT
    // ==========================================================

    async deleteContract(
        contractId: string
    ): Promise<void> {
        const response = await fetch(
            `${CONTRACTS_URL}/${contractId}`,
            {
                method: "DELETE",
                headers: getHeaders(),
            }
        );

        await handleResponse<unknown>(
            response,
            "Failed to delete contract"
        );
    }
}


// ============================================================
// EXPORT SINGLETON
// ============================================================

export const contractService =
    new ContractService();