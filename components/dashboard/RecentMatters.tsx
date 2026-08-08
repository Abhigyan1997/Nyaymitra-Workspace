'use client'

import { motion } from 'framer-motion'
import { Eye, MoreVertical, ArrowUpRight } from 'lucide-react'

const matters = [
  {
    id: 1,
    name: 'Smith vs. Jones',
    type: 'Litigation',
    status: 'Active',
    client: 'Smith Estate',
    billedAmount: '$12,450',
    progress: 65,
    lastUpdated: '2 hours ago',
  },
  {
    id: 2,
    name: 'Tech Corp M&A',
    type: 'Corporate',
    status: 'Active',
    client: 'TechCorp Inc.',
    billedAmount: '$34,200',
    progress: 45,
    lastUpdated: '4 hours ago',
  },
  {
    id: 3,
    name: 'Blue Inc. Contract Review',
    type: 'Contract',
    status: 'Active',
    client: 'Blue Industries',
    billedAmount: '$5,800',
    progress: 82,
    lastUpdated: '1 hour ago',
  },
  {
    id: 4,
    name: 'Property Dispute Resolution',
    type: 'Real Estate',
    status: 'On Hold',
    client: 'Riverside Properties',
    billedAmount: '$8,900',
    progress: 35,
    lastUpdated: 'Yesterday',
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-accent/10 text-accent border-accent/20'
    case 'On Hold':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'Completed':
      return 'bg-muted/10 text-muted-foreground border-muted/20'
    default:
      return 'bg-muted/10 text-muted-foreground border-muted/20'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Litigation':
      return 'text-destructive'
    case 'Corporate':
      return 'text-secondary'
    case 'Contract':
      return 'text-primary'
    case 'Real Estate':
      return 'text-accent'
    default:
      return 'text-muted-foreground'
  }
}

export function RecentMatters() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-heading-md font-semibold text-foreground">Recent Matters</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-body-sm text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          View All
        </motion.button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="min-w-full"
        >
          {/* Headers */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div className="col-span-3">Matter Name</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-2">Billed</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {matters.map((matter, index) => (
              <motion.button
                key={matter.id}
                variants={rowVariants}
                whileHover={{ backgroundColor: 'rgba(255, 158, 11, 0.03)' }}
                className="w-full grid grid-cols-12 gap-4 px-4 py-4 hover:bg-background/50 transition-colors duration-200 text-left group"
              >
                {/* Matter Name & Type */}
                <div className="col-span-3">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {matter.name}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${getTypeColor(matter.type)}`}>
                    {matter.type}
                  </p>
                </div>

                {/* Client */}
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">{matter.client}</p>
                </div>

                {/* Billed Amount */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-foreground">{matter.billedAmount}</span>
                    <ArrowUpRight className="w-3 h-3 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{matter.lastUpdated}</p>
                </div>

                {/* Progress Bar */}
                <div className="col-span-2">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${matter.progress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 + index * 0.1 }}
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{matter.progress}%</p>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      matter.status
                    )}`}
                  >
                    {matter.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 flex items-center justify-between text-xs text-muted-foreground"
      >
        <span>Showing 4 of 23 matters</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View All Matters →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}