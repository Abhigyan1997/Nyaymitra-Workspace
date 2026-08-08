'use client'

import { motion } from 'framer-motion'
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

const navItems = [
  { label: 'Dashboard', icon: BarChart3, href: '/dashboard', badge: null },
  // { label: 'Matters', icon: Briefcase, href: '/dashboard/matters', badge: '12' },
  { label: 'Documents', icon: FileText, href: '/dashboard/documents', badge: null },
  { label: 'Compliance', icon: CheckSquare, href: '/dashboard/compliance', badge: null },
  { label: 'Contracts', icon: FileCheck, href: '/dashboard/contracts', badge: '4' },
  { label: 'Legal Health', icon: Heart, href: '/dashboard/legal-health', badge: null },
  { label: 'Team', icon: Users, href: '/dashboard/team', badge: null },
  // { label: 'Support', icon: HelpCircle, href: '/dashboard/support', badge: '3' },
  // { label: 'Notifications', icon: Bell, href: '/dashboard/notifications', badge: '5' },
]

const bottomItems = [
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  { label: 'Profile', icon: User, href: '/dashboard/settings?tab=profile' },
  { label: 'Logout', icon: LogOut, href: '/logout' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

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

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.fullName) return 'JD'
    const names = user.fullName.split(' ')
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  // Get user role with proper formatting
  const getUserRole = () => {
    if (!user?.role) return 'Partner'
    return user.role.charAt(0).toUpperCase() + user.role.slice(1)
  }

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen overflow-hidden"
    >
      {/* Logo - Fixed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-6 border-b border-sidebar-border flex-shrink-0"
      >
        <Link href="/dashboard" className="block">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                {/* Simplified Justice Scale */}
                <line
                  x1="12"
                  y1="3"
                  x2="12"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="3"
                  y1="9"
                  x2="21"
                  y2="9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 9L1 14H5L3 9Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 9L19 14H23L21 9Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="10"
                  y1="20"
                  x2="14"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{
                color: '#FFFFFF',
                fontFamily: 'Outfit',
                letterSpacing: '-0.5px'
              }}>
                NyayMitra
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                <p className="text-xs font-medium uppercase tracking-wider" style={{
                  color: '#A0A0A0',
                  fontFamily: 'Outfit',
                  letterSpacing: '0.05em'
                }}>
                  Legal Operations
                </p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Navigation - Fixed height with overflow */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent"
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
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive(item.href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${isActive(item.href)
                    ? 'text-sidebar-primary-foreground'
                    : 'text-muted-foreground group-hover:text-sidebar-foreground'
                    }`}
                />
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive(item.href)
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

      {/* Bottom Items - Fixed */}
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

      {/* User Profile - Fixed */}
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
    </motion.aside>
  )
}