'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  Zap,
  Calendar,
  Shield,
  ArrowRight,
  Plus,
  Upload,
  TrendingUp,
  Eye,
  Loader2,
} from 'lucide-react'

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface User {
  id: string
  fullName: string
  email: string
  role: string
  userId: string
  phone: string
  profilePhoto?: string
}

interface AttentionItem {
  id: string
  title: string
  description: string
  action: string
  actionLabel: string
  severity: 'high' | 'medium' | 'low'
  daysUntil?: number
}

interface Matter {
  id: string
  title: string
  type: string
  priority: 'high' | 'medium' | 'low'
  professional: string
  stage: string
  progress: number
  dueDate: string
  status: 'under-review' | 'in-progress' | 'completed'
}

interface Contract {
  id: string
  name: string
  status: 'awaiting-signature' | 'in-review' | 'approved' | 'executed'
  nextAction: string
  dueDate: string
}

interface ComplianceItem {
  id: string
  name: string
  dueDate: string
  status: 'upcoming' | 'completed' | 'delayed'
  frequency: string
}

interface ActivityEvent {
  id: string
  action: string
  actor: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
}

interface LegalHealth {
  score: number
  status: 'healthy' | 'good' | 'at-risk'
  contracts: number
  compliance: number
  documentation: number
  risk: 'low' | 'medium' | 'high'
  attentionCount: number
}

interface MonthlyOperations {
  requestsReceived: number
  requestsCompleted: number
  contractsReviewed: number
  contractsDrafted: number
  pendingActions: number
}

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

const Card = ({
  children,
  className = '',
  hover = false,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
}) => (
  <div
    className={`rounded-xl p-4 sm:p-6 border border-white/8 bg-black/40 backdrop-blur-sm transition-all duration-300 ${hover ? 'hover:border-amber-400/50 hover:bg-black/50' : ''
      } ${className}`}
  >
    {children}
  </div>
)

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-medium tracking-widest text-amber-400 uppercase">
    {children}
  </p>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-medium tracking-wide text-amber-400 mb-4 sm:mb-6 uppercase">
    {children}
  </h2>
)

const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
  const colors = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span
      className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border ${colors[priority]}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

const StatusBadge = ({
  status,
}: {
  status: 'under-review' | 'in-progress' | 'completed'
}) => {
  const colors = {
    'under-review': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'in-progress': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  }
  const labels = {
    'under-review': 'Under Review',
    'in-progress': 'In Progress',
    completed: 'Completed',
  }
  return (
    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

const ContractStatusBadge = ({
  status,
}: {
  status: 'awaiting-signature' | 'in-review' | 'approved' | 'executed'
}) => {
  const colors = {
    'awaiting-signature': 'bg-red-500/10 text-red-400 border-red-500/20',
    'in-review': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    executed: 'bg-green-500/10 text-green-400 border-green-500/20',
  }
  const labels = {
    'awaiting-signature': 'Awaiting Signature',
    'in-review': 'In Review',
    approved: 'Approved',
    executed: 'Executed',
  }
  return (
    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

const ComplianceStatus = ({
  status,
}: {
  status: 'upcoming' | 'completed' | 'delayed'
}) => {
  const colors = {
    upcoming: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    delayed: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const labels = {
    upcoming: 'Upcoming',
    completed: 'Completed',
    delayed: 'Delayed',
  }
  return (
    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-black to-slate-950">
    <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-12 pb-6 sm:pb-8 border-b border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-white/10 rounded mb-2" />
          <div className="h-12 sm:h-14 lg:h-16 w-48 bg-white/10 rounded mb-2" />
          <div className="h-4 w-64 bg-white/10 rounded" />
        </div>
      </div>
    </div>
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-xl p-4 sm:p-6 border border-white/8 bg-black/40">
              <div className="h-6 w-32 bg-white/10 rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-20 bg-white/5 rounded" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ==========================================
// DASHBOARD SECTIONS (EXTRACTED COMPONENTS)
// ==========================================

interface DashboardHeaderProps {
  greeting: string
  firstName: string
  companyName: string
  onNewRequest: () => void
  onUploadDocument: () => void
}

const DashboardHeader = ({
  greeting,
  firstName,
  companyName,
  onNewRequest,
  onUploadDocument,
}: DashboardHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-12 pb-6 sm:pb-8 border-b border-white/5"
  >
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="text-xs sm:text-sm font-medium text-amber-400 mb-1 sm:mb-2">
            {greeting},
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-light tracking-tight text-white mb-1">
            {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {companyName} — Legal Operations Workspace
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-2 sm:gap-3"
        >
          <button
            onClick={onNewRequest}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-amber-400 text-black font-medium text-sm hover:bg-amber-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Legal Request
          </button>
          <button
            onClick={onUploadDocument}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border border-amber-400/30 bg-amber-400/5 text-amber-400 font-medium text-sm hover:bg-amber-400/10 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </motion.div>
      </div>
    </div>
  </motion.div>
)

interface AttentionPanelProps {
  items: AttentionItem[]
}

const AttentionPanel = ({ items }: AttentionPanelProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <Card>
      <SectionTitle>Needs Your Attention</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 + idx * 0.05 }}
            className={`p-3 sm:p-4 rounded-lg border transition-colors ${item.severity === 'high'
                ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/30'
                : item.severity === 'medium'
                  ? 'bg-amber-400/5 border-amber-400/20 hover:border-amber-400/30'
                  : 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/30'
              }`}
          >
            <div className="mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm font-medium text-white mb-0.5">
                {item.title}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400">
                {item.description}
              </p>
            </div>

            {item.daysUntil && (
              <p
                className={`text-[10px] sm:text-xs font-medium mb-2 sm:mb-3 ${item.severity === 'high'
                    ? 'text-red-400'
                    : item.severity === 'medium'
                      ? 'text-amber-400'
                      : 'text-blue-400'
                  }`}
              >
                {item.daysUntil} day{item.daysUntil !== 1 ? 's' : ''} left
              </p>
            )}

            <button
              className={`w-full text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded font-medium transition-colors ${item.severity === 'high'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                  : item.severity === 'medium'
                    ? 'bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20'
                    : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                }`}
            >
              {item.actionLabel}
            </button>
          </motion.div>
        ))}
      </div>
    </Card>
  </motion.div>
)

interface OverviewMetricsProps {
  activeMatters: number
  contracts: number
  pendingActions: number
  complianceDue: number
}

const OverviewMetrics = ({
  activeMatters,
  contracts,
  pendingActions,
  complianceDue,
}: OverviewMetricsProps) => {
  const metrics = [
    { title: 'Active Matters', value: activeMatters, icon: Briefcase },
    { title: 'Contracts', value: contracts, icon: FileText },
    { title: 'Pending Actions', value: pendingActions, icon: Clock },
    { title: 'Compliance Due', value: complianceDue, icon: Calendar },
  ]

  return (
    <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 + idx * 0.05 }}
          >
            <Card hover>
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <Label>{metric.title}</Label>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white">
                {metric.value}
              </p>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

interface WorkInProgressProps {
  matters: Matter[]
}

const WorkInProgress = ({ matters }: WorkInProgressProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.5 }}
  >
    <Card>
      <SectionTitle>Work in Progress</SectionTitle>
      <div className="space-y-4">
        {matters.map((matter, idx) => (
          <motion.div
            key={matter.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.52 + idx * 0.05 }}
            className="pb-4 border-b border-white/5 last:border-0 last:pb-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-white truncate">
                  {matter.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {matter.type} • {matter.professional}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <PriorityBadge priority={matter.priority} />
                <StatusBadge status={matter.status} />
              </div>
            </div>

            <div className="mb-2 sm:mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs text-gray-400">
                  {matter.stage}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400">
                  {matter.progress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${matter.progress}%` }}
                  transition={{ duration: 1, delay: 0.55 }}
                />
              </div>
            </div>

            <p className="text-[10px] sm:text-xs text-gray-500">
              Due: {matter.dueDate}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ x: 4 }}
        className="mt-4 sm:mt-6 flex items-center gap-2 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
      >
        View All Matters <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </motion.button>
    </Card>
  </motion.div>
)

interface LegalHealthCardProps {
  data: LegalHealth
}

const LegalHealthCard = ({ data }: LegalHealthCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.5 }}
  >
    <Card>
      <SectionTitle>Legal Health</SectionTitle>

      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex items-end gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-shrink-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <svg
                viewBox="0 0 120 120"
                className="transform -rotate-90 w-full h-full"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/10"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - data.score / 100)}`}
                  strokeLinecap="round"
                  className="text-amber-400"
                  initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 54 * (1 - data.score / 100),
                  }}
                  transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg sm:text-xl font-light text-white">
                  {data.score}
                </span>
                <span className="text-[10px] text-gray-400">/100</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-medium text-amber-400 mb-1">
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400">Legal Operations</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-300">Contracts</span>
          <span className="text-white font-medium">{data.contracts}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${data.contracts}%` }}
            transition={{ duration: 0.8, delay: 0.65 }}
          />
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-300">Compliance</span>
          <span className="text-white font-medium">{data.compliance}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${data.compliance}%` }}
            transition={{ duration: 0.8, delay: 0.7 }}
          />
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-300">Documentation</span>
          <span className="text-white font-medium">{data.documentation}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${data.documentation}%` }}
            transition={{ duration: 0.8, delay: 0.75 }}
          />
        </div>
      </div>

      {data.attentionCount > 0 && (
        <div className="p-3 sm:p-4 rounded-lg bg-amber-400/5 border border-amber-400/20 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-amber-400 font-medium">
            {data.attentionCount} area{data.attentionCount !== 1 ? 's' : ''} need{data.attentionCount !== 1 ? '' : 's'}{' '}
            attention
          </p>
        </div>
      )}

      <motion.button
        whileHover={{ x: 4 }}
        className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium py-2 rounded-lg hover:bg-amber-400/5"
      >
        View Full Assessment <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </motion.button>
    </Card>
  </motion.div>
)

interface ContractsAttentionProps {
  contracts: Contract[]
}

const ContractsAttention = ({ contracts }: ContractsAttentionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.6 }}
  >
    <Card>
      <SectionTitle>Contracts Requiring Attention</SectionTitle>
      <div className="space-y-3 sm:space-y-4">
        {contracts.map((contract, idx) => (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.62 + idx * 0.05 }}
            className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/5 hover:border-amber-400/30 transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-medium text-white truncate mb-1">
                  {contract.name}
                </h4>
                <p className="text-[10px] sm:text-xs text-gray-400">
                  {contract.nextAction}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ContractStatusBadge status={contract.status} />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
              Due: {contract.dueDate}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ x: 4 }}
        className="mt-4 sm:mt-6 flex items-center gap-2 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
      >
        View All Contracts <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </motion.button>
    </Card>
  </motion.div>
)

interface CompliancePreviewProps {
  items: ComplianceItem[]
}

const CompliancePreview = ({ items }: CompliancePreviewProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.7 }}
  >
    <Card>
      <SectionTitle>Upcoming Compliance</SectionTitle>
      <div className="space-y-3 sm:space-y-4">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.72 + idx * 0.05 }}
            className="flex items-start justify-between gap-3 pb-3 sm:pb-4 border-b border-white/5 last:border-0 last:pb-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-white mb-1">
                {item.name}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">{item.frequency}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <p className="text-[10px] sm:text-xs font-medium text-amber-400">
                {item.dueDate}
              </p>
              <ComplianceStatus status={item.status} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ x: 4 }}
        className="mt-4 sm:mt-6 flex items-center gap-2 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
      >
        View Compliance Calendar <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </motion.button>
    </Card>
  </motion.div>
)

interface RecentActivityProps {
  events: ActivityEvent[]
}

const RecentActivity = ({ events }: RecentActivityProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.7 }}
  >
    <Card>
      <SectionTitle>Recent Activity</SectionTitle>
      <div className="space-y-3 sm:space-y-4">
        {events.map((event) => {
          const Icon = event.icon
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 pb-3 sm:pb-4 border-b border-white/5 last:border-0 last:pb-0"
            >
              <div className="mt-0.5 p-1.5 sm:p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 flex-shrink-0">
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-white">
                  {event.action}
                  <span className="text-gray-400 ml-1 sm:ml-2 text-[10px] sm:text-xs">
                    by {event.actor}
                  </span>
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                  {event.timestamp}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.button
        whileHover={{ x: 4 }}
        className="mt-4 sm:mt-6 flex items-center gap-2 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
      >
        View All Activity <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </motion.button>
    </Card>
  </motion.div>
)

interface MonthlySummaryProps {
  data: MonthlyOperations
  month: string
}

const MonthlySummary = ({ data, month }: MonthlySummaryProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.85 }}
  >
    <Card>
      <SectionTitle>{month} Legal Operations</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
            Requests Received
          </p>
          <p className="text-xl sm:text-2xl font-light text-white">
            {data.requestsReceived}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
            Completed
          </p>
          <p className="text-xl sm:text-2xl font-light text-green-400">
            {data.requestsCompleted}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
            Contracts Reviewed
          </p>
          <p className="text-xl sm:text-2xl font-light text-white">
            {data.contractsReviewed}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
            Contracts Drafted
          </p>
          <p className="text-xl sm:text-2xl font-light text-white">
            {data.contractsDrafted}
          </p>
        </div>
        <div className="sm:col-span-1">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
            Pending Actions
          </p>
          <p className="text-xl sm:text-2xl font-light text-amber-400">
            {data.pendingActions}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ x: 4 }}
        className="mt-6 sm:mt-8 flex items-center gap-2 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
      >
        View Monthly Report <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </motion.button>
    </Card>
  </motion.div>
)

// ==========================================
// MAIN DASHBOARD
// ==========================================

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [greeting, setGreeting] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')

    if (!storedUser) {
      setIsLoading(false)
      setIsAuthenticated(false)
      router.push('/')
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setIsAuthenticated(true)

      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) {
        setGreeting('Good morning')
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good afternoon')
      } else if (hour >= 17 && hour < 21) {
        setGreeting('Good evening')
      } else {
        setGreeting('Good night')
      }
    } catch (error) {
      console.error('Failed to parse user:', error)
      localStorage.removeItem('user')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  const firstName = user?.fullName?.split(' ')[0] || 'User'
  const companyName = 'FreshFlow AI Pvt Ltd'

  // ==========================================
  // MOCK DATA STRUCTURE
  // ==========================================

  const attentionItems: AttentionItem[] = [
    {
      id: '1',
      title: 'Vendor Agreement',
      description: 'Awaiting your approval',
      action: 'review',
      actionLabel: 'Review',
      severity: 'high',
      daysUntil: 0,
    },
    {
      id: '2',
      title: 'GST Return',
      description: 'Filing due in 3 days',
      action: 'view',
      actionLabel: 'View',
      severity: 'high',
      daysUntil: 3,
    },
    {
      id: '3',
      title: 'Employment Agreement',
      description: 'Legal review completed',
      action: 'review',
      actionLabel: 'Review',
      severity: 'medium',
    },
    {
      id: '4',
      title: 'Trademark Matter',
      description: 'Response due in 5 days',
      action: 'view',
      actionLabel: 'View',
      severity: 'medium',
      daysUntil: 5,
    },
  ]

  const matters: Matter[] = [
    {
      id: '1',
      title: 'Contract Review - Vendor Agreement',
      type: 'Contracts',
      priority: 'high',
      professional: 'Sharma & Associates',
      stage: 'Legal Review',
      progress: 72,
      dueDate: 'Aug 12, 2024',
      status: 'under-review',
    },
    {
      id: '2',
      title: 'IP Registration - Trademark Filing',
      type: 'IP',
      priority: 'medium',
      professional: 'IP Professional',
      stage: 'Filing',
      progress: 45,
      dueDate: 'Aug 25, 2024',
      status: 'in-progress',
    },
    {
      id: '3',
      title: 'Employment Agreement Review',
      type: 'Employment',
      priority: 'medium',
      professional: 'Medha Banerjee',
      stage: 'Drafting',
      progress: 45,
      dueDate: 'Aug 18, 2024',
      status: 'in-progress',
    },
  ]

  const legalHealth: LegalHealth = {
    score: 87,
    status: 'healthy',
    contracts: 92,
    compliance: 88,
    documentation: 74,
    risk: 'low',
    attentionCount: 2,
  }

  const contracts: Contract[] = [
    {
      id: '1',
      name: 'Vendor Agreement',
      status: 'awaiting-signature',
      nextAction: 'Sign Agreement',
      dueDate: 'Aug 12',
    },
    {
      id: '2',
      name: 'SaaS Agreement',
      status: 'in-review',
      nextAction: 'Await Lawyer Review',
      dueDate: 'Aug 15',
    },
    {
      id: '3',
      name: 'Employment Agreement',
      status: 'awaiting-signature',
      nextAction: 'Review & Approve',
      dueDate: 'Aug 18',
    },
  ]

  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      name: 'GST Return',
      dueDate: 'Aug 15',
      status: 'upcoming',
      frequency: 'Monthly',
    },
    {
      id: '2',
      name: 'TDS Payment',
      dueDate: 'Aug 17',
      status: 'upcoming',
      frequency: 'Monthly',
    },
    {
      id: '3',
      name: 'PF Contribution',
      dueDate: 'Aug 20',
      status: 'upcoming',
      frequency: 'Monthly',
    },
    {
      id: '4',
      name: 'Board Meeting',
      dueDate: 'Aug 22',
      status: 'upcoming',
      frequency: 'Quarterly',
    },
  ]

  const activityFeed: ActivityEvent[] = [
    {
      id: '1',
      action: 'Contract uploaded',
      actor: 'You',
      timestamp: '2 hours ago',
      icon: FileText,
    },
    {
      id: '2',
      action: 'Agreement revised',
      actor: 'Legal Professional',
      timestamp: '4 hours ago',
      icon: FileText,
    },
    {
      id: '3',
      action: 'Matter assigned',
      actor: 'NyayMitra',
      timestamp: '1 day ago',
      icon: Briefcase,
    },
  ]

  const monthlyOperations: MonthlyOperations = {
    requestsReceived: 18,
    requestsCompleted: 13,
    contractsReviewed: 7,
    contractsDrafted: 4,
    pendingActions: 3,
  }

  // Handlers (placeholder for now)
  const handleNewRequest = () => {
    console.log('New Legal Request clicked')
    // TODO: Open modal or navigate to request form
  }

  const handleUploadDocument = () => {
    console.log('Upload Document clicked')
    // TODO: Open upload dialog
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-950">
      <DashboardHeader
        greeting={greeting}
        firstName={firstName}
        companyName={companyName}
        onNewRequest={handleNewRequest}
        onUploadDocument={handleUploadDocument}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-12">
          {/* NEEDS YOUR ATTENTION */}
          <AttentionPanel items={attentionItems} />

          {/* OVERVIEW METRICS */}
          <OverviewMetrics
            activeMatters={12}
            contracts={47}
            pendingActions={5}
            complianceDue={3}
          />

          {/* WORK IN PROGRESS + LEGAL HEALTH */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <WorkInProgress matters={matters} />
            </div>
            <div>
              <LegalHealthCard data={legalHealth} />
            </div>
          </motion.div>

          {/* CONTRACTS REQUIRING ATTENTION */}
          <ContractsAttention contracts={contracts} />

          {/* COMPLIANCE + ACTIVITY */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <CompliancePreview items={complianceItems} />
            <RecentActivity events={activityFeed} />
          </motion.div>

          {/* MONTHLY OPERATIONS SUMMARY */}
          <MonthlySummary
            data={monthlyOperations}
            month="August Legal Operations"
          />
        </div>
      </div>
    </div>
  )
}