'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'

interface SupportConversation {
  id: string
  title: string
  category: string
  organization?: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  assignedTo: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface SupportConversationListProps {
  conversations: SupportConversation[]
  selectedId?: string
  onSelectConversation: (conversation: SupportConversation) => void
}

export function SupportConversationList({
  conversations,
  selectedId,
  onSelectConversation,
}: SupportConversationListProps) {
  const statusIcons = {
    open: Clock,
    'in-progress': AlertCircle,
    resolved: CheckCircle2,
    closed: CheckCircle2,
  }

  const statusColors = {
    open: 'text-yellow-500',
    'in-progress': 'text-blue-500',
    resolved: 'text-accent',
    closed: 'text-gray-500',
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length > 0 ? (
        <div className="space-y-1 p-2">
          {conversations.map(conversation => {
            const StatusIcon = statusIcons[conversation.status]
            return (
              <motion.button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                whileHover={{ scale: 1.02 }}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedId === conversation.id
                    ? 'bg-primary/10 border border-primary/50'
                    : 'hover:bg-background border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon className={`w-4 h-4 mt-1 flex-shrink-0 ${statusColors[conversation.status]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm text-foreground truncate">{conversation.title}</p>
                      {conversation.unreadCount > 0 && (
                        <span className="text-xs font-bold px-2 py-1 bg-primary text-primary-foreground rounded-full flex-shrink-0">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{conversation.lastMessage}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{conversation.lastMessageTime}</span>
                      {conversation.organization && (
                        <span className="text-xs bg-background px-2 py-0.5 rounded text-foreground">
                          {conversation.organization}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">No conversations found</p>
        </div>
      )}
    </div>
  )
}
