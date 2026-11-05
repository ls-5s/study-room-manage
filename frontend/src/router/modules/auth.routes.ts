import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: 'login',
    name: 'login',
    component: () => import('../../views/auth/LoginView.vue'),
    meta: {
      title: '登录',
      description: '使用学生或管理员账号登录，并按角色进入对应工作台。',
      access: 'public',
      requiresAuth: false,
      navGroup: 'system',
      navLabel: '登录',
    },
  },
  {
    path: 'register',
    name: 'register',
    component: () => import('../../views/auth/RegisterView.vue'),
    meta: {
      title: '注册',
      description: '为校内学生创建预约系统账号，并完成基础身份信息登记。',
      access: 'public',
      requiresAuth: false,
      navGroup: 'system',
      navLabel: '注册',
    },
  },
]
