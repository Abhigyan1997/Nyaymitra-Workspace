'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface Subscription {
  plan: string
  status: string
  startDate: string | null
  endDate: string | null
}

interface SubscriptionResponse {
  success: boolean
  message: string
  data: {
    companyName: string
    legalName: string
    businessStatus: string
    workspaceStatus: string
    subscription: Subscription
  }
}

export function BillingSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [business, setBusiness] = useState<{
    companyName: string
    legalName: string
    businessStatus: string
    workspaceStatus: string
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app'

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError('')

        const token = localStorage.getItem('token')

        const response = await fetch(
          `${API_URL}/api/v1/business/subscription`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token
                ? {
                  Authorization: `Bearer ${token} `,
                }
                : {}),
            },
          }
        )

        const result: SubscriptionResponse = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Failed to fetch subscription'
          )
        }

        setSubscription(result.data.subscription)
        setBusiness({
          companyName: result.data.companyName,
          legalName: result.data.legalName,
          businessStatus: result.data.businessStatus,
          workspaceStatus: result.data.workspaceStatus,
        })
      } catch (err) {
        console.error('Subscription fetch error:', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load subscription details'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [API_URL])

  const formatDate = (date: string | null) => {
    if (!date) return '—'

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  }

  const getDaysRemaining = () => {
    if (!subscription?.endDate) return 0

    const end = new Date(subscription.endDate).getTime()
    const now = new Date().getTime()

    return Math.max(
      0,
      Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    )
  }

  const getSubscriptionProgress = () => {
    if (!subscription?.startDate || !subscription?.endDate) {
      return 0
    }

    const start = new Date(subscription.startDate).getTime()
    const end = new Date(subscription.endDate).getTime()
    const now = new Date().getTime()

    const total = end - start
    const elapsed = now - start

    if (elapsed <= 0) return 0
    if (elapsed >= total) return 100

    return Math.round((elapsed / total) * 100)
  }

  const getPlanDescription = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'starter':
        return 'Essential legal operations tools for growing businesses.'
      case 'growth':
        return 'Advanced legal operations and collaboration for scaling businesses.'
      case 'enterprise':
        return 'Comprehensive legal operations support for larger organizations.'
      default:
        return 'Your current NyayMitra business subscription.'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return {
          icon: CheckCircle2,
          className:
            'text-green-400 bg-green-500/10 border-green-500/20',
        }

      case 'trial':
        return {
          icon: Clock3,
          className:
            'text-amber-400 bg-amber-500/10 border-amber-500/20',
        }

      case 'expired':
        return {
          icon: AlertCircle,
          className:
            'text-red-400 bg-red-500/10 border-red-500/20',
        }

      default:
        return {
          icon: AlertCircle,
          className:
            'text-zinc-400 bg-zinc-900 border-zinc-800',
        }
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[300px] items-center justify-center bg-black"
      >
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading subscription details...</span>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-red-500/20 bg-red-500/5 p-6"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />

          <div>
            <h3 className="font-semibold text-white">
              Unable to load billing information
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              {error}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const statusStyle = getStatusStyle(
    subscription?.status || ''
  )

  const StatusIcon = statusStyle.icon

  const daysRemaining = getDaysRemaining()
  const progress = getSubscriptionProgress()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 bg-black"
    >
      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
      >
        {/* Header */}
        <div className="border-b border-zinc-800 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />

                <h3 className="font-semibold text-white">
                  Current Plan
                </h3>
              </div>

              <p className="text-sm text-zinc-400">
                Your NyayMitra legal operations subscription
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusStyle.className}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />

              {subscription?.status || 'Unknown'}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Plan Information */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white">
                  {subscription?.plan || '—'}
                </h2>

                <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                  Business Plan
                </span>
              </div>

              <p className="mt-2 max-w-xl text-sm text-zinc-400">
                {getPlanDescription(subscription?.plan || '')}
              </p>

              {business?.companyName && (
                <p className="mt-3 text-sm font-medium text-white">
                  {business.companyName}
                </p>
              )}
            </div>

            {/* <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Upgrade Plan
            </motion.button> */}
          </div>

          {/* Subscription Period */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-black/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-amber-400" />

                <span className="text-xs font-medium text-zinc-400">
                  Subscription Started
                </span>
              </div>

              <p className="font-semibold text-white">
                {formatDate(subscription?.startDate || null)}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-black/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-amber-400" />

                <span className="text-xs font-medium text-zinc-400">
                  Renewal Date
                </span>
              </div>

              <p className="font-semibold text-white">
                {formatDate(subscription?.endDate || null)}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-black/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-400" />

                <span className="text-xs font-medium text-zinc-400">
                  Remaining
                </span>
              </div>

              <p className="font-semibold text-white">
                {daysRemaining} days
              </p>
            </div>
          </div>

          {/* Subscription Progress */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-white">
                Subscription period
              </p>

              <p className="text-sm text-zinc-400">
                {progress}% used
              </p>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}% ` }}
                transition={{
                  delay: 0.2,
                  duration: 0.8,
                }}
                className="h-full rounded-full bg-amber-500"
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-zinc-400">
              <span>
                {formatDate(subscription?.startDate || null)}
              </span>

              <span>
                {formatDate(subscription?.endDate || null)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account & Workspace Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <h3 className="mb-4 font-semibold text-white">
          Account & Workspace
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 rounded-lg bg-black/50 p-4">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </div>

            <div>
              <p className="text-sm font-medium text-white">
                Business Account
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                {business?.businessStatus || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg bg-black/50 p-4">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-amber-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-white">
                Workspace
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                {business?.workspaceStatus || '—'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <div className="mb-4">
          <h3 className="font-semibold text-white">
            Payment Method
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            Payment details associated with your subscription
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-black/50 p-4">
          <div className="rounded-lg bg-amber-500/10 p-2.5">
            <CreditCard className="h-6 w-6 text-amber-400" />
          </div>

          <div className="flex-1">
            <p className="font-medium text-white">
              Payment information
            </p>

            <p className="text-sm text-zinc-400">
              Payment details will appear here once billing is configured.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Billing Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <h3 className="font-semibold text-white">
          Billing Information
        </h3>

        <p className="mt-1 text-sm text-zinc-400">
          Subscription and billing information for your business.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Business
            </p>

            <p className="mt-1 text-sm font-medium text-white">
              {business?.legalName || business?.companyName || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Plan
            </p>

            <p className="mt-1 text-sm font-medium text-white">
              {subscription?.plan || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Subscription Status
            </p>

            <p className="mt-1 text-sm font-medium text-white">
              {subscription?.status || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Next Renewal
            </p>

            <p className="mt-1 text-sm font-medium text-white">
              {formatDate(subscription?.endDate || null)}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}