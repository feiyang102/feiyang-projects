// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { uploadFile, UploadError } from './upload'

class FakeXHR {
  status = 200
  responseText = '{"id":1}'
  withCredentials = false
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null
  headers: Record<string, string> = {}

  open = vi.fn()
  setRequestHeader = vi.fn((key: string, value: string) => {
    this.headers[key] = value
  })
  send = vi.fn(() => {
    this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent)
    this.onload?.()
  })
  abort = vi.fn(() => {
    this.onabort?.()
  })
}

function factory(xhr: FakeXHR) {
  return () => xhr as unknown as XMLHttpRequest
}

const file = new Blob(['hello'], { type: 'text/plain' })

describe('uploadFile', () => {
  it('uploads and resolves parsed json with progress', async () => {
    const xhr = new FakeXHR()
    const onProgress = vi.fn()

    await expect(uploadFile('/upload', file, { xhrFactory: factory(xhr), onProgress })).resolves.toEqual({ id: 1 })
    expect(xhr.open).toHaveBeenCalledWith('POST', '/upload')
    expect(xhr.send).toHaveBeenCalled()
    expect(onProgress).toHaveBeenCalledWith(50)
  })

  it('applies headers and credentials', async () => {
    const xhr = new FakeXHR()
    await uploadFile('/upload', file, {
      xhrFactory: factory(xhr),
      headers: { Authorization: 'Bearer t' },
      withCredentials: true,
    })

    expect(xhr.headers.Authorization).toBe('Bearer t')
    expect(xhr.withCredentials).toBe(true)
  })

  it('rejects with status on non-2xx', async () => {
    const xhr = new FakeXHR()
    xhr.status = 500

    await expect(uploadFile('/upload', file, { xhrFactory: factory(xhr) })).rejects.toMatchObject({
      name: 'UploadError',
      status: 500,
    })
  })

  it('rejects on network error', async () => {
    const xhr = new FakeXHR()
    xhr.send = vi.fn(() => xhr.onerror?.())

    await expect(uploadFile('/upload', file, { xhrFactory: factory(xhr) })).rejects.toBeInstanceOf(UploadError)
  })

  it('aborts when the signal is aborted', async () => {
    const xhr = new FakeXHR()
    xhr.send = vi.fn()
    const controller = new AbortController()

    const promise = uploadFile('/upload', file, { xhrFactory: factory(xhr), signal: controller.signal })
    controller.abort()

    await expect(promise).rejects.toThrowError(/已取消/)
    expect(xhr.abort).toHaveBeenCalled()
  })
})
