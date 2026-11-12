import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'

export interface ColumnConfig {
  key: string
  title: string
  visible?: boolean
  /** 用户拖拽后的列宽，未设置时由表格自动分配 */
  width?: number
  fixed?: 'left' | 'right'
}

export interface UseColumnsOptions {
  /** 传入后把列显隐持久化到 localStorage */
  storageKey?: string
}

export interface UseColumnsReturn {
  columns: Ref<ColumnConfig[]>
  visibleKeys: Ref<string[]>
  toggle: (key: string, visible?: boolean) => void
  setWidth: (key: string, width: number | undefined) => void
  widthOf: (key: string) => number | undefined
  /** 将列按方向移动，offset 为 -1 上移、1 下移 */
  move: (key: string, offset: number) => void
  reset: () => void
}

function clone(defaults: ColumnConfig[]): ColumnConfig[] {
  return defaults.map((item) => ({ ...item }))
}

function load(defaults: ColumnConfig[], storageKey?: string): ColumnConfig[] {
  const result = clone(defaults)
  if (!storageKey) return result
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return result
    const saved = JSON.parse(raw) as Array<{ key?: string; visible?: boolean; width?: number }>
    const order = new Map<string, number>()
    saved.forEach((entry, index) => {
      if (entry.key) order.set(entry.key, index)
    })
    const mapped = result.map((item) => {
      const match = saved.find((entry) => entry.key === item.key)
      if (!match) return item
      const next = { ...item }
      if (typeof match.visible === 'boolean') next.visible = match.visible
      if (typeof match.width === 'number' && match.width > 0) next.width = Math.round(match.width)
      return next
    })
    return mapped.sort(
      (left, right) =>
        (order.get(left.key) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.key) ?? Number.MAX_SAFE_INTEGER),
    )
  } catch {
    return result
  }
}

export function useColumns(defaults: ColumnConfig[], options: UseColumnsOptions = {}): UseColumnsReturn {
  const columns = ref(load(defaults, options.storageKey)) as Ref<ColumnConfig[]>

  const visibleKeys = computed(() =>
    columns.value.filter((item) => item.visible !== false).map((item) => item.key),
  )

  function persist() {
    if (!options.storageKey) return
    try {
      localStorage.setItem(
        options.storageKey,
        JSON.stringify(columns.value.map(({ key, visible, width }) => ({ key, visible, width }))),
      )
    } catch {
      // 忽略存储不可用
    }
  }

  watch(columns, persist, { deep: true })

  function toggle(key: string, visible?: boolean) {
    const target = columns.value.find((item) => item.key === key)
    if (!target) return
    target.visible = visible ?? target.visible === false
  }

  function reset() {
    columns.value = clone(defaults)
  }

  function setWidth(key: string, width: number | undefined) {
    const target = columns.value.find((item) => item.key === key)
    if (!target) return
    target.width = typeof width === 'number' && Number.isFinite(width) && width > 0 ? Math.round(width) : undefined
  }

  function widthOf(key: string): number | undefined {
    return columns.value.find((item) => item.key === key)?.width
  }

  function move(key: string, offset: number) {
    const index = columns.value.findIndex((item) => item.key === key)
    const target = index + offset
    if (index < 0 || target < 0 || target >= columns.value.length) return
    const [item] = columns.value.splice(index, 1)
    if (item) columns.value.splice(target, 0, item)
  }

  return { columns, visibleKeys, toggle, setWidth, widthOf, move, reset }
}
