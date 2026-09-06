'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Search,
  Calendar,
  HelpCircle,
  X,
  FileText,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Clock,
  Menu,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface Notification {
  id: string
  title: string
  description: string
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  icon: any
}

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Document Uploaded',
      description: 'Vendor Agreement v2.0 has been uploaded by Priya Sharma',
      time: '5 min ago',
      type: 'info',
      read: false,
      icon: FileText,
    },
    {
      id: '2',
      title: 'Contract Expiring Soon',
      description: 'Software License Agreement expires in 7 days',
      time: '1 hour ago',
      type: 'warning',
      read: false,
      icon: AlertCircle,
    },
    {
      id: '3',
      title: 'Matter Assigned',
      description: 'IP Registration - Trademark Filing assigned to your team',
      time: '3 hours ago',
      type: 'success',
      read: false,
      icon: Briefcase,
    },
    {
      id: '4',
      title: 'Compliance Review Completed',
      description: 'FY 2023-24 Compliance Audit has been completed',
      time: '5 hours ago',
      type: 'success',
      read: true,
      icon: CheckCircle,
    },
    {
      id: '5',
      title: 'Timesheet Approval Required',
      description: '3 timesheets pending your approval',
      time: '1 day ago',
      type: 'warning',
      read: true,
      icon: Clock,
    },
  ])

  useEffect(() => {
    setMounted(true)
    setCurrentDateTime(new Date())

    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isMobileSearchOpen])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.2)' }
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' }
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' }
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' }
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        className="h-16 bg-card border-b border-border px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm"
      >
        {/* Left Section - Menu Button & Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-background transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          {/* Search Bar - Desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="hidden sm:block flex-1 max-w-xs lg:max-w-md"
          >
            <div
              className={`relative transition-all duration-200 ${isSearchActive ? 'ring-2 ring-primary/50' : ''
                }`}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search matters, documents..."
                onFocus={() => setIsSearchActive(true)}
                onBlur={() => setIsSearchActive(false)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-200"
              />
            </div>
          </motion.div>

          {/* Mobile Search Toggle */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="sm:hidden p-2 rounded-lg hover:bg-background transition-colors duration-200"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Right Side Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1 sm:gap-2 lg:gap-3 ml-2 sm:ml-4"
        >
          {/* Date & Time Badge - Hidden on small screens */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="hidden md:flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-lg bg-background border border-border hover:border-primary/50 transition-all duration-200"
            suppressHydrationWarning
          >
            <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span
                className="text-xs font-medium text-foreground truncate max-w-[120px] lg:max-w-none"
                suppressHydrationWarning
              >
                {mounted && currentDateTime ? formatDate(currentDateTime) : 'Loading...'}
              </span>
              <span
                className="text-[10px] lg:text-xs text-muted-foreground font-mono"
                suppressHydrationWarning
              >
                {mounted && currentDateTime ? formatTime(currentDateTime) : '--:--:--'}
              </span>
            </div>
          </motion.button>

          {/* Date & Time - Mobile (Compact) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="md:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-background border border-border hover:border-primary/50 transition-all duration-200"
            suppressHydrationWarning
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span
              className="text-[10px] font-medium text-foreground"
              suppressHydrationWarning
            >
              {mounted && currentDateTime ? formatShortDate(currentDateTime) : '--'}
            </span>
            <span
              className="text-[10px] text-muted-foreground font-mono"
              suppressHydrationWarning
            >
              {mounted && currentDateTime ? formatTime(currentDateTime) : '--:--'}
            </span>
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-lg hover:bg-background transition-colors duration-200"
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="fixed sm:absolute right-0 sm:right-0 top-[calc(100%+8px)] w-[calc(100vw-16px)] sm:w-96 max-w-[400px] mx-2 sm:mx-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                  style={{ backgroundColor: '#1A1A1A' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                      <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-amber-500 hover:text-amber-400 transition-colors font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg hover:bg-background transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 mx-auto text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mt-2">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const Icon = notification.icon
                        const styles = getTypeStyles(notification.type)
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 sm:p-4 border-b border-border hover:bg-background/50 transition-colors cursor-pointer ${!notification.read ? 'bg-background/30' : ''
                              }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: styles.bg,
                                  border: `1px solid ${styles.border}`,
                                }}
                              >
                                <Icon className="w-4 h-4" style={{ color: styles.text }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: styles.text }} />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {notification.description}
                                </p>
                                <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-border text-center">
                    <button className="text-xs text-amber-500 hover:text-amber-400 transition-colors font-medium">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.header>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sm:hidden fixed inset-x-0 top-0 z-50 bg-card border-b border-border p-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search matters, documents..."
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}