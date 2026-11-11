<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

const actionLabel = computed(() => (themeStore.isDark ? '切换到浅色主题' : '切换到深色主题'))
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="actionLabel"
    :aria-pressed="themeStore.isDark"
    :title="actionLabel"
    @click="themeStore.toggleTheme"
  >
    <el-icon aria-hidden="true">
      <Sunny v-if="themeStore.isDark" />
      <Moon v-else />
    </el-icon>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: 50%;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--surface) 74%, transparent);
  cursor: pointer;
  transition:
    color 300ms var(--ease-out),
    border-color 300ms var(--ease-out),
    background-color 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.theme-toggle:hover {
  color: var(--accent);
  border-color: var(--control-border);
  background: var(--surface-raised);
}

.theme-toggle:active {
  transform: scale(0.96);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}

.theme-toggle .el-icon {
  font-size: 17px;
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle {
    transition: none;
  }
}
</style>
