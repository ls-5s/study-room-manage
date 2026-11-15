import type { RouteRecordRaw } from 'vue-router'

export const statisticsRoutes: RouteRecordRaw[] = [
  {
    path: 'admin/dashboard',
    name: 'admin-dashboard',
    component: () => import('../../views/statistics/DashboardView.vue'),
    meta: {
      title: '管理仪表盘',
      description: '汇总今日预约、签到、失约和座位利用情况。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '管理仪表盘',
    },
  },
  {
    path: 'admin/reports',
    name: 'admin-reports',
    component: () => import('../../views/statistics/ReportsView.vue'),
    meta: {
      title: '统计报表',
      description: '按日期、自习室和时段分析趋势，并导出筛选后的报表。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '统计报表',
    },
  },
]
