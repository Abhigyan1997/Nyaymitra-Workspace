// lib/hooks/useContracts.ts

import { useState, useCallback, useEffect } from 'react'
import { contractService, Contract, DashboardStats, ContractFormData } from '@/lib/services/contract.service'

/**
 * Hook for managing contracts list with pagination and filtering
 */
export const useContracts = () => {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    })

    const fetchContracts = useCallback(
        async (params: {
            page?: number
            limit?: number
            status?: string
            priority?: string
            contractType?: string
            search?: string
        }) => {
            setLoading(true)
            setError(null)
            try {
                const response = await contractService.getContracts(params)
                setContracts(response.data)
                setPagination(response.pagination)
            } catch (err: any) {
                setError(err.message || 'Failed to fetch contracts')
            } finally {
                setLoading(false)
            }
        },
        []
    )

    return {
        contracts,
        loading,
        error,
        pagination,
        fetchContracts,
    }
}

/**
 * Hook for managing a single contract
 */
export const useContract = (contractId?: string) => {
    const [contract, setContract] = useState<Contract | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchContract = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)
        try {
            const data = await contractService.getContractById(id)
            setContract(data)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch contract')
        } finally {
            setLoading(false)
        }
    }, [])

    const updateStatus = useCallback(async (status: string) => {
        if (!contract) return
        setLoading(true)
        setError(null)
        try {
            const updated = await contractService.updateContractStatus(contract._id, status)
            setContract(updated)
        } catch (err: any) {
            setError(err.message || 'Failed to update status')
        } finally {
            setLoading(false)
        }
    }, [contract])

    const updateContract = useCallback(async (data: Partial<ContractFormData>) => {
        if (!contract) return
        setLoading(true)
        setError(null)
        try {
            const updated = await contractService.updateContract(contract._id, data)
            setContract(updated)
        } catch (err: any) {
            setError(err.message || 'Failed to update contract')
        } finally {
            setLoading(false)
        }
    }, [contract])

    useEffect(() => {
        if (contractId) {
            fetchContract(contractId)
        }
    }, [contractId, fetchContract])

    return {
        contract,
        loading,
        error,
        fetchContract,
        updateStatus,
        updateContract,
    }
}

/**
 * Hook for managing contract creation
 */
export const useCreateContract = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const createContract = useCallback(async (data: ContractFormData) => {
        setLoading(true)
        setError(null)
        setSuccess(false)
        try {
            const contract = await contractService.createContract(data)
            setSuccess(true)
            return contract
        } catch (err: any) {
            setError(err.message || 'Failed to create contract')
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const reset = useCallback(() => {
        setError(null)
        setSuccess(false)
    }, [])

    return {
        createContract,
        loading,
        error,
        success,
        reset,
    }
}

/**
 * Hook for managing comments
 */
export const useComments = (contractId: string) => {
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchComments = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await contractService.getComments(contractId)
            setComments(data)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch comments')
        } finally {
            setLoading(false)
        }
    }, [contractId])

    const addComment = useCallback(
        async (message: string, isInternal: boolean = false) => {
            setError(null)
            try {
                const newComment = await contractService.addComment(
                    contractId,
                    message,
                    isInternal
                )
                setComments([...comments, newComment])
                return newComment
            } catch (err: any) {
                setError(err.message || 'Failed to add comment')
                throw err
            }
        },
        [contractId, comments]
    )

    useEffect(() => {
        fetchComments()
    }, [contractId, fetchComments])

    return {
        comments,
        loading,
        error,
        fetchComments,
        addComment,
    }
}

/**
 * Hook for dashboard statistics
 */
export const useDashboardStats = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchStats = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await contractService.getDashboardStats()
            setStats(data)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch statistics')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return {
        stats,
        loading,
        error,
        fetchStats,
    }
}

/**
 * Hook for form state management
 */
export const useContractForm = (initialData?: Partial<ContractFormData>) => {
    const [formData, setFormData] = useState<ContractFormData>({
        title: '',
        contractType: 'Service',
        purpose: '',
        description: '',
        counterparty: '',
        contractValue: '',
        currency: 'INR',
        priority: 'Medium',
        expectedDeliveryDate: '',
        specialInstructions: '',
        ...initialData,
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const updateField = useCallback(
        (field: keyof ContractFormData, value: any) => {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }))
            // Clear error for this field
            if (errors[field]) {
                setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors[field]
                    return newErrors
                })
            }
        },
        [errors]
    )

    const updateMultiple = useCallback((updates: Partial<ContractFormData>) => {
        setFormData((prev) => ({
            ...prev,
            ...updates,
        }))
    }, [])

    const reset = useCallback(() => {
        setFormData({
            title: '',
            contractType: 'Service',
            purpose: '',
            description: '',
            counterparty: '',
            contractValue: '',
            currency: 'INR',
            priority: 'Medium',
            expectedDeliveryDate: '',
            specialInstructions: '',
            ...initialData,
        })
        setErrors({})
    }, [initialData])

    const setFieldErrors = useCallback((newErrors: Record<string, string>) => {
        setErrors(newErrors)
    }, [])

    return {
        formData,
        errors,
        updateField,
        updateMultiple,
        reset,
        setFieldErrors,
    }
}

/**
 * Hook for managing modal states
 */
export const useModal = (initialOpen: boolean = false) => {
    const [isOpen, setIsOpen] = useState(initialOpen)

    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

    return {
        isOpen,
        open,
        close,
        toggle,
    }
}

/**
 * Hook for debounced search
 */
export const useDebouncedSearch = (callback: (search: string) => void, delay: number = 300) => {
    const [searchTerm, setSearchTerm] = useState('')
    const timeoutRef = useCallback(
        (value: string) => {
            setSearchTerm(value)
            const timer = setTimeout(() => callback(value), delay)
            return () => clearTimeout(timer)
        },
        [callback, delay]
    )

    return {
        searchTerm,
        setSearchTerm: timeoutRef,
    }
}

/**
 * Hook for pagination
 */
export const usePagination = (itemsPerPage: number = 10) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const goToPage = useCallback((page: number) => {
        const pageNum = Math.min(Math.max(1, page), totalPages)
        setCurrentPage(pageNum)
    }, [totalPages])

    const nextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    }, [totalPages])

    const prevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(prev - 1, 1))
    }, [])

    return {
        currentPage,
        totalPages,
        totalItems,
        setTotalItems,
        goToPage,
        nextPage,
        prevPage,
    }
}

/**
 * Hook for managing notification/toast state
 */
export const useNotification = () => {
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info' | 'warning'
        message: string
    } | null>(null)

    const showNotification = useCallback(
        (
            message: string,
            type: 'success' | 'error' | 'info' | 'warning' = 'info',
            duration: number = 3000
        ) => {
            setNotification({ type, message })
            const timer = setTimeout(() => setNotification(null), duration)
            return () => clearTimeout(timer)
        },
        []
    )

    const hideNotification = useCallback(() => {
        setNotification(null)
    }, [])

    return {
        notification,
        showNotification,
        hideNotification,
    }
}

/**
 * Hook for local storage
 */
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue

        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error('Error reading from localStorage:', error)
            return initialValue
        }
    })

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value
                setStoredValue(valueToStore)

                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore))
                }
            } catch (error) {
                console.error('Error writing to localStorage:', error)
            }
        },
        [key, storedValue]
    )

    return [storedValue, setValue] as const
}

/**
 * Hook for API error handling
 */
export const useApiError = () => {
    const [error, setError] = useState<string | null>(null)

    const handleError = useCallback((err: any) => {
        if (err.message) {
            setError(err.message)
        } else if (typeof err === 'string') {
            setError(err)
        } else {
            setError('An unexpected error occurred')
        }
    }, [])

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    return {
        error,
        handleError,
        clearError,
    }
}