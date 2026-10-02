'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { premiumToast } from '@/lib/premium-toast'

export default function LogoutPage() {
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    // Prevent double-run in React 18 Strict Mode (dev)
    if (hasRun.current) return
    hasRun.current = true

    // Clear ALL auth-related data
    const keysToClear = [
      'token',
      'user',
      'userId',
      'userName',
      'userEmail',
      'userProfile',
      'userType',
      'userRole',
      'refreshToken',
    ]
    keysToClear.forEach((key) => localStorage.removeItem(key))
    sessionStorage.clear()

    // ===== PREMIUM TOAST =====
    premiumToast.success('Signed out successfully', {
      description: 'Your session has been securely ended.',
      duration: 3000,
    })

    // Redirect after the toast animation plays
    const timer = setTimeout(() => {
      router.push('/')
    }, 1500)

    return () => clearTimeout(timer)
  }, [router])

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
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Logged Out Successfully
        </h1>
        <p className="text-muted-foreground">Redirecting you to the login page...</p>
      </motion.div>
    </main>
  )
}