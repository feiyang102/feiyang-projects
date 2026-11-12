// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { copyText, downloadBlob, downloadUrl, formatAmount, formatDate, formatFileSize } from './utils'

describe('formatDate', () => {
  it('formats with the default pattern', () => {
    const date = new Date(2026, 10, 12, 9, 5, 3)
    expect(formatDate(date)).toBe('2026-11-12 09:05:03')
  })

  it('supports custom patterns and timestamps', () => {
    expect(formatDate(new Date(2026, 0, 2).getTime(), { pattern: 'YYYY/MM/DD' })).toBe('2026/01/02')
  })

  it('returns fallback for empty or invalid input', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate('not-a-date')).toBe('-')
    expect(formatDate(undefined, { fallback: 'N/A' })).toBe('N/A')
  })
})

describe('formatAmount', () => {
  it('formats with thousand separators and precision', () => {
    expect(formatAmount(1234567.891)).toBe('1,234,567.89')
    expect(formatAmount('88', { precision: 0 })).toBe('88')
  })

  it('supports prefix and fallback', () => {
    expect(formatAmount(12.5, { prefix: '¥' })).toBe('¥12.50')
    expect(formatAmount(null)).toBe('-')
    expect(formatAmount('abc')).toBe('-')
  })
})

describe('formatFileSize', () => {
  it('formats bytes with units', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('handles invalid input', () => {
    expect(formatFileSize(-1)).toBe('-')
    expect(formatFileSize(Number.NaN)).toBe('-')
  })
})

describe('download helpers', () => {
  it('creates and clicks an anchor for blobs', () => {
    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    const target = URL as unknown as Record<string, unknown>
    const originalCreate = target.createObjectURL
    const originalRevoke = target.revokeObjectURL
    target.createObjectURL = createObjectURL
    target.revokeObjectURL = revokeObjectURL
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    downloadBlob(new Blob(['x']), 'demo.txt')

    expect(createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')

    target.createObjectURL = originalCreate
    target.revokeObjectURL = originalRevoke
    click.mockRestore()
  })

  it('clicks an anchor for urls', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    downloadUrl('https://example.com/a.pdf', 'a.pdf')
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })
})

describe('copyText', () => {
  it('uses the clipboard api when available', async () => {
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await expect(copyText('hello')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
    vi.unstubAllGlobals()
  })

  it('falls back to execCommand', async () => {
    vi.stubGlobal('navigator', {})
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })

    await expect(copyText('fallback')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    vi.unstubAllGlobals()
  })
})
