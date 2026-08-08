'use client'

import { motion } from 'framer-motion'
import { Send, Paperclip, FileText, Clock, User } from 'lucide-react'
import { useState } from 'react'

interface SupportConversation {
  id: string
  title: string
  category: string
  organization?: string
  linkedMatter?: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  assignedTo: string
  messages: Array<{
    id: string
    author: string
    role: 'user' | 'lawyer' | 'system'
    content: string
    timestamp: string
    read: boolean
  }>
}

interface SupportConversationDetailProps {
  conversation: SupportConversation
}

export function SupportConversationDetail({ conversation }: SupportConversationDetailProps) {
  const [message, setMessage] = useState('')

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-400',
    medium: 'bg-yellow-500/10 text-yellow-400',
    high: 'bg-red-500/10 text-red-400',
  }

  const statusColors = {
    open: 'bg-yellow-500/10 text-yellow-400',
    'in-progress': 'bg-blue-500/10 text-blue-400',
    resolved: 'bg-accent/10 text-accent',
    closed: 'bg-gray-500/10 text-gray-400',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-foreground mb-1">{conversation.title}</h2>
          <p className="text-xs text-muted-foreground">{conversation.category}</p>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${priorityColors[conversation.priority]}`}>
            {conversation.priority.charAt(0).toUpperCase() + conversation.priority.slice(1)}
          </span>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[conversation.status]}`}>
            {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
          </span>
          {conversation.linkedMatter && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              <FileText className="w-3 h-3 inline mr-1" />
              {conversation.linkedMatter}
            </span>
          )}
        </div>

        {/* Right sidebar info */}
        <div className="mt-4 space-y-2 text-xs">
          {conversation.organization && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Organization:</span>
              <span className="text-foreground">{conversation.organization}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Assigned:</span>
            <span className="text-foreground">{conversation.assignedTo}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length > 0 ? (
          conversation.messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-primary/20 text-primary' :
                msg.role === 'lawyer' ? 'bg-accent/20 text-accent' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                <User className="w-4 h-4" />
              </div>
              <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">{msg.author}</span>
                  <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                </div>
                <div className={`inline-block px-3 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border text-foreground'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <button className="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
