'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Archive, Check } from 'lucide-react'
import { NotificationCard } from '@/components/notifications/NotificationCard'

type TabType = 'all' | 'unread' | 'mentions' | 'system' | 'compliance' | 'matters'

interface Notification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  type: 'matter' | 'compliance' | 'document' | 'system' | 'comment'
  organization: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Matter Assigned',
    description: 'You have been assigned to "Acme Corp Merger & Acquisition"',
    timestamp: '2 minutes ago',
    read: false,
    type: 'matter',
    organization: 'Acme Corp',
  },
  {
    id: '2',
    title: 'Compliance Due Tomorrow',
    description: 'GST Quarterly Filing is due tomorrow. Please complete the filing.',
    timestamp: '1 hour ago',
    read: false,
    type: 'compliance',
    organization: 'Tech Innovations',
  },
  {
    id: '3',
    title: 'Document Uploaded',
    description: 'Sarah Johnson uploaded "Contract Review Summary.pdf"',
    timestamp: '3 hours ago',
    read: true,
    type: 'document',
    organization: 'Global Services',
  },
  {
    id: '4',
    title: 'Contract Approved',
    description: 'The employment contract has been approved by the legal team',
    timestamp: '5 hours ago',
    read: true,
    type: 'system',
    organization: 'StartUp Labs',
  },
  {
    id: '5',
    title: 'Comment Added',
    description: 'Michael Chen commented on "Tax Compliance Review"',
    timestamp: '1 day ago',
    read: true,
    type: 'comment',
    organization: 'Brand Co',
  },
]

const tabs: { value: TabType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'mentions', label: 'Mentions' },
  { value: 'system', label: 'System' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'matters', label: 'Matters' },
]

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [notifications, setNotifications] = useState(mockNotifications)

  const filteredNotifications = notifications.filter((n) => {
    switch (activeTab) {
      case 'unread':
        return !n.read
      case 'mentions':
        return n.type === 'comment'
      case 'system':
        return n.type === 'system'
      case 'compliance':
        return n.type === 'compliance'
      case 'matters':
        return n.type === 'matter'
      default:
        return true
    }
  })

  const handleMarkRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/20 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.value}
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:border-primary/50'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NotificationCard
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-semibold mb-2">All notifications read</p>
            <p className="text-muted-foreground">You&apos;re all caught up!</p>
          </motion.div>
        )}
      </motion.div>

      {/* Bulk Actions */}
      {filteredNotifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 justify-center pt-6 border-t border-border"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-card/80 transition-colors"
          >
            <Archive className="w-4 h-4" />
            Archive All
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
