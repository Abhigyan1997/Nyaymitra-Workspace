'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, Briefcase, Award, ChevronRight } from 'lucide-react'

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

export function ExistingProfessionalCard({ professional }: { professional: Professional }) {
  const typeColors = {
    Lawyer: 'bg-blue-500/10 text-blue-400',
    'Chartered Accountant': 'bg-green-500/10 text-green-400',
    'Company Secretary': 'bg-purple-500/10 text-purple-400',
  }

  const typeEmoji = {
    Lawyer: '⚖️',
    'Chartered Accountant': '💰',
    'Company Secretary': '📋',
  }

  const statusDot = {
    active: 'bg-accent',
    away: 'bg-yellow-500',
    offline: 'bg-muted',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group cursor-pointer bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
              {professional.avatar}
            </div>
            {professional.status && (
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${statusDot[professional.status]}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {professional.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{professional.firm}</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="text-primary flex-shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Type Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${typeColors[professional.type]}`}>
          <span>{typeEmoji[professional.type]}</span>
          {professional.type}
        </span>
      </div>

      {/* Expertise */}
      <div className="mb-4 pb-4 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2">Expertise</p>
        <div className="flex flex-wrap gap-1.5">
          {professional.expertise.slice(0, 2).map((exp) => (
            <span
              key={exp}
              className="text-xs bg-background text-foreground px-2 py-1 rounded"
            >
              {exp}
            </span>
          ))}
          {professional.expertise.length > 2 && (
            <span className="text-xs bg-background text-muted-foreground px-2 py-1 rounded">
              +{professional.expertise.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Matters */}
      {professional.assignedMatters !== undefined && (
        <div className="mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {professional.assignedMatters} assigned matter{professional.assignedMatters !== 1 ? 's' : ''}
            </p>
          </div>
          {professional.recentActivity && (
            <p className="text-xs text-muted-foreground mt-2">
              {professional.recentActivity}
            </p>
          )}
        </div>
      )}

      {/* Contact */}
      <div className="space-y-2">
        <motion.a
          whileHover={{ x: 4 }}
          href={`mailto:${professional.email}`}
          className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span className="truncate">{professional.email}</span>
        </motion.a>
        <motion.a
          whileHover={{ x: 4 }}
          href={`tel:${professional.phone}`}
          className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span>{professional.phone}</span>
        </motion.a>
      </div>
    </motion.div>
  )
}
