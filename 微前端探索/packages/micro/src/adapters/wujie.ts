import { bus, destroyApp, setupApp, startApp } from 'wujie'
import type { RemoteRouteInfo } from '@admin/bridge'
import { registerMicroAdapter } from '../types'
import type { MicroAppAdapter } from '../types'

export const wujieAdapter: MicroAppAdapter = {
  name: 'wujie',
  async mount(container, app, ctx) {
    const props = ctx.getProps()

    const onRemoteRoute = (info: unknown) => {
      const payload = info as RemoteRouteInfo | undefined
      if (!payload || payload.app !== app.name) return
      ctx.reportRouteChange(payload)
    }
    bus.$on('app:route-change', onRemoteRoute)

    setupApp({
      name: app.name,
      url: app.entry,
      el: container,
      alive: app.alive ?? true,
      sync: false,
      props,
      degrade: false,
      loadError: (url) => {
        ctx.reportError(new Error(`failed to load micro app "${app.name}" from ${url}`))
      },
    })

    await startApp({ name: app.name, url: app.entry, el: container, props })

    return {
      name: app.name,
      update(nextProps: Record<string, unknown>) {
        bus.$emit('host:props-change', nextProps)
      },
      async destroy() {
        bus.$off('app:route-change', onRemoteRoute)
        destroyApp(app.name)
      },
    }
  },
}

registerMicroAdapter(wujieAdapter)
