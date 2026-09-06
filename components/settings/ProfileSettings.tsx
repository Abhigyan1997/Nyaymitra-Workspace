'use client'

import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useState, useEffect } from 'react'

interface User {
  id: string
  fullName: string
  email: string
  role: string
  userId: string
  phone: string
  profilePhoto?: string
}

export function ProfileSettings() {
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setFormData({
          fullName: parsedUser.fullName || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
          role: parsedUser.role || 'business',
        })
      } catch (error) {
        console.error('Failed to parse user:', error)
      }
    }
    setIsLoading(false)
  }, [])

  const getUserInitials = () => {
    if (!formData.fullName) return 'JD'
    const names = formData.fullName.split(' ')
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'lawyer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'business':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrator'
      case 'lawyer':
        return 'Lawyer'
      case 'business':
        return 'Business'
      default:
        return role || 'User'
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    setIsSaving(true)
    setSaveStatus('idle')

    // Simulate API call
    setTimeout(() => {
      try {
        // Update user in localStorage
        const updatedUser: User = {
          id: user?.id || '',
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          userId: user?.userId || '',
          profilePhoto: user?.profilePhoto,
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setSaveStatus('success')

        // Reset status after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      } catch (error) {
        console.error('Failed to save user:', error)
        setSaveStatus('error')
        setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      }
      setIsSaving(false)
    }, 1000)
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'business',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
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
      {/* Profile Picture */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
      >
        <h3 className="font-semibold text-white mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={formData.fullName}
                className="w-20 h-20 rounded-xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                {getUserInitials()}
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Change Avatar
          </motion.button>
        </div>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
      >
        <h3 className="font-semibold text-white mb-6">Personal Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
              <div className="relative">
                <div className={`px-4 py-2 rounded-lg border ${getRoleBadgeColor(formData.role)} bg-opacity-10 flex items-center gap-2`}>
                  <span className="text-sm font-medium">
                    {getRoleDisplayName(formData.role)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 uppercase">
                    {formData.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Role is assigned by the system and cannot be changed</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">User ID</label>
            <input
              type="text"
              value={user?.userId || user?.id || ''}
              disabled
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/5 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className={`bg-amber-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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

        {/* Status Messages */}
        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-400 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20"
          >
            <span className="text-sm">✓ Profile updated successfully!</span>
          </motion.div>
        )}

        {saveStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-red-400 px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20"
          >
            <span className="text-sm">✗ Failed to update profile. Please try again.</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}