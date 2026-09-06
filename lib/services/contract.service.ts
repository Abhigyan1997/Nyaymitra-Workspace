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

export interface ContractFormData {
    title: string
    contractType: string
    purpose: string
    description: string
    counterparty: string
    contractValue: number | string
    currency: string
    priority: string
    expectedDeliveryDate: string
    specialInstructions?: string
}

export interface Contract extends ContractFormData {
    _id: string
    requestNumber: string
    status: string
    business: string
    createdAt: string
    updatedAt: string
    comments: Comment[]
    activities: Activity[]
    completedAt?: string
}

export interface Comment {
    _id: string
    sender: string
    senderRole: string
    message: string
    isInternal: boolean
    attachments: any[]
    isEdited: boolean
    createdAt: string
}

export interface Activity {
    action: string
    description: string
    performedBy: string
    createdAt: string
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

class ContractService {
    // Create new contract
    async createContract(data: ContractFormData): Promise<Contract> {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create contract')
            }

            const result = await response.json()
            return result.data
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
            return {
                pagination: result.pagination,
                data: result.data,
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
            return result.data
        } catch (error: any) {
            throw new Error(error.message || 'Error fetching contract')
        }
    }

    // Update contract
    async updateContract(id: string, data: Partial<ContractFormData>): Promise<Contract> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update contract')
            }

            const result = await response.json()
            return result.data
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
            return result.data
        } catch (error: any) {
            throw new Error(error.message || 'Error updating status')
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
            return result.data
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
            return result.data
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
            return result.data
        } catch (error: any) {
            throw new Error(error.message || 'Error fetching stats')
        }
    }
}

export const contractService = new ContractService()