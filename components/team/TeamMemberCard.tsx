'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Mail } from 'lucide-react'

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

interface TeamMemberCardProps {
  member: TeamMember
}

const statusConfig = {
  active: { color: 'bg-green-500', label: 'Active' },
  away: { color: 'bg-amber-500', label: 'Away' },
  offline: { color: 'bg-gray-500', label: 'Offline' },
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 space-y-4">
        {/* Avatar and Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-foreground font-bold text-sm">
                {member.avatar}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${statusConfig[member.status].color}`} />
            </div>
            <div>
              <p className="font-bold text-foreground">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="px-3 py-1 bg-primary/10 rounded-full inline-block">
          <p className="text-xs font-medium text-primary">{member.availability}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Assigned</p>
            <p className="text-2xl font-bold text-foreground">{member.assignedMatters}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold text-accent">{member.completedMatters}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 rounded-lg font-medium text-sm hover:bg-primary/20 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Contact
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email
          </motion.button>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}
