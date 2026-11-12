export interface DateFormatOptions {
  /** 默认 YYYY-MM-DD HH:mm:ss */
  pattern?: string
  /** 为空或非法日期时返回的占位符，默认 '-' */
  fallback?: string
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

export function formatDate(input: string | number | Date | null | undefined, options: DateFormatOptions = {}): string {
  const { pattern = 'YYYY-MM-DD HH:mm:ss', fallback = '-' } = options
  if (input === null || input === undefined || input === '') return fallback

  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return fallback

  return pattern
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()))
}

export interface AmountFormatOptions {
  precision?: number
  prefix?: string
  fallback?: string
}

export function formatAmount(value: number | string | null | undefined, options: AmountFormatOptions = {}): string {
  const { precision = 2, prefix = '', fallback = '-' } = options
  if (value === null || value === undefined || value === '') return fallback
  const amount = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(amount)) return fallback

  const formatted = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(amount)

  return `${prefix}${formatted}`
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[index]}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadUrl(url: string, filename?: string): void {
  if (typeof document === 'undefined') return
  const link = document.createElement('a')
  link.href = url
  if (filename) link.download = filename
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 继续走降级方案
  }

  if (typeof document === 'undefined') return false
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  textarea.remove()
  return ok
}
