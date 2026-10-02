'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Lock,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Eye,
    EyeOff,
} from 'lucide-react'

const resetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters long'),

        confirmPassword: z
            .string()
            .min(8, 'Please confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type ResetPasswordData = z.infer<typeof resetPasswordSchema>

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1'
).replace(/\/$/, '')

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const token = searchParams.get('token')

    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordData>({
        resolver: zodResolver(resetPasswordSchema),
    })

    const onSubmit = async (data: ResetPasswordData) => {
        if (!token) {
            setErrorMessage('Invalid or missing password reset token.')
            return
        }

        setIsLoading(true)
        setErrorMessage('')

        try {
            const response = await fetch(
                `${API_BASE}/auth/reset-workspace-password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token,
                        newPassword: data.newPassword,
                    }),
                }
            )

            const result = await response.json().catch(() => ({}))

            if (!response.ok) {
                throw new Error(
                    result?.message || 'Unable to reset your password'
                )
            }

            setIsSuccess(true)
        } catch (error) {
            console.error('Reset password error:', error)

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to reset your password'
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">

                    {!isSuccess ? (
                        <>
                            {/* Header */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="mb-8"
                            >
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 w-fit"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        Back to Login
                                    </span>
                                </Link>

                                <h1 className="text-2xl font-bold text-foreground mb-2">
                                    Set New Password
                                </h1>

                                <p className="text-muted-foreground text-sm">
                                    Enter a new password for your NyayMitra workspace
                                    account.
                                </p>
                            </motion.div>

                            {/* Invalid token */}
                            {!token ? (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                    <p className="text-sm text-destructive">
                                        This password reset link is invalid or missing a
                                        reset token.
                                    </p>

                                    <Link
                                        href="/forgot-password"
                                        className="inline-block mt-3 text-sm font-medium text-primary hover:text-primary/80"
                                    >
                                        Request a new reset link
                                    </Link>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="space-y-5"
                                >
                                    {/* New Password */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        <label
                                            htmlFor="newPassword"
                                            className="block text-sm font-medium text-foreground mb-2"
                                        >
                                            New Password
                                        </label>

                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                                            <input
                                                id="newPassword"
                                                {...register('newPassword')}
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter new password"
                                                className="w-full pl-10 pr-11 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword((prev) => !prev)
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                        {errors.newPassword && (
                                            <p className="mt-1.5 text-xs text-destructive">
                                                {errors.newPassword.message}
                                            </p>
                                        )}

                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                            Password must be at least 8 characters.
                                        </p>
                                    </motion.div>

                                    {/* Confirm Password */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <label
                                            htmlFor="confirmPassword"
                                            className="block text-sm font-medium text-foreground mb-2"
                                        >
                                            Confirm Password
                                        </label>

                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                                            <input
                                                id="confirmPassword"
                                                {...register('confirmPassword')}
                                                type={
                                                    showConfirmPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                placeholder="Confirm new password"
                                                className="w-full pl-10 pr-11 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        (prev) => !prev
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                        {errors.confirmPassword && (
                                            <p className="mt-1.5 text-xs text-destructive">
                                                {errors.confirmPassword.message}
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* API Error */}
                                    {errorMessage && (
                                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                                            <p className="text-sm text-destructive">
                                                {errorMessage}
                                            </p>
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Updating Password...
                                            </>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </motion.button>
                                </form>
                            )}
                        </>
                    ) : (
                        /* Success */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    delay: 0.1,
                                    type: 'spring',
                                }}
                                className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <CheckCircle2 className="w-8 h-8 text-accent" />
                            </motion.div>

                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Password Reset Successfully
                            </h2>

                            <p className="text-muted-foreground mb-6">
                                Your NyayMitra workspace password has been updated.
                                You can now sign in with your new password.
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/login')}
                                className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-all duration-200"
                            >
                                Go to Login
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}