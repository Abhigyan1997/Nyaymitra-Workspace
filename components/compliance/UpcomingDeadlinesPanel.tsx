'use client'

import { motion } from 'framer-motion'
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

interface DeadlineItem {
  id: string
  title: string
  date: string
  status: 'today' | 'this-week' | 'this-month'
  priority: 'high' | 'medium'
}

const deadlines: DeadlineItem[] = [
  {
    id: '1',
    title: 'GST Quarterly Filing',
    date: 'Today',
    status: 'today',
    priority: 'high',
  },
  {
    id: '2',
    title: 'PF Contribution',
    date: 'In 2 days',
    status: 'this-week',
    priority: 'high',
  },
  {
    id: '3',
    title: 'ROC Annual Return',
    date: 'Next week',
    status: 'this-week',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Trademark Renewal',
    date: 'In 10 days',
    status: 'this-month',
    priority: 'medium',
  },
]

export function UpcomingDeadlinesPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-6 space-y-4 sticky top-6"
    >
      <h3 className="font-bold text-foreground mb-4">Upcoming Deadlines</h3>

      <div className="space-y-3">
        {/* Today */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Today</p>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 group cursor-pointer hover:bg-red-500/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">GST Quarterly Filing</p>
                <p className="text-xs text-muted-foreground mt-1">Acme Corp</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* This Week */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">This Week</p>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 group cursor-pointer hover:bg-amber-500/20 transition-colors mb-2"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">PF Contribution</p>
                <p className="text-xs text-muted-foreground mt-1">In 2 days</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 group cursor-pointer hover:bg-blue-500/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">ROC Annual Return</p>
                <p className="text-xs text-muted-foreground mt-1">Next week</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* This Month */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">This Month</p>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 group cursor-pointer hover:bg-purple-500/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">Trademark Renewal</p>
                <p className="text-xs text-muted-foreground mt-1">In 10 days</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-border space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-primary/10 text-primary py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          Add Reminder
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          View Calendar
        </motion.button>
      </div>
    </motion.div>
  )
}
