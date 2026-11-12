import { getCurrentInstance, getCurrentScope, onScopeDispose, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Router } from 'vue-router'

export interface TableResult<Row> {
  rows: Row[]
  total: number
}

export interface TableSort {
  prop: string
  order: 'asc' | 'desc'
}

export interface UseTableOptions<Row, Query extends object> {
  /** 数据加载函数，接收查询条件、分页参数、排序与取消信号 */
  fetcher: (
    params: Query & { page: number; pageSize: number; sort?: TableSort; signal?: AbortSignal },
  ) => Promise<TableResult<Row>>
  /** 查询条件默认值，同时决定同步到 URL 的字段 */
  defaultQuery?: Query
  pageSize?: number
  immediate?: boolean
  /** 是否把分页与查询条件同步到地址栏，默认 true（需要 router） */
  syncUrl?: boolean
  /** 未在组件内调用时可显式传入 router */
  router?: Router
  /** 需要同步到 URL 的查询字段，默认取 defaultQuery 的键 */
  urlKeys?: string[]
}

export interface UseTableReturn<Row, Query extends object> {
  rows: Ref<Row[]>
  total: Ref<number>
  page: Ref<number>
  pageSize: Ref<number>
  sort: Ref<TableSort | null>
  query: Query
  loading: Ref<boolean>
  error: Ref<unknown>
  load: () => Promise<void>
  search: () => Promise<void>
  reset: () => Promise<void>
  refresh: () => Promise<void>
  changePage: (next: number) => Promise<void>
  changePageSize: (next: number) => Promise<void>
  changeSort: (prop: string, order: 'asc' | 'desc' | null) => Promise<void>
}

function coerce(value: string, sample: unknown): unknown {
  if (typeof sample === 'number') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? sample : parsed
  }
  if (typeof sample === 'boolean') return value === 'true'
  return value
}

function stable(record: Record<string, string>): string {
  return Object.keys(record)
    .sort()
    .map((key) => `${key}=${record[key]}`)
    .join('&')
}

function toStringRecord(query: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') result[key] = value
    else if (typeof value === 'number' || typeof value === 'boolean') result[key] = String(value)
  }
  return result
}

export function useTable<Row, Query extends object = Record<string, unknown>>(
  options: UseTableOptions<Row, Query>,
): UseTableReturn<Row, Query> {
  const instance = getCurrentInstance()
  const router = options.router ?? (instance ? useRouter() : null)
  const defaultPageSize = options.pageSize ?? 10
  const defaultQuery = () => ({ ...(options.defaultQuery ?? {}) }) as Query

  const rows = ref<Row[]>([]) as Ref<Row[]>
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(defaultPageSize)
  const sort = ref<TableSort | null>(null)
  const loading = ref(false)
  const error = ref<unknown>(null)
  const query = reactive(defaultQuery()) as Query

  const urlKeys = options.urlKeys ?? Object.keys(options.defaultQuery ?? {})
  const managedKeys = new Set([...urlKeys, 'page', 'pageSize', 'sortBy', 'sortOrder'])

  if (router && options.syncUrl !== false) {
    const current = router.currentRoute.value.query
    if (typeof current.page === 'string' && Number(current.page) > 0) page.value = Number(current.page)
    if (typeof current.pageSize === 'string' && Number(current.pageSize) > 0) pageSize.value = Number(current.pageSize)
    if (
      typeof current.sortBy === 'string' &&
      current.sortBy &&
      (current.sortOrder === 'asc' || current.sortOrder === 'desc')
    ) {
      sort.value = { prop: current.sortBy, order: current.sortOrder }
    }
    for (const key of urlKeys) {
      const raw = current[key]
      if (typeof raw === 'string' && raw !== '') {
        ;(query as Record<string, unknown>)[key] = coerce(raw, (options.defaultQuery as Record<string, unknown> | undefined)?.[key])
      }
    }
  }

  let seq = 0
  let controller: AbortController | null = null

  async function load(): Promise<void> {
    controller?.abort()
    controller = typeof AbortController === 'undefined' ? null : new AbortController()
    const signal = controller?.signal

    const current = ++seq
    loading.value = true
    error.value = null
    try {
      const params = {
        ...(query as Query),
        page: page.value,
        pageSize: pageSize.value,
      } as Query & { page: number; pageSize: number; sort?: TableSort; signal?: AbortSignal }
      if (sort.value) params.sort = sort.value
      if (signal) params.signal = signal
      const result = await options.fetcher(params)
      if (current !== seq) return
      rows.value = result.rows
      total.value = result.total
    } catch (reason) {
      if (current !== seq) return
      error.value = reason
      rows.value = []
      total.value = 0
    } finally {
      if (current === seq) loading.value = false
    }
  }

  function syncUrl() {
    if (!router || options.syncUrl === false) return
    const current = router.currentRoute.value
    const next: Record<string, string> = {}
    for (const [key, value] of Object.entries(current.query)) {
      if (managedKeys.has(key) || typeof value !== 'string') continue
      next[key] = value
    }
    for (const key of urlKeys) {
      const value = (query as Record<string, unknown>)[key]
      if (value !== undefined && value !== null && value !== '') next[key] = String(value)
    }
    if (page.value > 1) next.page = String(page.value)
    if (pageSize.value !== defaultPageSize) next.pageSize = String(pageSize.value)
    if (sort.value) {
      next.sortBy = sort.value.prop
      next.sortOrder = sort.value.order
    }

    if (stable(next) !== stable(toStringRecord(current.query))) {
      void router.replace({ query: next })
    }
  }

  async function search(): Promise<void> {
    page.value = 1
    syncUrl()
    await load()
  }

  async function reset(): Promise<void> {
    Object.assign(query, defaultQuery())
    page.value = 1
    pageSize.value = defaultPageSize
    sort.value = null
    syncUrl()
    await load()
  }

  async function changePage(next: number): Promise<void> {
    page.value = Math.max(1, next)
    syncUrl()
    await load()
  }

  async function changePageSize(next: number): Promise<void> {
    pageSize.value = Math.max(1, next)
    page.value = 1
    syncUrl()
    await load()
  }

  async function changeSort(prop: string, order: 'asc' | 'desc' | null): Promise<void> {
    sort.value = prop && order ? { prop, order } : null
    page.value = 1
    syncUrl()
    await load()
  }

  if (options.immediate !== false) {
    void load()
    syncUrl()
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      controller?.abort()
      controller = null
    })
  }

  return {
    rows,
    total,
    page,
    pageSize,
    sort,
    query,
    loading,
    error,
    load,
    search,
    reset,
    refresh: load,
    changePage,
    changePageSize,
    changeSort,
  }
}
