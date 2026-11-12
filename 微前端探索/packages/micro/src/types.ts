import type { Bridge, RemoteRouteInfo } from '@admin/bridge'
import type { MicroAppDefinition } from '@admin/core'

export interface MicroHostContext {
  getProps(): Record<string, unknown>
  reportRouteChange(info: RemoteRouteInfo): void
  reportError(error: unknown): void
  bridge: Bridge
}

export interface MicroAppInstance {
  readonly name: string
  update(props: Record<string, unknown>): void
  destroy(): Promise<void>
}

export interface MicroAppAdapter {
  readonly name: string
  mount(container: HTMLElement, app: MicroAppDefinition, ctx: MicroHostContext): Promise<MicroAppInstance>
}

const adapters = new Map<string, MicroAppAdapter>()

export function registerMicroAdapter(adapter: MicroAppAdapter) {
  adapters.set(adapter.name, adapter)
}

export function getRegisteredAdapter(name: string): MicroAppAdapter | undefined {
  return adapters.get(name)
}
