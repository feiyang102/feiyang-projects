import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminRuntime, useTabsStore } from '@admin/core'
import type { MicroAppDefinition, MicroPropsContext } from '@admin/core'
import type { RemoteRouteInfo } from '@admin/bridge'
import { getRegisteredAdapter } from './types'
import type { MicroAppAdapter, MicroAppInstance } from './types'
import { iframeAdapter } from './adapters/iframe'

const DEFAULT_TIMEOUT = 10_000

function withTimeout<T>(task: Promise<T>, timeout: number): Promise<T> {
  if (!Number.isFinite(timeout) || timeout <= 0) return task
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`micro app timeout after ${timeout}ms`)), timeout)
    task.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function checkHealth(url: string, timeout: number): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal, mode: 'cors' })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function resolveAdapter(name?: string): Promise<MicroAppAdapter> {
  const key = name ?? 'wujie'
  const registered = getRegisteredAdapter(key)
  if (registered) return registered

  if (key === 'wujie') {
    try {
      const module = await import('./adapters/wujie')
      return module.wujieAdapter
    } catch {
      // eslint-disable-next-line no-console
      console.warn('[admin-micro] wujie adapter is unavailable, falling back to iframe adapter.')
    }
  }

  return iframeAdapter
}

function readThemeTokens(mode: 'light' | 'dark'): Record<string, string> {
  if (typeof window === 'undefined') return { mode }
  const style = getComputedStyle(document.documentElement)
  return {
    mode,
    primaryColor: style.getPropertyValue('--admin-color-primary').trim(),
    backgroundColor: style.getPropertyValue('--admin-color-bg').trim(),
    surfaceColor: style.getPropertyValue('--admin-color-surface').trim(),
    textColor: style.getPropertyValue('--admin-color-text').trim(),
    textSecondaryColor: style.getPropertyValue('--admin-color-text-secondary').trim(),
    borderColor: style.getPropertyValue('--admin-color-border').trim(),
    radius: style.getPropertyValue('--admin-radius').trim(),
  }
}

export const MicroAppHost = defineComponent({
  name: 'MicroAppHost',
  setup() {
    const runtime = useAdminRuntime()
    const route = useRoute()
    const router = useRouter()
    const tabs = useTabsStore()
    const container = ref<HTMLElement | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    let instance: MicroAppInstance | null = null
    let mountedName = ''
    let stopAuth: (() => void) | undefined
    const remoteTitles = new Map<string, string>()

    const definition = computed<MicroAppDefinition | undefined>(() =>
      runtime.microApps.find((app) => app.name === route.meta.micro),
    )

    function buildProps(app: MicroAppDefinition): Record<string, unknown> {
      const snapshot = runtime.auth?.getSnapshot()
      const theme = readThemeTokens(runtime.theme.mode.value)
      const context: MicroPropsContext = {
        auth: runtime.auth,
        theme,
        locale: 'zh-CN',
        route: route,
      }
      return {
        userId: snapshot?.user.id,
        userName: snapshot?.user.name,
        roles: snapshot?.roles ?? [],
        permissions: snapshot?.permissions ?? [],
        theme,
        locale: 'zh-CN',
        initialPath: route.fullPath,
        ...(app.props ? app.props(context) : {}),
      }
    }

    function applyRemoteTitles() {
      for (const tab of tabs.tabs) {
        const title = remoteTitles.get(tab.path)
        if (title && tab.title !== title) tab.title = title
      }
    }

    function onRemoteRoute(info: RemoteRouteInfo) {
      runtime.bridge.emit('app:route-change', info)
      if (info.title && info.path) remoteTitles.set(info.path, info.title)
      applyRemoteTitles()
      if (info.path && info.path !== route.path && info.path !== route.fullPath) {
        void router.replace({ path: info.path, query: route.query }).then(applyRemoteTitles)
      }
    }

    function onRemoteError(reason: unknown) {
      const message = reason instanceof Error ? reason.message : String(reason)
      error.value = message
      runtime.bridge.emit('app:error', {
        app: mountedName || 'unknown',
        message,
        stack: reason instanceof Error ? reason.stack : undefined,
      })
    }

    async function destroy() {
      if (!instance) return
      try {
        await instance.destroy()
      } finally {
        instance = null
        mountedName = ''
      }
    }

    async function load() {
      const app = definition.value
      if (!app || !container.value) return
      if (mountedName === app.name && instance) return

      await destroy()
      loading.value = true
      error.value = null

      try {
        if (app.healthCheckUrl) {
          const healthy = await checkHealth(app.healthCheckUrl, app.healthCheckTimeout ?? 3000)
          if (!healthy) {
            throw new Error(`子应用 "${app.name}" 健康检查未通过`)
          }
        }
        const adapter = await resolveAdapter(app.adapter)
        instance = await withTimeout(
          adapter.mount(container.value, app, {
            getProps: () => buildProps(app),
            reportRouteChange: onRemoteRoute,
            reportError: onRemoteError,
            bridge: runtime.bridge,
          }),
          app.timeout ?? DEFAULT_TIMEOUT,
        )
        mountedName = app.name
      } catch (reason) {
        onRemoteError(reason)
      } finally {
        loading.value = false
      }
    }

    function retry() {
      error.value = null
      void load()
    }

    watch(
      () => tabs.tabs.map((tab) => `${tab.path}|${tab.title}`).join('|'),
      () => applyRemoteTitles(),
    )

    watch(
      () => route.meta.micro,
      () => {
        void load()
      },
    )

    watch(
      () => runtime.theme.mode.value,
      async () => {
        await nextTick()
        if (!instance || !definition.value) return
        const props = buildProps(definition.value)
        instance.update(props)
        runtime.bridge.emit('host:theme-change', props.theme as Record<string, string>)
      },
    )

    onMounted(() => {
      void load()
      stopAuth = runtime.auth?.subscribe?.(() => {
        const app = definition.value
        if (!app || !instance) return
        const props = buildProps(app)
        instance.update(props)
        const snapshot = runtime.auth?.getSnapshot()
        runtime.bridge.emit('host:auth-change', {
          userId: snapshot?.user.id ?? '',
          userName: snapshot?.user.name ?? '',
          roles: snapshot?.roles ?? [],
          permissions: snapshot?.permissions ?? [],
          permissionsVersion: snapshot?.permissionsVersion,
        })
      })
    })

    onUnmounted(() => {
      stopAuth?.()
      void destroy()
    })

    return () =>
      h('div', { class: 'admin-micro-host' }, [
        error.value
          ? h('div', { class: 'admin-micro-host__error' }, [
              h('p', { class: 'admin-micro-host__error-text' }, error.value),
              h(
                'button',
                { type: 'button', class: 'admin-micro-host__retry', onClick: retry },
                '重新加载',
              ),
            ])
          : null,
        loading.value ? h('div', { class: 'admin-micro-host__loading' }, '子应用加载中…') : null,
        h('div', {
          ref: container,
          class: 'admin-micro-host__container',
          style: error.value ? 'display:none' : '',
        }),
      ])
  },
})
