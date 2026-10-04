'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Search,
  Calendar,
  X,
  Info,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Clock,
  Menu,
  UserCheck,
  Scale,
  Upload,
  FileText,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = 'https://nyaymitra-backend-production.up.railway.app'

/* =========================================================
   ROLE → NOTIFICATIONS ENDPOINT
========================================================= */
const getNotificationsEndpoint = (role: string) => {
  switch (role) {
    case 'lawyer':
      return `${API_URL}/api/v1/lawyer/notifications`
    case 'admin':
      return `${API_URL}/api/v1/admin/notifications`
    case 'business':
    default:
      return `${API_URL}/api/v1/business/notifications`
  }
}

interface Notification {
  _id: string
  userId: string
  businessId?: string
  type: string
  title: string
  message: string
  link?: string | null
  isRead: boolean
  metadata?: Record<string, unknown> | null
  createdAt: string
}


interface GlobalSearchResult {
  type: string
  id: string
  title: string
  description?: string
  url?: string
  meta?: string
}

const SEARCH_TYPE_CONFIG: Record<
  string,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  business: { label: 'Business', icon: Briefcase },
  contract: { label: 'Contracts', icon: FileText },
  document: { label: 'Documents', icon: FileText },
  folder: { label: 'Folders', icon: FileText },
  compliance: { label: 'Compliance', icon: CheckCircle },
  contract_request: { label: 'Legal Requests', icon: Scale },
  team: { label: 'Team', icon: UserCheck },
}

interface TopBarProps {
  onMenuClick?: () => void
}

/* =========================================================
   TYPE → ICON
========================================================= */
const iconForType = (type: string) => {
  switch (type) {
    case 'legal_request':
      return Scale
    case 'legal_request_assignment':
      return UserCheck
    case 'document_upload':
    case 'document_uploaded':
      return Upload
    case 'matter_assigned':
      return Briefcase
    case 'compliance_completed':
      return CheckCircle
    case 'contract_expiring':
      return AlertCircle
    case 'timesheet_approval':
      return Clock
    case 'document':
      return FileText
    default:
      return Info
  }
}

/* =========================================================
   TYPE → COLOR STYLES
========================================================= */
const getTypeStyles = (type: string) => {
  if (
    type === 'legal_request_assignment' ||
    type === 'compliance_completed' ||
    type === 'matter_assigned'
  ) {
    return {
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#22C55E',
      border: 'rgba(34, 197, 94, 0.2)',
    }
  }

  if (type === 'contract_expiring' || type === 'timesheet_approval') {
    return {
      bg: 'rgba(245, 158, 11, 0.1)',
      text: '#F59E0B',
      border: 'rgba(245, 158, 11, 0.2)',
    }
  }

  if (type === 'error') {
    return {
      bg: 'rgba(239, 68, 68, 0.1)',
      text: '#EF4444',
      border: 'rgba(239, 68, 68, 0.2)',
    }
  }

  return {
    bg: 'rgba(59, 130, 246, 0.1)',
    text: '#3B82F6',
    border: 'rgba(59, 130, 246, 0.2)',
  }
}

/* =========================================================
   RELATIVE TIME
========================================================= */
const formatRelativeTime = (iso: string) => {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter()

  const [isSearchActive, setIsSearchActive] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const notificationRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const desktopSearchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  /* =========================================================
     TOKEN + ROLE HELPERS
  ========================================================= */
  const getToken = () => {
    if (typeof window === 'undefined') return ''
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    )
  }

  const getRole = () => {
    if (typeof window === 'undefined') return 'business'
    return (
      localStorage.getItem('role') ||
      localStorage.getItem('userRole') ||
      'business'
    ).toLowerCase()
  }


  /* =========================================================
     BUSINESS GLOBAL SEARCH
     Uses the authenticated user's business workspace.
  ========================================================= */
  const fetchSearchResults = useCallback(async (query: string) => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      setSearchResults([])
      setSearchError('')
      setSearchLoading(false)
      return
    }

    try {
      setSearchLoading(true)
      setSearchError('')

      const token = getToken()

      const params = new URLSearchParams({
        q: trimmedQuery,
        limit: '10',
      })

      const response = await fetch(
        `${API_URL}/api/v1/business/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          cache: 'no-store',
        }
      )

      const result = await response.json()

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || `Search failed (${response.status})`
        )
      }

      const results = Array.isArray(result?.data?.results)
        ? result.data.results
        : []

      setSearchResults(results)
    } catch (err) {
      console.error('Business global search error:', err)

      setSearchResults([])
      setSearchError(
        err instanceof Error ? err.message : 'Failed to search workspace'
      )
    } finally {
      setSearchLoading(false)
    }
  }, [])

  /* Debounced search */
  useEffect(() => {
    const value = searchQuery.trim()

    if (value.length < 2) {
      setSearchResults([])
      setSearchError('')
      setSearchLoading(false)
      return
    }

    const timer = window.setTimeout(() => {
      void fetchSearchResults(value)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchQuery, fetchSearchResults])

  /* Close search dropdown when clicking outside */
  useEffect(() => {
    const handleSearchOutside = (event: MouseEvent) => {
      const target = event.target as Node

      const insideDesktop =
        desktopSearchRef.current?.contains(target) ?? false

      const insideMobile =
        mobileSearchRef.current?.contains(target) ?? false

      if (!insideDesktop && !insideMobile) {
        setIsSearchActive(false)
      }
    }

    document.addEventListener('mousedown', handleSearchOutside)

    return () => {
      document.removeEventListener('mousedown', handleSearchOutside)
    }
  }, [])

  /* Ctrl/Cmd + K focuses the top-bar search */
  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault()
        setIsMobileSearchOpen(false)
        setIsSearchActive(true)
        window.setTimeout(() => {
          searchInputRef.current?.focus()
        }, 0)
      }

      if (event.key === 'Escape') {
        setIsSearchActive(false)
        setSearchQuery('')
        setSearchResults([])
        searchInputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleSearchShortcut)

    return () => {
      document.removeEventListener('keydown', handleSearchShortcut)
    }
  }, [])

  const handleSearchResultClick = (result: GlobalSearchResult) => {
    if (!result.url) return

    setIsSearchActive(false)
    setIsMobileSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')

    router.push(result.url)
  }

  const groupedSearchResults = searchResults.reduce<
    Record<string, GlobalSearchResult[]>
  >((groups, result) => {
    const key = result.type || 'other'

    if (!groups[key]) {
      groups[key] = []
    }

    groups[key].push(result)

    return groups
  }, {})

  const renderSearchDropdown = (mobile = false) => {
    if (
      !isSearchActive ||
      searchQuery.trim().length < 2
    ) {
      return null
    }

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          className={`absolute z-[100] overflow-hidden rounded-xl border border-border bg-card shadow-2xl ${mobile
            ? 'left-0 right-0 top-[calc(100%+8px)]'
            : 'left-0 right-0 top-[calc(100%+8px)]'
            }`}
        >
          {searchLoading && searchResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Searching your workspace...
            </div>
          ) : searchError ? (
            <div className="px-4 py-6 text-center text-sm text-red-400">
              {searchError}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-4 py-7 text-center">
              <Search className="w-5 h-5 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-foreground">
                No results found
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try contracts, documents, compliance, team members or legal requests.
              </p>
            </div>
          ) : (
            <div className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
              {Object.entries(groupedSearchResults).map(
                ([type, items]) => {
                  const config =
                    SEARCH_TYPE_CONFIG[type] || {
                      label: type,
                      icon: Search,
                    }

                  const TypeIcon = config.icon

                  return (
                    <div key={type} className="mb-2 last:mb-0">
                      <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
                        {config.label}
                      </div>

                      {items.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault()
                          }}
                          onClick={() => handleSearchResultClick(result)}
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-background"
                        >
                          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                            <TypeIcon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {result.title}
                            </p>

                            {result.description && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {result.description}
                              </p>
                            )}

                            {result.meta && (
                              <p className="mt-1 truncate text-[10px] text-muted-foreground/60">
                                {result.meta}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                }
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  /* =========================================================
     FETCH NOTIFICATIONS
     Picks the endpoint based on the current role so the
     same TopBar works for business, lawyer, and admin.
  ========================================================= */
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true)
      const token = getToken()
      if (!token) return

      const role = getRole()
      const endpoint = getNotificationsEndpoint(role)

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('Failed to fetch notifications:', result.message)
        return
      }

      setNotifications(result.data?.notifications || [])
      setUnreadCount(result.data?.unreadCount || 0)
    } catch (err) {
      console.error('Fetch notifications error:', err)
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  /* Initial fetch + poll every 60s */
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  /* Clock */
  useEffect(() => {
    setMounted(true)
    setCurrentDateTime(new Date())

    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () =>
      document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* Focus mobile search */
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isMobileSearchOpen])

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

  /* =========================================================
     MARK ONE AS READ
     Same role-based endpoint logic.
  ========================================================= */
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      const token = getToken()
      const role = getRole()
      const base = getNotificationsEndpoint(role)

      await fetch(`${base}/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      console.error('markAsRead error:', err)
    }
  }

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      const token = getToken()
      const role = getRole()
      const base = getNotificationsEndpoint(role)

      await fetch(`${base}/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      console.error('markAllAsRead error:', err)
    }
  }

  /* =========================================================
     CLICK HANDLER — mark read + navigate to stored link.
  ========================================================= */
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }

    if (notification.link) {
      setShowNotifications(false)
      router.push(notification.link)
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
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="hidden sm:block flex-1 max-w-xs lg:max-w-md"
            ref={desktopSearchRef}
          >
            <div className="relative">
              <div
                className={`relative transition-all duration-200 ${isSearchActive
                  ? 'ring-2 ring-primary/50 rounded-lg'
                  : ''
                  }`}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  placeholder="Search contracts, documents..."
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setIsSearchActive(true)
                  }}
                  onFocus={() => setIsSearchActive(true)}
                  className="w-full pl-10 pr-16 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-200"
                />

                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-amber-500" />
                  </div>
                )}

                {!searchLoading && searchQuery && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setSearchError('')
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {!searchQuery && (
                  <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground lg:block">
                    ⌘K
                  </span>
                )}
              </div>

              {renderSearchDropdown()}
            </div>
          </motion.div>

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

        {/* Right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1 sm:gap-2 lg:gap-3 ml-2 sm:ml-4"
        >
          {/* Date/time desktop */}
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
                {mounted && currentDateTime
                  ? formatDate(currentDateTime)
                  : 'Loading...'}
              </span>
              <span
                className="text-[10px] lg:text-xs text-muted-foreground font-mono"
                suppressHydrationWarning
              >
                {mounted && currentDateTime
                  ? formatTime(currentDateTime)
                  : '--:--:--'}
              </span>
            </div>
          </motion.button>

          {/* Date/time mobile */}
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
              {mounted && currentDateTime
                ? formatShortDate(currentDateTime)
                : '--'}
            </span>
            <span
              className="text-[10px] text-muted-foreground font-mono"
              suppressHydrationWarning
            >
              {mounted && currentDateTime
                ? formatTime(currentDateTime)
                : '--:--'}
            </span>
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-lg hover:bg-background transition-colors duration-200"
              title="Notifications"
              onClick={() => {
                const next = !showNotifications
                setShowNotifications(next)
                if (next) fetchNotifications()
              }}
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

            {/* Dropdown */}
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
                      <h3 className="text-sm font-semibold text-foreground">
                        Notifications
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {unreadCount} unread
                      </p>
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

                  {/* List */}
                  <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                    {notificationsLoading && notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 animate-pulse" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Loading...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 mx-auto text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mt-2">
                          No notifications
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const Icon = iconForType(notification.type)
                        const styles = getTypeStyles(notification.type)

                        return (
                          <motion.div
                            key={notification._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 sm:p-4 border-b border-border hover:bg-background/50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-background/30' : ''
                              }`}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: styles.bg,
                                  border: `1px solid ${styles.border}`,
                                }}
                              >
                                <Icon
                                  className="w-4 h-4"
                                  style={{ color: styles.text }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <span
                                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                      style={{ backgroundColor: styles.text }}
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                                  {formatRelativeTime(
                                    notification.createdAt
                                  )}
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

      {/* Mobile search overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sm:hidden fixed inset-x-0 top-0 z-50 bg-card border-b border-border p-4 shadow-xl"
            ref={mobileSearchRef}
          >
            <div className="relative flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  placeholder="Search contracts, documents..."
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setIsSearchActive(true)
                  }}
                  onFocus={() => setIsSearchActive(true)}
                  className="w-full pl-10 pr-12 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-amber-500" />
                  </div>
                )}

                {!searchLoading && searchQuery && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setSearchError('')
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchOpen(false)
                  setIsSearchActive(false)
                }}
                className="p-2 rounded-lg hover:bg-background transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {renderSearchDropdown(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}