'use client'

import { motion } from 'framer-motion'
import { CreditCard, Download } from 'lucide-react'

export function BillingSettings() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="font-semibold text-foreground mb-4">Current Plan</h3>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-2xl font-bold text-foreground">Professional</p>
            <p className="text-sm text-muted-foreground mt-1">₹4,999/month</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Upgrade Plan
          </motion.button>
        </div>

        {/* Usage */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Matters</p>
              <p className="text-sm font-medium text-muted-foreground">23 / 100</p>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '23%' }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Storage</p>
              <p className="text-sm font-medium text-muted-foreground">45 GB / 100 GB</p>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '45%' }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Team Members</p>
              <p className="text-sm font-medium text-muted-foreground">6 / 10</p>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="font-semibold text-foreground mb-4">Payment Method</h3>
        <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
          <CreditCard className="w-8 h-8 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Visa ending in 4242</p>
            <p className="text-sm text-muted-foreground">Expires 12/2026</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Update
          </motion.button>
        </div>
      </motion.div>

      {/* Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="font-semibold text-foreground mb-4">Invoices</h3>
        <div className="space-y-3">
          {[
            { date: 'October 1, 2024', amount: '₹4,999', status: 'Paid' },
            { date: 'September 1, 2024', amount: '₹4,999', status: 'Paid' },
            { date: 'August 1, 2024', amount: '₹4,999', status: 'Paid' },
          ].map((invoice, index) => (
            <motion.div
              key={invoice.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">{invoice.date}</p>
                <p className="text-sm text-muted-foreground">{invoice.amount}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">
                  {invoice.status}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-primary/10 rounded transition-colors"
                >
                  <Download className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
