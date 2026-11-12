import { describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { applyOverrides, buildMenus } from './menu'

const routes: RouteRecordRaw[] = [
  {
    path: '/system',
    meta: { title: '系统管理', menu: { order: 90 } },
    children: [
      { path: 'user', name: 'SystemUser', meta: { title: '用户管理', menu: { order: 2 } } },
      { path: 'role', name: 'SystemRole', meta: { title: '角色管理', menu: { order: 1 } } },
    ],
  },
  { path: '/dashboard', name: 'Dashboard', meta: { title: '工作台', menu: { order: 1 }, affix: true } },
  { path: '/detail/:id', name: 'Detail', meta: { title: '详情', menu: false } },
] as RouteRecordRaw[]

describe('buildMenus', () => {
  it('builds nested menu and sorts by order', () => {
    const menus = buildMenus(routes)
    expect(menus.map((item) => item.title)).toEqual(['工作台', '系统管理'])
    expect(menus[1].children?.map((item) => item.title)).toEqual(['角色管理', '用户管理'])
  })

  it('skips routes with menu false', () => {
    const menus = buildMenus(routes)
    expect(menus.some((item) => item.path.startsWith('/detail'))).toBe(false)
  })

  it('uses menuPath for micro apps', () => {
    const microRoutes = [
      {
        path: '/order/:pathMatch(.*)*',
        name: 'micro:order',
        meta: { title: '订单中心', menuPath: '/order', menu: { order: 20 } },
      },
    ] as RouteRecordRaw[]
    const menus = buildMenus(microRoutes)
    expect(menus[0]).toMatchObject({ path: '/order', title: '订单中心' })
  })
})

describe('applyOverrides', () => {
  it('overrides title and order by route name', () => {
    const next = applyOverrides(routes, [{ key: 'SystemUser', title: '账号管理', order: 9 }])
    const menus = buildMenus(next)
    const system = menus.find((item) => item.title === '系统管理')
    expect(system?.children?.map((item) => item.title)).toEqual(['角色管理', '账号管理'])
  })

  it('hides a node when override sets hidden', () => {
    const next = applyOverrides(routes, [{ key: 'SystemRole', hidden: true }])
    const menus = buildMenus(next)
    const system = menus.find((item) => item.title === '系统管理')
    expect(system?.children?.map((item) => item.title)).toEqual(['用户管理'])
  })

  it('does nothing for unknown keys', () => {
    const next = applyOverrides(routes, [{ key: 'NotExists', title: 'x' }])
    expect(buildMenus(next).map((item) => item.title)).toEqual(buildMenus(routes).map((item) => item.title))
  })
})
