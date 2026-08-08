'use client'

import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Minus, ChevronRight } from 'lucide-react'

interface HealthCategoryCardProps {
  category: {
    id: string
    name: string
    score: number
    riskLevel: 'low' | 'medium' | 'high'
    recommendation: string
    actionButton: string
    recentImprovement: string
    trend: 'up' | 'down' | 'stable'
  }
}

export function HealthCategoryCard({ category }: HealthCategoryCardProps) {
  const riskColors = {
    low: 'bg-accent/10 text-accent border-accent/50',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50',
    high: 'bg-red-500/10 text-red-400 border-red-500/50',
  }

  const scoreColors = {
    low: 'text-red-500',
    medium: 'text-yellow-500',
    high: 'text-accent',
  }

  const TrendIcon = category.trend === 'up' ? ArrowUp : category.trend === 'down' ? ArrowDown : Minus

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{category.recentImprovement}</p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="text-primary"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Score and Risk */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-3xl font-bold text-foreground">{category.score}%</p>
          <p className="text-xs text-muted-foreground mt-1">Legal Health Score</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium px-3 py-1 rounded-full border ${riskColors[category.riskLevel]}`}>
            {category.riskLevel.charAt(0).toUpperCase() + category.riskLevel.slice(1)}
          </span>
          <TrendIcon className={`w-5 h-5 ${category.trend === 'up' ? 'text-accent' : category.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-2 bg-background rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${category.score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full ${
              category.riskLevel === 'low'
                ? 'bg-accent'
                : category.riskLevel === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div className="mb-4 p-3 bg-background rounded-lg">
        <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
        <p className="text-sm text-foreground">{category.recommendation}</p>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg transition-colors text-sm"
      >
        {category.actionButton}
      </motion.button>
    </motion.div>
  )
}
