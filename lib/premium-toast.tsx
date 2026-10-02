'use client'

import { toast } from 'sonner'
import { PremiumToast } from '@/components/ui/premium-toast'

type ToastOptions = {
    description?: string
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

const render = (
    variant: 'success' | 'error' | 'warning' | 'info' | 'loading',
    title: string,
    options: ToastOptions = {}
) => {
    return toast.custom(
        (t) => (
            <PremiumToast
        id= { t }
        variant = { variant }
        title = { title }
        description = { options.description }
        duration = { options.duration ?? 4000 }
        onDismiss = {(id) => toast.dismiss(id)}
action = { options.action }
    />
    ),
{
    duration: options.duration ?? 4000,
        position: 'top-right',
    }
  )
}

export const premiumToast = {
    success: (title: string, options?: ToastOptions) => render('success', title, options),
    error: (title: string, options?: ToastOptions) => render('error', title, options),
    warning: (title: string, options?: ToastOptions) => render('warning', title, options),
    info: (title: string, options?: ToastOptions) => render('info', title, options),
    loading: (title: string, options?: ToastOptions) =>
        render('loading', title, { ...options, duration: Infinity }),
    dismiss: (id?: string | number) => toast.dismiss(id),

    /**
     * Promise-based toast — shows loading, then success/error automatically.
     */
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string
            success: string | ((data: T) => string)
            error: string | ((err: any) => string)
        },
        options?: { description?: string }
    ) => {
        const id = toast.loading(messages.loading, { position: 'top-right' })

        promise
            .then((data) => {
                const successMsg =
                    typeof messages.success === 'function' ? messages.success(data) : messages.success
                toast.dismiss(id)
                render('success', successMsg, options)
            })
            .catch((err) => {
                const errorMsg =
                    typeof messages.error === 'function' ? messages.error(err) : messages.error
                toast.dismiss(id)
                render('error', errorMsg, options)
            })

        return promise
    },
}