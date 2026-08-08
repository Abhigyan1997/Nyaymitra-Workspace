'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  Activity,
  Zap,
  Calendar,
  Shield,
  ArrowRight,
} from 'lucide-react'

interface User {
  id: string
  fullName: string
  email: string
  role: string
  userId: string
  phone: string
  profilePhoto?: string
}

interface FocusItem {
  icon: React.ReactNode
  title: string
  daysUntil?: number
  priority: 'high' | 'medium'
}

interface KPICard {
  title: string
  value: string
  trend?: string
  icon: React.ComponentType<{ className?: string }>
}

interface ComplianceItem {
  name: string
  dueDate: string
  status: 'upcoming' | 'completed' | 'delayed'
  frequency: string
}

interface Matter {
  id: string
  title: string
  type: string
  priority: 'high' | 'medium' | 'low'
  lawyer: string
  stage: string
  progress: number
  dueDate: string
  status: 'under-review' | 'in-progress' | 'completed'
}

interface ActivityEvent {
  id: string
  action: string
  actor: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
}

interface RiskItem {
  id: string
  title: string
  severity: 'high' | 'medium' | 'low'
  impact: string
  days?: number
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
    className={`rounded-xl p-6 border border-white/8 bg-black/40 backdrop-blur-sm transition-all duration-300 ${hover ? 'hover:border-amber-400/50 hover:bg-black/50' : ''
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
  <h2 className="text-sm font-medium tracking-wide text-amber-400 mb-6 uppercase">
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
    <span className={`text-xs px-2 py-1 rounded border ${colors[priority]}`}>
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
    <span className={`text-xs px-2 py-1 rounded border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

const ComplianceStatus = ({ status }: { status: 'upcoming' | 'completed' | 'delayed' }) => {
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
    <span className={`text-xs px-2 py-1 rounded border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

// ==========================================
// MAIN DASHBOARD
// ==========================================

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse user:', error)
      }
    }

    // Set greeting based on current time
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
  }, [])

  const firstName = user?.fullName?.split(' ')[0] || 'User'
  const companyName = 'FreshFlow AI Pvt Ltd'

  // Mock data
  const todaysFocus: FocusItem[] = [
    {
      icon: <AlertCircle className="w-4 h-4" />,
      title: 'GST Filing due tomorrow',
      daysUntil: 1,
      priority: 'high',
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: 'Vendor Agreement awaiting signature',
      priority: 'high',
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      title: 'Trademark objection response due in 5 days',
      daysUntil: 5,
      priority: 'medium',
    },
    {
      icon: <Briefcase className="w-4 h-4" />,
      title: 'Employment Agreement pending review',
      priority: 'medium',
    },
  ]

  const kpiCards: KPICard[] = [
    { title: 'Open Matters', value: '23', icon: Briefcase },
    { title: 'Contracts', value: '147', icon: FileText },
    { title: 'Pending Approvals', value: '8', icon: Clock },
    { title: 'Upcoming Compliance', value: '3', icon: Calendar },
    { title: 'Documents', value: '1,247', icon: FileText },
    { title: 'Assigned Professionals', value: '12', icon: Users },
  ]

  const complianceItems: ComplianceItem[] = [
    { name: 'GST Return', dueDate: 'Aug 15', status: 'upcoming', frequency: 'Monthly' },
    { name: 'TDS Payment', dueDate: 'Aug 7', status: 'upcoming', frequency: 'Monthly' },
    { name: 'PF Contribution', dueDate: 'Aug 20', status: 'upcoming', frequency: 'Monthly' },
    { name: 'Board Meeting', dueDate: 'Aug 22', status: 'upcoming', frequency: 'Quarterly' },
    { name: 'Annual Return', dueDate: 'Oct 31', status: 'upcoming', frequency: 'Annual' },
  ]

  const matters: Matter[] = [
    {
      id: '1',
      title: 'Contract Review - Vendor Agreement',
      type: 'Contracts',
      priority: 'high',
      lawyer: 'Sharma & Associates',
      stage: 'Legal Review',
      progress: 65,
      dueDate: 'Aug 8, 2024',
      status: 'under-review',
    },
    {
      id: '2',
      title: 'IP Registration - Trademark Filing',
      type: 'IP',
      priority: 'medium',
      lawyer: 'Patent House',
      stage: 'Filing',
      progress: 40,
      dueDate: 'Aug 20, 2024',
      status: 'in-progress',
    },
    {
      id: '3',
      title: 'Compliance Audit - FY 2023-24',
      type: 'Compliance',
      priority: 'medium',
      lawyer: 'Chartered Advisors',
      stage: 'Final Review',
      progress: 100,
      dueDate: 'Jul 31, 2024',
      status: 'completed',
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
      action: 'Trademark filed',
      actor: 'Patent House',
      timestamp: '4 hours ago',
      icon: Zap,
    },
    {
      id: '3',
      action: 'Matter assigned',
      actor: 'Sharma & Associates',
      timestamp: '1 day ago',
      icon: Briefcase,
    },
  ]

  const riskItems: RiskItem[] = [
    {
      id: '1',
      title: 'Employment Agreements Missing',
      severity: 'high',
      impact: 'Non-compliance risk',
      days: 3,
    },
    {
      id: '2',
      title: 'Expired Vendor Agreement',
      severity: 'high',
      impact: 'Legal dispute risk',
    },
    {
      id: '3',
      title: 'GST Filing Tomorrow',
      severity: 'high',
      impact: 'Penalty risk',
      days: 1,
    },
  ]

  const insights = {
    strengths: [
      'All GST filings completed on time',
      'All mandatory registrations updated',
      'Vendor contracts centralized',
    ],
    attentionRequired: [
      'Two contracts expiring',
      'Board resolution pending',
      'Trademark renewal approaching',
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-950">
      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-8 pt-12 pb-8 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-sm font-medium text-amber-400 mb-2">{greeting},</p>
            <h1 className="text-6xl font-light tracking-tight text-white mb-1">
              {firstName}
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              {companyName} — Legal Operations Workspace
            </p>
          </motion.div>

          {/* TODAY'S FOCUS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <Label>Today's Focus</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {todaysFocus.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-amber-400/30 transition-colors"
                >
                  <div
                    className={`mt-1 ${item.priority === 'high' ? 'text-red-400' : 'text-amber-400'
                      }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white line-clamp-2">
                      {item.title}
                    </p>
                    {item.daysUntil && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.daysUntil} day{item.daysUntil !== 1 ? 's' : ''} left
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="px-8 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* LEGAL HEALTH SCORE HERO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Card hover className="lg:col-span-full">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Score Section */}
                <div className="lg:col-span-1">
                  <Label>Legal Health Score</Label>
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="mt-6 flex items-center gap-6"
                  >
                    {/* Circular Progress */}
                    <div className="relative w-32 h-32 flex-shrink-0">
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
                          strokeDashoffset={`${2 * Math.PI * 54 * (1 - 87 / 100)}`}
                          strokeLinecap="round"
                          className="text-amber-400"
                          initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - 87 / 100) }}
                          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-light text-white">87</span>
                        <span className="text-xs text-gray-400">/100</span>
                      </div>
                    </div>

                    {/* Score Details */}
                    <div>
                      <p className="text-sm font-medium text-amber-400 mb-4">Healthy</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-gray-300">23 Active Matters</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-gray-300">14 Active Contracts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-gray-300">3 Compliance Due</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-gray-300">2 High Risk Contracts</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <button className="mt-8 w-full px-4 py-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-sm font-medium hover:bg-amber-400/20 transition-colors">
                    View Full Report
                  </button>
                </div>

                {/* Insights Section */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Strengths */}
                  <div>
                    <h3 className="text-sm font-medium text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {insights.strengths.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-green-400 mt-1">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Attention Required */}
                  <div>
                    <h3 className="text-sm font-medium text-amber-400 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Attention Required
                    </h3>
                    <ul className="space-y-2">
                      {insights.attentionRequired.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-amber-400 mt-1">⚠</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* KPI GRID */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpiCards.map((card, idx) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + idx * 0.05 }}
                >
                  <Card hover>
                    <div className="flex items-start justify-between mb-4">
                      <Label>{card.title}</Label>
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-4xl font-light text-white mb-2">
                      {card.value}
                    </p>
                    {card.trend && (
                      <p className="text-sm text-gray-400">{card.trend}</p>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* COMPLIANCE CALENDAR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.65 }}
          >
            <Card>
              <SectionTitle>Compliance Calendar</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complianceItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.65 + idx * 0.03 }}
                    className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-amber-400/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <ComplianceStatus status={item.status} />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{item.frequency}</p>
                    <p className="text-xs font-medium text-amber-400">{item.dueDate}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* PRIORITIES & RECENT MATTERS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* RECENT MATTERS - LARGE */}
            <div className="lg:col-span-2">
              <Card>
                <SectionTitle>Recent Matters</SectionTitle>
                <div className="space-y-4">
                  {matters.map((matter, idx) => (
                    <motion.div
                      key={matter.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.72 + idx * 0.05 }}
                      className="pb-4 border-b border-white/5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-white">
                            {matter.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {matter.type} • {matter.lawyer}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={matter.priority} />
                          <StatusBadge status={matter.status} />
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">
                            {matter.stage}
                          </span>
                          <span className="text-xs text-gray-400">
                            {matter.progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${matter.progress}%` }}
                            transition={{ duration: 1, delay: 0.75 }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">
                        Due: {matter.dueDate}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>

            {/* RISK CENTER */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.75 }}
            >
              <Card>
                <SectionTitle>Risk Center</SectionTitle>
                <div className="space-y-3">
                  {riskItems.map((risk) => (
                    <div
                      key={risk.id}
                      className={`p-3 rounded-lg border ${risk.severity === 'high'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-amber-400/5 border-amber-400/20'
                        }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${risk.severity === 'high'
                            ? 'text-red-400'
                            : 'text-amber-400'
                            }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {risk.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {risk.impact}
                          </p>
                        </div>
                      </div>
                      {risk.days && (
                        <p className="text-xs text-gray-600 ml-6 mb-2">
                          {risk.days} day{risk.days !== 1 ? 's' : ''} remaining
                        </p>
                      )}
                      <button className="w-full text-xs px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* RECENT ACTIVITY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <Card>
              <SectionTitle>Recent Activity</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activityFeed.map((event) => {
                  const Icon = event.icon
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:border-amber-400/30 transition-colors"
                    >
                      <div className="mt-1 p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 flex-shrink-0">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          {event.action}
                          <span className="text-gray-400 ml-2">by {event.actor}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {event.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </motion.div>

          {/* QUICK ACTIONS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.85 }}
          >
            <div>
              <SectionTitle>Quick Actions</SectionTitle>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Raise Legal Request', icon: Zap },
                  { label: 'Upload Contract', icon: FileText },
                  { label: 'Book Consultation', icon: Clock },
                  { label: 'Invite Team', icon: Users },
                  { label: 'Request Review', icon: CheckCircle2 },
                  { label: 'Legal Assessment', icon: Shield },
                ].map((action, idx) => {
                  const Icon = action.icon
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05, borderColor: 'rgba(245, 158, 11, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.87 + idx * 0.02 }}
                      className="p-4 rounded-xl border border-white/8 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-all duration-300 group"
                    >
                      <Icon className="w-5 h-5 mx-auto mb-2 text-amber-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-medium text-center text-white line-clamp-2">
                        {action.label}
                      </p>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}