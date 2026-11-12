// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import type { AdminApp, AuthAdapter, AuthSnapshot, MicroAppDefinition } from './types'
import { createAdminApp, defineModule, hasPermission } from './index'

const dashboardModule = defineModule({
  name: 'dashboard',
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: { render: () => h('div', 'dashboard') },
      meta: { title: '工作台', permission: 'dashboard:view', affix: true },
    },
  ],
})

const systemModule = defineModule({
  name: 'system',
  routes: [
    {
      path: '/system',
      meta: { title: '系统管理', permission: 'system:view' },
      children: [
        {
          path: 'user',
          name: 'SystemUser',
          component: { render: () => h('div', 'user') },
          meta: { title: '用户管理', permission: 'system:user:list' },
        },
      ],
    },
  ],
})

const loginComponent = { render: () => h('div', 'login-page') }

let activeApp: AdminApp | null = null

function createAuth(initial: string[], loggedIn = true) {
  let permissions = initial
  let version = 'v1'
  let snapshot: AuthSnapshot | null = loggedIn
    ? { user: { id: 'u1', name: 'Tester' }, roles: ['admin'], permissions, permissionsVersion: version }
    : null
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())

  const adapter: AuthAdapter = {
    async load() {
      if (!snapshot) throw new Error('not logged in')
      return snapshot
    },
    getSnapshot: () => snapshot,
    isAuthenticated: () => snapshot !== null,
    can: (required, mode = 'any') => hasPermission(permissions, required, mode),
    async login() {
      snapshot = { user: { id: 'u1', name: 'Tester' }, roles: ['admin'], permissions, permissionsVersion: version }
      emit()
    },
    async logout() {
      snapshot = null
      emit()
    },
    subscribe(handler) {
      listeners.add(handler)
      return () => listeners.delete(handler)
    },
  }

  return Object.assign(adapter, {
    setPermissions(next: string[], nextVersion = 'v2') {
      permissions = next
      version = nextVersion
      if (snapshot) snapshot = { ...snapshot, permissions: next, permissionsVersion: version }
      emit()
    },
  })
}

async function mountApp(options: {
  auth?: AuthAdapter
  modules?: ReturnType<typeof defineModule>[]
  menuFetch?: () => Promise<{ key: string; title?: string }[]>
  microApps?: MicroAppDefinition[]
  hooks?: Record<string, unknown>
  errorReporter?: (error: unknown, info: string) => void
}) {
  const app = createAdminApp({
    configVersion: 1,
    app: { name: 'test-app', title: '测试后台' },
    auth: options.auth ?? createAuth(['*']),
    layout: false,
    loginComponent,
    router: { history: createMemoryHistory() },
    modules: options.modules ?? [dashboardModule, systemModule],
    menu: options.menuFetch ? { fetch: options.menuFetch, timeout: 100 } : undefined,
    micro: options.microApps
      ? { apps: options.microApps, component: { render: () => h('div', 'micro-host') } }
      : undefined,
    hooks: options.hooks as never,
    errorReporter: options.errorReporter,
  })
  const container = document.createElement('div')
  document.body.appendChild(container)
  await app.mount(container)
  activeApp = app
  return { app, container }
}

afterEach(() => {
  activeApp?.unmount()
  activeApp = null
  document.body.innerHTML = ''
})

describe('createAdminApp', () => {
  it('mounts with accessible routes and derived menu', async () => {
    const { app } = await mountApp({ auth: createAuth(['dashboard:view', 'system:view', 'system:user:list']) })

    expect(app.router.currentRoute.value.path).toBe('/dashboard')
    expect(app.runtime.menus.value.map((item) => item.title)).toEqual(['工作台', '系统管理'])
  })

  it('hides unauthorized routes and redirects to 403', async () => {
    const { app } = await mountApp({ auth: createAuth(['dashboard:view', 'system:view']) })

    expect(app.runtime.menus.value.map((item) => item.title)).toEqual(['工作台'])

    await app.router.push('/system/user')
    expect(app.router.currentRoute.value.path).toBe('/403')
  })

  it('redirects unauthenticated users to login with redirect query', async () => {
    const { app } = await mountApp({ auth: createAuth([], false) })

    expect(app.router.currentRoute.value.path).toBe('/login')
    expect(app.router.currentRoute.value.query.redirect).toBeTruthy()
  })

  it('falls back to static menu when the menu endpoint fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { app } = await mountApp({
      auth: createAuth(['dashboard:view', 'system:view', 'system:user:list']),
      menuFetch: async () => {
        throw new Error('network down')
      },
    })

    expect(app.runtime.menus.value.map((item) => item.title)).toEqual(['工作台', '系统管理'])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('applies menu overrides from the endpoint', async () => {
    const { app } = await mountApp({
      auth: createAuth(['dashboard:view', 'system:view', 'system:user:list']),
      menuFetch: async () => [{ key: 'SystemUser', title: '账号管理' }],
    })

    const system = app.runtime.menus.value.find((item) => item.title === '系统管理')
    expect(system?.children?.map((item) => item.title)).toEqual(['账号管理'])
  })

  it('keeps other modules alive when one module setup fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onError = vi.fn()
    const errorReporter = vi.fn()
    const broken = defineModule({
      name: 'broken',
      routes: [],
      setup() {
        throw new Error('boom')
      },
    })
    const { app } = await mountApp({
      auth: createAuth(['dashboard:view']),
      modules: [broken, dashboardModule],
      hooks: { onError },
      errorReporter,
    })

    expect(onError).toHaveBeenCalled()
    expect(errorReporter).toHaveBeenCalledWith(expect.any(Error), 'module:broken')
    expect(app.router.currentRoute.value.path).toBe('/dashboard')
    error.mockRestore()
  })

  it('rebuilds access when permissionsVersion changes', async () => {
    const auth = createAuth(['dashboard:view'])
    const { app } = await mountApp({ auth })

    expect(app.runtime.menus.value.map((item) => item.title)).toEqual(['工作台'])

    auth.setPermissions(['dashboard:view', 'system:view', 'system:user:list'])
    await flushPromises()

    expect(app.runtime.menus.value.map((item) => item.title)).toEqual(['工作台', '系统管理'])
  })

  it('registers micro apps as a single catch-all route with menu path', async () => {
    const { app } = await mountApp({
      auth: createAuth(['dashboard:view', 'order:view']),
      modules: [dashboardModule],
      microApps: [{ name: 'order', entry: 'http://localhost:5174', basePath: '/order', permission: 'order:view' }],
    })

    const microMenu = app.runtime.menus.value.find((item) => item.title === 'order')
    expect(microMenu?.path).toBe('/order')

    await app.router.push('/order')
    expect(app.router.currentRoute.value.matched.some((record) => record.name === 'micro:order')).toBe(true)

    await app.router.push('/order/detail/1')
    expect(app.router.currentRoute.value.path).toBe('/order/detail/1')
  })

  it('hides micro app entry when permission is missing', async () => {
    const { app } = await mountApp({
      auth: createAuth(['dashboard:view']),
      modules: [dashboardModule],
      microApps: [{ name: 'order', entry: 'http://localhost:5174', basePath: '/order', permission: 'order:view' }],
    })

    expect(app.runtime.menus.value.map((item) => item.title)).toEqual(['工作台'])

    await app.router.push('/order')
    expect(app.router.currentRoute.value.path).toBe('/403')
  })
})
