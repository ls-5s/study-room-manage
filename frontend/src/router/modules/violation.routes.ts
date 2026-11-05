import type { RouteRecordRaw } from 'vue-router'

export const violationRoutes: RouteRecordRaw[] = [
  {
    path: 'violations',
    name: 'my-violations',
    component: () => import('../../views/violation/MyViolationsView.vue'),
    meta: {
      title: '我的违约',
      description: '查看本人违约记录、累计次数以及当前预约限制期限。',
      access: 'student',
      requiresAuth: true,
      navGroup: 'student',
      navLabel: '我的违约',
    },
  },
  {
    path: 'admin/violations',
    name: 'admin-violations',
    component: () => import('../../views/violation/ViolationManagementView.vue'),
    meta: {
      title: '违约管理',
      description: '维护违约触发规则，核实记录并处理管理员撤销申请。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '违约管理',
    },
  },
]
