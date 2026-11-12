import { createApp } from 'vue'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/descriptions/style/css'
import 'element-plus/es/components/descriptions-item/style/css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import type { RouteLocationNormalized } from 'vue-router'
import App from './App.vue'
import { router } from './router'

const hostBase = window.__POWERED_BY_WUJIE__ ? '/order' : ''
const initialProps = window.$wujie?.props
const initialPath = typeof initialProps?.initialPath === 'string' ? initialProps.initialPath : ''

const TOKEN_MAP: Record<string, string> = {
  primaryColor: '--admin-color-primary',
  backgroundColor: '--admin-color-bg',
  surfaceColor: '--admin-color-surface',
  textColor: '--admin-color-text',
  textSecondaryColor: '--admin-color-text-secondary',
  borderColor: '--admin-color-border',
  radius: '--admin-radius',
}

function applyTheme(theme?: Record<string, string>) {
  if (!theme) return
  const root = document.documentElement
  const mode = theme.mode === 'dark' ? 'dark' : 'light'
  root.dataset.adminTheme = mode
  root.classList.toggle('dark', mode === 'dark')
  for (const [key, cssVar] of Object.entries(TOKEN_MAP)) {
    const value = theme[key]
    if (value) root.style.setProperty(cssVar, value)
  }
  document.body.style.margin = '0'
  document.body.style.background = 'var(--admin-color-bg, #f4f6f9)'
  document.body.style.color = 'var(--admin-color-text, #101828)'
}

applyTheme(initialProps?.theme)

window.$wujie?.bus?.$on('host:props-change', (payload) => {
  const props = payload as { theme?: Record<string, string> } | undefined
  applyTheme(props?.theme)
})

let reporting = false

function report(to: RouteLocationNormalized) {
  window.$wujie?.bus?.$emit('app:route-change', {
    app: 'order',
    path: `${hostBase}${to.path}`,
    title: typeof to.meta.title === 'string' ? to.meta.title : undefined,
  })
}

router.afterEach((to) => {
  if (!reporting) return
  report(to)
})

const app = createApp(App).use(router)

void router.isReady().then(async () => {
  if (hostBase && initialPath.startsWith(hostBase)) {
    const target = initialPath.slice(hostBase.length) || '/'
    if (target !== router.currentRoute.value.fullPath) {
      await router.replace(target)
    }
  }
  reporting = true
  report(router.currentRoute.value)
  app.mount('#app')
})
