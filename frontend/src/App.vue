<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const environmentLabel = import.meta.env.DEV ? '开发环境' : '构建预览'
</script>

<template>
  <div class="application">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <header class="site-header">
      <div class="header-inner">
        <RouterLink class="brand" to="/system/status" aria-label="校园自习室，返回系统状态">
          <span class="brand-symbol" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5c-3-2-6-1.5-8-1v14c2-.5 5-1 8 1 3-2 6-1.5 8-1V4c-2-.5-5-1-8 1Zm0 0v14"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span>校园自习室<span class="brand-description">让专注，自有一席之地</span></span>
        </RouterLink>
        <div class="header-meta">
          <span class="header-section">预约管理系统</span>
          <span class="environment-tag"><span aria-hidden="true" />{{ environmentLabel }}</span>
        </div>
      </div>
    </header>

    <main id="main-content" class="main-content">
      <RouterView />
    </main>

    <footer class="site-footer">
      <span>校园自习室预约管理系统</span>
      <span class="footer-caption">每一份专注，都值得被认真守护。</span>
    </footer>
  </div>
</template>

<style scoped>
.application {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.site-header {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.skip-link {
  position: absolute;
  z-index: 10;
  top: 12px;
  left: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #fff;
  background: var(--accent);
  text-decoration: none;
  transform: translateY(-150%);
}

.skip-link:focus {
  transform: translateY(0);
}

.header-inner {
  width: min(1040px, calc(100% - 64px));
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: 0 auto;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.brand-symbol {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  color: var(--highlight);
  background: var(--accent);
}

.brand-symbol svg {
  width: 26px;
  height: 26px;
}

.brand-description {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-section {
  color: var(--text-secondary);
  font-size: 12px;
}

.environment-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-secondary);
  background: #f8faf6;
  font-size: 11px;
  white-space: nowrap;
}

.main-content {
  flex: 1;
  width: min(1040px, calc(100% - 64px));
  margin: 0 auto;
  padding: 46px 0 48px;
}

.environment-tag span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #668351;
}

.site-footer {
  display: flex;
  width: min(1040px, calc(100% - 64px));
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto;
  padding: 22px 0;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .header-inner,
  .main-content,
  .site-footer {
    width: calc(100% - 40px);
  }

  .header-inner {
    min-height: 68px;
    gap: 12px;
  }

  .brand {
    gap: 9px;
    font-size: 15px;
  }

  .brand-symbol {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .brand-description {
    font-size: 10px;
  }

  .header-section,
  .footer-caption {
    display: none;
  }

  .main-content {
    padding: 26px 0 30px;
  }

  .site-footer {
    justify-content: center;
    padding: 18px 0;
  }
}
</style>
