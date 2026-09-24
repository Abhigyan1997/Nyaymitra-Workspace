'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { Mail, Lock, Loader2, Eye, EyeOff, Scale, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post(
        'https://nyaymitra-backend-production.up.railway.app/api/v1/auth/login',
        {
          email: data.email.trim().toLowerCase(),
          password: data.password,
        },
        {
          withCredentials: true,
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const { token, user, message } = response.data

      // Store user data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('userId', user.userId)
      localStorage.setItem('userName', user.fullName)
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userProfile', JSON.stringify(user))
      localStorage.setItem('userType', user.role || 'user')

      toast.success(message || 'Logged in successfully!', {
        description: `Welcome back, ${user.fullName}!`,
      })

      // Role-based redirection
      setTimeout(() => {
        const redirectTo = new URLSearchParams(window.location.search).get('redirect')

        if (redirectTo) {
          router.push(redirectTo)
        } else {
          // Redirect based on role
          const userRole = user.role?.toLowerCase() || ''

          if (userRole === 'admin' || userRole === 'superadmin') {
            router.push('/admin-dashboard')
          } else if (userRole === 'lawyer' || userRole === 'attorney' || userRole === 'legal') {
            router.push('/lawyer-dashboard')
          } else if (userRole === 'business' || userRole === 'client' || userRole === 'user') {
            router.push('/dashboard')
          } else {
            // Default fallback
            router.push('/dashboard')
          }
        }
      }, 1000)
    } catch (err: any) {
      let errorMessage = 'An error occurred during login'

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          errorMessage = 'Invalid email or password'
        } else if (err.response?.status === 403) {
          errorMessage = 'Account not verified. Please check your email.'
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again.'
        } else if (!err.response) {
          errorMessage = 'Network error. Please check your connection.'
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
      toast.error('Login Failed', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-2xl shadow-yellow-500/20">
              <Scale size={32} color="#000000" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-serif font-bold text-white tracking-tight">
              NyayMitra
            </h1>
            <p className="text-sm font-light text-gray-400 tracking-wide">
              Legal Operations Platform
            </p>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label htmlFor="email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  id="email"
                  {...register('email')}
                  type="email"
                  placeholder="your@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  id="password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
              )}
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg"
              >
                <p className="text-xs text-red-300 font-medium">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in</span>
                </>
              ) : (
                <>
                  <span>Access Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-xs text-gray-500 font-light">New to NyayMitra?</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          {/* Sign Up CTA */}
          <Link
            href="/auth/signup"
            className="block text-center text-sm font-medium text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            Request business account
          </Link>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-3 flex-wrap px-4"
        >
          <span className="text-xs text-gray-500 font-light">256-bit encrypted</span>
          <span className="w-1 h-1 rounded-full bg-yellow-500/30" />
          <span className="text-xs text-gray-500 font-light">Enterprise secure</span>
          <span className="w-1 h-1 rounded-full bg-yellow-500/30" />
          <span className="text-xs text-gray-500 font-light">DPDP compliant</span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}