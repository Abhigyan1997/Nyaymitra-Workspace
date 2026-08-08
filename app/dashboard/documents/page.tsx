'use client'

import { motion } from 'framer-motion'
import { Upload, Grid3x3, List, Search, Filter } from 'lucide-react'
import { DocumentsGrid } from '@/components/documents/DocumentsGrid'
import { DocumentsList } from '@/components/documents/DocumentsList'
import { useState } from 'react'

export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file drop logic here
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Documents</h1>
        <p className="text-muted-foreground">Upload, organize, and manage all your legal documents.</p>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card border border-border rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
            />
          </div>

          {/* Filter */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-background border border-border hover:border-primary/50 transition-all duration-200"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter</span>
          </motion.button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 bg-background rounded-lg p-1 border border-border">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-all duration-200 ${viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
              }`}
            title="Grid View"
          >
            <Grid3x3 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-all duration-200 ${viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
              }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Upload Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm">Upload</span>
        </motion.button>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background/30 hover:border-primary/50'
          }`}
      >
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary mb-4"
        >
          <Upload className="w-8 h-8" />
        </motion.div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Drag files here</h3>
        <p className="text-sm text-muted-foreground mb-4">
          or click to select files from your computer
        </p>
        <p className="text-xs text-muted-foreground">
          Supported formats: PDF, DOC, DOCX, XLS, XLSX (Max 100MB)
        </p>
      </motion.div>

      {/* Documents View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {viewMode === 'grid' ? (
          <DocumentsGrid searchQuery={searchQuery} />
        ) : (
          <DocumentsList searchQuery={searchQuery} />
        )}
      </motion.div>
    </div>
  )
}
