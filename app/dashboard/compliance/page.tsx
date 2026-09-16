'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  motion,
  AnimatePresence,
} from 'framer-motion'

import {
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Save,
  Loader2,
} from 'lucide-react'

import { ComplianceCard } from '@/components/compliance/ComplianceCard'

const API_URL = 'https://nyaymitra-backend-production.up.railway.app'

/* =========================================================
   TYPES
========================================================= */

interface AssignedTo {
  _id: string
  fullName: string
  email: string
  role: string
}

interface ComplianceItem {
  _id: string
  id?: string

  name: string
  organization?: string

  category: string

  description: string

  assignedTo?: AssignedTo | null
  assignedProfessional: string

  dueDate: string

  status:
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'overdue'

  priority:
  | 'low'
  | 'medium'
  | 'high'

  relatedDocuments: number

  recurring: boolean
  recurrence?: string | null

  completedAt?: string | null
  completedBy?: string | null

  createdAt?: string
  updatedAt?: string
}

interface ComplianceStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
}

interface ComplianceResponse {
  success: boolean
  data: {
    items: ComplianceItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  message?: string
}

interface SingleComplianceResponse {
  success: boolean
  data: {
    item: ComplianceItem
  } | ComplianceItem
  message?: string
}

interface StatsResponse {
  success: boolean
  data: ComplianceStats
  message?: string
}

/* =========================================================
   FORM
========================================================= */

interface ComplianceForm {
  name: string
  organization: string
  category: string
  description: string
  assignedTo: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  recurring: boolean
  recurrence: string
}

const emptyForm: ComplianceForm = {
  name: '',
  organization: '',
  category: 'other',
  description: '',
  assignedTo: '',
  dueDate: '',
  priority: 'medium',
  recurring: false,
  recurrence: '',
}

/* =========================================================
   PAGE
========================================================= */

export default function CompliancePage() {
  /* =========================================================
     DATA
  ========================================================= */

  const [compliance, setCompliance] =
    useState<ComplianceItem[]>([])

  const [stats, setStats] =
    useState<ComplianceStats>({
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    })

  /* =========================================================
     FILTERS
  ========================================================= */

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] =
    useState('all')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] =
    useState(1)

  const [totalItems, setTotalItems] =
    useState(0)

  const limit = 10

  /* =========================================================
     UI STATES
  ========================================================= */

  const [loading, setLoading] =
    useState(true)

  const [statsLoading, setStatsLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [error, setError] =
    useState('')

  const [statsError, setStatsError] =
    useState('')

  /* =========================================================
     MODAL
  ========================================================= */

  const [showModal, setShowModal] =
    useState(false)

  const [modalMode, setModalMode] =
    useState<'create' | 'edit' | 'view'>(
      'create'
    )

  const [selectedId, setSelectedId] =
    useState<string | null>(null)

  const [selectedItem, setSelectedItem] =
    useState<ComplianceItem | null>(null)

  /* =========================================================
     FORM
  ========================================================= */

  const [form, setForm] =
    useState<ComplianceForm>(emptyForm)

  const [formLoading, setFormLoading] =
    useState(false)

  const [formError, setFormError] =
    useState('')

  /* =========================================================
     DELETE
  ========================================================= */

  const [deleteLoading, setDeleteLoading] =
    useState(false)

  /* =========================================================
     STATUS
  ========================================================= */

  const [statusLoading, setStatusLoading] =
    useState<string | null>(null)

  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = () => {
    if (typeof window === 'undefined') {
      return ''
    }

    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    )
  }

  /* =========================================================
     HEADERS
  ========================================================= */

  const getHeaders = () => {
    const token = getToken()

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  /* =========================================================
     GET COMPLIANCE LIST
  ========================================================= */

  const fetchCompliance =
    useCallback(async () => {
      try {
        setLoading(true)
        setError('')

        const token = getToken()

        if (!token) {
          setError(
            'Authentication token not found. Please login again.'
          )
          return
        }

        const params = new URLSearchParams()

        params.append('page', String(page))
        params.append('limit', String(limit))

        if (search.trim()) {
          params.append(
            'search',
            search.trim()
          )
        }

        if (filterStatus !== 'all') {
          params.append(
            'status',
            filterStatus
          )
        }

        const response = await fetch(
          `${API_URL}/api/v1/compliance?${params.toString()}`,
          {
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-store',
          }
        )

        const result: ComplianceResponse =
          await response.json()

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Failed to fetch compliance items'
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
            'Failed to fetch compliance items'
          )
        }

        setCompliance(
          result.data?.items || []
        )

        setTotalPages(
          result.data?.pagination
            ?.totalPages || 1
        )

        setTotalItems(
          result.data?.pagination?.total ||
          0
        )
      } catch (err) {
        console.error(
          'Fetch compliance error:',
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load compliance items'
        )

        setCompliance([])
      } finally {
        setLoading(false)
      }
    }, [
      page,
      search,
      filterStatus,
    ])

  /* =========================================================
     GET STATS
  ========================================================= */

  const fetchStats =
    useCallback(async () => {
      try {
        setStatsLoading(true)
        setStatsError('')

        const token = getToken()

        if (!token) {
          setStatsError(
            'Authentication token not found.'
          )
          return
        }

        const response = await fetch(
          `${API_URL}/api/v1/compliance/stats`,
          {
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-store',
          }
        )

        const result: StatsResponse =
          await response.json()

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Failed to fetch compliance stats'
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
            'Failed to fetch compliance stats'
          )
        }

        setStats({
          total: result.data?.total || 0,
          pending:
            result.data?.pending || 0,
          inProgress:
            result.data?.inProgress || 0,
          completed:
            result.data?.completed || 0,
          overdue:
            result.data?.overdue || 0,
        })
      } catch (err) {
        console.error(
          'Stats error:',
          err
        )

        setStatsError(
          err instanceof Error
            ? err.message
            : 'Failed to load statistics'
        )
      } finally {
        setStatsLoading(false)
      }
    }, [])

  /* =========================================================
     GET SINGLE COMPLIANCE
  ========================================================= */

  const fetchComplianceById =
    async (id: string) => {
      try {
        setFormLoading(true)
        setFormError('')

        const response = await fetch(
          `${API_URL}/api/v1/compliance/${id}`,
          {
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-store',
          }
        )

        const result: any =
          await response.json()

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Failed to fetch compliance item'
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
            'Failed to fetch compliance item'
          )
        }

        // Handle both response formats
        const item = result.data?.item || result.data

        if (!item) {
          throw new Error(
            'No item data in response'
          )
        }

        setSelectedItem(item)

        setForm({
          name: item.name || '',
          organization:
            item.organization || '',
          category:
            item.category || 'other',
          description:
            item.description || '',
          assignedTo:
            item.assignedTo?._id || '',
          dueDate: item.dueDate
            ? item.dueDate.substring(0, 10)
            : '',
          priority:
            item.priority || 'medium',
          recurring:
            item.recurring || false,
          recurrence:
            item.recurrence || '',
        })
      } catch (err) {
        console.error(
          'Fetch single compliance error:',
          err
        )

        setFormError(
          err instanceof Error
            ? err.message
            : 'Failed to load compliance item'
        )
      } finally {
        setFormLoading(false)
      }
    }

  /* =========================================================
     VIEW
  ========================================================= */

  const openViewModal = async (
    id: string
  ) => {
    setModalMode('view')
    setSelectedId(id)
    setSelectedItem(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)

    await fetchComplianceById(id)
  }

  /* =========================================================
     EDIT
  ========================================================= */

  const openEditModal = async (
    id: string
  ) => {
    setModalMode('edit')
    setSelectedId(id)
    setSelectedItem(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)

    await fetchComplianceById(id)
  }

  /* =========================================================
     CREATE
  ========================================================= */

  const createCompliance =
    async () => {
      try {
        setFormLoading(true)
        setFormError('')

        if (!form.name.trim()) {
          setFormError(
            'Compliance name is required.'
          )
          return
        }

        if (!form.dueDate) {
          setFormError(
            'Due date is required.'
          )
          return
        }

        const payload: Record<
          string,
          unknown
        > = {
          name: form.name.trim(),
          organization:
            form.organization.trim(),
          category: form.category,
          description:
            form.description.trim(),
          dueDate: form.dueDate,
          priority: form.priority,
          recurring: form.recurring,
        }

        if (form.assignedTo) {
          payload.assignedTo =
            form.assignedTo
        }

        if (
          form.recurring &&
          form.recurrence
        ) {
          payload.recurrence =
            form.recurrence
        }

        const response = await fetch(
          `${API_URL}/api/v1/compliance`,
          {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }
        )

        const result =
          await response.json()

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Failed to create compliance item'
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
            'Failed to create compliance item'
          )
        }

        closeModal()

        await Promise.all([
          fetchCompliance(),
          fetchStats(),
        ])
      } catch (err) {
        console.error(
          'Create compliance error:',
          err
        )

        setFormError(
          err instanceof Error
            ? err.message
            : 'Failed to create compliance item'
        )
      } finally {
        setFormLoading(false)
      }
    }

  /* =========================================================
     UPDATE
  ========================================================= */

  const updateCompliance =
    async () => {
      if (!selectedId) return

      try {
        setFormLoading(true)
        setFormError('')

        if (!form.name.trim()) {
          setFormError(
            'Compliance name is required.'
          )
          return
        }

        if (!form.dueDate) {
          setFormError(
            'Due date is required.'
          )
          return
        }

        const payload: Record<
          string,
          unknown
        > = {
          name: form.name.trim(),
          organization:
            form.organization.trim(),
          category: form.category,
          description:
            form.description.trim(),
          dueDate: form.dueDate,
          priority: form.priority,
          recurring: form.recurring,
          assignedTo:
            form.assignedTo || null,
          recurrence:
            form.recurring &&
              form.recurrence
              ? form.recurrence
              : null,
        }

        const response = await fetch(
          `${API_URL}/api/v1/compliance/${selectedId}`,
          {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }
        )

        const result =
          await response.json()

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Failed to update compliance item'
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
            'Failed to update compliance item'
          )
        }

        closeModal()

        await Promise.all([
          fetchCompliance(),
          fetchStats(),
        ])
      } catch (err) {
        console.error(
          'Update compliance error:',
          err
        )

        setFormError(
          err instanceof Error
            ? err.message
            : 'Failed to update compliance item'
        )
      } finally {
        setFormLoading(false)
      }
    }

  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const updateStatus =
    async (
      id: string,
      status:
        | 'pending'
        | 'in-progress'
        | 'completed'
        | 'overdue'
    ) => {
      try {
        setStatusLoading(id)
        setError('')

        const response = await fetch(
          `${API_URL}/api/v1/compliance/${id}/status`,
          {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
              status,
            }),
          }
        )

        const result =
          await response.json()

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Failed to update status'
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
            'Failed to update status'
          )
        }

        await Promise.all([
          fetchCompliance(),
          fetchStats(),
        ])
      } catch (err) {
        console.error(
          'Status update error:',
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to update status'
        )
      } finally {
        setStatusLoading(null)
      }
    }

  /* =========================================================
     DELETE
  ========================================================= */

  const deleteCompliance =
    async (id: string) => {
      const confirmed =
        window.confirm(
          'Are you sure you want to delete this compliance item? This action cannot be undone.'
        )

      if (!confirmed) return

      try {
        setDeleteLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}/api/v1/compliance/${id}`,
          {
            method: 'DELETE',
            headers: getHeaders(),
          }
        )

        const result =
          await response.json()

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Failed to delete compliance item'
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
            'Failed to delete compliance item'
          )
        }

        if (
          compliance.length === 1 &&
          page > 1
        ) {
          setPage(
            (current) =>
              Math.max(1, current - 1)
          )
        } else {
          await fetchCompliance()
        }

        await fetchStats()
      } catch (err) {
        console.error(
          'Delete compliance error:',
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to delete compliance item'
        )
      } finally {
        setDeleteLoading(false)
      }
    }

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    setShowModal(false)
    setSelectedId(null)
    setSelectedItem(null)
    setForm(emptyForm)
    setFormError('')
  }

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true)

        await Promise.all([
          fetchCompliance(),
          fetchStats(),
        ])
      } finally {
        setRefreshing(false)
      }
    }

  /* =========================================================
     EFFECTS
  ========================================================= */

  useEffect(() => {
    fetchCompliance()
  }, [fetchCompliance])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearchChange = (
    value: string
  ) => {
    setSearch(value)

    if (page !== 1) {
      setPage(1)
    }
  }

  /* =========================================================
     FILTER
  ========================================================= */

  const handleStatusChange = (
    status: string
  ) => {
    setFilterStatus(status)

    if (page !== 1) {
      setPage(1)
    }
  }

  /* =========================================================
     CREATE MODAL
  ========================================================= */

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedId(null)
    setSelectedItem(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  /* =========================================================
     STATUS FORMAT
  ========================================================= */

  const formatStatus = (
    status: string
  ) => {
    if (status === 'all') {
      return 'All'
    }

    return (
      status.charAt(0).toUpperCase() +
      status
        .slice(1)
        .replace('-', ' ')
    )
  }

  const statuses = [
    'all',
    'pending',
    'in-progress',
    'overdue',
    'completed',
  ] as const

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-display-lg font-bold text-foreground mb-3">
              Compliance Tracker
            </h1>

            <p className="text-body-md text-muted-foreground">
              Manage compliance deadlines and track your legal obligations
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing
                  ? 'animate-spin'
                  : ''
                  }`}
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </motion.button>

            {/* Add */}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </motion.button>
          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total */}

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-label-md mb-3 text-muted-foreground">
              Total Items
            </p>

            {statsLoading ? (
              <div className="h-9 w-16 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-display-md font-bold text-foreground">
                {stats.total}
              </p>
            )}
          </div>

          {/* Pending */}

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-yellow-500" />

              <p className="text-label-md text-muted-foreground">
                Pending
              </p>
            </div>

            {statsLoading ? (
              <div className="h-9 w-16 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-display-md font-bold text-foreground">
                {stats.pending}
              </p>
            )}
          </div>

          {/* Overdue */}

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-500" />

              <p className="text-label-md text-muted-foreground">
                Overdue
              </p>
            </div>

            {statsLoading ? (
              <div className="h-9 w-16 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-display-md font-bold text-red-500">
                {stats.overdue}
              </p>
            )}
          </div>

          {/* Completed */}

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-accent" />

              <p className="text-label-md text-muted-foreground">
                Completed
              </p>
            </div>

            {statsLoading ? (
              <div className="h-9 w-16 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-display-md font-bold text-accent">
                {stats.completed}
              </p>
            )}
          </div>
        </div>

        {statsError && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {statsError}
          </div>
        )}

        {/* SEARCH */}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search compliance items..."
            value={search}
            onChange={(e) =>
              handleSearchChange(
                e.target.value
              )
            }
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* FILTER */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6"
        >
          {statuses.map((status) => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                handleStatusChange(status)
              }
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${filterStatus === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/50'
                }`}
            >
              {formatStatus(status)}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* ERROR */}

      {error && (
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="flex items-center justify-between gap-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />

            <p className="text-sm">
              {error}
            </p>
          </div>

          <button
            onClick={fetchCompliance}
            className="text-sm font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-8 animate-pulse"
              >
                <div className="h-5 bg-muted rounded w-2/3 mb-4" />

                <div className="h-4 bg-muted rounded w-1/3 mb-6" />

                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            )
          )}
        </div>
      ) : compliance.length > 0 ? (
        <>
          {/* CARDS */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {compliance.map(
              (item, index) => (
                <motion.div
                  key={item._id}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  className="h-full"
                >
                  <ComplianceCard
                    item={{
                      ...item,
                      id: item._id,
                      organization:
                        item.organization ||
                        '',
                    }}
                    onView={
                      openViewModal
                    }
                    onEdit={
                      openEditModal
                    }
                    onDelete={
                      deleteCompliance
                    }
                  />

                  {/* STATUS ACTIONS */}

                  <div className="mt-3 flex items-center gap-2">
                    {item.status !==
                      'completed' && (
                        <button
                          disabled={
                            statusLoading ===
                            item._id
                          }
                          onClick={() =>
                            updateStatus(
                              item._id,
                              'completed'
                            )
                          }
                          className="text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {statusLoading ===
                            item._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Mark Completed'
                          )}
                        </button>
                      )}

                    {item.status ===
                      'pending' && (
                        <button
                          disabled={
                            statusLoading ===
                            item._id
                          }
                          onClick={() =>
                            updateStatus(
                              item._id,
                              'in-progress'
                            )
                          }
                          className="text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          Start
                        </button>
                      )}
                  </div>
                </motion.div>
              )
            )}
          </motion.div>

          {/* PAGINATION */}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {compliance.length}
                </span>{' '}
                of{' '}
                <span className="font-medium text-foreground">
                  {totalItems}
                </span>{' '}
                items
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                    )
                  }
                  className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Previous
                </button>

                <div className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  {page}
                </div>

                <button
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                    )
                  }
                  className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* EMPTY */

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-card border border-border rounded-lg"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">
            No compliance items found
          </h3>

          <p className="text-sm text-muted-foreground mb-5">
            {search ||
              filterStatus !== 'all'
              ? 'Try changing your search or status filter.'
              : 'Create your first compliance item to start tracking your obligations.'}
          </p>

          {!search &&
            filterStatus === 'all' && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Compliance Item
              </button>
            )}
        </motion.div>
      )}

      {/* =====================================================
          MODAL
      ===================================================== */}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeModal()
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl"
            >
              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {modalMode ===
                      'create'
                      ? 'Add Compliance Item'
                      : modalMode ===
                        'edit'
                        ? 'Edit Compliance Item'
                        : 'Compliance Details'}
                  </h2>

                  <p className="text-sm text-muted-foreground mt-1">
                    {modalMode ===
                      'create'
                      ? 'Create a new compliance obligation'
                      : modalMode ===
                        'edit'
                        ? 'Update compliance information'
                        : 'View compliance obligation details'}
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* BODY */}

              <div className="p-6">
                {formLoading &&
                  !selectedItem &&
                  modalMode !== 'create' ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Error */}

                    {formError && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />

                        {formError}
                      </div>
                    )}

                    {/* Name */}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Compliance Name *
                      </label>

                      <input
                        type="text"
                        value={form.name}
                        disabled={
                          modalMode ===
                          'view'
                        }
                        onChange={(e) =>
                          setForm(
                            (current) => ({
                              ...current,
                              name: e.target
                                .value,
                            })
                          )
                        }
                        placeholder="e.g. Annual ROC Filing"
                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                      />
                    </div>

                    {/* Organization */}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization
                      </label>

                      <input
                        type="text"
                        value={
                          form.organization
                        }
                        disabled={
                          modalMode ===
                          'view'
                        }
                        onChange={(e) =>
                          setForm(
                            (current) => ({
                              ...current,
                              organization:
                                e.target
                                  .value,
                            })
                          )
                        }
                        placeholder="e.g. NyayMitra Technologies Pvt Ltd"
                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                      />
                    </div>

                    {/* Category + Priority */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Category
                        </label>

                        <select
                          value={
                            form.category
                          }
                          disabled={
                            modalMode ===
                            'view'
                          }
                          onChange={(e) =>
                            setForm(
                              (current) => ({
                                ...current,
                                category:
                                  e.target
                                    .value,
                              })
                            )
                          }
                          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        >
                          <option value="corporate">
                            Corporate
                          </option>
                          <option value="tax">
                            Tax
                          </option>
                          <option value="gst">
                            GST
                          </option>
                          <option value="labour">
                            Labour
                          </option>
                          <option value="privacy">
                            Privacy
                          </option>
                          <option value="regulatory">
                            Regulatory
                          </option>
                          <option value="licensing">
                            Licensing
                          </option>
                          <option value="other">
                            Other
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Priority
                        </label>

                        <select
                          value={
                            form.priority
                          }
                          disabled={
                            modalMode ===
                            'view'
                          }
                          onChange={(e) =>
                            setForm(
                              (current) => ({
                                ...current,
                                priority:
                                  e.target
                                    .value as
                                  | 'low'
                                  | 'medium'
                                  | 'high',
                              })
                            )
                          }
                          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        >
                          <option value="low">
                            Low
                          </option>
                          <option value="medium">
                            Medium
                          </option>
                          <option value="high">
                            High
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Due Date */}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Due Date *
                      </label>

                      <input
                        type="date"
                        value={
                          form.dueDate
                        }
                        disabled={
                          modalMode ===
                          'view'
                        }
                        onChange={(e) =>
                          setForm(
                            (current) => ({
                              ...current,
                              dueDate:
                                e.target
                                  .value,
                            })
                          )
                        }
                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                      />
                    </div>

                    {/* Assigned To */}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Assigned To
                      </label>

                      <input
                        type="text"
                        value={
                          selectedItem
                            ?.assignedTo
                            ?.fullName ||
                          form.assignedTo ||
                          ''
                        }
                        disabled={
                          modalMode ===
                          'view'
                        }
                        onChange={(e) =>
                          setForm(
                            (current) => ({
                              ...current,
                              assignedTo:
                                e.target
                                  .value,
                            })
                          )
                        }
                        placeholder="Enter workspace member ID"
                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                      />

                      {modalMode !==
                        'view' && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Enter the AuthUser ID of a workspace member. This can be replaced with a Team API dropdown later.
                          </p>
                        )}
                    </div>

                    {/* Description */}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>

                      <textarea
                        rows={4}
                        value={
                          form.description
                        }
                        disabled={
                          modalMode ===
                          'view'
                        }
                        onChange={(e) =>
                          setForm(
                            (current) => ({
                              ...current,
                              description:
                                e.target
                                  .value,
                            })
                          )
                        }
                        placeholder="Describe the compliance obligation..."
                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-60"
                      />
                    </div>

                    {/* Recurring */}

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={
                          form.recurring
                        }
                        disabled={
                          modalMode ===
                          'view'
                        }
                        onChange={(e) =>
                          setForm(
                            (current) => ({
                              ...current,
                              recurring:
                                e.target
                                  .checked,
                              recurrence:
                                e.target
                                  .checked
                                  ? current.recurrence
                                  : '',
                            })
                          )
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />

                      <label className="text-sm font-medium text-foreground">
                        Recurring compliance
                      </label>
                    </div>

                    {/* Recurrence */}

                    {form.recurring && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Recurrence
                        </label>

                        <select
                          value={
                            form.recurrence
                          }
                          disabled={
                            modalMode ===
                            'view'
                          }
                          onChange={(e) =>
                            setForm(
                              (current) => ({
                                ...current,
                                recurrence:
                                  e.target
                                    .value,
                              })
                            )
                          }
                          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        >
                          <option value="">
                            Select recurrence
                          </option>

                          <option value="monthly">
                            Monthly
                          </option>

                          <option value="quarterly">
                            Quarterly
                          </option>

                          <option value="half-yearly">
                            Half-yearly
                          </option>

                          <option value="yearly">
                            Yearly
                          </option>

                          <option value="custom">
                            Custom
                          </option>
                        </select>
                      </div>
                    )}

                    {/* VIEW DETAILS */}

                    {modalMode ===
                      'view' &&
                      selectedItem && (
                        <div className="pt-4 border-t border-border space-y-4">
                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>

                            <span className="font-medium text-foreground capitalize">
                              {selectedItem?.status
                                ? selectedItem.status.replace(
                                  '-',
                                  ' '
                                )
                                : '-'}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Priority
                            </span>

                            <span className="font-medium text-foreground capitalize">
                              {
                                selectedItem?.priority ||
                                '-'
                              }
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Category
                            </span>

                            <span className="font-medium text-foreground capitalize">
                              {
                                selectedItem?.category ||
                                '-'
                              }
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Assigned To
                            </span>

                            <span className="font-medium text-foreground">
                              {selectedItem
                                ?.assignedTo
                                ?.fullName ||
                                'Unassigned'}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Documents
                            </span>

                            <span className="font-medium text-foreground">
                              {selectedItem?.relatedDocuments || 0}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Recurring
                            </span>

                            <span className="font-medium text-foreground">
                              {selectedItem?.recurring
                                ? `Yes${selectedItem.recurrence
                                  ? ` · ${selectedItem.recurrence}`
                                  : ''
                                }`
                                : 'No'}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Created
                            </span>

                            <span className="font-medium text-foreground">
                              {selectedItem?.createdAt
                                ? new Date(
                                  selectedItem.createdAt
                                ).toLocaleDateString(
                                  'en-IN'
                                )
                                : '-'}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* FOOTER */}

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium"
                >
                  Close
                </button>

                {modalMode ===
                  'create' && (
                    <button
                      onClick={
                        createCompliance
                      }
                      disabled={
                        formLoading
                      }
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                      {formLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}

                      Create Compliance
                    </button>
                  )}

                {modalMode ===
                  'edit' && (
                    <button
                      onClick={
                        updateCompliance
                      }
                      disabled={
                        formLoading
                      }
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                      {formLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}

                      Save Changes
                    </button>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}