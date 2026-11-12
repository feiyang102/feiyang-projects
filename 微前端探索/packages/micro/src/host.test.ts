// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ADMIN_RUNTIME_KEY, useTabsStore } from '@admin/core'
import type { AdminRuntime } from '@admin/core'
import type { RemoteRouteInfo } from '@admin/bridge'
import { MicroAppHost } from './host'
import { registerMicroAdapter } from './types'

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function createRuntime(apps: AdminRuntime['microApps']) {
  return {
    config: { app: { name: 'test', title: 'Test' } },
    router: null,
    pinia: null,
    auth: {
      getSnapshot: () => ({ user: { id: '1', name: 'T' }, roles: [], permissions: ['*'] }),
      subscribe: () => () => undefined,
      can: () => true,
    },
    http: {},
    bridge: { emit: vi.fn(), on: () => () => undefined, request: async () => null, provide: () => undefined },
    microApps: apps,
    menus: shallowRef([]),
    collapsed: ref(false),
    theme: {
      mode: ref<'light' | 'dark'>('light'),
      preference: ref<'light' | 'dark' | 'system'>('light'),
      setMode: vi.fn(),
      toggle: vi.fn(),
    },
  } as unknown as AdminRuntime
}

async function mountHost(apps: AdminRuntime['microApps'], pinia = createPinia()) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/broken/:pathMatch(.*)*',
        name: 'micro:broken',
        component: MicroAppHost,
        meta: { micro: 'broken', title: '坏应用' },
      },
    ],
  })
  await router.push('/broken')
  await router.isReady()

  const wrapper = mount(MicroAppHost, {
    global: {
      plugins: [router, pinia],
      provide: { [ADMIN_RUNTIME_KEY as unknown as string]: createRuntime(apps) },
    },
  })
  await flushPromises()
  await nextTick()
  return { wrapper, router, pinia }
}

describe('MicroAppHost', () => {
  it('shows an error state with retry when the adapter fails', async () => {
    registerMicroAdapter({
      name: 'failing',
      async mount() {
        throw new Error('load failed')
      },
    })

    const { wrapper } = await mountHost([{ name: 'broken', entry: 'http://x', basePath: '/broken', adapter: 'failing' }])

    expect(wrapper.find('.admin-micro-host__error').exists()).toBe(true)
    expect(wrapper.text()).toContain('load failed')
    expect(wrapper.find('.admin-micro-host__retry').exists()).toBe(true)
  })

  it('mounts through a registered adapter and destroys on unmount', async () => {
    const destroy = vi.fn(async () => undefined)
    const mountSpy = vi.fn(async () => ({ name: 'broken', update: () => undefined, destroy }))

    registerMicroAdapter({ name: 'stub', mount: mountSpy })

    const { wrapper } = await mountHost([
      {
        name: 'broken',
        entry: 'http://x',
        basePath: '/broken',
        adapter: 'stub',
        props: () => ({ hello: 'world' }),
      },
    ])

    expect(mountSpy).toHaveBeenCalledTimes(1)
    const [, app, ctx] = mountSpy.mock.calls[0] as unknown as [HTMLElement, unknown, { getProps: () => Record<string, unknown> }]
    expect(app).toMatchObject({ name: 'broken' })
    expect(ctx.getProps()).toMatchObject({ hello: 'world', userName: 'T' })

    wrapper.unmount()
    expect(destroy).toHaveBeenCalled()
  })

  it('falls back to the iframe adapter when the requested adapter is unknown', async () => {
    const { wrapper } = await mountHost([
      { name: 'broken', entry: 'http://localhost:5174', basePath: '/broken', adapter: 'not-registered' },
    ])

    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('data-admin-micro')).toBe('broken')
  })

  it('skips mounting when the health check fails', async () => {
    const mountSpy = vi.fn()
    registerMicroAdapter({ name: 'health-stub', mount: mountSpy })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    )

    const { wrapper } = await mountHost([
      {
        name: 'broken',
        entry: 'http://x',
        basePath: '/broken',
        adapter: 'health-stub',
        healthCheckUrl: 'http://x/health',
      },
    ])

    expect(wrapper.text()).toContain('健康检查未通过')
    expect(mountSpy).not.toHaveBeenCalled()
  })

  it('mounts when the health check passes', async () => {
    const mountSpy = vi.fn(async () => ({
      name: 'broken',
      update: () => undefined,
      destroy: async () => undefined,
    }))
    registerMicroAdapter({ name: 'health-ok', mount: mountSpy })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('ok', { status: 200 })),
    )

    await mountHost([
      {
        name: 'broken',
        entry: 'http://x',
        basePath: '/broken',
        adapter: 'health-ok',
        healthCheckUrl: 'http://x/health',
      },
    ])

    expect(mountSpy).toHaveBeenCalledTimes(1)
  })

  it('navigates to reported child routes and applies child titles to tabs', async () => {
    let report: ((info: RemoteRouteInfo) => void) | undefined
    registerMicroAdapter({
      name: 'report-stub',
      async mount(_element, _app, ctx) {
        report = ctx.reportRouteChange
        return { name: 'broken', update: () => undefined, destroy: async () => undefined }
      },
    })

    const pinia = createPinia()
    const { router } = await mountHost(
      [{ name: 'broken', entry: 'http://x', basePath: '/broken', adapter: 'report-stub' }],
      pinia,
    )
    const tabs = useTabsStore(pinia)

    report?.({ app: 'broken', path: '/broken/orders/1', title: '订单详情' })
    await flushPromises()
    await nextTick()

    expect(router.currentRoute.value.path).toBe('/broken/orders/1')

    // 模拟应用层 afterEach 打开页签
    tabs.open(router.currentRoute.value)
    await nextTick()

    expect(tabs.tabs.find((tab) => tab.path === '/broken/orders/1')?.title).toBe('订单详情')
  })
})
