import { getCurrentInstance, onMounted, ref } from 'vue'
import type { Ref } from 'vue'

export interface DictItem {
  label: string
  value: string | number
  color?: string
  disabled?: boolean
}

export type DictLoader = () => Promise<DictItem[]>

export interface DictionaryOptions {
  /** 缓存时长（毫秒），默认 5 分钟 */
  ttl?: number
}

export interface Dictionary {
  register(code: string, loader: DictLoader): void
  load(code: string, force?: boolean): Promise<DictItem[]>
  get(code: string): DictItem[] | undefined
  label(code: string, value: string | number | null | undefined): string
  clear(code?: string): void
}

export function createDictionary(options: DictionaryOptions = {}): Dictionary {
  const ttl = options.ttl ?? 5 * 60_000
  const loaders = new Map<string, DictLoader>()
  const cache = new Map<string, { items: DictItem[]; expires: number }>()
  const inflight = new Map<string, Promise<DictItem[]>>()

  async function load(code: string, force = false): Promise<DictItem[]> {
    const cached = cache.get(code)
    if (!force && cached && cached.expires > Date.now()) return cached.items

    const existing = inflight.get(code)
    if (existing && !force) return existing

    const loader = loaders.get(code)
    if (!loader) {
      throw new Error(`[admin-core] dictionary "${code}" is not registered.`)
    }

    const promise = loader()
      .then((items) => {
        cache.set(code, { items, expires: Date.now() + ttl })
        return items
      })
      .finally(() => {
        inflight.delete(code)
      })

    inflight.set(code, promise)
    return promise
  }

  return {
    register(code, loader) {
      loaders.set(code, loader)
    },
    load,
    get(code) {
      const cached = cache.get(code)
      return cached && cached.expires > Date.now() ? cached.items : undefined
    },
    label(code, value) {
      if (value === null || value === undefined || value === '') return '-'
      const items = cache.get(code)?.items ?? []
      return items.find((item) => item.value === value)?.label ?? String(value)
    },
    clear(code) {
      if (code) {
        cache.delete(code)
        inflight.delete(code)
      } else {
        cache.clear()
        inflight.clear()
      }
    },
  }
}

export const dictionary = createDictionary()

export interface UseDictionaryReturn {
  items: Ref<DictItem[]>
  loading: Ref<boolean>
  error: Ref<unknown>
  label: (value: string | number | null | undefined) => string
  reload: () => Promise<void>
}

export function useDictionary(code: string, instance: Dictionary = dictionary): UseDictionaryReturn {
  const items = ref<DictItem[]>([]) as Ref<DictItem[]>
  const loading = ref(false)
  const error = ref<unknown>(null)

  async function reload() {
    loading.value = true
    error.value = null
    try {
      items.value = await instance.load(code, true)
    } catch (reason) {
      error.value = reason
    } finally {
      loading.value = false
    }
  }

  async function initialLoad() {
    const cached = instance.get(code)
    if (cached) {
      items.value = cached
      return
    }
    loading.value = true
    error.value = null
    try {
      items.value = await instance.load(code)
    } catch (reason) {
      error.value = reason
    } finally {
      loading.value = false
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      void initialLoad()
    })
  } else {
    void initialLoad()
  }

  return {
    items,
    loading,
    error,
    label: (value) => {
      if (value === null || value === undefined || value === '') return '-'
      return items.value.find((item) => item.value === value)?.label ?? String(value)
    },
    reload,
  }
}
