// lib/auth.ts
import { jwtDecode } from 'jwt-decode'

export const LOGIN_PATH = '/' // must match your real login route

// every key your LoginForm writes on sign-in
const SESSION_KEYS = [
    'token',
    'user',
    'userId',
    'userName',
    'userEmail',
    'userProfile',
    'userType',
]

export const isTokenExpired = (token: string) => {
    try {
        const { exp } = jwtDecode<{ exp?: number }>(token)
        return !exp || exp * 1000 <= Date.now() + 5_000
    } catch {
        return true
    }
}

export const clearSession = () => {
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k))
}

export const hasValidSession = () => {
    const token = localStorage.getItem('token')
    return !!token && !!localStorage.getItem('user') && !isTokenExpired(token)
}