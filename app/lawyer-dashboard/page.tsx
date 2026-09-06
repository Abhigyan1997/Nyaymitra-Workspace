'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Briefcase,
    FileText,
    Clock,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Users,
    Activity,
    Zap,
    Shield,
    ArrowRight,
    Star,
    MessageCircle,
    Eye,
    Filter,
    Search,
    TrendingUp,
    DollarSign,
    BarChart3,
    FolderOpen,
    Timer,
    UserCheck,
    Mail,
    Phone,
    Building,
    Award,
    BookOpen,
    PieChart,
    ChevronRight,
} from 'lucide-react'

interface User {
    id: string
    fullName: string
    email: string
    role: string
    userId: string
    phone: string
    profilePhoto?: string
    specialization?: string[]
    practiceAreas?: string[]
    barNumber?: string
}

interface AssignedMatter {
    id: string
    title: string
    type: string
    client: string
    clientCompany: string
    priority: 'high' | 'medium' | 'low'
    stage: string
    progress: number
    dueDate: string
    status: 'under-review' | 'in-progress' | 'completed' | 'pending-client'
    assignedDate: string
    description: string
    documents: number
    tasks: Task[]
}

interface Task {
    id: string
    title: string
    description: string
    dueDate: string
    priority: 'high' | 'medium' | 'low'
    status: 'pending' | 'in-progress' | 'completed'
    assignedTo: string
    matterId: string
}

interface RecentActivity {
    id: string
    action: string
    matter: string
    timestamp: string
    icon: React.ComponentType<{ className?: string }>
}

interface PerformanceMetric {
    label: string
    value: string
    trend: number
    icon: React.ComponentType<{ className?: string }>
}

interface ClientInteraction {
    id: string
    client: string
    type: 'meeting' | 'call' | 'email' | 'document'
    date: string
    summary: string
    status: 'scheduled' | 'completed' | 'pending'
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
        className={`rounded-xl p-4 sm:p-6 border border-white/8 bg-black/40 backdrop-blur-sm transition-all duration-300 ${hover ? 'hover:border-blue-400/50 hover:bg-black/50' : ''
            } ${className}`}
    >
        {children}
    </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xs sm:text-sm font-medium tracking-wide text-blue-400 mb-4 sm:mb-6 uppercase">
        {children}
    </h2>
)

const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
    const colors = {
        high: 'bg-red-500/10 text-red-400 border-red-500/20',
        medium: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
        low: 'bg-green-500/10 text-green-400 border-green-500/20',
    }
    return (
        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border ${colors[priority]}`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
    )
}

const StatusBadge = ({
    status,
}: {
    status: 'under-review' | 'in-progress' | 'completed' | 'pending-client'
}) => {
    const colors = {
        'under-review': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'in-progress': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
        'pending-client': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    }
    const labels = {
        'under-review': 'Under Review',
        'in-progress': 'In Progress',
        completed: 'Completed',
        'pending-client': 'Pending Client',
    }
    return (
        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border ${colors[status]}`}>
            {labels[status]}
        </span>
    )
}

const TaskStatusBadge = ({
    status,
}: {
    status: 'pending' | 'in-progress' | 'completed'
}) => {
    const colors = {
        pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        'in-progress': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    }
    const labels = {
        pending: 'Pending',
        'in-progress': 'In Progress',
        completed: 'Completed',
    }
    return (
        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border ${colors[status]}`}>
            {labels[status]}
        </span>
    )
}

// ==========================================
// MAIN LAWYER DASHBOARD
// ==========================================

export default function LawyerDashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [greeting, setGreeting] = useState('')
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (error) {
                console.error('Failed to parse user:', error)
            }
        }

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

    const firstName = user?.fullName?.split(' ')[0] || 'Lawyer'
    const lawFirm = 'FreshFlow Legal Partners'

    // Mock data - In real app, fetch from API based on lawyer's ID
    const performanceMetrics: PerformanceMetric[] = [
        {
            label: 'Active Matters',
            value: '14',
            trend: 12,
            icon: Briefcase,
        },
        {
            label: 'Billable Hours',
            value: '47.5',
            trend: 8,
            icon: Timer,
        },
        {
            label: 'Client Satisfaction',
            value: '4.8',
            trend: 5,
            icon: Star,
        },
        {
            label: 'Revenue Generated',
            value: '$82,400',
            trend: 15,
            icon: DollarSign,
        },
        {
            label: 'Documents Drafted',
            value: '89',
            trend: 3,
            icon: FileText,
        },
        {
            label: 'Success Rate',
            value: '92%',
            trend: 7,
            icon: TrendingUp,
        },
    ]

    const assignedMatters: AssignedMatter[] = [
        {
            id: '1',
            title: 'Merger & Acquisition Deal',
            type: 'Corporate',
            client: 'TechCorp Inc.',
            clientCompany: 'TechCorp Inc.',
            priority: 'high',
            stage: 'Due Diligence',
            progress: 45,
            dueDate: '2024-09-15',
            status: 'in-progress',
            assignedDate: '2024-07-01',
            description: 'Leading the legal due diligence for the acquisition of AI startup.',
            documents: 23,
            tasks: [
                {
                    id: 't1',
                    title: 'Review financial statements',
                    description: 'Analyze last 3 years financial records',
                    dueDate: '2024-08-10',
                    priority: 'high',
                    status: 'in-progress',
                    assignedTo: 'Self',
                    matterId: '1',
                },
                {
                    id: 't2',
                    title: 'Prepare legal opinion',
                    description: 'Draft legal opinion on acquisition risks',
                    dueDate: '2024-08-20',
                    priority: 'medium',
                    status: 'pending',
                    assignedTo: 'Self',
                    matterId: '1',
                },
            ],
        },
        {
            id: '2',
            title: 'Patent Infringement Defense',
            type: 'IP',
            client: 'BioMed Solutions',
            clientCompany: 'BioMed Solutions',
            priority: 'high',
            stage: 'Legal Strategy',
            progress: 30,
            dueDate: '2024-10-30',
            status: 'under-review',
            assignedDate: '2024-07-15',
            description: 'Defending against patent infringement claims in medical device industry.',
            documents: 15,
            tasks: [
                {
                    id: 't3',
                    title: 'Analyze patent claims',
                    description: 'Review the plaintiff\'s patent claims',
                    dueDate: '2024-08-15',
                    priority: 'high',
                    status: 'in-progress',
                    assignedTo: 'Self',
                    matterId: '2',
                },
            ],
        },
        {
            id: '3',
            title: 'Commercial Lease Agreement',
            type: 'Real Estate',
            client: 'Retail Ventures',
            clientCompany: 'Retail Ventures',
            priority: 'medium',
            stage: 'Negotiation',
            progress: 75,
            dueDate: '2024-08-25',
            status: 'in-progress',
            assignedDate: '2024-06-20',
            description: 'Negotiating commercial lease terms for 5 new retail locations.',
            documents: 8,
            tasks: [
                {
                    id: 't4',
                    title: 'Review lease terms',
                    description: 'Analyze landlord\'s lease proposal',
                    dueDate: '2024-08-05',
                    priority: 'medium',
                    status: 'completed',
                    assignedTo: 'Self',
                    matterId: '3',
                },
                {
                    id: 't5',
                    title: 'Prepare counter-proposal',
                    description: 'Draft counter-proposal for lease terms',
                    dueDate: '2024-08-12',
                    priority: 'medium',
                    status: 'pending',
                    assignedTo: 'Self',
                    matterId: '3',
                },
            ],
        },
        {
            id: '4',
            title: 'Employment Dispute Resolution',
            type: 'Employment',
            client: 'Global Services Ltd.',
            clientCompany: 'Global Services Ltd.',
            priority: 'medium',
            stage: 'Mediation',
            progress: 60,
            dueDate: '2024-09-05',
            status: 'pending-client',
            assignedDate: '2024-07-10',
            description: 'Mediating employment dispute with former executive.',
            documents: 12,
            tasks: [
                {
                    id: 't6',
                    title: 'Prepare mediation brief',
                    description: 'Draft brief for mediation session',
                    dueDate: '2024-08-30',
                    priority: 'medium',
                    status: 'in-progress',
                    assignedTo: 'Self',
                    matterId: '4',
                },
            ],
        },
        {
            id: '5',
            title: 'Regulatory Compliance Audit',
            type: 'Compliance',
            client: 'FinTech Innovations',
            clientCompany: 'FinTech Innovations',
            priority: 'low',
            stage: 'Initial Review',
            progress: 20,
            dueDate: '2024-11-15',
            status: 'in-progress',
            assignedDate: '2024-08-01',
            description: 'Comprehensive compliance audit for financial technology company.',
            documents: 5,
            tasks: [
                {
                    id: 't7',
                    title: 'Review compliance policies',
                    description: 'Analyze existing compliance framework',
                    dueDate: '2024-08-25',
                    priority: 'low',
                    status: 'pending',
                    assignedTo: 'Self',
                    matterId: '5',
                },
            ],
        },
    ]

    const recentActivities: RecentActivity[] = [
        {
            id: '1',
            action: 'Submitted due diligence report for M&A deal',
            matter: 'TechCorp Inc.',
            timestamp: '2 hours ago',
            icon: FileText,
        },
        {
            id: '2',
            action: 'Client meeting scheduled',
            matter: 'BioMed Solutions',
            timestamp: '4 hours ago',
            icon: Calendar,
        },
        {
            id: '3',
            action: 'Drafted legal opinion for patent case',
            matter: 'Patent Infringement Defense',
            timestamp: '1 day ago',
            icon: Briefcase,
        },
        {
            id: '4',
            action: 'Reviewed lease agreement',
            matter: 'Retail Ventures',
            timestamp: '2 days ago',
            icon: CheckCircle2,
        },
    ]

    // Calculate upcoming deadlines only on client side
    const getUpcomingDeadlines = () => {
        if (!mounted) return []

        return assignedMatters
            .flatMap(m => m.tasks)
            .filter(t => t.status !== 'completed')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5)
    }

    const clientInteractions: ClientInteraction[] = [
        {
            id: '1',
            client: 'TechCorp Inc.',
            type: 'meeting',
            date: '2024-08-15 10:00 AM',
            summary: 'M&A deal update and next steps',
            status: 'scheduled',
        },
        {
            id: '2',
            client: 'BioMed Solutions',
            type: 'call',
            date: '2024-08-12 2:30 PM',
            summary: 'Patent strategy discussion',
            status: 'completed',
        },
        {
            id: '3',
            client: 'Retail Ventures',
            type: 'email',
            date: '2024-08-10',
            summary: 'Sent lease counter-proposal',
            status: 'completed',
        },
    ]

    const filteredMatters = assignedMatters.filter(matter => {
        if (filter === 'all') return true
        if (filter === 'high' && matter.priority === 'high') return true
        if (filter === 'in-progress' && matter.status === 'in-progress') return true
        if (filter === 'completed' && matter.status === 'completed') return true
        if (filter === 'pending' && matter.status === 'pending-client') return true
        return false
    }).filter(matter =>
        matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matter.client.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalTasks = assignedMatters.reduce((acc, m) => acc + m.tasks.length, 0)
    const completedTasks = assignedMatters.reduce(
        (acc, m) => acc + m.tasks.filter(t => t.status === 'completed').length,
        0
    )
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Calculate days until deadline - only on client side
    const getDaysUntil = (dueDate: string) => {
        if (!mounted) return 0
        return Math.ceil(
            (new Date(dueDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
    }

    const upcomingDeadlines = getUpcomingDeadlines()

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-950">
            {/* HEADER SECTION */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-12 pb-6 sm:pb-8 border-b border-white/5"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-blue-400 mb-1 sm:mb-2">
                                    {greeting},
                                </p>
                                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-light tracking-tight text-white mb-1 truncate">
                                    {firstName}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-400 truncate">
                                    {lawFirm} — Legal Professional Dashboard
                                </p>
                                {user?.specialization && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                                        {user.specialization.slice(0, 3).map((spec, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-400"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                        {user.specialization.length > 3 && (
                                            <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-400">
                                                +{user.specialization.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats - Responsive Grid */}
                            <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-black/30 rounded-xl p-3 sm:p-4 border border-white/5 flex-shrink-0">
                                <div className="text-center">
                                    <p className="text-lg sm:text-2xl font-light text-white">
                                        {assignedMatters.length}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Active Matters</p>
                                </div>
                                <div className="w-px bg-white/10" />
                                <div className="text-center">
                                    <p className="text-lg sm:text-2xl font-light text-white">
                                        {totalTasks}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Total Tasks</p>
                                </div>
                                <div className="w-px bg-white/10" />
                                <div className="text-center">
                                    <p className="text-lg sm:text-2xl font-light text-green-400">
                                        {taskCompletionRate}%
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Completion</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-12">
                    {/* PERFORMANCE METRICS */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
                    >
                        {performanceMetrics.map((metric, idx) => {
                            const Icon = metric.icon
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
                                >
                                    <Card hover className="h-full">
                                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                                            <span className="text-[10px] sm:text-xs text-green-400">+{metric.trend}%</span>
                                        </div>
                                        <p className="text-lg sm:text-2xl font-light text-white mb-0.5 sm:mb-1">
                                            {metric.value}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">{metric.label}</p>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </motion.div>

                    {/* UPCOMING DEADLINES */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <Card>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <SectionTitle>Upcoming Deadlines</SectionTitle>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400" />
                                        <span>High</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400" />
                                        <span>Medium</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400" />
                                        <span>Low</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                {upcomingDeadlines.map((task, idx) => {
                                    const daysUntil = getDaysUntil(task.dueDate)
                                    const isUrgent = daysUntil <= 3
                                    return (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: 0.35 + idx * 0.05 }}
                                            className={`p-3 sm:p-4 rounded-lg border ${isUrgent
                                                ? 'bg-red-500/5 border-red-500/20'
                                                : 'bg-white/5 border-white/5'
                                                }`}
                                            suppressHydrationWarning
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                                                <p className="text-xs sm:text-sm font-medium text-white line-clamp-2 flex-1">
                                                    {task.title}
                                                </p>
                                                <PriorityBadge priority={task.priority} />
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-gray-400 mb-1.5 sm:mb-2">
                                                {task.matterId && assignedMatters.find(m => m.id === task.matterId)?.client}
                                            </p>
                                            <div className="flex flex-wrap items-center justify-between gap-1">
                                                <span className={`text-[10px] sm:text-xs ${isUrgent ? 'text-red-400' : 'text-gray-500'}`} suppressHydrationWarning>
                                                    {mounted ? (
                                                        isUrgent ? `${daysUntil} day${daysUntil !== 1 ? 's' : ''} left` : `Due ${new Date(task.dueDate).toLocaleDateString()}`
                                                    ) : (
                                                        'Loading...'
                                                    )}
                                                </span>
                                                <TaskStatusBadge status={task.status} />
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </Card>
                    </motion.div>

                    {/* ASSIGNED MATTERS */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                    >
                        <Card>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <SectionTitle>Assigned Matters</SectionTitle>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <div className="relative w-full sm:w-auto">
                                        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Search matters..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full sm:w-48 lg:w-56 pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-black/30 border border-white/10 rounded-lg text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-400/50 transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {['all', 'high', 'in-progress', 'pending', 'completed'].map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded-lg transition-colors whitespace-nowrap ${filter === f
                                                        ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30'
                                                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                                {filteredMatters.map((matter, idx) => (
                                    <motion.div
                                        key={matter.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.45 + idx * 0.05 }}
                                        className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/5 hover:border-blue-400/30 transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm sm:text-base font-medium text-white mb-0.5 sm:mb-1 truncate">
                                                            {matter.title}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-gray-400">
                                                            <span>{matter.type}</span>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="text-white truncate max-w-[120px] sm:max-w-none">{matter.client}</span>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="truncate max-w-[100px] sm:max-w-none">Due: {new Date(matter.dueDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 line-clamp-2">
                                                            {matter.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                                                <PriorityBadge priority={matter.priority} />
                                                <StatusBadge status={matter.status} />
                                                <div className="hidden sm:flex items-center gap-2">
                                                    <span className="text-[10px] sm:text-xs text-gray-400">{matter.progress}%</span>
                                                    <div className="w-16 sm:w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${matter.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <button className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[10px] sm:text-xs hover:bg-blue-400/20 transition-colors whitespace-nowrap">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tasks Summary - Responsive */}
                                        {matter.tasks.length > 0 && (
                                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5">
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                                    <p className="text-[10px] sm:text-xs font-medium text-gray-400">Tasks:</p>
                                                    {matter.tasks.map((task, tIdx) => (
                                                        <div key={task.id} className="flex items-center gap-1.5 sm:gap-2">
                                                            <span className={`text-[10px] sm:text-xs ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'} truncate max-w-[80px] sm:max-w-none`}>
                                                                {task.title}
                                                            </span>
                                                            <TaskStatusBadge status={task.status} />
                                                            {tIdx < matter.tasks.length - 1 && (
                                                                <span className="text-gray-600 hidden sm:inline">•</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {filteredMatters.length === 0 && (
                                    <div className="text-center py-8 sm:py-12">
                                        <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-600" />
                                        <p className="text-xs sm:text-sm text-gray-500">No matters found matching your filters</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    {/* TWO COLUMN LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* RECENT ACTIVITY */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                        >
                            <Card>
                                <SectionTitle>Recent Activity</SectionTitle>
                                <div className="space-y-3 sm:space-y-4">
                                    {recentActivities.map((activity, idx) => {
                                        const Icon = activity.icon
                                        return (
                                            <motion.div
                                                key={activity.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.55 + idx * 0.05 }}
                                                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/5 hover:border-blue-400/30 transition-colors"
                                            >
                                                <div className="mt-0.5 p-1.5 sm:p-2 rounded-lg bg-blue-400/10 border border-blue-400/20 flex-shrink-0">
                                                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm text-white truncate">
                                                        {activity.action}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                                                        {activity.matter} • {activity.timestamp}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </Card>
                        </motion.div>

                        {/* CLIENT INTERACTIONS */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.55 }}
                        >
                            <Card>
                                <SectionTitle>Client Interactions</SectionTitle>
                                <div className="space-y-3 sm:space-y-4">
                                    {clientInteractions.map((interaction, idx) => (
                                        <motion.div
                                            key={interaction.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: 0.6 + idx * 0.05 }}
                                            className="p-2 sm:p-3 rounded-lg bg-white/5 border border-white/5 hover:border-blue-400/30 transition-colors"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs sm:text-sm font-medium text-white truncate">
                                                        {interaction.client}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-gray-500">
                                                        {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap ${interaction.status === 'scheduled'
                                                        ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                                                        : 'bg-green-500/10 text-green-400 border border-green-400/20'
                                                    }`}>
                                                    {interaction.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-gray-400 truncate">{interaction.summary}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2">{interaction.date}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* QUICK ACTIONS */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.65 }}
                    >
                        <SectionTitle>Quick Actions</SectionTitle>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                            {[
                                { label: 'New Case', icon: Briefcase },
                                { label: 'Draft Document', icon: FileText },
                                { label: 'Schedule Meeting', icon: Calendar },
                                { label: 'Add Note', icon: MessageCircle },
                                { label: 'Review Case', icon: Eye },
                                { label: 'Generate Report', icon: PieChart },
                            ].map((action, idx) => {
                                const Icon = action.icon
                                return (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.67 + idx * 0.02 }}
                                        className="p-3 sm:p-4 rounded-xl border border-white/8 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-all duration-300 group"
                                    >
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] sm:text-xs font-medium text-center text-white line-clamp-2">
                                            {action.label}
                                        </p>
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}