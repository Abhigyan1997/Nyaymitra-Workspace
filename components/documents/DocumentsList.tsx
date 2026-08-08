'use client'

import { motion } from 'framer-motion'
import { FileText, Download, Share2, MoreVertical, Calendar, User } from 'lucide-react'

interface DocumentsListProps {
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
    uploadedBy: 'John Smith',
  },
  {
    id: 2,
    name: 'TechCorp Acquisition - Term Sheet',
    type: 'docx',
    size: '580 KB',
    matter: 'TechCorp M&A',
    uploadedDate: '2024-02-20',
    uploadedBy: 'Sarah Johnson',
  },
  {
    id: 3,
    name: 'Blue Inc. Contract - Final Draft',
    type: 'pdf',
    size: '1.2 MB',
    matter: 'Blue Inc. Contract',
    uploadedDate: '2024-02-18',
    uploadedBy: 'Michael Chen',
  },
  {
    id: 4,
    name: 'Riverside Property - Title Documents',
    type: 'pdf',
    size: '3.1 MB',
    matter: 'Property Dispute',
    uploadedDate: '2024-02-16',
    uploadedBy: 'Jessica Lee',
  },
  {
    id: 5,
    name: 'GreenEnergy - Board Minutes',
    type: 'docx',
    size: '245 KB',
    matter: 'GreenEnergy LLC',
    uploadedDate: '2024-02-19',
    uploadedBy: 'David Martinez',
  },
  {
    id: 6,
    name: 'Financial Services - Compliance Report',
    type: 'xlsx',
    size: '890 KB',
    matter: 'FinServe Compliance',
    uploadedDate: '2024-02-17',
    uploadedBy: 'Emily Thompson',
  },
]

const getFileTypeColor = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'bg-destructive/10 text-destructive'
    case 'docx':
      return 'bg-secondary/10 text-secondary'
    case 'xlsx':
      return 'bg-accent/10 text-accent'
    default:
      return 'bg-primary/10 text-primary'
  }
}

export function DocumentsList({ searchQuery }: DocumentsListProps) {
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

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="min-w-full"
        >
          {/* Headers */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-background/30">
            <div className="col-span-4">Document</div>
            <div className="col-span-2">Matter</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Rows */}
          {filteredDocuments.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  variants={rowVariants}
                  whileHover={{ backgroundColor: 'rgba(245, 158, 11, 0.03)' }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-background/50 transition-colors duration-200 group items-center"
                >
                  {/* Document */}
                  <div className="col-span-4 flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${getFileTypeColor(doc.type)}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.type.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Matter */}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{doc.matter}</p>
                  </div>

                  {/* Uploaded */}
                  <div className="col-span-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-foreground">{doc.uploadedDate}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {doc.uploadedBy}
                      </div>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{doc.size}</p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg hover:bg-background transition-colors"
                    >
                      <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg hover:bg-background transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg hover:bg-background transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 py-12 text-center"
            >
              <p className="text-muted-foreground mb-2">No documents found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search query</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      {filteredDocuments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-6 py-4 border-t border-border bg-background/30 text-xs text-muted-foreground"
        >
          Showing {filteredDocuments.length} of {documents.length} documents
        </motion.div>
      )}
    </motion.div>
  )
}
