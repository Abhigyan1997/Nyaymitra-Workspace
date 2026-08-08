'use client'

import { motion } from 'framer-motion'
import { MoreVertical, ArrowUpDown } from 'lucide-react'

interface ComplianceItem {
  id: string
  name: string
  organization: string
  dueDate: string
  assigned: string
  status: 'upcoming' | 'overdue' | 'completed'
  priority: 'high' | 'medium' | 'low'
  daysRemaining: number
}

const mockData: ComplianceItem[] = [
  {
    id: '1',
    name: 'GST Quarterly Filing',
    organization: 'Acme Corp',
    dueDate: '2024-11-15',
    assigned: 'Sarah Johnson',
    status: 'upcoming',
    priority: 'high',
    daysRemaining: 8,
  },
  {
    id: '2',
    name: 'ROC Annual Return',
    organization: 'Tech Innovations',
    dueDate: '2024-11-28',
    assigned: 'Michael Chen',
    status: 'upcoming',
    priority: 'high',
    daysRemaining: 21,
  },
  {
    id: '3',
    name: 'TDS Return Filing',
    organization: 'Global Services',
    dueDate: '2024-10-07',
    assigned: 'Emma Davis',
    status: 'overdue',
    priority: 'high',
    daysRemaining: -31,
  },
  {
    id: '4',
    name: 'PF Contribution Due',
    organization: 'StartUp Labs',
    dueDate: '2024-11-10',
    assigned: 'James Wilson',
    status: 'upcoming',
    priority: 'medium',
    daysRemaining: 3,
  },
  {
    id: '5',
    name: 'Trademark Renewal',
    organization: 'Brand Co',
    dueDate: '2024-11-05',
    assigned: 'Lisa Anderson',
    status: 'completed',
    priority: 'low',
    daysRemaining: 0,
  },
]

const statusConfig = {
  upcoming: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  overdue: { bg: 'bg-red-500/10', text: 'text-red-500' },
  completed: { bg: 'bg-green-500/10', text: 'text-green-500' },
}

const priorityConfig = {
  high: { label: 'High', color: 'bg-red-500/10 text-red-500' },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-500' },
  low: { label: 'Low', color: 'bg-blue-500/10 text-blue-500' },
}

export function ComplianceTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background/50">
              <th className="px-6 py-4 text-left">
                <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Compliance Name
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Organization
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Due Date
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Assigned
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Status
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Priority
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">Days Remaining</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/50 hover:bg-background/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-muted-foreground">{item.organization}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">{new Date(item.dueDate).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      {item.assigned.charAt(0)}
                    </div>
                    <p className="text-sm text-foreground">{item.assigned}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].bg} ${statusConfig[item.status].text}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${priorityConfig[item.priority].color}`}>
                    {priorityConfig[item.priority].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className={`text-sm font-medium ${
                    item.status === 'overdue'
                      ? 'text-red-500'
                      : item.status === 'completed'
                      ? 'text-green-500'
                      : 'text-foreground'
                  }`}>
                    {item.status === 'completed' ? 'Done' : `${Math.abs(item.daysRemaining)}d`}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-primary/10 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
