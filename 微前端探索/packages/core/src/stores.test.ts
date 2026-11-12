import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { useTabsStore } from './stores'

function route(fullPath: string, title: string, extra: Record<string, unknown> = {}) {
  return {
    path: fullPath.split('?')[0],
    fullPath,
    meta: { title, ...extra },
    name: title,
  } as unknown as RouteLocationNormalized
}

describe('tabs store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('opens tabs without duplicates and updates fullPath', () => {
    const tabs = useTabsStore()
    tabs.open(route('/a', 'A'))
    tabs.open(route('/a?x=1', 'A'))
    expect(tabs.tabs).toHaveLength(1)
    expect(tabs.tabs[0].fullPath).toBe('/a?x=1')
  })

  it('keeps affix tabs when closing all', () => {
    const tabs = useTabsStore()
    tabs.open(route('/home', '首页', { affix: true }))
    tabs.open(route('/a', 'A'))
    tabs.open(route('/b', 'B'))
    const next = tabs.closeAll()
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home'])
    expect(next?.path).toBe('/home')
  })

  it('closes others but keeps affix tabs', () => {
    const tabs = useTabsStore()
    tabs.open(route('/home', '首页', { affix: true }))
    tabs.open(route('/a', 'A'))
    tabs.open(route('/b', 'B'))
    tabs.closeOthers('/b')
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home', '/b'])
  })

  it('returns the neighbour tab when closing active one', () => {
    const tabs = useTabsStore()
    tabs.open(route('/a', 'A'))
    tabs.open(route('/b', 'B'))
    tabs.open(route('/c', 'C'))
    const next = tabs.close('/b')
    expect(next?.path).toBe('/c')
  })

  it('collects cached names only for cache routes', () => {
    const tabs = useTabsStore()
    tabs.open(route('/a', 'A', { cache: true }))
    tabs.open(route('/b', 'B'))
    expect(tabs.cachedNames).toEqual(['A'])
  })

  it('prunes tabs that lost permission', () => {
    const tabs = useTabsStore()
    tabs.open(route('/a', 'A'))
    tabs.open(route('/b', 'B'))
    tabs.prune((path) => path !== '/a')
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/b'])
  })
})
