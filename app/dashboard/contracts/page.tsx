// app/contracts/page.tsx

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
    Eye,
    Edit,
    Send,
    X,
    Loader,
    AlertTriangle,
    MessageCircle,
    Mail,
    Phone,
    MapPin,
    Download,
    FileText,
    ChevronLeft,
    ChevronRight,
    Menu,
} from 'lucide-react'
import { contractService, Contract, DashboardStats, ContractFormData, Comment } from '@/lib/services/contract.service'

// Constants
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
    'NDA',
    'Employment Agreement',
    'Vendor Agreement',
    'Service Agreement',
    'Consulting Agreement',
    'Partnership Agreement',
    'Shareholder Agreement',
    'Lease Agreement',
    'MSA',
    'SLA',
    'Privacy Policy',
    'Terms & Conditions',
    'Website Policy',
    'Founders Agreement',
    'Investment Agreement',
    'Custom Contract',
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

// Helper function to check if contract is editable
const isContractEditable = (status: string): boolean => {
    return ['Pending', 'Assigned'].includes(status)
}

// ===== Edit Contract Modal =====
function EditContractModal({
    contract,
    isOpen,
    onClose,
    onSuccess,
}: {
    contract: Contract | null
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}) {
    const [formData, setFormData] = useState<ContractFormData>({
        title: '',
        contractType: 'NDA',
        purpose: '',
        description: '',
        counterparty: {
            name: '',
            company: '',
            email: '',
            phone: '',
            address: ''
        },
        contractValue: 0,
        currency: 'INR',
        priority: 'Medium',
        expectedDeliveryDate: '',
        specialInstructions: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (contract && isOpen) {
            setFormData({
                title: contract.title || '',
                contractType: contract.contractType || 'NDA',
                purpose: contract.purpose || '',
                description: contract.description || '',
                counterparty: {
                    name: contract.counterparty?.name || '',
                    company: contract.counterparty?.company || '',
                    email: contract.counterparty?.email || '',
                    phone: contract.counterparty?.phone || '',
                    address: contract.counterparty?.address || ''
                },
                contractValue: contract.contractValue || 0,
                currency: contract.currency || 'INR',
                priority: contract.priority || 'Medium',
                expectedDeliveryDate: contract.expectedDeliveryDate ? new Date(contract.expectedDeliveryDate).toISOString().split('T')[0] : '',
                specialInstructions: contract.specialInstructions || '',
            })
        }
    }, [contract, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!contract) return

        setLoading(true)
        setError('')

        try {
            const payload = {
                ...formData,
                contractValue: Number(formData.contractValue) || 0
            }
            await contractService.updateContract(contract._id, payload)
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to update contract')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !contract) return null

    const isEditable = isContractEditable(contract.status)

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-white/10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white" style={{ fontFamily: 'Cormorant Garamond' }}>
                                Edit Contract
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">{contract.requestNumber}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {!isEditable && (
                        <div className="mx-4 sm:mx-8 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-200">
                                This contract is in <strong>{contract.status}</strong> status and can no longer be edited.
                                Only contracts in <strong>Pending</strong> or <strong>Assigned</strong> status can be modified.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-300 border-b border-white/10 pb-2">
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contract Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isEditable}
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="e.g., Mutual NDA with AI Technology Partner"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contract Type *
                                    </label>
                                    <select
                                        required
                                        disabled={!isEditable}
                                        value={formData.contractType}
                                        onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="NDA">NDA</option>
                                        <option value="Employment Agreement">Employment Agreement</option>
                                        <option value="Vendor Agreement">Vendor Agreement</option>
                                        <option value="Service Agreement">Service Agreement</option>
                                        <option value="Consulting Agreement">Consulting Agreement</option>
                                        <option value="Partnership Agreement">Partnership Agreement</option>
                                        <option value="Shareholder Agreement">Shareholder Agreement</option>
                                        <option value="Lease Agreement">Lease Agreement</option>
                                        <option value="MSA">MSA</option>
                                        <option value="SLA">SLA</option>
                                        <option value="Privacy Policy">Privacy Policy</option>
                                        <option value="Terms & Conditions">Terms & Conditions</option>
                                        <option value="Website Policy">Website Policy</option>
                                        <option value="Founders Agreement">Founders Agreement</option>
                                        <option value="Investment Agreement">Investment Agreement</option>
                                        <option value="Custom Contract">Custom Contract</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Priority *
                                    </label>
                                    <select
                                        required
                                        disabled={!isEditable}
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contract Value
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        disabled={!isEditable}
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Currency
                                    </label>
                                    <select
                                        disabled={!isEditable}
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="INR">₹ INR</option>
                                        <option value="USD">$ USD</option>
                                        <option value="EUR">€ EUR</option>
                                        <option value="GBP">£ GBP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        disabled={!isEditable}
                                        value={formData.expectedDeliveryDate}
                                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Purpose *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isEditable}
                                        value={formData.purpose}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Brief purpose of the contract"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        disabled={!isEditable}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors resize-none ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Detailed description of the contract"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-white/10 pt-6">
                            <h3 className="text-sm font-semibold text-gray-300">
                                Counterparty Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contact Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isEditable}
                                        value={formData.counterparty.name}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, name: e.target.value }
                                        })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Company *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isEditable}
                                        value={formData.counterparty.company}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, company: e.target.value }
                                        })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Company name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!isEditable}
                                        value={formData.counterparty.email}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, email: e.target.value }
                                        })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditable}
                                        value={formData.counterparty.phone}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, phone: e.target.value }
                                        })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Phone number"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditable}
                                        value={formData.counterparty.address}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, address: e.target.value }
                                        })}
                                        className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Full address"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-white/10 pt-6">
                            <h3 className="text-sm font-semibold text-gray-300">
                                Additional Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Special Instructions
                                </label>
                                <textarea
                                    disabled={!isEditable}
                                    value={formData.specialInstructions || ''}
                                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                                    rows={3}
                                    className={`w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors resize-none ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Any special requirements or notes"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !isEditable}
                                className="flex-1 px-6 py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Contract'
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

// ===== Cancel Confirmation Modal =====
function CancelConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    contractTitle,
    isLoading,
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    contractTitle: string
    isLoading: boolean
}) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-950 border border-amber-500/20 rounded-2xl w-full max-w-md p-6 sm:p-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-amber-500" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white" style={{ fontFamily: 'Cormorant Garamond' }}>
                            Cancel Contract
                        </h2>
                    </div>

                    <p className="text-gray-300 mb-2">
                        Are you sure you want to cancel <strong className="text-white">{contractTitle}</strong>?
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                        This will change the contract status to <strong className="text-amber-400">Cancelled</strong>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                        >
                            Keep Contract
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Cancel Contract'
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

// ===== Create Contract Modal =====
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
        contractType: 'NDA',
        purpose: '',
        description: '',
        counterparty: {
            name: '',
            company: '',
            email: '',
            phone: '',
            address: ''
        },
        contractValue: 0,
        currency: 'INR',
        priority: 'Medium',
        expectedDeliveryDate: '',
        specialInstructions: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const loadExampleData = () => {
        setFormData({
            title: 'Mutual NDA with AI Technology Partner',
            contractType: 'NDA',
            purpose: 'Protect confidential information before sharing product architecture and business plans.',
            description: 'Mutual non-disclosure agreement for product discussions and technical collaboration.',
            counterparty: {
                name: 'Arjun Mehta',
                company: 'NextGen AI Labs',
                email: 'arjun@nextgenai.com',
                phone: '9988776655',
                address: 'Hyderabad, Telangana'
            },
            contractValue: 0,
            currency: 'INR',
            priority: 'Urgent',
            expectedDeliveryDate: '2026-08-08',
            specialInstructions: 'Confidentiality period should be 5 years. Include restrictions on reverse engineering and data sharing.',
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await contractService.createContract(formData)
            setFormData({
                title: '',
                contractType: 'NDA',
                purpose: '',
                description: '',
                counterparty: {
                    name: '',
                    company: '',
                    email: '',
                    phone: '',
                    address: ''
                },
                contractValue: 0,
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
                    className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-white/10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white" style={{ fontFamily: 'Cormorant Garamond' }}>
                            Create Contract Request
                        </h2>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={loadExampleData}
                                className="px-2 sm:px-3 py-1.5 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Load Example
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-300 border-b border-white/10 pb-2">
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contract Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                        placeholder="e.g., Mutual NDA with AI Technology Partner"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contract Type *
                                    </label>
                                    <select
                                        required
                                        value={formData.contractType}
                                        onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                                    >
                                        <option value="NDA">NDA</option>
                                        <option value="Employment Agreement">Employment Agreement</option>
                                        <option value="Vendor Agreement">Vendor Agreement</option>
                                        <option value="Service Agreement">Service Agreement</option>
                                        <option value="Consulting Agreement">Consulting Agreement</option>
                                        <option value="Partnership Agreement">Partnership Agreement</option>
                                        <option value="Shareholder Agreement">Shareholder Agreement</option>
                                        <option value="Lease Agreement">Lease Agreement</option>
                                        <option value="MSA">MSA</option>
                                        <option value="SLA">SLA</option>
                                        <option value="Privacy Policy">Privacy Policy</option>
                                        <option value="Terms & Conditions">Terms & Conditions</option>
                                        <option value="Website Policy">Website Policy</option>
                                        <option value="Founders Agreement">Founders Agreement</option>
                                        <option value="Investment Agreement">Investment Agreement</option>
                                        <option value="Custom Contract">Custom Contract</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Priority *
                                    </label>
                                    <select
                                        required
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contract Value
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Currency
                                    </label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                                    >
                                        <option value="INR">₹ INR</option>
                                        <option value="USD">$ USD</option>
                                        <option value="EUR">€ EUR</option>
                                        <option value="GBP">£ GBP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expectedDeliveryDate}
                                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-amber-400 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Purpose *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.purpose}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                        placeholder="Brief purpose of the contract"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors resize-none"
                                        placeholder="Detailed description of the contract"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-white/10 pt-6">
                            <h3 className="text-sm font-semibold text-gray-300">
                                Counterparty Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contact Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.counterparty.name}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, name: e.target.value }
                                        })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                        placeholder="Full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Company *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.counterparty.company}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, company: e.target.value }
                                        })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                        placeholder="Company name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.counterparty.email}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, email: e.target.value }
                                        })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.counterparty.phone}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, phone: e.target.value }
                                        })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                        placeholder="Phone number"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.counterparty.address}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            counterparty: { ...formData.counterparty, address: e.target.value }
                                        })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
                                        placeholder="Full address"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-white/10 pt-6">
                            <h3 className="text-sm font-semibold text-gray-300">
                                Additional Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Special Instructions
                                </label>
                                <textarea
                                    value={formData.specialInstructions || ''}
                                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors resize-none"
                                    placeholder="Any special requirements or notes"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
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

// ===== Contract Details Modal =====
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
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loadingComments, setLoadingComments] = useState(false)
    const [submittingComment, setSubmittingComment] = useState(false)
    const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'documents'>('details')

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
                    className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-white/10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white" style={{ fontFamily: 'Cormorant Garamond' }}>
                                {contract.title}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">{contract.requestNumber}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Tabs - Responsive */}
                    <div className="flex overflow-x-auto border-b border-white/10 px-4 sm:px-8">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'details'
                                    ? 'border-amber-500 text-amber-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'comments'
                                    ? 'border-amber-500 text-amber-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            Comments ({comments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'documents'
                                    ? 'border-amber-500 text-amber-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            Documents
                        </button>
                    </div>

                    <div className="p-4 sm:p-8">
                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <div className="space-y-6 sm:space-y-8">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-white/5">
                                        <p className="text-xs font-medium text-gray-400 mb-2">Status</p>
                                        <div className="flex items-center gap-2">
                                            <StatusIcon
                                                className="w-4 h-4"
                                                style={{ color: statusColors[contract.status]?.text }}
                                            />
                                            <span
                                                className="text-xs sm:text-sm font-medium"
                                                style={{ color: statusColors[contract.status]?.text }}
                                            >
                                                {contract.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-white/5">
                                        <p className="text-xs font-medium text-gray-400 mb-2">Type</p>
                                        <p className="text-xs sm:text-sm text-white">{contract.contractType}</p>
                                    </div>

                                    <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-white/5">
                                        <p className="text-xs font-medium text-gray-400 mb-2">Priority</p>
                                        <p
                                            className="text-xs sm:text-sm font-medium"
                                            style={{ color: priorityColors[contract.priority] || '#808080' }}
                                        >
                                            {contract.priority}
                                        </p>
                                    </div>

                                    <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-white/5">
                                        <p className="text-xs font-medium text-gray-400 mb-2">Value</p>
                                        <p className="text-xs sm:text-sm font-medium text-amber-400">
                                            {contract.contractValue ? `${contract.currency} ${Number(contract.contractValue).toLocaleString()}` : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Contract Information</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-400">Counterparty</p>
                                                <div className="mt-1 space-y-1">
                                                    <p className="text-sm text-white font-medium">{contract.counterparty?.name || 'N/A'}</p>
                                                    <p className="text-sm text-gray-300">{contract.counterparty?.company || 'N/A'}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{contract.counterparty?.email || 'N/A'}</span>
                                                    </div>
                                                    {contract.counterparty?.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{contract.counterparty.phone}</span>
                                                        </div>
                                                    )}
                                                    {contract.counterparty?.address && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <MapPin className="w-3 h-3" />
                                                            <span>{contract.counterparty.address}</span>
                                                        </div>
                                                    )}
                                                </div>
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
                                        {contract.specialInstructions && (
                                            <div className="mt-4">
                                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Special Instructions</h3>
                                                <p className="text-sm text-amber-400/80 leading-relaxed">{contract.specialInstructions}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Update Status</h3>
                                    <select
                                        onChange={async (e) => {
                                            if (e.target.value) {
                                                try {
                                                    await contractService.updateContractStatus(contract._id, e.target.value)
                                                    onStatusChange()
                                                } catch (err) {
                                                    console.error('Failed to update status')
                                                }
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
                            </div>
                        )}

                        {/* Comments Tab */}
                        {activeTab === 'comments' && (
                            <div className="space-y-6">
                                {loadingComments ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader className="w-5 h-5 animate-spin text-amber-400" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {comments.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-8">No comments yet</p>
                                            ) : (
                                                comments.map((comment) => (
                                                    <div
                                                        key={comment._id}
                                                        className="bg-slate-900/50 rounded-lg p-4 border border-white/5"
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">
                                                                    {comment.sender?.name || 'Unknown User'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {comment.senderRole}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 sm:mt-0">
                                                                {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                                                                {new Date(comment.createdAt).toLocaleTimeString()}
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

                                        <form onSubmit={handleAddComment} className="border-t border-white/10 pt-6">
                                            <div className="flex flex-col sm:flex-row gap-3">
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
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Supporting Documents</h3>
                                    {contract.supportingDocuments && contract.supportingDocuments.length > 0 ? (
                                        <div className="space-y-2">
                                            {contract.supportingDocuments.map((doc, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5 gap-2 sm:gap-0">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-sm text-white">{doc.originalName}</p>
                                                            <p className="text-xs text-gray-500">{doc.fileType} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors self-start sm:self-auto">
                                                        <Download className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">No supporting documents uploaded</p>
                                    )}
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Contract Versions</h3>
                                    {contract.versions && contract.versions.length > 0 ? (
                                        <div className="space-y-2">
                                            {contract.versions.map((version) => (
                                                <div key={version.version} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5 gap-2 sm:gap-0">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-amber-400" />
                                                        <div>
                                                            <p className="text-sm text-white">Version {version.version}</p>
                                                            <p className="text-xs text-gray-500">{version.fileName} • {version.fileType}</p>
                                                            {version.remarks && (
                                                                <p className="text-xs text-gray-400">{version.remarks}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors self-start sm:self-auto">
                                                        <Download className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">No versions uploaded</p>
                                    )}
                                </div>

                                {contract.finalFiles && (contract.finalFiles.pdf || contract.finalFiles.docx || contract.finalFiles.signedPdf) && (
                                    <div className="border-t border-white/10 pt-6">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Final Files</h3>
                                        <div className="space-y-2">
                                            {contract.finalFiles.pdf && (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-500/20 gap-2 sm:gap-0">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-green-400" />
                                                        <div>
                                                            <p className="text-sm text-white">Final PDF</p>
                                                            <p className="text-xs text-gray-500">{contract.finalFiles.pdf.fileName}</p>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors self-start sm:self-auto">
                                                        <Download className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            )}
                                            {contract.finalFiles.docx && (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-blue-900/20 rounded-lg border border-blue-500/20 gap-2 sm:gap-0">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-blue-400" />
                                                        <div>
                                                            <p className="text-sm text-white">Final DOCX</p>
                                                            <p className="text-xs text-gray-500">{contract.finalFiles.docx.fileName}</p>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors self-start sm:self-auto">
                                                        <Download className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            )}
                                            {contract.finalFiles.signedPdf && (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-purple-900/20 rounded-lg border border-purple-500/20 gap-2 sm:gap-0">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-purple-400" />
                                                        <div>
                                                            <p className="text-sm text-white">Signed PDF</p>
                                                            <p className="text-xs text-gray-500">{contract.finalFiles.signedPdf.fileName}</p>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors self-start sm:self-auto">
                                                        <Download className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

// ===== Main Contracts Page =====
export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('All Types')
    const [selectedStatus, setSelectedStatus] = useState('All Status')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

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
            setTotalPages(contractsResponse.pagination?.pages || 1)
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
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchData])

    const handleCancel = async () => {
        if (!selectedContract) return
        setActionLoading(true)
        try {
            await contractService.updateContractStatus(selectedContract._id, 'Cancelled')
            setShowCancelModal(false)
            setSelectedContract(null)
            fetchData()
        } catch (err: any) {
            setError(err.message || 'Failed to cancel contract')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0F0F0F' }}>
            <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8">
                <div className="max-w-full">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8"
                    >
                        <div>
                            <h1
                                className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white"
                                style={{ fontFamily: 'Cormorant Garamond' }}
                            >
                                Contracts
                            </h1>
                            <p
                                className="text-sm sm:text-base md:text-lg mt-1 text-gray-400"
                                style={{ fontFamily: 'Outfit' }}
                            >
                                Manage and track all your legal agreements
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreateModal(true)}
                            className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2 bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Contract</span>
                        </motion.button>
                    </motion.div>

                    {/* Stats Cards - Responsive Grid */}
                    {stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8"
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
                                        className="rounded-xl p-3 sm:p-4 border border-white/10 bg-slate-900/50 hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                                            <p
                                                className="text-xs font-medium text-gray-400"
                                                style={{ fontFamily: 'Outfit' }}
                                            >
                                                {stat.label}
                                            </p>
                                            <Icon
                                                className="w-3 h-3 sm:w-4 sm:h-4"
                                                style={{ color: stat.color }}
                                            />
                                        </div>
                                        <p
                                            className="text-xl sm:text-2xl md:text-3xl font-light"
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

                    {/* Search and Filters - Responsive */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="mb-6 sm:mb-8"
                    >
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search contracts..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full pl-10 sm:pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors text-sm sm:text-base"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={selectedType}
                                    onChange={(e) => {
                                        setSelectedType(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full sm:w-auto px-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white focus:border-amber-400 focus:outline-none transition-colors text-sm sm:text-base"
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
                                    className="w-full sm:w-auto px-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white focus:border-amber-400 focus:outline-none transition-colors text-sm sm:text-base"
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

                    {/* Contracts Table - Responsive */}
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
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider">Contract</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider hidden md:table-cell">Counterparty</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider hidden sm:table-cell">Type</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider">Status</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider hidden lg:table-cell">Priority</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider hidden xl:table-cell">Value</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-medium text-gray-400 tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contracts.map((contract, idx) => {
                                                const StatusIcon = statusColors[contract.status]?.icon || AlertCircle
                                                const isEditable = isContractEditable(contract.status)
                                                const isCancellable = contract.status !== 'Cancelled' && contract.status !== 'Completed'

                                                return (
                                                    <motion.tr
                                                        key={contract._id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-white truncate max-w-[120px] sm:max-w-[200px]">
                                                                    {contract.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {contract.requestNumber}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                                            <div>
                                                                <p className="text-sm text-white truncate max-w-[100px]">
                                                                    {contract.counterparty?.name || 'N/A'}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate max-w-[100px]">
                                                                    {contract.counterparty?.company || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                                            <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full bg-white/5 text-gray-300 whitespace-nowrap">
                                                                {contract.contractType}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <StatusIcon
                                                                    className="w-3 h-3 sm:w-4 sm:h-4"
                                                                    style={{ color: statusColors[contract.status]?.text }}
                                                                />
                                                                <span
                                                                    className="text-xs sm:text-sm font-medium"
                                                                    style={{ color: statusColors[contract.status]?.text }}
                                                                >
                                                                    {contract.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                                                            <span
                                                                className="text-xs sm:text-sm font-medium"
                                                                style={{ color: priorityColors[contract.priority] || '#808080' }}
                                                            >
                                                                {contract.priority}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden xl:table-cell">
                                                            <p className="text-xs sm:text-sm font-medium text-amber-400">
                                                                {contract.contractValue
                                                                    ? `${contract.currency} ${Number(contract.contractValue).toLocaleString()}`
                                                                    : '—'}
                                                            </p>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => {
                                                                        setSelectedContract(contract)
                                                                        setShowDetailsModal(true)
                                                                    }}
                                                                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                                                </motion.button>

                                                                {isEditable && (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => {
                                                                            setSelectedContract(contract)
                                                                            setShowEditModal(true)
                                                                        }}
                                                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                                        title="Edit Contract"
                                                                    >
                                                                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                                                                    </motion.button>
                                                                )}

                                                                {isCancellable && (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => {
                                                                            setSelectedContract(contract)
                                                                            setShowCancelModal(true)
                                                                        }}
                                                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                                        title="Cancel Contract"
                                                                    >
                                                                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                                                                    </motion.button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {contracts.length === 0 && (
                                    <div className="text-center py-12 sm:py-16">
                                        <FileCheck className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-600" />
                                        <p className="text-lg text-gray-400" style={{ fontFamily: 'Outfit' }}>
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

                    {/* Pagination - Responsive */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                            <p className="text-sm text-gray-400">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 sm:px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 sm:px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 inline ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateContractModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchData}
            />

            {selectedContract && (
                <>
                    <ContractDetailsModal
                        contract={selectedContract}
                        isOpen={showDetailsModal}
                        onClose={() => {
                            setShowDetailsModal(false)
                            setSelectedContract(null)
                        }}
                        onStatusChange={fetchData}
                    />

                    <EditContractModal
                        contract={selectedContract}
                        isOpen={showEditModal}
                        onClose={() => {
                            setShowEditModal(false)
                            setSelectedContract(null)
                        }}
                        onSuccess={fetchData}
                    />

                    <CancelConfirmationModal
                        isOpen={showCancelModal}
                        onClose={() => {
                            setShowCancelModal(false)
                            setSelectedContract(null)
                        }}
                        onConfirm={handleCancel}
                        contractTitle={selectedContract.title}
                        isLoading={actionLoading}
                    />
                </>
            )}
        </div>
    )
}