'use client'

import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { premiumToast } from '@/lib/premium-toast'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://nyaymitra-backend-production.up.railway.app'

const BUSINESS_API = `${API_URL}/api/v1/business/me`
const UPDATE_BUSINESS_API = `${API_URL}/api/v1/business/profile`

interface BusinessProfile {
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

  address: {
    street: string
    city: string
    state: string
    country: string
    pincode: string
  }

  status: string
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

  address: {
    street: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  },

  status: 'Active',
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

export function OrganizationSettings() {
  const [profile, setProfile] =
    useState<BusinessProfile>(initialProfile)

  const [originalProfile, setOriginalProfile] =
    useState<BusinessProfile>(initialProfile)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    if (typeof window === 'undefined') {
      return ''
    }

    const directToken =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('userToken')

    if (directToken) {
      return directToken
    }

    try {
      const userStr = localStorage.getItem('user')

      if (userStr) {
        const user = JSON.parse(userStr)

        return (
          user?.token ||
          user?.accessToken ||
          ''
        )
      }
    } catch (error) {
      console.error('Failed to read user from localStorage:', error)
    }

    return ''
  }

  // ============================================================
  // NORMALIZE DATA
  // ============================================================

  const normalizeProfile = (
    data: any
  ): BusinessProfile => {
    return {
      companyName: data?.companyName || '',
      legalName: data?.legalName || '',
      companyType: data?.companyType || '',
      industry: data?.industry || '',
      teamSize: data?.teamSize || '',

      registrationStatus:
        data?.registrationStatus || '',

      CIN: data?.CIN || '',
      GSTIN: data?.GSTIN || '',
      PAN: data?.PAN || '',
      TAN: data?.TAN || '',

      website: data?.website || '',
      email: data?.email || '',
      phone: data?.phone || '',

      address: {
        street: data?.address?.street || '',
        city: data?.address?.city || '',
        state: data?.address?.state || '',
        country:
          data?.address?.country || 'India',
        pincode: data?.address?.pincode || '',
      },

      status: data?.status || 'Active',
    }
  }

  // ============================================================
  // FETCH BUSINESS
  // ============================================================

  const fetchBusiness = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const token = getToken()

      const response = await fetch(BUSINESS_API, {
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
          result.message ||
          'Failed to load business information.'
        )
      }

      const data =
        result.data ||
        result.business ||
        result

      const normalized =
        normalizeProfile(data)

      setProfile(normalized)
      setOriginalProfile(normalized)
    } catch (error: any) {
      console.error(
        'Failed to fetch business:',
        error
      )

      const message =
        error?.message ||
        'Failed to load business information.'

      setErrorMessage(message)

      // ===== ERROR TOAST =====
      premiumToast.error('Could not load organization', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusiness()
  }, [])

  // ============================================================
  // UPDATE FIELD
  // ============================================================

  const updateField = (
    field: keyof BusinessProfile,
    value: string
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateAddress = (
    field: keyof BusinessProfile['address'],
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

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditing(true)
  }

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = () => {
    setProfile(originalProfile)
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditing(false)
  }

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const token = getToken()

      const payload = {
        companyName: profile.companyName,
        legalName: profile.legalName,
        companyType: profile.companyType,
        industry: profile.industry,
        teamSize: profile.teamSize,

        registrationStatus:
          profile.registrationStatus,

        CIN: profile.CIN,
        GSTIN: profile.GSTIN,
        PAN: profile.PAN,
        TAN: profile.TAN,

        website: profile.website,
        email: profile.email,
        phone: profile.phone,

        address: profile.address,
      }

      const response = await fetch(
        UPDATE_BUSINESS_API,
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
          result.message ||
          'Failed to update business information.'
        )
      }

      const updatedData =
        result.data ||
        result.business ||
        profile

      const normalized =
        normalizeProfile(updatedData)

      setProfile(normalized)
      setOriginalProfile(normalized)

      setIsEditing(false)

      setSuccessMessage(
        'Organization details updated successfully.'
      )

      // ===== SUCCESS TOAST =====
      premiumToast.success('Organization updated', {
        description: normalized.companyName
          ? `Changes saved to ${normalized.companyName}.`
          : 'Your organization details have been saved.',
      })

      setTimeout(() => {
        setSuccessMessage('')
      }, 4000)
    } catch (error: any) {
      console.error(
        'Failed to update organization:',
        error
      )

      const message =
        error?.message ||
        'Failed to update organization.'

      setErrorMessage(message)

      // ===== ERROR TOAST =====
      premiumToast.error('Save failed', {
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />

          <p className="text-sm text-slate-400">
            Loading organization information...
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      >

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700 bg-slate-800">
              <Building2 className="h-7 w-7 text-amber-400" />
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-xl font-semibold text-white">
                  {profile.companyName ||
                    'Organization'}
                </h2>

                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  {profile.status || 'Active'}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-400">
                {profile.legalName ||
                  'Organization information'}
              </p>

            </div>

          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              <Pencil className="h-4 w-4" />
              Edit Organization
            </button>
          ) : (
            <div className="flex gap-3">

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
              >

                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? 'Saving...'
                  : 'Save Changes'}

              </button>

            </div>
          )}

        </div>

      </motion.div>

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

          <div>
            <p className="text-sm font-medium text-red-300">
              Unable to complete request
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {errorMessage}
            </p>
          </div>
        </motion.div>
      )}

      {/* ================================================== */}
      {/* SUCCESS */}
      {/* ================================================== */}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400"
        >
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </motion.div>
      )}

      {/* ================================================== */}
      {/* BASIC ORGANIZATION */}
      {/* ================================================== */}

      <Section
        title="Organization Information"
        icon={<Building2 />}
      >

        <div className="grid gap-5 md:grid-cols-2">

          <Input
            label="Company Name"
            value={profile.companyName}
            disabled={!isEditing}
            onChange={(e) =>
              updateField(
                'companyName',
                e.target.value
              )
            }
          />

          <Input
            label="Legal Name"
            value={profile.legalName}
            disabled={!isEditing}
            onChange={(e) =>
              updateField(
                'legalName',
                e.target.value
              )
            }
          />

          <Select
            label="Company Type"
            value={profile.companyType}
            disabled={!isEditing}
            options={companyTypes}
            onChange={(e) =>
              updateField(
                'companyType',
                e.target.value
              )
            }
          />

          <Input
            label="Industry"
            value={profile.industry}
            disabled={!isEditing}
            onChange={(e) =>
              updateField(
                'industry',
                e.target.value
              )
            }
          />

          <Select
            label="Team Size"
            value={profile.teamSize}
            disabled={!isEditing}
            options={teamSizes}
            onChange={(e) =>
              updateField(
                'teamSize',
                e.target.value
              )
            }
          />

          <Input
            label="Website"
            value={profile.website}
            disabled={!isEditing}
            icon={<Globe className="h-4 w-4" />}
            onChange={(e) =>
              updateField(
                'website',
                e.target.value
              )
            }
          />

        </div>

      </Section>

      {/* ================================================== */}
      {/* BUSINESS CONTACT */}
      {/* ================================================== */}

      <Section
        title="Business Contact"
        icon={<Phone />}
      >

        <div className="grid gap-5 md:grid-cols-2">

          <Input
            label="Business Email"
            type="email"
            value={profile.email}
            disabled={!isEditing}
            icon={<Mail className="h-4 w-4" />}
            onChange={(e) =>
              updateField(
                'email',
                e.target.value
              )
            }
          />

          <Input
            label="Business Phone"
            value={profile.phone}
            disabled={!isEditing}
            icon={<Phone className="h-4 w-4" />}
            onChange={(e) =>
              updateField(
                'phone',
                e.target.value
              )
            }
          />

        </div>

      </Section>

      {/* ================================================== */}
      {/* REGISTRATION */}
      {/* ================================================== */}

      <Section
        title="Registration & Compliance"
        icon={<ShieldCheck />}
      >

        <div className="grid gap-5 md:grid-cols-2">

          <Select
            label="Registration Status"
            value={profile.registrationStatus}
            disabled={!isEditing}
            options={[
              'Registered',
              'Unregistered',
            ]}
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
              updateField(
                'CIN',
                e.target.value
              )
            }
          />

          <Input
            label="GSTIN"
            value={profile.GSTIN}
            disabled={!isEditing}
            onChange={(e) =>
              updateField(
                'GSTIN',
                e.target.value
              )
            }
          />

          <Input
            label="PAN"
            value={profile.PAN}
            disabled={!isEditing}
            onChange={(e) =>
              updateField(
                'PAN',
                e.target.value
              )
            }
          />

          <Input
            label="TAN"
            value={profile.TAN}
            disabled={!isEditing}
            onChange={(e) =>
              updateField(
                'TAN',
                e.target.value
              )
            }
          />

        </div>

      </Section>

      {/* ================================================== */}
      {/* ADDRESS */}
      {/* ================================================== */}

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

      {/* ================================================== */}
      {/* BOTTOM SAVE BAR */}
      {/* ================================================== */}

      {isEditing && (
        <div className="sticky bottom-4 z-20 rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-medium text-white">
                Editing organization details
              </p>

              <p className="text-xs text-slate-500">
                Save your changes when you're finished.
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

                {saving
                  ? 'Saving...'
                  : 'Save Changes'}

              </button>

            </div>

          </div>

        </div>
      )}

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

        <h3 className="text-base font-semibold text-white md:text-lg">
          {title}
        </h3>

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
  disabled,
  type = 'text',
  icon,
}: {
  label: string
  value: string
  onChange: (
    e: ChangeEvent<HTMLInputElement>
  ) => void
  disabled: boolean
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
  disabled,
}: {
  label: string
  value: string
  onChange: (
    e: ChangeEvent<HTMLSelectElement>
  ) => void
  options: string[]
  disabled: boolean
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