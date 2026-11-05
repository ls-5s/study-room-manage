import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NotFoundView from '../views/NotFoundView.vue'
import SystemStatusView from '../views/SystemStatusView.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/system/status' },
  { path: '/system/status', name: 'system-status', component: SystemStatusView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
