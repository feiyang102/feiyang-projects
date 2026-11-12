// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createIdleWatcher } from './session'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createIdleWatcher', () => {
  it('fires onIdle after the configured idle time', () => {
    const onIdle = vi.fn()
    const watcher = createIdleWatcher({ idleTimeout: 5000, onIdle })
    watcher.start()

    vi.advanceTimersByTime(4999)
    expect(onIdle).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('resets the timer on user activity', () => {
    const onIdle = vi.fn()
    const watcher = createIdleWatcher({ idleTimeout: 5000, onIdle })
    watcher.start()

    vi.advanceTimersByTime(4000)
    window.dispatchEvent(new Event('keydown'))
    vi.advanceTimersByTime(4000)
    expect(onIdle).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('does nothing after stop', () => {
    const onIdle = vi.fn()
    const watcher = createIdleWatcher({ idleTimeout: 5000, onIdle })
    watcher.start()
    watcher.stop()

    vi.advanceTimersByTime(10_000)
    expect(onIdle).not.toHaveBeenCalled()
  })

  it('is inert when the timeout is not positive', () => {
    const onIdle = vi.fn()
    const watcher = createIdleWatcher({ idleTimeout: 0, onIdle })
    watcher.start()
    vi.advanceTimersByTime(10_000)
    expect(onIdle).not.toHaveBeenCalled()
  })

  it('fires a warning before idle and re-arms after activity', () => {
    const onWarning = vi.fn()
    const onIdle = vi.fn()
    const onActivity = vi.fn()
    const watcher = createIdleWatcher({
      idleTimeout: 5000,
      warning: 2000,
      onWarning,
      onIdle,
      onActivity,
    })
    watcher.start()

    vi.advanceTimersByTime(3000)
    expect(onWarning).toHaveBeenCalledTimes(1)
    expect(onIdle).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('keydown'))
    expect(onActivity).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(3000)
    expect(onWarning).toHaveBeenCalledTimes(2)
    expect(onIdle).not.toHaveBeenCalled()

    vi.advanceTimersByTime(2000)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('re-arms warning and idle timers through reset', () => {
    const onWarning = vi.fn()
    const onIdle = vi.fn()
    const watcher = createIdleWatcher({ idleTimeout: 5000, warning: 2000, onWarning, onIdle })
    watcher.start()

    vi.advanceTimersByTime(3000)
    expect(onWarning).toHaveBeenCalledTimes(1)

    watcher.reset()
    vi.advanceTimersByTime(2999)
    expect(onWarning).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)
    expect(onWarning).toHaveBeenCalledTimes(2)
    expect(onIdle).not.toHaveBeenCalled()
  })
})
