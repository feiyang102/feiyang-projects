// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createThemeState } from './theme'

function reset() {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
  document.documentElement.removeAttribute('data-admin-theme')
  document.documentElement.classList.remove('dark')
  document.documentElement.removeAttribute('style')
}

beforeEach(reset)

describe('createThemeState', () => {
  it('defaults to light and applies dataset', () => {
    const theme = createThemeState()
    expect(theme.mode.value).toBe('light')
    expect(document.documentElement.dataset.adminTheme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles mode, dataset, class and persistence', () => {
    const theme = createThemeState({ mode: 'light' })
    theme.toggle()
    expect(theme.mode.value).toBe('dark')
    expect(document.documentElement.dataset.adminTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('admin:theme-mode')).toBe('dark')

    theme.toggle()
    expect(theme.mode.value).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('restores the persisted mode', () => {
    localStorage.setItem('admin:theme-mode', 'dark')
    const theme = createThemeState()
    expect(theme.mode.value).toBe('dark')
    expect(theme.preference.value).toBe('dark')
  })

  it('resolves the system preference from matchMedia', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const theme = createThemeState({ mode: 'system' })
    expect(theme.preference.value).toBe('system')
    expect(theme.mode.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    theme.setMode('light')
    expect(theme.preference.value).toBe('light')
    expect(theme.mode.value).toBe('light')
    vi.unstubAllGlobals()
  })

  it('accepts mode from url', () => {
    window.history.replaceState({}, '', '/dashboard?theme=dark')
    const theme = createThemeState()
    expect(theme.mode.value).toBe('dark')
  })

  it('syncs preference changes from other tabs', () => {
    const theme = createThemeState({ mode: 'light' })
    localStorage.setItem('admin:theme-mode', 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: 'admin:theme-mode', newValue: 'dark' }))

    expect(theme.preference.value).toBe('dark')
    expect(theme.mode.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies shared and mode-specific tokens', () => {
    const theme = createThemeState({
      mode: 'light',
      tokens: { '--admin-brand': 'brand' },
      light: { '--admin-color-bg': '#fff' },
      dark: { '--admin-color-bg': '#000' },
    })
    expect(document.documentElement.style.getPropertyValue('--admin-brand')).toBe('brand')
    expect(document.documentElement.style.getPropertyValue('--admin-color-bg')).toBe('#fff')

    theme.toggle()
    expect(document.documentElement.style.getPropertyValue('--admin-color-bg')).toBe('#000')
    expect(document.documentElement.style.getPropertyValue('--admin-brand')).toBe('brand')
  })
})
