import { createApp, defineComponent, h, ref, shallowRef, watch } from 'vue'
import type { App as VueApp, Component } from 'vue'
import { createPinia } from 'pinia'
import {
  RouterView,
  createRouter,
  createWebHashHistory,
  createWebHistory,
  useRoute,
} from 'vue-router'
import type { RouteLocationNormalized, RouteRecordRaw, RouteRecordName, Router } from 'vue-router'
import { createBridge } from '@admin/bridge'
import { DefaultLayout } from './layout'
import { applyOverrides, buildMenus, collectMenuKeys } from './menu'
import { normalizeOptions } from './options'
import { filterRoutes, matchRoutePattern, validateModulePermissions } from './permission'
import { ADMIN_RUNTIME_KEY } from './runtime'
import { createThemeState } from './theme'
import { createIdleWatcher } from './session'
import { createVersionChecker } from './version'
import { createNotificationCenter } from './notification'
import { useTabsStore } from './stores'
import { ErrorPage } from './error-pages'
import { createHttp } from './http'
import type {
  AdminApp,
  AdminAppOptions,
  AdminModule,
  AdminRuntime,
  AuthAdapter,
  AuthSnapshot,
  MenuOverride,
  MicroPlugin,
} from './types'

const PUBLIC_PATHS = new Set(['/403', '/404', '/500'])
const COLLAPSED_KEY = 'admin:sidebar-collapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function normalizeBase(basePath: string): string {
  const value = basePath.startsWith('/') ? basePath : `/${basePath}`
  return value.replace(/\/$/, '') || '/'
}

function buildMicroRoutes(plugin: MicroPlugin): RouteRecordRaw[] {
  return plugin.apps.flatMap((item) => {
    const base = normalizeBase(item.basePath)
    const component = plugin.component as Component
    const meta = {
      title: item.menu?.title ?? item.name,
      permission: item.permission,
      micro: item.name,
      menuPath: base,
      menu: {
        icon: item.menu?.icon,
        order: item.menu?.order,
      },
    }
    return [
      {
        path: `${base}/:pathMatch(.*)*`,
        name: `micro:${item.name}`,
        component,
        meta,
      },
    ] as RouteRecordRaw[]
  })
}

function withTimeout<T>(task: Promise<T>, timeout: number): Promise<T> {
  if (!Number.isFinite(timeout) || timeout <= 0) return task
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${timeout}ms`)), timeout)
    task.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export function createAdminApp(raw: AdminAppOptions): AdminApp {
  const options = normalizeOptions(raw)
  const pinia = createPinia()
  const router: Router = createRouter({
    history:
      options.router.history ??
      (options.router.mode === 'hash'
        ? createWebHashHistory(options.router.base)
        : createWebHistory(options.router.base)),
    routes: [],
  })

  const auth: AuthAdapter | null = options.auth === false || !options.auth ? null : options.auth
  const bridge = createBridge()
  const menus = shallowRef(buildMenus([]))
  const collapsed = shallowRef(readCollapsed())
  watch(collapsed, (value) => {
    try {
      localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0')
    } catch {
      // 忽略存储不可用
    }
  })
  const theme = createThemeState(options.theme)
  const version = options.version ? createVersionChecker(options.version) : undefined
  const notifications = options.notifications ? createNotificationCenter(options.notifications) : undefined
  const sessionWarning = ref(false)
  const sessionRemaining = ref(0)
  const sessionWarningMs = options.session?.warning ?? 0
  let sessionCountdown: ReturnType<typeof setInterval> | undefined
  const microApps = options.micro?.apps ?? []

  let vueApp: VueApp<Element> | null = null
  let removeBusinessRoutes: Array<() => void> = []
  let blockedPaths: string[] = []
  let overrides: MenuOverride[] = []
  let authPromise: Promise<AuthSnapshot | null> | null = null
  let guardsInstalled = false

  const http = createHttp({
    ...options.http,
    onUnauthorized: () => {
      options.http.onUnauthorized?.()
      handleExpired()
    },
  })

  const runtime: AdminRuntime = {
    config: options,
    router,
    pinia,
    auth,
    http,
    bridge,
    microApps,
    menus,
    collapsed,
    theme,
    version,
    notifications,
    session:
      options.session?.idleTimeout && options.session.idleTimeout > 0
        ? { warning: sessionWarning, remaining: sessionRemaining, extend: extendSession }
        : undefined,
  }

  function can(required: string | string[] | undefined, mode: 'any' | 'all' = 'any'): boolean {
    if (!auth) return true
    if (!auth.getSnapshot()) return true
    if (!required || (Array.isArray(required) && required.length === 0)) return true
    return auth.can(required, mode)
  }

  function reportError(error: unknown, info: string) {
    options.hooks?.onError?.(error, info)
    options.errorReporter?.(error, info)
  }

  function ensureAuth(): Promise<AuthSnapshot | null> {
    if (!auth) return Promise.resolve(null)
    const existing = auth.getSnapshot()
    if (existing) return Promise.resolve(existing)
    if (!authPromise) {
      authPromise = auth.load().finally(() => {
        authPromise = null
      })
    }
    return authPromise
  }

  function isBlocked(path: string): boolean {
    return blockedPaths.some((pattern) => matchRoutePattern(path, pattern))
  }

  function handleExpired() {
    const tabs = useTabsStore(pinia)
    tabs.reset()
    options.hooks?.onAuthExpired?.(runtime)
    const current = router.currentRoute.value
    if (current.path !== options.loginPath) {
      void router.replace({ path: options.loginPath, query: { redirect: current.fullPath } })
    }
  }

  async function handleIdle() {
    if (!auth) return
    try {
      await auth.logout()
    } catch (error) {
      reportError(error, 'session')
    }
    handleExpired()
  }

  function stopSessionCountdown() {
    if (sessionCountdown) {
      clearInterval(sessionCountdown)
      sessionCountdown = undefined
    }
  }

  function clearSessionWarning() {
    sessionWarning.value = false
    sessionRemaining.value = 0
    stopSessionCountdown()
  }

  function startSessionWarning() {
    if (!sessionWarningMs || sessionWarningMs <= 0) return
    clearSessionWarning()
    sessionWarning.value = true
    sessionRemaining.value = Math.ceil(sessionWarningMs / 1000)
    sessionCountdown = setInterval(() => {
      sessionRemaining.value = Math.max(0, sessionRemaining.value - 1)
      if (sessionRemaining.value === 0) stopSessionCountdown()
    }, 1000)
  }

  function extendSession() {
    idleWatcher.reset()
    clearSessionWarning()
  }

  const idleWatcher = createIdleWatcher({
    ...options.session,
    onWarning: startSessionWarning,
    onActivity: clearSessionWarning,
    onIdle: () => {
      clearSessionWarning()
      void handleIdle()
    },
  })

  function collectRoutes(): RouteRecordRaw[] {
    const moduleRoutes = options.modules.flatMap((module: AdminModule) => module.routes)
    const microRoutes = options.micro ? buildMicroRoutes(options.micro) : []
    return [...microRoutes, ...moduleRoutes, ...options.routes]
  }

  async function loadMenuOverrides(routes: RouteRecordRaw[]): Promise<MenuOverride[]> {
    const menu = options.menu
    if (!menu) return []

    try {
      const task = menu.fetch
        ? menu.fetch()
        : menu.overridesUrl
          ? http.get<MenuOverride[] | { items: MenuOverride[] }>(menu.overridesUrl).then((value) =>
              Array.isArray(value) ? value : value.items ?? [],
            )
          : Promise.resolve([])
      const items = await withTimeout(task, menu.timeout ?? 3000)
      const known = new Set(collectMenuKeys(routes))
      const result: MenuOverride[] = []
      for (const item of items) {
        if (!item?.key) continue
        if (!known.has(item.key)) {
          // eslint-disable-next-line no-console
          console.warn(`[admin-core] menu override key "${item.key}" does not match any route and was ignored.`)
          continue
        }
        result.push(item)
      }
      return result
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[admin-core] menu overrides unavailable, falling back to static menu.', error)
      return []
    }
  }

  function installBusinessRoutes(routes: RouteRecordRaw[]) {
    removeBusinessRoutes.forEach((remove) => remove())
    removeBusinessRoutes = []
    const result = filterRoutes(routes, can)
    blockedPaths = result.blocked
    menus.value = buildMenus(result.routes)
    for (const route of result.routes) {
      removeBusinessRoutes.push(router.addRoute(route))
    }
  }

  function installBuiltinRoutes() {
    if (options.loginComponent) {
      router.addRoute({
        path: options.loginPath,
        name: 'admin:login',
        component: options.loginComponent,
        meta: { menu: false },
      })
    }

    const errorRoutes: Array<[string, RouteRecordName, '403' | '404' | '500']> = [
      ['/403', 'admin:403', '403'],
      ['/404', 'admin:404', '404'],
      ['/500', 'admin:500', '500'],
    ]
    for (const [path, name, kind] of errorRoutes) {
      router.addRoute({
        path,
        name,
        component: defineComponent({
          name: `AdminError${kind}`,
          setup: () => () => h(ErrorPage, { kind }),
        }),
        meta: { menu: false },
      })
    }

    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'admin:not-found',
      component: defineComponent({
        name: 'AdminNotFound',
        setup: () => () => h(ErrorPage, { kind: '404' }),
      }),
      meta: { menu: false },
    })
  }

  function installGuards() {
    if (guardsInstalled) return
    guardsInstalled = true

    let lastPermissionsVersion = auth?.getSnapshot()?.permissionsVersion

    auth?.subscribe?.(() => {
      const snapshot = auth.getSnapshot()
      if (!snapshot) {
        idleWatcher.stop()
        handleExpired()
        return
      }
      idleWatcher.start()
      const version = snapshot.permissionsVersion
      if (version && version !== lastPermissionsVersion) {
        lastPermissionsVersion = version
        void rebuildAccess()
      }
    })

    router.beforeEach(async (to: RouteLocationNormalized) => {
      if (!auth) return true
      if (to.path === options.loginPath || PUBLIC_PATHS.has(to.path)) return true

      if (!auth.isAuthenticated()) {
        return { path: options.loginPath, query: { redirect: to.fullPath } }
      }

      try {
        await ensureAuth()
      } catch {
        if (!auth.isAuthenticated()) {
          return { path: options.loginPath, query: { redirect: to.fullPath } }
        }
        return { path: '/500', query: { reason: 'auth' } }
      }

      if (isBlocked(to.path)) {
        return { path: '/403', query: { from: to.fullPath } }
      }

      return true
    })

    router.afterEach((to, from) => {
      if (to.meta.title) {
        document.title = `${to.meta.title} - ${options.app.title}`
        if (to.path !== options.loginPath) {
          useTabsStore(pinia).open(to)
        }
      }
      options.hooks?.onRouteChange?.(to, from, runtime)
    })

    router.onError((error) => {
      reportError(error, 'router')
    })
  }

  async function runModules() {
    if (!options.modules.length) return
    if (import.meta.env?.DEV) {
      const missing = validateModulePermissions(options.modules)
      if (missing.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[admin-core] 以下权限码在路由中使用但未在模块 permissions 中声明：\n  ${missing.join('\n  ')}`,
        )
      }
    }
    const context = { router, pinia, auth, http, bridge }
    for (const module of options.modules) {
      if (!module.setup) continue
      try {
        await module.setup(context)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[admin-core] module "${module.name}" failed to initialize.`, error)
        reportError(error, `module:${module.name}`)
      }
    }
  }

  const Root = defineComponent({
    name: 'AdminRoot',
    setup() {
      const route = useRoute()
      return () => {
        const layout = options.layout
        if (layout === false) return h(RouterView)
        if (options.loginComponent && route.path === options.loginPath) return h(RouterView)
        const component = layout?.component ?? DefaultLayout
        return h(component, layout?.props ?? {}, layout?.slots ?? {})
      }
    },
  })

  async function rebuildAccess() {
    if (!auth) return
    if (!auth.getSnapshot() && auth.refresh) {
      await auth.refresh()
    }
    installBusinessRoutes(applyOverrides(collectRoutes(), overrides))
    const tabs = useTabsStore(pinia)
    tabs.prune((path) => !isBlocked(path))
    if (isBlocked(router.currentRoute.value.path)) {
      await router.replace({ path: '/403' })
    }
  }

  runtime.refreshAccess = rebuildAccess

  async function mount(selector: string | Element): Promise<void> {
    options.hooks?.onBeforeMount?.(runtime)

    if (auth && auth.isAuthenticated()) {
      try {
        await ensureAuth()
      } catch (error) {
        reportError(error, 'auth')
      }
    }

    const baseRoutes = collectRoutes()
    overrides = await loadMenuOverrides(baseRoutes)
    installBusinessRoutes(applyOverrides(baseRoutes, overrides))
    installBuiltinRoutes()
    installGuards()
    if (auth?.isAuthenticated()) idleWatcher.start()
    await runModules()

    const app = createApp(Root)
    app.use(pinia)
    app.use(router)
    auth?.install?.(app)
    app.provide(ADMIN_RUNTIME_KEY, runtime)
    app.config.errorHandler = (error, _instance, info) => {
      reportError(error, info)
      // eslint-disable-next-line no-console
      console.error('[admin-core] unhandled error', error)
    }

    await router.isReady()
    app.mount(selector)
    vueApp = app
    version?.start()
    notifications?.start()
    options.hooks?.onReady?.(runtime)
  }

  function unmount() {
    idleWatcher.stop()
    clearSessionWarning()
    version?.stop()
    notifications?.stop()
    vueApp?.unmount()
    vueApp = null
    removeBusinessRoutes.forEach((remove) => remove())
    removeBusinessRoutes = []
  }

  return { mount, unmount, router, pinia, auth, runtime }
}
