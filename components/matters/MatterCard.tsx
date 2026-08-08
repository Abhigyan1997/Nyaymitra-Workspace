'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, MessageCircle, FileText, Clock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LegalTeamMember {
  name: string
  type: 'Lawyer' | 'Chartered Accountant' | 'Company Secretary'
  avatar: string
}

interface MatterCardProps {
  matter: {
    id: string
    name: string
    organization: string
    category: string
    assignedTo: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'draft' | 'in-progress' | 'review' | 'completed'
    dueDate: string
    progress: number
    legalTeam?: LegalTeamMember[]
  }
}

export function MatterCard({ matter }: MatterCardProps) {
  const router = useRouter()

  const priorityColors = {
    low: 'text-blue-500 bg-blue-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    urgent: 'text-red-500 bg-red-500/10',
  }

  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-300',
    'in-progress': 'bg-primary/20 text-primary',
    review: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-accent/20 text-accent',
  }

  const { daysUntilDue, isOverdue } = useMemo(() => {
    const daysUntil = Math.ceil((new Date(matter.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return { daysUntilDue: daysUntil, isOverdue: daysUntil < 0 }
  }, [matter.dueDate])

  const handleCardClick = () => {
    router.push(`/dashboard/matters/${matter.id}`)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={handleCardClick}
      className="group cursor-pointer bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200"
    >
      {/* Top section: Title and Status */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <h3 className="text-heading-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {matter.name}
            </h3>
            <p className="text-body-sm mt-2">{matter.organization}</p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="text-primary flex-shrink-0 ml-2"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Matter Type and Priority */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wide bg-background px-3 py-1.5 rounded-full text-foreground">
            {matter.category}
          </span>
          <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full ${priorityColors[matter.priority]}`}>
            {matter.priority.charAt(0).toUpperCase() + matter.priority.slice(1)}
          </span>
          <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full ${statusColors[matter.status]}`}>
            {matter.status.replace('-', ' ').charAt(0).toUpperCase() + matter.status.slice(1).replace('-', ' ')}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-label-md">Progress</span>
            <span className="text-body-md font-semibold text-foreground">{matter.progress}%</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${matter.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-primary/70"
            />
          </div>
        </div>

        {/* Legal Team */}
        {matter.legalTeam && matter.legalTeam.length > 0 && (
          <div className="mb-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Legal Team</p>
            <div className="flex flex-wrap gap-2">
              {matter.legalTeam.map((member) => (
                <motion.div
                  key={member.name}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background hover:bg-background/80 transition-colors cursor-pointer"
                  title={member.name}
                >
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {member.avatar}
                  </div>
                  <span className="text-xs font-medium text-foreground">{member.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 pt-5 border-t border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-label-md">Due</p>
              <p className={`text-body-md font-semibold ${isOverdue ? 'text-red-500' : 'text-foreground'}`}>
                {isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d`}
              </p>
            </div>
          </div>
          <div>
            <p className="text-label-md">Assigned To</p>
            <p className="text-body-md font-semibold text-foreground truncate">{matter.assignedTo}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            Comments
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Documents
          </motion.div>
        </div>
    </motion.div>
  )
}
