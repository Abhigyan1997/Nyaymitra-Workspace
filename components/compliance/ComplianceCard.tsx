'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, AlertCircle, CheckCircle2, FileText, User } from 'lucide-react'
import Link from 'next/link'

interface ComplianceCardProps {
  item: {
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
}

export function ComplianceCard({ item }: ComplianceCardProps) {
  const statusIcons = {
    pending: Clock,
    'in-progress': AlertCircle,
    completed: CheckCircle2,
    overdue: AlertCircle,
  }

  const statusColors = {
    pending: 'text-yellow-500 bg-yellow-500/10',
    'in-progress': 'text-blue-500 bg-blue-500/10',
    completed: 'text-accent bg-accent/10',
    overdue: 'text-red-500 bg-red-500/10',
  }

  const priorityColors = {
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
  }

  const daysUntilDue = useMemo(() => {
    return Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }, [item.dueDate])
  
  const StatusIcon = statusIcons[item.status]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-heading-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {item.name}
          </h3>
          <p className="text-body-sm mt-2">{item.organization}</p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="text-primary flex-shrink-0 ml-2"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Description */}
      <p className="text-body-sm mb-5">{item.description}</p>

      {/* Status and Priority */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1 ${statusColors[item.status]}`}>
          <StatusIcon className="w-3 h-3" />
          {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full bg-background text-foreground`}>
          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
        </span>
      </div>

      {/* Linked Matter Badge */}
      {item.linkedMatter && (
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full w-fit uppercase tracking-wide">
          <FileText className="w-3 h-3" />
          {item.linkedMatter}
        </div>
      )}

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-4 pb-5 border-b border-border mb-5">
        <div>
          <p className="text-label-md mb-2">Assigned To</p>
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-muted-foreground" />
            <p className="text-body-md font-semibold text-foreground truncate">{item.assignedProfessional}</p>
          </div>
        </div>
        <div>
          <p className="text-label-md mb-2">Due Date</p>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <p className={`text-body-md font-semibold ${daysUntilDue < 0 ? 'text-red-500' : 'text-foreground'}`}>
              {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d ago` : `${daysUntilDue}d`}
            </p>
          </div>
        </div>
      </div>

      {/* Related Documents */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-body-sm text-muted-foreground font-medium">
          <FileText className="w-4 h-4" />
          <span>{item.relatedDocuments} documents</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  )
}
