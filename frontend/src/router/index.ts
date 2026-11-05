import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { authRoutes } from './modules/auth.routes'
import { feedbackRoutes } from './modules/feedback.routes'
import { reservationRoutes } from './modules/reservation.routes'
import { statisticsRoutes } from './modules/statistics.routes'
import { studyRoomRoutes } from './modules/study-room.routes'
import { systemRoutes } from './modules/system.routes'
import { userRoutes } from './modules/user.routes'
import { violationRoutes } from './modules/violation.routes'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AuthLayout,
    children: authRoutes,
  },
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', redirect: '/home' },
      ...userRoutes,
      ...studyRoomRoutes,
      ...reservationRoutes,
      ...violationRoutes,
      ...feedbackRoutes,
      ...statisticsRoutes,
      ...systemRoutes,
      {
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('../views/error/NotFoundView.vue'),
        meta: {
          title: '页面不存在',
          description: '当前地址没有对应的系统页面。',
          access: 'public',
          requiresAuth: false,
        },
      },
    ],
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
