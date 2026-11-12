import { ref } from 'vue'
import type { Ref } from 'vue'

export interface NotificationItem {
  id: string
  title: string
  description?: string
  time?: string
  read?: boolean
  /** 点击后跳转的站内地址 */
  link?: string
}

export interface NotificationCenterOptions {
  fetch: () => Promise<NotificationItem[]>
  /** 轮询间隔（毫秒），默认 60 秒；非正数表示只加载一次 */
  interval?: number
  /** 已读状态持久化键 */
  storageKey?: string
}

export interface NotificationState {
  items: Ref<NotificationItem[]>
  unread: Ref<number>
  loading: Ref<boolean>
  refresh: () => Promise<void>
  read: (id: string) => void
  readAll: () => void
}

export interface NotificationCenter extends NotificationState {
  start: () => void
  stop: () => void
}

const DEFAULT_STORAGE_KEY = 'admin:notifications-read'
const DEFAULT_INTERVAL = 60 * 1000

function loadRead(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey)
    const values = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string') : [])
  } catch {
    return new Set()
  }
}

export function createNotificationCenter(options: NotificationCenterOptions): NotificationCenter {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY
  const items = ref<NotificationItem[]>([])
  const unread = ref(0)
  const loading = ref(false)
  const readIds = loadRead(storageKey)

  let timer: ReturnType<typeof setInterval> | undefined
  let seq = 0
  let running = false

  function countUnread() {
    unread.value = items.value.filter((item) => !item.read).length
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...readIds]))
    } catch {
      // 忽略存储不可用
    }
  }

  async function refresh(): Promise<void> {
    const current = ++seq
    loading.value = true
    try {
      const list = await options.fetch()
      if (current !== seq) return
      items.value = (Array.isArray(list) ? list : []).map((item) => ({
        ...item,
        read: item.read === true || readIds.has(item.id),
      }))
      countUnread()
    } catch {
      // 通知加载失败不打扰用户，保留已有数据
    } finally {
      if (current === seq) loading.value = false
    }
  }

  function read(id: string) {
    if (readIds.has(id)) return
    readIds.add(id)
    items.value = items.value.map((item) => (item.id === id ? { ...item, read: true } : item))
    countUnread()
    persist()
  }

  function readAll() {
    if (items.value.length === 0) return
    for (const item of items.value) readIds.add(item.id)
    items.value = items.value.map((item) => ({ ...item, read: true }))
    countUnread()
    persist()
  }

  function start() {
    if (running) return
    running = true
    void refresh()
    const interval = options.interval ?? DEFAULT_INTERVAL
    if (Number.isFinite(interval) && interval > 0) {
      timer = setInterval(() => void refresh(), interval)
    }
  }

  function stop() {
    running = false
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
  }

  return { items, unread, loading, refresh, read, readAll, start, stop }
}
