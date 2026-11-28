// lib/services/api.ts

import axios, { AxiosInstance } from 'axios'
import { isTokenExpired, clearSession, LOGIN_PATH } from '@/lib/auth'

// API Configuration
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nyaymitra-backend-production.up.railway.app/api/v1'

// Endpoints that don't need a token (add any others you call through `api`)
const PUBLIC_PATHS = [
    '/auth/login',
    '/auth/register',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
]

const isPublicUrl = (url?: string) => {
    if (!url) return false
    const path = url.startsWith('/') ? url : `/${url}`
    return PUBLIC_PATHS.some((p) => path.startsWith(p))
}

// Thrown when the session is dead. Callers can check for it and stay quiet,
// because the user is already being redirected to login.
export class AuthError extends Error {
    constructor(message = 'Session expired') {
        super(message)
        this.name = 'AuthError'
    }
}

let redirecting = false

const endSession = () => {
    if (typeof window === 'undefined' || redirecting) return
    redirecting = true
    clearSession()
    window.location.replace(`${LOGIN_PATH}?session=expired`)
}

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        if (typeof window === 'undefined') return config
        if (isPublicUrl(config.url)) return config

        const token = localStorage.getItem('token')

        // No token or expired token: don't even call the server
        if (!token || isTokenExpired(token)) {
            endSession()
            return Promise.reject(new AuthError())
        }

        config.headers.Authorization = `Bearer ${token}`
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Already an auth failure from the request interceptor
        if (error instanceof AuthError) return Promise.reject(error)

        if (error.response) {
            const { status, data } = error.response

            // Server says the token is bad (revoked, rotated secret, etc.)
            if (status === 401 && !isPublicUrl(error.config?.url)) {
                endSession()
                return Promise.reject(new AuthError())
            }

            return Promise.reject(
                new Error(data?.message || data?.error || 'An error occurred')
            )
        }

        if (error.request) {
            return Promise.reject(
                new Error('No response from server. Please check your connection.')
            )
        }

        return Promise.reject(
            new Error(error.message || 'An unexpected error occurred')
        )
    }
)

export default api