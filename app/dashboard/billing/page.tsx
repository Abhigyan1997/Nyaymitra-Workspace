'use client'

import { motion } from 'framer-motion'
import { DollarSign, Plus } from 'lucide-react'

export default function BillingPage() {
  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Billing</h1>
        <p className="text-muted-foreground">Manage invoices, billing rates, and payment tracking.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-12 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary mb-4">
          <DollarSign className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Billing Management</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Coming soon - Create invoices, track payments, and manage billing rates.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 mx-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </motion.button>
      </motion.div>
    </div>
  )
}
