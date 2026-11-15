import type { RouteRecordRaw } from 'vue-router'

export const designSystemRoutes: RouteRecordRaw[] = [
  {
    path: 'admin/design-system',
    name: 'admin-design-system',
    component: () => import('../../views/design/DesignSystemView.vue'),
    meta: {
      title: '设计系统',
      description: '预览色彩、字体、组件与毛玻璃视觉语言。',
      access: 'admin',
      requiresAuth: true,
      requiresAdmin: true,
      navGroup: 'admin',
      navLabel: '设计系统',
    },
  },
]
