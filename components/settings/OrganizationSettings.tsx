'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Loader, AlertTriangle } from 'lucide-react'

interface BusinessSettings {
  companyName: string
  legalName: string
  email: string
  phone: string
  website: string
  address: {
    street: string
    city: string
    state: string
    country: string
    pincode: string
  }
  gstNumber: string
  panNumber: string
  timezone: string
  currency: string
}

export function OrganizationSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    legalName: '',
    email: '',
    phone: '',
    website: '',
    street: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    timezone: 'IST (UTC+5:30)',
    currency: 'INR (₹)',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('userToken')

      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          if (user.token) return user.token
          if (user.accessToken) return user.accessToken
        }
      } catch (e) {
        // Ignore
      }
      return token || null
    }
    return null
  }

  // Fetch business settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      setError('')

      try {
        const token = getAuthToken()
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'

        const response = await fetch(`${API_BASE_URL}/business/settings`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            // No business found, use default empty state
            setSettings(null)
            setIsLoading(false)
            return
          }
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch business settings')
        }

        const result = await response.json()
        const data = result.data

        setSettings(data)
        setFormData({
          companyName: data.companyName || '',
          legalName: data.legalName || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          street: data.address?.street || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          country: data.address?.country || '',
          pincode: data.address?.pincode || '',
          gstNumber: data.gstNumber || '',
          panNumber: data.panNumber || '',
          timezone: data.timezone || 'IST (UTC+5:30)',
          currency: data.currency || 'INR (₹)',
        })
      } catch (err: any) {
        console.error('Failed to fetch business settings:', err)
        setError(err.message || 'Failed to load business data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    setError('')

    try {
      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'

      const payload = {
        companyName: formData.companyName,
        legalName: formData.legalName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode
        },
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        timezone: formData.timezone,
        currency: formData.currency
      }

      const response = await fetch(`${API_BASE_URL}/business/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update business settings')
      }

      const result = await response.json()
      setSettings(result.data)
      setSaveStatus('success')

      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (err: any) {
      console.error('Failed to save business settings:', err)
      setError(err.message || 'Failed to update business data')
      setSaveStatus('error')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || '',
        legalName: settings.legalName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        website: settings.website || '',
        street: settings.address?.street || '',
        city: settings.address?.city || '',
        state: settings.address?.state || '',
        country: settings.address?.country || '',
        pincode: settings.address?.pincode || '',
        gstNumber: settings.gstNumber || '',
        panNumber: settings.panNumber || '',
        timezone: settings.timezone || 'IST (UTC+5:30)',
        currency: settings.currency || 'INR (₹)',
      })
    }
  }

  const timezones = [
    'IST (UTC+5:30)',
    'EST (UTC-5:00)',
    'CST (UTC-6:00)',
    'MST (UTC-7:00)',
    'PST (UTC-8:00)',
    'GMT (UTC+0:00)',
    'CET (UTC+1:00)',
    'EET (UTC+2:00)',
    'MSK (UTC+3:00)',
    'GST (UTC+4:00)',
    'PKT (UTC+5:00)',
    'NPT (UTC+5:45)',
    'BTT (UTC+6:00)',
    'ICT (UTC+7:00)',
    'SGT (UTC+8:00)',
    'JST (UTC+9:00)',
    'AEST (UTC+10:00)',
  ]

  const currencies = [
    'INR (₹)',
    'USD ($)',
    'EUR (€)',
    'GBP (£)',
    'JPY (¥)',
    'CAD (C$)',
    'AUD (A$)',
    'SGD (S$)',
    'AED (د.إ)',
    'SAR (ر.س)',
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading organization data...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
      >
        <h3 className="font-semibold text-white mb-6">Organization Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Legal Name</label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter legal name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter business email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Website</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
              placeholder="Enter website URL"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter GST number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">PAN Number</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter PAN number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500 mb-2"
              placeholder="Street address"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="City"
              />
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="State"
              />
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Country"
              />
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Pincode"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          className="bg-slate-800 border border-white/10 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors"
        >
          Cancel
        </motion.button>

        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-400 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20"
          >
            <span className="text-sm">✓ Organization updated successfully!</span>
          </motion.div>
        )}

        {saveStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-red-400 px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20"
          >
            <span className="text-sm">✗ Failed to update organization.</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}