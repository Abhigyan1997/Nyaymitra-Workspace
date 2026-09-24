// app/admin-dashboard/lawyers/[id]/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Scale,
    ArrowLeft,
    RefreshCw,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Users,
    FileText,
    Shield,
    CheckCircle2,
    Ban,
    Play,
    Calendar,
    Award,
    Clock,
    Star,
    Eye,
    Crown,
    Video,
    MessageCircle,
    Building2,
    Languages,
    CreditCard,
    Bell,
    Gavel,
    AlertTriangle,
    User as UserIcon,
} from 'lucide-react'

import {
    adminApi,
    ApiError,
    formatDate,
    formatDateTime,
    getInitials,
    getArray,
    normalizeLawyer,
    normalizeWork,
    normalizeContract,
    normalizeCompliance,
    type Lawyer,
    type WorkItem,
    type Contract,
    type ComplianceItem,
} from '@/lib/adminApi'

import {
    AdminCard,
    EmptyState,
    ErrorState,
    Skeleton,
    StatStrip,
    StatusBadge,
} from '@/components/admin/AdminUI'

type Tab = 'overview' | 'work' | 'contracts' | 'compliance'

const TABS: { label: string; value: Tab }[] = [
    { label: 'Overview', value: 'overview' },
    { label: 'Work', value: 'work' },
    { label: 'Contracts', value: 'contracts' },
    { label: 'Compliance', value: 'compliance' },
]

export default function AdminLawyerDetailPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const id = params?.id as string

    const [lawyer, setLawyer] = useState<Lawyer | null>(null)
    const [raw, setRaw] = useState<any>(null)
    const [work, setWork] = useState<WorkItem[]>([])
    const [contracts, setContracts] = useState<Contract[]>([])
    const [compliance, setCompliance] = useState<ComplianceItem[]>([])

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [actionId, setActionId] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab>('overview')

    const load = useCallback(
        async (opts?: { silent?: boolean }) => {
            if (!id) return

            try {
                if (opts?.silent) setRefreshing(true)
                else setLoading(true)

                setError(null)

                const detailResponse = await adminApi.lawyerDetail(id)

                // Your backend returns { success: true, lawyer: {...} }
                const lawyerRaw =
                    detailResponse?.lawyer ||
                    detailResponse?.data ||
                    detailResponse

                setRaw(lawyerRaw)
                setLawyer(normalizeLawyer(lawyerRaw))

                // Related data (best-effort — silently ignore failures)
                const [workRes, contractRes, complianceRes] =
                    await Promise.allSettled([
                        adminApi.listWork({
                            page: 1,
                            limit: 50,
                            search: lawyerRaw?.fullName || undefined,
                        }),
                        adminApi.listContracts({
                            page: 1,
                            limit: 50,
                            search: lawyerRaw?.fullName || undefined,
                        }),
                        adminApi.listCompliance({
                            page: 1,
                            limit: 50,
                            search: lawyerRaw?.fullName || undefined,
                        }),
                    ])

                if (workRes.status === 'fulfilled') {
                    setWork(getArray<any>(workRes.value).map(normalizeWork))
                }
                if (contractRes.status === 'fulfilled') {
                    setContracts(
                        getArray<any>(contractRes.value).map(normalizeContract)
                    )
                }
                if (complianceRes.status === 'fulfilled') {
                    setCompliance(
                        getArray<any>(complianceRes.value).map(normalizeCompliance)
                    )
                }
            } catch (err) {
                if (err instanceof ApiError && err.status === 401) {
                    router.push('/signin')
                    return
                }
                setError(
                    err instanceof Error ? err.message : 'Failed to load lawyer.'
                )
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        },
        [id, router]
    )

    useEffect(() => {
        load()
    }, [load])

    const handleVerify = async () => {
        if (!id) return
        try {
            setActionId(id)
            await adminApi.verifyLawyer(id)
            await load({ silent: true })
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Action failed')
        } finally {
            setActionId(null)
        }
    }

    const handleSuspend = async () => {
        if (!id) return
        if (!confirm('Suspend this lawyer?')) return
        try {
            setActionId(id)
            await adminApi.suspendLawyer(id)
            await load({ silent: true })
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Action failed')
        } finally {
            setActionId(null)
        }
    }

    const handleActivate = async () => {
        if (!id) return
        try {
            setActionId(id)
            await adminApi.activateLawyer(id)
            await load({ silent: true })
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Action failed')
        } finally {
            setActionId(null)
        }
    }

    const location = useMemo(() => {
        const parts = [lawyer?.city, lawyer?.state].filter(Boolean)
        return parts.length ? parts.join(', ') : null
    }, [lawyer])

    const consultationModeLabels = useMemo(() => {
        const modes = lawyer?.consultationModes
        if (!modes) return []
        const labels: string[] = []
        if (modes.video) labels.push('Video')
        if (modes.call) labels.push('Call')
        if (modes.chat) labels.push('Chat')
        if (modes.inPerson) labels.push('In person')
        return labels
    }, [lawyer])

    const isSuspended = lawyer?.accountStatus === 'suspended'
    const isActive = lawyer?.accountStatus === 'active'

    if (error && !loading) {
        return (
            <div className="min-h-full p-6 lg:p-8">
                <ErrorState message={error} onRetry={() => load()} />
            </div>
        )
    }

    return (
        <div className="min-h-full text-white">
            {/* Header */}
            <div className="border-b border-white/[0.05] bg-black/40 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                    <button
                        onClick={() => router.push('/admin-dashboard/lawyers')}
                        className="mb-4 flex items-center gap-2 text-xs text-gray-500 transition hover:text-amber-400"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Lawyers
                    </button>

                    {loading ? (
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 animate-pulse rounded-2xl bg-white/[0.05]" />
                            <div className="space-y-3">
                                <div className="h-6 w-48 animate-pulse rounded bg-white/[0.05]" />
                                <div className="h-4 w-64 animate-pulse rounded bg-white/[0.03]" />
                            </div>
                        </div>
                    ) : lawyer ? (
                        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="flex items-start gap-5">
                                <div className="relative">
                                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-500/15 ring-2 ring-amber-500/20">
                                        {lawyer.profilePhoto ? (
                                            <img
                                                src={lawyer.profilePhoto}
                                                alt={lawyer.fullName}
                                                className="h-20 w-20 object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-bold text-amber-400">
                                                {getInitials(lawyer.fullName)}
                                            </span>
                                        )}
                                    </div>
                                    {lawyer.isPremium && (
                                        <div
                                            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 ring-2 ring-black"
                                            title="Premium"
                                        >
                                            <Crown className="h-3.5 w-3.5 text-black" />
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <div className="mb-2 flex items-center gap-2 text-xs text-amber-400">
                                        <Scale className="h-3.5 w-3.5" />
                                        <span className="font-medium uppercase tracking-wider">
                                            Lawyer
                                        </span>
                                    </div>

                                    <h1 className="text-3xl font-light tracking-tight lg:text-4xl">
                                        {lawyer.fullName}
                                    </h1>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400">
                                        {lawyer.userId && (
                                            <span className="font-mono text-xs text-gray-500">
                                                ID: {lawyer.userId}
                                            </span>
                                        )}
                                        {location && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {location}
                                            </span>
                                        )}
                                        {lawyer.experience ? (
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                {lawyer.experience} yrs experience
                                            </span>
                                        ) : null}
                                        {lawyer.createdAt && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Joined {formatDate(lawyer.createdAt)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Badges row */}
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        {/* Account status */}
                                        <StatusBadge status={lawyer.accountStatus} />

                                        {/* KYC */}
                                        {lawyer.kycStatus && (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${lawyer.kycStatus === 'verified'
                                                        ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                                        : lawyer.kycStatus === 'pending'
                                                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                                                            : 'border-red-500/20 bg-red-500/10 text-red-400'
                                                    }`}
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                KYC: {lawyer.kycStatus}
                                            </span>
                                        )}

                                        {/* Availability */}
                                        {lawyer.availabilityStatus && (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${lawyer.availabilityStatus === 'online'
                                                        ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                                        : 'border-gray-500/20 bg-gray-500/10 text-gray-400'
                                                    }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${lawyer.availabilityStatus === 'online'
                                                            ? 'bg-green-400'
                                                            : 'bg-gray-500'
                                                        }`}
                                                />
                                                {lawyer.availabilityStatus}
                                            </span>
                                        )}

                                        {/* Premium */}
                                        {lawyer.isPremium && (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400">
                                                <Crown className="h-3 w-3" />
                                                Premium
                                            </span>
                                        )}

                                        {/* Verified by platform */}
                                        {lawyer.verifiedByPlatform && (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Platform Verified
                                            </span>
                                        )}

                                        {/* Payout */}
                                        {lawyer.payoutVerified && (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                                                <CreditCard className="h-3 w-3" />
                                                Payouts OK
                                            </span>
                                        )}
                                    </div>

                                    {/* Specialization chips */}
                                    {lawyer.specialization.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {lawyer.specialization.map((s) => (
                                                <span
                                                    key={s}
                                                    className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-400"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {!isActive && (
                                    <button
                                        onClick={handleActivate}
                                        disabled={actionId === id}
                                        className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-green-400 disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Activate
                                    </button>
                                )}

                                {!isSuspended && (
                                    <button
                                        onClick={handleSuspend}
                                        disabled={actionId === id}
                                        className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                                    >
                                        <Ban className="h-4 w-4" />
                                        Suspend
                                    </button>
                                )}

                                <button
                                    onClick={() => load({ silent: true })}
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
                    ) : null}
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                {/* Stats */}
                <div className="mb-8">
                    <StatStrip
                        items={[
                            {
                                label: 'Consultations',
                                value: lawyer?.consultationCount ?? 0,
                            },
                            {
                                label: 'Profile Views',
                                value: lawyer?.profileViews ?? 0,
                            },
                            {
                                label: 'Rating',
                                value:
                                    lawyer?.averageRating != null
                                        ? `${lawyer.averageRating.toFixed(1)}★ (${lawyer.totalReviews})`
                                        : '—',
                            },
                            {
                                label: 'Consultation Fee',
                                value: lawyer?.consultationFee
                                    ? `₹${lawyer.consultationFee}`
                                    : '—',
                                tone: 'good',
                            },
                        ]}
                    />
                </div>

                {/* Tabs */}
                <div className="mb-6 flex flex-wrap gap-2 border-b border-white/[0.06] pb-2">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setTab(t.value)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.value
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton rows={4} />
                        <Skeleton rows={3} />
                    </div>
                ) : tab === 'overview' ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Bio */}
                        {lawyer?.bio && (
                            <AdminCard className="lg:col-span-2">
                                <h2 className="mb-4 text-lg font-semibold">Bio</h2>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">
                                    {lawyer.bio}
                                </p>
                            </AdminCard>
                        )}

                        {/* Professional */}
                        <AdminCard>
                            <h2 className="mb-6 text-lg font-semibold">
                                Professional Details
                            </h2>
                            <div className="space-y-4">
                                <DetailRow
                                    icon={Award}
                                    label="Bar Council ID"
                                    value={lawyer?.barCouncilId || '—'}
                                />
                                <DetailRow
                                    icon={Clock}
                                    label="Experience"
                                    value={
                                        lawyer?.experience
                                            ? `${lawyer.experience} years`
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Gavel}
                                    label="Court Types"
                                    value={
                                        lawyer?.courtType?.length
                                            ? lawyer.courtType.join(', ')
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Languages}
                                    label="Languages Spoken"
                                    value={
                                        lawyer?.languagesSpoken?.length
                                            ? lawyer.languagesSpoken.join(', ')
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Building2}
                                    label="Law Firm"
                                    value={raw?.lawFirm || '—'}
                                />
                                <DetailRow
                                    icon={UserIcon}
                                    label="Gender"
                                    value={raw?.gender ? capitalize(raw.gender) : '—'}
                                />
                            </div>
                        </AdminCard>

                        {/* Consultation */}
                        <AdminCard>
                            <h2 className="mb-6 text-lg font-semibold">
                                Consultation
                            </h2>
                            <div className="space-y-4">
                                <DetailRow
                                    icon={CreditCard}
                                    label="Consultation Fee"
                                    value={
                                        lawyer?.consultationFee
                                            ? `₹${lawyer.consultationFee}`
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Clock}
                                    label="Duration"
                                    value={
                                        lawyer?.consultationDurationMinutes
                                            ? `${lawyer.consultationDurationMinutes} mins`
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Briefcase}
                                    label="Modes"
                                    value={
                                        consultationModeLabels.length
                                            ? consultationModeLabels.join(', ')
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Calendar}
                                    label="Max Bookings / Day"
                                    value={
                                        lawyer?.maxBookingsPerDay
                                            ? String(lawyer.maxBookingsPerDay)
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Bell}
                                    label="Advance Notice"
                                    value={
                                        lawyer?.advanceNoticeHours
                                            ? `${lawyer.advanceNoticeHours} hrs`
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Star}
                                    label="Rating"
                                    value={
                                        lawyer?.averageRating != null
                                            ? `${lawyer.averageRating.toFixed(1)} ★ (${lawyer.totalReviews} reviews)`
                                            : 'No reviews yet'
                                    }
                                />
                            </div>
                        </AdminCard>

                        {/* Contact & Location */}
                        <AdminCard>
                            <h2 className="mb-6 text-lg font-semibold">
                                Contact & Location
                            </h2>
                            <div className="space-y-4">
                                <DetailRow
                                    icon={Mail}
                                    label="Email"
                                    value={
                                        raw?.userInfo?.email || raw?.email || '—'
                                    }
                                />
                                <DetailRow
                                    icon={Phone}
                                    label="Phone"
                                    value={
                                        raw?.userInfo?.phone || raw?.phone || '—'
                                    }
                                />
                                <DetailRow
                                    icon={MapPin}
                                    label="City"
                                    value={lawyer?.city || '—'}
                                />
                                <DetailRow
                                    icon={MapPin}
                                    label="State"
                                    value={lawyer?.state || '—'}
                                />
                                <DetailRow
                                    icon={Calendar}
                                    label="Joined"
                                    value={
                                        lawyer?.createdAt
                                            ? formatDate(lawyer.createdAt)
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    icon={Clock}
                                    label="Last Updated"
                                    value={
                                        raw?.updatedAt
                                            ? formatDateTime(raw.updatedAt)
                                            : '—'
                                    }
                                />
                            </div>
                        </AdminCard>

                        {/* Account & Security */}
                        <AdminCard>
                            <h2 className="mb-6 text-lg font-semibold">
                                Account & Security
                            </h2>
                            <div className="space-y-4">
                                <DetailRow
                                    icon={Shield}
                                    label="Account Status"
                                    value={lawyer?.accountStatus || '—'}
                                />
                                <DetailRow
                                    icon={CheckCircle2}
                                    label="KYC Status"
                                    value={lawyer?.kycStatus || '—'}
                                />
                                <DetailRow
                                    icon={Eye}
                                    label="Availability"
                                    value={lawyer?.availabilityStatus || '—'}
                                />
                                <DetailRow
                                    icon={Crown}
                                    label="Premium"
                                    value={lawyer?.isPremium ? 'Yes' : 'No'}
                                />
                                <DetailRow
                                    icon={CreditCard}
                                    label="Payout Verified"
                                    value={lawyer?.payoutVerified ? 'Yes' : 'No'}
                                />
                                <DetailRow
                                    icon={Shield}
                                    label="Platform Verified"
                                    value={lawyer?.verifiedByPlatform ? 'Yes' : 'No'}
                                />
                                {raw?.suspensionReason && (
                                    <DetailRow
                                        icon={AlertTriangle}
                                        label="Suspension Reason"
                                        value={raw.suspensionReason}
                                    />
                                )}
                            </div>
                        </AdminCard>

                        {/* Notification Preferences */}
                        {raw?.notificationPreferences && (
                            <AdminCard className="lg:col-span-2">
                                <h2 className="mb-4 text-lg font-semibold">
                                    Notification Preferences
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(raw.notificationPreferences).map(
                                        ([key, val]) => (
                                            <span
                                                key={key}
                                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${val
                                                        ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                                        : 'border-white/[0.08] bg-white/[0.02] text-gray-500'
                                                    }`}
                                            >
                                                {key}: {val ? 'on' : 'off'}
                                            </span>
                                        )
                                    )}
                                </div>
                            </AdminCard>
                        )}

                        {/* Debug — remove later */}
                        <AdminCard className="lg:col-span-2">
                            <details className="group">
                                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                    Debug: raw lawyer JSON
                                    <span className="ml-auto text-xs text-gray-600 group-open:hidden">
                                        Show
                                    </span>
                                    <span className="ml-auto hidden text-xs text-gray-600 group-open:inline">
                                        Hide
                                    </span>
                                </summary>
                                <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-white/[0.06] bg-black/60 p-4 text-xs text-gray-400">
                                    {JSON.stringify(raw, null, 2)}
                                </pre>
                            </details>
                        </AdminCard>
                    </div>
                ) : tab === 'work' ? (
                    <AdminCard>
                        <h2 className="mb-6 text-lg font-semibold">Assigned Work</h2>
                        {work.length === 0 ? (
                            <EmptyState
                                title="No work assigned"
                                description="This lawyer has no work items yet."
                                icon={Briefcase}
                            />
                        ) : (
                            <div className="space-y-2">
                                {work.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                                    >
                                        <Briefcase className="h-4 w-4 shrink-0 text-amber-400" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-gray-600">
                                                {item.type} • {item.client}
                                                {item.dueDate
                                                    ? ` • Due ${formatDate(item.dueDate)}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={item.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </AdminCard>
                ) : tab === 'contracts' ? (
                    <AdminCard>
                        <h2 className="mb-6 text-lg font-semibold">Contracts</h2>
                        {contracts.length === 0 ? (
                            <EmptyState
                                title="No contracts"
                                description="No contracts are assigned to this lawyer."
                                icon={FileText}
                            />
                        ) : (
                            <div className="space-y-2">
                                {contracts.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                                    >
                                        <FileText className="h-4 w-4 shrink-0 text-amber-400" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {c.title}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-gray-600">
                                                {c.client}
                                                {c.dueDate
                                                    ? ` • ${formatDate(c.dueDate)}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={c.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </AdminCard>
                ) : (
                    <AdminCard>
                        <h2 className="mb-6 text-lg font-semibold">Compliance</h2>
                        {compliance.length === 0 ? (
                            <EmptyState
                                title="No compliance items"
                                description="No compliance items assigned."
                                icon={Shield}
                            />
                        ) : (
                            <div className="space-y-2">
                                {compliance.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                                    >
                                        <Shield className="h-4 w-4 shrink-0 text-amber-400" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {c.name}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-600">
                                                {c.client}
                                                {c.dueDate
                                                    ? ` • Due ${formatDate(c.dueDate)}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={c.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </AdminCard>
                )}
            </main>
        </div>
    )
}

// ---------------------------------------------------------------
// Small sub-components
// ---------------------------------------------------------------
function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
                <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-0.5 break-words text-sm capitalize text-white">
                    {value}
                </p>
            </div>
        </div>
    )
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}