import type { RouteRecordRaw } from 'vue-router'

export const feedbackRoutes: RouteRecordRaw[] = [
  {
    path: 'feedback',
    name: 'my-feedback',
    component: () => import('../../views/feedback/MyFeedbackView.vue'),
    meta: {
      title: '反馈工单',
      description: '提交占座举报或使用问题，并跟踪工单处理结果。',
      access: 'student',
      requiresAuth: true,
      navGroup: 'student',
      navLabel: '反馈工单',
    },
  },
  {
    path: 'admin/feedback',
    name: 'admin-feedback',
    component: () => import('../../views/feedback/FeedbackManagementView.vue'),
    meta: {
      title: '反馈处理',
      description: '核实学生反馈和占座举报，记录处理结果并关闭工单。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '反馈处理',
    },
  },
]
