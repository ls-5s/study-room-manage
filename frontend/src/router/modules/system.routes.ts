import type { RouteRecordRaw } from 'vue-router'

export const systemRoutes: RouteRecordRaw[] = [
  {
    path: 'system/status',
    name: 'system-status',
    component: () => import('../../views/system/SystemStatusView.vue'),
    meta: {
      title: '系统状态',
      description: '检查后端服务与数据库连接，确认系统当前是否可用。',
      access: 'public',
      requiresAuth: false,
      navGroup: 'system',
      navLabel: '系统状态',
    },
  },
]
