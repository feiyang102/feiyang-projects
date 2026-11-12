import { describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { collectRoutePermissions, filterRoutes, hasPermission, matchPermission, validateModulePermissions } from './permission'
import type { AdminModule } from './types'

describe('matchPermission', () => {
  it('matches exact codes', () => {
    expect(matchPermission(['system:user:list'], 'system:user:list')).toBe(true)
    expect(matchPermission(['system:user:list'], 'system:user:create')).toBe(false)
  })

  it('matches global wildcard', () => {
    expect(matchPermission(['*'], 'anything:at:all')).toBe(true)
  })

  it('matches resource wildcard', () => {
    expect(matchPermission(['system:user:*'], 'system:user:create')).toBe(true)
    expect(matchPermission(['system:user:*'], 'system:role:create')).toBe(false)
  })

  it('treats empty requirement as allowed', () => {
    expect(matchPermission([], '')).toBe(true)
  })
})

describe('hasPermission', () => {
  it('supports any mode', () => {
    expect(hasPermission(['a:b:c'], ['a:b:c', 'x:y:z'], 'any')).toBe(true)
  })

  it('supports all mode', () => {
    expect(hasPermission(['a:b:c'], ['a:b:c', 'x:y:z'], 'all')).toBe(false)
    expect(hasPermission(['a:b:c', 'x:y:z'], ['a:b:c', 'x:y:z'], 'all')).toBe(true)
  })
})

const routes: RouteRecordRaw[] = [
  {
    path: '/system',
    meta: { title: '系统管理', permission: 'system:view' },
    children: [
      { path: 'user', meta: { title: '用户管理', permission: 'system:user:list' } },
      { path: 'role', meta: { title: '角色管理', permission: 'system:role:list' } },
    ],
  },
  { path: '/dashboard', meta: { title: '工作台', permission: 'dashboard:view' } },
] as RouteRecordRaw[]

describe('filterRoutes', () => {
  it('keeps accessible routes and records blocked paths', () => {
    const can = (required: string | string[] | undefined) =>
      !required || (Array.isArray(required) ? required : [required]).every((code) => code !== 'system:role:list')
    const result = filterRoutes(routes, can)

    expect(result.routes.map((route) => route.path)).toContain('/dashboard')
    const system = result.routes.find((route) => route.path === '/system')
    expect(system?.children?.map((child) => child.path)).toEqual(['user'])
    expect(result.blocked).toContain('/system/role')
  })

  it('drops a group whose children are all blocked', () => {
    const can = (required: string | string[] | undefined) => {
      if (required === 'system:view') return true
      return false
    }
    const result = filterRoutes(routes, can)
    expect(result.routes.map((route) => route.path)).not.toContain('/system')
    expect(result.blocked).toContain('/system')
  })

  it('blocks a whole branch when parent has no permission', () => {
    const can = () => false
    const result = filterRoutes(routes, can)
    expect(result.routes).toHaveLength(0)
    expect(result.blocked).toContain('/system')
    expect(result.blocked).toContain('/system/user')
  })
})

describe('module permission validation', () => {
  const moduleWithPermissions: AdminModule = {
    name: 'system',
    permissions: { 'system:view': '查看', 'system:user:list': '列表' },
    routes: [
      {
        path: '/system',
        meta: { permission: 'system:view' },
        children: [{ path: 'user', meta: { permission: ['system:user:list', 'system:user:export'] } }],
      },
    ] as RouteRecordRaw[],
  }

  it('collects permission codes from nested routes', () => {
    expect(collectRoutePermissions(moduleWithPermissions.routes)).toEqual([
      'system:view',
      'system:user:list',
      'system:user:export',
    ])
  })

  it('reports codes missing from the module declaration', () => {
    expect(validateModulePermissions([moduleWithPermissions])).toEqual(['system -> system:user:export'])
  })

  it('skips modules without a permission declaration', () => {
    const noDeclaration: AdminModule = {
      name: 'plain',
      routes: [{ path: '/plain', meta: { permission: 'plain:view' } }] as RouteRecordRaw[],
    }
    expect(validateModulePermissions([noDeclaration])).toEqual([])
  })

  it('ignores wildcard codes', () => {
    const wildcard: AdminModule = {
      name: 'wild',
      permissions: {},
      routes: [{ path: '/wild', meta: { permission: '*' } }] as RouteRecordRaw[],
    }
    expect(validateModulePermissions([wildcard])).toEqual([])
  })
})
