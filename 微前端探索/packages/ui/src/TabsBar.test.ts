// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useTabsStore } from '@admin/core'
import TabsBar from './TabsBar.vue'

async function mountTabs() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/dashboard' },
      { path: '/dashboard', component: { render: () => null }, meta: { title: '工作台', affix: true } },
      { path: '/system/user', component: { render: () => null }, meta: { title: '用户管理' } },
      { path: '/system/role', component: { render: () => null }, meta: { title: '角色管理' } },
    ],
  })
  await router.push('/system/user')
  await router.isReady()

  const tabs = useTabsStore()
  tabs.tabs = [
    { path: '/dashboard', fullPath: '/dashboard', title: '工作台', affix: true, cache: false },
    { path: '/system/user', fullPath: '/system/user', title: '用户管理', affix: false, cache: false },
    { path: '/system/role', fullPath: '/system/role?page=2', title: '角色管理', affix: false, cache: false },
  ]

  const wrapper = mount(TabsBar, {
    global: {
      plugins: [pinia, router],
      stubs: { ElDropdown: true, ElDropdownMenu: true, ElDropdownItem: true },
    },
  })
  await nextTick()
  return { wrapper, tabs, router }
}

describe('TabsBar', () => {
  it('renders tabs and navigates on click', async () => {
    const { wrapper, router } = await mountTabs()

    const items = wrapper.findAll('.admin-tabs__item')
    expect(items).toHaveLength(3)

    await items[2].trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(router.currentRoute.value.fullPath).toBe('/system/role?page=2')
  })

  it('opens a context menu on right click and closes the tab', async () => {
    const { wrapper, tabs } = await mountTabs()

    await wrapper.findAll('.admin-tabs__item')[1].trigger('contextmenu', { clientX: 40, clientY: 60 })
    await nextTick()

    const menu = wrapper.find('.admin-tabs__menu')
    expect(menu.exists()).toBe(true)
    expect(menu.attributes('style')).toContain('left: 40px')

    await menu.findAll('button')[0].trigger('click')
    await nextTick()

    expect(tabs.tabs.map((tab) => tab.fullPath)).toEqual(['/dashboard', '/system/role?page=2'])
    expect(wrapper.find('.admin-tabs__menu').exists()).toBe(false)
  })

  it('keeps only affix and target tabs via close others', async () => {
    const { wrapper, tabs } = await mountTabs()

    await wrapper.findAll('.admin-tabs__item')[2].trigger('contextmenu', { clientX: 10, clientY: 10 })
    await nextTick()

    await wrapper.findAll('.admin-tabs__menu button')[1].trigger('click')
    await nextTick()

    expect(tabs.tabs.map((tab) => tab.fullPath)).toEqual(['/dashboard', '/system/role?page=2'])
  })
})
