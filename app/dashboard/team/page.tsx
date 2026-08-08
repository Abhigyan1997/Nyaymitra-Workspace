'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { ExistingProfessionalCard } from '@/components/team/ExistingProfessionalCard'
import { NyayMitraProfessionalCard } from '@/components/team/NyayMitraProfessionalCard'
import { RequestProfessionalModal } from '@/components/team/RequestProfessionalModal'

interface Professional {
  id: string
  name: string
  type: 'Lawyer' | 'Chartered Accountant' | 'Company Secretary'
  expertise: string[]
  email: string
  phone: string
  avatar: string
  status?: 'active' | 'away' | 'offline'
  assignedMatters?: number
  recentActivity?: string
  firm?: string
  availability?: string
}

const mockExistingProfessionals: Professional[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    type: 'Lawyer',
    avatar: 'RK',
    expertise: ['Corporate Law', 'Contracts', 'Mergers & Acquisitions'],
    email: 'rajesh.kumar@abc-law.com',
    phone: '+91-98765-43210',
    firm: 'ABC Law Associates',
    status: 'active',
    assignedMatters: 4,
    recentActivity: 'Reviewed MSA for vendor agreement',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    type: 'Chartered Accountant',
    avatar: 'PS',
    expertise: ['Tax Compliance', 'GST Filing', 'Financial Audit'],
    email: 'priya.sharma@ca-firm.com',
    phone: '+91-98765-43211',
    firm: 'CA Sharma & Associates',
    status: 'active',
    assignedMatters: 3,
    recentActivity: 'Completed Q2 GST return filing',
  },
  {
    id: '3',
    name: 'Amit Patel',
    type: 'Company Secretary',
    avatar: 'AP',
    expertise: ['Corporate Governance', 'ROC Compliance', 'Board Meetings'],
    email: 'amit.patel@corp-sec.com',
    phone: '+91-98765-43212',
    firm: 'Corporate Secretaries Ltd',
    status: 'active',
    assignedMatters: 2,
    recentActivity: 'Prepared Board minutes and resolutions',
  },
]

const mockNyayMitraProfessionals: Professional[] = [
  {
    id: '10',
    name: 'Vikram Singh',
    type: 'Lawyer',
    avatar: 'VS',
    expertise: ['Startups', 'Employment Law', 'Fundraising'],
    availability: 'Available now',
    assignedMatters: 2,
    email: 'vikram@nyaymitra.com',
    phone: '+91-99999-00001',
  },
  {
    id: '11',
    name: 'Neha Verma',
    type: 'Chartered Accountant',
    avatar: 'NV',
    expertise: ['Startup Accounting', 'ESOP', 'Tax Planning'],
    availability: 'Available in 2 hours',
    assignedMatters: 1,
    email: 'neha@nyaymitra.com',
    phone: '+91-99999-00002',
  },
  {
    id: '12',
    name: 'Sanjay Desai',
    type: 'Company Secretary',
    avatar: 'SD',
    expertise: ['Startup Compliance', 'Investor Reporting', 'Cap Table'],
    availability: 'Available tomorrow',
    assignedMatters: 0,
    email: 'sanjay@nyaymitra.com',
    phone: '+91-99999-00003',
  },
]

export default function TeamPage() {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [search, setSearch] = useState('')

  const filteredExisting = mockExistingProfessionals.filter(prof =>
    prof.name.toLowerCase().includes(search.toLowerCase()) ||
    prof.type.toLowerCase().includes(search.toLowerCase())
  )

  const filteredNyayMitra = mockNyayMitraProfessionals.filter(prof =>
    prof.name.toLowerCase().includes(search.toLowerCase()) ||
    prof.type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-display-lg font-bold text-foreground mb-3">Legal & Compliance Team</h1>
        <p className="text-body-md">Manage your legal professionals and external counsel</p>
      </motion.div>

      {/* Section 1: Your Existing Professionals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-lg font-semibold text-foreground">Your Existing Professionals</h2>
            <p className="text-body-md mt-2">Lawyers, accountants, and company secretaries you work with</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-5 h-5" />
            Add Professional
          </motion.button>
        </div>

        {filteredExisting.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExisting.map((prof, index) => (
              <motion.div
                key={prof.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ExistingProfessionalCard professional={prof} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-body-md">No existing professionals added yet</p>
          </div>
        )}
      </motion.div>

      {/* Section 2: NyayMitra Professionals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-lg font-semibold text-foreground">NyayMitra Professionals</h2>
            <p className="text-body-md mt-2">Expert lawyers, accountants, and company secretaries from our network</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 bg-accent text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-accent/90 transition-colors text-sm"
          >
            <Plus className="w-5 h-5" />
            Request Professional
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockNyayMitraProfessionals.map((prof, index) => (
            <motion.div
              key={prof.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NyayMitraProfessionalCard professional={prof} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Request Modal */}
      {showRequestModal && (
        <RequestProfessionalModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  )
}
