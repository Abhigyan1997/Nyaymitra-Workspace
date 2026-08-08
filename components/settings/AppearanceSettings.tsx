'use client'

import { motion } from 'framer-motion'

export function AppearanceSettings() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Theme Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="font-semibold text-foreground mb-6">Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Light', value: 'light' },
            { name: 'Dark', value: 'dark' },
            { name: 'System', value: 'system' },
          ].map((theme) => (
            <motion.label
              key={theme.value}
              whileHover={{ scale: 1.02 }}
              className="relative cursor-pointer"
            >
              <input
                type="radio"
                name="theme"
                defaultChecked={theme.value === 'dark'}
                className="sr-only"
              />
              <div className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <p className="font-medium text-foreground">{theme.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Use {theme.name} theme</p>
              </div>
            </motion.label>
          ))}
        </div>
      </motion.div>

      {/* Accent Color */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="font-semibold text-foreground mb-6">Accent Color</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { name: 'Amber', color: 'bg-amber-500' },
            { name: 'Blue', color: 'bg-blue-500' },
            { name: 'Green', color: 'bg-green-500' },
            { name: 'Purple', color: 'bg-purple-500' },
            { name: 'Pink', color: 'bg-pink-500' },
            { name: 'Orange', color: 'bg-orange-500' },
          ].map((accent) => (
            <motion.button
              key={accent.name}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full aspect-square rounded-lg ${accent.color} border-2 border-transparent hover:border-foreground/20 transition-all`}
              title={accent.name}
            />
          ))}
        </div>
      </motion.div>

      {/* Density */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="font-semibold text-foreground mb-6">Display Density</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Compact', value: 'compact' },
            { name: 'Comfortable', value: 'comfortable' },
            { name: 'Spacious', value: 'spacious' },
          ].map((density) => (
            <motion.label
              key={density.value}
              whileHover={{ scale: 1.02 }}
              className="relative cursor-pointer"
            >
              <input
                type="radio"
                name="density"
                defaultChecked={density.value === 'comfortable'}
                className="sr-only"
              />
              <div className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <p className="font-medium text-foreground">{density.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{density.value === 'compact' ? 'Reduced spacing' : density.value === 'comfortable' ? 'Balanced spacing' : 'Extra spacing'}</p>
              </div>
            </motion.label>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Save Preferences
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-card border border-border text-foreground px-6 py-2 rounded-lg font-medium hover:bg-background transition-colors"
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
