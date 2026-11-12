import { describe, expect, it } from 'vitest'
import { filterCommands, mergeRecentCommands } from './command'
import type { CommandItem } from './command'

const items: CommandItem[] = [
  { key: 'Dashboard', title: '工作台', path: '/dashboard' },
  { key: 'SystemUser', title: '账号管理', path: '/system/user', group: '系统管理' },
  { key: 'SystemRole', title: '角色管理', path: '/system/role', group: '系统管理' },
  { key: 'Order', title: '订单中心', path: '/order' },
]

describe('filterCommands', () => {
  it('returns all items for empty keyword', () => {
    expect(filterCommands(items, '')).toHaveLength(4)
  })

  it('matches title, path and group', () => {
    expect(filterCommands(items, '账号').map((item) => item.key)).toEqual(['SystemUser'])
    expect(filterCommands(items, 'system').map((item) => item.key)).toEqual(['SystemUser', 'SystemRole'])
    expect(filterCommands(items, '系统管理').map((item) => item.key)).toEqual(['SystemUser', 'SystemRole'])
  })

  it('is case insensitive and trims input', () => {
    expect(filterCommands(items, '  ORDER  ').map((item) => item.key)).toEqual(['Order'])
  })

  it('applies the limit', () => {
    expect(filterCommands(items, '', 2)).toHaveLength(2)
  })

  it('returns empty when nothing matches', () => {
    expect(filterCommands(items, 'not-exists')).toEqual([])
  })
})

describe('mergeRecentCommands', () => {
  it('puts recent items first with a custom group', () => {
    const result = mergeRecentCommands(items, ['Order', 'SystemUser'])
    expect(result.slice(0, 2).map((item) => item.key)).toEqual(['Order', 'SystemUser'])
    expect(result.slice(0, 2).every((item) => item.group === '最近访问')).toBe(true)
    expect(result).toHaveLength(4)
  })

  it('ignores unknown and duplicate keys', () => {
    const result = mergeRecentCommands(items, ['ghost', 'Order', 'Order'])
    expect(result.map((item) => item.key)).toEqual(['Order', 'Dashboard', 'SystemUser', 'SystemRole'])
  })

  it('returns the original list when there is no history', () => {
    expect(mergeRecentCommands(items, [])).toEqual(items)
  })
})
