<script setup lang="ts">
import { ArrowRight, Menu as MenuIcon, Reading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, shallowRef, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppNavigation from '../components/AppNavigation.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import { useAuthStore } from '../stores/auth'
import { roleLabel } from '../utils/auth-role'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const drawerOpen = shallowRef(false)
const logoutPending = shallowRef(false)

const title = computed(() =>
  typeof route.meta.title === 'string' ? route.meta.title : '校园自习室',
)
const activePath = computed(() =>
  typeof route.meta.activeNav === 'string' ? route.meta.activeNav : route.path,
)
const environment = computed(() => (import.meta.env.DEV ? '开发环境' : '生产环境'))

async function handleLogout() {
  logoutPending.value = true
  try {
    await auth.logout()
    ElMessage.success('已退出登录')
    await router.push('/login')
  } catch {
    ElMessage.error('退出请求失败，本地登录状态已清理')
    await router.push('/login')
  } finally {
    logoutPending.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)
</script>

<template>
  <div class="app-shell">
    <div class="workspace-atmosphere" aria-hidden="true">
      <span class="atmosphere-light atmosphere-light-primary" />
      <span class="atmosphere-light atmosphere-light-secondary" />
      <span class="atmosphere-grid" />
    </div>
    <a class="skip-link" href="#main-content">跳到主要内容</a>

    <el-container class="layout-container">
      <el-aside class="desktop-sidebar" width="248px">
        <div class="sidebar-content">
          <RouterLink class="brand" to="/home" aria-label="校园自习室，返回自习室首页">
            <span class="brand-mark" aria-hidden="true">
              <el-icon><Reading /></el-icon>
            </span>
            <span class="brand-text">
              <strong>校园自习室</strong>
              <small>预约管理系统</small>
            </span>
          </RouterLink>

          <AppNavigation :active-path="activePath" @navigate="drawerOpen = false" />

          <div class="sidebar-foot">
            <span class="environment-indicator" aria-hidden="true" />
            <div>
              <p class="environment-name">{{ environment }}</p>
              <p class="environment-note">毕业设计项目</p>
            </div>
          </div>
        </div>
      </el-aside>

      <el-container class="workspace">
        <el-header class="topbar" height="72px">
          <div class="topbar-leading">
            <el-button
              class="mobile-menu-button"
              circle
              aria-label="打开导航菜单"
              @click="drawerOpen = true"
            >
              <el-icon><MenuIcon /></el-icon>
            </el-button>
            <div class="breadcrumb" aria-label="当前页面">
              <span>校园自习室</span>
              <el-icon aria-hidden="true"><ArrowRight /></el-icon>
              <strong>{{ title }}</strong>
            </div>
          </div>

          <div class="topbar-meta">
            <div v-if="auth.currentUser" class="account-summary">
              <span class="account-name">{{ auth.currentUser.displayName }}</span>
              <el-tag size="small" effect="plain" round>
                {{ roleLabel(auth.currentUser.role) }}
              </el-tag>
              <el-button
                size="small"
                :loading="logoutPending"
                :disabled="logoutPending"
                @click="handleLogout"
              >
                退出
              </el-button>
            </div>
            <ThemeToggle />
            <el-tag size="small" effect="plain" round>{{ environment }}</el-tag>
            <span>v0.1.0</span>
          </div>
        </el-header>

        <el-main id="main-content" class="main-content" tabindex="-1">
          <RouterView v-slot="{ Component }">
            <Transition name="page-shift" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </Transition>
          </RouterView>
        </el-main>

        <footer class="site-footer">
          <span>校园自习室预约管理系统</span>
          <span>每一份专注，都值得被认真守护。</span>
        </footer>
      </el-container>
    </el-container>

    <el-drawer
      v-model="drawerOpen"
      class="mobile-navigation-drawer"
      direction="ltr"
      size="280px"
      title="主导航"
    >
      <div class="drawer-content">
        <RouterLink class="brand" to="/home" aria-label="校园自习室，返回自习室首页">
          <span class="brand-mark" aria-hidden="true">
            <el-icon><Reading /></el-icon>
          </span>
          <span class="brand-text">
            <strong>校园自习室</strong>
            <small>预约管理系统</small>
          </span>
        </RouterLink>

        <AppNavigation :active-path="activePath" @navigate="drawerOpen = false" />

        <div class="sidebar-foot">
          <span class="environment-indicator" aria-hidden="true" />
          <div>
            <p class="environment-name">{{ environment }}</p>
            <p class="environment-note">毕业设计项目</p>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-width: 0;
  min-height: 100svh;
  overflow: clip;
  background:
    radial-gradient(ellipse at 34% -8%, var(--gradient-accent), transparent 38%),
    radial-gradient(ellipse at 96% 68%, var(--gradient-secondary), transparent 42%), var(--canvas);
  isolation: isolate;
}

.workspace-atmosphere {
  position: fixed;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.atmosphere-light {
  position: absolute;
  border-radius: 50%;
  filter: blur(110px);
  opacity: 1;
}

.atmosphere-light-primary {
  top: -220px;
  left: 16%;
  width: 760px;
  height: 620px;
  background: radial-gradient(circle, var(--gradient-accent), transparent 68%);
}

.atmosphere-light-secondary {
  right: -220px;
  bottom: 5%;
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, var(--gradient-secondary), transparent 70%);
}

.atmosphere-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0.16;
  mask-image: linear-gradient(to bottom, #000, transparent 62%);
}

.layout-container {
  min-height: 100svh;
}

.skip-link {
  position: fixed;
  z-index: 2000;
  top: 12px;
  left: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--accent-contrast);
  background: var(--accent);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
  text-decoration: none;
  transform: translateY(-160%);
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.skip-link:focus {
  transform: translateY(0);
}

.desktop-sidebar {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow-x: hidden;
  overflow-y: auto;
  border-right: 1px solid var(--sidebar-border);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--sidebar-surface) 90%, var(--accent)),
      transparent 42%
    ),
    var(--sidebar-surface);
  backdrop-filter: blur(24px) saturate(118%);
  scrollbar-color: rgb(255 255 255 / 20%) transparent;
  scrollbar-width: thin;
}

.sidebar-content,
.drawer-content {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  padding: 24px 16px 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  padding: 4px 8px;
  color: var(--text);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  color: var(--action-text);
  background: var(--action);
  box-shadow:
    inset 0 1px rgb(255 255 255 / 12%),
    0 8px 20px rgb(0 0 0 / 12%);
  font-size: 20px;
}

.brand-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.25;
}

.brand-text strong {
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.brand-text small {
  margin-top: 4px;
  color: var(--sidebar-text-muted);
  font-size: 0.75rem;
  line-height: 1rem;
}

.sidebar-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 24px 8px 0;
  border-top: 1px solid var(--sidebar-border);
}

.environment-indicator {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--environment-indicator);
  box-shadow: 0 0 0 4px var(--environment-indicator-ring);
}

.environment-name,
.environment-note {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1rem;
}

.environment-name {
  color: var(--text);
  font-weight: 600;
}

.environment-note {
  margin-top: 4px;
  color: var(--sidebar-text-muted);
}

.workspace {
  min-width: 0;
  background: transparent;
}

.topbar {
  position: sticky;
  z-index: 10;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 clamp(20px, 2.4vw, 40px);
  border-bottom: 1px solid var(--border);
  background: var(--topbar-surface);
  backdrop-filter: blur(24px) saturate(118%);
}

.topbar-leading,
.breadcrumb,
.topbar-meta {
  display: flex;
  align-items: center;
}

.account-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-name {
  max-width: 140px;
  overflow: hidden;
  color: var(--text);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-leading {
  min-width: 0;
  gap: 12px;
}

.breadcrumb {
  min-width: 0;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1rem;
}

.breadcrumb strong {
  overflow: hidden;
  color: var(--text);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb .el-icon {
  font-size: 12px;
}

.topbar-meta {
  flex-shrink: 0;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1rem;
}

.mobile-menu-button {
  display: none;
}

.main-content {
  width: 100%;
  max-width: 1480px;
  flex: 1;
  align-self: center;
  padding: 32px clamp(20px, 2.4vw, 40px) 48px;
  overflow: visible;
}

.main-content:focus {
  outline: none;
}

.site-footer {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 1480px;
  align-self: center;
  padding: 24px clamp(20px, 2.4vw, 40px);
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1rem;
}

.page-shift-enter-active,
.page-shift-leave-active {
  transition:
    opacity 260ms var(--ease-out),
    transform 360ms var(--ease-out);
}

.page-shift-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-shift-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 1100px) {
  .topbar,
  .main-content,
  .site-footer {
    padding-inline: 32px;
  }
}

@media (max-width: 900px) {
  .desktop-sidebar {
    display: none;
  }

  .mobile-menu-button {
    display: inline-flex;
  }

  .topbar {
    padding-inline: 24px;
  }

  .main-content {
    padding: 32px 24px;
  }

  .site-footer {
    padding-inline: 24px;
  }
}

@media (max-width: 600px) {
  .topbar {
    padding-inline: 16px;
  }

  .breadcrumb > span,
  .breadcrumb > .el-icon,
  .topbar-meta > span,
  .account-name {
    display: none;
  }

  .main-content {
    padding: 24px 16px 32px;
  }

  .site-footer {
    justify-content: center;
    padding: 16px;
  }

  .site-footer span:last-child {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }

  .page-shift-enter-active,
  .page-shift-leave-active {
    transition: opacity 1ms;
  }

  .page-shift-enter-from,
  .page-shift-leave-to {
    transform: none;
  }
}
</style>

<style>
.mobile-navigation-drawer {
  border-right: 1px solid var(--border-strong);
  background: var(--surface-glass);
  backdrop-filter: blur(28px) saturate(120%);
}

.mobile-navigation-drawer .el-drawer__body {
  padding: 0;
  overscroll-behavior: contain;
}

.mobile-navigation-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 16px 24px;
  color: var(--text);
}

.mobile-navigation-drawer .el-drawer__close-btn {
  color: var(--sidebar-text);
}
</style>
