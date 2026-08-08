'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface RequestProfessionalModalProps {
  isOpen: boolean
  onClose: () => void
}

type ProfessionalType = 'Lawyer' | 'Chartered Accountant' | 'Company Secretary'
type PracticeArea = 'Corporate' | 'Contracts' | 'Employment' | 'Trademark' | 'Compliance' | 'Tax' | 'Company Law' | 'Fundraising'
type Priority = 'Normal' | 'Urgent'

export function RequestProfessionalModal({ isOpen, onClose }: RequestProfessionalModalProps) {
  const [professionalType, setProfessionalType] = useState<ProfessionalType | ''>('')
  const [practiceArea, setPracticeArea] = useState<PracticeArea | ''>('')
  const [priority, setPriority] = useState<Priority>('Normal')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  const professionalTypes: ProfessionalType[] = ['Lawyer', 'Chartered Accountant', 'Company Secretary']
  const practiceAreas: PracticeArea[] = ['Corporate', 'Contracts', 'Employment', 'Trademark', 'Compliance', 'Tax', 'Company Law', 'Fundraising']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Request Professional</h2>
            <p className="text-sm text-muted-foreground mt-1">Connect with legal experts from our network</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-1 hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Professional Type */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Professional Type</label>
            <select
              value={professionalType}
              onChange={(e) => setProfessionalType(e.target.value as ProfessionalType)}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Select professional type</option>
              {professionalTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Practice Area */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Practice Area</label>
            <select
              value={practiceArea}
              onChange={(e) => setPracticeArea(e.target.value as PracticeArea)}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Select practice area</option>
              {practiceAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Priority</label>
            <div className="flex gap-2">
              {(['Normal', 'Urgent'] as const).map((level) => (
                <motion.button
                  key={level}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setPriority(level)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                    priority === level
                      ? level === 'Normal'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-red-500 text-red-50'
                      : 'bg-background border border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {level}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors mt-6"
          >
            Submit Request
          </motion.button>

          {/* Cancel Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-background border border-border text-foreground rounded-lg font-medium hover:bg-background/80 transition-colors"
          >
            Cancel
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}
