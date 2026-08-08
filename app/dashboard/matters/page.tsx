'use client'

import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { MatterCard } from '@/components/matters/MatterCard'
import { NewMatterModal } from '@/components/matters/NewMatterModal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LegalTeamMember {
  name: string
  type: 'Lawyer' | 'Chartered Accountant' | 'Company Secretary'
  avatar: string
}

interface Matter {
  id: string
  name: string
  organization: string
  category: 'Trademark Registration' | 'Employment Agreement' | 'Vendor Contract' | 'MSA Review' | 'Privacy Policy' | 'Founder Agreement' | 'GST Registration' | 'Annual ROC Filing' | 'ESOP Draft' | 'Fundraising Documents' | 'Company Incorporation' | 'Customer Agreement'
  assignedTo: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'draft' | 'in-progress' | 'review' | 'completed'
  dueDate: string
  progress: number
  legalTeam: LegalTeamMember[]
}

const mockMatters: Matter[] = [
  {
    id: '1',
    name: 'Trademark Registration',
    organization: 'AIMediLabs',
    category: 'Trademark Registration',
    assignedTo: 'Sarah Chen',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2024-08-15',
    progress: 65,
    legalTeam: [
      { name: 'Rajesh Kumar', type: 'Lawyer', avatar: 'RK' },
      { name: 'Priya Sharma', type: 'Chartered Accountant', avatar: 'PS' },
    ],
  },
  {
    id: '2',
    name: 'Employment Agreement - Senior Dev',
    organization: 'Freshflow',
    category: 'Employment Agreement',
    assignedTo: 'Ravi Patel',
    priority: 'medium',
    status: 'in-progress',
    dueDate: '2024-08-20',
    progress: 40,
    legalTeam: [
      { name: 'Vikram Singh', type: 'Lawyer', avatar: 'VS' },
    ],
  },
  {
    id: '3',
    name: 'Vendor Contract Review',
    organization: 'Talk2Partners',
    category: 'Vendor Contract',
    assignedTo: 'Emma Wilson',
    priority: 'high',
    status: 'review',
    dueDate: '2024-08-10',
    progress: 85,
    legalTeam: [
      { name: 'Rajesh Kumar', type: 'Lawyer', avatar: 'RK' },
      { name: 'Amit Patel', type: 'Company Secretary', avatar: 'AP' },
    ],
  },
  {
    id: '4',
    name: 'MSA Review - Enterprise Client',
    organization: 'CoEdge',
    category: 'MSA Review',
    assignedTo: 'Anuj Kumar',
    priority: 'urgent',
    status: 'draft',
    dueDate: '2024-08-08',
    progress: 20,
    legalTeam: [
      { name: 'Vikram Singh', type: 'Lawyer', avatar: 'VS' },
      { name: 'Neha Verma', type: 'Chartered Accountant', avatar: 'NV' },
    ],
  },
  {
    id: '5',
    name: 'Privacy Policy Update',
    organization: 'AIMediLabs',
    category: 'Privacy Policy',
    assignedTo: 'Sarah Chen',
    priority: 'medium',
    status: 'completed',
    dueDate: '2024-08-01',
    progress: 100,
    legalTeam: [
      { name: 'Rajesh Kumar', type: 'Lawyer', avatar: 'RK' },
    ],
  },
  {
    id: '6',
    name: 'Founder Agreement',
    organization: 'Freshflow',
    category: 'Founder Agreement',
    assignedTo: 'Ravi Patel',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2024-08-25',
    progress: 50,
    legalTeam: [
      { name: 'Vikram Singh', type: 'Lawyer', avatar: 'VS' },
      { name: 'Neha Verma', type: 'Chartered Accountant', avatar: 'NV' },
      { name: 'Sanjay Desai', type: 'Company Secretary', avatar: 'SD' },
    ],
  },
]

export default function MattersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [matters, setMatters] = useState(mockMatters)

  const filteredMatters = matters.filter(matter => {
    const matchesSearch = matter.name.toLowerCase().includes(search.toLowerCase()) ||
                         matter.organization.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || matter.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleMatterCreated = (matterId: string) => {
    router.push(`/dashboard/matters/${matterId}`)
  }

  const statuses = ['all', 'draft', 'in-progress', 'review', 'completed'] as const

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-display-lg font-bold text-foreground mb-3">Matters</h1>
        <p className="text-body-md">Manage all your legal matters and track progress in one place</p>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search matters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-body-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap text-sm"
        >
          <Plus className="w-5 h-5" />
          New Matter
        </motion.button>
      </motion.div>

      {/* Status Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {statuses.map(status => (
          <motion.button
            key={status}
            whileHover={{ scale: 1.05 }}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              filterStatus === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-body-sm hover:border-primary/50'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </motion.button>
        ))}
      </motion.div>

      {/* Matters Grid */}
      {filteredMatters.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredMatters.map((matter, index) => (
            <motion.div
              key={matter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MatterCard matter={matter} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-body-md">No matters found</p>
        </motion.div>
      )}

      {/* New Matter Modal */}
      <NewMatterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMatterCreated={handleMatterCreated}
      />
    </div>
  )
}
