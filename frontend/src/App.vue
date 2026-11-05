<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [{ path: '/system/status', label: '系统状态' }] as const

const title = computed(() =>
  typeof route.meta.title === 'string' ? route.meta.title : '校园自习室',
)
const environment = computed(() => (import.meta.env.DEV ? '开发环境' : '生产环境'))
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>

    <aside class="sidebar">
      <RouterLink class="brand" to="/system/status" aria-label="校园自习室，返回系统状态">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5c-3-2-6-1.5-8-1v14c2-.5 5-1 8 1 3-2 6-1.5 8-1V4c-2-.5-5-1-8 1Zm0 0v14"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="brand-text">
          <strong>校园自习室</strong>
          <small>预约管理系统</small>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="主导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :to="item.path"
          :class="{ 'is-active': route.path === item.path }"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 15V8m4.7 7V4m4.6 11v-5m4.7 5v-9"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          {{ item.label }}
        </RouterLink>
        <span class="nav-item is-locked">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="4" y="4" width="12" height="4" rx="1.2" />
            <rect x="4" y="12" width="12" height="4" rx="1.2" />
            <path d="M7 6h.01M7 14h.01" stroke="currentColor" stroke-width="1.6" />
          </svg>
          自习室预约
          <span class="nav-badge">待开放</span>
        </span>
      </nav>

      <div class="sidebar-foot">
        <span class="environment">
          <span class="environment-dot" aria-hidden="true" />
          {{ environment }}
        </span>
        <p>毕业设计项目</p>
      </div>
    </aside>

    <div class="main-column">
      <header class="topbar">
        <p class="topbar-title">{{ title }}</p>
        <p class="topbar-meta">
          <span aria-hidden="true">v0.1.0</span>
          <span>毕业设计</span>
        </p>
      </header>

      <main id="main-content" class="main-content">
        <RouterView />
      </main>

      <footer class="site-footer">
        <span>校园自习室预约管理系统</span>
        <span>每一份专注，都值得被认真守护。</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100svh;
}

.skip-link {
  position: fixed;
  z-index: 20;
  top: 12px;
  left: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  color: #fff;
  background: var(--accent);
  text-decoration: none;
  transform: translateY(-160%);
  transition: transform 160ms ease;
}

.skip-link:focus {
  transform: translateY(0);
}

/* ---------- sidebar ---------- */

.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  width: 236px;
  height: 100svh;
  flex-shrink: 0;
  flex-direction: column;
  padding: 22px 16px 18px;
  border-right: 1px solid var(--border);
  background: var(--surface);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 22px;
  color: var(--text);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  color: var(--accent-contrast);
  background: var(--accent);
}

.brand-mark svg {
  width: 22px;
  height: 22px;
}

.brand-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.3;
}

.brand-text strong {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.brand-text small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 10.5px;
  letter-spacing: 0.02em;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-label {
  padding: 0 8px 8px;
  color: var(--text-muted);
  font-size: 10px;
  letter-spacing: 0.14em;
}

.nav-item {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.nav-item svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  color: var(--text-muted);
}

.nav-item.is-active {
  color: var(--accent);
  background: var(--accent-soft);
  font-weight: 600;
}

.nav-item.is-active svg {
  color: var(--accent);
}

.nav-item:not(.is-active):not(.is-locked):hover {
  color: var(--text);
  background: var(--surface-soft);
}

.nav-item.is-locked {
  cursor: not-allowed;
  opacity: 0.55;
}

.nav-badge {
  margin-left: auto;
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--text-muted);
  background: var(--surface-soft);
  font-size: 9px;
  font-weight: 500;
}

.sidebar-foot {
  margin-top: auto;
  padding: 16px 8px 0;
  border-top: 1px solid var(--border);
}

.environment {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 11px;
}

.environment-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-ok);
  box-shadow: 0 0 0 3px var(--status-ok-tint);
}

.sidebar-foot p {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 10px;
}

/* ---------- main column ---------- */

.main-column {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.topbar {
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 40px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(8px);
}

.topbar-title {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.topbar-meta {
  display: flex;
  gap: 14px;
  margin: 0;
  color: var(--text-muted);
  font-size: 10.5px;
}

.main-content {
  width: 100%;
  max-width: 1040px;
  flex: 1;
  margin: 0 auto;
  padding: 36px 40px 56px;
}

.site-footer {
  display: flex;
  width: 100%;
  max-width: 1040px;
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto;
  padding: 18px 40px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10.5px;
}

@media (max-width: 900px) {
  .app-shell {
    flex-direction: column;
  }

  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 10px 20px;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .brand {
    padding: 0;
  }

  .brand-text small,
  .sidebar-foot {
    display: none;
  }

  .nav {
    flex-direction: row;
    margin-left: auto;
    overflow-x: auto;
  }

  .nav-item {
    min-height: 34px;
    padding: 6px 10px;
    font-size: 12px;
    white-space: nowrap;
  }

  .nav-badge {
    display: none;
  }

  .topbar {
    display: none;
  }

  .main-content {
    padding: 24px 20px 40px;
  }

  .site-footer {
    padding: 16px 20px;
  }
}

@media (max-width: 480px) {
  .nav-item.is-locked {
    display: none;
  }

  .site-footer {
    justify-content: center;
  }

  .site-footer span:last-child {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skip-link,
  .nav-item {
    transition: none;
  }
}
</style>
