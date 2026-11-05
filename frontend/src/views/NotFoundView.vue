<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found">
    <p class="error-code">404</p>
    <h1 class="error-title">页面不存在</h1>
    <p class="error-description">当前地址没有对应的页面，请检查地址或返回系统状态。</p>
    <RouterLink class="button button-primary" to="/system/status">返回系统状态</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  padding: 70px 0;
  text-align: center;
}

.error-code {
  margin: 0;
  color: var(--accent);
  font-size: 58px;
  font-weight: 650;
}

.error-title {
  margin: 16px 0 12px;
  font-size: 27px;
}

.error-description {
  margin: 0 0 28px;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.8;
}
</style>
