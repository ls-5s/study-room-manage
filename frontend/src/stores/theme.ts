import { computed, readonly, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import { applyTheme, getAppliedTheme, persistTheme, type AppTheme } from '../utils/theme'

export const useThemeStore = defineStore('theme', () => {
  const themeState = shallowRef<AppTheme>(getAppliedTheme())

  const isDark = computed(() => themeState.value === 'dark')

  watch(
    themeState,
    (theme) => {
      applyTheme(theme)
      persistTheme(theme)
    },
    { flush: 'sync' },
  )

  function toggleTheme() {
    themeState.value = themeState.value === 'dark' ? 'light' : 'dark'
  }

  return {
    theme: readonly(themeState),
    isDark,
    toggleTheme,
  }
})
