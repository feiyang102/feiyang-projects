import { shallowRef } from 'vue'
import { HttpError, hasPermission } from '@admin/core'
import type { ShallowRef } from 'vue'
import type { AdminUser, AuthAdapter, AuthSnapshot } from '@admin/core'
import { setActiveAuth } from './active'
import { vPerm } from './directive'

export interface HttpAuthOptions {
  meUrl: string
  loginUrl?: string
  logoutUrl?: string
  request?: (url: string, init?: RequestInit) => Promise<Response>
  pick?: (raw: unknown) => Partial<AuthSnapshot> & { user: AdminUser }
  loginBody?: (payload: unknown) => unknown
  storageKey?: string
  persist?: boolean
}

export interface HttpAuthAdapter extends AuthAdapter {
  snapshotRef: ShallowRef<AuthSnapshot | null>
}

function normalize(raw: Partial<AuthSnapshot> & { user: AdminUser }): AuthSnapshot {
  return {
    user: raw.user,
    roles: Array.isArray(raw.roles) ? raw.roles : [],
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    permissionsVersion: raw.permissionsVersion,
  }
}

export function createHttpAuth(options: HttpAuthOptions): HttpAuthAdapter {
  const requestFn = options.request ?? ((url: string, init?: RequestInit) => fetch(url, init))
  const storageKey = options.storageKey ?? 'admin:auth'
  const signalKey = `${storageKey}:signal`
  const persist = options.persist !== false
  const snapshotRef = shallowRef<AuthSnapshot | null>(null)
  const listeners = new Set<() => void>()
  let inflight: Promise<AuthSnapshot> | null = null

  function broadcast(type: 'logout') {
    try {
      localStorage.setItem(signalKey, JSON.stringify({ type, at: Date.now() }))
    } catch {
      // 忽略存储不可用
    }
  }

  if (persist) {
    try {
      const cached = sessionStorage.getItem(storageKey)
      if (cached) snapshotRef.value = JSON.parse(cached) as AuthSnapshot
    } catch {
      // 忽略存储不可用
    }
  }

  function notify() {
    listeners.forEach((listener) => listener())
  }

  function save(snapshot: AuthSnapshot | null) {
    snapshotRef.value = snapshot
    if (!persist) return
    try {
      if (snapshot) sessionStorage.setItem(storageKey, JSON.stringify(snapshot))
      else sessionStorage.removeItem(storageKey)
    } catch {
      // 忽略存储不可用
    }
  }

  function clear() {
    save(null)
    notify()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== signalKey || !event.newValue || !snapshotRef.value) return
      try {
        const signal = JSON.parse(event.newValue) as { type?: string }
        if (signal.type === 'logout') clear()
      } catch {
        // 忽略非法广播
      }
    })
  }

  async function doLoad(): Promise<AuthSnapshot> {
    const response = await requestFn(options.meUrl, { credentials: 'include' })
    if (response.status === 401) {
      clear()
      throw new HttpError(401, 'Unauthorized')
    }
    if (!response.ok) {
      throw new HttpError(response.status, response.statusText || 'failed to load current user')
    }
    const raw = (await response.json()) as unknown
    const picked = options.pick ? options.pick(raw) : (raw as Partial<AuthSnapshot> & { user: AdminUser })
    const snapshot = normalize(picked)
    save(snapshot)
    notify()
    return snapshot
  }

  const adapter: HttpAuthAdapter = {
    snapshotRef,
    load() {
      if (inflight) return inflight
      inflight = doLoad().finally(() => {
        inflight = null
      })
      return inflight
    },
    getSnapshot() {
      return snapshotRef.value
    },
    isAuthenticated() {
      return snapshotRef.value !== null
    },
    can(required, mode = 'any') {
      return hasPermission(snapshotRef.value?.permissions ?? [], required, mode)
    },
    async login(payload?: unknown) {
      if (!options.loginUrl) {
        throw new Error('[admin-auth] loginUrl is required to use login()')
      }
      const response = await requestFn(options.loginUrl, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options.loginBody ? options.loginBody(payload) : payload ?? {}),
      })
      if (!response.ok) {
        throw new HttpError(response.status, response.statusText || 'login failed')
      }
      await doLoad()
    },
    async logout() {
      if (options.logoutUrl) {
        try {
          await requestFn(options.logoutUrl, { method: 'POST', credentials: 'include' })
        } catch {
          // 忽略登出请求失败，本地状态仍需清理
        }
      }
      clear()
      broadcast('logout')
    },
    async refresh() {
      return doLoad()
    },
    subscribe(handler: () => void) {
      listeners.add(handler)
      return () => listeners.delete(handler)
    },
    install(app) {
      setActiveAuth(adapter)
      app.directive('perm', vPerm)
    },
  }

  return adapter
}
