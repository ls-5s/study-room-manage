<script setup lang="ts">
import { Lock } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const homePath = computed(() => auth.homePath)
</script>

<template>
  <section class="forbidden-page" aria-labelledby="forbidden-title">
    <div class="forbidden-icon" aria-hidden="true">
      <el-icon><Lock /></el-icon>
    </div>
    <p class="forbidden-code">403</p>
    <h1 id="forbidden-title" class="forbidden-title">当前账号无权访问</h1>
    <p class="forbidden-summary">该页面仅对具备相应角色的账号开放。</p>
    <RouterLink :to="homePath">
      <el-button type="primary">返回工作台</el-button>
    </RouterLink>
  </section>
</template>

<style scoped>
.forbidden-page {
  display: grid;
  min-height: 62svh;
  place-items: center;
  align-content: center;
  padding: 48px 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(24px);
  text-align: center;
}

.forbidden-icon {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: var(--radius-lg);
  color: var(--status-warn);
  background: var(--status-warn-tint);
  font-size: 30px;
}

.forbidden-code {
  margin: 20px 0 0;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.12em;
}

.forbidden-title {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
}

.forbidden-summary {
  margin: 10px 0 24px;
  color: var(--text-secondary);
  font-size: 1rem;
}
</style>
