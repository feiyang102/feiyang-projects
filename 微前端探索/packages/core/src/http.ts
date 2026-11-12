import type { HttpClient, HttpOptions, HttpRequestConfig, HttpRequestOptions } from './types'

export class HttpError extends Error {
  readonly status: number
  readonly payload?: unknown
  readonly code?: string

  constructor(status: number, message: string, payload?: unknown, code?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.payload = payload
    this.code = code
  }
}

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)))
    } else {
      search.append(key, String(value))
    }
  }
  const result = search.toString()
  return result ? `?${result}` : ''
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isAbortError(error: unknown) {
  return error instanceof HttpError && (error.code === 'EABORTED' || error.code === 'ETIMEDOUT')
}

function shouldRetry(error: unknown, config: HttpRequestConfig, attempt: number): boolean {
  if (attempt >= config.retry) return false
  if (config.method !== 'GET' && config.method !== 'HEAD') return false
  if (isAbortError(error)) return false
  if (error instanceof HttpError) return error.status >= 500 || error.status === 0
  return true
}

export function createHttp(options: HttpOptions = {}): HttpClient {
  const inflight = new Map<string, Promise<unknown>>()
  const defaultTimeout = options.timeout ?? 15_000
  const defaultRetry = options.retry ?? 0
  const defaultDedupe = options.dedupe ?? true

  function buildConfig(url: string, requestOptions: HttpRequestOptions): HttpRequestConfig {
    const method = (requestOptions.method ?? 'GET').toUpperCase()
    const dedupe = requestOptions.dedupe ?? (defaultDedupe && (method === 'GET' || method === 'HEAD'))
    return {
      url: `${options.baseURL ?? ''}${url}`,
      method,
      params: requestOptions.params,
      body: requestOptions.body,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...requestOptions.headers,
      },
      signal: requestOptions.signal,
      timeout: requestOptions.timeout ?? defaultTimeout,
      retry: requestOptions.retry ?? defaultRetry,
      dedupe,
    }
  }

  async function fetchWithTimeout(config: HttpRequestConfig): Promise<Response> {
    const controller = new AbortController()
    let timedOut = false
    const timer =
      config.timeout > 0
        ? setTimeout(() => {
            timedOut = true
            controller.abort()
          }, config.timeout)
        : undefined

    const external = config.signal
    const onAbort = () => controller.abort()
    if (external) {
      if (external.aborted) controller.abort()
      else external.addEventListener('abort', onAbort)
    }

    try {
      return await fetch(`${config.url}${config.params ? toQuery(config.params) : ''}`, {
        method: config.method,
        headers: config.headers,
        body: config.body === undefined ? undefined : JSON.stringify(config.body),
        signal: controller.signal,
      })
    } catch (error) {
      if (timedOut) {
        throw new HttpError(0, `Request timeout after ${config.timeout}ms`, undefined, 'ETIMEDOUT')
      }
      if (external?.aborted) {
        throw new HttpError(0, 'Request aborted', undefined, 'EABORTED')
      }
      throw error
    } finally {
      if (timer) clearTimeout(timer)
      external?.removeEventListener('abort', onAbort)
    }
  }

  async function performRequest(config: HttpRequestConfig): Promise<unknown> {
    const response = await fetchWithTimeout(config)

    if (response.status === 401) {
      options.onUnauthorized?.()
      throw new HttpError(401, 'Unauthorized', undefined, 'EUNAUTHORIZED')
    }

    let raw: unknown = null
    if (response.status !== 204) {
      const contentType = response.headers.get('content-type') ?? ''
      raw = contentType.includes('application/json') ? await response.json() : await response.text()
    }

    if (!response.ok) {
      const payload = raw as { message?: string } | null
      const message = payload?.message || response.statusText || `HTTP ${response.status}`
      throw new HttpError(response.status, message, raw)
    }

    return raw
  }

  async function fetchWithRetry(config: HttpRequestConfig, attempt = 0): Promise<unknown> {
    try {
      return await performRequest(config)
    } catch (error) {
      if (!shouldRetry(error, config, attempt)) throw error
      await delay(120 * 2 ** attempt)
      return fetchWithRetry(config, attempt + 1)
    }
  }

  async function execute<T>(initial: HttpRequestConfig): Promise<T> {
    let config = initial
    try {
      if (options.interceptors?.request) {
        config = await options.interceptors.request(config)
      }

      const raw = await fetchWithRetry(config)
      const unwrapped = options.unwrap ? options.unwrap(raw) : raw
      const data = options.interceptors?.response ? options.interceptors.response(unwrapped, config) : unwrapped
      return data as T
    } catch (error) {
      if (options.interceptors?.error) {
        return (await options.interceptors.error(error, config)) as T
      }
      throw error
    }
  }

  function dedupeKey(config: HttpRequestConfig): string {
    return [
      config.method,
      config.url,
      config.params ? JSON.stringify(config.params) : '',
      config.body === undefined ? '' : JSON.stringify(config.body),
    ].join('|')
  }

  function request<T = unknown>(url: string, requestOptions: HttpRequestOptions = {}): Promise<T> {
    const config = buildConfig(url, requestOptions)
    if (!config.dedupe) return execute<T>(config)

    const key = dedupeKey(config)
    const existing = inflight.get(key)
    if (existing) return existing as Promise<T>

    const promise = execute<T>(config).finally(() => {
      inflight.delete(key)
    })
    inflight.set(key, promise)
    return promise
  }

  return {
    request,
    get<T = unknown>(url: string, params?: Record<string, unknown>) {
      return request<T>(url, { params })
    },
    post<T = unknown>(url: string, body?: unknown) {
      return request<T>(url, { method: 'POST', body })
    },
  }
}
