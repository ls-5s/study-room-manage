import type { UserRole } from '../types/auth'
import { isAdminRole } from './auth-role'

const AUTH_TOKEN_KEY = 'study-room-access-token'

export function getAuthToken(): string | null {
  try {
    return window.sessionStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string): void {
  try {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // The in-memory store still supports the current page when storage is unavailable.
  }
}

export function clearAuthToken(): void {
  try {
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

export function getRoleHomePath(role: UserRole): string {
  return isAdminRole(role) ? '/admin/dashboard' : '/home'
}

export function safeRedirectPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2_000) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  if (value.startsWith('/login') || value.startsWith('/register')) return null

  try {
    const resolved = new URL(value, window.location.origin)
    return resolved.origin === window.location.origin
      ? `${resolved.pathname}${resolved.search}${resolved.hash}`
      : null
  } catch {
    return null
  }
}
