// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { THEME_PRESETS, useThemeColor } from './use-theme-color'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  useThemeColor().reset()
})

describe('useThemeColor', () => {
  it('exposes preset colors', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(6)
  })

  it('applies and persists a custom primary color', () => {
    const { primary, set } = useThemeColor()
    set('#ff0000')

    expect(primary.value).toBe('#ff0000')
    expect(document.documentElement.style.getPropertyValue('--admin-color-primary')).toBe('#ff0000')
    expect(localStorage.getItem('admin:primary-color')).toBe('#ff0000')
  })

  it('removes the custom color on reset', () => {
    const { primary, set, reset } = useThemeColor()
    set('#00ff00')
    reset()

    expect(primary.value).toBe('')
    expect(document.documentElement.style.getPropertyValue('--admin-color-primary')).toBe('')
    expect(localStorage.getItem('admin:primary-color')).toBeNull()
  })
})
