import { ref } from 'vue'

const STORAGE_KEY = 'admin:primary-color'

export interface ThemePreset {
  name: string
  value: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { name: '拂晓蓝', value: '#3b6cf6' },
  { name: '极光紫', value: '#7c5cfc' },
  { name: '薄荷绿', value: '#10b981' },
  { name: '暖橙', value: '#f97316' },
  { name: '玫红', value: '#ec4899' },
  { name: '石墨', value: '#475569' },
]

const primary = ref('')

function apply(value: string) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (value) root.style.setProperty('--admin-color-primary', value)
  else root.style.removeProperty('--admin-color-primary')
}

try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    primary.value = saved
    apply(saved)
  }
} catch {
  // 忽略存储不可用
}

export function useThemeColor() {
  function set(value: string) {
    primary.value = value
    apply(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // 忽略存储不可用
    }
  }

  function reset() {
    primary.value = ''
    apply('')
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 忽略存储不可用
    }
  }

  return { primary, presets: THEME_PRESETS, set, reset }
}
