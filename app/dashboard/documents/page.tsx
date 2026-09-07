'use client'

import { motion } from 'framer-motion'
import {
  Upload,
  FileText,
  Building2,
  Eye,
  Download,
  Trash2,
  Loader2,
  X,
  FileSpreadsheet,
  FileImage,
  FileCheck,
  HardDrive,
  FolderOpen,
  Building
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

// Types
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
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app'

export default function DocumentsPage() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [token, setToken] = useState<string>('')
  const [businessId, setBusinessId] = useState<string>('')
  const [businessCode, setBusinessCode] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [documentCount, setDocumentCount] = useState<number>(0)
  const [totalStorageUsed, setTotalStorageUsed] = useState<number>(0)
  const [uploadedDocuments, setUploadedDocuments] = useState<CompanyDoc[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // Get token and business info from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUserId = localStorage.getItem('userId')
    const storedBusinessCode = localStorage.getItem('businessCode') || localStorage.getItem('userId')

    console.log('🔐 Stored Token:', storedToken ? 'Present' : 'Missing')
    console.log('🏢 Stored userId (Business Code):', storedUserId || 'Missing')

    if (storedToken) setToken(storedToken)
    if (storedUserId) {
      setBusinessId(storedUserId)
      setBusinessCode(storedUserId)
      localStorage.setItem('businessId', storedUserId)
      localStorage.setItem('businessCode', storedUserId)
    } else {
      // Fallback: try to get from userProfile
      try {
        const userProfile = localStorage.getItem('userProfile')
        if (userProfile) {
          const user = JSON.parse(userProfile)
          if (user.userId) {
            setBusinessId(user.userId)
            setBusinessCode(user.userId)
            localStorage.setItem('businessId', user.userId)
            localStorage.setItem('businessCode', user.userId)
            console.log('✅ Business ID set from user profile:', user.userId)
          }
        }
      } catch (e) {
        console.error('Error parsing user profile:', e)
      }
    }
  }, [])

  // Fetch documents on mount
  useEffect(() => {
    if (businessId && token) {
      fetchDocuments()
    }
  }, [businessId, token])

  // Get file icon based on mime type
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('word') || mimeType.includes('document')) return FileCheck
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileSpreadsheet
    if (mimeType.includes('image')) return FileImage
    return FileText
  }

  // Fetch all business documents
  const fetchDocuments = async () => {
    if (!businessId) return

    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/documents/business/${businessId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        const documents = response.data.data.documents || []
        const totalDocuments = response.data.data.pagination?.total || 0

        setDocumentCount(totalDocuments)

        const formattedDocs: CompanyDoc[] = documents.map((doc: any) => ({
          id: doc._id,
          name: doc.name || doc.originalName || 'Unnamed Document',
          uploaded: true,
          file: doc.originalName || doc.name,
          category: doc.category || 'other',
          url: doc.signedUrl,
          size: doc.size,
          mimeType: doc.mimeType,
          uploadedAt: doc.uploadedAt
        }))

        setUploadedDocuments(formattedDocs)

        // Calculate total storage used
        const totalSize = formattedDocs.reduce((acc, doc) => acc + (doc.size || 0), 0)
        setTotalStorageUsed(totalSize)
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error.response?.data || error.message)
      setError(error.response?.data?.message || 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  // Upload file
  const handleFileUpload = async (file: File) => {
    if (!businessId || !token) {
      setError('Missing business ID or authentication')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const category = 'other'

      // Step 1: Generate upload URL
      const generateResponse = await axios.post(
        `${API_BASE_URL}/api/v1/documents/generate-upload-url`,
        {
          businessId: businessId,
          category: category,
          fileName: file.name,
          mimeType: file.type,
          visibility: 'business'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!generateResponse.data.success) {
        throw new Error(generateResponse.data.message)
      }

      const { uploadUrl, documentId } = generateResponse.data.data

      // Step 2: Upload file to R2
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(prev => ({ ...prev, [documentId]: percentCompleted }))
          }
        }
      })

      // Step 3: Confirm upload
      await axios.put(
        `${API_BASE_URL}/api/v1/documents/${documentId}/confirm`,
        { size: file.size },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Refresh documents
      await fetchDocuments()

      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[documentId]
        return newProgress
      })

    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message)
      setError(error.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
    e.target.value = ''
  }

  const handleViewDocument = async (doc: CompanyDoc) => {
    if (!doc.uploaded || !doc.id) return

    try {
      if (doc.url) {
        window.open(doc.url, '_blank')
        return
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/documents/${doc.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success && response.data.data.downloadUrl) {
        window.open(response.data.data.downloadUrl, '_blank')
      }
    } catch (error: any) {
      console.error('Error viewing document:', error.response?.data || error.message)
      setError('Failed to view document')
    }
  }

  const handleDownloadDocument = async (doc: CompanyDoc) => {
    if (!doc.uploaded || !doc.id) return

    try {
      let downloadUrl = doc.url

      if (!downloadUrl) {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/documents/${doc.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (response.data.success && response.data.data.downloadUrl) {
          downloadUrl = response.data.data.downloadUrl
        } else {
          setError('No download URL available')
          return
        }
      }

      if (!downloadUrl) {
        setError('No download URL available')
        return
      }

      const fileResponse = await axios.get(downloadUrl, { responseType: 'blob' })
      const blob = new Blob([fileResponse.data], {
        type: doc.mimeType || 'application/octet-stream'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.file || doc.name || 'document'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading document:', error.response?.data || error.message)
      setError('Failed to download document')
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/documents/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId))
      setDocumentCount(prev => prev - 1)

      // Recalculate storage
      const updatedDocs = uploadedDocuments.filter(doc => doc.id !== docId)
      const totalSize = updatedDocs.reduce((acc, doc) => acc + (doc.size || 0), 0)
      setTotalStorageUsed(totalSize)
    } catch (error: any) {
      console.error('Error deleting document:', error.response?.data || error.message)
      setError('Failed to delete document')
    }
  }

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Format storage used with 1GB limit
  const formatStorageUsed = (bytes: number) => {
    const limit = 1 * 1024 * 1024 * 1024 // 1GB
    const used = Math.min(bytes, limit)
    const percentage = (used / limit) * 100

    if (used < 1024 * 1024) {
      return { used: (used / 1024).toFixed(1) + ' KB', percentage: percentage.toFixed(1) }
    } else if (used < 1024 * 1024 * 1024) {
      return { used: (used / (1024 * 1024)).toFixed(1) + ' MB', percentage: percentage.toFixed(1) }
    }
    return { used: '1.0 GB', percentage: '100' }
  }

  // Get file extension
  const getFileExtension = (fileName: string | null) => {
    if (!fileName) return ''
    const parts = fileName.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : ''
  }

  const storageInfo = formatStorageUsed(totalStorageUsed)

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Vault</h1>
            <p className="text-sm text-white/40">Secure document storage</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </button>
        </div>

        {/* Business Code Display */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4 flex items-center gap-3">
          <Building className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-xs text-white/40">Business Code</p>
            <p className="text-lg font-mono text-white font-bold">{businessCode || 'Not set'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-xs text-white/40">Documents</p>
            <p className="text-xl font-bold text-white">{documentCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-xs text-white/40">Storage Used</p>
            <p className="text-xl font-bold text-white">{storageInfo.used} / 1 GB</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${parseFloat(storageInfo.percentage) > 90 ? 'bg-red-500' : 'bg-yellow-400'
                  }`}
                style={{ width: `${Math.min(parseFloat(storageInfo.percentage), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-yellow-400" />
              <h2 className="text-sm font-medium text-white">All Documents</h2>
              <span className="text-xs text-white/30">{documentCount} files</span>
            </div>
            <button onClick={fetchDocuments} className="text-xs text-white/40 hover:text-white transition-colors">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
          ) : uploadedDocuments.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p className="text-sm text-white/30">No documents uploaded yet</p>
              <p className="text-xs text-white/20 mt-1">Click the Upload button to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {uploadedDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.mimeType)
                const fileExt = getFileExtension(doc.file)
                const progress = uploadProgress[doc.id]

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-emerald-500/10 flex-shrink-0">
                        <FileIcon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-white/30">
                          <span className="uppercase">{fileExt || 'FILE'}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.size)}</span>
                          {doc.uploadedAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                        {progress !== undefined && progress < 100 && (
                          <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                            <div
                              className="bg-yellow-400 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upload Area - Drag & Drop */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const files = e.dataTransfer.files
            if (files.length > 0) {
              handleFileUpload(files[0])
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${isDragging
            ? 'border-yellow-400 bg-yellow-500/5'
            : 'border-white/10 hover:border-white/20'
            }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-yellow-400' : 'text-white/20'}`} />
          <p className="text-sm text-white/40">
            {isDragging ? 'Drop files here' : 'Drag & drop files here or click to browse'}
          </p>
          <p className="text-xs text-white/20 mt-1">Supports: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG • Max 100MB</p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-white/20">
          <p>All files are AES-256 encrypted • Secure storage</p>
        </div>
      </div>
    </div>
  )
}