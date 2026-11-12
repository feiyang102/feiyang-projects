export interface UploadOptions {
  headers?: Record<string, string>
  fieldName?: string
  data?: Record<string, string>
  withCredentials?: boolean
  signal?: AbortSignal
  onProgress?: (percent: number) => void
  /** 便于测试或替换底层实现 */
  xhrFactory?: () => XMLHttpRequest
}

export class UploadError extends Error {
  readonly status?: number
  readonly payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'UploadError'
    this.status = status
    this.payload = payload
  }
}

export function uploadFile<T = unknown>(url: string, file: File | Blob, options: UploadOptions = {}): Promise<T> {
  const xhr = options.xhrFactory ? options.xhrFactory() : new XMLHttpRequest()
  const form = new FormData()
  form.append(options.fieldName ?? 'file', file)
  for (const [key, value] of Object.entries(options.data ?? {})) {
    form.append(key, value)
  }

  return new Promise<T>((resolve, reject) => {
    xhr.open('POST', url)
    if (options.withCredentials) xhr.withCredentials = true
    for (const [key, value] of Object.entries(options.headers ?? {})) {
      xhr.setRequestHeader(key, value)
    }

    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable && event.total > 0) {
          options.onProgress?.(Math.round((event.loaded / event.total) * 100))
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let payload: unknown = null
        if (xhr.responseText) {
          try {
            payload = JSON.parse(xhr.responseText)
          } catch {
            payload = xhr.responseText
          }
        }
        resolve(payload as T)
        return
      }
      reject(new UploadError(`上传失败（HTTP ${xhr.status}）`, xhr.status, xhr.responseText))
    }

    xhr.onerror = () => reject(new UploadError('上传失败：网络错误'))
    xhr.onabort = () => reject(new UploadError('上传已取消'))

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort()
        return
      }
      options.signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(form)
  })
}
