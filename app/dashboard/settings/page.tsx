'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Menu, X } from 'lucide-react'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { OrganizationSettings } from '@/components/settings/OrganizationSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { BillingSettings } from '@/components/settings/BillingSettings'
import { ApiKeysSettings } from '@/components/settings/ApiKeysSettings'

type SettingsTab = 'profile' | 'organization' | 'security' | 'notifications' | 'billing' | 'api'

const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'organization', label: 'Organization', icon: '🏢' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'billing', label: 'Billing', icon: '💳' },
  { id: 'api', label: 'API Keys', icon: '🔑' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when tab is selected
  const handleTabSelect = (tabId: SettingsTab) => {
    setActiveTab(tabId)
    setIsMobileMenuOpen(false)
  }

  // Get current tab label for mobile header
  const getCurrentTabLabel = () => {
    const tab = settingsTabs.find(t => t.id === activeTab)
    return tab ? tab.label : 'Settings'
  }

  const getCurrentTabIcon = () => {
    const tab = settingsTabs.find(t => t.id === activeTab)
    return tab ? tab.icon : '⚙️'
  }

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">
      {/* Mobile Header with Dropdown */}
      <div className="lg:hidden sticky top-0 z-30 bg-slate-950 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Settings</h1>
            <p className="text-xs text-gray-400">Manage your preferences</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-white hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40"
            >
              <div className="p-2 max-h-[70vh] overflow-y-auto">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSelect(tab.id as SettingsTab)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-gray-300 hover:bg-slate-900/50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tab.icon}</span>
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-amber-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Tab Indicator */}
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="text-2xl">{getCurrentTabIcon()}</span>
          <span className="text-sm font-medium text-white">{getCurrentTabLabel()}</span>
          <span className="text-xs text-gray-500 ml-auto">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </span>
        </div>
      </div>

      {/* Sidebar Navigation - Desktop */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:block w-64 bg-slate-900/50 border-r border-white/10 p-6 sticky top-0 h-screen overflow-y-auto flex-shrink-0"
      >
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Cormorant Garamond' }}>
            Settings
          </h2>
          <p className="text-xs text-gray-400 mt-1">Manage your preferences</p>
        </div>
        <nav className="space-y-1">
          {settingsTabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </div>
              {activeTab === tab.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </nav>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-4xl mx-auto w-full"
      >
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8">
          <h1 className="text-3xl font-light tracking-tight text-white" style={{ fontFamily: 'Cormorant Garamond' }}>
            Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage your account and application preferences</p>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'organization' && <OrganizationSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'billing' && <BillingSettings />}
            {activeTab === 'api' && <ApiKeysSettings />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}