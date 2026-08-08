'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LogoutPage() {
  useEffect(() => {
    // Clear auth token and redirect to login
    localStorage.removeItem('auth_token')
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          ✓
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Logged Out Successfully</h1>
        <p className="text-muted-foreground">Redirecting you to the login page...</p>
      </motion.div>
    </main>
  )
}
