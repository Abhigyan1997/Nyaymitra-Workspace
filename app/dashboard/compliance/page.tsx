'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { ComplianceCard } from '@/components/compliance/ComplianceCard'

interface ComplianceItem {
  id: string
  name: string
  organization: string
  linkedMatter?: string
  assignedProfessional: string
  dueDate: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  description: string
  relatedDocuments: number
}

const mockCompliance: ComplianceItem[] = [
  {
    id: '1',
    name: 'Annual ROC Filing',
    organization: 'AIMediLabs',
    linkedMatter: 'GST Registration',
    assignedProfessional: 'Sarah Chen',
    dueDate: '2024-08-15',
    status: 'pending',
    priority: 'high',
    description: 'Annual filing with Registrar of Companies',
    relatedDocuments: 3,
  },
  {
    id: '2',
    name: 'GST Return Filing',
    organization: 'Freshflow',
    assignedProfessional: 'Ravi Patel',
    dueDate: '2024-08-20',
    status: 'in-progress',
    priority: 'high',
    description: 'Monthly GST return for July',
    relatedDocuments: 5,
  },
  {
    id: '3',
    name: 'Labor Law Audit',
    organization: 'Talk2Partners',
    assignedProfessional: 'Emma Wilson',
    dueDate: '2024-08-10',
    status: 'overdue',
    priority: 'high',
    description: 'Annual labor law compliance audit',
    relatedDocuments: 8,
  },
  {
    id: '4',
    name: 'Tax Compliance Review',
    organization: 'CoEdge',
    linkedMatter: 'Tax Filing',
    assignedProfessional: 'Anuj Kumar',
    dueDate: '2024-08-25',
    status: 'pending',
    priority: 'medium',
    description: 'Quarterly tax compliance check',
    relatedDocuments: 4,
  },
  {
    id: '5',
    name: 'Privacy Policy Update',
    organization: 'AIMediLabs',
    assignedProfessional: 'Sarah Chen',
    dueDate: '2024-07-31',
    status: 'completed',
    priority: 'medium',
    description: 'Update privacy policy for GDPR compliance',
    relatedDocuments: 2,
  },
]

export default function CompliancePage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredCompliance = mockCompliance.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.organization.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const overdue = mockCompliance.filter(i => i.status === 'overdue').length
  const inProgress = mockCompliance.filter(i => i.status === 'in-progress').length
  const completed = mockCompliance.filter(i => i.status === 'completed').length

  const statuses = ['all', 'pending', 'in-progress', 'overdue', 'completed'] as const

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-display-lg font-bold text-foreground mb-3">Compliance Tracker</h1>
            <p className="text-body-md">Manage compliance deadlines and track your legal obligations</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-label-md mb-3">Total Items</p>
            <p className="text-display-md font-bold text-foreground">{mockCompliance.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-yellow-500" />
              <p className="text-label-md">Pending</p>
            </div>
            <p className="text-display-md font-bold text-foreground">{mockCompliance.filter(i => i.status === 'pending').length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-label-md">Overdue</p>
            </div>
            <p className="text-display-md font-bold text-red-500">{overdue}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <p className="text-2xl font-bold text-accent">{completed}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search compliance items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Status Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6"
        >
          {statuses.map(status => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:border-primary/50'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Compliance Items Grid */}
      {filteredCompliance.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredCompliance.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ComplianceCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">No compliance items found</p>
        </motion.div>
      )}
    </div>
  )
}
