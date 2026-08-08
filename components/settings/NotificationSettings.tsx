'use client'

import { motion } from 'framer-motion'
import { Toggle } from '@/components/ui/toggle'

export function NotificationSettings() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="font-semibold text-foreground mb-6">Email Preferences</h3>
        <div className="space-y-4">
          {[
            { label: 'Matter Updates', description: 'Receive notifications when matters are assigned or updated' },
            { label: 'Compliance Alerts', description: 'Get reminded about upcoming compliance deadlines' },
            { label: 'Document Changes', description: 'Notifications when documents are uploaded or modified' },
            { label: 'Weekly Reports', description: 'Receive a summary of your activities every week' },
            { label: 'Team Messages', description: 'Notifications from team members and collaborators' },
            { label: 'System Updates', description: 'Important platform announcements and updates' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-primary rounded"
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Save Preferences
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-card border border-border text-foreground px-6 py-2 rounded-lg font-medium hover:bg-background transition-colors"
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
