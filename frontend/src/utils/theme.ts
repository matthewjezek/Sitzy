export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_CHANGED_EVENT = 'theme-changed'
const THEME_STORAGE_KEY = 'theme'

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function getThemePreference(): ThemePreference {
  const storedValue = localStorage.getItem(THEME_STORAGE_KEY)
  if (isThemePreference(storedValue)) {
    return storedValue
  }
  return 'system'
}

export function resolveThemePreference(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

export function applyThemePreference(preference: ThemePreference): 'light' | 'dark' {
  const resolvedTheme = resolveThemePreference(preference)

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  document.documentElement.classList.toggle('light', resolvedTheme === 'light')
  localStorage.setItem(THEME_STORAGE_KEY, preference)

  let metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta')
    metaThemeColor.name = 'theme-color'
    document.head.appendChild(metaThemeColor)
  }

  metaThemeColor.content = resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'

  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, {
    detail: {
      preference,
      resolvedTheme,
    },
  }))

  return resolvedTheme
}
