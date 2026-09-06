// lib/services/contract.service.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1/contracts'

// Get auth token from localStorage - try multiple sources
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        // Try multiple possible keys
        const token = localStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('userToken');
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.token) return user.token;
                if (user.accessToken) return user.accessToken;
            }
        } catch (e) {
            // Ignore parse errors
        }

        return token || null;
    }
    return null;
}

// Prepare headers with auth token
const getHeaders = () => {
    const token = getAuthToken()
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    }
}

// ===== Types matching backend schema =====

export interface Counterparty {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
}

export interface ContractFormData {
    title: string
    contractType: string
    purpose: string
    description: string
    counterparty: Counterparty  // Changed from string to object
    contractValue: number | string
    currency: string
    priority: string
    expectedDeliveryDate: string
    specialInstructions?: string
}

export interface Comment {
    _id: string
    sender: {
        _id: string
        name: string
        email: string
    }
    senderRole: 'lawyer' | 'admin' | 'business'
    message: string
    isInternal: boolean
    attachments: Array<{
        fileName: string
        fileUrl: string
        storageKey: string
        fileType: string
        fileSize: number
    }>
    isEdited: boolean
    createdAt: string
}

export interface Activity {
    action: string
    description: string
    performedBy: {
        _id: string
        name: string
    }
    createdAt: string
}

export interface SupportingDocument {
    originalName: string
    fileName: string
    fileUrl: string
    storageKey: string
    fileType: string
    fileSize: number
    uploadedBy: string
    uploadedAt: string
}

export interface Version {
    version: number
    fileName: string
    fileUrl: string
    storageKey: string
    fileType: 'pdf' | 'doc' | 'docx'
    fileSize: number
    uploadedBy: string
    remarks: string
    uploadedAt: string
}

export interface FinalFiles {
    pdf?: {
        fileName: string
        fileUrl: string
        storageKey: string
        fileSize: number
    }
    docx?: {
        fileName: string
        fileUrl: string
        storageKey: string
        fileSize: number
    }
    signedPdf?: {
        fileName: string
        fileUrl: string
        storageKey: string
        fileSize: number
    }
}

export interface Contract extends Omit<ContractFormData, 'counterparty'> {
    _id: string
    requestNumber: string
    business: string
    status: 'Pending' | 'Assigned' | 'Drafting' | 'Internal Review' | 'Client Review' | 'Revision Requested' | 'Approved' | 'Completed' | 'Cancelled'
    counterparty: Counterparty  // Full counterparty object
    assignedProfessional: string | null
    expectedDeliveryDate: string
    completedAt: string | null
    specialInstructions?: string
    supportingDocuments: SupportingDocument[]
    versions: Version[]
    currentVersion: number
    finalFiles: FinalFiles
    comments: Comment[]
    activities: Activity[]
    encrypted: boolean
    isArchived: boolean
    isDeleted: boolean
    createdAt: string
    updatedAt: string
}

export interface DashboardStats {
    totalContracts: number
    pending: number
    assigned: number
    drafting: number
    internalReview: number
    clientReview: number
    revisionRequested: number
    approved: number
    completed: number
    cancelled: number
    lowPriority: number
    mediumPriority: number
    highPriority: number
    urgentPriority: number
    recentContracts: Contract[]
}

export interface ContractsListResponse {
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
    data: Contract[]
}

// ===== Service Class =====

class ContractService {
    // Create new contract
    async createContract(data: ContractFormData): Promise<Contract> {
        try {
            // Ensure contractValue is a number
            const payload = {
                ...data,
                contractValue: Number(data.contractValue) || 0
            }

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create contract')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error creating contract')
        }
    }

    // Get all contracts with pagination and filters
    async getContracts(params: {
        page?: number
        limit?: number
        status?: string
        priority?: string
        contractType?: string
        search?: string
    }): Promise<ContractsListResponse> {
        try {
            const query = new URLSearchParams()

            if (params.page) query.append('page', params.page.toString())
            if (params.limit) query.append('limit', params.limit.toString())
            if (params.status) query.append('status', params.status)
            if (params.priority) query.append('priority', params.priority)
            if (params.contractType) query.append('contractType', params.contractType)
            if (params.search) query.append('search', params.search)

            const url = `${API_BASE_URL}?${query.toString()}`
            const response = await fetch(url, {
                headers: getHeaders(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to fetch contracts')
            }

            const result = await response.json()

            // Handle both response formats
            if (result.pagination && result.data) {
                return {
                    pagination: result.pagination,
                    data: result.data,
                }
            }

            // If the API returns data directly
            return {
                pagination: {
                    page: params.page || 1,
                    limit: params.limit || 10,
                    total: result.data?.length || 0,
                    pages: 1,
                },
                data: result.data || result || [],
            }
        } catch (error: any) {
            throw new Error(error.message || 'Error fetching contracts')
        }
    }

    // Get single contract by ID
    async getContractById(id: string): Promise<Contract> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                headers: getHeaders(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to fetch contract')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error fetching contract')
        }
    }

    // Update contract
    async updateContract(id: string, data: Partial<ContractFormData>): Promise<Contract> {
        try {
            const payload = {
                ...data,
                ...(data.contractValue !== undefined && { contractValue: Number(data.contractValue) || 0 })
            }

            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update contract')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error updating contract')
        }
    }

    // Update contract status
    async updateContractStatus(id: string, status: string): Promise<Contract> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update status')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error updating status')
        }
    }

    // Assign professional to contract
    async assignProfessional(contractId: string, professionalId: string): Promise<Contract> {
        try {
            const response = await fetch(`${API_BASE_URL}/${contractId}/assign`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ professionalId }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to assign professional')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error assigning professional')
        }
    }

    // Add comment
    async addComment(contractId: string, message: string, isInternal: boolean = false): Promise<Comment> {
        try {
            const response = await fetch(`${API_BASE_URL}/${contractId}/comments`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ message, isInternal }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to add comment')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error adding comment')
        }
    }

    // Get comments
    async getComments(contractId: string): Promise<Comment[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/${contractId}/comments`, {
                headers: getHeaders(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to fetch comments')
            }

            const result = await response.json()
            return result.data || result || []
        } catch (error: any) {
            throw new Error(error.message || 'Error fetching comments')
        }
    }

    // Get dashboard stats
    async getDashboardStats(): Promise<DashboardStats> {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
                headers: getHeaders(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to fetch stats')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error fetching stats')
        }
    }

    // Upload supporting document
    async uploadDocument(contractId: string, file: File): Promise<SupportingDocument> {
        try {
            const formData = new FormData()
            formData.append('document', file)

            const token = getAuthToken()
            const response = await fetch(`${API_BASE_URL}/${contractId}/documents`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to upload document')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error uploading document')
        }
    }

    // Upload contract version
    async uploadVersion(contractId: string, file: File, remarks?: string): Promise<Version> {
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (remarks) formData.append('remarks', remarks)

            const token = getAuthToken()
            const response = await fetch(`${API_BASE_URL}/${contractId}/versions`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to upload version')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error uploading version')
        }
    }

    // Archive contract
    async archiveContract(id: string): Promise<Contract> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/archive`, {
                method: 'PATCH',
                headers: getHeaders(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to archive contract')
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            throw new Error(error.message || 'Error archiving contract')
        }
    }

    // Delete contract (soft delete)
    async deleteContract(id: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete contract')
            }
        } catch (error: any) {
            throw new Error(error.message || 'Error deleting contract')
        }
    }

    // Get contract activities
    async getActivities(contractId: string): Promise<Activity[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/${contractId}/activities`, {
                headers: getHeaders(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to fetch activities')
            }

            const result = await response.json()
            return result.data || result || []
        } catch (error: any) {
            throw new Error(error.message || 'Error fetching activities')
        }
    }
}

export const contractService = new ContractService()