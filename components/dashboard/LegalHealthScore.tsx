'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'

export function LegalHealthScore() {
  const score = 78
  const metrics = [
    { label: 'Compliance', value: 92, status: 'healthy' },
    { label: 'Deadlines Met', value: 88, status: 'healthy' },
    { label: 'Documentation', value: 76, status: 'warning' },
    { label: 'Billing', value: 65, status: 'critical' },
  ]

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl p-8"
    >
      <h2 className="text-heading-md font-semibold text-foreground mb-8">Legal Health Score</h2>

      {/* Circular Progress */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            {/* Progress Circle */}
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              className="text-primary transition-colors"
              strokeLinecap="round"
            />
          </svg>
          {/* Score Text */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <span className="text-3xl font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground">out of 100</span>
          </motion.div>
        </div>

        {/* Score Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 mb-6"
        >
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-sm text-muted-foreground">+8 points this month</span>
        </motion.div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">{metric.label}</span>
              <span className="text-xs text-muted-foreground">{metric.value}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.8 }}
                className={`h-full rounded-full ${
                  metric.status === 'healthy'
                    ? 'bg-accent'
                    : metric.status === 'warning'
                    ? 'bg-primary'
                    : 'bg-destructive'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alert */}
      {metrics.some((m) => m.status === 'critical') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">
            Billing metrics need attention. Review pending invoices and payment terms.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
