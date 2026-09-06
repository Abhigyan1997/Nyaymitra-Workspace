'use client'

import { motion } from 'framer-motion'
import { Lock, Shield, CheckCircle, Loader, AlertTriangle, LogOut, Smartphone, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect, useCallback, memo } from 'react'

interface Session {
  _id: string
  ip: string
  userAgent: string
  loginAt: string
  isCurrent: boolean
  deviceName: string
  lastActive: string
}

interface SecuritySettingsData {
  twoFactorEnabled: boolean
  emailVerified: boolean
  phoneVerified: boolean
  lastLoginAt: string | null
  totalSessions: number
}

// Memoized Password Input component to prevent re-renders
const PasswordInput = memo(({
  label,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggleVisibility,
  required = true,
  minLength,
  name
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  showPassword: boolean
  onToggleVisibility: () => void
  required?: boolean
  minLength?: number
  name: string
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2 pr-12 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
})

PasswordInput.displayName = 'PasswordInput'

export function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [settings, setSettings] = useState<SecuritySettingsData | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Two-factor state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [toggling2FA, setToggling2FA] = useState(false)

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

  // Fetch security data
  useEffect(() => {
    const fetchSecurityData = async () => {
      setIsLoading(true)
      setError('')

      try {
        const token = getAuthToken()
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'

        const [sessionsRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/security/sessions`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          }),
          fetch(`${API_BASE_URL}/security/settings`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          })
        ])

        if (!sessionsRes.ok) {
          const errorData = await sessionsRes.json()
          throw new Error(errorData.message || 'Failed to fetch sessions')
        }

        if (!settingsRes.ok) {
          const errorData = await settingsRes.json()
          throw new Error(errorData.message || 'Failed to fetch settings')
        }

        const sessionsResult = await sessionsRes.json()
        const settingsResult = await settingsRes.json()

        setSessions(sessionsResult.data || [])
        setSettings(settingsResult.data)
        setTwoFactorEnabled(settingsResult.data?.twoFactorEnabled || false)
      } catch (err: any) {
        console.error('Failed to fetch security data:', err)
        setError(err.message || 'Failed to load security data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSecurityData()
  }, [])

  // Memoized password change handlers
  const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))
  }, [])

  const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))
  }, [])

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))
  }, [])

  // Toggle visibility handlers
  const toggleCurrentPasswordVisibility = useCallback(() => {
    setShowCurrentPassword(prev => !prev)
  }, [])

  const toggleNewPasswordVisibility = useCallback(() => {
    setShowNewPassword(prev => !prev)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev)
  }, [])

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setIsSaving(true)

    try {
      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'

      const response = await fetch(`${API_BASE_URL}/security/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(passwordData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to change password')
      }

      setPasswordSuccess('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle two-factor toggle
  const handleToggle2FA = async () => {
    setToggling2FA(true)
    try {
      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'

      const response = await fetch(`${API_BASE_URL}/security/two-factor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ enable: !twoFactorEnabled }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update 2FA')
      }

      setTwoFactorEnabled(!twoFactorEnabled)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update two-factor authentication')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setToggling2FA(false)
    }
  }

  // Handle revoke session
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to sign out this session?')) return

    try {
      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'

      const response = await fetch(`${API_BASE_URL}/security/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to revoke session')
      }

      setSessions(prev => prev.filter(s => s._id !== sessionId))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to revoke session')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  // Handle revoke all sessions
  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to sign out from all other devices?')) return

    try {
      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nyaymitra-backend-production.up.railway.app/api/v1'

      const response = await fetch(`${API_BASE_URL}/security/sessions/revoke-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to revoke sessions')
      }

      setSessions(prev => prev.filter(s => s.isCurrent))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to revoke sessions')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff} min ago`
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading security settings...</p>
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

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-white">Change Password</h3>
        </div>

        {passwordSuccess && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-200">{passwordSuccess}</p>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-200">{passwordError}</p>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <PasswordInput
            name="currentPassword"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={handleCurrentPasswordChange}
            placeholder="Enter current password"
            showPassword={showCurrentPassword}
            onToggleVisibility={toggleCurrentPasswordVisibility}
          />

          <PasswordInput
            name="newPassword"
            label="New Password"
            value={passwordData.newPassword}
            onChange={handleNewPasswordChange}
            placeholder="Enter new password (min 6 characters)"
            showPassword={showNewPassword}
            onToggleVisibility={toggleNewPasswordVisibility}
            minLength={6}
          />

          <PasswordInput
            name="confirmPassword"
            label="Confirm Password"
            value={passwordData.confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirm new password"
            showPassword={showConfirmPassword}
            onToggleVisibility={toggleConfirmPasswordVisibility}
          />

          <button
            type="submit"
            disabled={isSaving}
            className="bg-amber-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </motion.div>

      {/* Two-Factor Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-white">Two-Factor Authentication</h3>
          </div>
          <button
            onClick={handleToggle2FA}
            disabled={toggling2FA}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${twoFactorEnabled
                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
              }`}
          >
            {toggling2FA ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : twoFactorEnabled ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Enabled
              </>
            ) : (
              'Enable'
            )}
          </button>
        </div>
        <p className="text-sm text-gray-400">
          {twoFactorEnabled
            ? 'Two-factor authentication is enabled. Your account is more secure.'
            : 'Secure your account with two-factor authentication.'}
        </p>
        {twoFactorEnabled && (
          <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400">✓ Your account is protected with 2FA</p>
          </div>
        )}
      </motion.div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-500" />
            Active Sessions ({sessions.length})
          </h3>
          {sessions.filter(s => !s.isCurrent).length > 0 && (
            <button
              onClick={handleRevokeAllSessions}
              className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              Sign out all other devices
            </button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No active sessions found.</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session._id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border ${session.isCurrent
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-slate-900/50 border-white/5'
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{session.deviceName || 'Unknown Device'}</p>
                    {session.isCurrent && (
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">Current</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {session.userAgent || 'Unknown Browser'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                    <span>IP: {session.ip}</span>
                    <span>•</span>
                    <span>Last active: {formatDate(session.lastActive)}</span>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session._id)}
                    className="mt-2 sm:mt-0 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Sign out
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Status Messages */}
      {saveStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-green-400 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Security settings updated successfully!</span>
        </motion.div>
      )}

      {saveStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-red-400 px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Failed to update security settings.</span>
        </motion.div>
      )}
    </motion.div>
  )
}