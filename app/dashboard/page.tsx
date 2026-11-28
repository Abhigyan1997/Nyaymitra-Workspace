'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CloudUpload,
  FileCheck2,
  FileText,
  FolderLock,
  RefreshCw,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { premiumToast } from '@/lib/premium-toast'

import api, { AuthError } from '@/lib/services/api'
import { LOGIN_PATH } from '@/lib/auth'

/* =========================================================
   CONFIG
========================================================= */

// const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_URL ||
//   'https://nyaymitra-backend-production.up.railway.app/api/v1'

// const DASHBOARD_API = `${API_BASE_URL}/dashboard`

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
  legalName?: string
  companyType?: string
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
  dueDate?: string
  status?: string
  priority?: string
  requestNumber?: string
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

interface DashboardLegalRequest {
  id: string
  title: string
  category?: string
  status: string
  priority?: string
  createdAt?: string
  updatedAt?: string
  assignedTo?: string
  createdBy?: string
}

interface DashboardContractRequest {
  id: string
  requestNumber?: string
  title: string
  contractType?: string
  status: string
  priority?: string
  expectedDeliveryDate?: string
  createdAt?: string
  updatedAt?: string
  assignedProfessional?: string
  requestedBy?: string
}

interface DashboardActivity {
  id: string
  action: string
  actor: string
  timestamp: string
}

interface DashboardData {
  business: DashboardBusiness
  overview: {
    legalRequests: number
    contractRequests: number
    totalLegalRequests: number
    totalContractRequests: number
    completedLegalRequests: number
    completedContractRequests: number
    contracts: number
    pendingActions: number
    complianceDue: number
    documents: number
    teamMembers: number
  }
  attention: DashboardAttention[]
  legalRequests: {
    total: number
    active: number
    pending: number
    completed: number
    monthly: number
    items: DashboardLegalRequest[]
  }
  contractRequests: {
    total: number
    active: number
    pending: number
    completed: number
    monthly: number
    items: DashboardContractRequest[]
  }
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
    businessScore?: number | null
    status: string
    contracts: number
    compliance: number
    documentation: number
    risk: string
    attentionCount: number
  }
  activity: DashboardActivity[]
  monthlyOperations: {
    requestsReceived: number
    legalRequestsReceived?: number
    contractRequestsReceived?: number
    requestsCompleted: number
    legalRequestsCompleted?: number
    contractRequestsCompleted?: number
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
   NORMALIZER
========================================================= */

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : []

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && !Number.isNaN(value) ? value : fallback

const normalizeDashboard = (
  raw: Partial<DashboardData> | Record<string, any> | null | undefined
): DashboardData => {
  const d = (raw || {}) as Record<string, any>

  const business = (d.business || {}) as DashboardBusiness
  const overview = (d.overview || {}) as Record<string, any>
  const legalRequests = (d.legalRequests || {}) as Record<string, any>
  const contractRequests = (d.contractRequests || {}) as Record<string, any>
  const contracts = (d.contracts || {}) as Record<string, any>
  const compliance = (d.compliance || {}) as Record<string, any>
  const documents = (d.documents || {}) as Record<string, any>
  const team = (d.team || {}) as Record<string, any>
  const legalHealth = (d.legalHealth || {}) as Record<string, any>
  const monthlyOperations = (d.monthlyOperations || {}) as Record<string, any>

  return {
    business: {
      id: business.id || '',
      companyName: business.companyName || 'Your Workspace',
      legalName: business.legalName,
      companyType: business.companyType,
      industry: business.industry,
      website: business.website,
      email: business.email,
      phone: business.phone,
      registrationStatus: business.registrationStatus,
      legalHealthScore: business.legalHealthScore,
    },
    overview: {
      legalRequests: num(overview.legalRequests),
      contractRequests: num(overview.contractRequests),
      totalLegalRequests: num(overview.totalLegalRequests),
      totalContractRequests: num(overview.totalContractRequests),
      completedLegalRequests: num(overview.completedLegalRequests),
      completedContractRequests: num(overview.completedContractRequests),
      contracts: num(overview.contracts),
      pendingActions: num(overview.pendingActions),
      complianceDue: num(overview.complianceDue),
      documents: num(overview.documents),
      teamMembers: num(overview.teamMembers),
    },
    attention: asArray<DashboardAttention>(d.attention),
    legalRequests: {
      total: num(legalRequests.total),
      active: num(legalRequests.active),
      pending: num(legalRequests.pending),
      completed: num(legalRequests.completed),
      monthly: num(legalRequests.monthly),
      items: asArray<DashboardLegalRequest>(legalRequests.items),
    },
    contractRequests: {
      total: num(contractRequests.total),
      active: num(contractRequests.active),
      pending: num(contractRequests.pending),
      completed: num(contractRequests.completed),
      monthly: num(contractRequests.monthly),
      items: asArray<DashboardContractRequest>(contractRequests.items),
    },
    contracts: {
      total: num(contracts.total),
      awaitingSignature: num(contracts.awaitingSignature),
      inReview: num(contracts.inReview),
      approved: num(contracts.approved),
      executed: num(contracts.executed),
      items: asArray<DashboardContract>(contracts.items),
    },
    compliance: {
      total: num(compliance.total),
      pending: num(compliance.pending),
      inProgress: num(compliance.inProgress),
      completed: num(compliance.completed),
      overdue: num(compliance.overdue),
      items: asArray<DashboardCompliance>(compliance.items),
    },
    documents: {
      total: num(documents.total),
      recent: asArray<DashboardDocument>(documents.recent),
      expiring: asArray<DashboardDocument>(documents.expiring),
    },
    team: {
      total: num(team.total),
      active: num(team.active),
      pendingInvitations: num(team.pendingInvitations),
      professionals: asArray<DashboardProfessional>(team.professionals),
    },
    legalHealth: {
      score: num(legalHealth.score),
      businessScore: legalHealth.businessScore ?? null,
      status: legalHealth.status || 'unknown',
      contracts: num(legalHealth.contracts),
      compliance: num(legalHealth.compliance),
      documentation: num(legalHealth.documentation),
      risk: legalHealth.risk || 'low',
      attentionCount: num(
        legalHealth.attentionCount,
        asArray<DashboardAttention>(d.attention).length
      ),
    },
    activity: asArray<DashboardActivity>(d.activity),
    monthlyOperations: {
      requestsReceived: num(monthlyOperations.requestsReceived),
      legalRequestsReceived: monthlyOperations.legalRequestsReceived,
      contractRequestsReceived: monthlyOperations.contractRequestsReceived,
      requestsCompleted: num(monthlyOperations.requestsCompleted),
      legalRequestsCompleted: monthlyOperations.legalRequestsCompleted,
      contractRequestsCompleted: monthlyOperations.contractRequestsCompleted,
      contractsReviewed: num(monthlyOperations.contractsReviewed),
      contractsDrafted: num(monthlyOperations.contractsDrafted),
      pendingActions: num(monthlyOperations.pendingActions),
    },
    generatedAt: d.generatedAt || new Date().toISOString(),
  }
}

/* =========================================================
   HELPERS
========================================================= */

const DAY = 86_400_000

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
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
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
    .split(/[-\s]/)
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

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n))

type Tone = 'red' | 'amber' | 'blue' | 'emerald' | 'violet' | 'slate'

const toneText: Record<Tone, string> = {
  red: 'text-red-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
  slate: 'text-slate-400',
}

const toneBg: Record<Tone, string> = {
  red: 'bg-red-400',
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
  violet: 'bg-violet-400',
  slate: 'bg-slate-500',
}

const tonePill: Record<Tone, string> = {
  red: 'bg-red-400/10 text-red-300 border-red-400/20',
  amber: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  blue: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  emerald: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  violet: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
  slate: 'bg-white/[0.05] text-slate-300 border-white/10',
}

const statusTone = (status: string): Tone => {
  const s = (status || '').toLowerCase().replace(/\s+/g, '-')
  if (['completed', 'converted', 'executed', 'active'].includes(s)) return 'emerald'
  if (['overdue', 'awaiting-signature', 'pending-signature'].includes(s)) return 'red'
  if (['assigned', 'in-progress', 'under-review', 'approved'].includes(s)) return 'blue'
  if (
    [
      'submitted',
      'pending',
      'in-review',
      'internal-review',
      'client-review',
    ].includes(s)
  )
    return 'amber'
  return 'slate'
}

/* =========================================================
   MOTION HOOKS
========================================================= */

const useCountUp = (target: number, duration = 1100) => {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? target : 0)

  useEffect(() => {
    if (reduce) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduce])

  return value
}

const CountUp = ({ value, duration }: { value: number; duration?: number }) => {
  const v = useCountUp(value, duration)
  return <span className="tabular-nums">{v}</span>
}

/* =========================================================
   PRIMITIVES
========================================================= */

const Panel = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={`rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-xl ${className}`}
  >
    {children}
  </div>
)

const PanelTitle = ({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
}) => (
  <div className="flex items-start justify-between gap-4 mb-4">
    <div className="min-w-0">
      <h2 className="text-base font-semibold text-white tracking-tight">{title}</h2>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
    {action}
  </div>
)

const LinkButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="group inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded"
  >
    {children}
    <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  </button>
)

const StatusPill = ({ status }: { status: string }) => {
  const tone = statusTone(status)
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${tonePill[tone]}`}
    >
      {capitalize(status) || 'Unknown'}
    </span>
  )
}

const EmptyNote = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) => (
  <div className="py-10 px-5 text-center">
    <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
      <Icon className="w-4 h-4 text-slate-600" />
    </div>
    <p className="text-sm font-medium text-slate-300">{title}</p>
    <p className="text-xs text-slate-600 mt-1">{description}</p>
  </div>
)

/* =========================================================
   SKELETON + ERROR
========================================================= */

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#070707] text-white">
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-5">
        <div className="h-72 rounded-3xl bg-white/[0.04]" />
        <div className="h-40 rounded-3xl bg-white/[0.04]" />
        <div className="h-24 rounded-3xl bg-white/[0.04]" />
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-white/[0.04]" />
          <div className="h-96 rounded-3xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  </div>
)

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
        Dashboard didn’t load
      </h1>
      <p className="text-sm text-slate-500 leading-6 mb-6">{message}</p>
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
   AMBIENT BACKGROUND
========================================================= */

const Ambient = () => {
  const reduce = useReducedMotion()
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 70% 55% at 50% 0%, black, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 55% at 50% 0%, black, transparent 75%)',
        }}
      />
      <motion.div
        className="absolute -top-72 left-[18%] w-[620px] h-[460px] rounded-full bg-amber-400/[0.05] blur-[140px]"
        animate={reduce ? undefined : { x: [0, 80, -40, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-40 right-[-160px] w-[480px] h-[480px] rounded-full bg-violet-500/[0.04] blur-[140px]"
        animate={reduce ? undefined : { x: [0, -60, 30, 0], y: [0, 50, -30, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* =========================================================
   HEALTH RINGS (signature element)
========================================================= */

const RING_DEFS = [
  { key: 'contracts', label: 'Contracts', r: 100, tone: 'amber' as Tone },
  { key: 'compliance', label: 'Compliance', r: 78, tone: 'blue' as Tone },
  { key: 'documentation', label: 'Documents', r: 56, tone: 'emerald' as Tone },
]

const ringStroke: Record<string, string> = {
  contracts: '#fbbf24',
  compliance: '#60a5fa',
  documentation: '#34d399',
}

const HealthRings = ({
  health,
  score,
}: {
  health: DashboardData['legalHealth']
  score: number
}) => {
  const reduce = useReducedMotion()
  const animatedScore = useCountUp(score, 1400)
  const label =
    score >= 80 ? 'Healthy' : score >= 60 ? 'Good' : score >= 40 ? 'Needs attention' : 'At risk'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex-shrink-0">
        <svg viewBox="0 0 240 240" className="w-full h-full">
          {/* slow rotating outer tick ring */}
          <motion.circle
            cx="120"
            cy="120"
            r="116"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
            strokeDasharray="2 7"
            style={{ transformOrigin: '120px 120px' }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />
          <g transform="rotate(-90 120 120)">
            {RING_DEFS.map((ring, i) => {
              const value = clamp(
                (health as unknown as Record<string, number>)[ring.key] || 0
              )
              const c = 2 * Math.PI * ring.r
              return (
                <g key={ring.key}>
                  <circle
                    cx="120"
                    cy="120"
                    r={ring.r}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="11"
                  />
                  <motion.circle
                    cx="120"
                    cy="120"
                    r={ring.r}
                    fill="none"
                    stroke={ringStroke[ring.key]}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: c * (1 - value / 100) }}
                    transition={{
                      duration: reduce ? 0 : 1.5,
                      delay: reduce ? 0 : 0.25 + i * 0.18,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ filter: `drop-shadow(0 0 6px ${ringStroke[ring.key]}55)` }}
                  />
                </g>
              )
            })}
          </g>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-semibold text-white tracking-tighter tabular-nums">
            {animatedScore}
          </span>
          <span className="text-xs text-slate-500 mt-0.5">{label}</span>
        </div>

        {/* soft pulse behind score */}
        {!reduce && (
          <motion.span
            className="absolute inset-[26%] rounded-full border border-amber-400/20"
            animate={{ scale: [1, 1.18], opacity: [0.5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </div>

      <div className="w-full sm:w-44 space-y-3">
        {RING_DEFS.map((ring) => {
          const value = clamp(
            (health as unknown as Record<string, number>)[ring.key] || 0
          )
          return (
            <div key={ring.key} className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: ringStroke[ring.key] }}
              />
              <span className="text-xs text-slate-400 flex-1">{ring.label}</span>
              <span className="text-sm font-medium text-white tabular-nums">
                <CountUp value={value} />%
              </span>
            </div>
          )
        })}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-slate-500">Risk level</span>
          <span
            className={`text-xs font-medium capitalize ${health.risk === 'high'
              ? 'text-red-400'
              : health.risk === 'medium'
                ? 'text-amber-400'
                : 'text-emerald-400'
              }`}
          >
            {health.risk || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   HERO
========================================================= */

const Hero = ({
  firstName,
  dashboard,
  score,
  onNavigate,
}: {
  firstName: string
  dashboard: DashboardData
  score: number
  onNavigate: (path: string) => void
}) => {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { business, attention, compliance } = dashboard

  const urgent = attention.length
  const headline =
    urgent > 0
      ? `${urgent} ${urgent === 1 ? 'thing needs' : 'things need'} you today.`
      : compliance.overdue > 0
        ? `${compliance.overdue} overdue ${compliance.overdue === 1 ? 'filing' : 'filings'} to clear.`
        : 'You’re clear. Nothing urgent.'

  const words = headline.split(' ')

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <Panel className="relative overflow-hidden">
      <div
        ref={ref}
        onMouseMove={onMove}
        className="relative p-6 sm:p-8 lg:p-10"
        style={
          {
            '--mx': '70%',
            '--my': '30%',
          } as React.CSSProperties
        }
      >
        {/* cursor spotlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background:
              'radial-gradient(420px circle at var(--mx) var(--my), rgba(251,191,36,0.07), transparent 60%)',
          }}
        />

        <div className="relative grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              {business.companyName}
            </div>

            <p className="text-sm text-amber-400 mt-5">
              {getGreeting()}, {firstName}
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mt-2 leading-[1.1] max-w-xl">
              {words.map((w, i) => (
                <motion.span
                  key={`${w}-${i}`}
                  className="inline-block mr-[0.28em]"
                  initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}
                </motion.span>
              ))}
            </h1>

            <p className="text-sm text-slate-500 mt-4 max-w-md leading-6">
              Contracts, filings and documents for {business.companyName}, in one
              place.
            </p>

            <div className="flex items-center gap-2 flex-wrap mt-6">
              <button
                onClick={() => onNavigate('/dashboard/documents')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-semibold hover:bg-amber-300 transition shadow-lg shadow-amber-400/10"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                Upload document
              </button>
              <button
                onClick={() => onNavigate('/dashboard/legal-requests')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white transition"
              >
                <Scale className="w-3.5 h-3.5" />
                Raise legal request
              </button>
              <button
                onClick={() => onNavigate('/dashboard/contracts')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white transition"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Request contract
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1 text-[11px] text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                {business.registrationStatus || 'Workspace active'}
              </span>
              {business.industry && (
                <span className="rounded-full border border-white/[0.07] px-3 py-1 text-[11px] text-slate-500">
                  {business.industry}
                </span>
              )}
              {business.companyType && (
                <span className="rounded-full border border-white/[0.07] px-3 py-1 text-[11px] text-slate-500">
                  {business.companyType}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HealthRings health={dashboard.legalHealth} score={score} />
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* =========================================================
   RUNWAY — next weeks of deadlines on one axis
========================================================= */

interface RunwayItem {
  id: string
  label: string
  days: number
  tone: Tone
  path: string
}

const RUNWAY_MIN = -10
const RUNWAY_MAX = 40
const RUNWAY_SPAN = RUNWAY_MAX - RUNWAY_MIN

const Runway = ({
  compliance,
  attention,
  onNavigate,
}: {
  compliance: DashboardCompliance[]
  attention: DashboardAttention[]
  onNavigate: (path: string) => void
}) => {
  const reduce = useReducedMotion()
  const [hovered, setHovered] = useState<string | null>(null)

  const { items, outside } = useMemo(() => {
    const now = Date.now()
    const all: RunwayItem[] = []

    compliance.forEach((c) => {
      const t = new Date(c.dueDate).getTime()
      if (Number.isNaN(t)) return
      const days = Math.round((t - now) / DAY)
      const tone: Tone =
        c.status === 'completed'
          ? 'emerald'
          : c.status === 'overdue' || days < 0
            ? 'red'
            : c.status === 'in-progress'
              ? 'blue'
              : 'amber'
      all.push({ id: `c-${c.id}`, label: c.name, days, tone, path: '/dashboard/compliance' })
    })

    attention.forEach((a) => {
      let days = a.daysUntil
      if (days === undefined && a.dueDate) {
        const t = new Date(a.dueDate).getTime()
        if (!Number.isNaN(t)) days = Math.round((t - now) / DAY)
      }
      if (days === undefined) return
      all.push({
        id: `a-${a.id}`,
        label: a.title,
        days,
        tone: a.severity === 'high' ? 'red' : a.severity === 'medium' ? 'amber' : 'blue',
        path:
          a.type === 'contract'
            ? '/dashboard/contracts'
            : a.type === 'document'
              ? '/dashboard/documents'
              : '/dashboard/compliance',
      })
    })

    const inside = all
      .filter((i) => i.days >= RUNWAY_MIN && i.days <= RUNWAY_MAX)
      .sort((a, b) => a.days - b.days)

    return { items: inside, outside: all.length - inside.length }
  }, [compliance, attention])

  const todayPct = ((0 - RUNWAY_MIN) / RUNWAY_SPAN) * 100
  const ticks = [-10, 0, 10, 20, 30, 40]
  const overdueCount = items.filter((i) => i.days < 0 && i.tone !== 'emerald').length

  return (
    <Panel className="p-5 sm:p-6">
      <PanelTitle
        title="Deadline runway"
        hint={
          items.length === 0
            ? 'Nothing due in the next 40 days'
            : `${items.length} dated ${items.length === 1 ? 'item' : 'items'}${overdueCount ? ` · ${overdueCount} past due` : ''
            }${outside ? ` · ${outside} further out` : ''}`
        }
        action={
          <LinkButton onClick={() => onNavigate('/dashboard/compliance')}>
            Compliance calendar
          </LinkButton>
        }
      />

      <div className="relative h-36 mt-2">
        {/* overdue zone */}
        <div
          className="absolute top-0 bottom-8 left-0 rounded-l-xl bg-gradient-to-r from-red-400/[0.07] to-transparent"
          style={{ width: `${todayPct}%` }}
        />

        {/* axis */}
        <div className="absolute left-0 right-0 bottom-8 h-px bg-white/[0.1]" />
        {ticks.map((t) => {
          const left = ((t - RUNWAY_MIN) / RUNWAY_SPAN) * 100
          return (
            <div
              key={t}
              className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${left}%` }}
            >
              <span className="w-px h-2 bg-white/[0.15] mb-1.5" />
              <span className="text-[10px] text-slate-600 tabular-nums">
                {t === 0 ? 'Today' : t > 0 ? `+${t}d` : `${t}d`}
              </span>
            </div>
          )
        })}

        {/* today marker */}
        <div
          className="absolute top-0 bottom-8 w-px bg-amber-400/60"
          style={{ left: `${todayPct}%` }}
        >
          {!reduce && (
            <motion.span
              className="absolute -top-0.5 -left-[3px] w-[7px] h-[7px] rounded-full bg-amber-400"
              animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          )}
        </div>

        {/* dots */}
        {items.map((item, i) => {
          const left = ((item.days - RUNWAY_MIN) / RUNWAY_SPAN) * 100
          const lane = i % 3
          const top = 12 + lane * 28
          const alignRight = left > 72
          return (
            <div
              key={item.id}
              className="absolute"
              style={{ left: `${left}%`, top }}
            >
              <motion.button
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.5 + i * 0.05, type: 'spring', stiffness: 380, damping: 18 }}
                whileHover={{ scale: 1.35 }}
                onHoverStart={() => setHovered(item.id)}
                onHoverEnd={() => setHovered(null)}
                onFocus={() => setHovered(item.id)}
                onBlur={() => setHovered(null)}
                onClick={() => onNavigate(item.path)}
                aria-label={`${item.label}, ${item.days < 0 ? `${Math.abs(item.days)} days overdue` : `due in ${item.days} days`}`}
                className="relative -translate-x-1/2 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-full"
              >
                {item.tone === 'red' && !reduce && (
                  <span
                    className={`absolute inset-0 rounded-full ${toneBg.red} opacity-50 animate-ping`}
                  />
                )}
                <span
                  className={`relative block w-3.5 h-3.5 rounded-full ring-4 ring-[#0b0b0b] ${toneBg[item.tone]}`}
                />
              </motion.button>

              <AnimatePresence>
                {hovered === item.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute top-6 z-20 whitespace-nowrap rounded-lg border border-white/10 bg-[#141414] px-3 py-2 shadow-xl ${alignRight ? 'right-0' : 'left-1/2 -translate-x-1/2'
                      }`}
                  >
                    <p className="text-xs font-medium text-white max-w-[220px] truncate">
                      {item.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${toneText[item.tone]}`}>
                      {item.days < 0
                        ? `${Math.abs(item.days)}d overdue`
                        : item.days === 0
                          ? 'Due today'
                          : `Due in ${item.days}d`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="absolute inset-0 bottom-8 flex items-center justify-center">
            <p className="text-xs text-slate-600">
              Add compliance obligations to see them plotted here.
            </p>
          </div>
        )}
      </div>
    </Panel>
  )
}

/* =========================================================
   STAT STRIP
========================================================= */

const StatStrip = ({
  overview,
  onNavigate,
}: {
  overview: DashboardData['overview']
  onNavigate: (path: string) => void
}) => {
  const stats: Array<{
    label: string
    value: number
    note: string
    icon: React.ComponentType<{ className?: string }>
    tone: Tone
    path: string
  }> = [
      {
        label: 'Legal requests',
        value: overview.legalRequests,
        note: `${overview.totalLegalRequests} raised in total`,
        icon: Scale,
        tone: 'violet',
        path: '/dashboard/legal-requests',
      },
      {
        label: 'Contract requests',
        value: overview.contractRequests,
        note: `${overview.totalContractRequests} raised in total`,
        icon: FileCheck2,
        tone: 'blue',
        path: '/dashboard/contract-requests',
      },
      {
        label: 'Contracts',
        value: overview.contracts,
        note: 'Across your workspace',
        icon: FileText,
        tone: 'amber',
        path: '/dashboard/contracts',
      },
      {
        label: 'Compliance due',
        value: overview.complianceDue,
        note: 'Upcoming obligations',
        icon: CalendarDays,
        tone: 'red',
        path: '/dashboard/compliance',
      },
      {
        label: 'Documents',
        value: overview.documents,
        note: 'Stored in your vault',
        icon: FolderLock,
        tone: 'emerald',
        path: '/dashboard/documents',
      },
    ]

  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-white/[0.06] lg:divide-x">
        {stats.map((s, i) => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.path)}
            className={`group relative text-left p-5 transition hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-400 ${i > 0 ? 'max-lg:border-t max-lg:border-white/[0.06]' : ''
              }`}
          >
            <div className="flex items-center justify-between">
              <s.icon className={`w-4 h-4 ${toneText[s.tone]}`} />
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-700 transition group-hover:text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="text-4xl font-semibold text-white tracking-tighter mt-5">
              <CountUp value={s.value} />
            </p>
            <p className="text-sm text-slate-300 mt-1">{s.label}</p>
            <p className="text-[11px] text-slate-600 mt-1">{s.note}</p>
            <span
              className={`absolute left-0 bottom-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ${toneBg[s.tone]}`}
            />
          </button>
        ))}
      </div>
    </Panel>
  )
}

/* =========================================================
   ATTENTION
========================================================= */

const AttentionQueue = ({
  items,
  onNavigate,
}: {
  items: DashboardAttention[]
  onNavigate: (item: DashboardAttention) => void
}) => {
  const reduce = useReducedMotion()

  return (
    <Panel className="overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 sm:pt-6">
        <PanelTitle
          title="Needs your attention"
          hint="Sorted by what’s most urgent"
          action={
            items.length > 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-[10px] font-medium text-red-300">
                {items.length} open
              </span>
            ) : undefined
          }
        />
      </div>

      {items.length === 0 ? (
        <EmptyNote
          icon={ShieldCheck}
          title="Everything looks good"
          description="No legal actions need you right now."
        />
      ) : (
        <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
          {items.map((item, i) => {
            const tone: Tone =
              item.severity === 'high' ? 'red' : item.severity === 'medium' ? 'amber' : 'blue'
            return (
              <motion.button
                key={item.id}
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => onNavigate(item)}
                className="group relative w-full text-left pl-6 pr-5 sm:pr-6 py-4 flex items-center gap-4 hover:bg-white/[0.025] transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-400"
              >
                <span className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${toneBg[tone]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">{item.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.daysUntil !== undefined && (
                    <span
                      className={`hidden sm:block text-[11px] font-medium ${item.daysUntil < 0
                        ? 'text-red-400'
                        : item.daysUntil <= 3
                          ? 'text-amber-400'
                          : 'text-slate-500'
                        }`}
                    >
                      {item.daysUntil < 0
                        ? `${Math.abs(item.daysUntil)}d overdue`
                        : item.daysUntil === 0
                          ? 'Due today'
                          : `${item.daysUntil}d left`}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

/* =========================================================
   WORKBENCH — one tabbed panel instead of four cards
========================================================= */

type TabKey = 'legal' | 'contractReq' | 'contracts' | 'compliance'

interface WorkRow {
  id: string
  icon: React.ComponentType<{ className?: string }>
  iconTone: Tone
  title: string
  sub: string
  status: string
  meta?: string
}

const Workbench = ({
  dashboard,
  onNavigate,
}: {
  dashboard: DashboardData
  onNavigate: (path: string) => void
}) => {
  const reduce = useReducedMotion()
  const [tab, setTab] = useState<TabKey>('legal')

  const { legalRequests, contractRequests, contracts, compliance } = dashboard

  const tabs: Array<{
    key: TabKey
    label: string
    count: number
    path: string
    chips: Array<{ label: string; value: number; tone: Tone }>
    rows: WorkRow[]
    empty: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }
  }> = [
      {
        key: 'legal',
        label: 'Legal requests',
        count: legalRequests.total,
        path: '/dashboard/legal-requests',
        chips: [
          { label: 'Active', value: legalRequests.active, tone: 'blue' },
          { label: 'Pending', value: legalRequests.pending, tone: 'amber' },
          { label: 'Completed', value: legalRequests.completed, tone: 'emerald' },
        ],
        rows: legalRequests.items.slice(0, 5).map((r) => ({
          id: r.id,
          icon: Scale,
          iconTone: 'violet',
          title: r.title,
          sub: `${capitalize(r.category) || 'Legal request'} · ${r.assignedTo || 'Unassigned'}`,
          status: r.status,
          meta: r.priority ? capitalize(r.priority) : undefined,
        })),
        empty: {
          icon: Scale,
          title: legalRequests.total === 0 ? 'No legal requests yet' : 'No active legal requests',
          description: 'Raise a request and it shows up here.',
        },
      },
      {
        key: 'contractReq',
        label: 'Contract requests',
        count: contractRequests.total,
        path: '/dashboard/contract-requests',
        chips: [
          { label: 'Active', value: contractRequests.active, tone: 'blue' },
          { label: 'Pending', value: contractRequests.pending, tone: 'amber' },
          { label: 'Completed', value: contractRequests.completed, tone: 'emerald' },
        ],
        rows: contractRequests.items.slice(0, 5).map((r) => ({
          id: r.id,
          icon: FileCheck2,
          iconTone: 'blue',
          title: r.title,
          sub: `${r.requestNumber ? `${r.requestNumber} · ` : ''}${r.contractType || 'Contract'}${r.assignedProfessional ? ` · ${r.assignedProfessional}` : ''
            }`,
          status: r.status,
          meta: r.expectedDeliveryDate ? `Due ${formatDate(r.expectedDeliveryDate)}` : undefined,
        })),
        empty: {
          icon: FileCheck2,
          title: contractRequests.total === 0 ? 'No contract requests yet' : 'No active contract requests',
          description: 'Request a contract and it shows up here.',
        },
      },
      {
        key: 'contracts',
        label: 'Contracts',
        count: contracts.total,
        path: '/dashboard/contracts',
        chips: [
          { label: 'To sign', value: contracts.awaitingSignature, tone: 'red' },
          { label: 'In review', value: contracts.inReview, tone: 'amber' },
          { label: 'Approved', value: contracts.approved, tone: 'blue' },
          { label: 'Executed', value: contracts.executed, tone: 'emerald' },
        ],
        rows: contracts.items.slice(0, 5).map((c) => ({
          id: c.id,
          icon: FileText,
          iconTone: 'amber',
          title: c.name,
          sub: c.nextAction || 'Contract activity',
          status: c.status,
          meta: c.dueDate ? `Due ${formatDate(c.dueDate)}` : undefined,
        })),
        empty: {
          icon: FileText,
          title: 'No contracts need action',
          description: 'Your contract workspace is clear.',
        },
      },
      {
        key: 'compliance',
        label: 'Compliance',
        count: compliance.total,
        path: '/dashboard/compliance',
        chips: [
          { label: 'Pending', value: compliance.pending, tone: 'amber' },
          { label: 'Completed', value: compliance.completed, tone: 'emerald' },
          { label: 'Overdue', value: compliance.overdue, tone: 'red' },
        ],
        rows: compliance.items.slice(0, 5).map((c) => ({
          id: c.id,
          icon: CalendarDays,
          iconTone: c.status === 'overdue' ? 'red' : c.status === 'completed' ? 'emerald' : 'amber',
          title: c.name,
          sub: `${capitalize(c.category) || 'Compliance'}${c.assignedProfessional ? ` · ${c.assignedProfessional}` : ''
            }`,
          status: c.status,
          meta: formatDate(c.dueDate),
        })),
        empty: {
          icon: ShieldCheck,
          title: 'No compliance items',
          description: 'Obligations you add will be tracked here.',
        },
      },
    ]

  const active = tabs.find((t) => t.key === tab) || tabs[0]

  return (
    <Panel className="overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 sm:pt-6">
        <PanelTitle
          title="Workbench"
          hint="Everything in motion across your workspace"
          action={<LinkButton onClick={() => onNavigate(active.path)}>View all</LinkButton>}
        />

        <div
          role="tablist"
          className="relative flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5"
        >
          {tabs.map((t) => {
            const isActive = t.key === tab
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t.key)}
                className={`relative px-3.5 py-2 text-xs whitespace-nowrap rounded-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="workbench-tab"
                    className="absolute inset-0 rounded-lg bg-white/[0.07] border border-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {t.label}
                  <span className="text-[10px] text-slate-500 tabular-nums">{t.count}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.key}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="grid gap-2 px-5 sm:px-6 mt-5 mb-5"
            style={{ gridTemplateColumns: `repeat(${active.chips.length}, minmax(0, 1fr))` }}
          >
            {active.chips.map((c) => (
              <div
                key={c.label}
                className="rounded-xl bg-white/[0.025] border border-white/[0.05] p-3"
              >
                <p className={`text-xl font-semibold ${toneText[c.tone]}`}>
                  <CountUp value={c.value} duration={600} />
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {active.rows.length === 0 ? (
            <div className="border-t border-white/[0.06]">
              <EmptyNote {...active.empty} />
            </div>
          ) : (
            <div className="border-t border-white/[0.06] divide-y divide-white/[0.05]">
              {active.rows.map((row, i) => (
                <motion.div
                  key={row.id}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/[0.04] ${toneText[row.iconTone]}`}
                  >
                    <row.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{row.title}</p>
                    <p className="text-[11px] text-slate-600 mt-1 truncate">{row.sub}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusPill status={row.status} />
                    {row.meta && (
                      <p className="text-[10px] text-slate-600 mt-1.5">{row.meta}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Panel>
  )
}

/* =========================================================
   SIDE PANELS
========================================================= */

const DocumentsPanel = ({
  data,
  onViewAll,
}: {
  data: DashboardData['documents']
  onViewAll: () => void
}) => (
  <Panel className="p-5 sm:p-6">
    <PanelTitle
      title="Document vault"
      hint={`${data.total} stored securely${data.expiring.length ? ` · ${data.expiring.length} expiring` : ''
        }`}
      action={<LinkButton onClick={onViewAll}>Open</LinkButton>}
    />
    {data.recent.length === 0 ? (
      <EmptyNote
        icon={FolderLock}
        title="Your vault is empty"
        description="Upload your first business document."
      />
    ) : (
      <div className="space-y-1">
        {data.recent.slice(0, 4).map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-white/[0.035] transition"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{doc.name}</p>
              <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                {capitalize(doc.category) || 'Document'} · {doc.uploadedBy || 'Unknown'}
              </p>
            </div>
            <span className="text-[10px] text-slate-600 flex-shrink-0">
              {formatRelativeDate(doc.createdAt)}
            </span>
          </div>
        ))}
      </div>
    )}
  </Panel>
)

const TeamPanel = ({
  data,
  onViewAll,
}: {
  data: DashboardData['team']
  onViewAll: () => void
}) => (
  <Panel className="p-5 sm:p-6">
    <PanelTitle
      title="Legal team"
      hint={`${data.active} active ${data.active === 1 ? 'member' : 'members'}`}
      action={<LinkButton onClick={onViewAll}>Manage</LinkButton>}
    />
    {data.professionals.length === 0 ? (
      <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center">
        <Users className="w-5 h-5 mx-auto text-slate-600 mb-2" />
        <p className="text-xs text-slate-500">Invite your lawyer, CA or company secretary.</p>
      </div>
    ) : (
      <>
        <div className="flex -space-x-2 mb-4">
          {data.professionals.slice(0, 6).map((m, i) => (
            <motion.div
              key={m.id}
              title={m.name}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
              className="w-9 h-9 rounded-full bg-slate-800 border-2 border-[#0b0b0b] flex items-center justify-center text-[10px] font-semibold text-white"
            >
              {getInitials(m.name)}
            </motion.div>
          ))}
          {data.total > 6 && (
            <div className="w-9 h-9 rounded-full bg-white/[0.05] border-2 border-[#0b0b0b] flex items-center justify-center text-[10px] text-slate-400">
              +{data.total - 6}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          {data.professionals.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.025]">
              <div className="w-7 h-7 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center text-[10px] font-semibold">
                {getInitials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{m.name}</p>
                <p className="text-[10px] text-slate-600 truncate">{m.memberType || 'Team member'}</p>
              </div>
              <span className="text-[10px] text-slate-500 capitalize">{m.workspaceRole || 'member'}</span>
            </div>
          ))}
        </div>
      </>
    )}
    {data.pendingInvitations > 0 && (
      <div className="mt-4 rounded-xl bg-amber-400/[0.06] border border-amber-400/10 px-3.5 py-3 flex items-center gap-3">
        <Clock3 className="w-4 h-4 text-amber-400" />
        <p className="text-xs text-amber-200 flex-1">
          {data.pendingInvitations} {data.pendingInvitations === 1 ? 'invitation' : 'invitations'} pending
        </p>
      </div>
    )}
  </Panel>
)

const OperationsPanel = ({ data }: { data: DashboardData['monthlyOperations'] }) => {
  const reduce = useReducedMotion()
  const rate =
    data.requestsReceived > 0
      ? Math.round((data.requestsCompleted / data.requestsReceived) * 100)
      : 0
  const c = 2 * Math.PI * 34

  const rows: Array<[string, number, Tone]> = [
    ['Received', data.requestsReceived, 'slate'],
    ['Completed', data.requestsCompleted, 'emerald'],
    ['Reviewed', data.contractsReviewed, 'slate'],
    ['Drafted', data.contractsDrafted, 'slate'],
    ['Pending', data.pendingActions, 'amber'],
  ]

  return (
    <Panel className="p-5 sm:p-6">
      <PanelTitle title="This month" hint="Legal operations activity" />
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#34d399"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - rate / 100) }}
              transition={{ duration: reduce ? 0 : 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-semibold text-white tabular-nums">{rate}%</span>
            <span className="text-[9px] text-slate-600">done</span>
          </div>
        </div>
        <dl className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
          {rows.map(([label, value, tone]) => (
            <div key={label} className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] text-slate-500">{label}</dt>
              <dd className={`text-sm font-medium tabular-nums ${tone === 'slate' ? 'text-white' : toneText[tone]}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  )
}

const ActivityPanel = ({ items }: { items: DashboardActivity[] }) => (
  <Panel className="p-5 sm:p-6">
    <PanelTitle title="Recent activity" hint="What your team did lately" />
    {items.length === 0 ? (
      <p className="text-xs text-slate-600 py-4">Activity will appear as your team works.</p>
    ) : (
      <ol className="relative ml-1.5 border-l border-white/[0.08] space-y-4">
        {items.slice(0, 5).map((a, i) => (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            className="relative pl-5"
          >
            <span className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-amber-400/80 ring-4 ring-[#0b0b0b]" />
            <p className="text-xs text-slate-300 leading-5">{a.action}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {a.actor} · {formatRelativeDate(a.timestamp)}
            </p>
          </motion.li>
        ))}
      </ol>
    )}
  </Panel>
)

/* =========================================================
   MAIN PAGE
========================================================= */

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchDashboard = useCallback(
    async (showRefresh = false) => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        setIsAuthenticated(false)
        router.replace(LOGIN_PATH)
        return
      }

      if (showRefresh) setIsRefreshing(true)
      else setIsLoading(true)

      try {
        setError(null)

        const parsedUser: User = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsAuthenticated(true)

        const { data: result } = await api.get<DashboardResponse>('/dashboard')

        if (!result.success) {
          throw new Error(result.message || 'Failed to load dashboard')
        }

        setDashboard(normalizeDashboard(result.data))
      } catch (err) {
        // Session is dead and a redirect to login is already in progress,
        // so don't show an error screen or toast
        if (err instanceof AuthError) return

        console.error('Dashboard fetch error:', err)

        const message =
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading the dashboard.'

        setError(message)

        premiumToast.error(showRefresh ? 'Refresh failed' : 'Could not load dashboard', {
          description: message,
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [router]
  )
  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const navigateTo = useCallback((path: string) => router.push(path), [router])

  const handleAttentionNavigation = (item: DashboardAttention) => {
    if (item.type === 'compliance') return navigateTo('/dashboard/compliance')
    if (item.type === 'contract') return navigateTo('/dashboard/contracts')
    if (item.type === 'document') return navigateTo('/dashboard/documents')
    if (item.type === 'legal-request') return navigateTo('/dashboard/legal-requests')
    if (item.type === 'contract-request') return navigateTo('/dashboard/contract-requests')
    navigateTo('/dashboard')
  }

  const firstName = useMemo(() => user?.fullName?.split(' ')[0] || 'there', [user])

  if (isLoading) return <DashboardSkeleton />
  if (!isAuthenticated) return null

  if (error || !dashboard) {
    return (
      <ErrorState
        message={error || 'Dashboard data is currently unavailable.'}
        onRetry={() => fetchDashboard()}
      />
    )
  }

  const score = clamp(
    typeof dashboard.business.legalHealthScore === 'number'
      ? dashboard.business.legalHealthScore
      : dashboard.legalHealth.score
  )

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <Ambient />

      <main className="relative max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* top bar */}
        <header className="flex items-center justify-between mb-6">
          <p className="text-xs text-slate-500">Legal operations workspace</p>
          <button
            onClick={async () => {
              await fetchDashboard(true)
              if (!localStorage.getItem('token')) return // session ended, redirecting
              premiumToast.success('Refreshed', {
                description: 'Latest dashboard data loaded.',
                duration: 2000,
              })
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.025] text-xs text-slate-400 hover:text-white hover:bg-white/[0.05] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        <div className="space-y-5">
          <Hero
            firstName={firstName}
            dashboard={dashboard}
            score={score}
            onNavigate={navigateTo}
          />

          <Runway
            compliance={dashboard.compliance.items}
            attention={dashboard.attention}
            onNavigate={navigateTo}
          />

          <StatStrip overview={dashboard.overview} onNavigate={navigateTo} />

          <div className="grid lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2 space-y-5">
              <AttentionQueue
                items={dashboard.attention}
                onNavigate={handleAttentionNavigation}
              />
              <Workbench dashboard={dashboard} onNavigate={navigateTo} />
            </div>

            <div className="space-y-5">
              <DocumentsPanel
                data={dashboard.documents}
                onViewAll={() => navigateTo('/dashboard/documents')}
              />
              <TeamPanel
                data={dashboard.team}
                onViewAll={() => navigateTo('/dashboard/team')}
              />
              <OperationsPanel data={dashboard.monthlyOperations} />
              <ActivityPanel items={dashboard.activity} />
            </div>
          </div>
        </div>

        <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-8 pb-4">
          <p className="text-[10px] text-slate-700">NyayMitra Legal Operations</p>
          <p className="text-[10px] text-slate-700">
            Last updated {formatRelativeDate(dashboard.generatedAt)}
          </p>
        </footer>
      </main>
    </div>
  )
}