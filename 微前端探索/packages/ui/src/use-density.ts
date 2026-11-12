import { ref, watch } from 'vue'

export type AdminDensity = 'comfortable' | 'compact'

const STORAGE_KEY = 'admin:density'

function read(): AdminDensity {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'compact' ? 'compact' : 'comfortable'
  } catch {
    return 'comfortable'
  }
}

function apply(value: AdminDensity) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.adminDensity = value
}

/**
 * 管理后台信息密度：默认或紧凑。
 * 通过 html[data-admin-density] 驱动 CSS 变量与组件间距，并持久化到 localStorage。
 */
export function useDensity() {
  const density = ref<AdminDensity>(read())
  apply(density.value)

  watch(density, (value) => {
    apply(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // 忽略存储不可用
    }
  })

  function setDensity(value: AdminDensity) {
    density.value = value
  }

  function toggle() {
    density.value = density.value === 'compact' ? 'comfortable' : 'compact'
  }

  return { density, setDensity, toggle }
}
