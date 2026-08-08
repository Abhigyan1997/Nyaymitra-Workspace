'use client'

import { motion } from 'framer-motion'
import { ChevronRight, MoreVertical, Calendar } from 'lucide-react'
import Link from 'next/link'

interface MattersTableProps {
  searchQuery: string
  filter: string
}

const allMatters = [
  {
    id: 1,
    name: 'Smith vs. Jones Estate Dispute',
    client: 'Smith Estate',
    type: 'Litigation',
    status: 'Active',
    partner: 'John Smith',
    budget: '$25,000',
    spent: '$12,450',
    deadline: '2024-03-15',
  },
  {
    id: 2,
    name: 'TechCorp Acquisition Deal',
    client: 'TechCorp Inc.',
    type: 'Corporate',
    status: 'Active',
    partner: 'Sarah Johnson',
    budget: '$75,000',
    spent: '$34,200',
    deadline: '2024-04-20',
  },
  {
    id: 3,
    name: 'Blue Industries Contract Review',
    client: 'Blue Industries',
    type: 'Contract',
    status: 'Active',
    partner: 'Michael Chen',
    budget: '$15,000',
    spent: '$5,800',
    deadline: '2024-03-01',
  },
  {
    id: 4,
    name: 'Riverside Property Dispute',
    client: 'Riverside Properties',
    type: 'Real Estate',
    status: 'On Hold',
    partner: 'Jessica Lee',
    budget: '$30,000',
    spent: '$8,900',
    deadline: '2024-05-10',
  },
  {
    id: 5,
    name: 'GreenEnergy LLC Partnership',
    client: 'GreenEnergy LLC',
    type: 'Corporate',
    status: 'Active',
    partner: 'David Martinez',
    budget: '$45,000',
    spent: '$22,100',
    deadline: '2024-03-25',
  },
  {
    id: 6,
    name: 'Financial Services Compliance',
    client: 'FinServe Corp',
    type: 'Compliance',
    status: 'Active',
    partner: 'Emily Thompson',
    budget: '$20,000',
    spent: '$11,300',
    deadline: '2024-02-28',
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-accent/10 text-accent border-accent/20'
    case 'On Hold':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'Completed':
      return 'bg-muted/10 text-muted-foreground border-muted/20'
    default:
      return 'bg-muted/10 text-muted-foreground border-muted/20'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Litigation':
      return 'text-destructive'
    case 'Corporate':
      return 'text-secondary'
    case 'Contract':
      return 'text-primary'
    case 'Real Estate':
      return 'text-accent'
    case 'Compliance':
      return 'text-secondary'
    default:
      return 'text-muted-foreground'
  }
}

export function MattersTable({ searchQuery, filter }: MattersTableProps) {
  const filteredMatters = allMatters.filter((matter) => {
    const matchesSearch = matter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      matter.client.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filter === 'all') return matchesSearch
    if (filter === 'active') return matchesSearch && matter.status === 'Active'
    if (filter === 'onhold') return matchesSearch && matter.status === 'On Hold'
    
    return matchesSearch
  })

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
            <div className="col-span-3">Matter</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-2">Partner</div>
            <div className="col-span-2">Budget</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* Rows */}
          {filteredMatters.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredMatters.map((matter) => (
                <motion.div
                  key={matter.id}
                  variants={rowVariants}
                  whileHover={{ backgroundColor: 'rgba(245, 158, 11, 0.03)' }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-background/50 transition-colors duration-200 group cursor-pointer"
                >
                  {/* Matter Name */}
                  <div className="col-span-3">
                    <Link href={`/dashboard/matters/${matter.id}`} className="group/link">
                      <p className="font-medium text-foreground group-hover/link:text-primary transition-colors mb-1">
                        {matter.name}
                      </p>
                      <p className={`text-xs font-medium ${getTypeColor(matter.type)}`}>
                        {matter.type}
                      </p>
                    </Link>
                  </div>

                  {/* Client */}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{matter.client}</p>
                  </div>

                  {/* Partner */}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{matter.partner}</p>
                  </div>

                  {/* Budget */}
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-foreground">{matter.spent}</p>
                    <p className="text-xs text-muted-foreground">{matter.budget}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        matter.status
                      )}`}
                    >
                      {matter.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg hover:bg-background transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
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
              <p className="text-muted-foreground mb-2">No matters found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      {filteredMatters.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-6 py-4 border-t border-border bg-background/30 text-xs text-muted-foreground flex items-center justify-between"
        >
          <span>Showing {filteredMatters.length} of {allMatters.length} matters</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
          >
            Load More <ChevronRight className="w-3 h-3" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
