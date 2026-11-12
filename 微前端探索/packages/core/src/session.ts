import type { SessionOptions } from './types'

const DEFAULT_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove']
const THROTTLE = 1000

export interface IdleWatcher {
  start(): void
  stop(): void
  reset(): void
}

export interface IdleWatcherOptions extends SessionOptions {
  onIdle: () => void
  /** 距离超时还剩 warning 毫秒时触发 */
  onWarning?: () => void
  /** 用户产生活动时触发，可用于收起过期提示 */
  onActivity?: () => void
}

/**
 * 监听用户活动，在指定时间无操作后触发 onIdle。
 * 仅在 start() 与 stop() 之间生效，可在登录/登出时重复启停。
 */
export function createIdleWatcher(options: IdleWatcherOptions): IdleWatcher {
  const timeout = options.idleTimeout ?? 0
  const warning = options.warning ?? 0
  const events = options.events?.length ? options.events : DEFAULT_EVENTS
  const noop: IdleWatcher = { start: () => undefined, stop: () => undefined, reset: () => undefined }

  if (typeof window === 'undefined' || !Number.isFinite(timeout) || timeout <= 0) return noop

  let timer: ReturnType<typeof setTimeout> | undefined
  let warningTimer: ReturnType<typeof setTimeout> | undefined
  let lastActivity = 0
  let running = false

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    if (warningTimer) {
      clearTimeout(warningTimer)
      warningTimer = undefined
    }
  }

  function schedule() {
    clear()
    if (warning > 0 && warning < timeout && options.onWarning) {
      warningTimer = setTimeout(() => options.onWarning?.(), timeout - warning)
    }
    timer = setTimeout(() => {
      stop()
      options.onIdle()
    }, timeout)
  }

  function onActivity() {
    if (!running) return
    const now = Date.now()
    if (now - lastActivity < THROTTLE) return
    lastActivity = now
    schedule()
    options.onActivity?.()
  }

  function start() {
    if (running) return
    running = true
    lastActivity = Date.now()
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }))
    schedule()
  }

  function stop() {
    running = false
    clear()
    events.forEach((event) => window.removeEventListener(event, onActivity))
  }

  return { start, stop, reset: schedule }
}
