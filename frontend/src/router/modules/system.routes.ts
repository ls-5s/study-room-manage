import type { RouteRecordRaw } from 'vue-router'

export const systemRoutes: RouteRecordRaw[] = [
  {
    path: 'admin/system',
    name: 'admin-system',
    component: () => import('../../views/system/SystemOperationsView.vue'),
    meta: {
      title: '系统运维',
      description: '查看服务、数据库和后台任务状态，维护全局业务参数。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '系统运维',
    },
  },
]
