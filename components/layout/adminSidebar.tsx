'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
    BarChart3,
    Building2,
    Users,
    FileText,
    FileCheck,
    ClipboardList,
    Scale,
    HelpCircle,
    Settings,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    BriefcaseBusiness,
} from 'lucide-react'

interface AdminUser {
    id: string
    fullName: string
    email: string
    role: string
    userId: string
    phone?: string
    profilePhoto?: string
}

type BadgeKey =
    | 'contractRequests'
    | 'unassigned'
    | 'contracts'
    | 'compliance'
    | 'team'
    | null

interface NavItem {
    label: string
    icon: React.ComponentType<{ className?: string }>
    href: string
    badgeKey: BadgeKey
}

const navItems: NavItem[] = [
    { label: 'Overview', icon: BarChart3, href: '/admin-dashboard', badgeKey: null },
    { label: 'Businesses', icon: Building2, href: '/admin-dashboard/business', badgeKey: null },
    { label: 'Lawyers', icon: Scale, href: '/admin-dashboard/lawyers', badgeKey: 'team' },
    // { label: 'Users', icon: Users, href: '/admin-dashboard/users', badgeKey: null },
    { label: 'Legal Requests', icon: ClipboardList, href: '/admin-dashboard/legal-requests', badgeKey: 'contractRequests' },
    { label: 'Contracts', icon: FileCheck, href: '/admin-dashboard/contracts', badgeKey: 'contracts' },
    { label: 'Compliance', icon: ShieldCheck, href: '/admin-dashboard/compliance', badgeKey: 'compliance' },
    { label: 'Documents', icon: FileText, href: '/admin-dashboard/documents', badgeKey: null },
    // { label: 'Consultations', icon: BriefcaseBusiness, href: '/admin-dashboard/consultations', badgeKey: null },
    { label: 'Support', icon: HelpCircle, href: '/admin-dashboard/support', badgeKey: null },
]

const bottomItems = [
    { label: 'Settings', icon: Settings, href: '/admin-dashboard/settings' },
    { label: 'Logout', icon: LogOut, href: '/logout' },
]

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'
).replace(/\/$/, '')

function getAuthToken(): string {
    if (typeof window === 'undefined') return ''
    const direct =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('userToken')
    if (direct) return direct

    try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (user.token) return user.token
            if (user.accessToken) return user.accessToken
        }
    } catch {
        // ignore
    }
    return ''
}

interface BadgeProps {
    count?: number
    loading: boolean
    active: boolean
}

function Badge({ count, loading, active }: BadgeProps) {
    if (loading) {
        return (
            <span className="text-[10px] sm:text-xs text-muted-foreground opacity-60">
                ·
            </span>
        )
    }
    if (!count) return null
    return (
        <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center ${active
                ? 'bg-sidebar-primary-foreground text-sidebar-primary'
                : 'bg-sidebar-accent text-sidebar-accent-foreground'
                }`}
        >
            {count > 99 ? '99+' : count}
        </motion.span>
    )
}

interface AdminSidebarProps {
    onMenuClick?: () => void
    isMobileOpen?: boolean
    onClose?: () => void
}

export function AdminSidebar({
    onMenuClick,
    isMobileOpen,
    onClose,
}: AdminSidebarProps) {
    const pathname = usePathname()

    const [user, setUser] = useState<AdminUser | null>(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const [badges, setBadges] = useState<Record<string, number>>({})
    const [badgesLoading, setBadgesLoading] = useState(true)

    // ---- Fetch badges ----
    const fetchBadges = useCallback(async () => {
        const token = getAuthToken()

        try {
            const res = await fetch(
                `${API_BASE_URL}/dashboard/badges`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token
                            ? { Authorization: `Bearer ${token}` }
                            : {}),
                    },
                    cache: 'no-store',
                }
            )

            if (!res.ok) {
                throw new Error(
                    `Badge fetch failed (${res.status})`
                )
            }

            const json = await res.json()
            setBadges(json?.data || {})
        } catch (err) {
            console.error('Failed to fetch badges:', err)
            setBadges({})
        } finally {
            setBadgesLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetchBadges()
    }, [fetchBadges])

    useEffect(() => {
        void fetchBadges()
    }, [pathname, fetchBadges])

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

    useEffect(() => {
        setIsMobileMenuOpen(false)
        if (onClose) onClose()
    }, [pathname, onClose])

    const isActive = (href: string) => {
        if (href === '/admin-dashboard') {
            return pathname === '/admin-dashboard'
        }
        return pathname.startsWith(href)
    }

    const getUserInitials = () => {
        if (!user?.fullName) return 'AD'
        const names = user.fullName.trim().split(' ')
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase()
        }
        return (
            names[0].charAt(0) +
            names[names.length - 1].charAt(0)
        ).toUpperCase()
    }

    const getUserRole = () => {
        if (!user?.role) return 'Administrator'
        return (
            user.role.charAt(0).toUpperCase() +
            user.role.slice(1)
        )
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
                <Link href="/admin-dashboard" className="block">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/20 flex-shrink-0">
                            <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                        </div>

                        <div className="min-w-0">
                            <h1
                                className="text-lg sm:text-xl font-bold tracking-tight truncate"
                                style={{
                                    color: '#FFFFFF',
                                    fontFamily: 'Outfit',
                                    letterSpacing: '-0.5px',
                                }}
                            >
                                NyayMitra
                            </h1>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span
                                    className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
                                    style={{
                                        backgroundColor: '#FBBF24',
                                    }}
                                />
                                <p
                                    className="text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate"
                                    style={{
                                        color: '#A0A0A0',
                                        fontFamily: 'Outfit',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Admin Portal
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
                {navItems.map((item, index) => {
                    const active = isActive(item.href)
                    const count = item.badgeKey
                        ? badges[item.badgeKey]
                        : undefined

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                delay: 0.15 + index * 0.05,
                            }}
                        >
                            <Link
                                href={item.href}
                                className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 group ${active
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
                                    }`}
                            >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <item.icon
                                        className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${active
                                            ? 'text-sidebar-primary-foreground'
                                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
                                            }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span className="font-semibold text-xs sm:text-sm block truncate">
                                            {item.label}
                                        </span>
                                    </div>
                                </div>

                                <Badge
                                    count={count}
                                    loading={
                                        badgesLoading &&
                                        !!item.badgeKey
                                    }
                                    active={active}
                                />
                            </Link>
                        </motion.div>
                    )
                })}
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
                        <span className="font-medium text-xs sm:text-sm">
                            {item.label}
                        </span>
                    </Link>
                ))}
            </motion.div>

            {/* Admin Profile */}
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
                            {user?.fullName || 'Administrator'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {getUserRole()}
                        </p>
                        {user?.email && (
                            <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate mt-0.5">
                                {user.email}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    )

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
        if (onMenuClick) onMenuClick()
    }

    return (
        <>
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors duration-200"
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? (
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
            </button>

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

            <motion.aside
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col h-screen overflow-hidden flex-shrink-0"
            >
                <SidebarContent />
            </motion.aside>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{
                            type: 'tween',
                            duration: 0.3,
                        }}
                        className="lg:hidden fixed top-0 left-0 w-[280px] sm:w-72 h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden z-50 shadow-2xl"
                    >
                        <div className="pt-14 sm:pt-16 flex flex-col h-full">
                            <SidebarContent />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={toggleMobileMenu}
                />
            )}
        </>
    )
}