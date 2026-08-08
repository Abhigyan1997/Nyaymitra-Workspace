'use client'

import { motion } from 'framer-motion'
import { Trash2, Check, Bell, AlertCircle, FileText, MessageSquare, CheckCircle2 } from 'lucide-react'

interface Notification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  type: 'matter' | 'compliance' | 'document' | 'system' | 'comment'
  organization: string
}

interface NotificationCardProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}

const typeConfig = {
  matter: { icon: Bell, bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Matter' },
  compliance: { icon: AlertCircle, bg: 'bg-red-500/10', text: 'text-red-500', label: 'Compliance' },
  document: { icon: FileText, bg: 'bg-green-500/10', text: 'text-green-500', label: 'Document' },
  system: { icon: CheckCircle2, bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'System' },
  comment: { icon: MessageSquare, bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Comment' },
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 5 }}
      transition={{ duration: 0.2 }}
      className={`group border-2 rounded-xl p-4 transition-all ${
        notification.read
          ? 'bg-card border-border/50'
          : 'bg-card border-primary/30 shadow-lg shadow-primary/10'
      }`}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-lg flex-shrink-0 ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <div>
              <p className={`font-semibold text-sm ${notification.read ? 'text-foreground' : 'text-foreground font-bold'}`}>
                {notification.title}
              </p>
            </div>
            {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {notification.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{notification.timestamp}</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full ${config.bg} ${config.text} font-medium`}>
              {config.label}
            </span>
            <span>•</span>
            <span>{notification.organization}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!notification.read && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMarkRead(notification.id)}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              title="Mark as read"
            >
              <Check className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(notification.id)}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
            title="Delete notification"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
