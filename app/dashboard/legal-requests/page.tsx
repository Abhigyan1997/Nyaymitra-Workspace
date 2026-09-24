'use client'
import { useRouter } from 'next/navigation'

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from 'lucide-react'

/* =========================================================
   CONFIG
========================================================= */

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1'
).replace(/\/$/, '')

const LEGAL_REQUESTS_API =
  `${API_BASE_URL}/legal-requests`

/* =========================================================
   TYPES
========================================================= */

type LegalRequestStatus =
  | 'submitted'
  | 'under-review'
  | 'assigned'
  | 'in-progress'
  | 'waiting-for-client'
  | 'completed'
  | 'cancelled'

type LegalRequestPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

type LegalRequestCategory =
  | 'contract'
  | 'compliance'
  | 'corporate'
  | 'employment'
  | 'ip'
  | 'dispute'
  | 'legal-notice'
  | 'documentation'
  | 'regulatory'
  | 'tax'
  | 'registration'
  | 'governance'
  | 'privacy'
  | 'due-diligence'
  | 'general'
  | 'other'

interface LegalRequest {
  _id?: string
  id?: string
  requestNumber?: string

  title: string
  category: LegalRequestCategory
  customCategory?: string
  description: string
  additionalInformation?: string

  priority: LegalRequestPriority
  deadline?: string

  preferredProfessionalType?:
  | 'lawyer'
  | 'CA'
  | 'CS'
  | 'consultant'
  | 'not-sure'

  status: LegalRequestStatus

  createdAt?: string
  updatedAt?: string

  assignedTo?: {
    _id?: string
    fullName?: string
    email?: string
  } | null
}

interface CreateLegalRequestPayload {
  title: string
  category: LegalRequestCategory
  customCategory?: string
  description: string
  additionalInformation?: string
  priority: LegalRequestPriority
  deadline?: string
  preferredProfessionalType:
  | 'lawyer'
  | 'CA'
  | 'CS'
  | 'consultant'
  | 'not-sure'
}

/* =========================================================
   CONSTANTS
========================================================= */

const categories: {
  value: LegalRequestCategory
  label: string
}[] = [
    {
      value: 'contract',
      label: 'Contract / Agreement',
    },
    {
      value: 'compliance',
      label: 'Compliance',
    },
    {
      value: 'corporate',
      label: 'Corporate Matter',
    },
    {
      value: 'employment',
      label: 'Employment / HR',
    },
    {
      value: 'ip',
      label: 'IP / Trademark',
    },
    {
      value: 'dispute',
      label: 'Dispute',
    },
    {
      value: 'legal-notice',
      label: 'Legal Notice',
    },
    {
      value: 'documentation',
      label: 'Documentation',
    },
    {
      value: 'regulatory',
      label: 'Regulatory',
    },
    {
      value: 'tax',
      label: 'Tax / GST',
    },
    {
      value: 'registration',
      label: 'Registration / License',
    },
    {
      value: 'governance',
      label: 'Governance',
    },
    {
      value: 'privacy',
      label: 'Privacy / Data',
    },
    {
      value: 'due-diligence',
      label: 'Due Diligence',
    },
    {
      value: 'general',
      label: 'General Legal Matter',
    },
    {
      value: 'other',
      label: 'Other',
    },
  ]

const statuses: {
  value: 'all' | LegalRequestStatus
  label: string
}[] = [
    {
      value: 'all',
      label: 'All',
    },
    {
      value: 'submitted',
      label: 'Submitted',
    },
    {
      value: 'under-review',
      label: 'Under Review',
    },
    {
      value: 'assigned',
      label: 'Assigned',
    },
    {
      value: 'in-progress',
      label: 'In Progress',
    },
    {
      value: 'waiting-for-client',
      label: 'Waiting',
    },
    {
      value: 'completed',
      label: 'Completed',
    },
  ]

/* =========================================================
   HELPERS
========================================================= */

function getToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    ''
  )
}

function formatDate(value?: string) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function relativeDate(value?: string) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const diff =
    Date.now() - date.getTime()

  const minutes = Math.floor(
    diff / 60000
  )

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)

  if (days < 7) {
    return `${days}d ago`
  }

  return formatDate(value)
}

function labelForCategory(
  category?: LegalRequestCategory
) {
  const item = categories.find(
    (entry) => entry.value === category
  )

  return (
    item?.label ||
    category ||
    'General Legal Matter'
  )
}

function labelForStatus(
  status: LegalRequestStatus
) {
  return status
    .split('-')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(' ')
}

/* =========================================================
   UI
========================================================= */

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`
                rounded-2xl
                border border-white/[0.07]
                bg-white/[0.025]
                backdrop-blur-xl
                ${className}
            `}
    >
      {children}
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: LegalRequestStatus
}) {
  const map: Record<
    LegalRequestStatus,
    string
  > = {
    submitted:
      'border-blue-400/20 bg-blue-400/10 text-blue-300',

    'under-review':
      'border-amber-400/20 bg-amber-400/10 text-amber-300',

    assigned:
      'border-violet-400/20 bg-violet-400/10 text-violet-300',

    'in-progress':
      'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',

    'waiting-for-client':
      'border-orange-400/20 bg-orange-400/10 text-orange-300',

    completed:
      'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',

    cancelled:
      'border-red-400/20 bg-red-400/10 text-red-300',
  }

  return (
    <span
      className={`
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                px-2.5
                py-1
                text-[10px]
                font-medium
                whitespace-nowrap
                ${map[status]}
            `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {labelForStatus(status)}
    </span>
  )
}

function PriorityBadge({
  priority,
}: {
  priority: LegalRequestPriority
}) {
  const map = {
    low: 'border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300',
    medium:
      'border-blue-400/15 bg-blue-400/[0.06] text-blue-300',
    high: 'border-amber-400/15 bg-amber-400/[0.06] text-amber-300',
    urgent:
      'border-red-400/15 bg-red-400/[0.06] text-red-300',
  }

  return (
    <span
      className={`
                rounded-full
                border
                px-2.5
                py-1
                text-[10px]
                font-medium
                capitalize
                ${map[priority]}
            `}
    >
      {priority}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ComponentType<{
    className?: string
  }>
  accent:
  | 'amber'
  | 'blue'
  | 'emerald'
  | 'red'
  | 'violet'
}) {
  const accents = {
    amber:
      'text-amber-400 bg-amber-400/10 border-amber-400/10',
    blue:
      'text-blue-400 bg-blue-400/10 border-blue-400/10',
    emerald:
      'text-emerald-400 bg-emerald-400/10 border-emerald-400/10',
    red:
      'text-red-400 bg-red-400/10 border-red-400/10',
    violet:
      'text-violet-400 bg-violet-400/10 border-violet-400/10',
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
    >
      <Card className="h-full p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`
                            flex h-9 w-9
                            items-center justify-center
                            rounded-xl
                            border
                            ${accents[accent]}
                        `}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {label}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}

/* =========================================================
   NEW LEGAL REQUEST MODAL
========================================================= */

function NewLegalRequestModal({
  open,
  submitting,
  onClose,
  onCreated,
}: {
  open: boolean
  submitting: boolean
  onClose: () => void
  onCreated: (
    request: LegalRequest
  ) => void
}) {
  const [title, setTitle] =
    useState('')

  const [category, setCategory] =
    useState<LegalRequestCategory>(
      'general'
    )

  const [customCategory, setCustomCategory] =
    useState('')

  const [priority, setPriority] =
    useState<LegalRequestPriority>(
      'medium'
    )

  const [deadline, setDeadline] =
    useState('')

  const [professionalType, setProfessionalType] =
    useState<
      CreateLegalRequestPayload['preferredProfessionalType']
    >('not-sure')

  const [description, setDescription] =
    useState('')

  const [additionalInformation, setAdditionalInformation] =
    useState('')

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([])

  const [error, setError] =
    useState('')

  const resetForm = () => {
    setTitle('')
    setCategory('general')
    setCustomCategory('')
    setPriority('medium')
    setDeadline('')
    setProfessionalType('not-sure')
    setDescription('')
    setAdditionalInformation('')
    setSelectedFiles([])
    setError('')
  }

  const handleClose = () => {
    if (submitting) return

    resetForm()
    onClose()
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!title.trim()) {
      setError(
        'Please enter a request title.'
      )
      return
    }

    if (!description.trim()) {
      setError(
        'Please describe your legal requirement.'
      )
      return
    }

    if (
      category === 'other' &&
      !customCategory.trim()
    ) {
      setError(
        'Please specify your legal matter.'
      )
      return
    }

    try {
      setError('')

      const token = getToken()

      const payload: CreateLegalRequestPayload =
      {
        title: title.trim(),
        category,
        customCategory:
          customCategory.trim() ||
          undefined,
        priority,
        deadline:
          deadline || undefined,
        preferredProfessionalType:
          professionalType,
        description:
          description.trim(),
        additionalInformation:
          additionalInformation.trim() ||
          undefined,
      }

      /*
       * JSON request.
       *
       * Files are selected in the UI and can be
       * connected to your R2 attachment endpoint
       * later. The legal request itself is created
       * through this API.
       */

      const response = await fetch(
        LEGAL_REQUESTS_API,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            ...(token
              ? {
                Authorization:
                  `Bearer ${token}`,
              }
              : {}),
          },
          body: JSON.stringify(
            payload
          ),
        }
      )

      let result: any = null

      try {
        result =
          await response.json()
      } catch {
        // ignore
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
          'Failed to create legal request.'
        )
      }

      const createdRequest =
        result?.data ||
        result?.request ||
        result

      onCreated(createdRequest)

      resetForm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create legal request.'
      )
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <motion.div
        initial={{
          opacity: 0,
          y: 16,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#0b0d10] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.06] bg-[#0b0d10]/95 px-5 py-5 backdrop-blur-xl sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
              NyayMitra
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              New Legal Request
            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
              Raise any legal, compliance,
              documentation, corporate or
              regulatory requirement.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-5 sm:p-6"
        >
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{error}</span>
            </div>
          )}

          {/* Request summary */}
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">
                Request details
              </h3>

              <p className="mt-1 text-xs text-slate-600">
                Tell us what legal help your
                business needs.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[11px] font-medium text-slate-500">
                  Request title *
                </label>

                <input
                  required
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Need help reviewing an employee agreement"
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-amber-400/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-500">
                  Request category *
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target
                        .value as LegalRequestCategory
                    )
                  }
                  className="w-full rounded-xl border border-white/[0.07] bg-[#101318] px-3.5 py-3 text-sm text-white outline-none focus:border-amber-400/30"
                >
                  {categories.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {category ===
                'other' && (
                  <div>
                    <label className="mb-2 block text-[11px] font-medium text-slate-500">
                      Specify matter *
                    </label>

                    <input
                      value={
                        customCategory
                      }
                      onChange={(
                        e
                      ) =>
                        setCustomCategory(
                          e
                            .target
                            .value
                        )
                      }
                      placeholder="e.g. Government authority communication"
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-amber-400/30"
                    />
                  </div>
                )}

              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-500">
                  Priority
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      'low',
                      'medium',
                      'high',
                      'urgent',
                    ] as LegalRequestPriority[]
                  ).map(
                    (item) => (
                      <button
                        key={
                          item
                        }
                        type="button"
                        onClick={() =>
                          setPriority(
                            item
                          )
                        }
                        className={`
                                                    rounded-xl
                                                    border
                                                    px-2
                                                    py-2.5
                                                    text-[10px]
                                                    font-medium
                                                    capitalize
                                                    transition
                                                    ${priority ===
                            item
                            ? item ===
                              'urgent'
                              ? 'border-red-400/30 bg-red-400/10 text-red-300'
                              : item ===
                                'high'
                                ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                                : 'border-blue-400/30 bg-blue-400/10 text-blue-300'
                            : 'border-white/[0.07] bg-white/[0.02] text-slate-500 hover:bg-white/[0.04] hover:text-white'
                          }
                                                `}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-500">
                  Deadline
                </label>

                <input
                  type="date"
                  value={
                    deadline
                  }
                  onChange={(e) =>
                    setDeadline(
                      e.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none focus:border-amber-400/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-500">
                  Preferred professional
                </label>

                <select
                  value={
                    professionalType
                  }
                  onChange={(e) =>
                    setProfessionalType(
                      e.target
                        .value as CreateLegalRequestPayload['preferredProfessionalType']
                    )
                  }
                  className="w-full rounded-xl border border-white/[0.07] bg-[#101318] px-3.5 py-3 text-sm text-white outline-none focus:border-amber-400/30"
                >
                  <option value="not-sure">
                    Not sure
                  </option>

                  <option value="lawyer">
                    Lawyer
                  </option>

                  <option value="CA">
                    Chartered Accountant
                  </option>

                  <option value="CS">
                    Company Secretary
                  </option>

                  <option value="consultant">
                    Consultant
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[11px] font-medium text-slate-500">
                  Describe your legal requirement *
                </label>

                <textarea
                  required
                  rows={6}
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target
                        .value
                    )
                  }
                  placeholder="Explain your situation, what happened, what you need, relevant dates, parties involved, and the outcome you're looking for..."
                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-amber-400/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[11px] font-medium text-slate-500">
                  Additional information
                </label>

                <textarea
                  rows={3}
                  value={
                    additionalInformation
                  }
                  onChange={(e) =>
                    setAdditionalInformation(
                      e.target
                        .value
                    )
                  }
                  placeholder="Anything else the legal team should know..."
                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-amber-400/30"
                />
              </div>
            </div>
          </section>

          {/* Attachments */}
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">
                Supporting documents
              </h3>

              <p className="mt-1 text-xs text-slate-600">
                Add contracts, notices,
                certificates, screenshots or
                other useful files.
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] px-4 py-4 transition hover:border-amber-400/30 hover:bg-white/[0.035]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                  <Upload className="h-4 w-4 text-amber-400" />
                </div>

                <div>
                  <p className="text-xs font-medium text-white">
                    Upload documents
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    PDF, DOC, DOCX,
                    JPG, PNG
                  </p>
                </div>
              </div>

              <span className="rounded-lg border border-white/[0.07] px-3 py-2 text-[10px] text-slate-400">
                Browse
              </span>

              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
                onChange={(e) =>
                  setSelectedFiles(
                    Array.from(
                      e
                        .target
                        .files ||
                      []
                    )
                  )
                }
              />
            </label>

            {selectedFiles.length >
              0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map(
                    (
                      file
                    ) => (
                      <div
                        key={
                          file.name
                        }
                        className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5"
                      >
                        <FileText className="h-4 w-4 text-slate-500" />

                        <span className="flex-1 truncate text-xs text-slate-300">
                          {
                            file.name
                          }
                        </span>

                        <span className="text-[10px] text-slate-600">
                          {(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(
                            2
                          )}{' '}
                          MB
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
          </section>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={
                handleClose
              }
              disabled={
                submitting
              }
              className="rounded-xl border border-white/[0.07] px-4 py-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />

                  Submit Legal Request
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* =========================================================
   REQUEST CARD
========================================================= */

function RequestCard({
  request,
  onClick,
}: {
  request: LegalRequest
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -2,
      }}
      onClick={onClick}
      className="w-full text-left"
    >
      <Card className="p-5 transition hover:border-white/[0.13] hover:bg-white/[0.04]">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">
                    {
                      request.title
                    }
                  </h3>

                  <StatusBadge
                    status={
                      request.status
                    }
                  />
                </div>

                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                  {
                    request.requestNumber
                      ? request.requestNumber
                      : 'Legal Request'
                  }
                </p>
              </div>

              <div className="flex items-center gap-2">
                <PriorityBadge
                  priority={
                    request.priority
                  }
                />

                <Chevron />
              </div>
            </div>

            <p className="mt-4 line-clamp-2 text-xs leading-6 text-slate-500">
              {
                request.description
              }
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.05] pt-4 text-[10px] text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />

                {labelForCategory(
                  request.category
                )}
              </span>

              {request.deadline && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />

                  Due{' '}
                  {formatDate(
                    request.deadline
                  )}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />

                {relativeDate(
                  request.createdAt
                )}
              </span>

              {request.assignedTo && (
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5" />

                  {
                    request
                      .assignedTo
                      .fullName
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.button>
  )
}

function Chevron() {
  return (
    <ArrowRight className="h-4 w-4 text-slate-700" />
  )
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function LegalRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] =
    useState<LegalRequest[]>([])

  const [loading, setLoading] =
    useState(true)

  const [fetchError, setFetchError] =
    useState('')

  const [showModal, setShowModal] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [search, setSearch] =
    useState('')

  const [activeStatus, setActiveStatus] =
    useState<
      'all' | LegalRequestStatus
    >('all')


  /* -------------------------------------------------------
     FETCH REQUESTS
  ------------------------------------------------------- */

  const fetchRequests =
    useCallback(async () => {
      try {
        setLoading(true)
        setFetchError('')

        const token = getToken()

        const response =
          await fetch(
            LEGAL_REQUESTS_API,
            {
              method: 'GET',
              headers: {
                'Content-Type':
                  'application/json',
                ...(token
                  ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                  : {}),
              },
              cache: 'no-store',
            }
          )

        let result: any = null

        try {
          result =
            await response.json()
        } catch {
          // ignore
        }

        if (!response.ok) {
          throw new Error(
            result?.message ||
            'Failed to load legal requests.'
          )
        }

        const payload =
          result?.data ??
          result?.requests ??
          result

        const list =
          Array.isArray(
            payload
          )
            ? payload
            : Array.isArray(
              payload?.requests
            )
              ? payload.requests
              : []

        setRequests(list)
      } catch (err) {
        console.error(
          'Legal requests fetch error:',
          err
        )

        setFetchError(
          err instanceof Error
            ? err.message
            : 'Unable to load legal requests.'
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    void fetchRequests()
  }, [fetchRequests])

  /* -------------------------------------------------------
     CREATE
  ------------------------------------------------------- */

  const handleCreated = async (
    createdRequest: LegalRequest
  ) => {
    setSubmitting(true)

    try {
      setRequests(
        (current) => [
          createdRequest,
          ...current,
        ]
      )

      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  /* -------------------------------------------------------
     FILTER
  ------------------------------------------------------- */

  const filteredRequests =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase()

      return requests.filter(
        (request) => {
          const searchable = [
            request.title,
            request.requestNumber,
            request.description,
            request.category,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          const searchMatch =
            !term ||
            searchable.includes(term)

          const statusMatch =
            activeStatus ===
            'all' ||
            request.status ===
            activeStatus

          return (
            searchMatch &&
            statusMatch
          )
        }
      )
    }, [
      requests,
      search,
      activeStatus,
    ])

  /* -------------------------------------------------------
     STATS
  ------------------------------------------------------- */

  const stats = useMemo(() => {
    return {
      total: requests.length,

      submitted: requests.filter(
        (r) =>
          r.status ===
          'submitted'
      ).length,

      inProgress:
        requests.filter(
          (r) =>
            r.status ===
            'under-review' ||
            r.status ===
            'assigned' ||
            r.status ===
            'in-progress'
        ).length,

      completed:
        requests.filter(
          (r) =>
            r.status ===
            'completed'
        ).length,
    }
  }, [requests])

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070707] text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded bg-white/[0.04]" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-32 rounded-2xl bg-white/[0.04]"
                  />
                )
              )}
            </div>

            <div className="h-28 rounded-2xl bg-white/[0.04]" />

            <div className="space-y-3">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-40 rounded-2xl bg-white/[0.04]"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-amber-400/[0.035] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
                    HEADER
                ===================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="border-b border-white/[0.06] pb-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              {/* <div className="mb-3 flex items-center gap-2 text-xs text-slate-600">
                <span>
                  Business Dashboard
                </span>

                <span>
                  /
                </span>

                <span className="text-slate-300">
                  Legal Requests
                </span>
              </div> */}

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Legal Requests
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Raise and track any legal requirement for your business.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowModal(
                  true
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-400/10 transition hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />

              New Legal Request
            </button>
          </div>
        </motion.header>

        {/* =====================================================
                    ERROR
                ===================================================== */}

        {fetchError && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />

              {fetchError}
            </div>

            <button
              type="button"
              onClick={() =>
                void fetchRequests()
              }
              className="rounded-lg border border-red-400/20 px-3 py-1.5 text-[10px] font-medium hover:bg-red-400/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* =====================================================
                    STATS
                ===================================================== */}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Requests"
            value={
              stats.total
            }
            icon={FileText}
            accent="blue"
          />

          <StatCard
            label="Submitted"
            value={
              stats.submitted
            }
            icon={Clock3}
            accent="amber"
          />

          <StatCard
            label="In Progress"
            value={
              stats.inProgress
            }
            icon={
              ShieldCheck
            }
            accent="violet"
          />

          <StatCard
            label="Completed"
            value={
              stats.completed
            }
            icon={
              CheckCircle2
            }
            accent="emerald"
          />
        </section>

        {/* =====================================================
                    FILTERS
                ===================================================== */}

        <section className="mt-6">
          <Card className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target
                        .value
                    )
                  }
                  placeholder="Search legal requests..."
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-amber-400/30"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {statuses.map(
                  (
                    item
                  ) => (
                    <button
                      key={
                        item.value
                      }
                      type="button"
                      onClick={() =>
                        setActiveStatus(
                          item.value
                        )}
                      className={`
                                                shrink-0
                                                rounded-xl
                                                border
                                                px-3
                                                py-2.5
                                                text-xs
                                                font-medium
                                                transition
                                                ${activeStatus ===
                          item.value
                          ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
                          : 'border-white/[0.07] bg-white/[0.02] text-slate-500 hover:bg-white/[0.04] hover:text-white'
                        }
                                            `}
                    >
                      {
                        item.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* =====================================================
                    REQUEST LIST
                ===================================================== */}

        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                Request inbox
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Your legal matters
              </h2>
            </div>

            <p className="text-xs text-slate-600">
              {
                filteredRequests.length
              }{' '}
              request
              {filteredRequests.length !==
                1
                ? 's'
                : ''}
            </p>
          </div>

          {filteredRequests.length ===
            0 ? (
            <Card className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10">
                <FileText className="h-5 w-5 text-amber-400" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-white">
                No legal requests
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
                Raise a legal request for
                anything from contract review
                and compliance to disputes,
                notices, documentation or
                general legal assistance.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowModal(
                    true
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black hover:bg-amber-300"
              >
                <Plus className="h-4 w-4" />

                Create your first request
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredRequests.map(
                  (
                    request
                  ) => (
                    <RequestCard
                      key={
                        request._id ||
                        request.id ||
                        request.requestNumber
                      }
                      request={
                        request
                      }
                      onClick={() => {
                        const requestId =
                          request._id || request.id

                        if (!requestId) return

                        router.push(
                          `/dashboard/legal-requests/${requestId}`
                        )
                      }}
                    />
                  )
                )}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* =====================================================
                    INFO
                ===================================================== */}

        <section className="mt-6">
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/10">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  One place for every legal issue
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  You don't need to know which legal
                  category your issue belongs to.
                  Describe your problem and
                  NyayMitra can route it to the
                  appropriate legal professional.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* =====================================================
                NEW REQUEST MODAL
            ===================================================== */}

      <NewLegalRequestModal
        open={showModal}
        submitting={submitting}
        onClose={() =>
          setShowModal(
            false
          )
        }
        onCreated={
          handleCreated
        }
      />
    </main>
  )
}