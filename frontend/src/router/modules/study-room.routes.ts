import type { RouteRecordRaw } from 'vue-router'

export const studyRoomRoutes: RouteRecordRaw[] = [
  {
    path: 'home',
    name: 'home',
    component: () => import('../../views/studyRoom/HomeView.vue'),
    meta: {
      title: '自习室首页',
      description: '浏览开放中的自习室，并按日期和时段寻找可用座位。',
      access: 'public',
      requiresAuth: false,
      navGroup: 'student',
      navLabel: '自习室首页',
    },
  },
  {
    path: 'study-rooms/:id',
    name: 'study-room-detail',
    component: () => import('../../views/studyRoom/StudyRoomDetailView.vue'),
    meta: {
      title: '自习室详情',
      description: '查看自习室开放时段与座位分布，并选择要预约的座位。',
      access: 'public',
      requiresAuth: false,
      activeNav: '/home',
    },
  },
  {
    path: 'admin/study-rooms',
    name: 'admin-study-rooms',
    component: () => import('../../views/studyRoom/StudyRoomManagementView.vue'),
    meta: {
      title: '自习室管理',
      description: '维护自习室基础信息、开放状态和每日开放时段。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '自习室管理',
    },
  },
  {
    path: 'admin/study-rooms/:id/seats',
    name: 'admin-seat-management',
    component: () => import('../../views/studyRoom/SeatManagementView.vue'),
    meta: {
      title: '座位管理',
      description: '配置自习室座位布局，并处理座位维修与停用状态。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      activeNav: '/admin/study-rooms',
    },
  },
]
