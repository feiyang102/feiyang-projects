import { describe, expect, it, vi } from 'vitest'
import { createBridge } from './index'

describe('bridge', () => {
  it('delivers events to subscribers and supports unsubscribe', () => {
    const bridge = createBridge()
    const handler = vi.fn()
    const off = bridge.on('host:locale-change', handler)

    bridge.emit('host:locale-change', 'zh-CN')
    expect(handler).toHaveBeenCalledWith('zh-CN')

    off()
    bridge.emit('host:locale-change', 'en-US')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('resolves requests through providers', async () => {
    const bridge = createBridge()
    bridge.provide('auth:get-token', () => 'token-1')
    await expect(bridge.request('auth:get-token')).resolves.toBe('token-1')
  })

  it('rejects unknown request methods', async () => {
    const bridge = createBridge()
    await expect(bridge.request('missing')).rejects.toThrowError(/no provider/)
  })

  it('forwards local events to the transport', () => {
    const post = vi.fn()
    const bridge = createBridge({ post, subscribe: () => () => undefined })
    bridge.emit('app:error', { app: 'order', message: 'boom' })
    expect(post).toHaveBeenCalledWith('app:error', { app: 'order', message: 'boom' })
  })
})
