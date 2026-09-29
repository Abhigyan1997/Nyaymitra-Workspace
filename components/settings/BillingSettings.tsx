
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
            'text-green-600 bg-green-500/10 border-green-500/20',
        }

      case 'trial':
        return {
          icon: Clock3,
          className:
            'text-amber-600 bg-amber-500/10 border-amber-500/20',
        }

      case 'expired':
        return {
          icon: AlertCircle,
          className:
            'text-red-600 bg-red-500/10 border-red-500/20',
        }

      default:
        return {
          icon: AlertCircle,
          className:
            'text-muted-foreground bg-muted border-border',
        }
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[300px] items-center justify-center"
      >
        <div className="flex items-center gap-3 text-muted-foreground">
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
            <h3 className="font-semibold text-foreground">
              Unable to load billing information
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
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
      className="space-y-6"
    >
      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />

                <h3 className="font-semibold text-foreground">
                  Current Plan
                </h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Your NyayMitra legal operations subscription
              </p>
            </div>

            <div
              className={`inline - flex w - fit items - center gap - 2 rounded - full border px - 3 py - 1.5 text - xs font - medium ${statusStyle.className} `}
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
                <h2 className="text-3xl font-bold text-foreground">
                  {subscription?.plan || '—'}
                </h2>

                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Business Plan
                </span>
              </div>

              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {getPlanDescription(subscription?.plan || '')}
              </p>

              {business?.companyName && (
                <p className="mt-3 text-sm font-medium text-foreground">
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
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />

                <span className="text-xs font-medium text-muted-foreground">
                  Subscription Started
                </span>
              </div>

              <p className="font-semibold text-foreground">
                {formatDate(subscription?.startDate || null)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />

                <span className="text-xs font-medium text-muted-foreground">
                  Renewal Date
                </span>
              </div>

              <p className="font-semibold text-foreground">
                {formatDate(subscription?.endDate || null)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />

                <span className="text-xs font-medium text-muted-foreground">
                  Remaining
                </span>
              </div>

              <p className="font-semibold text-foreground">
                {daysRemaining} days
              </p>
            </div>
          </div>

          {/* Subscription Progress */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Subscription period
              </p>

              <p className="text-sm text-muted-foreground">
                {progress}% used
              </p>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}% ` }}
                transition={{
                  delay: 0.2,
                  duration: 0.8,
                }}
                className="h-full rounded-full bg-primary"
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
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
        className="rounded-xl border border-border bg-card p-6"
      >
        <h3 className="mb-4 font-semibold text-foreground">
          Account & Workspace
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 rounded-lg bg-background/50 p-4">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">
                Business Account
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {business?.businessStatus || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg bg-background/50 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">
                Workspace
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
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
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">
            Payment Method
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Payment details associated with your subscription
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-background/50 p-4">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1">
            <p className="font-medium text-foreground">
              Payment information
            </p>

            <p className="text-sm text-muted-foreground">
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
        className="rounded-xl border border-border bg-card p-6"
      >
        <h3 className="font-semibold text-foreground">
          Billing Information
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Subscription and billing information for your business.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Business
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {business?.legalName || business?.companyName || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plan
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {subscription?.plan || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Subscription Status
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {subscription?.status || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Next Renewal
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDate(subscription?.endDate || null)}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

