'use client'

import { motion } from 'framer-motion'
import { FileText, Download, Share2, MoreVertical, Eye } from 'lucide-react'
import { useState } from 'react'

interface DocumentsGridProps {
  searchQuery: string
}

const documents = [
  {
    id: 1,
    name: 'Smith vs Jones - Discovery Documents',
    type: 'pdf',
    size: '2.4 MB',
    matter: 'Smith vs. Jones',
    uploadedDate: '2024-02-15',
    preview: 'pdf',
  },
  {
    id: 2,
    name: 'TechCorp Acquisition - Term Sheet',
    type: 'docx',
    size: '580 KB',
    matter: 'TechCorp M&A',
    uploadedDate: '2024-02-20',
    preview: 'doc',
  },
  {
    id: 3,
    name: 'Blue Inc. Contract - Final Draft',
    type: 'pdf',
    size: '1.2 MB',
    matter: 'Blue Inc. Contract',
    uploadedDate: '2024-02-18',
    preview: 'pdf',
  },
  {
    id: 4,
    name: 'Riverside Property - Title Documents',
    type: 'pdf',
    size: '3.1 MB',
    matter: 'Property Dispute',
    uploadedDate: '2024-02-16',
    preview: 'pdf',
  },
  {
    id: 5,
    name: 'GreenEnergy - Board Minutes',
    type: 'docx',
    size: '245 KB',
    matter: 'GreenEnergy LLC',
    uploadedDate: '2024-02-19',
    preview: 'doc',
  },
  {
    id: 6,
    name: 'Financial Services - Compliance Report',
    type: 'xlsx',
    size: '890 KB',
    matter: 'FinServe Compliance',
    uploadedDate: '2024-02-17',
    preview: 'sheet',
  },
]

const getPreviewColor = (preview: string) => {
  switch (preview) {
    case 'pdf':
      return 'bg-destructive/10 text-destructive'
    case 'doc':
      return 'bg-secondary/10 text-secondary'
    case 'sheet':
      return 'bg-accent/10 text-accent'
    default:
      return 'bg-primary/10 text-primary'
  }
}

export function DocumentsGrid({ searchQuery }: DocumentsGridProps) {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.matter.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {filteredDocuments.map((doc) => (
        <motion.div
          key={doc.id}
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-200 cursor-pointer"
          onMouseEnter={() => setSelectedDocId(doc.id)}
          onMouseLeave={() => setSelectedDocId(null)}
        >
          {/* Preview Area */}
          <div
            className={`mb-4 h-32 rounded-lg flex items-center justify-center ${getPreviewColor(
              doc.preview
            )} transition-all duration-200`}
          >
            <FileText className="w-12 h-12" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {doc.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{doc.matter}</p>
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{doc.size}</span>
              <span>{doc.uploadedDate}</span>
            </div>

            {/* Actions */}
            <div
              className={`flex gap-2 transition-all duration-200 ${
                selectedDocId === doc.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-background border border-border hover:border-primary transition-all duration-200 text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Preview
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-background border border-border hover:border-primary transition-all duration-200"
              >
                <Download className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-background border border-border hover:border-primary transition-all duration-200"
              >
                <MoreVertical className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Hover Border Accent */}
          <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-t-xl" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
