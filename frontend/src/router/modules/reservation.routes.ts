import type { RouteRecordRaw } from 'vue-router'

export const reservationRoutes: RouteRecordRaw[] = [
  {
    path: 'reservations/confirm',
    name: 'reservation-confirm',
    component: () => import('../../views/reservation/ReservationConfirmView.vue'),
    meta: {
      title: '预约确认',
      description: '核对自习室、时段与座位信息后提交座位预约。',
      access: 'student',
      requiresAuth: true,
      activeNav: '/reservations',
    },
  },
  {
    path: 'reservations',
    name: 'reservations',
    component: () => import('../../views/reservation/ReservationListView.vue'),
    meta: {
      title: '我的预约',
      description: '集中查看预约状态、签到时间窗口和可执行操作。',
      access: 'student',
      requiresAuth: true,
      navGroup: 'student',
      navLabel: '我的预约',
    },
  },
  {
    path: 'reservations/:id',
    name: 'reservation-detail',
    component: () => import('../../views/reservation/ReservationDetailView.vue'),
    meta: {
      title: '预约详情',
      description: '查看单次预约的完整信息、状态时间线和签到入口。',
      access: 'student',
      requiresAuth: true,
      activeNav: '/reservations',
    },
  },
  {
    path: 'admin/reservations',
    name: 'admin-reservations',
    component: () => import('../../views/reservation/ReservationManagementView.vue'),
    meta: {
      title: '预约管理',
      description: '按学生、自习室和状态查询预约，并处理人工取消等异常。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '预约管理',
    },
  },
  {
    path: 'admin/reservations/check-in-code',
    name: 'admin-check-in-code',
    component: () => import('../../views/reservation/CheckInCodeView.vue'),
    meta: {
      title: '签到码展示',
      description: '为管理员展示当前自习室短时有效的签到二维码和核验码。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      activeNav: '/admin/reservations',
    },
  },
]
