'use client'

import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Save,
  Scale,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { premiumToast } from '@/lib/premium-toast'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://nyaymitra-backend-production.up.railway.app'

const BUSINESS_PROFILE_API = `${API_URL}/api/v1/business/me`
const UPDATE_BUSINESS_PROFILE_API = `${API_URL}/api/v1/business/profile`

interface PrimaryContact {
  fullName: string
  designation: string
  email: string
  phone: string
}

interface CurrentSetup {
  hasCA: boolean
  hasLawyer: boolean
  hasCS: boolean
}

interface Address {
  street: string
  city: string
  state: string
  country: string
  pincode: string
}

interface BusinessProfile {
  _id?: string
  owner?: string

  companyName: string
  legalName: string
  companyType: string
  industry: string
  teamSize: string

  registrationStatus: string
  CIN: string
  GSTIN: string
  PAN: string
  TAN: string

  website: string
  email: string
  phone: string

  businessNeeds: string[]

  currentSetup: CurrentSetup

  primaryContact: PrimaryContact

  logo: string
  description: string
  employeeCount: number | string
  foundedYear: number | string

  address: Address

  legalHealthScore: number
  status: string
  workspaceStatus?: string

  subscription?: {
    plan: string
    status: string
    startDate?: string
    endDate?: string
  }
}

const initialProfile: BusinessProfile = {
  companyName: '',
  legalName: '',
  companyType: '',
  industry: '',
  teamSize: '',

  registrationStatus: '',
  CIN: '',
  GSTIN: '',
  PAN: '',
  TAN: '',

  website: '',
  email: '',
  phone: '',

  businessNeeds: [],

  currentSetup: {
    hasCA: false,
    hasLawyer: false,
    hasCS: false,
  },

  primaryContact: {
    fullName: '',
    designation: '',
    email: '',
    phone: '',
  },

  logo: '',
  description: '',
  employeeCount: '',
  foundedYear: '',

  address: {
    street: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  },

  legalHealthScore: 0,
  status: 'Active',
  workspaceStatus: 'Active',
}

const companyTypes = [
  'Private Limited',
  'LLP',
  'Partnership',
  'Proprietorship',
  'OPC',
  'Public Limited',
  'Other',
]

const teamSizes = [
  '1–10 (Micro)',
  '11–50 (Small)',
  '51–200 (Mid-size)',
  '201–500',
  '500+ (Enterprise)',
]

const businessNeeds = [
  'Compliance Management',
  'Contract Management',
  'Documentation Support',
  'Investor Readiness',
  'Vendor Agreements',
  'Employment Documentation',
  'Legal Desk Retainer',
]

export function ProfileSettings() {
  const [profile, setProfile] =
    useState<BusinessProfile>(initialProfile)

  const [originalProfile, setOriginalProfile] =
    useState<BusinessProfile>(initialProfile)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // ------------------------------------------------------------
  // AUTH TOKEN
  // ------------------------------------------------------------

  const getToken = () => {
    if (typeof window === 'undefined') return ''

    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      ''
    )
  }

  // ------------------------------------------------------------
  // NORMALIZE API DATA
  // ------------------------------------------------------------

  const normalizeProfile = (data: any): BusinessProfile => {
    return {
      ...initialProfile,

      ...data,

      companyName: data?.companyName || '',
      legalName: data?.legalName || '',
      companyType: data?.companyType || '',
      industry: data?.industry || '',
      teamSize: data?.teamSize || '',

      registrationStatus: data?.registrationStatus || '',
      CIN: data?.CIN || '',
      GSTIN: data?.GSTIN || '',
      PAN: data?.PAN || '',
      TAN: data?.TAN || '',

      website: data?.website || '',
      email: data?.email || '',
      phone: data?.phone || '',

      businessNeeds: Array.isArray(data?.businessNeeds)
        ? data.businessNeeds
        : [],

      currentSetup: {
        hasCA: Boolean(data?.currentSetup?.hasCA),
        hasLawyer: Boolean(data?.currentSetup?.hasLawyer),
        hasCS: Boolean(data?.currentSetup?.hasCS),
      },

      primaryContact: {
        fullName: data?.primaryContact?.fullName || '',
        designation: data?.primaryContact?.designation || '',
        email: data?.primaryContact?.email || '',
        phone: data?.primaryContact?.phone || '',
      },

      logo: data?.logo || '',
      description: data?.description || '',

      employeeCount:
        data?.employeeCount !== undefined &&
          data?.employeeCount !== null
          ? data.employeeCount
          : '',

      foundedYear:
        data?.foundedYear !== undefined &&
          data?.foundedYear !== null
          ? data.foundedYear
          : '',

      address: {
        street: data?.address?.street || '',
        city: data?.address?.city || '',
        state: data?.address?.state || '',
        country: data?.address?.country || 'India',
        pincode: data?.address?.pincode || '',
      },

      legalHealthScore: Number(data?.legalHealthScore || 0),
      status: data?.status || 'Active',
      workspaceStatus: data?.workspaceStatus || 'Active',

      subscription: data?.subscription
        ? {
          plan: data.subscription.plan || '',
          status: data.subscription.status || '',
          startDate: data.subscription.startDate,
          endDate: data.subscription.endDate,
        }
        : undefined,
    }
  }

  // ------------------------------------------------------------
  // FETCH PROFILE
  // ------------------------------------------------------------

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const token = getToken()

      const response = await fetch(BUSINESS_PROFILE_API, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token
            ? {
              Authorization: `Bearer ${token}`,
            }
            : {}),
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to fetch business profile'
        )
      }

      const data = result.data || result.business || result

      const normalized = normalizeProfile(data)

      setProfile(normalized)
      setOriginalProfile(normalized)
    } catch (error: any) {
      console.error('Fetch business profile error:', error)

      const message =
        error?.message || 'Unable to load business profile.'

      setErrorMessage(message)

      // ===== ERROR TOAST =====
      premiumToast.error('Could not load profile', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // ------------------------------------------------------------
  // UPDATE HELPERS
  // ------------------------------------------------------------

  const updateField = (
    field: keyof BusinessProfile,
    value: any
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updatePrimaryContact = (
    field: keyof PrimaryContact,
    value: string
  ) => {
    setProfile((prev) => ({
      ...prev,
      primaryContact: {
        ...prev.primaryContact,
        [field]: value,
      },
    }))
  }

  const updateCurrentSetup = (
    field: keyof CurrentSetup,
    value: boolean
  ) => {
    setProfile((prev) => ({
      ...prev,
      currentSetup: {
        ...prev.currentSetup,
        [field]: value,
      },
    }))
  }

  const updateAddress = (
    field: keyof Address,
    value: string
  ) => {
    setProfile((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }))
  }

  const toggleBusinessNeed = (need: string) => {
    setProfile((prev) => {
      const exists = prev.businessNeeds.includes(need)

      return {
        ...prev,
        businessNeeds: exists
          ? prev.businessNeeds.filter((item) => item !== need)
          : [...prev.businessNeeds, need],
      }
    })
  }

  // ------------------------------------------------------------
  // EDIT MODE
  // ------------------------------------------------------------

  const handleEdit = () => {
    setSuccessMessage('')
    setErrorMessage('')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setProfile(originalProfile)
    setSuccessMessage('')
    setErrorMessage('')
    setIsEditing(false)
  }

  // ------------------------------------------------------------
  // SAVE PROFILE
  // ------------------------------------------------------------

  const handleSave = async () => {
    try {
      setSaving(true)
      setSuccessMessage('')
      setErrorMessage('')

      const token = getToken()

      const payload = {
        companyName: profile.companyName,
        legalName: profile.legalName,
        companyType: profile.companyType,
        industry: profile.industry,
        teamSize: profile.teamSize,

        registrationStatus: profile.registrationStatus,
        CIN: profile.CIN,
        GSTIN: profile.GSTIN,
        PAN: profile.PAN,
        TAN: profile.TAN,

        website: profile.website,
        email: profile.email,
        phone: profile.phone,

        businessNeeds: profile.businessNeeds,

        currentSetup: profile.currentSetup,

        primaryContact: profile.primaryContact,

        description: profile.description,
        employeeCount:
          profile.employeeCount === ''
            ? undefined
            : Number(profile.employeeCount),

        foundedYear:
          profile.foundedYear === ''
            ? undefined
            : Number(profile.foundedYear),

        address: profile.address,

        logo: profile.logo,
      }

      const response = await fetch(
        UPDATE_BUSINESS_PROFILE_API,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token
              ? {
                Authorization: `Bearer ${token}`,
              }
              : {}),
          },
          body: JSON.stringify(payload),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to update business profile'
        )
      }

      const updatedData =
        result.data || result.business || profile

      const normalized = normalizeProfile(updatedData)

      setProfile(normalized)
      setOriginalProfile(normalized)

      setIsEditing(false)

      setSuccessMessage(
        'Business profile updated successfully.'
      )

      // ===== SUCCESS TOAST =====
      premiumToast.success('Profile updated', {
        description:
          normalized.companyName
            ? `Changes saved to ${normalized.companyName}.`
            : 'Your business profile has been saved.',
      })

      window.setTimeout(() => {
        setSuccessMessage('')
      }, 4000)
    } catch (error: any) {
      console.error('Update business profile error:', error)

      const message =
        error?.message ||
        'Failed to update business profile.'

      setErrorMessage(message)

      // ===== ERROR TOAST =====
      premiumToast.error('Save failed', {
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />

          <p className="text-sm text-slate-400">
            Loading business profile...
          </p>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <div className="min-h-full bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">

        {/* -------------------------------------------------- */}
        {/* HEADER */}
        {/* -------------------------------------------------- */}

        <div className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            {/* LOGO */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800">

              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={profile.companyName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7 text-amber-400" />
              )}

            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-xl font-semibold text-white md:text-2xl">
                  {profile.companyName || 'Business Profile'}
                </h1>

                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  {profile.status || 'Active'}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-400">
                {profile.legalName || 'Business information and legal details'}
              </p>

              {profile.subscription?.plan && (
                <div className="mt-2 text-xs text-slate-500">
                  {profile.subscription.plan} Plan
                </div>
              )}
            </div>

          </div>

          {/* HEADER ACTIONS */}

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving ? 'Saving...' : 'Save Changes'}
              </button>

            </div>
          )}

        </div>

        {/* -------------------------------------------------- */}
        {/* SUCCESS */}
        {/* -------------------------------------------------- */}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {successMessage}
          </motion.div>
        )}

        {/* -------------------------------------------------- */}
        {/* ERROR */}
        {/* -------------------------------------------------- */}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-medium">
                Something went wrong
              </p>

              <p className="mt-1 text-red-300/80">
                {errorMessage}
              </p>
            </div>
          </motion.div>
        )}

        {/* -------------------------------------------------- */}
        {/* EDIT MODE NOTICE */}
        {/* -------------------------------------------------- */}

        {isEditing && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            You are editing your business profile. Make your
            changes and click <strong>Save Changes</strong> when
            finished.
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* COMPANY INFORMATION */}
        {/* -------------------------------------------------- */}

        <Section title="Company Information" icon={<Building2 />}>
          <div className="grid gap-5 md:grid-cols-2">

            <Input
              label="Company Name"
              value={profile.companyName}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('companyName', e.target.value)
              }
            />

            <Input
              label="Legal Name"
              value={profile.legalName}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('legalName', e.target.value)
              }
            />

            <Select
              label="Company Type"
              value={profile.companyType}
              disabled={!isEditing}
              options={companyTypes}
              onChange={(e) =>
                updateField('companyType', e.target.value)
              }
            />

            <Input
              label="Industry"
              value={profile.industry}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('industry', e.target.value)
              }
            />

            <Select
              label="Team Size"
              value={profile.teamSize}
              disabled={!isEditing}
              options={teamSizes}
              onChange={(e) =>
                updateField('teamSize', e.target.value)
              }
            />

            <Input
              label="Employee Count"
              type="number"
              value={String(profile.employeeCount)}
              disabled={!isEditing}
              onChange={(e) =>
                updateField(
                  'employeeCount',
                  e.target.value
                )
              }
            />

            <Input
              label="Founded Year"
              type="number"
              value={String(profile.foundedYear)}
              disabled={!isEditing}
              onChange={(e) =>
                updateField(
                  'foundedYear',
                  e.target.value
                )
              }
            />

            <Input
              label="Website"
              value={profile.website}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('website', e.target.value)
              }
              icon={<Globe className="h-4 w-4" />}
            />

          </div>

          <div className="mt-5">
            <TextArea
              label="Business Description"
              value={profile.description}
              disabled={!isEditing}
              onChange={(e) =>
                updateField(
                  'description',
                  e.target.value
                )
              }
              rows={4}
            />
          </div>
        </Section>

        {/* -------------------------------------------------- */}
        {/* BUSINESS CONTACT */}
        {/* -------------------------------------------------- */}

        <Section title="Business Contact" icon={<BriefcaseBusiness />}>

          <div className="grid gap-5 md:grid-cols-2">

            <Input
              label="Business Email"
              type="email"
              value={profile.email}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('email', e.target.value)
              }
              icon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Business Phone"
              value={profile.phone}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('phone', e.target.value)
              }
              icon={<Phone className="h-4 w-4" />}
            />

          </div>

        </Section>

        {/* -------------------------------------------------- */}
        {/* REGISTRATION & COMPLIANCE */}
        {/* -------------------------------------------------- */}

        <Section
          title="Registration & Compliance"
          icon={<ShieldCheck />}
        >

          <div className="grid gap-5 md:grid-cols-2">

            <Select
              label="Registration Status"
              value={profile.registrationStatus}
              disabled={!isEditing}
              options={['Registered', 'Unregistered']}
              onChange={(e) =>
                updateField(
                  'registrationStatus',
                  e.target.value
                )
              }
            />

            <Input
              label="CIN"
              value={profile.CIN}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('CIN', e.target.value)
              }
            />

            <Input
              label="GSTIN"
              value={profile.GSTIN}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('GSTIN', e.target.value)
              }
            />

            <Input
              label="PAN"
              value={profile.PAN}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('PAN', e.target.value)
              }
            />

            <Input
              label="TAN"
              value={profile.TAN}
              disabled={!isEditing}
              onChange={(e) =>
                updateField('TAN', e.target.value)
              }
            />

          </div>

        </Section>

        {/* -------------------------------------------------- */}
        {/* PRIMARY CONTACT */}
        {/* -------------------------------------------------- */}

        <Section
          title="Primary Contact"
          icon={<UserRound />}
        >

          <div className="grid gap-5 md:grid-cols-2">

            <Input
              label="Full Name"
              value={profile.primaryContact.fullName}
              disabled={!isEditing}
              onChange={(e) =>
                updatePrimaryContact(
                  'fullName',
                  e.target.value
                )
              }
            />

            <Input
              label="Designation"
              value={profile.primaryContact.designation}
              disabled={!isEditing}
              onChange={(e) =>
                updatePrimaryContact(
                  'designation',
                  e.target.value
                )
              }
            />

            <Input
              label="Email"
              type="email"
              value={profile.primaryContact.email}
              disabled={!isEditing}
              onChange={(e) =>
                updatePrimaryContact(
                  'email',
                  e.target.value
                )
              }
            />

            <Input
              label="Phone"
              value={profile.primaryContact.phone}
              disabled={!isEditing}
              onChange={(e) =>
                updatePrimaryContact(
                  'phone',
                  e.target.value
                )
              }
            />

          </div>

        </Section>

        {/* -------------------------------------------------- */}
        {/* CURRENT LEGAL SETUP */}
        {/* -------------------------------------------------- */}

        <Section
          title="Current Legal Setup"
          icon={<Scale />}
        >

          <div className="grid gap-4 md:grid-cols-3">

            <LegalCard
              title="Chartered Accountant"
              description="CA currently supporting the business"
              active={profile.currentSetup.hasCA}
              disabled={!isEditing}
              onClick={() =>
                updateCurrentSetup(
                  'hasCA',
                  !profile.currentSetup.hasCA
                )
              }
            />

            <LegalCard
              title="Lawyer"
              description="Lawyer currently supporting the business"
              active={profile.currentSetup.hasLawyer}
              disabled={!isEditing}
              onClick={() =>
                updateCurrentSetup(
                  'hasLawyer',
                  !profile.currentSetup.hasLawyer
                )
              }
            />

            <LegalCard
              title="Company Secretary"
              description="CS currently supporting the business"
              active={profile.currentSetup.hasCS}
              disabled={!isEditing}
              onClick={() =>
                updateCurrentSetup(
                  'hasCS',
                  !profile.currentSetup.hasCS
                )
              }
            />

          </div>

        </Section>

        {/* -------------------------------------------------- */}
        {/* BUSINESS NEEDS */}
        {/* -------------------------------------------------- */}

        <Section
          title="Business Legal Needs"
          icon={<FileText />}
        >

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {businessNeeds.map((need) => {
              const selected =
                profile.businessNeeds.includes(need)

              return (
                <button
                  key={need}
                  type="button"
                  disabled={!isEditing}
                  onClick={() =>
                    toggleBusinessNeed(need)
                  }
                  className={`rounded-xl border p-4 text-left transition ${selected
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900'
                    } ${!isEditing
                      ? 'cursor-not-allowed opacity-70'
                      : 'hover:border-slate-600'
                    }`}
                >

                  <div className="flex items-center justify-between gap-3">

                    <span className="text-sm font-medium text-slate-200">
                      {need}
                    </span>

                    {selected && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-400" />
                    )}

                  </div>

                </button>
              )
            })}

          </div>

        </Section>

        {/* -------------------------------------------------- */}
        {/* ADDRESS */}
        {/* -------------------------------------------------- */}

        <Section
          title="Registered Address"
          icon={<MapPin />}
        >

          <div className="grid gap-5 md:grid-cols-2">

            <div className="md:col-span-2">
              <Input
                label="Street Address"
                value={profile.address.street}
                disabled={!isEditing}
                onChange={(e) =>
                  updateAddress(
                    'street',
                    e.target.value
                  )
                }
              />
            </div>

            <Input
              label="City"
              value={profile.address.city}
              disabled={!isEditing}
              onChange={(e) =>
                updateAddress(
                  'city',
                  e.target.value
                )
              }
            />

            <Input
              label="State"
              value={profile.address.state}
              disabled={!isEditing}
              onChange={(e) =>
                updateAddress(
                  'state',
                  e.target.value
                )
              }
            />

            <Input
              label="Country"
              value={profile.address.country}
              disabled={!isEditing}
              onChange={(e) =>
                updateAddress(
                  'country',
                  e.target.value
                )
              }
            />

            <Input
              label="Pincode"
              value={profile.address.pincode}
              disabled={!isEditing}
              onChange={(e) =>
                updateAddress(
                  'pincode',
                  e.target.value
                )
              }
            />

          </div>

        </Section>

        {/* -------------------------------------------------- */}
        {/* LEGAL HEALTH */}
        {/* -------------------------------------------------- */}

        <Section
          title="Legal Health"
          icon={<Scale />}
        >

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-sm font-medium text-slate-300">
                  Legal Health Score
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Current assessment of your business legal readiness.
                </p>

              </div>

              <div className="text-3xl font-bold text-amber-400">
                {profile.legalHealthScore}
                <span className="text-base font-medium text-slate-500">
                  /100
                </span>
              </div>

            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">

              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: `${Math.min(
                    Math.max(profile.legalHealthScore, 0),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        </Section>

        {/* -------------------------------------------------- */}
        {/* BOTTOM ACTION BAR */}
        {/* -------------------------------------------------- */}

        {isEditing && (
          <div className="sticky bottom-4 z-20 rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-white">
                  Unsaved changes
                </p>

                <p className="text-xs text-slate-500">
                  Save your changes or cancel to restore the
                  previous information.
                </p>
              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >

                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {saving ? 'Saving...' : 'Save Changes'}

                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}

// ============================================================
// SECTION
// ============================================================

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg md:p-6"
    >

      <div className="mb-6 flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
          {icon}
        </div>

        <h2 className="text-base font-semibold text-white md:text-lg">
          {title}
        </h2>

      </div>

      {children}

    </motion.section>
  )
}

// ============================================================
// INPUT
// ============================================================

function Input({
  label,
  value,
  onChange,
  disabled = false,
  type = 'text',
  icon,
}: {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  type?: string
  icon?: ReactNode
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="relative">

        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-400 disabled:opacity-80 ${icon ? 'pl-10' : ''
            }`}
        />

      </div>

    </div>
  )
}

// ============================================================
// SELECT
// ============================================================

function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  disabled?: boolean
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-400 disabled:opacity-80"
      >

        <option value="">
          Select {label}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </div>
  )
}

// ============================================================
// TEXTAREA
// ============================================================

function TextArea({
  label,
  value,
  onChange,
  disabled = false,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  rows?: number
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-400 disabled:opacity-80"
      />

    </div>
  )
}

// ============================================================
// LEGAL CARD
// ============================================================

function LegalCard({
  title,
  description,
  active,
  disabled,
  onClick,
}: {
  title: string
  description: string
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${active
        ? 'border-amber-500/50 bg-amber-500/10'
        : 'border-slate-800 bg-slate-950'
        } ${disabled
          ? 'cursor-not-allowed opacity-70'
          : 'hover:border-slate-600'
        }`}
    >

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-sm font-semibold text-white">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>

        </div>

        <div
          className={`mt-1 h-5 w-5 rounded-full border ${active
            ? 'border-amber-400 bg-amber-400'
            : 'border-slate-600 bg-transparent'
            }`}
        />

      </div>

    </button>
  )
}