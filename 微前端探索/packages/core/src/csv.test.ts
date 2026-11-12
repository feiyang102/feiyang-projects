// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { exportCsv, toCsv } from './csv'

interface Row extends Record<string, unknown> {
  id: number
  name: string
  note?: string
}

const rows: Row[] = [
  { id: 1, name: '张三', note: '普通' },
  { id: 2, name: '李四, 运营', note: '含"引号"' },
  { id: 3, name: '王五' },
]

const columns = [
  { key: 'id', title: 'ID' },
  { key: 'name', title: '姓名' },
  { key: 'note', title: '备注' },
]

describe('toCsv', () => {
  it('renders header and rows', () => {
    const csv = toCsv(rows.slice(0, 1), columns)
    expect(csv).toBe('ID,姓名,备注\n1,张三,普通')
  })

  it('escapes commas, quotes and missing values', () => {
    const csv = toCsv(rows, columns)
    expect(csv).toContain('"李四, 运营"')
    expect(csv).toContain('"含""引号"""')
    expect(csv).toContain('\n3,王五,')
  })

  it('supports custom formatters', () => {
    const csv = toCsv([{ id: 1, name: '张三', note: '' }], [
      { key: 'id', title: 'ID', format: (value) => `#${value}` },
      { key: 'name', title: '姓名' },
    ])
    expect(csv).toBe('ID,姓名\n#1,张三')
  })

  it('returns only the header when there are no rows', () => {
    expect(toCsv([], columns)).toBe('ID,姓名,备注')
  })
})

describe('exportCsv', () => {
  it('creates a csv blob and triggers download', () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:csv')
    const revokeObjectURL = vi.fn()
    const target = URL as unknown as Record<string, unknown>
    const originalCreate = target.createObjectURL
    const originalRevoke = target.revokeObjectURL
    target.createObjectURL = createObjectURL
    target.revokeObjectURL = revokeObjectURL
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    exportCsv('users', rows, columns)

    expect(createObjectURL).toHaveBeenCalled()
    const blob = createObjectURL.mock.calls[0]?.[0] as unknown as Blob
    expect(blob.type).toContain('text/csv')
    expect(click).toHaveBeenCalled()

    target.createObjectURL = originalCreate
    target.revokeObjectURL = originalRevoke
    click.mockRestore()
  })
})
