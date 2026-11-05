import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NotFoundView from '../views/NotFoundView.vue'
import SystemStatusView from '../views/SystemStatusView.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/system/status' },
  {
    path: '/system/status',
    name: 'system-status',
    component: SystemStatusView,
    meta: { title: '系统状态' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 校园自习室` : '校园自习室'
})

export default router
