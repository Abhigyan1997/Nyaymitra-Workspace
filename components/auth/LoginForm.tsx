'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, Lock, Loader2, Eye, EyeOff, Scale } from 'lucide-react'
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

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('userId', user.userId)
      localStorage.setItem('userName', user.fullName)
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userProfile', JSON.stringify(user))
      localStorage.setItem('userType', 'user')

      toast.success(message || 'Logged in successfully!', {
        description: `Welcome back, ${user.fullName}!`,
      })

      setTimeout(() => {
        const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
        router.push(redirectTo)
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-8 shadow-xl">
        {/* Header with Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-[#8b6914] to-[#c9a84c] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Scale size={28} color="#ffffff" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#0a0a0a] mb-1 tracking-tight">NyayMitra</h1>
          <p className="font-mono text-xs text-[#6b6b6b] tracking-[0.12em] uppercase">
            Enterprise Legal Operations
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="relative"
          >
            <label htmlFor="email" className="block font-mono text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-[0.1em] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a]" />
              <input
                id="email"
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-[#fafaf9] border border-[rgba(0,0,0,0.09)] rounded-xl text-[#0a0a0a] placeholder-[#b8b4ae] focus:outline-none focus:border-[rgba(201,168,76,0.6)] focus:ring-2 focus:ring-[rgba(201,168,76,0.1)] focus:bg-white transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block font-mono text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-[0.1em]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#8b6914] hover:text-[#c9a84c] transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a]" />
              <input
                id="password"
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-[#fafaf9] border border-[rgba(0,0,0,0.09)] rounded-xl text-[#0a0a0a] placeholder-[#b8b4ae] focus:outline-none focus:border-[rgba(201,168,76,0.6)] focus:ring-2 focus:ring-[rgba(201,168,76,0.1)] focus:bg-white transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-[#8b6914] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-br from-[#8b6914] to-[#c9a84c] text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-[rgba(201,168,76,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Access Workspace'
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 my-6"
        >
          <div className="flex-1 h-px bg-[rgba(0,0,0,0.08)]" />
          <span className="font-mono text-[11px] text-[#9a9a9a]">new to nyaymitra?</span>
          <div className="flex-1 h-px bg-[rgba(0,0,0,0.08)]" />
        </motion.div>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center"
        >
          <Link
            href="/auth/signup"
            className="text-sm font-medium text-[#8b6914] hover:text-[#c9a84c] transition-colors"
          >
            Create Business Account →
          </Link>
        </motion.div>

        {/* Demo Credentials */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-[#f4f3f0] border border-[rgba(0,0,0,0.06)] rounded-xl"
        >
          <p className="font-mono text-[9px] font-semibold text-[#6b6b6b] uppercase tracking-[0.08em] mb-2">
            Demo Credentials
          </p>
          <div className="space-y-1">
            <p className="font-mono text-xs text-[#3a3a3a]">
              <span className="text-[#6b6b6b]">Email:</span> demo@nyaymitra.com
            </p>
            <p className="font-mono text-xs text-[#3a3a3a]">
              <span className="text-[#6b6b6b]">Password:</span> password
            </p>
          </div>
        </motion.div> */}

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 flex items-center justify-center gap-3 flex-wrap"
        >
          <span className="font-mono text-[9px] text-[#b0aba4] uppercase tracking-[0.05em]">
            256-bit encrypted
          </span>
          <span className="w-1 h-1 rounded-full bg-[#d0cbc4]" />
          <span className="font-mono text-[9px] text-[#b0aba4] uppercase tracking-[0.05em]">
            Enterprise grade
          </span>
          <span className="w-1 h-1 rounded-full bg-[#d0cbc4]" />
          <span className="font-mono text-[9px] text-[#b0aba4] uppercase tracking-[0.05em]">
            DPDP Act 2023
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}