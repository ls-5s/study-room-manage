<script setup lang="ts">
import {
  Calendar,
  ChatDotRound,
  DataAnalysis,
  DataLine,
  HomeFilled,
  School,
  Tickets,
  User,
  Warning,
} from '@element-plus/icons-vue'
import { computed, type Component } from 'vue'
import { useAuthStore } from '../stores/auth'

const { activePath } = defineProps<{
  activePath: string
}>()

const emit = defineEmits<{
  navigate: [path: string]
}>()

const auth = useAuthStore()

function handleSelect(index: string) {
  emit('navigate', index)
}

interface NavigationItem {
  path: string
  label: string
  icon: Component
}

interface NavigationGroup {
  key: 'student' | 'admin' | 'system'
  label: string
  items: readonly NavigationItem[]
}

const navigationGroups = computed<readonly NavigationGroup[]>(() => {
  if (!auth.currentUser) {
    return [
      {
        key: 'system',
        label: '公共入口',
        items: [
          { path: '/home', label: '浏览自习室', icon: HomeFilled },
          { path: '/login', label: '登录', icon: User },
          { path: '/register', label: '注册', icon: Tickets },
        ],
      },
    ]
  }

  const account: NavigationGroup = {
    key: 'system',
    label: '账号',
    items: [{ path: '/profile', label: '个人中心', icon: User }],
  }

  if (auth.isAdmin) {
    return [
      account,
      {
        key: 'admin',
        label: '管理后台',
        items: [
          { path: '/admin/dashboard', label: '管理仪表盘', icon: DataLine },
          { path: '/admin/users', label: '用户管理', icon: User },
          { path: '/admin/study-rooms', label: '自习室管理', icon: School },
          { path: '/admin/reservations', label: '预约管理', icon: Tickets },
          { path: '/admin/violations', label: '违约管理', icon: Warning },
          { path: '/admin/feedback', label: '反馈处理', icon: ChatDotRound },
          { path: '/admin/reports', label: '统计报表', icon: DataAnalysis },
        ],
      },
    ]
  }

  return [
    account,
    {
      key: 'student',
      label: '学生服务',
      items: [
        { path: '/home', label: '自习室首页', icon: HomeFilled },
        { path: '/reservations', label: '我的预约', icon: Calendar },
        { path: '/violations', label: '我的违约', icon: Warning },
        { path: '/feedback', label: '反馈工单', icon: ChatDotRound },
      ],
    },
  ]
})
</script>

<template>
  <nav class="navigation" aria-label="主导航">
    <el-menu :default-active="activePath" class="navigation-menu" router @select="handleSelect">
      <template v-for="group in navigationGroups" :key="group.key">
        <li class="navigation-group-label" role="presentation">{{ group.label }}</li>
        <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </nav>
</template>

<style scoped>
.navigation {
  width: 100%;
  min-width: 0;
}

.navigation-menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--sidebar-text);
  --el-menu-hover-bg-color: var(--sidebar-surface-hover);
  --el-menu-active-color: var(--sidebar-text-strong);
  border-right: 0;
}

.navigation-menu :deep(.el-menu-item) {
  min-height: 44px;
  margin-bottom: 4px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.navigation-menu :deep(.el-menu-item.is-active) {
  background: var(--sidebar-surface-selected);
  font-weight: 600;
}

.navigation-menu :deep(.el-menu-item.is-active)::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 20px;
  border-radius: 2px;
  background: var(--accent);
  content: '';
  transform: translateY(-50%);
}

.navigation-menu :deep(.el-menu-item:hover) {
  color: var(--sidebar-text-strong);
}

.navigation-group-label {
  margin: 20px 16px 8px;
  color: var(--sidebar-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  line-height: 1rem;
  list-style: none;
}

.navigation-group-label:first-child {
  margin-top: 0;
}
</style>
