'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  Loader2,
  X,
  FileSpreadsheet,
  FileImage,
  FileCheck,
  Lock,
  ShieldCheck,
  Folder,
  Building2,
  Receipt,
  FileSignature,
  ScrollText,
  Landmark,
  Users,
  ChevronRight,
  Plus,
  Pencil,
  FolderInput,
  Info,
  KeyRound,
  ServerCog,
  History,
  UserCheck,
  Ban,
  type LucideIcon,
} from 'lucide-react'
import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Fraunces, Manrope } from 'next/font/google'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
})

const body = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
})

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://nyaymitra-backend-production.up.railway.app'

/* =====================================================
   TYPES
===================================================== */

interface CompanyDoc {
  id: string
  name: string
  uploaded: boolean
  file: string | null
  category: string
  url?: string
  size?: number
  mimeType?: string
  uploadedAt?: string
  folderId?: string
}

interface VaultFolder {
  id: string
  name: string
  hint: string
  icon: LucideIcon
  custom: boolean
  type?: 'system' | 'custom'
  slug?: string
  documentCount?: number
}

/* =====================================================
   SYSTEM FOLDER CONFIG
===================================================== */

const SYSTEM_FOLDER_CONFIG: Record<
  string,
  {
    hint: string
    icon: LucideIcon
    category: string
  }
> = {
  incorporation: {
    hint: 'COI, MOA, AOA, PAN',
    icon: Building2,
    category: 'incorporation',
  },
  'tax-gst': {
    hint: 'Returns, notices, challans',
    icon: Receipt,
    category: 'tax',
  },
  tax: {
    hint: 'Returns, notices, challans',
    icon: Receipt,
    category: 'tax',
  },
  contracts: {
    hint: 'Client, vendor and service contracts',
    icon: FileSignature,
    category: 'contract',
  },
  agreements: {
    hint: 'NDAs, MoUs, founder and shareholder agreements',
    icon: ScrollText,
    category: 'agreement',
  },
  financials: {
    hint: 'Statements, invoices, audits',
    icon: Landmark,
    category: 'financial',
  },
  financial: {
    hint: 'Statements, invoices, audits',
    icon: Landmark,
    category: 'financial',
  },
  'hr-payroll': {
    hint: 'Employee and payroll records',
    icon: Users,
    category: 'other',
  },
  hr: {
    hint: 'Employee and payroll records',
    icon: Users,
    category: 'other',
  },
  other: {
    hint: 'Everything else',
    icon: Folder,
    category: 'other',
  },
}

/* =====================================================
   KEYHOLE
===================================================== */

function Keyhole({
  lit,
  className = 'w-6 h-6',
}: {
  lit: boolean
  className?: string
}) {
  const fill = lit ? '#facc15' : 'rgba(255,255,255,0.18)'

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      style={
        lit
          ? {
            filter:
              'drop-shadow(0 0 6px rgba(250,204,21,0.55))',
          }
          : undefined
      }
    >
      <circle cx="12" cy="9.5" r="4" fill={fill} />
      <path d="M10.2 12.5h3.6l1 7h-5.6z" fill={fill} />
    </svg>
  )
}

/* =====================================================
   MOVE MENU (PORTAL)
===================================================== */

interface MoveMenuProps {
  anchorEl: HTMLElement
  folders: VaultFolder[]
  currentFolderId?: string
  disabled: boolean
  onSelect: (folderId: string) => void
  onClose: () => void
}

function MoveMenu({
  anchorEl,
  folders,
  currentFolderId,
  disabled,
  onSelect,
  onClose,
}: MoveMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<{
    top: number
    left: number
    width: number
    maxHeight: number
    placement: 'top' | 'bottom'
  }>({
    top: 0,
    left: 0,
    width: 224,
    maxHeight: 288,
    placement: 'bottom',
  })

  useLayoutEffect(() => {
    const compute = () => {
      const rect = anchorEl.getBoundingClientRect()
      const menuWidth = 224
      const margin = 8
      const viewportPadding = 8

      const spaceBelow =
        window.innerHeight - rect.bottom - margin
      const spaceAbove = rect.top - margin

      const placement: 'top' | 'bottom' =
        spaceBelow >= 260 || spaceBelow >= spaceAbove
          ? 'bottom'
          : 'top'

      const availableSpace =
        placement === 'bottom' ? spaceBelow : spaceAbove

      const maxHeight = Math.max(
        160,
        Math.min(320, availableSpace - viewportPadding)
      )

      let left = rect.right - menuWidth
      if (left < viewportPadding) {
        left = viewportPadding
      }
      if (
        left + menuWidth >
        window.innerWidth - viewportPadding
      ) {
        left =
          window.innerWidth -
          menuWidth -
          viewportPadding
      }

      const top =
        placement === 'bottom'
          ? rect.bottom + margin
          : rect.top - margin

      setStyle({
        top,
        left,
        width: menuWidth,
        maxHeight,
        placement,
      })
    }

    compute()

    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)

    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [anchorEl])

  useEffect(() => {
    const handlePointerDown = (
      e: MouseEvent | TouchEvent
    ) => {
      const target = e.target as Node

      if (
        menuRef.current &&
        menuRef.current.contains(target)
      ) {
        return
      }

      if (anchorEl.contains(target)) {
        return
      }

      onClose()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener(
      'mousedown',
      handlePointerDown
    )
    document.addEventListener(
      'touchstart',
      handlePointerDown
    )
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown
      )
      document.removeEventListener(
        'touchstart',
        handlePointerDown
      )
      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [anchorEl, onClose])

  if (typeof document === 'undefined') return null

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: style.top,
        left: style.left,
        width: style.width,
        maxHeight: style.maxHeight,
        transform:
          style.placement === 'top'
            ? 'translateY(-100%)'
            : undefined,
        zIndex: 9999,
      }}
      className="overflow-hidden rounded-xl border border-white/10 bg-[#171717] p-1.5 shadow-2xl shadow-black/40"
    >
      <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-white/35">
        Move to folder
      </div>

      <div
        className="overflow-y-auto overscroll-contain"
        style={{
          maxHeight: style.maxHeight - 44,
        }}
      >
        {folders.length === 0 ? (
          <div className="px-3 py-3 text-sm text-white/40">
            No folders available
          </div>
        ) : (
          folders.map((folder) => {
            const isCurrent =
              folder.id === currentFolderId

            return (
              <button
                key={folder.id}
                type="button"
                role="menuitem"
                disabled={isCurrent || disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  if (isCurrent) return
                  onSelect(folder.id)
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${isCurrent
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                  } disabled:cursor-not-allowed`}
              >
                <FolderInput className="h-4 w-4 shrink-0 text-white/45" />
                <span className="min-w-0 flex-1 truncate">
                  {folder.name}
                </span>

                {isCurrent && (
                  <span className="text-[10px] text-white/35">
                    Current
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  return createPortal(menu, document.body)
}

/* =====================================================
   SECURITY INFO MODAL
===================================================== */

interface SecurityInfoModalProps {
  open: boolean
  onClose: () => void
}

const SECURITY_FEATURES: {
  icon: LucideIcon
  title: string
  body: string
}[] = [
    {
      icon: Lock,
      title: 'AES-256 encryption at rest',
      body: 'Every file is stored encrypted with bank-grade AES-256. The raw bytes on disk are unreadable without the encryption key, so even a direct disk compromise cannot expose your documents.',
    },
    {
      icon: ShieldCheck,
      title: 'TLS 1.2+ encryption in transit',
      body: 'All uploads, downloads, and API calls travel over HTTPS with modern TLS. Your files are never sent in plain text over the network.',
    },
    {
      icon: KeyRound,
      title: 'Signed, time-limited URLs',
      body: 'Files are never exposed via public links. Access is granted through short-lived signed URLs that expire automatically and are tied to your authenticated session.',
    },
    {
      icon: UserCheck,
      title: 'Strict tenant isolation',
      body: 'Each business vault is logically isolated. Your documents are scoped to your business ID and cannot be accessed, listed, or queried by any other account.',
    },
    {
      icon: ServerCog,
      title: 'Private encrypted storage',
      body: 'Files live in a private storage bucket with no public read access. Object-level permissions ensure only the vault service acting on your behalf can retrieve them.',
    },
    {
      icon: History,
      title: 'Audit trail & access logging',
      body: 'Every upload, view, download, move, and delete is recorded with a timestamp. This gives you a traceable history of who touched what, and when.',
    },
    {
      icon: Ban,
      title: 'No third-party sharing',
      body: 'We never sell, share, or mine your documents. Your confidential data is used only to provide the vault service you requested nothing else.',
    },
  ]

function SecurityInfoModal({
  open,
  onClose,
}: SecurityInfoModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm px-3 sm:px-4 py-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 28,
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="security-info-title"
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#141416] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-b from-[#1c1c1f] to-[#141416] px-5 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-yellow-400/25 bg-yellow-400/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-yellow-300" />
                </div>

                <div>
                  <h3
                    id="security-info-title"
                    className="text-lg text-white"
                    style={{
                      fontFamily:
                        'var(--font-display), serif',
                    }}
                  >
                    Your data, locked down
                  </h3>

                  <p className="text-xs text-white/45">
                    How NyayVault protects confidential
                    files
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close security information"
                className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-5">
              <p className="text-sm text-white/65 leading-relaxed">
                Every document you upload is treated as
                confidential. It is encrypted at rest and
                in transit, and access is restricted to
                your verified business account only.
                Nobody else not other tenants, not our
                staff can read your files.
              </p>

              <div className="space-y-3">
                {SECURITY_FEATURES.map((feature) => {
                  const Icon = feature.icon

                  return (
                    <div
                      key={feature.title}
                      className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-yellow-300" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {feature.title}
                        </p>

                        <p className="text-xs text-white/50 mt-1 leading-relaxed">
                          {feature.body}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] p-3.5">
                <p className="text-xs text-yellow-100/80 leading-relaxed">
                  <span className="font-semibold text-yellow-200">
                    In short:
                  </span>{' '}
                  your files are encrypted end-to-end,
                  isolated to your account, and never
                  shared. Only you through your
                  authenticated session can access
                  them.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-5 py-4">
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300 transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}

/* =====================================================
   PAGE
===================================================== */

export default function DocumentsPage() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [movingDocument, setMovingDocument] = useState<
    string | null
  >(null)
  const [openMoveMenu, setOpenMoveMenu] = useState<
    string | null
  >(null)

  const [isDragging, setIsDragging] = useState(false)
  const [dragFolder, setDragFolder] = useState<
    string | null
  >(null)

  const [currentFolder, setCurrentFolder] = useState<
    string | null
  >(null)

  const [folders, setFolders] = useState<VaultFolder[]>([])

  const [showNewFolder, setShowNewFolder] = useState(false)

  const [newFolderName, setNewFolderName] = useState('')

  const [creatingFolder, setCreatingFolder] =
    useState(false)

  const [renamingFolder, setRenamingFolder] = useState<
    string | null
  >(null)

  const [renameValue, setRenameValue] = useState('')

  const [savingRename, setSavingRename] = useState(false)

  const [showSecurityInfo, setShowSecurityInfo] =
    useState(false)

  const [token, setToken] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [businessCode, setBusinessCode] = useState('')

  const [error, setError] = useState<string | null>(null)

  const [documentCount, setDocumentCount] = useState(0)

  const [totalStorageUsed, setTotalStorageUsed] =
    useState(0)

  const [uploadedDocuments, setUploadedDocuments] =
    useState<CompanyDoc[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const anchorRefs = useRef<
    Record<string, HTMLButtonElement | null>
  >({})

  const [uploadProgress, setUploadProgress] = useState<
    Record<string, number>
  >({})

  /* =====================================================
     AUTH + BUSINESS
  ===================================================== */

  useEffect(() => {
    const initialize = async () => {
      const storedToken = localStorage.getItem('token')

      if (!storedToken) {
        setError(
          'Authentication token not found. Please login again.'
        )
        return
      }

      setToken(storedToken)

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/business/me`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        )

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
            'Failed to load business profile.'
          )
        }

        const business =
          response.data.data?.business ||
          response.data.data

        const actualBusinessId =
          business?._id || business?.id

        if (!actualBusinessId) {
          throw new Error(
            'Business ID was not returned by the API.'
          )
        }

        setBusinessId(actualBusinessId)
        setBusinessCode(actualBusinessId)

        localStorage.setItem(
          'businessId',
          actualBusinessId
        )
      } catch (err: any) {
        console.error(
          'Business initialization error:',
          err.response?.data || err.message
        )

        setError(
          err.response?.data?.message ||
          'Failed to load business information.'
        )
      }
    }

    initialize()
  }, [])

  /* =====================================================
     INITIAL FETCH
  ===================================================== */

  useEffect(() => {
    if (!businessId || !token) return

    fetchFolders()
    fetchDocuments()
  }, [businessId, token])

  /* =====================================================
     FILE ICON
  ===================================================== */

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText

    if (mimeType.includes('pdf')) {
      return FileText
    }

    if (
      mimeType.includes('word') ||
      mimeType.includes('document')
    ) {
      return FileCheck
    }

    if (
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheet')
    ) {
      return FileSpreadsheet
    }

    if (mimeType.includes('image')) {
      return FileImage
    }

    return FileText
  }

  /* =====================================================
     FETCH FOLDERS
  ===================================================== */

  const fetchFolders = async () => {
    if (!businessId || !token) return

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/folders/business/${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          'Failed to fetch folders.'
        )
      }

      const backendFolders =
        response.data.data?.folders || []

      const formattedFolders: VaultFolder[] =
        backendFolders.map((folder: any) => {
          const slug =
            folder.slug ||
            folder.name
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')

          const config =
            SYSTEM_FOLDER_CONFIG[slug] ||
            SYSTEM_FOLDER_CONFIG[
            slug?.replace('-gst', '')
            ]

          return {
            id: folder._id,
            name: folder.name,
            hint:
              folder.description ||
              config?.hint ||
              'Your business documents',
            icon: config?.icon || Folder,
            custom: folder.type === 'custom',
            type: folder.type,
            slug,
            documentCount: folder.documentCount || 0,
          }
        })

      formattedFolders.sort((a, b) => {
        if (a.custom === b.custom) {
          return a.name.localeCompare(b.name)
        }

        return a.custom ? 1 : -1
      })

      setFolders(formattedFolders)
    } catch (err: any) {
      console.error(
        'Error fetching folders:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        'Failed to fetch folders.'
      )
    }
  }

  /* =====================================================
     FETCH DOCUMENTS
  ===================================================== */

  const fetchDocuments = async () => {
    if (!businessId || !token) return

    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/documents/business/${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          'Failed to fetch documents.'
        )
      }

      const documents =
        response.data.data?.documents || []

      const totalDocuments =
        response.data.data?.pagination?.total ??
        documents.length

      setDocumentCount(totalDocuments)

      const formattedDocs: CompanyDoc[] = documents.map(
        (doc: any) => ({
          id: doc._id,
          name:
            doc.name ||
            doc.originalName ||
            'Unnamed Document',

          uploaded: true,

          file:
            doc.originalName || doc.name || null,

          category: doc.category || 'other',

          url: doc.signedUrl,

          size: doc.size,

          mimeType: doc.mimeType,

          uploadedAt: doc.uploadedAt,

          folderId:
            doc.folderId ||
            doc.folder?._id ||
            doc.folder ||
            undefined,
        })
      )

      setUploadedDocuments(formattedDocs)

      const totalSize = formattedDocs.reduce(
        (acc, doc) => acc + (doc.size || 0),
        0
      )

      setTotalStorageUsed(totalSize)

      await fetchFolders()
    } catch (err: any) {
      console.error(
        'Error fetching documents:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        'Failed to fetch documents.'
      )
    } finally {
      setLoading(false)
    }
  }

  /* =====================================================
     GET CATEGORY FOR FOLDER
  ===================================================== */

  const getCategoryForFolder = (
    folder: VaultFolder
  ) => {
    if (folder.type === 'custom') {
      return 'other'
    }

    if (folder.slug) {
      const config = SYSTEM_FOLDER_CONFIG[folder.slug]

      if (config) {
        return config.category
      }
    }

    return 'other'
  }

  /* =====================================================
     UPLOAD FILE
  ===================================================== */

  const handleFileUpload = async (
    file: File,
    folderId?: string
  ) => {
    if (!businessId || !token) {
      setError('Missing business ID or authentication.')
      return
    }

    if (!folderId) {
      setError('Please select a folder before uploading.')
      return
    }

    const selectedFolder = folders.find(
      (folder) => folder.id === folderId
    )

    if (!selectedFolder) {
      setError('Selected folder not found.')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const category =
        getCategoryForFolder(selectedFolder)

      const generateResponse = await axios.post(
        `${API_BASE_URL}/api/v1/documents/generate-upload-url`,
        {
          businessId,
          category,
          folderId,
          fileName: file.name,
          mimeType:
            file.type || 'application/octet-stream',
          visibility: 'business',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!generateResponse.data?.success) {
        throw new Error(
          generateResponse.data?.message ||
          'Failed to generate upload URL.'
        )
      }

      const { uploadUrl, documentId } =
        generateResponse.data.data

      if (!uploadUrl || !documentId) {
        throw new Error(
          'Invalid upload response from server.'
        )
      }

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type':
            file.type || 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) /
              progressEvent.total
            )

            setUploadProgress((prev) => ({
              ...prev,
              [documentId]: percentCompleted,
            }))
          }
        },
      })

      await axios.put(
        `${API_BASE_URL}/api/v1/documents/${documentId}/confirm`,
        { size: file.size },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      await fetchDocuments()
    } catch (err: any) {
      console.error(
        'Upload error:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to upload file.'
      )
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  /* =====================================================
     FILE SELECT
  ===================================================== */

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (file && currentFolder) {
      await handleFileUpload(file, currentFolder)
    }

    e.target.value = ''
  }

  /* =====================================================
     VIEW DOCUMENT
  ===================================================== */

  const handleViewDocument = async (doc: CompanyDoc) => {
    if (!doc.uploaded || !doc.id) {
      return
    }

    try {
      if (doc.url) {
        window.open(
          doc.url,
          '_blank',
          'noopener,noreferrer'
        )
        return
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/documents/${doc.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const downloadUrl =
        response.data?.data?.downloadUrl

      if (downloadUrl) {
        window.open(
          downloadUrl,
          '_blank',
          'noopener,noreferrer'
        )
      } else {
        setError('No document URL available.')
      }
    } catch (err: any) {
      console.error(
        'Error viewing document:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        'Failed to open document.'
      )
    }
  }

  /* =====================================================
     DOWNLOAD DOCUMENT
  ===================================================== */

  const handleDownloadDocument = async (
    doc: CompanyDoc
  ) => {
    if (!doc.uploaded || !doc.id) {
      return
    }

    try {
      let downloadUrl = doc.url

      if (!downloadUrl) {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/documents/${doc.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        downloadUrl = response.data?.data?.downloadUrl
      }

      if (!downloadUrl) {
        setError('No download URL available.')
        return
      }

      const fileResponse = await axios.get(downloadUrl, {
        responseType: 'blob',
      })

      const blob = new Blob([fileResponse.data], {
        type: doc.mimeType || 'application/octet-stream',
      })

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url
      link.download = doc.file || doc.name || 'document'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error(
        'Error downloading document:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        'Failed to download document.'
      )
    }
  }

  /* =====================================================
     MOVE DOCUMENT
  ===================================================== */

  const handleMoveDocument = async (
    docId: string,
    folderId: string
  ) => {
    if (!docId || !folderId) return

    try {
      setMovingDocument(docId)
      setError(null)

      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/documents/${docId}/move`,
        { folderId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          'Failed to move document.'
        )
      }

      setUploadedDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
              ...doc,
              folderId,
              category:
                response.data?.data?.category ||
                doc.category,
            }
            : doc
        )
      )

      await fetchFolders()
    } catch (err: any) {
      console.error(
        'Error moving document:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to move document.'
      )
    } finally {
      setMovingDocument(null)
    }
  }

  /* =====================================================
     DELETE DOCUMENT
  ===================================================== */

  const handleDeleteDocument = async (docId: string) => {
    if (
      !confirm('Remove this document from the vault?')
    ) {
      return
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/documents/${docId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const updatedDocs = uploadedDocuments.filter(
        (doc) => doc.id !== docId
      )

      setUploadedDocuments(updatedDocs)

      setDocumentCount((prev) => Math.max(prev - 1, 0))

      setTotalStorageUsed(
        updatedDocs.reduce(
          (acc, doc) => acc + (doc.size || 0),
          0
        )
      )

      await fetchFolders()
    } catch (err: any) {
      console.error(
        'Error deleting document:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        'Failed to delete document.'
      )
    }
  }

  /* =====================================================
     CREATE FOLDER
  ===================================================== */

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()

    if (!name) {
      return
    }

    if (!businessId || !token) {
      setError('Missing business ID or authentication.')
      return
    }

    try {
      setCreatingFolder(true)
      setError(null)

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/folders`,
        { businessId, name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          'Failed to create folder.'
        )
      }

      setNewFolderName('')
      setShowNewFolder(false)

      await fetchFolders()
    } catch (err: any) {
      console.error(
        'Error creating folder:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        'Failed to create folder.'
      )
    } finally {
      setCreatingFolder(false)
    }
  }

  /* =====================================================
     START RENAME
  ===================================================== */

  const startRenameFolder = (folder: VaultFolder) => {
    if (folder.type !== 'custom') {
      return
    }

    setRenamingFolder(folder.id)
    setRenameValue(folder.name)
  }

  /* =====================================================
     SAVE RENAME
  ===================================================== */

  const handleRenameFolder = async () => {
    if (!renamingFolder || !renameValue.trim()) {
      return
    }

    try {
      setSavingRename(true)
      setError(null)

      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/folders/${renamingFolder}`,
        { name: renameValue.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          'Failed to rename folder.'
        )
      }

      setRenamingFolder(null)
      setRenameValue('')

      await fetchFolders()
    } catch (err: any) {
      console.error(
        'Error renaming folder:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        'Failed to rename folder.'
      )
    } finally {
      setSavingRename(false)
    }
  }

  /* =====================================================
     DELETE FOLDER
  ===================================================== */

  const handleDeleteFolder = async (
    folder: VaultFolder
  ) => {
    if (folder.type !== 'custom') {
      return
    }

    const folderDocs = docsIn(folder.id)

    if (folderDocs.length > 0) {
      setError('Empty the folder before deleting it.')
      return
    }

    if (!confirm(`Delete "${folder.name}"?`)) {
      return
    }

    try {
      setError(null)

      await axios.delete(
        `${API_BASE_URL}/api/v1/folders/${folder.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (currentFolder === folder.id) {
        setCurrentFolder(null)
      }

      await fetchFolders()
    } catch (err: any) {
      console.error(
        'Error deleting folder:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
        'Failed to delete folder.'
      )
    }
  }

  /* =====================================================
     HELPERS
  ===================================================== */

  const formatFileSize = (bytes?: number) => {
    if (!bytes) {
      return '0 B'
    }

    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatStorageUsed = (bytes: number) => {
    const limit = 1 * 1024 * 1024 * 1024
    const used = Math.min(bytes, limit)
    const percentage = (used / limit) * 100

    if (used < 1024 * 1024) {
      return {
        used: `${(used / 1024).toFixed(1)} KB`,
        percentage,
      }
    }

    if (used < 1024 * 1024 * 1024) {
      return {
        used: `${(used / (1024 * 1024)).toFixed(1)} MB`,
        percentage,
      }
    }

    return {
      used: '1.0 GB',
      percentage: 100,
    }
  }

  const getFileExtension = (fileName: string | null) => {
    if (!fileName) {
      return ''
    }

    const parts = fileName.split('.')

    return parts.length > 1
      ? parts[parts.length - 1].toUpperCase()
      : ''
  }

  const folderOf = (doc: CompanyDoc) => {
    return doc.folderId || null
  }

  const docsIn = (folderId: string) => {
    return uploadedDocuments.filter(
      (doc) => folderOf(doc) === folderId
    )
  }

  const storageInfo = formatStorageUsed(totalStorageUsed)

  const activeProgress = uploading
    ? Object.values(uploadProgress)[0] ?? 0
    : null

  const activeFolder =
    folders.find(
      (folder) => folder.id === currentFolder
    ) || null

  const folderDocs = activeFolder
    ? docsIn(activeFolder.id)
    : []

  const openDoc = openMoveMenu
    ? folderDocs.find((d) => d.id === openMoveMenu)
    : null

  const openAnchor = openMoveMenu
    ? anchorRefs.current[openMoveMenu]
    : null

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[#0a0a0a] text-white`}
      style={{
        fontFamily:
          'var(--font-body), system-ui, sans-serif',
        backgroundImage:
          'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(250,204,21,0.08), transparent 70%)',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 flex items-center justify-between"
          >
            <p className="text-sm text-red-300">{error}</p>

            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="text-red-300 hover:text-red-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl border border-yellow-400/25 bg-yellow-400/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-yellow-300" />
            </div>

            <div>
              <h1
                className="text-3xl"
                style={{
                  fontFamily:
                    'var(--font-display), serif',
                }}
              >
                NyayVault
              </h1>

              <p className="text-sm text-white/45">
                Your private document vault
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSecurityInfo(true)}
              aria-label="How NyayVault protects your data"
              title="How we protect your data"
              className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] text-white/55 hover:text-yellow-300 hover:border-yellow-400/40 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>

            {activeFolder && (
              <button
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 text-black rounded-full font-semibold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {activeProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Summary */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p
                className="text-4xl leading-none"
                style={{
                  fontFamily:
                    'var(--font-display), serif',
                }}
              >
                {documentCount}
              </p>

              <p className="text-sm text-white/45 mt-2">
                {documentCount === 1
                  ? 'document stored'
                  : 'documents stored'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-white/70">
                {storageInfo.used} of 1 GB
              </p>

              <p className="text-xs text-white/35 mt-1">
                Vault ID{' '}
                <span className="font-mono text-yellow-300/90">
                  {businessCode || 'Loading...'}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${storageInfo.percentage > 90
                ? 'bg-red-400'
                : 'bg-yellow-400'
                }`}
              style={{
                width: `${Math.min(
                  Math.max(
                    storageInfo.percentage,
                    documentCount > 0 ? 1 : 0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </section>

        {/* Breadcrumb */}
        <nav
          aria-label="Folder path"
          className="mt-8 mb-3 px-1 flex items-center justify-between"
        >
          <div className="flex items-center gap-1.5 text-sm">
            <button
              onClick={() => setCurrentFolder(null)}
              className={`rounded px-1 transition-colors ${activeFolder
                ? 'text-white/50 hover:text-white'
                : 'text-white'
                }`}
              style={{
                fontFamily:
                  'var(--font-display), serif',
                fontSize: '1.125rem',
              }}
            >
              Vault
            </button>

            {activeFolder && (
              <>
                <ChevronRight className="w-4 h-4 text-white/25" />

                <span
                  className="text-white px-1"
                  style={{
                    fontFamily:
                      'var(--font-display), serif',
                    fontSize: '1.125rem',
                  }}
                >
                  {activeFolder.name}
                </span>
              </>
            )}
          </div>

          <button
            onClick={() => {
              fetchFolders()
              fetchDocuments()
            }}
            className="text-xs text-white/45 hover:text-white transition-colors px-2 py-1 rounded"
          >
            Refresh
          </button>
        </nav>

        {/* Content */}
        <motion.div
          key={currentFolder ?? 'root'}
          initial={{
            opacity: 0,
            y: currentFolder ? -22 : 6,
          }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 26,
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
            </div>
          ) : !activeFolder ? (
            <>
              {/* Folder grid */}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#17181a] to-[#0d0d0e] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_60px_-30px_rgba(0,0,0,0.9)]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {folders.map((folder) => {
                    const docs = docsIn(folder.id)

                    const size = docs.reduce(
                      (acc, doc) =>
                        acc + (doc.size || 0),
                      0
                    )

                    const isTarget =
                      dragFolder === folder.id

                    return (
                      <div
                        key={folder.id}
                        className={`group relative aspect-[4/3] rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${isTarget
                          ? 'border-yellow-400 shadow-[0_0_28px_rgba(250,204,21,0.35)] bg-gradient-to-b from-[#3a3521] to-[#1a1810]'
                          : 'border-white/10 bg-gradient-to-b from-[#2a2c30] to-[#141517] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-10px_18px_rgba(0,0,0,0.5)] hover:border-yellow-400/40'
                          }`}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setDragFolder(folder.id)
                        }}
                        onDragLeave={() =>
                          setDragFolder(null)
                        }
                        onDrop={(e) => {
                          e.preventDefault()
                          setDragFolder(null)

                          const file =
                            e.dataTransfer.files[0]

                          if (file) {
                            handleFileUpload(
                              file,
                              folder.id
                            )
                          }
                        }}
                      >
                        <button
                          onClick={() =>
                            setCurrentFolder(folder.id)
                          }
                          aria-label={`${folder.name}, ${docs.length} files`}
                          className="absolute inset-0 w-full h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 rounded-xl"
                        />

                        <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded bg-gradient-to-b from-yellow-200 to-yellow-500 px-2.5 py-0.5 text-[11px] font-semibold text-black shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_2px_4px_rgba(0,0,0,0.5)] whitespace-nowrap">
                          {folder.name}
                        </span>

                        <span className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none">
                          <Keyhole
                            lit={
                              docs.length > 0 ||
                              isTarget
                            }
                            className="w-8 h-8"
                          />
                        </span>

                        <span className="absolute bottom-3 left-3 text-[11px] text-white/45">
                          {docs.length}{' '}
                          {docs.length === 1
                            ? 'file'
                            : 'files'}

                          {docs.length > 0 &&
                            ` · ${formatFileSize(size)}`}
                        </span>

                        {folder.custom && (
                          <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                startRenameFolder(
                                  folder
                                )
                              }}
                              title="Rename folder"
                              className="p-1.5 rounded-md bg-black/40 text-white/40 hover:text-yellow-300 hover:bg-black/70"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFolder(
                                  folder
                                )
                              }}
                              disabled={docs.length > 0}
                              title={
                                docs.length > 0
                                  ? 'Empty folder first'
                                  : 'Delete folder'
                              }
                              className="p-1.5 rounded-md bg-black/40 text-white/40 hover:text-red-400 hover:bg-black/70 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {showNewFolder ? (
                    <div className="aspect-[4/3] rounded-xl border border-yellow-400/40 bg-yellow-400/5 p-3 flex flex-col justify-center gap-2">
                      <input
                        autoFocus
                        value={newFolderName}
                        maxLength={100}
                        onChange={(e) =>
                          setNewFolderName(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateFolder()
                          }

                          if (e.key === 'Escape') {
                            setShowNewFolder(false)
                            setNewFolderName('')
                          }
                        }}
                        placeholder="Folder name"
                        aria-label="Folder name"
                        className="w-full rounded-md bg-black/50 border border-white/15 px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateFolder}
                          disabled={
                            creatingFolder ||
                            !newFolderName.trim()
                          }
                          className="flex-1 rounded-md bg-yellow-400 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                        >
                          {creatingFolder
                            ? 'Creating…'
                            : 'Create'}
                        </button>

                        <button
                          onClick={() => {
                            setShowNewFolder(false)
                            setNewFolderName('')
                          }}
                          className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setShowNewFolder(true)
                      }
                      className="aspect-[4/3] rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-1.5 text-white/45 hover:text-yellow-300 hover:border-yellow-400/50 transition-colors"
                    >
                      <Plus className="w-6 h-6" />

                      <span className="text-xs">
                        New folder
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {renamingFolder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                  <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171717] p-5 shadow-2xl">
                    <h3
                      className="text-lg"
                      style={{
                        fontFamily:
                          'var(--font-display), serif',
                      }}
                    >
                      Rename folder
                    </h3>

                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) =>
                        setRenameValue(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameFolder()
                        }

                        if (e.key === 'Escape') {
                          setRenamingFolder(null)
                        }
                      }}
                      className="mt-4 w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                    />

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() =>
                          setRenamingFolder(null)
                        }
                        className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleRenameFolder}
                        disabled={
                          savingRename ||
                          !renameValue.trim()
                        }
                        className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                      >
                        {savingRename
                          ? 'Saving…'
                          : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-white/30 text-center mt-6">
                {uploading
                  ? `Uploading… ${activeProgress}%`
                  : 'Open a folder to add files, or drop a file onto one.'}
              </p>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <Keyhole lit className="w-5 h-5" />

                    <span className="rounded bg-gradient-to-b from-yellow-200 to-yellow-500 px-2.5 py-0.5 text-[11px] font-semibold text-black">
                      {activeFolder.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">
                      {folderDocs.length}{' '}
                      {folderDocs.length === 1
                        ? 'file'
                        : 'files'}
                    </span>

                    {activeFolder.custom && (
                      <>
                        <button
                          onClick={() =>
                            startRenameFolder(
                              activeFolder
                            )
                          }
                          className="text-xs text-white/45 hover:text-yellow-300 rounded px-1"
                        >
                          Rename
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteFolder(
                              activeFolder
                            )
                          }
                          disabled={
                            folderDocs.length > 0
                          }
                          title={
                            folderDocs.length > 0
                              ? 'Empty the folder first'
                              : 'Delete folder'
                          }
                          className="text-xs text-white/45 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded px-1"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {folderDocs.length === 0 ? (
                  <div className="text-center py-14">
                    <activeFolder.icon className="w-8 h-8 mx-auto mb-3 text-white/15" />

                    <p className="text-sm text-white/60">
                      No files in {activeFolder.name} yet
                    </p>

                    <p className="text-xs text-white/35 mt-1">
                      {activeFolder.hint}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.06]">
                    {folderDocs.map((doc) => {
                      const FileIcon = getFileIcon(
                        doc.mimeType
                      )

                      const fileExt = getFileExtension(
                        doc.file
                      )

                      const isMenuOpen =
                        openMoveMenu === doc.id

                      return (
                        <li
                          key={doc.id}
                          className="relative flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                              <FileIcon className="w-4 h-4 text-yellow-300" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">
                                {doc.name}
                              </p>

                              <p className="text-xs text-white/40 mt-0.5">
                                {fileExt || 'FILE'} ·{' '}
                                {formatFileSize(doc.size)}

                                {doc.uploadedAt &&
                                  ` · ${new Date(
                                    doc.uploadedAt
                                  ).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              ref={(el) => {
                                anchorRefs.current[doc.id] =
                                  el
                              }}
                              type="button"
                              disabled={
                                movingDocument === doc.id
                              }
                              onClick={() =>
                                setOpenMoveMenu(
                                  (current) =>
                                    current === doc.id
                                      ? null
                                      : doc.id
                                )
                              }
                              aria-label={`Move ${doc.name}`}
                              aria-haspopup="menu"
                              aria-expanded={isMenuOpen}
                              title="Move to folder"
                              className="p-2 rounded-lg text-white/45 hover:text-yellow-300 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-wait"
                            >
                              {movingDocument ===
                                doc.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FolderInput className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() =>
                                handleViewDocument(doc)
                              }
                              aria-label={`Open ${doc.name}`}
                              title="Open"
                              className="p-2 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                handleDownloadDocument(doc)
                              }
                              aria-label={`Download ${doc.name}`}
                              title="Download"
                              className="p-2 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteDocument(doc.id)
                              }
                              aria-label={`Remove ${doc.name}`}
                              title="Delete"
                              className="p-2 rounded-lg text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Drop area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() =>
                  setIsDragging(false)
                }
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)

                  const file = e.dataTransfer.files[0]

                  if (file) {
                    handleFileUpload(
                      file,
                      activeFolder.id
                    )
                  }
                }}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' ||
                    e.key === ' '
                  ) {
                    e.preventDefault()

                    fileInputRef.current?.click()
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Upload to ${activeFolder.name}. Drop a file here or press Enter to browse`}
                className={`mt-6 rounded-2xl border border-dashed p-8 text-center cursor-pointer transition-colors ${isDragging
                  ? 'border-yellow-400 bg-yellow-400/5'
                  : 'border-white/15 hover:border-white/30'
                  }`}
              >
                <Upload
                  className={`w-5 h-5 mx-auto mb-2 ${isDragging
                    ? 'text-yellow-300'
                    : 'text-white/30'
                    }`}
                />

                <p className="text-sm text-white/60">
                  {isDragging
                    ? `Release to add to ${activeFolder.name}`
                    : `Drop a file into ${activeFolder.name}, or click to browse`}
                </p>

                <p className="text-xs text-white/30 mt-1">
                  PDF, DOC, DOCX, XLS, XLSX, PNG, JPG · up
                  to 100 MB
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-white/30">
          <ShieldCheck className="w-4 h-4 text-yellow-400/60" />

          <p>Every file is AES-256 encrypted</p>

          <button
            onClick={() => setShowSecurityInfo(true)}
            className="underline decoration-dotted underline-offset-2 hover:text-yellow-300 transition-colors"
          >
            Learn more
          </button>
        </footer>
      </div>

      {/* Move menu rendered in a portal */}
      {openDoc && openAnchor && (
        <MoveMenu
          anchorEl={openAnchor}
          folders={folders}
          currentFolderId={openDoc.folderId}
          disabled={movingDocument === openDoc.id}
          onSelect={async (folderId) => {
            setOpenMoveMenu(null)
            await handleMoveDocument(openDoc.id, folderId)
          }}
          onClose={() => setOpenMoveMenu(null)}
        />
      )}

      {/* Security info modal */}
      <SecurityInfoModal
        open={showSecurityInfo}
        onClose={() => setShowSecurityInfo(false)}
      />
    </div>
  )
}