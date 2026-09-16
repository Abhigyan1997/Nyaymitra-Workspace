'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CloudUpload,
  FileCheck2,
  FileText,
  FolderLock,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react'

/* =========================================================
   CONFIG
========================================================= */

const API_BASE_URL =
  'https://nyaymitra-backend-production.up.railway.app/api/v1'

const DASHBOARD_API = `${API_BASE_URL}/dashboard`

/* =========================================================
   TYPES
========================================================= */

interface User {
  id: string
  fullName: string
  email: string
  role: string
  userId: string
  phone?: string
  profilePhoto?: string
}

interface DashboardBusiness {
  id: string
  companyName: string
  industry?: string
  website?: string
  email?: string
  phone?: string
  registrationStatus?: string
  legalHealthScore?: number
}

interface DashboardAttention {
  id: string
  type: string
  entityId: string
  title: string
  description: string
  action: string
  actionLabel: string
  severity: 'high' | 'medium' | 'low'
  daysUntil?: number
}

interface DashboardContract {
  id: string
  name: string
  status: string
  nextAction?: string
  dueDate?: string
}

interface DashboardCompliance {
  id: string
  name: string
  organization?: string
  category?: string
  dueDate: string
  status: string
  priority?: 'low' | 'medium' | 'high'
  assignedProfessional?: string
}

interface DashboardDocument {
  id: string
  name: string
  category?: string
  uploadedBy?: string
  createdAt: string
}

interface DashboardProfessional {
  id: string
  name: string
  email: string
  role?: string
  memberType?: string
  workspaceRole?: string
}

interface DashboardData {
  business: DashboardBusiness

  overview: {
    contracts: number
    pendingActions: number
    complianceDue: number
    documents: number
    teamMembers: number
  }

  attention: DashboardAttention[]

  contracts: {
    total: number
    awaitingSignature: number
    inReview: number
    approved: number
    executed: number
    items: DashboardContract[]
  }

  compliance: {
    total: number
    pending: number
    inProgress: number
    completed: number
    overdue: number
    items: DashboardCompliance[]
  }

  documents: {
    total: number
    recent: DashboardDocument[]
    expiring: DashboardDocument[]
  }

  team: {
    total: number
    active: number
    pendingInvitations: number
    professionals: DashboardProfessional[]
  }

  legalHealth: {
    score: number
    status: string
    contracts: number
    compliance: number
    documentation: number
    risk: string
    attentionCount: number
  }

  activity: Array<{
    id: string
    action: string
    actor: string
    timestamp: string
  }>

  monthlyOperations: {
    requestsReceived: number
    requestsCompleted: number
    contractsReviewed: number
    contractsDrafted: number
    pendingActions: number
  }

  generatedAt: string
}

interface DashboardResponse {
  success: boolean
  data: DashboardData
  message?: string
}

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (value?: string) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatRelativeDate = (value?: string) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)

  if (days < 7) return `${days}d ago`

  return formatDate(value)
}

const capitalize = (value?: string) => {
  if (!value) return ''

  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const getGreeting = () => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'

  return 'Good night'
}

const getInitials = (name?: string) => {
  if (!name) return 'U'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/* =========================================================
   UI COMPONENTS
========================================================= */

const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={`
      rounded-2xl
      border border-white/[0.07]
      bg-white/[0.025]
      backdrop-blur-xl
      ${className}
    `}
  >
    {children}
  </div>
)

const SectionHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div className="min-w-0">
      {eyebrow && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400 mb-1.5">
          {eyebrow}
        </p>
      )}

      <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
        {title}
      </h2>

      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>

    {action}
  </div>
)

/* =========================================================
   STATUS BADGES
========================================================= */

const ContractStatusBadge = ({ status }: { status: string }) => {
  const normalized = status.toLowerCase()

  let classes =
    'bg-white/[0.05] text-slate-300 border-white/10'

  if (normalized === 'awaiting-signature') {
    classes =
      'bg-red-400/10 text-red-300 border-red-400/20'
  }

  if (normalized === 'in-review') {
    classes =
      'bg-amber-400/10 text-amber-300 border-amber-400/20'
  }

  if (normalized === 'approved') {
    classes =
      'bg-blue-400/10 text-blue-300 border-blue-400/20'
  }

  if (normalized === 'executed') {
    classes =
      'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'
  }

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full border
        px-2.5 py-1
        text-[10px] font-medium
        whitespace-nowrap
        ${classes}
      `}
    >
      {capitalize(status)}
    </span>
  )
}

const ComplianceStatusBadge = ({ status }: { status: string }) => {
  const normalized = status.toLowerCase()

  if (normalized === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </span>
    )
  }

  if (normalized === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[10px] text-red-300">
        <XCircle className="w-3 h-3" />
        Overdue
      </span>
    )
  }

  if (normalized === 'in-progress') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] text-blue-300">
        <Clock3 className="w-3 h-3" />
        In Progress
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] text-amber-300">
      <CalendarDays className="w-3 h-3" />
      Pending
    </span>
  )
}

/* =========================================================
   SKELETON
========================================================= */

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#070707] text-white">
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-32 rounded-2xl bg-white/[0.04]" />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-32 rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-white/[0.04]" />
          <div className="h-80 rounded-2xl bg-white/[0.04]" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="h-80 rounded-2xl bg-white/[0.04]" />
          <div className="h-80 rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  </div>
)

/* =========================================================
   ERROR STATE
========================================================= */

const ErrorState = ({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) => (
  <div className="min-h-screen bg-[#070707] flex items-center justify-center px-6">
    <div className="w-full max-w-md text-center">
      <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>

      <h1 className="text-xl font-semibold text-white mb-2">
        Unable to load dashboard
      </h1>

      <p className="text-sm text-slate-500 leading-6 mb-6">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black text-sm font-semibold hover:bg-amber-300 transition"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  </div>
)

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  label,
  value,
  icon: Icon,
  description,
  accent = 'amber',
  onClick,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  description: string
  accent?: 'amber' | 'blue' | 'emerald' | 'red' | 'violet'
  onClick?: () => void
}) => {
  const accentMap = {
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/10',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/10',
    emerald:
      'text-emerald-400 bg-emerald-400/10 border-emerald-400/10',
    red: 'text-red-400 bg-red-400/10 border-red-400/10',
    violet:
      'text-violet-400 bg-violet-400/10 border-violet-400/10',
  }

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="text-left w-full"
    >
      <Card className="p-4 sm:p-5 h-full hover:border-white/[0.13] hover:bg-white/[0.04] transition-all">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${accentMap[accent]}`}
          >
            <Icon className="w-4 h-4" />
          </div>

          <ArrowUpRight className="w-4 h-4 text-slate-700" />
        </div>

        <div className="mt-5">
          <p className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            {value}
          </p>

          <p className="text-sm text-slate-300 mt-1">
            {label}
          </p>

          <p className="text-[11px] text-slate-600 mt-1.5">
            {description}
          </p>
        </div>
      </Card>
    </motion.button>
  )
}

/* =========================================================
   ATTENTION PANEL
========================================================= */

const AttentionPanel = ({
  items,
  onNavigate,
}: {
  items: DashboardAttention[]
  onNavigate: (item: DashboardAttention) => void
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 sm:px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-400">
              Priority
            </p>

            <h2 className="text-lg font-semibold text-white mt-1">
              Needs your attention
            </h2>
          </div>

          {items.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-[10px] font-medium text-red-300">
              {items.length} open
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <div className="w-11 h-11 mx-auto rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>

          <p className="text-sm font-medium text-white">
            Everything looks good
          </p>

          <p className="text-xs text-slate-600 mt-1">
            No immediate legal actions require your attention.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {items.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigate(item)}
              className="w-full text-left px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-white/[0.025] transition"
            >
              <div
                className={`
                  w-9 h-9 rounded-xl flex-shrink-0
                  flex items-center justify-center
                  ${item.severity === 'high'
                    ? 'bg-red-400/10 text-red-400'
                    : item.severity === 'medium'
                      ? 'bg-amber-400/10 text-amber-400'
                      : 'bg-blue-400/10 text-blue-400'
                  }
                `}
              >
                <AlertCircle className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {item.title}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {item.daysUntil !== undefined && (
                  <span
                    className={`
                      hidden sm:block text-[10px] font-medium
                      ${item.daysUntil < 0
                        ? 'text-red-400'
                        : item.daysUntil <= 3
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }
                    `}
                  >
                    {item.daysUntil < 0
                      ? `${Math.abs(item.daysUntil)}d overdue`
                      : item.daysUntil === 0
                        ? 'Due today'
                        : `${item.daysUntil}d left`}
                  </span>
                )}

                <ChevronRight className="w-4 h-4 text-slate-700" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </Card>
  )
}

/* =========================================================
   LEGAL HEALTH
========================================================= */

const LegalHealthCard = ({
  data,
}: {
  data: DashboardData['legalHealth']
}) => {
  const score = Math.max(0, Math.min(100, data.score || 0))

  const circumference = 2 * Math.PI * 46
  const offset = circumference * (1 - score / 100)

  const scoreLabel =
    score >= 80
      ? 'Healthy'
      : score >= 60
        ? 'Good'
        : score >= 40
          ? 'Needs attention'
          : 'At risk'

  return (
    <Card className="p-5 sm:p-6 h-full">
      <SectionHeader
        eyebrow="Risk overview"
        title="Legal health"
        description="Current legal operations posture"
      />

      <div className="flex items-center gap-6 mb-7">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full -rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-white/[0.06]"
            />

            <motion.circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{
                duration: 1,
                ease: 'easeOut',
              }}
              className={
                score >= 70
                  ? 'text-emerald-400'
                  : score >= 40
                    ? 'text-amber-400'
                    : 'text-red-400'
              }
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-white">
              {score}
            </span>

            <span className="text-[9px] text-slate-600 uppercase tracking-wider">
              /100
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">
            {scoreLabel}
          </p>

          <p className="text-xs text-slate-500 mt-1 leading-5">
            Based on contracts, compliance and documentation.
          </p>

          {data.attentionCount > 0 && (
            <p className="text-xs text-amber-400 mt-3">
              {data.attentionCount} area
              {data.attentionCount !== 1 ? 's' : ''} needs attention
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <HealthBar
          label="Contracts"
          value={data.contracts}
        />

        <HealthBar
          label="Compliance"
          value={data.compliance}
        />

        <HealthBar
          label="Documentation"
          value={data.documentation}
        />
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Risk level
          </p>

          <p className="text-sm font-medium text-white mt-1 capitalize">
            {data.risk || 'Unknown'}
          </p>
        </div>

        <ShieldCheck
          className={`w-5 h-5 ${data.risk === 'high'
            ? 'text-red-400'
            : data.risk === 'medium'
              ? 'text-amber-400'
              : 'text-emerald-400'
            }`}
        />
      </div>
    </Card>
  )
}

const HealthBar = ({
  label,
  value,
}: {
  label: string
  value: number
}) => {
  const safeValue = Math.max(0, Math.min(100, value || 0))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">
          {label}
        </span>

        <span className="text-xs font-medium text-white">
          {safeValue}%
        </span>
      </div>

      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full rounded-full ${safeValue >= 80
            ? 'bg-emerald-400'
            : safeValue >= 50
              ? 'bg-amber-400'
              : 'bg-red-400'
            }`}
        />
      </div>
    </div>
  )
}

/* =========================================================
   CONTRACTS
========================================================= */

const ContractsCard = ({
  data,
  onViewAll,
}: {
  data: DashboardData['contracts']
  onViewAll: () => void
}) => (
  <Card className="overflow-hidden">
    <div className="p-5 sm:p-6">
      <SectionHeader
        eyebrow="Contract lifecycle"
        title="Contracts"
        description={`${data.total} contracts in your workspace`}
        action={
          <button
            onClick={onViewAll}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <MiniMetric
          label="Awaiting signature"
          value={data.awaitingSignature}
          color="red"
        />

        <MiniMetric
          label="In review"
          value={data.inReview}
          color="amber"
        />

        <MiniMetric
          label="Approved"
          value={data.approved}
          color="blue"
        />

        <MiniMetric
          label="Executed"
          value={data.executed}
          color="emerald"
        />
      </div>
    </div>

    {data.items.length === 0 ? (
      <EmptyState
        icon={FileText}
        title="No contracts requiring attention"
        description="Your contract workspace is currently clear."
      />
    ) : (
      <div className="border-t border-white/[0.06] divide-y divide-white/[0.05]">
        {data.items.slice(0, 5).map((contract) => (
          <div
            key={contract.id}
            className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {contract.name}
              </p>

              <p className="text-[11px] text-slate-600 mt-1">
                {contract.nextAction || 'Contract activity'}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <ContractStatusBadge
                status={contract.status}
              />

              {contract.dueDate && (
                <p className="text-[10px] text-slate-600 mt-1.5">
                  Due {formatDate(contract.dueDate)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
)

/* =========================================================
   COMPLIANCE
========================================================= */

const ComplianceCard = ({
  data,
  onViewAll,
}: {
  data: DashboardData['compliance']
  onViewAll: () => void
}) => (
  <Card className="overflow-hidden">
    <div className="p-5 sm:p-6">
      <SectionHeader
        eyebrow="Compliance"
        title="Compliance calendar"
        description={`${data.total} obligations tracked`}
        action={
          <button
            onClick={onViewAll}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-2 mb-6">
        <MiniMetric
          label="Pending"
          value={data.pending}
          color="amber"
        />

        <MiniMetric
          label="Completed"
          value={data.completed}
          color="emerald"
        />

        <MiniMetric
          label="Overdue"
          value={data.overdue}
          color="red"
        />
      </div>
    </div>

    {data.items.length === 0 ? (
      <EmptyState
        icon={ShieldCheck}
        title="No compliance items"
        description="There are no compliance obligations to display."
      />
    ) : (
      <div className="border-t border-white/[0.06] divide-y divide-white/[0.05]">
        {data.items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="px-5 sm:px-6 py-4 flex items-center gap-4"
          >
            <div
              className={`
                w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                ${item.status === 'overdue'
                  ? 'bg-red-400/10 text-red-400'
                  : item.status === 'completed'
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-amber-400/10 text-amber-400'
                }
              `}
            >
              <CalendarDays className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {item.name}
              </p>

              <p className="text-[11px] text-slate-600 mt-1 capitalize">
                {item.category || 'Compliance'}
                {item.assignedProfessional
                  ? ` · ${item.assignedProfessional}`
                  : ''}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <ComplianceStatusBadge
                status={item.status}
              />

              <p className="text-[10px] text-slate-600 mt-1.5">
                {formatDate(item.dueDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
)

/* =========================================================
   DOCUMENTS
========================================================= */

const DocumentsCard = ({
  data,
  onViewAll,
}: {
  data: DashboardData['documents']
  onViewAll: () => void
}) => (
  <Card className="p-5 sm:p-6">
    <SectionHeader
      eyebrow="Secure vault"
      title="Recent documents"
      description={`${data.total} documents stored securely`}
      action={
        <button
          onClick={onViewAll}
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
          Vault
          <ArrowRight className="w-3 h-3" />
        </button>
      }
    />

    <div className="space-y-2">
      {data.recent.length === 0 ? (
        <EmptyState
          icon={FolderLock}
          title="Your vault is empty"
          description="Upload your first business document."
        />
      ) : (
        data.recent.slice(0, 5).map((document) => (
          <div
            key={document.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.035] transition"
          >
            <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-white truncate">
                {document.name}
              </p>

              <p className="text-[10px] text-slate-600 mt-1">
                {capitalize(document.category) || 'Document'}
                {' · '}
                {document.uploadedBy || 'Unknown'}
              </p>
            </div>

            <span className="text-[10px] text-slate-600 flex-shrink-0">
              {formatRelativeDate(document.createdAt)}
            </span>
          </div>
        ))
      )}
    </div>

    {data.recent.length > 0 && (
      <button
        onClick={onViewAll}
        className="mt-5 w-full py-2.5 rounded-xl border border-white/[0.07] text-xs text-slate-400 hover:text-white hover:bg-white/[0.03] transition"
      >
        Open document vault
      </button>
    )}
  </Card>
)

/* =========================================================
   TEAM
========================================================= */

const TeamCard = ({
  data,
  onViewAll,
}: {
  data: DashboardData['team']
  onViewAll: () => void
}) => (
  <Card className="p-5 sm:p-6">
    <SectionHeader
      eyebrow="Workspace"
      title="Legal team"
      description={`${data.active} active member${data.active !== 1 ? 's' : ''}`}
      action={
        <button
          onClick={onViewAll}
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
          Manage
          <ArrowRight className="w-3 h-3" />
        </button>
      }
    />

    <div className="flex items-center justify-between mb-5">
      <div className="flex -space-x-2">
        {data.professionals.slice(0, 5).map((member) => (
          <div
            key={member.id}
            title={member.name}
            className="w-9 h-9 rounded-full bg-slate-800 border-2 border-[#0b0b0b] flex items-center justify-center text-[10px] font-semibold text-white"
          >
            {getInitials(member.name)}
          </div>
        ))}

        {data.total > 5 && (
          <div className="w-9 h-9 rounded-full bg-white/[0.05] border-2 border-[#0b0b0b] flex items-center justify-center text-[10px] text-slate-400">
            +{data.total - 5}
          </div>
        )}
      </div>

      <div className="text-right">
        <p className="text-xl font-semibold text-white">
          {data.total}
        </p>

        <p className="text-[10px] uppercase tracking-wider text-slate-600">
          Members
        </p>
      </div>
    </div>

    {data.professionals.length === 0 ? (
      <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center">
        <Users className="w-5 h-5 mx-auto text-slate-600 mb-2" />

        <p className="text-xs text-slate-500">
          No professionals added yet.
        </p>
      </div>
    ) : (
      <div className="space-y-2">
        {data.professionals.slice(0, 3).map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.025]"
          >
            <div className="w-8 h-8 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center text-[10px] font-semibold">
              {getInitials(member.name)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {member.name}
              </p>

              <p className="text-[10px] text-slate-600 truncate">
                {member.memberType || 'Team member'}
              </p>
            </div>

            <span className="text-[10px] text-slate-500 capitalize">
              {member.workspaceRole || 'member'}
            </span>
          </div>
        ))}
      </div>
    )}

    {data.pendingInvitations > 0 && (
      <div className="mt-4 rounded-xl bg-amber-400/[0.06] border border-amber-400/10 px-3.5 py-3 flex items-center gap-3">
        <Clock3 className="w-4 h-4 text-amber-400" />

        <p className="text-xs text-amber-200 flex-1">
          {data.pendingInvitations} invitation
          {data.pendingInvitations !== 1 ? 's' : ''} pending
        </p>

        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
      </div>
    )}
  </Card>
)

/* =========================================================
   MONTHLY OPERATIONS
========================================================= */

const OperationsCard = ({
  data,
}: {
  data: DashboardData['monthlyOperations']
}) => {
  const completedRate =
    data.requestsReceived > 0
      ? Math.round(
        (data.requestsCompleted /
          data.requestsReceived) *
        100
      )
      : 0

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeader
        eyebrow="Operations"
        title="Monthly legal operations"
        description="Current month activity"
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <OperationMetric
          label="Requests"
          value={data.requestsReceived}
        />

        <OperationMetric
          label="Completed"
          value={data.requestsCompleted}
          accent="emerald"
        />

        <OperationMetric
          label="Reviewed"
          value={data.contractsReviewed}
        />

        <OperationMetric
          label="Drafted"
          value={data.contractsDrafted}
        />

        <OperationMetric
          label="Pending"
          value={data.pendingActions}
          accent="amber"
        />
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-600">
            Request completion
          </span>

          <span className="text-xs text-white font-medium">
            {completedRate}%
          </span>
        </div>

        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${completedRate}%`,
            }}
            transition={{ duration: 0.8 }}
            className="h-full bg-emerald-400 rounded-full"
          />
        </div>
      </div>
    </Card>
  )
}

const OperationMetric = ({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'emerald' | 'amber'
}) => (
  <div className="rounded-xl bg-white/[0.025] border border-white/[0.05] p-3.5">
    <p
      className={`text-xl font-semibold ${accent === 'emerald'
        ? 'text-emerald-400'
        : accent === 'amber'
          ? 'text-amber-400'
          : 'text-white'
        }`}
    >
      {value}
    </p>

    <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-1">
      {label}
    </p>
  </div>
)

/* =========================================================
   MINI METRIC
========================================================= */

const MiniMetric = ({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'red' | 'amber' | 'blue' | 'emerald'
}) => {
  const colors = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
  }

  return (
    <div className="rounded-xl bg-white/[0.025] border border-white/[0.05] p-3">
      <p
        className={`text-lg font-semibold ${colors[color]}`}
      >
        {value}
      </p>

      <p className="text-[9px] leading-3 text-slate-600 mt-1">
        {label}
      </p>
    </div>
  )
}

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) => (
  <div className="py-8 px-5 text-center border-t border-white/[0.06]">
    <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
      <Icon className="w-4 h-4 text-slate-600" />
    </div>

    <p className="text-xs font-medium text-slate-400">
      {title}
    </p>

    <p className="text-[10px] text-slate-700 mt-1">
      {description}
    </p>
  </div>
)

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] =
    useState(false)

  /* =======================================================
     FETCH DASHBOARD
  ======================================================= */

  const fetchDashboard = useCallback(
    async (showRefresh = false) => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        setIsAuthenticated(false)
        router.push('/login')
        return
      }

      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        setError(null)

        const parsedUser: User = JSON.parse(
          storedUser
        )

        setUser(parsedUser)
        setIsAuthenticated(true)

        const response = await fetch(DASHBOARD_API, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        const result: DashboardResponse =
          await response.json()

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
            'Failed to load dashboard'
          )
        }

        setDashboard(result.data)
      } catch (err) {
        console.error(
          'Dashboard fetch error:',
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading the dashboard.'
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [router]
  )

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigateTo = useCallback(
    (path: string) => {
      router.push(path)
    },
    [router]
  )

  const handleAttentionNavigation = (
    item: DashboardAttention
  ) => {
    if (item.type === 'compliance') {
      navigateTo('/business/compliance')
      return
    }

    if (item.type === 'contract') {
      navigateTo('/business/contracts')
      return
    }

    if (item.type === 'document') {
      navigateTo('/business/documents')
      return
    }

    navigateTo('/business')
  }

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const firstName = useMemo(() => {
    return (
      user?.fullName?.split(' ')[0] ||
      'there'
    )
  }, [user])

  const greeting = useMemo(
    () => getGreeting(),
    []
  )

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return <DashboardSkeleton />
  }

  /* =======================================================
     AUTH
  ======================================================= */

  if (!isAuthenticated) {
    return null
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !dashboard) {
    return (
      <ErrorState
        message={
          error ||
          'Dashboard data is currently unavailable.'
        }
        onRetry={() => fetchDashboard()}
      />
    )
  }

  const {
    business,
    overview,
    attention,
    contracts,
    compliance,
    documents,
    team,
    legalHealth,
    monthlyOperations,
  } = dashboard

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-400/[0.035] blur-[140px] rounded-full" />
      </div>

      <main className="relative max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-amber-400" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">
                    Legal Operations Workspace
                  </p>

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>

                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mt-0.5">
                  {business.companyName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  fetchDashboard(true)
                }
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] text-xs text-slate-400 hover:text-white hover:bg-white/[0.05] transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing
                    ? 'animate-spin'
                    : ''
                    }`}
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>

              <button
                onClick={() =>
                  navigateTo(
                    '/business/documents'
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-semibold hover:bg-amber-300 transition shadow-lg shadow-amber-400/10"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                Upload document
              </button>
            </div>
          </div>
        </motion.header>

        {/* =================================================
            WELCOME STRIP
        ================================================= */}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <Card className="p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-amber-400/[0.035] blur-3xl rounded-full" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-sm font-medium text-amber-400">
                  {greeting}, {firstName}
                </p>

                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
                  Your legal workspace at a glance.
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl">
                  Monitor contracts, compliance,
                  documents and your legal operations
                  from one workspace.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  {business.registrationStatus ||
                    'Workspace active'}
                </span>

                {business.industry && (
                  <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] text-slate-500">
                    {business.industry}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </motion.section>

        {/* =================================================
            OVERVIEW METRICS
        ================================================= */}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6"
        >
          <StatCard
            label="Contracts"
            value={overview.contracts}
            description="Across your workspace"
            icon={FileText}
            accent="blue"
            onClick={() =>
              navigateTo('/business/contracts')
            }
          />

          <StatCard
            label="Pending actions"
            value={overview.pendingActions}
            description="Items requiring action"
            icon={Clock3}
            accent="amber"
            onClick={() =>
              document
                .getElementById('attention')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          />

          <StatCard
            label="Compliance due"
            value={overview.complianceDue}
            description="Upcoming obligations"
            icon={CalendarDays}
            accent="red"
            onClick={() =>
              navigateTo('/business/compliance')
            }
          />

          <StatCard
            label="Documents"
            value={overview.documents}
            description="Stored in your vault"
            icon={FolderLock}
            accent="violet"
            onClick={() =>
              navigateTo('/business/documents')
            }
          />

          <StatCard
            label="Team members"
            value={overview.teamMembers}
            description="Workspace members"
            icon={Users}
            accent="emerald"
            onClick={() =>
              navigateTo('/business/team')
            }
          />
        </motion.section>

        {/* =================================================
            ATTENTION
        ================================================= */}

        <motion.section
          id="attention"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <AttentionPanel
            items={attention}
            onNavigate={
              handleAttentionNavigation
            }
          />
        </motion.section>

        {/* =================================================
            CONTRACTS + LEGAL HEALTH
        ================================================= */}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid lg:grid-cols-3 gap-5 mb-6"
        >
          <div className="lg:col-span-2">
            <ContractsCard
              data={contracts}
              onViewAll={() =>
                navigateTo(
                  '/business/contracts'
                )
              }
            />
          </div>

          <LegalHealthCard data={legalHealth} />
        </motion.section>

        {/* =================================================
            COMPLIANCE + DOCUMENTS
        ================================================= */}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid lg:grid-cols-2 gap-5 mb-6"
        >
          <ComplianceCard
            data={compliance}
            onViewAll={() =>
              navigateTo(
                '/business/compliance'
              )
            }
          />

          <DocumentsCard
            data={documents}
            onViewAll={() =>
              navigateTo(
                '/business/documents'
              )
            }
          />
        </motion.section>

        {/* =================================================
            TEAM + OPERATIONS
        ================================================= */}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid lg:grid-cols-3 gap-5 mb-6"
        >
          <TeamCard
            data={team}
            onViewAll={() =>
              navigateTo('/business/team')
            }
          />

          <div className="lg:col-span-2">
            <OperationsCard
              data={monthlyOperations}
            />
          </div>
        </motion.section>

        {/* =================================================
            FOOTER INFO
        ================================================= */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 pb-6">
          <p className="text-[10px] text-slate-700">
            NyayMitra Legal Operations
          </p>

          <p className="text-[10px] text-slate-700">
            Last updated{' '}
            {formatRelativeDate(
              dashboard.generatedAt
            )}
          </p>
        </div>
      </main>
    </div>
  )
}