import type { App } from 'vue'
import type { AuthAdapter } from '@admin/core'
import { hasPermission } from '@admin/core'
import { setActiveAuth, vPerm } from '@admin/auth'

// 演示用认证适配器。接入真实后端时替换为 createHttpAuth({ meUrl, loginUrl })。
const PERMISSIONS = ['*']

export function createMockAuth(): AuthAdapter {
  let loggedIn = false
  const listeners = new Set<() => void>()

  const adapter: AuthAdapter = {
    async load() {
      if (!loggedIn) throw new Error('未登录')
      return {
        user: { id: 'u_1', name: '管理员' },
        roles: ['admin'],
        permissions: PERMISSIONS,
      }
    },
    getSnapshot() {
      return loggedIn
        ? { user: { id: 'u_1', name: '管理员' }, roles: ['admin'], permissions: PERMISSIONS }
        : null
    },
    isAuthenticated() {
      return loggedIn
    },
    can(required, mode = 'any') {
      return hasPermission(PERMISSIONS, required, mode)
    },
    async login() {
      loggedIn = true
      listeners.forEach((listener) => listener())
    },
    async logout() {
      loggedIn = false
      listeners.forEach((listener) => listener())
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
