<script setup lang="ts">
import { Back } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <section class="not-found" aria-labelledby="not-found-title">
    <el-result>
      <template #icon>
        <p class="error-code" aria-hidden="true">404</p>
      </template>
      <template #title>
        <h1 id="not-found-title" class="error-title">页面不存在</h1>
      </template>
      <template #sub-title>
        <p class="error-description">当前地址没有对应的页面，请检查地址或返回自习室首页。</p>
      </template>
      <template #extra>
        <el-button type="primary" @click="router.push('/home')">
          <el-icon><Back /></el-icon>
          <span>返回首页</span>
        </el-button>
      </template>
    </el-result>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: 60svh;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.not-found :deep(.el-result) {
  padding: 48px 24px;
}

.error-code {
  margin: 0;
  color: var(--accent);
  font-size: 3.75rem;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
}

.error-title {
  margin: 0;
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 2rem;
}

.error-description {
  max-width: 28rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5rem;
}
</style>
