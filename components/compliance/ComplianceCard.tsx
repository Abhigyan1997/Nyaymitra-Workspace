'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  CalendarDays,
} from 'lucide-react'

interface ComplianceCardProps {
  item: {
    _id?: string
    id?: string
    name: string
    organization?: string
    category?: string
    assignedProfessional?: string
    dueDate: string
    status: 'pending' | 'in-progress' | 'completed' | 'overdue'
    priority: 'low' | 'medium' | 'high'
    description?: string
    relatedDocuments: number
    recurring?: boolean
    recurrence?: string | null
  }
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function ComplianceCard({
  item,
  onView,
  onEdit,
  onDelete,
}: ComplianceCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Pending',
      color: 'text-gray-300 bg-gray-800/50',
      dot: 'bg-gray-500',
    },
    'in-progress': {
      icon: AlertCircle,
      label: 'In Progress',
      color: 'text-blue-300 bg-blue-900/30',
      dot: 'bg-blue-500',
    },
    completed: {
      icon: CheckCircle2,
      label: 'Completed',
      color: 'text-emerald-300 bg-emerald-900/30',
      dot: 'bg-emerald-500',
    },
    overdue: {
      icon: AlertCircle,
      label: 'Overdue',
      color: 'text-red-300 bg-red-900/30',
      dot: 'bg-red-500',
    },
  }

  const priorityConfig = {
    low: {
      label: 'Low',
      color: 'text-gray-300 bg-gray-800/50',
    },
    medium: {
      label: 'Medium',
      color: 'text-amber-300 bg-amber-900/30',
    },
    high: {
      label: 'High',
      color: 'text-red-300 bg-red-900/30',
    },
  }

  const complianceId = item._id || item.id

  const daysUntilDue = useMemo(() => {
    const due = new Date(item.dueDate).getTime()
    const now = new Date().getTime()
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  }, [item.dueDate])

  const actualStatus =
    item.status !== 'completed' && daysUntilDue < 0
      ? 'overdue'
      : item.status

  const statusData = statusConfig[actualStatus]
  const priorityData = priorityConfig[item.priority]
  const StatusIcon = statusData.icon

  const formattedDueDate = new Date(item.dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const handleView = () => {
    if (!complianceId) return
    setShowMenu(false)
    onView(complianceId)
  }

  const handleEdit = () => {
    if (!complianceId) return
    setShowMenu(false)
    onEdit(complianceId)
  }

  const handleDelete = () => {
    if (!complianceId) return
    setShowMenu(false)
    onDelete(complianceId)
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative bg-black border border-amber-500/20 rounded-lg shadow-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 overflow-hidden flex flex-col h-full"
    >
      {/* Status indicator bar */}
      <div className={`h-1.5 w-full ${statusData.dot}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <button
            type="button"
            onClick={handleView}
            className="flex-1 min-w-0 text-left"
          >
            <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
              {item.name}
            </h3>
            {item.organization && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                {item.organization}
              </p>
            )}
          </button>

          {/* Action Menu */}
          <div className="relative flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowMenu((current) => !current)}
              className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              aria-label="Compliance actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    aria-label="Close actions"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setShowMenu(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-amber-500/30 bg-gray-950 shadow-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={handleView}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <div className="h-px bg-gray-800" />

                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-4">
            {item.description}
          </p>
        )}

        {/* Category Badge */}
        {item.category && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 text-xs font-medium border border-amber-500/20">
              {item.category}
            </span>
          </div>
        )}

        {/* Status + Priority Pills */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span
            className={`text-xs font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1.5 ${statusData.color}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${statusData.dot}`} />
            {statusData.label}
          </span>

          <span
            className={`text-xs font-medium px-2.5 py-1.5 rounded-full ${priorityData.color}`}
          >
            {priorityData.label} Priority
          </span>

          {item.recurring && (
            <span className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {item.recurrence ? `Recurs ${item.recurrence}` : 'Recurring'}
            </span>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-6 pb-5 border-b border-gray-800 mb-4">
          {/* Assigned */}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Assigned To
            </p>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <p className="text-sm font-medium text-white truncate">
                {item.assignedProfessional || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Due Date
            </p>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium truncate ${actualStatus === 'overdue'
                      ? 'text-red-400'
                      : 'text-white'
                    }`}
                >
                  {actualStatus === 'overdue'
                    ? `${Math.abs(daysUntilDue)}d overdue`
                    : `${daysUntilDue}d left`}
                </p>
                <p className="text-xs text-gray-500">
                  {formattedDueDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <FileText className="w-3.5 h-3.5" />
            <span>
              {item.relatedDocuments}{' '}
              {item.relatedDocuments === 1 ? 'doc' : 'docs'}
            </span>
          </div>

          <motion.button
            whileHover={{ x: 2 }}
            type="button"
            onClick={handleView}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            View
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}