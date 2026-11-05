import type { Router } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export function installAuthGuards(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (auth.token && !auth.initialized) await auth.initialize()

    if (to.meta.requiresAuth && !auth.currentUser) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    if (to.meta.requiresAdmin && !auth.isAdmin) {
      return { name: 'forbidden' }
    }

    if ((to.name === 'login' || to.name === 'register') && auth.currentUser) {
      return auth.homePath
    }

    return true
  })
}
