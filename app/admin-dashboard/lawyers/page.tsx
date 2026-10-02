// app/admin-dashboard/lawyers/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Scale,
    RefreshCw,
    Mail,
    Phone,
    Users,
    Briefcase,
    FileText,
    CheckCircle2,
    Ban,
    Play,
    MoreVertical,
    ChevronRight,
    UserPlus,
} from 'lucide-react'

import {
    adminApi,
    ApiError,
    formatDate,
    getInitials,
    getPagination,
    getArray,
    normalizeLawyer,
    type Lawyer,
} from '@/lib/adminApi'

import {
    AdminCard,
    EmptyState,
    ErrorState,
    FilterPills,
    Pagination,
    SearchInput,
    Skeleton,
    StatStrip,
    StatusBadge,
} from '@/components/admin/AdminUI'
import { premiumToast } from '@/lib/premium-toast'

type StatusFilter = 'all' | 'active' | 'pending' | 'suspended' | 'inactive'

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Inactive', value: 'inactive' },
]

const PAGE_LIMIT = 20

export default function AdminLawyersPage() {
    const router = useRouter()

    const [lawyers, setLawyers] = useState<Lawyer[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [actionId, setActionId] = useState<string | null>(null)
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [status, setStatus] = useState<StatusFilter>('all')
    const [page, setPage] = useState(1)

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim())
            setPage(1)
        }, 350)
        return () => clearTimeout(t)
    }, [search])

    const loadLawyers = useCallback(
        async (opts?: { silent?: boolean }) => {
            const isSilent = Boolean(opts?.silent)

            try {
                if (isSilent) setRefreshing(true)
                else setLoading(true)

                setError(null)

                const response = await adminApi.listLawyers({
                    page,
                    limit: PAGE_LIMIT,
                    search: debouncedSearch || undefined,
                    status,
                })

                const raw = getArray<any>(response)
                const pag = getPagination(response)

                setLawyers(raw.map(normalizeLawyer))
                setTotal(pag.total || raw.length)
                setTotalPages(
                    pag.pages ||
                    Math.max(
                        1,
                        Math.ceil(
                            (pag.total || raw.length) / PAGE_LIMIT
                        )
                    )
                )

                // ===== SUCCESS TOAST (only on manual refresh) =====
                if (isSilent) {
                    premiumToast.success('Refreshed', {
                        description: `Loaded ${raw.length} lawyer${raw.length === 1 ? '' : 's'}.`,
                        duration: 2000,
                    })
                }
            } catch (err) {
                if (err instanceof ApiError && err.status === 401) {
                    router.push('/signin')
                    return
                }

                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load lawyers.'

                setError(message)

                // ===== ERROR TOAST (context-aware) =====
                if (isSilent) {
                    premiumToast.error('Refresh failed', {
                        description: message,
                    })
                } else {
                    premiumToast.error('Could not load lawyers', {
                        description: message,
                    })
                }
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        },
        [page, debouncedSearch, status, router]
    )

    useEffect(() => {
        loadLawyers()
    }, [loadLawyers])

    useEffect(() => {
        const onClick = () => setMenuOpenId(null)
        if (menuOpenId) {
            window.addEventListener('click', onClick)
            return () => window.removeEventListener('click', onClick)
        }
    }, [menuOpenId])

    const pageStats = useMemo(() => {
        return {
            total,
            active: lawyers.filter((l) => l.status === 'active').length,
            pending: lawyers.filter((l) => l.status === 'pending').length,
            suspended: lawyers.filter((l) => l.status === 'suspended')
                .length,
        }
    }, [lawyers, total])

    const goToLawyer = useCallback(
        (id: string | undefined, fallback?: Lawyer) => {
            let target = id
            if (!target && fallback?.raw) {
                target =
                    fallback.raw._id ||
                    fallback.raw.id ||
                    fallback.raw.userId?._id ||
                    (typeof fallback.raw.userId === 'string'
                        ? fallback.raw.userId
                        : '') ||
                    fallback.raw.userInfo?._id ||
                    fallback.raw.lawyerDetails?._id
            }

            if (!target || target === 'undefined' || target === '') {
                console.warn(
                    '[goToLawyer] Missing id, cannot navigate. Lawyer:',
                    fallback
                )
                return
            }

            router.push(`/admin-dashboard/lawyers/${target}`)
        },
        [router]
    )

    const handleVerify = async (id: string) => {
        const lawyerName =
            lawyers.find((l) => l.id === id)?.fullName || 'Lawyer'

        try {
            setActionId(id)
            await adminApi.verifyLawyer(id)
            await loadLawyers({ silent: true })

            // ===== SUCCESS TOAST =====
            premiumToast.success('Lawyer verified', {
                description: `${lawyerName} is now active on the platform.`,
            })
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Action failed'

            alert(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Verification failed', {
                description: message,
            })
        } finally {
            setActionId(null)
            setMenuOpenId(null)
        }
    }

    const handleSuspend = async (id: string) => {
        if (!confirm('Suspend this lawyer?')) return

        const lawyerName =
            lawyers.find((l) => l.id === id)?.fullName || 'Lawyer'

        try {
            setActionId(id)
            await adminApi.suspendLawyer(id)
            await loadLawyers({ silent: true })

            // ===== SUCCESS TOAST =====
            premiumToast.success('Lawyer suspended', {
                description: `${lawyerName}'s access has been revoked.`,
            })
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Action failed'

            alert(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Suspend failed', {
                description: message,
            })
        } finally {
            setActionId(null)
            setMenuOpenId(null)
        }
    }

    const handleActivate = async (id: string) => {
        const lawyerName =
            lawyers.find((l) => l.id === id)?.fullName || 'Lawyer'

        try {
            setActionId(id)
            await adminApi.activateLawyer(id)
            await loadLawyers({ silent: true })

            // ===== SUCCESS TOAST =====
            premiumToast.success('Lawyer activated', {
                description: `${lawyerName} can now access the platform.`,
            })
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Action failed'

            alert(message)

            // ===== ERROR TOAST =====
            premiumToast.error('Activation failed', {
                description: message,
            })
        } finally {
            setActionId(null)
            setMenuOpenId(null)
        }
    }

    if (error && !loading && lawyers.length === 0) {
        return (
            <div className="min-h-full p-6 lg:p-8">
                <ErrorState
                    message={error}
                    onRetry={() => loadLawyers()}
                />
            </div>
        )
    }

    return (
        <div className="min-h-full text-white">
            <div className="border-b border-white/[0.05] bg-black/40 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs text-amber-400">
                                <Scale className="h-3.5 w-3.5" />
                                <span className="font-medium uppercase tracking-wider">
                                    Admin · Lawyers
                                </span>
                            </div>
                            <h1 className="text-3xl font-light tracking-tight lg:text-4xl">
                                Lawyers
                            </h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Verify, suspend, and manage every lawyer
                                on the platform.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    router.push(
                                        '/admin-dashboard/lawyers/new'
                                    )
                                }
                                className="hidden rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400 sm:flex sm:items-center sm:gap-2"
                            >
                                <UserPlus className="h-4 w-4" />
                                Invite Lawyer
                            </button>

                            <button
                                onClick={() =>
                                    loadLawyers({ silent: true })
                                }
                                disabled={refreshing}
                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 transition hover:bg-white/[0.08] disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`h-5 w-5 text-gray-400 ${refreshing ? 'animate-spin' : ''
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <div className="mb-8">
                    <StatStrip
                        items={[
                            { label: 'Total Lawyers', value: total },
                            {
                                label: 'Active (this page)',
                                value: pageStats.active,
                                tone: 'good',
                            },
                            {
                                label: 'Pending (this page)',
                                value: pageStats.pending,
                                tone: 'warn',
                            },
                            {
                                label: 'Suspended (this page)',
                                value: pageStats.suspended,
                            },
                        ]}
                    />
                </div>

                <AdminCard className="mb-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search by name, email, or bar ID…"
                        />
                        <FilterPills
                            options={STATUS_OPTIONS}
                            value={status}
                            onChange={(v) => {
                                setStatus(v)
                                setPage(1)
                            }}
                        />
                    </div>
                </AdminCard>

                <AdminCard className="overflow-hidden p-0">
                    {loading ? (
                        <div className="p-6">
                            <Skeleton rows={8} />
                        </div>
                    ) : lawyers.length === 0 ? (
                        <EmptyState
                            title="No lawyers found"
                            description={
                                debouncedSearch || status !== 'all'
                                    ? 'Try clearing your filters or adjusting the search.'
                                    : 'Lawyers will appear here once they sign up.'
                            }
                            icon={Scale}
                        />
                    ) : (
                        <>
                            <div className="divide-y divide-white/[0.04]">
                                <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_90px_90px_90px_110px_140px] items-center gap-4 px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-gray-500 lg:grid">
                                    <span>Lawyer</span>
                                    <span>Specialization</span>
                                    <span className="text-center">
                                        Clients
                                    </span>
                                    <span className="text-center">
                                        Work
                                    </span>
                                    <span className="text-center">
                                        Contracts
                                    </span>
                                    <span className="text-center">
                                        Status
                                    </span>
                                    <span className="text-right">
                                        Actions
                                    </span>
                                </div>

                                {lawyers.map((l, index) => (
                                    <motion.div
                                        key={
                                            l.id ||
                                            `lawyer-row-${index}`
                                        }
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{
                                            delay: index * 0.02,
                                        }}
                                        className="grid grid-cols-1 items-center gap-4 px-6 py-4 transition hover:bg-white/[0.02] lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_90px_90px_90px_110px_140px]"
                                    >
                                        <button
                                            onClick={() =>
                                                goToLawyer(l.id, l)
                                            }
                                            className="flex min-w-0 items-center gap-3 text-left"
                                        >
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                                                {l.profilePhoto ? (
                                                    <img
                                                        src={
                                                            l.profilePhoto
                                                        }
                                                        alt={l.fullName}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-amber-400">
                                                        {getInitials(
                                                            l.fullName
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-white">
                                                    {l.fullName}
                                                </p>
                                                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                                                    {l.email && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <Mail className="h-3 w-3" />
                                                            {l.email}
                                                        </span>
                                                    )}
                                                    {l.phone && (
                                                        <span className="hidden items-center gap-1 sm:flex">
                                                            <Phone className="h-3 w-3" />
                                                            {l.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        <div className="flex flex-wrap gap-1">
                                            {l.specialization.length ? (
                                                l.specialization
                                                    .slice(0, 2)
                                                    .map((s, i) => (
                                                        <span
                                                            key={`${s}-${i}`}
                                                            className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-gray-300"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))
                                            ) : (
                                                <span className="text-xs text-gray-600">
                                                    —
                                                </span>
                                            )}
                                            {l.specialization.length >
                                                2 && (
                                                    <span className="text-[11px] text-gray-500">
                                                        +
                                                        {l.specialization
                                                            .length - 2}
                                                    </span>
                                                )}
                                        </div>

                                        <div className="flex items-center justify-between lg:justify-center">
                                            <span className="text-xs text-gray-500 lg:hidden">
                                                Clients
                                            </span>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-200">
                                                <Users className="h-3.5 w-3.5 text-gray-500" />
                                                {l.activeClients}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between lg:justify-center">
                                            <span className="text-xs text-gray-500 lg:hidden">
                                                Open Work
                                            </span>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-200">
                                                <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                                                {l.openWork}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between lg:justify-center">
                                            <span className="text-xs text-gray-500 lg:hidden">
                                                Contracts
                                            </span>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-200">
                                                <FileText className="h-3.5 w-3.5 text-gray-500" />
                                                {l.contracts}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between lg:justify-center">
                                            <span className="text-xs text-gray-500 lg:hidden">
                                                Status
                                            </span>
                                            <StatusBadge
                                                status={l.status}
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    goToLawyer(l.id, l)
                                                }
                                                className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-300 transition hover:border-amber-400/30 hover:text-amber-400"
                                            >
                                                View
                                                <ChevronRight className="h-3 w-3" />
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setMenuOpenId(
                                                            menuOpenId ===
                                                                l.id
                                                                ? null
                                                                : l.id
                                                        )
                                                    }}
                                                    disabled={
                                                        actionId === l.id
                                                    }
                                                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-gray-400 transition hover:bg-white/[0.06] disabled:opacity-40"
                                                >
                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                </button>

                                                {menuOpenId === l.id && (
                                                    <div
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-white/[0.08] bg-slate-950 shadow-xl"
                                                    >
                                                        {l.status !==
                                                            'active' && (
                                                                <button
                                                                    onClick={() =>
                                                                        l.status ===
                                                                            'pending'
                                                                            ? handleVerify(
                                                                                l.id
                                                                            )
                                                                            : handleActivate(
                                                                                l.id
                                                                            )
                                                                    }
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-green-400 transition hover:bg-white/[0.04]"
                                                                >
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    {l.status ===
                                                                        'pending'
                                                                        ? 'Verify & Activate'
                                                                        : 'Activate'}
                                                                </button>
                                                            )}

                                                        {l.status !==
                                                            'suspended' && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleSuspend(
                                                                            l.id
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition hover:bg-white/[0.04]"
                                                                >
                                                                    <Ban className="h-3.5 w-3.5" />
                                                                    Suspend
                                                                </button>
                                                            )}

                                                        {l.status ===
                                                            'suspended' && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleActivate(
                                                                            l.id
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-blue-400 transition hover:bg-white/[0.04]"
                                                                >
                                                                    <Play className="h-3.5 w-3.5" />
                                                                    Reactivate
                                                                </button>
                                                            )}

                                                        <button
                                                            onClick={() =>
                                                                goToLawyer(
                                                                    l.id,
                                                                    l
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-2 border-t border-white/[0.04] px-3 py-2 text-left text-xs text-gray-400 transition hover:bg-white/[0.04]"
                                                        >
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                            Open profile
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                        </>
                    )}
                </AdminCard>

                <div className="mt-6 text-center text-xs text-gray-700">
                    Showing {lawyers.length} of {total} lawyers
                </div>
            </main>
        </div>
    )
}