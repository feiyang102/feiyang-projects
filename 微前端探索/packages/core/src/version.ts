import { ref } from 'vue'
import type { Ref } from 'vue'

export interface VersionCheckOptions {
  /** 当前运行版本，用于与检测结果比较 */
  current?: string
  /** 返回最新版本号，抛错时静默并在下次轮询重试 */
  check: () => string | Promise<string>
  /** 轮询间隔（毫秒），默认 5 分钟；非正数表示只检查一次 */
  interval?: number
  /** 首次发现新版本时回调 */
  onUpdate?: (latest: string) => void
}

export interface VersionChecker {
  latest: Ref<string | null>
  updateAvailable: Ref<boolean>
  check: () => Promise<void>
  start: () => void
  stop: () => void
  /** 忽略当前检测到的版本，后续轮询不再提示同一版本 */
  dismiss: () => void
}

const DEFAULT_INTERVAL = 5 * 60 * 1000

export function createVersionChecker(options: VersionCheckOptions): VersionChecker {
  const latest = ref<string | null>(null)
  const updateAvailable = ref(false)

  let timer: ReturnType<typeof setInterval> | undefined
  let running = false
  let checking = false
  let dismissed: string | null = null

  async function check(): Promise<void> {
    if (checking) return
    checking = true
    try {
      const value = await options.check()
      if (typeof value !== 'string' || !value) return
      latest.value = value

      const isNew = Boolean(options.current) && value !== options.current
      if (!isNew) {
        updateAvailable.value = false
        return
      }
      if (value === dismissed) return
      if (!updateAvailable.value) {
        updateAvailable.value = true
        options.onUpdate?.(value)
      }
    } catch {
      // 版本检测失败不打扰用户，等待下次轮询
    } finally {
      checking = false
    }
  }

  function start(): void {
    if (running) return
    running = true
    void check()

    const interval = options.interval ?? DEFAULT_INTERVAL
    if (Number.isFinite(interval) && interval > 0) {
      timer = setInterval(() => void check(), interval)
    }
  }

  function stop(): void {
    running = false
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
  }

  function dismiss(): void {
    dismissed = latest.value
    updateAvailable.value = false
  }

  return { latest, updateAvailable, check, start, stop, dismiss }
}
