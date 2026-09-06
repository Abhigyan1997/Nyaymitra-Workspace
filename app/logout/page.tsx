'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear ALL auth-related data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    localStorage.removeItem('refreshToken')

    // Clear session storage if used
    sessionStorage.clear()

    // Redirect to login after delay
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
        <h1 className="text-2xl font-bold text-foreground mb-2">Logged Out Successfully</h1>
        <p className="text-muted-foreground">Redirecting you to the login page...</p>
      </motion.div>
    </main>
  )
}