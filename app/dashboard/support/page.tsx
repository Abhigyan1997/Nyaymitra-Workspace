'use client'

import { motion } from 'framer-motion'
import { Plus, Search, Send, Paperclip, Check, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { SupportConversationList } from '@/components/support/SupportConversationList'
import { SupportConversationDetail } from '@/components/support/SupportConversationDetail'

interface SupportConversation {
  id: string
  title: string
  category: 'Contract' | 'Compliance' | 'Trademark' | 'Company Registration' | 'Employment' | 'General' | 'Technical' | 'Billing'
  organization?: string
  linkedMatter?: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  assignedTo: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Array<{
    id: string
    author: string
    role: 'user' | 'lawyer' | 'system'
    content: string
    timestamp: string
    read: boolean
  }>
}

const mockConversations: SupportConversation[] = [
  {
    id: '1',
    title: 'Employment Contract - Senior Position',
    category: 'Employment',
    organization: 'AIMediLabs',
    linkedMatter: 'Employment Agreement - Senior Dev',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'Sarah Chen',
    lastMessage: 'I\'ve reviewed the contract and added comments...',
    lastMessageTime: '2 hours ago',
    unreadCount: 1,
    messages: [
      {
        id: '1',
        author: 'You',
        role: 'user',
        content: 'Can you review the employment contract for our new CTO?',
        timestamp: '10:30 AM',
        read: true,
      },
      {
        id: '2',
        author: 'Sarah Chen',
        role: 'lawyer',
        content: 'I\'ve reviewed the contract and added comments in the document. Let\'s discuss the non-compete clause.',
        timestamp: '11:45 AM',
        read: false,
      },
    ],
  },
  {
    id: '2',
    title: 'GST Registration Requirements',
    category: 'Compliance',
    organization: 'Freshflow',
    priority: 'medium',
    status: 'open',
    assignedTo: 'Ravi Patel',
    lastMessage: 'What are the documentation requirements?',
    lastMessageTime: '5 hours ago',
    unreadCount: 0,
    messages: [],
  },
  {
    id: '3',
    title: 'Trademark Application Status',
    category: 'Trademark',
    organization: 'Talk2Partners',
    linkedMatter: 'Trademark Registration',
    priority: 'high',
    status: 'resolved',
    assignedTo: 'Emma Wilson',
    lastMessage: 'Your trademark has been approved!',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    messages: [],
  },
  {
    id: '4',
    title: 'Bill Format and Invoice Details',
    category: 'Billing',
    organization: 'CoEdge',
    priority: 'low',
    status: 'closed',
    assignedTo: 'Anuj Kumar',
    lastMessage: 'Invoice has been updated as requested',
    lastMessageTime: '3 days ago',
    unreadCount: 0,
    messages: [],
  },
]

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(mockConversations[0])
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const filteredConversations = mockConversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !filterCategory || conv.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['Contract', 'Compliance', 'Trademark', 'Company Registration', 'Employment', 'General', 'Technical', 'Billing']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Support</h1>
            <p className="text-muted-foreground">Legal Operations Support Center</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Request
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]"
      >
        {/* Conversation List */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <motion.button
                onClick={() => setFilterCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  !filterCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border text-foreground hover:border-primary/50'
                }`}
              >
                All
              </motion.button>
              {categories.map(cat => (
                <motion.button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    filterCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Conversations */}
          <SupportConversationList
            conversations={filteredConversations}
            selectedId={selectedConversation?.id}
            onSelectConversation={setSelectedConversation}
          />
        </div>

        {/* Conversation Detail */}
        {selectedConversation && (
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
            <SupportConversationDetail conversation={selectedConversation} />
          </div>
        )}
      </motion.div>
    </div>
  )
}
