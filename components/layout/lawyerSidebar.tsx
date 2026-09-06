'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    BarChart3,
    FileText,
    Briefcase,
    CheckSquare,
    Heart,
    Bell,
    HelpCircle,
    Users,
    Settings,
    LogOut,
    User,
    FileCheck,
    Calendar,
    MessageCircle,
    Clock,
    Award,
    BookOpen,
    Scale,
    Gavel,
    FolderOpen,
    TrendingUp,
    Menu,
    X,
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
    barNumber?: string
}

const navItems = [
    {
        label: 'Dashboard',
        icon: BarChart3,
        href: '/lawyer-dashboard',
        badge: null,
        description: 'Overview'
    },
    {
        label: 'My Matters',
        icon: Briefcase,
        href: '/lawyer-dashboard/matters',
        badge: '14',
        description: 'Active cases'
    },
    {
        label: 'Documents',
        icon: FileText,
        href: '/lawyer-dashboard/documents',
        badge: null,
        description: 'Case files'
    },
    {
        label: 'Clients',
        icon: Users,
        href: '/lawyer-dashboard/clients',
        badge: null,
        description: 'Client management'
    },
    {
        label: 'Contracts',
        icon: FileCheck,
        href: '/lawyer-dashboard/contracts',
        badge: '4',
        description: 'Legal agreements'
    },
    {
        label: 'Communications',
        icon: MessageCircle,
        href: '/lawyer-dashboard/communications',
        badge: '6',
        description: 'Messages & updates'
    },
]

const bottomItems = [
    { label: 'Settings', icon: Settings, href: '/lawyer-dashboard/settings' },
    { label: 'Profile', icon: User, href: '/lawyer-dashboard/settings?tab=profile' },
    { label: 'Logout', icon: LogOut, href: '/logout' },
]

interface LawyerSidebarProps {
    onMenuClick?: () => void
    isMobileOpen?: boolean
    onClose?: () => void
}

export function LawyerSidebar({ onMenuClick, isMobileOpen, onClose }: LawyerSidebarProps) {
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (error) {
                console.error('Failed to parse user:', error)
            }
        }
    }, [])

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false)
        if (onClose) onClose()
    }, [pathname, onClose])

    const isActive = (href: string) => {
        if (href === '/lawyer-dashboard') {
            return pathname === '/lawyer-dashboard'
        }
        return pathname.startsWith(href)
    }

    const getUserInitials = () => {
        if (!user?.fullName) return 'JD'
        const names = user.fullName.split(' ')
        if (names.length === 1) return names[0].charAt(0).toUpperCase()
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
    }

    const getUserRole = () => {
        if (!user?.role) return 'Attorney'
        return user.role.charAt(0).toUpperCase() + user.role.slice(1)
    }

    const getUserTitle = () => {
        if (user?.role) {
            return getUserRole()
        }
        return 'Attorney at Law'
    }

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="p-4 sm:p-6 border-b border-sidebar-border flex-shrink-0"
            >
                <Link href="/lawyer-dashboard" className="block">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate" style={{
                                color: '#FFFFFF',
                                fontFamily: 'Outfit',
                                letterSpacing: '-0.5px'
                            }}>
                                NyayMitra
                            </h1>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate" style={{
                                    color: '#A0A0A0',
                                    fontFamily: 'Outfit',
                                    letterSpacing: '0.05em'
                                }}>
                                    Lawyer Portal
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* Navigation */}
            <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex-1 p-2 sm:p-4 space-y-0.5 sm:space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent"
            >
                {navItems.map((item, index) => (
                    <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                    >
                        <Link
                            href={item.href}
                            className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 group ${isActive(item.href)
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
                                }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <item.icon
                                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isActive(item.href)
                                            ? 'text-sidebar-primary-foreground'
                                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
                                        }`}
                                />
                                <div className="min-w-0 flex-1">
                                    <span className="font-semibold text-xs sm:text-sm block truncate">
                                        {item.label}
                                    </span>
                                    {item.description && (
                                        <span className="text-[8px] sm:text-[10px] text-muted-foreground block truncate">
                                            {item.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {item.badge && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${isActive(item.href)
                                            ? 'bg-sidebar-primary-foreground text-sidebar-primary'
                                            : 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        }`}
                                >
                                    {item.badge}
                                </motion.span>
                            )}
                        </Link>
                    </motion.div>
                ))}
            </motion.nav>

            {/* Bottom Items */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="p-2 sm:p-4 border-t border-sidebar-border flex-shrink-0 space-y-0.5 sm:space-y-1"
            >
                {bottomItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors duration-200 group"
                    >
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-sidebar-foreground" />
                        <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                    </Link>
                ))}
            </motion.div>

            {/* User Profile */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-3 sm:p-4 border-t border-sidebar-border flex-shrink-0"
            >
                <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sidebar-primary/20 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-sidebar-primary/30">
                        {user?.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={user.fullName}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-sidebar-primary font-bold text-[10px] sm:text-sm">
                                {getUserInitials()}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-sidebar-foreground truncate">
                            {user?.fullName || 'John Doe'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1">
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                {getUserTitle()}
                            </p>
                            {user?.barNumber && (
                                <>
                                    <span className="text-[8px] sm:text-[10px] text-muted-foreground">•</span>
                                    <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">
                                        Bar: {user.barNumber}
                                    </p>
                                </>
                            )}
                        </div>
                        {user?.specialization && user.specialization.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                                {user.specialization.slice(0, 2).map((spec, idx) => (
                                    <span
                                        key={idx}
                                        className="text-[7px] sm:text-[8px] px-1 sm:px-1.5 py-0.5 rounded bg-sidebar-accent/30 text-muted-foreground"
                                    >
                                        {spec}
                                    </span>
                                ))}
                                {user.specialization.length > 2 && (
                                    <span className="text-[7px] sm:text-[8px] px-1 sm:px-1.5 py-0.5 rounded bg-sidebar-accent/30 text-muted-foreground">
                                        +{user.specialization.length - 2}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    )

    // Handle mobile toggle
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
        if (onMenuClick) onMenuClick()
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors duration-200"
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleMobileMenu}
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    />
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col h-screen overflow-hidden flex-shrink-0"
            >
                <SidebarContent />
            </motion.aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="lg:hidden fixed top-0 left-0 w-[280px] sm:w-72 h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden z-50 shadow-2xl"
                    >
                        <div className="pt-14 sm:pt-16 flex flex-col h-full">
                            <SidebarContent />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Click outside to close (backup) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={toggleMobileMenu}
                />
            )}
        </>
    )
}