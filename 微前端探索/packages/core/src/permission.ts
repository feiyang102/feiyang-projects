import type { RouteRecordRaw } from 'vue-router'
import type { AdminModule } from './types'

export function matchPermission(granted: string[], required: string): boolean {
  if (!required) return true
  if (granted.includes('*') || granted.includes(required)) return true
  const parts = required.split(':')
  if (parts.length >= 2) {
    const resourceWildcard = `${parts[0]}:${parts[1]}:*`
    if (granted.includes(resourceWildcard)) return true
    if (granted.includes(`${parts[0]}:*`)) return true
  }
  return false
}

export function hasPermission(
  granted: string[],
  required: string | string[] | undefined,
  mode: 'any' | 'all' = 'any',
): boolean {
  if (!required || (Array.isArray(required) && required.length === 0)) return true
  const list = Array.isArray(required) ? required : [required]
  return mode === 'all' ? list.every((item) => matchPermission(granted, item)) : list.some((item) => matchPermission(granted, item))
}

export type PermissionChecker = (required: string | string[] | undefined, mode?: 'any' | 'all') => boolean

export function matchRoutePattern(path: string, pattern: string): boolean {
  const actual = path.split('/').filter(Boolean)
  const expected = pattern.split('/').filter(Boolean)
  const catchAllIndex = expected.findIndex((segment) => segment.includes('*'))
  const fixed = catchAllIndex >= 0 ? expected.slice(0, catchAllIndex) : expected

  if (actual.length < fixed.length) return false
  if (catchAllIndex < 0 && actual.length !== fixed.length) return false

  return fixed.every((segment, index) => segment.startsWith(':') || segment === actual[index])
}

export interface FilteredRoutes {
  routes: RouteRecordRaw[]
  blocked: string[]
}

function joinPath(parent: string, child: string): string {
  if (!child) return parent || '/'
  if (child.startsWith('/')) return child
  if (!parent || parent === '/') return `/${child}`
  return `${parent.replace(/\/$/, '')}/${child}`
}

export function filterRoutes(
  routes: RouteRecordRaw[],
  can: PermissionChecker,
  parentPath = '',
): FilteredRoutes {
  const allowed: RouteRecordRaw[] = []
  const blocked: string[] = []

  for (const route of routes) {
    const fullPath = joinPath(parentPath, route.path)
    const permitted = can(route.meta?.permission, route.meta?.permissionMode)

    if (!permitted) {
      blocked.push(fullPath)
      collectPaths(route, fullPath, blocked)
      continue
    }

    if (route.children && route.children.length > 0) {
      const result = filterRoutes(route.children as RouteRecordRaw[], can, fullPath)
      blocked.push(...result.blocked)
      if (result.routes.length === 0 && !route.component) {
        blocked.push(fullPath)
        continue
      }
      allowed.push({ ...route, children: result.routes } as RouteRecordRaw)
    } else {
      allowed.push({ ...route } as RouteRecordRaw)
    }
  }

  return { routes: allowed, blocked }
}

function collectPaths(route: RouteRecordRaw, path: string, out: string[]) {
  for (const child of route.children ?? []) {
    const childPath = joinPath(path, child.path)
    out.push(childPath)
    collectPaths(child as RouteRecordRaw, childPath, out)
  }
}

export function collectRoutePermissions(routes: RouteRecordRaw[], out: string[] = []): string[] {
  for (const route of routes) {
    const required = route.meta?.permission
    if (typeof required === 'string' && required !== '*') out.push(required)
    else if (Array.isArray(required)) {
      out.push(...required.filter((code): code is string => typeof code === 'string' && code !== '*'))
    }
    if (route.children?.length) collectRoutePermissions(route.children as RouteRecordRaw[], out)
  }
  return out
}

/**
 * 校验模块声明的权限码是否覆盖其路由用到的权限码。
 * 仅检查显式声明了 permissions 的模块，返回未声明的条目（module:code）。
 */
export function validateModulePermissions(modules: AdminModule[]): string[] {
  const missing: string[] = []

  for (const module of modules) {
    if (!module.permissions) continue
    const declared = new Set(Object.keys(module.permissions))
    const used = new Set(collectRoutePermissions(module.routes))
    for (const code of used) {
      if (!declared.has(code)) missing.push(`${module.name} -> ${code}`)
    }
  }

  return missing
}
