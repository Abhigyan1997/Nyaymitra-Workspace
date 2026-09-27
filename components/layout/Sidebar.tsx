'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
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
  Scale,
  Menu,
  X,
  Lock,
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

type BadgeKey =
  | 'documents'
  | 'compliance'
  | 'contracts'
  | 'legalRequests'
  | 'team'
  | null

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badgeKey: BadgeKey
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: BarChart3, href: '/dashboard', badgeKey: null },
  { label: 'LegalBox', icon: Lock, href: '/dashboard/documents', badgeKey: 'documents' },
  { label: 'Compliance', icon: CheckSquare, href: '/dashboard/compliance', badgeKey: 'compliance' },
  { label: 'Contracts', icon: FileCheck, href: '/dashboard/contracts', badgeKey: 'contracts' },
  { label: 'Legal Requests', icon: Briefcase, href: '/dashboard/legal-requests', badgeKey: 'legalRequests' },
  { label: 'Team', icon: Users, href: '/dashboard/team', badgeKey: 'team' },
]

const bottomItems = [
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  { label: 'Profile', icon: User, href: '/dashboard/settings?tab=profile' },
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
      <span className="text-xs text-muted-foreground opacity-60">
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
      className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${active
        ? 'bg-sidebar-primary-foreground text-sidebar-primary'
        : 'bg-sidebar-accent text-sidebar-accent-foreground'
        }`}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const [badges, setBadges] = useState<Record<string, number>>({})
  const [badgesLoading, setBadgesLoading] = useState(true)
  const [badgesError, setBadgesError] = useState('')

  // ---- Fetch badges from /dashboard/badges ----
  const fetchBadges = useCallback(async () => {
    const token = getAuthToken()

    try {
      setBadgesError('')

      const res = await fetch(`${API_BASE_URL}/dashboard/badges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error(`Badge fetch failed (${res.status})`)
      }

      const json = await res.json()
      // Expected shape: { success: true, role: 'business', data: { contracts: 4, ... } }
      const data = json?.data || {}
      setBadges(data)
    } catch (err) {
      console.error('Failed to fetch badges:', err)
      setBadgesError(
        err instanceof Error ? err.message : 'Failed to load badges'
      )
      setBadges({})
    } finally {
      setBadgesLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    void fetchBadges()
  }, [fetchBadges])

  // Refresh on route change (so counts update after mutations)
  useEffect(() => {
    void fetchBadges()
  }, [pathname, fetchBadges])

  // Load user from localStorage
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const getUserInitials = () => {
    if (!user?.fullName) return 'JD'
    const names = user.fullName.split(' ')
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (
      names[0].charAt(0) +
      names[names.length - 1].charAt(0)
    ).toUpperCase()
  }

  const getUserRole = () => {
    if (!user?.role) return 'Partner'
    return user.role.charAt(0).toUpperCase() + user.role.slice(1)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-6 border-b border-sidebar-border flex-shrink-0"
      >
        <Link href="/dashboard" className="block">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'Outfit',
                  letterSpacing: '-0.5px',
                }}
              >
                NyayMitra
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#22C55E' }}
                />
                <p
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: '#A0A0A0',
                    fontFamily: 'Outfit',
                    letterSpacing: '0.05em',
                  }}
                >
                  Business
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
        className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent"
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
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <Link
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group ${active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 ${active
                      ? 'text-sidebar-primary-foreground'
                      : 'text-muted-foreground group-hover:text-sidebar-foreground'
                      }`}
                  />
                  <span className="font-semibold text-sm">
                    {item.label}
                  </span>
                </div>

                <Badge
                  count={count}
                  loading={badgesLoading && !!item.badgeKey}
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
        className="p-4 border-t border-sidebar-border flex-shrink-0 space-y-1"
      >
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors duration-200"
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </motion.div>

      {/* User Profile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-4 border-t border-sidebar-border flex-shrink-0"
      >
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-sidebar-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sidebar-primary font-bold text-sm">
                {getUserInitials()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.fullName || 'John Doe'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getUserRole()}
            </p>
          </div>
        </div>
      </motion.div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
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
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="lg:hidden fixed top-0 left-0 w-72 h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden z-50 shadow-2xl"
          >
            <div className="pt-16 flex flex-col h-full">
              <SidebarContent />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}