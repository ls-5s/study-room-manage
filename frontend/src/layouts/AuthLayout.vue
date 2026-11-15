<script setup lang="ts">
import { Reading } from '@element-plus/icons-vue'
import { RouterLink, RouterView } from 'vue-router'
import ThemeToggle from '../components/ThemeToggle.vue'
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
      <div class="auth-actions">
        <el-tag effect="plain" round>账号中心</el-tag>
        <ThemeToggle />
      </div>
    </header>

    <main id="auth-content" class="auth-content" tabindex="-1">
      <div class="auth-stage">
        <aside class="auth-story" aria-label="校园自习室介绍">
          <p class="story-eyebrow">CAMPUS STUDY / SPACE</p>
          <h2>给每一次专注，<br />留一张安静的桌面。</h2>
          <p class="story-summary">
            预约、签到、问题反馈与空间数据汇集在同一处。清晰的状态和克制的时间提醒，让使用过程保持简单。
          </p>
          <div class="story-notes">
            <span><strong>01</strong> 找到合适空间</span>
            <span><strong>02</strong> 按计划完成签到</span>
            <span><strong>03</strong> 保持空间有序</span>
          </div>
          <div class="story-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </aside>
        <div class="auth-form-stage">
          <RouterView />
        </div>
      </div>
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
  background: var(--canvas);
}

.auth-shell::before {
  position: absolute;
  top: 8%;
  right: -120px;
  width: 360px;
  height: 360px;
  border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.auth-shell::after {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 8%, var(--gradient-accent), transparent 30rem),
    radial-gradient(circle at 88% 76%, var(--gradient-secondary), transparent 34rem),
    radial-gradient(circle at 74% 16%, var(--gradient-warm), transparent 22rem),
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size:
    auto,
    auto,
    64px 64px,
    64px 64px;
  content: '';
  opacity: 0.34;
  mask-image: linear-gradient(to bottom, #000, transparent 72%);
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
  z-index: 1;
  width: min(100%, 1180px);
  margin-inline: auto;
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 32px;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  color: var(--action-text);
  background: var(--action);
  box-shadow: 0 8px 20px rgb(0 0 0 / 12%);
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

.auth-stage {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 0.86fr) minmax(420px, 1.14fr);
  gap: clamp(40px, 6vw, 80px);
  align-items: center;
}

.auth-story {
  position: relative;
  max-width: 480px;
  padding: 32px 0;
}

.story-eyebrow {
  margin: 0;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.auth-story h2 {
  margin: 24px 0 0;
  color: var(--text);
  font-size: clamp(2.25rem, 4vw, 3.5rem);
  font-weight: 600;
  letter-spacing: -0.05em;
  line-height: 1.05;
}

.story-summary {
  max-width: 460px;
  margin: 24px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.8;
}

.story-notes {
  display: grid;
  gap: 0;
  margin-top: 48px;
  border-top: 1px solid var(--border);
}

.story-notes span {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.story-notes strong {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 500;
}

.story-orbit {
  position: absolute;
  z-index: -1;
  top: -56px;
  right: -40px;
  width: 280px;
  height: 280px;
  border: 1px solid var(--border);
  border-radius: 50%;
}

.story-orbit::before,
.story-orbit::after {
  position: absolute;
  border: 1px solid var(--border);
  border-radius: 50%;
  content: '';
}

.story-orbit::before {
  inset: 36px;
}

.story-orbit::after {
  inset: 82px;
}

.story-orbit span {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 6px var(--accent-soft);
}

.story-orbit span:nth-child(1) {
  top: 40px;
  left: 62px;
}

.story-orbit span:nth-child(2) {
  right: 28px;
  bottom: 92px;
}

.story-orbit span:nth-child(3) {
  bottom: 38px;
  left: 108px;
}

.auth-form-stage {
  min-width: 0;
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
  color: var(--accent);
  font-weight: 500;
  text-decoration: none;
}

.auth-footer a:hover {
  color: var(--accent-hover);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-content:focus {
  outline: none;
}

@media (max-width: 940px) {
  .auth-stage {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .auth-story {
    max-width: 720px;
    padding: 0;
  }

  .story-notes,
  .story-orbit {
    display: none;
  }
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

  .auth-stage {
    grid-template-columns: 1fr;
  }

  .auth-story {
    padding: 8px 0 0;
  }

  .auth-story h2 {
    font-size: 2rem;
  }

  .story-notes,
  .story-orbit {
    display: none;
  }

  .auth-footer {
    justify-content: center;
  }

  .auth-footer span {
    display: none;
  }

  .auth-actions .el-tag {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}
</style>
