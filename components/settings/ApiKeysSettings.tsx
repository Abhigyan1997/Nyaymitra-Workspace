// components/settings/ApiKeysSettings.tsx

'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Key, Copy, Check, Eye, EyeOff, Plus, Trash2, AlertCircle } from 'lucide-react'

interface ApiKey {
    id: string
    name: string
    key: string
    createdAt: string
    lastUsed: string | null
    expiresAt: string | null
    isActive: boolean
}

export function ApiKeysSettings() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        {
            id: '1',
            name: 'Production API Key',
            key: 'nm_live_xxxxxxxxxxxxxxxxxxxx',
            createdAt: '2024-01-15',
            lastUsed: '2024-02-20',
            expiresAt: null,
            isActive: true,
        },
        {
            id: '2',
            name: 'Development API Key',
            key: 'nm_test_yyyyyyyyyyyyyyyyyyyy',
            createdAt: '2024-02-01',
            lastUsed: '2024-02-18',
            expiresAt: '2024-05-01',
            isActive: true,
        },
    ])

    const [showKey, setShowKey] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [error, setError] = useState('')

    const handleCopyKey = (keyId: string, key: string) => {
        navigator.clipboard.writeText(key)
        setCopiedId(keyId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleCreateKey = () => {
        if (!newKeyName.trim()) {
            setError('Please enter a name for the API key')
            return
        }

        // Simulate API call
        const newKey: ApiKey = {
            id: Date.now().toString(),
            name: newKeyName,
            key: `nm_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`,
            createdAt: new Date().toISOString().split('T')[0],
            lastUsed: null,
            expiresAt: null,
            isActive: true,
        }

        setApiKeys([...apiKeys, newKey])
        setNewKeyName('')
        setIsCreating(false)
        setError('')
    }

    const handleDeleteKey = (keyId: string) => {
        if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            setApiKeys(apiKeys.filter(k => k.id !== keyId))
        }
    }

    const handleToggleKeyStatus = (keyId: string) => {
        setApiKeys(apiKeys.map(k =>
            k.id === keyId ? { ...k, isActive: !k.isActive } : k
        ))
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const maskKey = (key: string) => {
        if (key.length <= 8) return key
        const prefix = key.substring(0, 6)
        const suffix = key.substring(key.length - 4)
        return `${prefix}...${suffix}`
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-amber-500" />
                        <h3 className="font-semibold text-white">API Keys</h3>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Key
                    </button>
                </div>

                <p className="text-sm text-gray-400 mb-6">
                    API keys allow you to authenticate requests to the NyayMitra API.
                    Keep your keys secure and never share them publicly.
                </p>

                {/* Create New Key Form */}
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-slate-800/50 border border-white/10 rounded-lg"
                    >
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={(e) => {
                                    setNewKeyName(e.target.value)
                                    setError('')
                                }}
                                placeholder="Enter key name (e.g., Production)"
                                className="flex-1 px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-gray-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateKey}
                                    className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false)
                                        setNewKeyName('')
                                        setError('')
                                    }}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </p>
                        )}
                    </motion.div>
                )}

                {/* API Keys List */}
                <div className="space-y-3">
                    {apiKeys.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">
                            No API keys created yet. Create your first API key to get started.
                        </p>
                    ) : (
                        apiKeys.map((key) => (
                            <motion.div
                                key={key.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border ${key.isActive ? 'border-white/10' : 'border-red-500/20 bg-red-500/5'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-white">{key.name}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${key.isActive
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>
                                            {key.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs text-gray-400 font-mono bg-slate-900 px-2 py-1 rounded">
                                            {showKey === key.id ? key.key : maskKey(key.key)}
                                        </code>
                                        <button
                                            onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                        >
                                            {showKey === key.id ? (
                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <Eye className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleCopyKey(key.id, key.key)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                        >
                                            {copiedId === key.id ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                                        <span>Created: {formatDate(key.createdAt)}</span>
                                        <span>•</span>
                                        <span>Last used: {formatDate(key.lastUsed)}</span>
                                        {key.expiresAt && (
                                            <>
                                                <span>•</span>
                                                <span>Expires: {formatDate(key.expiresAt)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                    <button
                                        onClick={() => handleToggleKeyStatus(key.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${key.isActive
                                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                            }`}
                                    >
                                        {key.isActive ? 'Revoke' : 'Reactivate'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteKey(key.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-200">
                                <strong>Security Note:</strong> API keys provide full access to your account.
                                Never share them in code or public repositories. Rotate keys regularly.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}