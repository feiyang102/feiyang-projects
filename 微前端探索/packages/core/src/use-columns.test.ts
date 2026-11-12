// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useColumns } from './use-columns'
import type { ColumnConfig } from './use-columns'

const defaults: ColumnConfig[] = [
  { key: 'name', title: '姓名' },
  { key: 'role', title: '角色' },
  { key: 'createdAt', title: '创建时间' },
]

beforeEach(() => {
  localStorage.clear()
})

describe('useColumns', () => {
  it('starts with all columns visible', () => {
    const { visibleKeys } = useColumns(defaults)
    expect(visibleKeys.value).toEqual(['name', 'role', 'createdAt'])
  })

  it('toggles a column visibility', () => {
    const { toggle, visibleKeys } = useColumns(defaults)
    toggle('role')
    expect(visibleKeys.value).toEqual(['name', 'createdAt'])

    toggle('role', true)
    expect(visibleKeys.value).toEqual(['name', 'role', 'createdAt'])
  })

  it('resets to defaults', () => {
    const { toggle, reset, visibleKeys } = useColumns(defaults)
    toggle('name')
    reset()
    expect(visibleKeys.value).toEqual(['name', 'role', 'createdAt'])
  })

  it('persists visibility and restores it', async () => {
    const first = useColumns(defaults, { storageKey: 'columns:users' })
    first.toggle('createdAt')
    await nextTick()

    const second = useColumns(defaults, { storageKey: 'columns:users' })
    expect(second.visibleKeys.value).toEqual(['name', 'role'])
  })

  it('ignores unknown persisted keys', () => {
    localStorage.setItem('columns:users', JSON.stringify([{ key: 'ghost', visible: false }]))
    const { visibleKeys } = useColumns(defaults, { storageKey: 'columns:users' })
    expect(visibleKeys.value).toEqual(['name', 'role', 'createdAt'])
  })

  it('does not mutate the defaults array', () => {
    const { toggle } = useColumns(defaults)
    toggle('name')
    expect(defaults[0].visible).toBeUndefined()
  })

  it('persists and restores column widths', async () => {
    const first = useColumns(defaults, { storageKey: 'columns:users' })
    first.setWidth('name', 180.4)
    await nextTick()

    const second = useColumns(defaults, { storageKey: 'columns:users' })
    expect(second.widthOf('name')).toBe(180)

    second.setWidth('name', undefined)
    expect(second.widthOf('name')).toBeUndefined()
  })

  it('clears widths on reset', () => {
    const { setWidth, widthOf, reset } = useColumns(defaults)
    setWidth('role', 140)
    expect(widthOf('role')).toBe(140)

    reset()
    expect(widthOf('role')).toBeUndefined()
  })

  it('moves a column and ignores out-of-range moves', () => {
    const { columns, move } = useColumns(defaults)

    move('name', 1)
    expect(columns.value.map((item) => item.key)).toEqual(['role', 'name', 'createdAt'])

    move('name', -1)
    expect(columns.value.map((item) => item.key)).toEqual(['name', 'role', 'createdAt'])

    move('name', -1)
    move('createdAt', 1)
    expect(columns.value.map((item) => item.key)).toEqual(['name', 'role', 'createdAt'])
  })

  it('persists column order and restores it', async () => {
    const first = useColumns(defaults, { storageKey: 'columns:users' })
    first.move('createdAt', -1)
    await nextTick()

    const second = useColumns(defaults, { storageKey: 'columns:users' })
    expect(second.columns.value.map((item) => item.key)).toEqual(['name', 'createdAt', 'role'])
  })

  it('resets the column order', () => {
    const { columns, move, reset } = useColumns(defaults)
    move('createdAt', -1)
    reset()
    expect(columns.value.map((item) => item.key)).toEqual(['name', 'role', 'createdAt'])
  })
})
