'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, FileText, AlertCircle } from 'lucide-react'

interface Improvement {
  id: string
  title: string
  date: string
  type: 'completed' | 'uploaded' | 'resolved'
  icon: React.ReactNode
}

const improvements: Improvement[] = [
  {
    id: '1',
    title: 'GST Filing Completed',
    date: '2024-10-20',
    type: 'completed',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    id: '2',
    title: 'Incorporation Docs',
    date: '2024-10-18',
    type: 'uploaded',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: '3',
    title: 'Contract Review Issue',
    date: '2024-10-15',
    type: 'resolved',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    id: '4',
    title: 'Privacy Policy Updated',
    date: '2024-10-12',
    type: 'completed',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    id: '5',
    title: 'Employment Contracts',
    date: '2024-10-10',
    type: 'uploaded',
    icon: <FileText className="w-4 h-4" />,
  },
]

const typeConfig = {
  completed: { color: 'text-green-500', bg: 'bg-green-500/10' },
  uploaded: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  resolved: { color: 'text-amber-500', bg: 'bg-amber-500/10' },
}

export function RecentImprovements() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <h2 className="text-xl font-bold text-foreground mb-4">Recent Improvements</h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {improvements.map((improvement, index) => (
          <motion.div
            key={improvement.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3 pb-3 last:pb-0 border-b border-border/50 last:border-b-0"
          >
            {/* Icon */}
            <div className={`p-2 rounded-lg flex-shrink-0 ${typeConfig[improvement.type].bg}`}>
              <div className={typeConfig[improvement.type].color}>{improvement.icon}</div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-1">{improvement.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(improvement.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Link */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
      >
        View Timeline
      </motion.button>
    </motion.div>
  )
}
