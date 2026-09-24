// components/admin/AdminUI.tsx
'use client'

import { motion } from 'framer-motion'
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Search,
    X,
} from 'lucide-react'

// ---------------------------------------------------------------
// Card
// ---------------------------------------------------------------
export function AdminCard({
    children,
    className = '',
    clickable = false,
    onClick,
}: {
    children: React.ReactNode
    className?: string
    clickable?: boolean
    onClick?: () => void
}) {
    const content = (
        <div
            className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 to-black/20 p-6 backdrop-blur-sm transition-all duration-300 ${clickable
                    ? 'cursor-pointer hover:border-amber-400/40 hover:bg-black/50'
                    : ''
                } ${className}`}
        >
            {children}
        </div>
    )

    if (!clickable) return content

    return (
        <button type="button" onClick={onClick} className="w-full text-left">
            {content}
        </button>
    )
}

// ---------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------
export function StatusBadge({ status }: { status?: string }) {
    if (!status) return null
    const key = status.toLowerCase()
    const colors: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        verified: 'bg-green-500/10 text-green-400 border-green-500/20',
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
        approved: 'bg-green-500/10 text-green-400 border-green-500/20',
        'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
        suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
        inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    }
    return (
        <span
            className={`inline-flex rounded-lg border px-2 py-1 text-xs font-medium ${colors[key] || 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
        >
            {status.replace(/-/g, ' ')}
        </span>
    )
}

// ---------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------
export function Skeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-white/[0.04]"
                />
            ))}
        </div>
    )
}

// ---------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------
export function EmptyState({
    title,
    description,
    icon: Icon,
    action,
}: {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    action?: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon className="mb-4 h-10 w-10 text-gray-700" />
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
            <p className="mt-1 max-w-sm text-xs text-gray-600">{description}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}

// ---------------------------------------------------------------
// Error state
// ---------------------------------------------------------------
export function ErrorState({
    message,
    onRetry,
}: {
    message: string
    onRetry: () => void
}) {
    return (
        <AdminCard className="mx-auto mt-12 max-w-md">
            <div className="text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
                <h2 className="text-lg font-semibold text-white">
                    Something went wrong
                </h2>
                <p className="mt-2 text-sm text-gray-500">{message}</p>
                <button
                    onClick={onRetry}
                    className="mt-6 rounded-lg bg-amber-500 px-5 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
                >
                    Try Again
                </button>
            </div>
        </AdminCard>
    )
}

// ---------------------------------------------------------------
// Search input
// ---------------------------------------------------------------
export function SearchInput({
    value,
    onChange,
    placeholder = 'Search…',
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
}) {
    return (
        <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-9 text-sm text-white placeholder-gray-500 outline-none transition focus:border-amber-400/40 focus:bg-white/[0.05]"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    aria-label="Clear"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

// ---------------------------------------------------------------
// Filter pills
// ---------------------------------------------------------------
export function FilterPills<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { label: string; value: T }[]
    value: T
    onChange: (v: T) => void
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const active = value === opt.value
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${active
                                ? 'border-amber-400/40 bg-amber-500/15 text-amber-400'
                                : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-white'
                            }`}
                    >
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )
}

// ---------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------
export function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number
    totalPages: number
    onPageChange: (p: number) => void
}) {
    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
            <p className="text-xs text-gray-500">
                Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-gray-400 transition hover:bg-white/[0.06] disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-gray-400 transition hover:bg-white/[0.06] disabled:opacity-40"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------
// Stat strip
// ---------------------------------------------------------------
export function StatStrip({
    items,
}: {
    items: { label: string; value: number | string; tone?: 'default' | 'warn' | 'good' }[]
}) {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {items.map((item, i) => {
                const tone =
                    item.tone === 'warn'
                        ? 'text-amber-400'
                        : item.tone === 'good'
                            ? 'text-green-400'
                            : 'text-white'
                return (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className={`mt-1 text-2xl font-light ${tone}`}>
                            {item.value}
                        </p>
                    </motion.div>
                )
            })}
        </div>
    )
}