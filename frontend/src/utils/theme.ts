export type AppTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'study-room-theme'

function isAppTheme(value: string | null): value is AppTheme {
  return value === 'light' || value === 'dark'
}

export function resolveInitialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'light'

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isAppTheme(storedTheme)) return storedTheme
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getAppliedTheme(): AppTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0f1822' : '#1f4e79')
}

export function persistTheme(theme: AppTheme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The selected theme still applies for the current page when storage is unavailable.
  }
}

export function initializeTheme(): AppTheme {
  const theme = resolveInitialTheme()
  applyTheme(theme)
  return theme
}
