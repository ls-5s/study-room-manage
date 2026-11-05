import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '../api/auth'
import { getCurrentUser } from '../api/user'
import type { LoginInput, UserProfile, UserSummary } from '../types/auth'
import { clearAuthToken, getAuthToken, getRoleHomePath, setAuthToken } from '../utils/auth-session'
import { isAdminRole } from '../utils/auth-role'

function profileFromSummary(user: UserSummary): UserProfile {
  return {
    ...user,
    email: null,
    phone: null,
    avatarUrl: null,
    violationCount: 0,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getAuthToken())
  const currentUser = shallowRef<UserProfile | null>(null)
  const initialized = ref(false)
  let initializing: Promise<void> | null = null

  const isAuthenticated = computed(() => Boolean(token.value && currentUser.value))
  const isAdmin = computed(() => isAdminRole(currentUser.value?.role))
  const isSuperAdmin = computed(() => currentUser.value?.role === 'super_admin')
  const homePath = computed(() =>
    currentUser.value ? getRoleHomePath(currentUser.value.role) : '/home',
  )

  function clearSession() {
    token.value = null
    currentUser.value = null
    initialized.value = true
    clearAuthToken()
  }

  function setSession(nextToken: string, user: UserSummary) {
    token.value = nextToken
    currentUser.value = profileFromSummary(user)
    initialized.value = true
    setAuthToken(nextToken)
  }

  async function login(input: LoginInput) {
    const result = await authApi.login(input)
    setSession(result.token, result.user)
    currentUser.value = await getCurrentUser()
  }

  async function initialize(force = false): Promise<void> {
    if (initialized.value && !force) return
    if (!token.value) {
      clearSession()
      return
    }
    if (initializing) return initializing

    initializing = (async () => {
      try {
        currentUser.value = await getCurrentUser()
        initialized.value = true
      } catch {
        clearSession()
      } finally {
        initializing = null
      }
    })()
    return initializing
  }

  async function logout() {
    try {
      if (token.value) await authApi.logout()
    } finally {
      clearSession()
    }
  }

  function updateUser(user: UserProfile) {
    currentUser.value = user
  }

  return {
    token,
    currentUser,
    initialized,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    homePath,
    login,
    initialize,
    logout,
    clearSession,
    updateUser,
  }
})
