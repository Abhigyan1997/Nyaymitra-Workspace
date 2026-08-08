'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Zap, CheckCircle2, TrendingUp } from 'lucide-react'

interface Insight {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  type: 'risk' | 'action' | 'completed' | 'trend'
}

const insights: Insight[] = [
  {
    id: '1',
    title: 'High Priority Risk',
    description: 'Privacy Policy needs immediate update for GDPR compliance',
    icon: <AlertTriangle className="w-5 h-5" />,
    type: 'risk',
  },
  {
    id: '2',
    title: 'Urgent Action Needed',
    description: 'File TDS return by November 7, 2024',
    icon: <Zap className="w-5 h-5" />,
    type: 'action',
  },
  {
    id: '3',
    title: 'Compliance Trends',
    description: 'Overall compliance improved by 8% this quarter',
    icon: <TrendingUp className="w-5 h-5" />,
    type: 'trend',
  },
]

const typeConfig = {
  risk: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500' },
  action: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500' },
  completed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500' },
  trend: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500' },
}

export function InsightsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <h2 className="text-xl font-bold text-foreground mb-6">Insights & Actions</h2>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border-2 rounded-lg p-4 group cursor-pointer hover:scale-105 transition-all ${typeConfig[insight.type].bg} ${typeConfig[insight.type].border}`}
          >
            <div className="flex gap-4">
              <div className={`p-2 rounded-lg flex-shrink-0 ${typeConfig[insight.type].bg}`}>
                <div className={typeConfig[insight.type].text}>{insight.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm mb-1 ${typeConfig[insight.type].text}`}>{insight.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{insight.description}</p>
              </div>
              <div className="flex-shrink-0 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                →
              </div>
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
        View All Insights
      </motion.button>
    </motion.div>
  )
}
