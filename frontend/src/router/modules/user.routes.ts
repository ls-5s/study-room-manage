import type { RouteRecordRaw } from 'vue-router'

export const userRoutes: RouteRecordRaw[] = [
  {
    path: 'profile',
    name: 'profile',
    component: () => import('../../views/user/ProfileView.vue'),
    meta: {
      title: '个人中心',
      description: '集中查看账号资料、安全设置和当前预约限制状态。',
      access: 'student',
      requiresAuth: true,
      navGroup: 'student',
      navLabel: '个人中心',
    },
  },
]
