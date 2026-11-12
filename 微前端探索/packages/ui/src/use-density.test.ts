// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useDensity } from './use-density'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.adminDensity
})

describe('useDensity', () => {
  it('applies the default density', () => {
    const { density } = useDensity()
    expect(density.value).toBe('comfortable')
    expect(document.documentElement.dataset.adminDensity).toBe('comfortable')
  })

  it('persists and applies the compact density', async () => {
    const { setDensity } = useDensity()
    setDensity('compact')
    await nextTick()

    expect(document.documentElement.dataset.adminDensity).toBe('compact')
    expect(localStorage.getItem('admin:density')).toBe('compact')
  })

  it('restores the stored density', () => {
    localStorage.setItem('admin:density', 'compact')
    const { density } = useDensity()
    expect(density.value).toBe('compact')
    expect(document.documentElement.dataset.adminDensity).toBe('compact')
  })
})
