'use client'

import { motion } from 'framer-motion'
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'

const deadlines = [
  {
    id: 1,
    title: 'Discovery Deadline',
    matter: 'Smith vs. Jones',
    date: 'Tomorrow',
    priority: 'critical',
    days: 1,
  },
  {
    id: 2,
    title: 'Court Filing',
    matter: 'Tech Corp Matter',
    date: 'In 3 days',
    priority: 'high',
    days: 3,
  },
  {
    id: 3,
    title: 'Client Presentation',
    matter: 'Blue Inc. Contract',
    date: 'In 5 days',
    priority: 'medium',
    days: 5,
  },
  {
    id: 4,
    title: 'Final Brief',
    matter: 'M&A Transaction',
    date: 'In 7 days',
    priority: 'low',
    days: 7,
  },
]

export function UpcomingDeadlines() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Deadlines</h2>
        <Calendar className="w-5 h-5 text-muted-foreground" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {deadlines.map((deadline) => {
          const priorityColors = {
            critical: 'bg-destructive/10 border-destructive/20 text-destructive',
            high: 'bg-primary/10 border-primary/20 text-primary',
            medium: 'bg-secondary/10 border-secondary/20 text-secondary',
            low: 'bg-muted/10 border-muted/20 text-muted-foreground',
          }

          return (
            <motion.button
              key={deadline.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-3 rounded-lg border transition-all duration-200 text-left group ${
                priorityColors[deadline.priority as keyof typeof priorityColors]
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm mb-0.5">{deadline.title}</p>
                  <p className="text-xs opacity-75">{deadline.matter}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {deadline.priority === 'critical' && (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {deadline.date}
                  </span>
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* View All */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-background transition-colors duration-200"
      >
        View All Deadlines
      </motion.button>
    </motion.div>
  )
}
