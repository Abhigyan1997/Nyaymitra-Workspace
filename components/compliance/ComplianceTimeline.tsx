'use client'

import { motion } from 'framer-motion'
import { Clock, AlertCircle, CheckCircle2, User } from 'lucide-react'

interface TimelineItem {
  id: string
  title: string
  organization: string
  dueDate: string
  status: 'upcoming' | 'overdue' | 'completed'
  priority: 'high' | 'medium' | 'low'
  assigned: string
  daysRemaining: number
}

const mockItems: TimelineItem[] = [
  {
    id: '1',
    title: 'GST Quarterly Filing',
    organization: 'Acme Corp',
    dueDate: '2024-11-15',
    status: 'upcoming',
    priority: 'high',
    assigned: 'Sarah Johnson',
    daysRemaining: 8,
  },
  {
    id: '2',
    title: 'ROC Annual Return',
    organization: 'Tech Innovations',
    dueDate: '2024-11-28',
    status: 'upcoming',
    priority: 'high',
    assigned: 'Michael Chen',
    daysRemaining: 21,
  },
  {
    id: '3',
    title: 'TDS Return Filing',
    organization: 'Global Services',
    dueDate: '2024-10-07',
    status: 'overdue',
    priority: 'high',
    assigned: 'Emma Davis',
    daysRemaining: -31,
  },
  {
    id: '4',
    title: 'PF Contribution Due',
    organization: 'StartUp Labs',
    dueDate: '2024-11-10',
    status: 'upcoming',
    priority: 'medium',
    assigned: 'James Wilson',
    daysRemaining: 3,
  },
  {
    id: '5',
    title: 'Trademark Renewal',
    organization: 'Brand Co',
    dueDate: '2024-11-05',
    status: 'completed',
    priority: 'low',
    assigned: 'Lisa Anderson',
    daysRemaining: 0,
  },
]

const statusConfig = {
  upcoming: { color: 'bg-amber-500', lightBg: 'bg-amber-500/10', text: 'text-amber-500' },
  overdue: { color: 'bg-red-500', lightBg: 'bg-red-500/10', text: 'text-red-500' },
  completed: { color: 'bg-green-500', lightBg: 'bg-green-500/10', text: 'text-green-500' },
}

const priorityConfig = {
  high: { label: 'High', color: 'bg-red-500/10 text-red-500' },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-500' },
  low: { label: 'Low', color: 'bg-blue-500/10 text-blue-500' },
}

export function ComplianceTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="space-y-6">
        {mockItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-4 pb-6 last:pb-0 last:border-b-0 border-b border-border/50"
          >
            {/* Timeline Dot */}
            <div className="flex flex-col items-center">
              <motion.div
                whileHover={{ scale: 1.2 }}
                className={`w-10 h-10 rounded-full ${statusConfig[item.status].lightBg} flex items-center justify-center`}
              >
                {item.status === 'completed' && (
                  <CheckCircle2 className={`w-5 h-5 ${statusConfig[item.status].text}`} />
                )}
                {item.status === 'overdue' && (
                  <AlertCircle className={`w-5 h-5 ${statusConfig[item.status].text}`} />
                )}
                {item.status === 'upcoming' && (
                  <Clock className={`w-5 h-5 ${statusConfig[item.status].text}`} />
                )}
              </motion.div>
              {index !== mockItems.length - 1 && (
                <div className={`w-0.5 h-12 ${statusConfig[item.status].color} opacity-20 mt-2`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.organization}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[item.priority].color}`}>
                    {priorityConfig[item.priority].label}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[item.status].lightBg} ${statusConfig[item.status].text}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                  <p className="text-sm font-medium text-foreground">{new Date(item.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                  <p className={`text-sm font-medium ${
                    item.status === 'overdue'
                      ? 'text-red-500'
                      : item.status === 'completed'
                      ? 'text-green-500'
                      : 'text-foreground'
                  }`}>
                    {item.status === 'completed' ? 'Completed' : `${Math.abs(item.daysRemaining)} days`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.assigned}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    View
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
