import type { RouteRecordRaw } from 'vue-router'

export const userRoutes: RouteRecordRaw[] = [
  {
    path: 'profile',
    name: 'profile',
    component: () => import('../../views/user/ProfileView.vue'),
    meta: {
      title: '个人中心',
      description: '集中查看账号资料、安全设置和当前预约限制状态。',
      requiresAuth: true,
      navLabel: '个人中心',
    },
  },
  {
    path: 'admin/users',
    name: 'admin-users',
    component: () => import('../../views/admin/UserManagementView.vue'),
    meta: {
      title: '用户管理',
      description: '查询学生与管理员账号，并处理账号停用和恢复。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '用户管理',
    },
  },
]
