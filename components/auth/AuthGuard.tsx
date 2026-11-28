'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clearSession, hasValidSession, LOGIN_PATH } from '@/lib/auth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [ok, setOk] = useState(false)

    useEffect(() => {
        const check = () => {
            if (hasValidSession()) return true

            // only show "session expired" if there actually was a session
            const hadToken = !!localStorage.getItem('token')
            clearSession()
            setOk(false)

            const params = new URLSearchParams({ redirect: pathname })
            if (hadToken) params.set('session', 'expired')
            router.replace(`${LOGIN_PATH}?${params.toString()}`)
            return false
        }

        setOk(check())

        const interval = setInterval(check, 30_000) // tab left open overnight
        const onFocus = () => check() // user returns to the tab
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'token') check() // logout in another tab
        }

        window.addEventListener('focus', onFocus)
        window.addEventListener('storage', onStorage)
        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', onFocus)
            window.removeEventListener('storage', onStorage)
        }
    }, [router, pathname])

    if (!ok) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
        )
    }

    return <>{children}</>
}