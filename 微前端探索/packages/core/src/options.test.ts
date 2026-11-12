import { afterEach, describe, expect, it, vi } from 'vitest'
import { normalizeOptions, resetWarnings } from './options'

afterEach(() => {
  resetWarnings()
  vi.restoreAllMocks()
})

describe('normalizeOptions', () => {
  it('applies defaults', () => {
    const options = normalizeOptions({
      configVersion: 1,
      app: { name: 'console', title: '后台' },
    })
    expect(options.router).toEqual({ base: '/', mode: 'history' })
    expect(options.modules).toEqual([])
    expect(options.routes).toEqual([])
    expect(options.loginPath).toBe('/login')
  })

  it('warns when configVersion is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    normalizeOptions({ app: { name: 'console', title: '后台' } } as never)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('configVersion'))
  })

  it('warns once for unknown fields', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    normalizeOptions({ configVersion: 1, app: { name: 'a', title: 'b' }, legacy: true } as never)
    normalizeOptions({ configVersion: 1, app: { name: 'a', title: 'b' }, legacy: true } as never)
    expect(warn.mock.calls.filter(([message]) => String(message).includes('legacy'))).toHaveLength(1)
  })

  it('throws with field path when app is invalid', () => {
    expect(() => normalizeOptions({ configVersion: 1, app: { name: '' } } as never)).toThrowError(/app\.name/)
  })
})
