import 'vue-router'

export {}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    access?: 'public' | 'student' | 'admin'
    requiresAuth?: boolean
    requiresAdmin?: boolean
    navGroup?: 'student' | 'admin' | 'system'
    navLabel?: string
    activeNav?: string
  }
}
