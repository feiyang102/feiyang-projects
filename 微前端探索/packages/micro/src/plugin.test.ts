import { describe, expect, it, vi } from 'vitest'
import { createMicroPlugin } from './plugin'
import type { MicroAppDefinition } from '@admin/core'

const valid = {
  name: 'order',
  entry: 'http://localhost:5174',
  basePath: '/order',
} as MicroAppDefinition

describe('createMicroPlugin', () => {
  it('keeps valid definitions and exposes the host component', () => {
    const plugin = createMicroPlugin([valid])
    expect(plugin.apps).toHaveLength(1)
    expect(plugin.component).toBeTruthy()
  })

  it('skips definitions missing required fields and reports them', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const plugin = createMicroPlugin([
      valid,
      { name: 'no-entry', basePath: '/x' } as MicroAppDefinition,
      { name: 'no-base', entry: 'http://x' } as MicroAppDefinition,
      { entry: 'http://x', basePath: '/y' } as MicroAppDefinition,
    ])

    expect(plugin.apps.map((app) => app.name)).toEqual(['order'])
    expect(error).toHaveBeenCalledTimes(3)
    error.mockRestore()
  })

  it('rejects non-http entries', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const plugin = createMicroPlugin([
      { name: 'js', entry: 'javascript:alert(1)', basePath: '/js' } as MicroAppDefinition,
      { name: 'file', entry: 'file:///tmp/index.html', basePath: '/file' } as MicroAppDefinition,
    ])

    expect(plugin.apps).toHaveLength(0)
    expect(error).toHaveBeenCalledTimes(2)
    error.mockRestore()
  })

  it('enforces the allowed origins list', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const plugin = createMicroPlugin(
      [
        { name: 'trusted', entry: 'https://admin.example.com/order', basePath: '/order' },
        { name: 'sub', entry: 'https://sub.admin.example.com/app', basePath: '/sub' },
        { name: 'evil', entry: 'https://evil.com/app', basePath: '/evil' },
      ] as MicroAppDefinition[],
      { allowedOrigins: ['https://admin.example.com', '*.admin.example.com'] },
    )

    expect(plugin.apps.map((app) => app.name)).toEqual(['trusted', 'sub'])
    expect(error).toHaveBeenCalledTimes(1)
    error.mockRestore()
  })

  it('allows any http entry when no allow list is configured', () => {
    const plugin = createMicroPlugin([
      { name: 'any', entry: 'http://localhost:5174', basePath: '/any' } as MicroAppDefinition,
    ])
    expect(plugin.apps).toHaveLength(1)
  })
})
