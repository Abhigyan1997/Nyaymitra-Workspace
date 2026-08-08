'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  trend: 'up' | 'down' | 'warning'
}

export function KPICard({ title, value, change, icon: Icon, trend }: KPICardProps) {
  const isWarning = trend === 'warning'
  const isUp = trend === 'up'

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-label-md mb-3">{title}</p>
            <p className="text-display-md font-bold text-foreground">{value}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`p-3 rounded-lg ${
              isWarning
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
        </div>

        {/* Change Indicator */}
        <div className="flex items-center gap-2">
          {!isWarning && (
            isUp ? (
              <TrendingUp className="w-4 h-4 text-accent" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )
          )}
          {isWarning && <AlertCircle className="w-4 h-4 text-destructive" />}
          <p className={`text-xs font-medium ${
            isWarning
              ? 'text-destructive'
              : isUp
              ? 'text-accent'
              : 'text-muted-foreground'
          }`}>
            {change}
          </p>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}
