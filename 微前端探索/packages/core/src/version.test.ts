import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVersionChecker } from './version'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createVersionChecker', () => {
  it('detects a newer version and notifies once', async () => {
    const check = vi.fn(async () => '1.1.0')
    const onUpdate = vi.fn()
    const checker = createVersionChecker({ current: '1.0.0', check, onUpdate })

    await checker.check()
    expect(checker.latest.value).toBe('1.1.0')
    expect(checker.updateAvailable.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith('1.1.0')

    await checker.check()
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('stays quiet when the version is unchanged', async () => {
    const onUpdate = vi.fn()
    const checker = createVersionChecker({
      current: '1.0.0',
      check: async () => '1.0.0',
      onUpdate,
    })

    await checker.check()
    expect(checker.updateAvailable.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('ignores check failures and can retry', async () => {
    const check = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue('1.1.0')
    const checker = createVersionChecker({ current: '1.0.0', check })

    await expect(checker.check()).resolves.toBeUndefined()
    expect(checker.updateAvailable.value).toBe(false)

    await checker.check()
    expect(checker.updateAvailable.value).toBe(true)
  })

  it('polls on the configured interval until stopped', async () => {
    const check = vi.fn(async () => '1.0.0')
    const checker = createVersionChecker({ current: '1.0.0', check, interval: 1000 })

    checker.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(check).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(3000)
    expect(check).toHaveBeenCalledTimes(4)

    checker.stop()
    await vi.advanceTimersByTimeAsync(3000)
    expect(check).toHaveBeenCalledTimes(4)
  })

  it('suppresses the same version after dismiss', async () => {
    const checker = createVersionChecker({ current: '1.0.0', check: async () => '1.1.0' })

    await checker.check()
    expect(checker.updateAvailable.value).toBe(true)

    checker.dismiss()
    expect(checker.updateAvailable.value).toBe(false)

    await checker.check()
    expect(checker.updateAvailable.value).toBe(false)
  })
})
