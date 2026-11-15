import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

function readToken(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export function useChartTheme() {
  const themeStore = useThemeStore()

  return computed(() => {
    void themeStore.theme

    return {
      primary: readToken('--accent', '#7db9cd'),
      success: readToken('--status-ok', '#67ad88'),
      warning: readToken('--status-warn', '#c9a158'),
      danger: readToken('--status-bad', '#d57b76'),
      info: readToken('--status-info', '#7db9cd'),
      text: readToken('--text-secondary', '#b8c1c6'),
      muted: readToken('--text-muted', '#849198'),
      grid: readToken('--chart-grid', 'rgba(132, 145, 152, 0.16)'),
      tooltip: readToken('--chart-tooltip', '#151c21'),
      surface: readToken('--surface-raised', '#151c21'),
    }
  })
}
