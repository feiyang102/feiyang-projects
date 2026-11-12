import { computed, ref, watch } from 'vue'
import type { ThemeOptions, ThemePreference, ThemeState } from './types'

const STORAGE_KEY = 'admin:theme-mode'

type Mode = 'light' | 'dark'
type Desired = ThemePreference

function safeRead(): Desired | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' || value === 'system' ? value : null
  } catch {
    return null
  }
}

function safeWrite(value: Desired) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // 忽略存储不可用
  }
}

function readFromUrl(): Desired | null {
  try {
    const value = new URLSearchParams(window.location.search).get('theme')
    return value === 'light' || value === 'dark' || value === 'system' ? value : null
  } catch {
    return null
  }
}

export function createThemeState(options: ThemeOptions = {}): ThemeState {
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null

  const fromUrl = readFromUrl()
  const desired = ref<Desired>(fromUrl ?? safeRead() ?? options.mode ?? 'light')
  if (fromUrl) safeWrite(fromUrl)

  const mode = computed<Mode>(() => {
    if (desired.value === 'system') return media?.matches ? 'dark' : 'light'
    return desired.value
  })

  const applied = new Set<string>()

  function apply() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.dataset.adminTheme = mode.value
    root.classList.toggle('dark', mode.value === 'dark')

    for (const key of applied) root.style.removeProperty(key)
    applied.clear()

    const tokens = {
      ...(options.tokens ?? {}),
      ...(mode.value === 'dark' ? options.dark ?? {} : options.light ?? {}),
    }
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(key, value)
      applied.add(key)
    }
  }

  if (media) {
    media.addEventListener?.('change', () => {
      if (desired.value === 'system') apply()
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) return
      const value = event.newValue
      if (value === 'light' || value === 'dark' || value === 'system') {
        desired.value = value
        apply()
      }
    })
  }

  apply()
  watch(mode, apply)

  return {
    mode,
    preference: desired,
    setMode(next) {
      desired.value = next
      safeWrite(next)
      apply()
    },
    toggle() {
      const next: Mode = mode.value === 'dark' ? 'light' : 'dark'
      desired.value = next
      safeWrite(next)
      apply()
    },
  }
}
