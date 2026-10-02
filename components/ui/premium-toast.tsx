'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface PremiumToastProps {
    id: string | number
    variant: ToastVariant
    title: string
    description?: string
    duration?: number
    onDismiss: (id: string | number) => void
    action?: {
        label: string
        onClick: () => void
    }
}

const variantConfig: Record<
    ToastVariant,
    {
        icon: React.ReactNode
        accent: string
        glow: string
        border: string
        iconBg: string
        progressBg: string
    }
> = {
    success: {
        icon: <CheckCircle2 size={18} strokeWidth={2.5} />,
        accent: 'text-emerald-400',
        glow: 'shadow-emerald-500/10',
        border: 'border-emerald-500/30',
        iconBg: 'bg-emerald-500/15 ring-1 ring-emerald-500/30',
        progressBg: 'bg-emerald-500',
    },
    error: {
        icon: <XCircle size={18} strokeWidth={2.5} />,
        accent: 'text-red-400',
        glow: 'shadow-red-500/10',
        border: 'border-red-500/30',
        iconBg: 'bg-red-500/15 ring-1 ring-red-500/30',
        progressBg: 'bg-red-500',
    },
    warning: {
        icon: <AlertTriangle size={18} strokeWidth={2.5} />,
        accent: 'text-amber-400',
        glow: 'shadow-amber-500/10',
        border: 'border-amber-500/30',
        iconBg: 'bg-amber-500/15 ring-1 ring-amber-500/30',
        progressBg: 'bg-amber-500',
    },
    info: {
        icon: <Info size={18} strokeWidth={2.5} />,
        accent: 'text-sky-400',
        glow: 'shadow-sky-500/10',
        border: 'border-sky-500/30',
        iconBg: 'bg-sky-500/15 ring-1 ring-sky-500/30',
        progressBg: 'bg-sky-500',
    },
    loading: {
        icon: <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />,
        accent: 'text-yellow-400',
        glow: 'shadow-yellow-500/10',
        border: 'border-yellow-500/30',
        iconBg: 'bg-yellow-500/15 ring-1 ring-yellow-500/30',
        progressBg: 'bg-yellow-500',
    },
}

export function PremiumToast({
    id,
    variant,
    title,
    description,
    duration = 4000,
    onDismiss,
    action,
}: PremiumToastProps) {
    const config = variantConfig[variant]
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        if (duration === Infinity || variant === 'loading' || isHovered) return
        const timer = setTimeout(() => onDismiss(id), duration)
        return () => clearTimeout(timer)
    }, [id, duration, onDismiss, variant, isHovered])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 60, scale: 0.9, filter: 'blur(6px)' }}
            transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
                layout: { duration: 0.2 },
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
        group relative w-[380px] overflow-hidden rounded-xl
        bg-gradient-to-b from-zinc-900/95 to-zinc-950/95
        backdrop-blur-xl
        border ${config.border}
        shadow-2xl ${config.glow}
        ring-1 ring-white/[0.03]
      `}
        >
            {/* Top highlight line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Ambient glow */}
            <div
                className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-20 ${config.progressBg}`}
            />

            <div className="relative flex items-start gap-3.5 p-4">
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.accent}`}
                >
                    {config.icon}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-white leading-tight tracking-tight">
                        {title}
                    </p>
                    {description && (
                        <p className="mt-1 text-[13px] leading-snug text-zinc-400 font-normal">
                            {description}
                        </p>
                    )}

                    {/* Action Button */}
                    {action && (
                        <button
                            onClick={action.onClick}
                            className="mt-3 text-xs font-semibold text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-wider"
                        >
                            {action.label} →
                        </button>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={() => onDismiss(id)}
                    className="flex-shrink-0 -mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-white/5 hover:text-white transition-all duration-200"
                    aria-label="Dismiss"
                >
                    <X size={14} strokeWidth={2.5} />
                </button>
            </div>

            {/* Progress Bar */}
            {duration !== Infinity && variant !== 'loading' && (
                <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: isHovered ? 1 : 0 }}
                    transition={{
                        duration: isHovered ? 0.3 : duration / 1000,
                        ease: isHovered ? 'easeOut' : 'linear',
                    }}
                    style={{ transformOrigin: 'left' }}
                    className={`h-[2px] ${config.progressBg} opacity-60`}
                />
            )}
        </motion.div>
    )
}