import type { RouteRecordRaw } from 'vue-router'
import type { MenuNode, MenuOverride } from './types'

function joinPath(parent: string, child: string): string {
  if (!child) return parent || '/'
  if (child.startsWith('/')) return child
  if (!parent || parent === '/') return `/${child}`
  return `${parent.replace(/\/$/, '')}/${child}`
}

export function applyOverrides(routes: RouteRecordRaw[], overrides: MenuOverride[]): RouteRecordRaw[] {
  if (overrides.length === 0) return routes
  const map = new Map(overrides.map((item) => [item.key, item]))

  const walk = (list: RouteRecordRaw[]): RouteRecordRaw[] =>
    list.map((route) => {
      const key = typeof route.name === 'string' ? route.name : route.path
      const override = map.get(key)
      const meta = { ...(route.meta ?? {}) }
      if (override) {
        if (override.title !== undefined) meta.title = override.title
        if (override.icon !== undefined || override.order !== undefined || override.hidden !== undefined) {
          const menu = typeof meta.menu === 'object' && meta.menu !== null ? { ...meta.menu } : {}
          if (override.icon !== undefined) menu.icon = override.icon
          if (override.order !== undefined) menu.order = override.order
          if (override.hidden !== undefined) menu.hidden = override.hidden
          meta.menu = menu
        }
      }
      const next = { ...route, meta } as RouteRecordRaw
      if (route.children) next.children = walk(route.children as RouteRecordRaw[])
      return next
    })

  return walk(routes)
}

export function collectMenuKeys(routes: RouteRecordRaw[], parentPath = ''): string[] {
  const keys: string[] = []
  for (const route of routes) {
    const fullPath = joinPath(parentPath, route.path)
    keys.push(typeof route.name === 'string' ? route.name : fullPath)
    if (route.children) keys.push(...collectMenuKeys(route.children as RouteRecordRaw[], fullPath))
  }
  return keys
}

export function buildMenus(routes: RouteRecordRaw[], parentPath = ''): MenuNode[] {
  const nodes: MenuNode[] = []

  for (const route of routes) {
    const fullPath = joinPath(parentPath, route.path)
    const meta = route.meta ?? {}
    if (meta.menu === false) continue
    const menu = typeof meta.menu === 'object' && meta.menu !== null ? meta.menu : {}
    if (menu.hidden) continue
    if (!fullPath || fullPath === '/') {
      if (route.children?.length) nodes.push(...buildMenus(route.children as RouteRecordRaw[], fullPath))
      continue
    }

    const children = route.children ? buildMenus(route.children as RouteRecordRaw[], fullPath) : []
    const hasMenuChildren = route.children?.some((child) => {
      const childMeta = child.meta
      if (childMeta?.menu === false) return false
      if (typeof childMeta?.menu === 'object' && childMeta.menu?.hidden) return false
      return true
    })
    if (hasMenuChildren && children.length === 0) continue

    const external = typeof meta.external === 'string' ? meta.external : undefined
    const title = meta.title ?? (typeof route.name === 'string' ? route.name : fullPath)
    const menuPath = typeof meta.menuPath === 'string' ? meta.menuPath : undefined

    nodes.push({
      key: typeof route.name === 'string' ? route.name : fullPath,
      path: external ?? menuPath ?? fullPath,
      title,
      icon: menu.icon,
      order: typeof menu.order === 'number' ? menu.order : 999,
      external,
      children: children.length ? children : undefined,
    })
  }

  return nodes.sort((a, b) => a.order - b.order)
}

export function findMenuKeys(nodes: MenuNode[]): string[] {
  const keys: string[] = []
  const walk = (list: MenuNode[]) => {
    for (const node of list) {
      keys.push(node.key)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return keys
}
