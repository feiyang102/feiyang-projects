// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNotificationCenter } from './notification'
import type { NotificationItem } from './notification'

const list: NotificationItem[] = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
]

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createNotificationCenter', () => {
  it('loads items and applies persisted read state', async () => {
    localStorage.setItem('admin:notifications-read', JSON.stringify(['a']))
    const center = createNotificationCenter({ fetch: async () => list, interval: 0 })

    await center.refresh()
    expect(center.items.value.map((item) => item.read)).toEqual([true, false])
    expect(center.unread.value).toBe(1)
  })

  it('marks one item and all items as read, persisting the result', async () => {
    const center = createNotificationCenter({ fetch: async () => list, interval: 0 })
    await center.refresh()

    center.read('a')
    expect(center.unread.value).toBe(1)
    expect(JSON.parse(localStorage.getItem('admin:notifications-read') ?? '[]')).toContain('a')

    center.readAll()
    expect(center.unread.value).toBe(0)

    const next = createNotificationCenter({ fetch: async () => list, interval: 0 })
    await next.refresh()
    expect(next.unread.value).toBe(0)
  })

  it('keeps existing items when a refresh fails', async () => {
    let fail = false
    const center = createNotificationCenter({
      fetch: async () => {
        if (fail) throw new Error('network')
        return list
      },
      interval: 0,
    })

    await center.refresh()
    expect(center.items.value).toHaveLength(2)

    fail = true
    await center.refresh()
    expect(center.items.value).toHaveLength(2)
    expect(center.loading.value).toBe(false)
  })

  it('polls on the interval until stopped', async () => {
    vi.useFakeTimers()
    const fetch = vi.fn(async () => list)
    const center = createNotificationCenter({ fetch, interval: 1000 })

    center.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(fetch).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(3000)
    expect(fetch).toHaveBeenCalledTimes(4)

    center.stop()
    await vi.advanceTimersByTimeAsync(3000)
    expect(fetch).toHaveBeenCalledTimes(4)
  })
})
