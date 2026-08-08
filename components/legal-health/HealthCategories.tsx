'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react'

interface Category {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'needs-attention'
  progress: number
  lastUpdated: string
  recommendation: string
  icon: React.ReactNode
}

const categories: Category[] = [
  {
    id: '1',
    name: 'Company Incorporation',
    status: 'healthy',
    progress: 100,
    lastUpdated: '2024-10-15',
    recommendation: 'All documents are up to date',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: '2',
    name: 'GST Compliance',
    status: 'healthy',
    progress: 92,
    lastUpdated: '2024-10-20',
    recommendation: 'File next quarterly return by Nov 15',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: '3',
    name: 'Trademark',
    status: 'healthy',
    progress: 95,
    lastUpdated: '2024-10-10',
    recommendation: 'Schedule renewal before expiry date',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: '4',
    name: 'Employment Documentation',
    status: 'warning',
    progress: 78,
    lastUpdated: '2024-09-30',
    recommendation: 'Update employment contracts and policies',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  {
    id: '5',
    name: 'Vendor Contracts',
    status: 'warning',
    progress: 82,
    lastUpdated: '2024-10-05',
    recommendation: 'Review 3 contracts expiring soon',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  {
    id: '6',
    name: 'Privacy Policy',
    status: 'needs-attention',
    progress: 65,
    lastUpdated: '2024-08-20',
    recommendation: 'Update policy for new data regulations',
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: '7',
    name: 'Labour Compliance',
    status: 'healthy',
    progress: 88,
    lastUpdated: '2024-10-18',
    recommendation: 'File ESI returns by end of month',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: '8',
    name: 'Licenses',
    status: 'healthy',
    progress: 91,
    lastUpdated: '2024-10-12',
    recommendation: 'All licenses current and valid',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: '9',
    name: 'Tax Compliance',
    status: 'warning',
    progress: 75,
    lastUpdated: '2024-09-25',
    recommendation: 'Complete TDS filing for Q2',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  {
    id: '10',
    name: 'Corporate Filings',
    status: 'healthy',
    progress: 89,
    lastUpdated: '2024-10-16',
    recommendation: 'Annual filing due in 60 days',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
]

const statusConfig = {
  healthy: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', label: 'Healthy' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', label: 'Warning' },
  'needs-attention': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', label: 'Needs Attention' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

export function HealthCategories() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-2xl font-bold text-foreground mb-6">Health Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
            className={`border-2 rounded-xl p-5 group cursor-pointer transition-all duration-300 ${statusConfig[category.status].bg} ${statusConfig[category.status].border}`}
          >
            {/* Icon and Status */}
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${statusConfig[category.status].bg}`}>
                <div className={statusConfig[category.status].text}>{category.icon}</div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusConfig[category.status].bg} ${statusConfig[category.status].text}`}>
                {statusConfig[category.status].label}
              </span>
            </div>

            {/* Name */}
            <h3 className="font-semibold text-foreground mb-3 line-clamp-2">{category.name}</h3>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-xs font-bold text-foreground">{category.progress}%</p>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${category.progress}%` }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className={`h-full rounded-full ${statusConfig[category.status].bg} ${statusConfig[category.status].text}`}
                />
              </div>
            </div>

            {/* Recommendation */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{category.recommendation}</p>

            {/* Last Updated */}
            <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
              Updated {new Date(category.lastUpdated).toLocaleDateString()}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
