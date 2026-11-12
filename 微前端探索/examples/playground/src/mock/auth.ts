import type { App } from 'vue'
import type { AuthAdapter, AuthSnapshot } from '@admin/core'
import { hasPermission } from '@admin/core'
import { setActiveAuth, vPerm } from '@admin/auth'

const STORAGE_KEY = 'playground:auth'

const ADMIN: AuthSnapshot = {
  user: { id: 'u_admin', name: '管理员' },
  roles: ['admin'],
  permissions: ['*'],
  permissionsVersion: '2026-11-12T00:00:00Z',
}

const GUEST: AuthSnapshot = {
  user: { id: 'u_guest', name: '访客' },
  roles: ['guest'],
  permissions: ['dashboard:view', 'system:view', 'system:user:list', 'form:demo:view'],
  permissionsVersion: '2026-11-12T00:00:00Z',
}

function restore(): AuthSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthSnapshot) : null
  } catch {
    return null
  }
}

function persist(snapshot: AuthSnapshot | null) {
  try {
    if (snapshot) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // 忽略存储不可用
  }
}

export function createMockAuth(): AuthAdapter {
  let snapshot = restore()
  const listeners = new Set<() => void>()

  const notify = () => listeners.forEach((listener) => listener())

  const adapter: AuthAdapter = {
    async load() {
      if (!snapshot) throw new Error('未登录')
      return snapshot
    },
    getSnapshot() {
      return snapshot
    },
    isAuthenticated() {
      return snapshot !== null
    },
    can(required, mode = 'any') {
      return hasPermission(snapshot?.permissions ?? [], required, mode)
    },
    async login(payload) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const username = (payload as { username?: string } | undefined)?.username
      snapshot = username === 'guest' ? { ...GUEST } : { ...ADMIN }
      persist(snapshot)
      notify()
    },
    async logout() {
      snapshot = null
      persist(null)
      notify()
    },
    async refresh() {
      if (!snapshot) throw new Error('未登录')
      return snapshot
    },
    subscribe(handler) {
      listeners.add(handler)
      return () => listeners.delete(handler)
    },
    install(app: App) {
      setActiveAuth(adapter)
      app.directive('perm', vPerm)
    },
  }

  return adapter
}
