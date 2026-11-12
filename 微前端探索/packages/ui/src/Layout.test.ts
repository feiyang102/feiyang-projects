// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ADMIN_RUNTIME_KEY, useTabsStore } from '@admin/core'
import type { AdminRuntime, MenuNode } from '@admin/core'
import Layout from './Layout.vue'

const scrollToMock = vi.fn()

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value: scrollToMock,
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

const menus: MenuNode[] = [
  { key: 'Dashboard', path: '/dashboard', title: '工作台', order: 1, icon: 'home' },
  {
    key: 'System',
    path: '/system',
    title: '系统管理',
    order: 90,
    icon: 'setting',
    children: [{ key: 'SystemUser', path: '/system/user', title: '用户管理', order: 1 }],
  },
]

function createRuntime() {
  return {
    config: { app: { name: 'test', title: '测试后台' } },
    router: null,
    pinia: null,
    auth: {
      getSnapshot: () => ({ user: { id: '1', name: '张三' }, roles: ['admin'], permissions: ['*'] }),
      subscribe: () => () => undefined,
      logout: async () => undefined,
      can: () => true,
    },
    http: {},
    bridge: { emit: vi.fn(), on: () => () => undefined, request: async () => null, provide: () => undefined },
    microApps: [],
    menus: shallowRef(menus),
    collapsed: ref(false),
    theme: {
      mode: ref<'light' | 'dark'>('light'),
      preference: ref<'light' | 'dark' | 'system'>('light'),
      setMode: vi.fn(),
      toggle: vi.fn(),
    },
    session: { warning: ref(false), remaining: ref(30), extend: vi.fn() },
    notifications: {
      items: ref([]),
      unread: ref(3),
      loading: ref(false),
      refresh: vi.fn(),
      read: vi.fn(),
      readAll: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    },
  } as unknown as AdminRuntime
}

async function mountLayout(
  options: { slots?: Record<string, () => unknown>; props?: Record<string, unknown> } = {},
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/dashboard' },
      { path: '/dashboard', component: { render: () => h('div', 'dashboard-page') }, meta: { title: '工作台' } },
      { path: '/system/user', component: { render: () => h('div', 'user-page') }, meta: { title: '用户管理' } },
      { path: '/cached', component: { render: () => h('div', 'cached-page') }, meta: { title: '缓存页', cache: true } },
      {
        path: '/order/:pathMatch(.*)*',
        component: { render: () => h('div', 'order-page') },
        meta: { title: '订单中心', micro: 'order' },
      },
    ],
  })
  await router.push('/dashboard')
  await router.isReady()

  const runtime = createRuntime()
  const pinia = createPinia()
  const wrapper = mount(Layout, {
    props: options.props as never,
    global: {
      plugins: [router, pinia],
      provide: { [ADMIN_RUNTIME_KEY as unknown as string]: runtime },
    },
    slots: options.slots as never,
  })
  await nextTick()
  return { wrapper, router, runtime, pinia }
}

describe('Layout', () => {
  beforeEach(() => {
    scrollToMock.mockClear()
  })

  it('renders brand, menu items and current user', async () => {
    const { wrapper } = await mountLayout()
    const text = wrapper.text()
    expect(text).toContain('测试后台')
    expect(text).toContain('工作台')
    expect(text).toContain('系统管理')
    expect(text).toContain('张三')
  })

  it('replaces the header-right area when a slot is provided', async () => {
    const { wrapper } = await mountLayout({
      slots: { 'header-right': () => h('span', { class: 'custom-actions' }, '自定义操作') },
    })

    expect(wrapper.find('.custom-actions').exists()).toBe(true)
    expect(wrapper.find('.admin-layout__user').exists()).toBe(false)
  })

  it('toggles the theme through the header button', async () => {
    const { wrapper, runtime } = await mountLayout()
    await wrapper.find('[aria-label="切换到暗色主题"]').trigger('click')
    expect(runtime.theme.toggle).toHaveBeenCalled()
  })

  it('renders the watermark overlay when enabled', async () => {
    const { wrapper } = await mountLayout({ props: { watermark: true } })
    expect(wrapper.find('.admin-watermark').exists()).toBe(true)
  })

  it('shows an offline banner when the browser goes offline', async () => {
    const { wrapper } = await mountLayout()
    expect(wrapper.find('.admin-offline').exists()).toBe(false)

    window.dispatchEvent(new Event('offline'))
    await nextTick()
    expect(wrapper.find('.admin-offline').exists()).toBe(true)

    window.dispatchEvent(new Event('online'))
    await nextTick()
    expect(wrapper.find('.admin-offline').exists()).toBe(false)
  })

  it('appends the reported child title to breadcrumbs', async () => {
    const { wrapper, router, pinia } = await mountLayout()
    const tabs = useTabsStore(pinia)

    await router.push('/order/orders/1')
    tabs.open(router.currentRoute.value)
    const tab = tabs.tabs.find((item) => item.path === '/order/orders/1')
    if (tab) tab.title = '订单详情'
    await nextTick()

    expect(wrapper.text()).toContain('订单详情')
  })

  it('shows the session expiry dialog and extends the session', async () => {
    const { wrapper, runtime } = await mountLayout()
    expect(wrapper.find('.admin-session').exists()).toBe(false)

    runtime.session!.warning.value = true
    runtime.session!.remaining.value = 12
    await nextTick()

    const dialog = document.querySelector('.admin-session')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('12')

    const action = document.querySelector('.admin-session__action') as HTMLButtonElement | null
    action?.click()
    expect(runtime.session!.extend).toHaveBeenCalled()

    runtime.session!.warning.value = false
    await nextTick()
  })

  it('restores the scroll position for cached pages only', async () => {
    const { wrapper, router } = await mountLayout()
    const scroll = wrapper.find('.admin-layout__scroll').element as HTMLElement

    await router.push('/cached')
    await new Promise((resolve) => setTimeout(resolve, 0))
    scroll.scrollTop = 240

    await router.push('/dashboard')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(scrollToMock).toHaveBeenLastCalledWith({ top: 0 })

    await router.push('/cached')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(scrollToMock).toHaveBeenLastCalledWith({ top: 240 })
  })

  it('shows the unread notification count', async () => {
    const { wrapper } = await mountLayout()
    expect(wrapper.find('.admin-layout__bell-badge').text()).toBe('3')
  })
})
