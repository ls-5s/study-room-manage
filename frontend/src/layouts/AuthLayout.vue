<script setup lang="ts">
import { Reading } from '@element-plus/icons-vue'
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="auth-shell">
    <a class="skip-link" href="#auth-content">跳到主要内容</a>

    <header class="auth-header">
      <RouterLink class="auth-brand" to="/home" aria-label="校园自习室，返回首页">
        <span class="brand-mark" aria-hidden="true">
          <el-icon><Reading /></el-icon>
        </span>
        <span class="brand-text">
          <strong>校园自习室</strong>
          <small>预约管理系统</small>
        </span>
      </RouterLink>
      <el-tag effect="plain" round>账号中心</el-tag>
    </header>

    <main id="auth-content" class="auth-content" tabindex="-1">
      <RouterView />
    </main>

    <footer class="auth-footer">
      <span>校园自习室预约管理系统</span>
      <RouterLink to="/home">先浏览自习室</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.auth-shell {
  position: relative;
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 12%, rgb(72 119 156 / 16%), transparent 30rem),
    linear-gradient(145deg, #edf4f9 0%, #f7f9fb 52%, #eef3f7 100%);
}

.auth-shell::before {
  position: absolute;
  top: 8%;
  right: -120px;
  width: 360px;
  height: 360px;
  border: 1px solid rgb(31 78 121 / 12%);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.skip-link {
  position: fixed;
  z-index: 100;
  top: 12px;
  left: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--accent-contrast);
  background: var(--accent);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-160%);
  transition: transform 180ms ease;
}

.skip-link:focus {
  transform: translateY(0);
}

.auth-header,
.auth-footer,
.auth-content {
  position: relative;
  width: min(100%, 1040px);
  margin-inline: auto;
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 32px;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9px;
  color: #fff;
  background: var(--navy-800);
  font-size: 20px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.brand-text strong {
  font-size: 0.9375rem;
  font-weight: 650;
}

.brand-text small {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 0.6875rem;
}

.auth-content {
  display: flex;
  flex: 1;
  align-items: center;
  padding: 40px 32px 64px;
}

.auth-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 32px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.auth-footer a {
  color: var(--navy-700);
  font-weight: 600;
  text-decoration: none;
}

.auth-footer a:hover {
  color: var(--navy-900);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-content:focus {
  outline: none;
}

@media (max-width: 640px) {
  .auth-header,
  .auth-content,
  .auth-footer {
    padding-inline: 18px;
  }

  .auth-content {
    align-items: flex-start;
    padding-block: 28px 48px;
  }

  .auth-footer {
    justify-content: center;
  }

  .auth-footer span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}
</style>
