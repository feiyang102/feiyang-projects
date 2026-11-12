import type { MicroAppDefinition, MicroPlugin } from '@admin/core'
import { MicroAppHost } from './host'

export interface MicroPluginOptions {
  /** entry 允许的来源，支持精确 origin、`*.example.com` 与 `*` */
  allowedOrigins?: string[]
}

export function defineMicroApp(app: MicroAppDefinition): MicroAppDefinition {
  return app
}

function checkEntry(entry: string, allowed: string[]): string | null {
  let url: URL
  try {
    url = new URL(entry)
  } catch {
    return 'entry 不是合法的 URL'
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'entry 只允许 http/https 协议'
  }

  if (allowed.length === 0) return null

  const permitted = allowed.some((pattern) => {
    if (pattern === '*') return true
    if (pattern.startsWith('*.')) {
      const domain = pattern.slice(2)
      return url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    }
    return url.origin === pattern
  })

  return permitted ? null : `entry 来源不在白名单内（${url.origin}）`
}

export function createMicroPlugin(
  apps: MicroAppDefinition[],
  options: MicroPluginOptions = {},
): MicroPlugin {
  const allowed = options.allowedOrigins ?? []

  const valid = apps.filter((app) => {
    if (!app.name) {
      // eslint-disable-next-line no-console
      console.error('[admin-micro] micro app is missing "name" and was skipped.')
      return false
    }
    if (!app.entry) {
      // eslint-disable-next-line no-console
      console.error(`[admin-micro] micro app "${app.name}" is missing "entry" and was skipped.`)
      return false
    }
    if (!app.basePath) {
      // eslint-disable-next-line no-console
      console.error(`[admin-micro] micro app "${app.name}" is missing "basePath" and was skipped.`)
      return false
    }
    const reason = checkEntry(app.entry, allowed)
    if (reason) {
      // eslint-disable-next-line no-console
      console.error(`[admin-micro] micro app "${app.name}" was skipped: ${reason}`)
      return false
    }
    return true
  })

  return { apps: valid, component: MicroAppHost }
}
