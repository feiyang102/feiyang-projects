import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useTable } from './use-table'

async function createTestRouter(initial = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { render: () => null } }],
  })
  await router.push(initial)
  await router.isReady()
  return router
}

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

describe('useTable', () => {
  it('loads immediately with default query and pagination', async () => {
    const fetcher = vi.fn(async () => ({ rows: [{ id: 1 }], total: 12 }))
    const table = useTable<{ id: number }, { keyword?: string }>({
      fetcher,
      defaultQuery: { keyword: '' },
      pageSize: 5,
      syncUrl: false,
    })
    await flushPromises()

    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ keyword: '', page: 1, pageSize: 5 }))
    expect(table.rows.value).toEqual([{ id: 1 }])
    expect(table.total.value).toBe(12)
    expect(table.loading.value).toBe(false)
  })

  it('resets page on search', async () => {
    const fetcher = vi.fn(async () => ({ rows: [], total: 100 }))
    const table = useTable({ fetcher, defaultQuery: { keyword: '' }, syncUrl: false, immediate: false })

    await table.changePage(3)
    expect(table.page.value).toBe(3)

    table.query.keyword = 'abc'
    await table.search()
    expect(table.page.value).toBe(1)
    expect(table.query.keyword).toBe('abc')
    expect(fetcher).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'abc', page: 1, pageSize: 10 }))
  })

  it('keeps only the latest request result when calls race', async () => {
    const resolvers: Array<(value: { rows: { id: number }[]; total: number }) => void> = []
    const fetcher = vi.fn(
      () =>
        new Promise<{ rows: { id: number }[]; total: number }>((resolve) => {
          resolvers.push(resolve)
        }),
    )
    const table = useTable<{ id: number }, Record<string, never>>({
      fetcher: fetcher as never,
      syncUrl: false,
      immediate: false,
    })

    const first = table.load()
    const second = table.load()

    resolvers[1]({ rows: [{ id: 2 }], total: 1 })
    await second
    resolvers[0]({ rows: [{ id: 1 }], total: 1 })
    await first

    expect(table.rows.value).toEqual([{ id: 2 }])
  })

  it('captures errors and clears rows', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('boom')
    })
    const table = useTable({ fetcher, syncUrl: false })
    await flushPromises()

    expect(table.error.value).toBeInstanceOf(Error)
    expect(table.rows.value).toEqual([])
    expect(table.total.value).toBe(0)
  })

  it('syncs page and query to the url', async () => {
    const router = await createTestRouter()
    const fetcher = vi.fn(async () => ({ rows: [], total: 100 }))
    const table = useTable({
      fetcher,
      defaultQuery: { keyword: '' },
      router,
      immediate: false,
    })

    table.query.keyword = 'hello'
    await table.search()
    await flushPromises()
    expect(router.currentRoute.value.query).toMatchObject({ keyword: 'hello' })

    await table.changePage(2)
    await flushPromises()
    expect(router.currentRoute.value.query).toMatchObject({ keyword: 'hello', page: '2' })
  })

  it('restores state from the url', async () => {
    const router = await createTestRouter('/?page=3&keyword=from-url')
    const fetcher = vi.fn(async () => ({ rows: [], total: 100 }))
    const table = useTable({
      fetcher,
      defaultQuery: { keyword: '' },
      router,
      immediate: false,
    })

    expect(table.page.value).toBe(3)
    expect(table.query.keyword).toBe('from-url')
  })

  it('resets query and url fields', async () => {
    const router = await createTestRouter('/?page=2&keyword=abc')
    const fetcher = vi.fn(async () => ({ rows: [], total: 100 }))
    const table = useTable({
      fetcher,
      defaultQuery: { keyword: '' },
      router,
      immediate: false,
    })

    await table.reset()
    await flushPromises()
    expect(table.page.value).toBe(1)
    expect(table.query.keyword).toBe('')
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('updates page size and returns to first page', async () => {
    const fetcher = vi.fn(async () => ({ rows: [], total: 100 }))
    const table = useTable({ fetcher, pageSize: 10, syncUrl: false, immediate: false })

    await table.changePage(4)
    await table.changePageSize(20)
    expect(table.pageSize.value).toBe(20)
    expect(table.page.value).toBe(1)
    await sleep(0)
  })

  it('passes sorting to the fetcher, resets page and syncs the url', async () => {
    const router = await createTestRouter()
    const fetcher = vi.fn(async () => ({ rows: [], total: 100 }))
    const table = useTable({
      fetcher,
      defaultQuery: { keyword: '' },
      router,
      immediate: false,
    })

    await table.changePage(3)
    await table.changeSort('createdAt', 'desc')
    expect(table.page.value).toBe(1)
    expect(fetcher).toHaveBeenLastCalledWith(
      expect.objectContaining({
        keyword: '',
        page: 1,
        pageSize: 10,
        sort: { prop: 'createdAt', order: 'desc' },
      }),
    )
    await flushPromises()
    expect(router.currentRoute.value.query).toMatchObject({ sortBy: 'createdAt', sortOrder: 'desc' })

    await table.changeSort('createdAt', null)
    expect(table.sort.value).toBeNull()
    await flushPromises()
    expect(router.currentRoute.value.query).not.toHaveProperty('sortBy')
  })

  it('restores sorting from the url', async () => {
    const router = await createTestRouter('/?sortBy=name&sortOrder=asc')
    const fetcher = vi.fn(async () => ({ rows: [], total: 100 }))
    const table = useTable({
      fetcher,
      defaultQuery: { keyword: '' },
      router,
      immediate: false,
    })

    expect(table.sort.value).toEqual({ prop: 'name', order: 'asc' })
    await table.reset()
    await flushPromises()
    expect(table.sort.value).toBeNull()
    expect(router.currentRoute.value.query).not.toHaveProperty('sortBy')
  })

  it('aborts the previous request when a new load starts', () => {
    const signals: Array<AbortSignal | undefined> = []
    const fetcher = vi.fn((params: { signal?: AbortSignal }) => {
      signals.push(params.signal)
      return new Promise<{ rows: never[]; total: number }>(() => undefined)
    })
    const table = useTable({ fetcher, syncUrl: false, immediate: false })

    void table.load()
    void table.load()

    expect(signals).toHaveLength(2)
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
  })

  it('aborts the in-flight request when the owning scope is disposed', () => {
    const signals: Array<AbortSignal | undefined> = []
    const fetcher = vi.fn((params: { signal?: AbortSignal }) => {
      signals.push(params.signal)
      return new Promise<{ rows: never[]; total: number }>(() => undefined)
    })

    const scope = effectScope()
    scope.run(() => {
      useTable({ fetcher, syncUrl: false })
    })

    expect(signals).toHaveLength(1)
    expect(signals[0]?.aborted).toBe(false)
    scope.stop()
    expect(signals[0]?.aborted).toBe(true)
  })
})
