import { describe, expect, it, vi } from 'vitest'
import { createDictionary } from './dictionary'

const statusItems = [
  { label: '启用', value: 'active', color: 'success' },
  { label: '停用', value: 'disabled', color: 'info' },
]

describe('createDictionary', () => {
  it('caches loaded items', async () => {
    const loader = vi.fn(async () => statusItems)
    const dict = createDictionary()
    dict.register('status', loader)

    await dict.load('status')
    await dict.load('status')

    expect(loader).toHaveBeenCalledTimes(1)
    expect(dict.get('status')).toEqual(statusItems)
  })

  it('deduplicates concurrent loads', async () => {
    const loader = vi.fn(async () => statusItems)
    const dict = createDictionary()
    dict.register('status', loader)

    await Promise.all([dict.load('status'), dict.load('status'), dict.load('status')])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('reloads when forced', async () => {
    const loader = vi.fn(async () => statusItems)
    const dict = createDictionary()
    dict.register('status', loader)

    await dict.load('status')
    await dict.load('status', true)
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('expires entries after ttl', async () => {
    const loader = vi.fn(async () => statusItems)
    const dict = createDictionary({ ttl: 1 })
    dict.register('status', loader)

    await dict.load('status')
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(dict.get('status')).toBeUndefined()
    await dict.load('status')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('throws for unregistered codes', async () => {
    const dict = createDictionary()
    await expect(dict.load('missing')).rejects.toThrowError(/not registered/)
  })

  it('resolves labels with fallback', async () => {
    const dict = createDictionary()
    dict.register('status', async () => statusItems)
    await dict.load('status')

    expect(dict.label('status', 'active')).toBe('启用')
    expect(dict.label('status', 'unknown')).toBe('unknown')
    expect(dict.label('status', null)).toBe('-')
  })

  it('clears cache', async () => {
    const loader = vi.fn(async () => statusItems)
    const dict = createDictionary()
    dict.register('status', loader)

    await dict.load('status')
    dict.clear('status')
    expect(dict.get('status')).toBeUndefined()
  })
})
