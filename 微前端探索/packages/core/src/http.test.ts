import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHttp, HttpError } from './http'

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('createHttp', () => {
  it('returns parsed json', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ ok: true })))
    const http = createHttp()
    await expect(http.get('/api/user')).resolves.toEqual({ ok: true })
  })

  it('appends query params and baseURL', async () => {
    const fetchMock = vi.fn(async () => json({}))
    vi.stubGlobal('fetch', fetchMock)
    const http = createHttp({ baseURL: 'https://api.test' })

    await http.get('/list', { page: 2, tags: ['a', 'b'], empty: undefined })
    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toBe('https://api.test/list?page=2&tags=a&tags=b')
  })

  it('throws HttpError with status and payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ message: 'nope' }, 400)))
    const http = createHttp()

    await expect(http.get('/bad')).rejects.toMatchObject({ status: 400, message: 'nope' })
  })

  it('calls onUnauthorized on 401', async () => {
    const onUnauthorized = vi.fn()
    vi.stubGlobal('fetch', vi.fn(async () => json({ message: 'expired' }, 401)))
    const http = createHttp({ onUnauthorized })

    await expect(http.get('/me')).rejects.toBeInstanceOf(HttpError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('times out long requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
          }),
      ),
    )
    const http = createHttp({ timeout: 20 })

    await expect(http.get('/slow')).rejects.toMatchObject({ code: 'ETIMEDOUT' })
  })

  it('retries GET on server errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({}, 500))
      .mockResolvedValueOnce(json({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const http = createHttp({ retry: 1 })
    await expect(http.get('/flaky')).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not retry POST', async () => {
    const fetchMock = vi.fn(async () => json({}, 500))
    vi.stubGlobal('fetch', fetchMock)

    const http = createHttp({ retry: 2 })
    await expect(http.post('/save', {})).rejects.toMatchObject({ status: 500 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('deduplicates concurrent GET requests', async () => {
    let resolve!: (value: Response) => void
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((res) => {
          resolve = res
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const http = createHttp()
    const first = http.get('/same')
    const second = http.get('/same')
    resolve(json({ ok: true }))

    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not deduplicate POST requests', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const http = createHttp()
    await Promise.all([http.post('/save', { a: 1 }), http.post('/save', { a: 1 })])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('runs request and response interceptors', async () => {
    const fetchMock = vi.fn(async () => json({ data: { id: 1 } }))
    vi.stubGlobal('fetch', fetchMock)

    const http = createHttp({
      interceptors: {
        request: (config) => ({ ...config, headers: { ...config.headers, 'X-Token': 't' } }),
        response: (data) => (data as { data: unknown }).data,
      },
    })

    await expect(http.get('/wrapped')).resolves.toEqual({ id: 1 })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>)['X-Token']).toBe('t')
  })

  it('can recover from errors with an error interceptor', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ message: 'boom' }, 500)))
    const http = createHttp({
      interceptors: {
        error: () => ({ fallback: true }),
      },
    })

    await expect(http.get('/fail')).resolves.toEqual({ fallback: true })
  })

  it('applies unwrap before response interceptors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ code: 0, data: { id: 2 } })))
    const http = createHttp({
      unwrap: (raw) => (raw as { data: unknown }).data,
    })

    await expect(http.get('/envelope')).resolves.toEqual({ id: 2 })
  })
})
