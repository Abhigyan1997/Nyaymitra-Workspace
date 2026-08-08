'use client'

import { motion } from 'framer-motion'
import { MoreVertical, Mail } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  status: 'active' | 'away' | 'offline'
  assignedMatters: number
  completedMatters: number
  availability: string
  email: string
}

interface TeamMembersTableProps {
  members: TeamMember[]
}

const statusConfig = {
  active: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Active' },
  away: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Away' },
  offline: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Offline' },
}

export function TeamMembersTable({ members }: TeamMembersTableProps) {
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
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">Member</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">Assigned</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">Completed</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">Availability</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <motion.tr
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/50 hover:bg-background/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-foreground font-semibold text-xs">
                        {member.avatar}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                          member.status === 'active'
                            ? 'bg-green-500'
                            : member.status === 'away'
                            ? 'bg-amber-500'
                            : 'bg-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">{member.role}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[member.status].bg} ${statusConfig[member.status].text}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {statusConfig[member.status].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-foreground">{member.assignedMatters}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-accent">{member.completedMatters}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-muted-foreground">{member.availability}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-primary/10 rounded transition-colors"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-primary/10 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
