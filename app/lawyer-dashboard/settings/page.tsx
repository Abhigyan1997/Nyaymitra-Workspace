'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowRight,
    BadgeCheck,
    Banknote,
    Bell,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Eye,
    EyeOff,
    FileText,
    IndianRupee,
    Lock,
    LogOut,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Save,
    Shield,
    UserRound,
    WalletCards,
    X,
    Clock3
} from 'lucide-react'

type SettingsSection =
    | 'profile'
    | 'payments'
    | 'security'

interface LawyerProfile {
    fullName: string
    email: string
    phone: string
    barNumber: string
    experience: string
    bio: string
    city: string
    state: string
    country: string
    specialization: string[]
    practiceAreas: string[]
    profilePhoto: string
    verificationStatus: 'Verified' | 'Pending'
}

interface PaymentDetails {
    accountHolder: string
    bankName: string
    accountNumber: string
    ifsc: string
    upiId: string
    payoutFrequency: 'Monthly' | 'Weekly'
    paymentStatus: 'Verified' | 'Pending'
}

interface Transaction {
    id: string
    client: string
    service: string
    date: string
    amount: number
    status: 'Paid' | 'Pending'
}

const INITIAL_PROFILE: LawyerProfile = {
    fullName: 'Bharat Rajak',
    email: 'rajakbharat1995@gmail.com',
    phone: '+91 90977 93641',
    barNumber: 'BR/2019/4821',
    experience: '7 Years',
    bio: 'Corporate and commercial lawyer focused on contracts, compliance and business legal operations.',
    city: 'Bhagalpur',
    state: 'Bihar',
    country: 'India',
    specialization: [
        'Corporate Law',
        'Contract Management',
        'Compliance',
    ],
    practiceAreas: [
        'Corporate Law',
        'Commercial Contracts',
        'Employment Law',
        'Compliance',
        'Technology Law',
    ],
    profilePhoto:
        'https://res.cloudinary.com/dgkefbwq4/image/upload/v1770397720/nyaymitra-profiles/mayon2hnkdnynsq89d377.png',
    verificationStatus: 'Verified',
}

const INITIAL_PAYMENT_DETAILS: PaymentDetails = {
    accountHolder: 'Bharat Rajak',
    bankName: 'State Bank of India',
    accountNumber: 'XXXX XXXX 4821',
    ifsc: 'SBIN0001234',
    upiId: 'bharat@upi',
    payoutFrequency: 'Monthly',
    paymentStatus: 'Verified',
}

const TRANSACTIONS: Transaction[] = [
    {
        id: 'TXN-001',
        client: 'NyayMitra Technologies Pvt Ltd',
        service: 'Contract Review',
        date: '18 Sep 2026',
        amount: 5000,
        status: 'Paid',
    },
    {
        id: 'TXN-002',
        client: 'CloudEdge Technologies',
        service: 'Legal Consultation',
        date: '16 Sep 2026',
        amount: 3500,
        status: 'Paid',
    },
    {
        id: 'TXN-003',
        client: 'Apex Finserve',
        service: 'Compliance Review',
        date: '14 Sep 2026',
        amount: 7500,
        status: 'Pending',
    },
    {
        id: 'TXN-004',
        client: 'Northstar Retail LLP',
        service: 'Agreement Review',
        date: '11 Sep 2026',
        amount: 4500,
        status: 'Paid',
    },
]

function Card({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={`rounded-2xl border border-white/[0.08] bg-white/[0.025] ${className}`}
        >
            {children}
        </div>
    )
}

function SectionTitle({
    title,
    description,
}: {
    title: string
    description: string
}) {
    return (
        <div className="mb-6">
            <h2 className="text-sm font-semibold text-white">
                {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-zinc-600">
                {description}
            </p>
        </div>
    )
}

function StatusBadge({
    status,
}: {
    status: 'Verified' | 'Pending' | 'Paid'
}) {
    const styles = {
        Verified:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        Pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-400',
        Paid:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status]}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
        </span>
    )
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    type?: string
    placeholder?: string
}) {
    return (
        <div>
            <label className="mb-2 block text-[11px] font-medium text-zinc-500">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                placeholder={placeholder}
                className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-700 transition focus:border-blue-400/30"
            />
        </div>
    )
}

function Money({
    value,
}: {
    value: number
}) {
    return (
        <span>
            ₹
            {value.toLocaleString('en-IN')}
        </span>
    )
}

export default function LawyerSettingsPage() {
    const [activeSection, setActiveSection] =
        useState<SettingsSection>('profile')

    const [profile, setProfile] =
        useState<LawyerProfile>(
            INITIAL_PROFILE
        )

    const [paymentDetails, setPaymentDetails] =
        useState<PaymentDetails>(
            INITIAL_PAYMENT_DETAILS
        )

    const [editingProfile, setEditingProfile] =
        useState(false)

    const [editingPayment, setEditingPayment] =
        useState(false)

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false)

    const [showNewPassword, setShowNewPassword] =
        useState(false)

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false)

    const [currentPassword, setCurrentPassword] =
        useState('')

    const [newPassword, setNewPassword] =
        useState('')

    const [confirmPassword, setConfirmPassword] =
        useState('')

    const [passwordMessage, setPasswordMessage] =
        useState('')

    const [saveMessage, setSaveMessage] =
        useState('')

    const totals = useMemo(() => {
        const paid = TRANSACTIONS.filter(
            (transaction) =>
                transaction.status === 'Paid'
        ).reduce(
            (sum, transaction) =>
                sum + transaction.amount,
            0
        )

        const pending = TRANSACTIONS.filter(
            (transaction) =>
                transaction.status === 'Pending'
        ).reduce(
            (sum, transaction) =>
                sum + transaction.amount,
            0
        )

        return {
            paid,
            pending,
            total: paid + pending,
        }
    }, [])

    useEffect(() => {
        try {
            const storedUser =
                localStorage.getItem('user')

            if (!storedUser) return

            const parsed = JSON.parse(
                storedUser
            )

            setProfile((current) => ({
                ...current,
                fullName:
                    parsed.fullName ||
                    current.fullName,
                email:
                    parsed.email ||
                    current.email,
                phone:
                    parsed.phone ||
                    current.phone,
                profilePhoto:
                    parsed.profilePhoto ||
                    current.profilePhoto,
                specialization:
                    parsed.specialization ||
                    current.specialization,
                practiceAreas:
                    parsed.practiceAreas ||
                    current.practiceAreas,
                barNumber:
                    parsed.barNumber ||
                    current.barNumber,
            }))
        } catch {
            // Keep static defaults if localStorage data is unavailable.
        }
    }, [])

    const updateProfile = <
        K extends keyof LawyerProfile
    >(
        key: K,
        value: LawyerProfile[K]
    ) => {
        setProfile((current) => ({
            ...current,
            [key]: value,
        }))
    }

    const updatePayment = <
        K extends keyof PaymentDetails
    >(
        key: K,
        value: PaymentDetails[K]
    ) => {
        setPaymentDetails((current) => ({
            ...current,
            [key]: value,
        }))
    }

    const saveProfile = () => {
        setEditingProfile(false)
        setSaveMessage(
            'Profile changes saved locally.'
        )

        window.setTimeout(
            () => setSaveMessage(''),
            3000
        )
    }

    const savePayment = () => {
        setEditingPayment(false)
        setSaveMessage(
            'Payment details saved locally.'
        )

        window.setTimeout(
            () => setSaveMessage(''),
            3000
        )
    }

    const changePassword = () => {
        setPasswordMessage('')

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            setPasswordMessage(
                'Please fill in all password fields.'
            )
            return
        }

        if (newPassword.length < 8) {
            setPasswordMessage(
                'New password must contain at least 8 characters.'
            )
            return
        }

        if (
            newPassword !==
            confirmPassword
        ) {
            setPasswordMessage(
                'New password and confirmation do not match.'
            )
            return
        }

        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')

        setPasswordMessage(
            'Password updated successfully.'
        )
    }

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            {/* Background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[25%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />
                <div className="absolute right-0 top-[35%] h-[360px] w-[360px] rounded-full bg-violet-500/[0.018] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{
                        opacity: 0,
                        y: -8,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="border-b border-white/[0.06] pb-6"
                >
                    <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                        <span>Lawyer Dashboard</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-zinc-300">
                            Settings
                        </span>
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Settings
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                        Manage your professional profile, payments, earnings and account security.
                    </p>
                </motion.div>

                {saveMessage && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -5,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3 text-xs text-emerald-400"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {saveMessage}
                    </motion.div>
                )}

                {/* Layout */}
                <div className="mt-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                    {/* Settings navigation */}
                    <aside>
                        <Card className="overflow-hidden p-2">
                            <SettingsNavButton
                                active={
                                    activeSection ===
                                    'profile'
                                }
                                icon={UserRound}
                                title="Profile"
                                description="Personal & professional"
                                onClick={() =>
                                    setActiveSection(
                                        'profile'
                                    )
                                }
                            />

                            <SettingsNavButton
                                active={
                                    activeSection ===
                                    'payments'
                                }
                                icon={WalletCards}
                                title="Payments & Earnings"
                                description="Payouts & transactions"
                                onClick={() =>
                                    setActiveSection(
                                        'payments'
                                    )
                                }
                            />

                            <SettingsNavButton
                                active={
                                    activeSection ===
                                    'security'
                                }
                                icon={Lock}
                                title="Security"
                                description="Password & account"
                                onClick={() =>
                                    setActiveSection(
                                        'security'
                                    )
                                }
                            />
                        </Card>

                        {/* Verification */}
                        <Card className="mt-3 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                                    <BadgeCheck className="h-4 w-4 text-emerald-400" />
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-white">
                                        Verified Lawyer
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-zinc-600">
                                        Profile verification complete
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </aside>

                    {/* Content */}
                    <section className="min-w-0">
                        <AnimatePresence mode="wait">
                            {activeSection ===
                                'profile' && (
                                    <motion.div
                                        key="profile"
                                        initial={{
                                            opacity: 0,
                                            x: 8,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            x: -8,
                                        }}
                                        className="space-y-5"
                                    >
                                        <ProfileSection
                                            profile={profile}
                                            editing={
                                                editingProfile
                                            }
                                            onEdit={() =>
                                                setEditingProfile(
                                                    true
                                                )
                                            }
                                            onCancel={() =>
                                                setEditingProfile(
                                                    false
                                                )
                                            }
                                            onSave={
                                                saveProfile
                                            }
                                            updateProfile={
                                                updateProfile
                                            }
                                        />
                                    </motion.div>
                                )}

                            {activeSection ===
                                'payments' && (
                                    <motion.div
                                        key="payments"
                                        initial={{
                                            opacity: 0,
                                            x: 8,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            x: -8,
                                        }}
                                        className="space-y-5"
                                    >
                                        <PaymentsSection
                                            details={
                                                paymentDetails
                                            }
                                            editing={
                                                editingPayment
                                            }
                                            onEdit={() =>
                                                setEditingPayment(
                                                    true
                                                )
                                            }
                                            onCancel={() =>
                                                setEditingPayment(
                                                    false
                                                )
                                            }
                                            onSave={
                                                savePayment
                                            }
                                            updatePayment={
                                                updatePayment
                                            }
                                            totals={totals}
                                        />
                                    </motion.div>
                                )}

                            {activeSection ===
                                'security' && (
                                    <motion.div
                                        key="security"
                                        initial={{
                                            opacity: 0,
                                            x: 8,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            x: -8,
                                        }}
                                        className="space-y-5"
                                    >
                                        <SecuritySection
                                            currentPassword={
                                                currentPassword
                                            }
                                            newPassword={
                                                newPassword
                                            }
                                            confirmPassword={
                                                confirmPassword
                                            }
                                            setCurrentPassword={
                                                setCurrentPassword
                                            }
                                            setNewPassword={
                                                setNewPassword
                                            }
                                            setConfirmPassword={
                                                setConfirmPassword
                                            }
                                            showCurrentPassword={
                                                showCurrentPassword
                                            }
                                            showNewPassword={
                                                showNewPassword
                                            }
                                            showConfirmPassword={
                                                showConfirmPassword
                                            }
                                            setShowCurrentPassword={
                                                setShowCurrentPassword
                                            }
                                            setShowNewPassword={
                                                setShowNewPassword
                                            }
                                            setShowConfirmPassword={
                                                setShowConfirmPassword
                                            }
                                            passwordMessage={
                                                passwordMessage
                                            }
                                            changePassword={
                                                changePassword
                                            }
                                        />
                                    </motion.div>
                                )}
                        </AnimatePresence>
                    </section>
                </div>
            </main>
        </div>
    )
}

function SettingsNavButton({
    active,
    icon: Icon,
    title,
    description,
    onClick,
}: {
    active: boolean
    icon: React.ComponentType<{
        className?: string
    }>
    title: string
    description: string
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active
                ? 'bg-blue-400/[0.08] ring-1 ring-blue-400/15'
                : 'hover:bg-white/[0.025]'
                }`}
        >
            <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${active
                    ? 'bg-blue-400/10'
                    : 'bg-white/[0.03]'
                    }`}
            >
                <Icon
                    className={`h-4 w-4 ${active
                        ? 'text-blue-400'
                        : 'text-zinc-500'
                        }`}
                />
            </div>

            <div className="min-w-0">
                <p
                    className={`text-xs font-medium ${active
                        ? 'text-white'
                        : 'text-zinc-300'
                        }`}
                >
                    {title}
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                    {description}
                </p>
            </div>

            {active && (
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-400" />
            )}
        </button>
    )
}

function ProfileSection({
    profile,
    editing,
    onEdit,
    onCancel,
    onSave,
    updateProfile,
}: {
    profile: LawyerProfile
    editing: boolean
    onEdit: () => void
    onCancel: () => void
    onSave: () => void
    updateProfile: <K extends keyof LawyerProfile>(
        key: K,
        value: LawyerProfile[K]
    ) => void
}) {
    return (
        <>
            <Card className="overflow-hidden">
                <div className="border-b border-white/[0.06] px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Professional Profile
                            </h2>
                            <p className="mt-1 text-xs text-zinc-600">
                                Information visible to your clients and NyayMitra workspace.
                            </p>
                        </div>

                        {!editing ? (
                            <button
                                onClick={onEdit}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.05]"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={onCancel}
                                    className="rounded-lg border border-white/[0.06] px-3 py-2 text-xs text-zinc-500 hover:text-white"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={onSave}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-300 ring-1 ring-blue-400/20"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5">
                    {/* Identity */}
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="relative">
                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-blue-500/[0.06]">
                                {profile.profilePhoto ? (
                                    <img
                                        src={profile.profilePhoto}
                                        alt={profile.fullName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound className="h-8 w-8 text-blue-400" />
                                )}
                            </div>

                            {profile.verificationStatus ===
                                'Verified' && (
                                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0b0e12] bg-emerald-500">
                                        <BadgeCheck className="h-3.5 w-3.5 text-white" />
                                    </div>
                                )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">
                                {profile.fullName}
                            </h3>

                            <p className="mt-1 text-xs text-zinc-500">
                                Legal Professional •{' '}
                                {profile.experience}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {profile.specialization.map(
                                    (item) => (
                                        <span
                                            key={item}
                                            className="rounded-full border border-blue-400/10 bg-blue-400/[0.06] px-2.5 py-1 text-[10px] text-blue-300"
                                        >
                                            {item}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="my-6 h-px bg-white/[0.06]" />

                    {/* Fields */}
                    <div className="grid gap-5 md:grid-cols-2">
                        {editing ? (
                            <>
                                <Field
                                    label="Full Name"
                                    value={
                                        profile.fullName
                                    }
                                    onChange={(value) =>
                                        updateProfile(
                                            'fullName',
                                            value
                                        )
                                    }
                                />

                                <Field
                                    label="Email"
                                    value={
                                        profile.email
                                    }
                                    onChange={(value) =>
                                        updateProfile(
                                            'email',
                                            value
                                        )
                                    }
                                    type="email"
                                />

                                <Field
                                    label="Phone"
                                    value={
                                        profile.phone
                                    }
                                    onChange={(value) =>
                                        updateProfile(
                                            'phone',
                                            value
                                        )
                                    }
                                />

                                <Field
                                    label="Bar Registration Number"
                                    value={
                                        profile.barNumber
                                    }
                                    onChange={(value) =>
                                        updateProfile(
                                            'barNumber',
                                            value
                                        )
                                    }
                                />

                                <Field
                                    label="City"
                                    value={
                                        profile.city
                                    }
                                    onChange={(value) =>
                                        updateProfile(
                                            'city',
                                            value
                                        )
                                    }
                                />

                                <Field
                                    label="State"
                                    value={
                                        profile.state
                                    }
                                    onChange={(value) =>
                                        updateProfile(
                                            'state',
                                            value
                                        )
                                    }
                                />
                            </>
                        ) : (
                            <>
                                <ProfileInfo
                                    icon={UserRound}
                                    label="Full Name"
                                    value={
                                        profile.fullName
                                    }
                                />

                                <ProfileInfo
                                    icon={Mail}
                                    label="Email"
                                    value={
                                        profile.email
                                    }
                                />

                                <ProfileInfo
                                    icon={Phone}
                                    label="Phone"
                                    value={
                                        profile.phone
                                    }
                                />

                                <ProfileInfo
                                    icon={BadgeCheck}
                                    label="Bar Registration"
                                    value={
                                        profile.barNumber
                                    }
                                />

                                <ProfileInfo
                                    icon={MapPin}
                                    label="Location"
                                    value={`${profile.city}, ${profile.state}, ${profile.country}`}
                                />

                                <ProfileInfo
                                    icon={BriefcaseBusiness}
                                    label="Experience"
                                    value={
                                        profile.experience
                                    }
                                />
                            </>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="mt-6">
                        <label className="mb-2 block text-[11px] font-medium text-zinc-500">
                            Professional Bio
                        </label>

                        {editing ? (
                            <textarea
                                value={
                                    profile.bio
                                }
                                onChange={(e) =>
                                    updateProfile(
                                        'bio',
                                        e.target.value
                                    )
                                }
                                rows={4}
                                className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm leading-6 text-white outline-none focus:border-blue-400/30"
                            />
                        ) : (
                            <p className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-xs leading-6 text-zinc-500">
                                {profile.bio}
                            </p>
                        )}
                    </div>

                    {/* Practice Areas */}
                    <div className="mt-6">
                        <label className="mb-3 block text-[11px] font-medium text-zinc-500">
                            Practice Areas
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {profile.practiceAreas.map(
                                (area) => (
                                    <span
                                        key={area}
                                        className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-300"
                                    >
                                        {area}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Profile preferences */}
            <Card className="p-5">
                <SectionTitle
                    title="Workspace Preferences"
                    description="Configure how you receive lawyer workspace notifications."
                />

                <div className="space-y-3">
                    <PreferenceRow
                        icon={Bell}
                        title="Client notifications"
                        description="Receive updates when clients assign new work."
                    />

                    <PreferenceRow
                        icon={FileText}
                        title="Contract notifications"
                        description="Get notified when contracts need your review."
                    />

                    <PreferenceRow
                        icon={CalendarDays}
                        title="Compliance reminders"
                        description="Receive reminders before compliance deadlines."
                    />
                </div>
            </Card>
        </>
    )
}

function PaymentsSection({
    details,
    editing,
    onEdit,
    onCancel,
    onSave,
    updatePayment,
    totals,
}: {
    details: PaymentDetails
    editing: boolean
    onEdit: () => void
    onCancel: () => void
    onSave: () => void
    updatePayment: <K extends keyof PaymentDetails>(
        key: K,
        value: PaymentDetails[K]
    ) => void
    totals: {
        paid: number
        pending: number
        total: number
    }
}) {
    return (
        <>
            {/* Earnings */}
            <Card className="p-5">
                <SectionTitle
                    title="Earnings Overview"
                    description="Track your earnings from NyayMitra legal work."
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <EarningCard
                        icon={IndianRupee}
                        label="Total Earnings"
                        value={totals.total}
                    />

                    <EarningCard
                        icon={CheckCircle2}
                        label="Paid"
                        value={totals.paid}
                    />

                    <EarningCard
                        icon={Clock3Icon}
                        label="Pending"
                        value={totals.pending}
                    />
                </div>
            </Card>

            {/* Payment details */}
            <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold">
                            Payment Details
                        </h2>

                        <p className="mt-1 text-xs text-zinc-600">
                            Bank and payout information.
                        </p>
                    </div>

                    {!editing ? (
                        <button
                            onClick={onEdit}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-xs text-zinc-300"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={onCancel}
                                className="px-3 py-2 text-xs text-zinc-500"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={onSave}
                                className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-300 ring-1 ring-blue-400/20"
                            >
                                Save
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                    {editing ? (
                        <>
                            <Field
                                label="Account Holder"
                                value={
                                    details.accountHolder
                                }
                                onChange={(value) =>
                                    updatePayment(
                                        'accountHolder',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Bank Name"
                                value={
                                    details.bankName
                                }
                                onChange={(value) =>
                                    updatePayment(
                                        'bankName',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Account Number"
                                value={
                                    details.accountNumber
                                }
                                onChange={(value) =>
                                    updatePayment(
                                        'accountNumber',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="IFSC Code"
                                value={
                                    details.ifsc
                                }
                                onChange={(value) =>
                                    updatePayment(
                                        'ifsc',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="UPI ID"
                                value={
                                    details.upiId
                                }
                                onChange={(value) =>
                                    updatePayment(
                                        'upiId',
                                        value
                                    )
                                }
                            />

                            <div>
                                <label className="mb-2 block text-[11px] font-medium text-zinc-500">
                                    Payout Frequency
                                </label>

                                <select
                                    value={
                                        details.payoutFrequency
                                    }
                                    onChange={(e) =>
                                        updatePayment(
                                            'payoutFrequency',
                                            e.target
                                                .value as PaymentDetails['payoutFrequency']
                                        )
                                    }
                                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none"
                                >
                                    <option value="Monthly">
                                        Monthly
                                    </option>

                                    <option value="Weekly">
                                        Weekly
                                    </option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <PaymentInfo
                                icon={UserRound}
                                label="Account Holder"
                                value={
                                    details.accountHolder
                                }
                            />

                            <PaymentInfo
                                icon={Building2}
                                label="Bank"
                                value={
                                    details.bankName
                                }
                            />

                            <PaymentInfo
                                icon={CreditCard}
                                label="Account Number"
                                value={
                                    details.accountNumber
                                }
                            />

                            <PaymentInfo
                                icon={Shield}
                                label="IFSC"
                                value={
                                    details.ifsc
                                }
                            />

                            <PaymentInfo
                                icon={WalletCards}
                                label="UPI ID"
                                value={
                                    details.upiId
                                }
                            />

                            <PaymentInfo
                                icon={CalendarDays}
                                label="Payout Frequency"
                                value={
                                    details.payoutFrequency
                                }
                            />
                        </>
                    )}
                </div>

                <div className="border-t border-white/[0.06] px-5 py-4">
                    <div className="flex items-center gap-3">
                        <BadgeCheck className="h-4 w-4 text-emerald-400" />

                        <div>
                            <p className="text-xs font-medium text-emerald-300">
                                Payment account verified
                            </p>

                            <p className="mt-0.5 text-[10px] text-zinc-600">
                                Your payout information is ready for processing.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Transactions */}
            <Card className="overflow-hidden">
                <div className="border-b border-white/[0.06] px-5 py-4">
                    <h2 className="text-sm font-semibold">
                        Recent Earnings
                    </h2>

                    <p className="mt-1 text-xs text-zinc-600">
                        Your latest client-related transactions.
                    </p>
                </div>

                <div className="divide-y divide-white/[0.05]">
                    {TRANSACTIONS.map(
                        (transaction) => (
                            <div
                                key={transaction.id}
                                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/[0.06]">
                                    <IndianRupee className="h-4 w-4 text-emerald-400" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-white">
                                        {
                                            transaction.service
                                        }
                                    </p>

                                    <p className="mt-1 truncate text-[10px] text-zinc-600">
                                        {transaction.client} •{' '}
                                        {transaction.date}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                    <p className="text-sm font-semibold text-white">
                                        <Money
                                            value={
                                                transaction.amount
                                            }
                                        />
                                    </p>

                                    <StatusBadge
                                        status={
                                            transaction.status
                                        }
                                    />
                                </div>
                            </div>
                        )
                    )}
                </div>
            </Card>
        </>
    )
}

function SecuritySection({
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    passwordMessage,
    changePassword,
}: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
    setCurrentPassword: (value: string) => void
    setNewPassword: (value: string) => void
    setConfirmPassword: (value: string) => void
    showCurrentPassword: boolean
    showNewPassword: boolean
    showConfirmPassword: boolean
    setShowCurrentPassword: (value: boolean) => void
    setShowNewPassword: (value: boolean) => void
    setShowConfirmPassword: (value: boolean) => void
    passwordMessage: string
    changePassword: () => void
}) {
    const messageSuccess =
        passwordMessage.includes(
            'successfully'
        )

    return (
        <>
            {/* Change password */}
            <Card className="overflow-hidden">
                <div className="border-b border-white/[0.06] px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                            <Lock className="h-4 w-4 text-blue-400" />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold">
                                Change Password
                            </h2>

                            <p className="mt-1 text-xs text-zinc-600">
                                Update your password to keep your account secure.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    <PasswordField
                        label="Current Password"
                        value={
                            currentPassword
                        }
                        onChange={
                            setCurrentPassword
                        }
                        show={
                            showCurrentPassword
                        }
                        setShow={
                            setShowCurrentPassword
                        }
                    />

                    <PasswordField
                        label="New Password"
                        value={
                            newPassword
                        }
                        onChange={
                            setNewPassword
                        }
                        show={
                            showNewPassword
                        }
                        setShow={
                            setShowNewPassword
                        }
                    />

                    <PasswordField
                        label="Confirm New Password"
                        value={
                            confirmPassword
                        }
                        onChange={
                            setConfirmPassword
                        }
                        show={
                            showConfirmPassword
                        }
                        setShow={
                            setShowConfirmPassword
                        }
                    />

                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                        <p className="text-xs font-medium text-zinc-300">
                            Password requirements
                        </p>

                        <div className="mt-2 space-y-1 text-[11px] text-zinc-600">
                            <p>• Minimum 8 characters</p>
                            <p>• Use a mix of letters and numbers</p>
                            <p>• Avoid using easily guessed information</p>
                        </div>
                    </div>

                    {passwordMessage && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-xs ${messageSuccess
                                ? 'border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-400'
                                : 'border-red-500/15 bg-red-500/[0.04] text-red-400'
                                }`}
                        >
                            {passwordMessage}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={
                                changePassword
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-xs font-medium text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/15"
                        >
                            <Lock className="h-3.5 w-3.5" />
                            Update Password
                        </button>
                    </div>
                </div>
            </Card>

            {/* Security status */}
            <Card className="p-5">
                <SectionTitle
                    title="Account Security"
                    description="Review your account security settings."
                />

                <div className="space-y-3">
                    <SecurityRow
                        icon={Shield}
                        title="Account verification"
                        description="Your lawyer account is verified."
                        status="Verified"
                    />

                    <SecurityRow
                        icon={Mail}
                        title="Email verification"
                        description="Your primary email is verified."
                        status="Verified"
                    />

                    <SecurityRow
                        icon={Lock}
                        title="Password"
                        description="Your password is protected."
                        status="Active"
                    />

                    <SecurityRow
                        icon={Bell}
                        title="Login alerts"
                        description="Security notifications are enabled."
                        status="Enabled"
                    />
                </div>
            </Card>

            {/* Danger zone */}
            <Card className="border-red-500/10 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Sign out of account
                        </h3>

                        <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-600">
                            Sign out from the current lawyer workspace on this device.
                        </p>
                    </div>

                    <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.04] px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/[0.08]">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </Card>
        </>
    )
}

function ProfileInfo({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{
        className?: string
    }>
    label: string
    value: string
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
                <Icon className="h-3.5 w-3.5 text-zinc-500" />
            </div>

            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                    {label}
                </p>

                <p className="mt-1 truncate text-xs text-zinc-300">
                    {value}
                </p>
            </div>
        </div>
    )
}

function PaymentInfo({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{
        className?: string
    }>
    label: string
    value: string
}) {
    return (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-zinc-600" />

                <span className="text-[10px] uppercase tracking-wider text-zinc-700">
                    {label}
                </span>
            </div>

            <p className="mt-2 text-xs text-zinc-300">
                {value}
            </p>
        </div>
    )
}

function EarningCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{
        className?: string
    }>
    label: string
    value: number
}) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                <Icon className="h-4 w-4 text-blue-400" />
            </div>

            <p className="mt-4 text-xl font-semibold text-white">
                <Money value={value} />
            </p>

            <p className="mt-1 text-xs text-zinc-500">
                {label}
            </p>
        </div>
    )
}

function Clock3Icon() {
    return (
        <Clock3 className="h-4 w-4 text-blue-400" />
    )
}

function PasswordField({
    label,
    value,
    onChange,
    show,
    setShow,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    show: boolean
    setShow: (value: boolean) => void
}) {
    return (
        <div>
            <label className="mb-2 block text-[11px] font-medium text-zinc-500">
                {label}
            </label>

            <div className="relative">
                <input
                    type={
                        show
                            ? 'text'
                            : 'password'
                    }
                    value={value}
                    onChange={(e) =>
                        onChange(
                            e.target.value
                        )
                    }
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 pr-11 text-sm text-white outline-none focus:border-blue-400/30"
                />

                <button
                    type="button"
                    onClick={() =>
                        setShow(!show)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
                >
                    {show ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
        </div>
    )
}

function PreferenceRow({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{
        className?: string
    }>
    title: string
    description: string
}) {
    const [enabled, setEnabled] =
        useState(true)

    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
                <Icon className="h-4 w-4 text-zinc-500" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-300">
                    {title}
                </p>

                <p className="mt-1 text-[10px] text-zinc-700">
                    {description}
                </p>
            </div>

            <button
                onClick={() =>
                    setEnabled(!enabled)
                }
                className={`relative h-5 w-9 shrink-0 rounded-full transition ${enabled
                    ? 'bg-blue-500/40'
                    : 'bg-white/[0.08]'
                    }`}
            >
                <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${enabled
                        ? 'left-[18px]'
                        : 'left-0.5'
                        }`}
                />
            </button>
        </div>
    )
}

function SecurityRow({
    icon: Icon,
    title,
    description,
    status,
}: {
    icon: React.ComponentType<{
        className?: string
    }>
    title: string
    description: string
    status: string
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
                <Icon className="h-4 w-4 text-zinc-500" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white">
                    {title}
                </p>

                <p className="mt-1 text-[10px] text-zinc-700">
                    {description}
                </p>
            </div>

            <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] text-emerald-400">
                {status}
            </span>
        </div>
    )
}