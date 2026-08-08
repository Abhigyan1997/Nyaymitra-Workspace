'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { OrganizationSettings } from '@/components/settings/OrganizationSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { AppearanceSettings } from '@/components/settings/AppearanceSettings'
import { BillingSettings } from '@/components/settings/BillingSettings'

type SettingsTab = 'profile' | 'organization' | 'security' | 'notifications' | 'appearance' | 'billing'

const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'organization', label: 'Organization', icon: '🏢' },
  { id: 'workspace', label: 'Workspace', icon: '⚙️' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'billing', label: 'Billing', icon: '💳' },
  { id: 'api', label: 'API Keys', icon: '🔑' },
  { id: 'integrations', label: 'Integrations', icon: '🔗' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-64 bg-card border-r border-border p-6 hidden lg:block sticky top-0 h-screen overflow-y-auto"
      >
        <h2 className="text-lg font-bold text-foreground mb-6">Settings</h2>
        <nav className="space-y-1">
          {settingsTabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ x: 5 }}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-background'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </div>
              {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          ))}
        </nav>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 p-6 overflow-y-auto max-w-4xl"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'organization' && <OrganizationSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'appearance' && <AppearanceSettings />}
        {activeTab === 'billing' && <BillingSettings />}
        
        {/* Coming Soon Sections */}
        {(activeTab === 'workspace' || activeTab === 'api' || activeTab === 'integrations') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-xl p-12 text-center"
          >
            <p className="text-foreground font-semibold mb-2">Coming Soon</p>
            <p className="text-muted-foreground">This section is coming in a future update</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
