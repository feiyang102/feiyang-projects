// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpAuth } from './http-auth'

const ME = {
  user: { id: 'u1', name: 'Tester' },
  roles: ['admin'],
  permissions: ['*'],
  permissionsVersion: 'v1',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('createHttpAuth', () => {
  it('deduplicates concurrent load calls', async () => {
    const request = vi.fn(async () => json(ME))
    const auth = createHttpAuth({ meUrl: '/me', request })

    const [a, b] = await Promise.all([auth.load(), auth.load()])
    expect(request).toHaveBeenCalledTimes(1)
    expect(a.user.name).toBe('Tester')
    expect(b).toBe(a)
  })

  it('clears state and throws on 401', async () => {
    const request = vi.fn(async () => json({ message: 'no' }, 401))
    const auth = createHttpAuth({ meUrl: '/me', request })

    await expect(auth.load()).rejects.toThrowError(/Unauthorized/)
    expect(auth.getSnapshot()).toBeNull()
    expect(auth.isAuthenticated()).toBe(false)
  })

  it('persists snapshot and restores it in a new instance', async () => {
    const auth = createHttpAuth({ meUrl: '/me', request: async () => json(ME) })
    await auth.load()

    const restored = createHttpAuth({ meUrl: '/me', request: async () => json(ME) })
    expect(restored.getSnapshot()?.user.name).toBe('Tester')
  })

  it('logs in by calling login endpoint then loading the profile', async () => {
    const request = vi.fn(async (url: string) => {
      if (url === '/login') return json({ ok: true })
      return json(ME)
    })
    const auth = createHttpAuth({ meUrl: '/me', loginUrl: '/login', request })

    await auth.login({ username: 'admin' })
    expect(auth.isAuthenticated()).toBe(true)
    expect(auth.can('anything:at:all')).toBe(true)
    expect(request.mock.calls.map(([url]) => url)).toEqual(['/login', '/me'])
  })

  it('notifies subscribers on login and logout', async () => {
    const auth = createHttpAuth({
      meUrl: '/me',
      loginUrl: '/login',
      request: async (url: string) => (url === '/login' ? json({ ok: true }) : json(ME)),
    })
    const handler = vi.fn()
    auth.subscribe?.(handler)

    await auth.login()
    expect(handler).toHaveBeenCalled()

    await auth.logout()
    expect(handler).toHaveBeenCalledTimes(2)
    expect(auth.isAuthenticated()).toBe(false)
  })

  it('clears state when another tab broadcasts logout', async () => {
    const auth = createHttpAuth({ meUrl: '/me', request: async () => json(ME) })
    await auth.load()
    expect(auth.isAuthenticated()).toBe(true)

    const other = createHttpAuth({ meUrl: '/me', request: async () => json(ME), storageKey: 'admin:auth' })
    await other.load()
    await other.logout()

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'admin:auth:signal',
        newValue: JSON.stringify({ type: 'logout', at: Date.now() }),
      }),
    )

    expect(auth.isAuthenticated()).toBe(false)
  })
})
