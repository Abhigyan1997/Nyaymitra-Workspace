// lib/utils/contract.utils.ts

/**
 * Format date to readable string
 * @param date - ISO date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(dateObj)
    } catch (error) {
        return 'Invalid date'
    }
}

/**
 * Format date and time
 * @param date - ISO date string or Date object
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date): string => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj)
    } catch (error) {
        return 'Invalid date'
    }
}

/**
 * Format currency value
 * @param value - Number to format
 * @param currency - Currency code (default: INR)
 * @returns Formatted currency string
 */
export const formatCurrency = (
    value: number | string,
    currency: string = 'INR'
): string => {
    try {
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        const currencySymbols: Record<string, string> = {
            INR: '₹',
            USD: '$',
            EUR: '€',
            GBP: '£',
        }
        const symbol = currencySymbols[currency] || currency
        return `${symbol} ${numValue.toLocaleString('en-IN')}`
    } catch (error) {
        return `${currency} ${value}`
    }
}

/**
 * Get days until date
 * @param date - ISO date string
 * @returns Number of days until date
 */
export const getDaysUntil = (date: string | Date): number => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dateObj.setHours(0, 0, 0, 0)
        const diffTime = dateObj.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    } catch (error) {
        return 0
    }
}

/**
 * Check if contract is due soon
 * @param date - Expected delivery date
 * @param daysThreshold - Days threshold (default: 7)
 * @returns true if due soon
 */
export const isDueSoon = (
    date: string | Date,
    daysThreshold: number = 7
): boolean => {
    const days = getDaysUntil(date)
    return days > 0 && days <= daysThreshold
}

/**
 * Check if contract is overdue
 * @param date - Expected delivery date
 * @returns true if overdue
 */
export const isOverdue = (date: string | Date): boolean => {
    return getDaysUntil(date) < 0
}

/**
 * Get status badge color
 * @param status - Contract status
 * @returns Color hex code
 */
export const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        Pending: '#F59E0B',
        Assigned: '#3B82F6',
        Drafting: '#8B5CF6',
        'Internal Review': '#0EA5E9',
        'Client Review': '#F472B6',
        'Revision Requested': '#F97316',
        Approved: '#22C55E',
        Completed: '#22C55E',
        Cancelled: '#EF4444',
    }
    return colors[status] || '#808080'
}

/**
 * Get priority color
 * @param priority - Contract priority
 * @returns Color hex code
 */
export const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
        Low: '#808080',
        Medium: '#F59E0B',
        High: '#EF4444',
        Urgent: '#DC2626',
    }
    return colors[priority] || '#808080'
}

/**
 * Validate email
 * @param email - Email string
 * @returns true if valid email
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate contract form
 * @param data - Contract data to validate
 * @returns Object with validation results
 */
export const validateContractForm = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!data.title || data.title.trim() === '') {
        errors.title = 'Contract title is required'
    }

    if (!data.contractType) {
        errors.contractType = 'Contract type is required'
    }

    if (!data.counterparty || data.counterparty.trim() === '') {
        errors.counterparty = 'Counterparty is required'
    }

    if (
        data.contractValue &&
        (isNaN(parseFloat(data.contractValue)) || parseFloat(data.contractValue) < 0)
    ) {
        errors.contractValue = 'Contract value must be a valid positive number'
    }

    if (data.expectedDeliveryDate) {
        const date = new Date(data.expectedDeliveryDate)
        if (isNaN(date.getTime())) {
            errors.expectedDeliveryDate = 'Invalid date format'
        }
    }

    return errors
}

/**
 * Generate contract ID
 * @returns Formatted contract ID
 */
export const generateContractId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `CT-${timestamp}${random}`
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

/**
 * Get initials from name
 * @param name - Full name
 * @returns Initials
 */
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
}

/**
 * Convert status to readable format
 * @param status - Status string
 * @returns Readable status
 */
export const formatStatus = (status: string): string => {
    return status
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/**
 * Calculate contract duration in days
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export const calculateDuration = (
    startDate: string | Date,
    endDate: string | Date
): number => {
    try {
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    } catch (error) {
        return 0
    }
}

/**
 * Export data to CSV
 * @param data - Array of objects to export
 * @param filename - Output filename
 */
export const exportToCSV = (data: any[], filename: string = 'contracts.csv'): void => {
    try {
        if (data.length === 0) return

        const headers = Object.keys(data[0])
        const rows = data.map((item) =>
            headers.map((header) => {
                const value = item[header]
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`
                }
                return value
            })
        )

        const csv = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    } catch (error) {
        console.error('Failed to export CSV:', error)
    }
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout

    return function (...args: Parameters<T>) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

/**
 * Throttle function
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean

    return function (...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 */
export const copyToClipboard = async (text: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        console.error('Failed to copy:', error)
    }
}

/**
 * Download file
 * @param url - File URL
 * @param filename - Filename for download
 */
export const downloadFile = (url: string, filename: string): void => {
    try {
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    } catch (error) {
        console.error('Failed to download file:', error)
    }
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param date - Date to compare
 * @returns Relative time string
 */
export const getRelativeTime = (date: string | Date): string => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        const now = new Date()
        const diffMs = now.getTime() - dateObj.getTime()
        const diffSecs = Math.floor(diffMs / 1000)
        const diffMins = Math.floor(diffSecs / 60)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffSecs < 60) return 'just now'
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

        return formatDate(dateObj)
    } catch (error) {
        return 'Unknown'
    }
}