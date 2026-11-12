import type { MicroAppAdapter } from '../types'

function joinUrl(entry: string, basePath: string): string {
  const base = basePath.startsWith('/') ? basePath : `/${basePath}`
  return `${entry.replace(/\/$/, '')}${base === '/' ? '' : base}`
}

export const iframeAdapter: MicroAppAdapter = {
  name: 'iframe',
  async mount(container, app) {
    const iframe = document.createElement('iframe')
    iframe.src = joinUrl(app.entry, app.basePath)
    iframe.title = app.name
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = '0'
    iframe.setAttribute('data-admin-micro', app.name)
    container.appendChild(iframe)

    return {
      name: app.name,
      update() {
        // iframe 适配器不支持 props 热更新
      },
      async destroy() {
        iframe.remove()
      },
    }
  },
}
