'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    Plus,
    FileCheck,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    MoreVertical,
    Filter,
    Eye,
    Edit,
    Send,
    X,
    Loader,
    AlertTriangle,
    MessageCircle,
    Calendar,
    DollarSign,
    User,
} from 'lucide-react'
import { contractService, Contract, DashboardStats, ContractFormData } from '@/lib/services/contract.service'

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
    Pending: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', icon: Clock },
    Assigned: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', icon: AlertCircle },
    Drafting: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6', icon: FileCheck },
    'Internal Review': { bg: 'rgba(14, 165, 233, 0.1)', text: '#0EA5E9', icon: AlertCircle },
    'Client Review': { bg: 'rgba(244, 114, 182, 0.1)', text: '#F472B6', icon: AlertCircle },
    'Revision Requested': { bg: 'rgba(249, 115, 22, 0.1)', text: '#F97316', icon: AlertTriangle },
    Approved: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E', icon: CheckCircle },
    Completed: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E', icon: CheckCircle },
    Cancelled: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', icon: XCircle },
}

const priorityColors: Record<string, string> = {
    Low: '#808080',
    Medium: '#F59E0B',
    High: '#EF4444',
    Urgent: '#DC2626',
}

const contractTypes = [
    'All Types',
    'Service',
    'License',
    'NDA',
    'Employment',
    'Partnership',
    'SLA',
    'Vendor Agreement',
]

const statusFilters = [
    'All Status',
    'Pending',
    'Assigned',
    'Drafting',
    'Internal Review',
    'Client Review',
    'Revision Requested',
    'Approved',
    'Completed',
    'Cancelled',
]

// Modal Components
function CreateContractModal({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}) {
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
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await contractService.createContract(formData as ContractFormData)
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
            })
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to create contract')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-white/10 px-8 py-6 flex items-center justify-between">
                        <h2 className="text-2xl font-light tracking-tight text-white" style={{ fontFamily: 'Cormorant Garamond' }}>
                            Create Contract Request
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Contract Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                    placeholder="e.g., Vendor Service Agreement"
                                />
                            </div>

                            {/* Contract Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Contract Type *
                                </label>
                                <select
                                    required
                                    value={formData.contractType}
                                    onChange={(e) =>
                                        setFormData({ ...formData, contractType: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                                >
                                    {contractTypes.slice(1).map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Priority *
                                </label>
                                <select
                                    required
                                    value={formData.priority}
                                    onChange={(e) =>
                                        setFormData({ ...formData, priority: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>

                            {/* Counterparty */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Counterparty *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.counterparty}
                                    onChange={(e) =>
                                        setFormData({ ...formData, counterparty: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                    placeholder="Company name"
                                />
                            </div>

                            {/* Contract Value */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Contract Value
                                </label>
                                <input
                                    type="number"
                                    value={formData.contractValue}
                                    onChange={(e) =>
                                        setFormData({ ...formData, contractValue: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                    placeholder="Amount"
                                />
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Currency
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) =>
                                        setFormData({ ...formData, currency: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                                >
                                    <option value="INR">₹ INR</option>
                                    <option value="USD">$ USD</option>
                                    <option value="EUR">€ EUR</option>
                                    <option value="GBP">£ GBP</option>
                                </select>
                            </div>

                            {/* Expected Delivery Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Expected Delivery Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.expectedDeliveryDate}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            expectedDeliveryDate: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Purpose */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Purpose
                                </label>
                                <input
                                    type="text"
                                    value={formData.purpose}
                                    onChange={(e) =>
                                        setFormData({ ...formData, purpose: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                    placeholder="Brief purpose"
                                />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors resize-none"
                                    placeholder="Detailed description of the contract"
                                />
                            </div>

                            {/* Special Instructions */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Special Instructions
                                </label>
                                <textarea
                                    value={formData.specialInstructions || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            specialInstructions: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors resize-none"
                                    placeholder="Any special requirements or notes"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Contract'
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

// Contract Details Modal
function ContractDetailsModal({
    contract,
    isOpen,
    onClose,
    onStatusChange,
}: {
    contract: Contract | null
    isOpen: boolean
    onClose: () => void
    onStatusChange: () => void
}) {
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [loadingComments, setLoadingComments] = useState(false)
    const [submittingComment, setSubmittingComment] = useState(false)

    useEffect(() => {
        if (isOpen && contract) {
            fetchComments()
        }
    }, [contract, isOpen])

    const fetchComments = async () => {
        if (!contract) return
        setLoadingComments(true)
        try {
            const data = await contractService.getComments(contract._id)
            setComments(data)
        } catch (err) {
            console.error('Failed to fetch comments')
        } finally {
            setLoadingComments(false)
        }
    }

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!contract || !newComment.trim()) return

        setSubmittingComment(true)
        try {
            await contractService.addComment(contract._id, newComment)
            setNewComment('')
            await fetchComments()
        } catch (err) {
            console.error('Failed to add comment')
        } finally {
            setSubmittingComment(false)
        }
    }

    if (!isOpen || !contract) return null

    const StatusIcon = statusColors[contract.status]?.icon || AlertCircle

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-white/10 px-8 py-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-light tracking-tight text-white" style={{ fontFamily: 'Cormorant Garamond' }}>
                                {contract.title}
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">{contract.requestNumber}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Status and Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                                <p className="text-xs font-medium text-gray-400 mb-2">Status</p>
                                <div className="flex items-center gap-2">
                                    <StatusIcon
                                        className="w-4 h-4"
                                        style={{ color: statusColors[contract.status]?.text }}
                                    />
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: statusColors[contract.status]?.text }}
                                    >
                                        {contract.status}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                                <p className="text-xs font-medium text-gray-400 mb-2">Type</p>
                                <p className="text-sm text-white">{contract.contractType}</p>
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                                <p className="text-xs font-medium text-gray-400 mb-2">Priority</p>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: priorityColors[contract.priority] || '#808080' }}
                                >
                                    {contract.priority}
                                </p>
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                                <p className="text-xs font-medium text-gray-400 mb-2">Value</p>
                                <p className="text-sm font-medium text-amber-400">
                                    {contract.contractValue ? `${contract.currency} ${contract.contractValue.toLocaleString()}` : '—'}
                                </p>
                            </div>
                        </div>

                        {/* Contract Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">Contract Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-400">Counterparty</p>
                                        <p className="text-sm text-white mt-1">{contract.counterparty}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Purpose</p>
                                        <p className="text-sm text-white mt-1">{contract.purpose}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Expected Delivery</p>
                                        <p className="text-sm text-white mt-1">
                                            {new Date(contract.expectedDeliveryDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">Description</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">{contract.description}</p>
                            </div>
                        </div>

                        {/* Status Update */}
                        <div className="border-t border-white/10 pt-8">
                            <h3 className="text-sm font-semibold text-gray-300 mb-4">Update Status</h3>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        contractService.updateContractStatus(contract._id, e.target.value).then(() => {
                                            onStatusChange()
                                        })
                                    }
                                }}
                                defaultValue=""
                                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                            >
                                <option value="">Select new status...</option>
                                {statusFilters.slice(1).map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Comments Section */}
                        <div className="border-t border-white/10 pt-8">
                            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                Comments
                            </h3>

                            {loadingComments ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader className="w-5 h-5 animate-spin text-amber-400" />
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                                        {comments.length === 0 ? (
                                            <p className="text-sm text-gray-400">No comments yet</p>
                                        ) : (
                                            comments.map((comment) => (
                                                <div
                                                    key={comment._id}
                                                    className="bg-slate-900/50 rounded-lg p-4 border border-white/5"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <p className="text-sm font-medium text-white">
                                                            {comment.sender?.name || 'Unknown User'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(comment.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-gray-300">{comment.message}</p>
                                                    {comment.isInternal && (
                                                        <p className="text-xs text-amber-400 mt-2">🔒 Internal</p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Add Comment */}
                                    <form onSubmit={handleAddComment} className="border-t border-white/10 pt-6">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="flex-1 px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                            />
                                            <button
                                                type="submit"
                                                disabled={submittingComment || !newComment.trim()}
                                                className="px-4 py-3 bg-amber-500 text-black rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

// Main Contracts Page
export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('All Types')
    const [selectedStatus, setSelectedStatus] = useState('All Status')
    const [currentPage, setCurrentPage] = useState(1)

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    // Fetch contracts and stats
    const fetchData = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const [contractsResponse, statsData] = await Promise.all([
                contractService.getContracts({
                    page: currentPage,
                    limit: 10,
                    status: selectedStatus === 'All Status' ? undefined : selectedStatus,
                    contractType: selectedType === 'All Types' ? undefined : selectedType,
                    search: searchTerm || undefined,
                }),
                contractService.getDashboardStats(),
            ])

            setContracts(contractsResponse.data)
            setStats(statsData)
        } catch (err: any) {
            setError(err.message || 'Failed to load contracts')
        } finally {
            setLoading(false)
        }
    }, [currentPage, selectedStatus, selectedType, searchTerm])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 300) // Debounce search

        return () => clearTimeout(timer)
    }, [fetchData])

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0F0F0F' }}>
            <div className="px-10 py-8">
                <div className="max-w-full">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div>
                            <h1
                                className="text-5xl font-light tracking-tight text-white"
                                style={{ fontFamily: 'Cormorant Garamond' }}
                            >
                                Contracts
                            </h1>
                            <p
                                className="text-lg mt-1 text-gray-400"
                                style={{ fontFamily: 'Outfit' }}
                            >
                                Manage and track all your legal agreements
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 rounded-lg flex items-center gap-2 bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Contract</span>
                        </motion.button>
                    </motion.div>

                    {/* Stats Cards */}
                    {stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
                        >
                            {[
                                {
                                    label: 'Total',
                                    value: stats.totalContracts,
                                    color: '#FFFFFF',
                                    icon: FileCheck,
                                },
                                {
                                    label: 'Active',
                                    value: stats.approved + stats.completed,
                                    color: '#22C55E',
                                    icon: CheckCircle,
                                },
                                {
                                    label: 'In Review',
                                    value: stats.drafting + stats.internalReview + stats.clientReview,
                                    color: '#F59E0B',
                                    icon: Clock,
                                },
                                {
                                    label: 'Pending',
                                    value: stats.pending + stats.assigned,
                                    color: '#3B82F6',
                                    icon: AlertCircle,
                                },
                                {
                                    label: 'Completed',
                                    value: stats.completed,
                                    color: '#10B981',
                                    icon: CheckCircle,
                                },
                            ].map((stat, idx) => {
                                const Icon = stat.icon
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                                        className="rounded-xl p-4 border border-white/10 bg-slate-900/50 hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <p
                                                className="text-xs font-medium text-gray-400"
                                                style={{ fontFamily: 'Outfit' }}
                                            >
                                                {stat.label}
                                            </p>
                                            <Icon
                                                className="w-4 h-4"
                                                style={{ color: stat.color }}
                                            />
                                        </div>
                                        <p
                                            className="text-3xl font-light"
                                            style={{
                                                color: stat.color,
                                                fontFamily: 'Cormorant Garamond',
                                            }}
                                        >
                                            {stat.value}
                                        </p>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    )}

                    {/* Search and Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="mb-8"
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search contracts by title, counterparty, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={selectedType}
                                    onChange={(e) => {
                                        setSelectedType(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="px-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white focus:border-amber-400 focus:outline-none transition-colors"
                                >
                                    {contractTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="px-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white focus:border-amber-400 focus:outline-none transition-colors"
                                >
                                    {statusFilters.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
                        >
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200">{error}</p>
                        </motion.div>
                    )}

                    {/* Contracts Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/50"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader className="w-6 h-6 animate-spin text-amber-400" />
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider">
                                                    Contract
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider">
                                                    Counterparty
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider">
                                                    Priority
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider">
                                                    Value
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contracts.map((contract, idx) => {
                                                const StatusIcon =
                                                    statusColors[contract.status]?.icon || AlertCircle
                                                return (
                                                    <motion.tr
                                                        key={contract._id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{
                                                            duration: 0.3,
                                                            delay: 0.1 + idx * 0.05,
                                                        }}
                                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">
                                                                    {contract.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {contract.requestNumber}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-white">
                                                                {contract.counterparty}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm px-3 py-1 rounded-full bg-white/5 text-gray-300">
                                                                {contract.contractType}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <StatusIcon
                                                                    className="w-4 h-4"
                                                                    style={{
                                                                        color: statusColors[contract.status]
                                                                            ?.text,
                                                                    }}
                                                                />
                                                                <span
                                                                    className="text-sm font-medium"
                                                                    style={{
                                                                        color: statusColors[contract.status]
                                                                            ?.text,
                                                                    }}
                                                                >
                                                                    {contract.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span
                                                                className="text-sm font-medium"
                                                                style={{
                                                                    color:
                                                                        priorityColors[contract.priority] ||
                                                                        '#808080',
                                                                }}
                                                            >
                                                                {contract.priority}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-medium text-amber-400">
                                                                {contract.contractValue
                                                                    ? `${contract.currency} ${Number(contract.contractValue).toLocaleString()}`
                                                                    : '—'}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{
                                                                        scale: 0.95,
                                                                    }}
                                                                    onClick={() => {
                                                                        setSelectedContract(contract)
                                                                        setShowDetailsModal(true)
                                                                    }}
                                                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                                >
                                                                    <Eye className="w-4 h-4 text-gray-400" />
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{
                                                                        scale: 0.95,
                                                                    }}
                                                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                                >
                                                                    <Edit className="w-4 h-4 text-gray-400" />
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{
                                                                        scale: 0.95,
                                                                    }}
                                                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                                >
                                                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                                                </motion.button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {contracts.length === 0 && (
                                    <div className="text-center py-16">
                                        <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                        <p
                                            className="text-lg text-gray-400"
                                            style={{
                                                fontFamily: 'Outfit',
                                            }}
                                        >
                                            No contracts found
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Try adjusting your search or filters
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Modals */}
            <CreateContractModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchData}
            />

            {selectedContract && (
                <ContractDetailsModal
                    contract={selectedContract}
                    isOpen={showDetailsModal}
                    onClose={() => setShowDetailsModal(false)}
                    onStatusChange={fetchData}
                />
            )}
        </div>
    )
}