export interface AuthSnapshotPayload {
  userId: string
  userName: string
  roles: string[]
  permissions: string[]
  permissionsVersion?: string
}

export interface RemoteRouteInfo {
  app: string
  path: string
  title?: string
  breadcrumb?: string[]
}

export interface BridgeEvents {
  'host:theme-change': Record<string, string>
  'host:auth-change': AuthSnapshotPayload
  'host:locale-change': string
  'app:route-change': RemoteRouteInfo
  'app:error': { app: string; message: string; stack?: string }
  'app:request-auth': { reason: string }
}

export type BridgeEventName = keyof BridgeEvents
export type BridgeHandler<K extends BridgeEventName> = (payload: BridgeEvents[K]) => void

export interface BridgeTransport {
  post(event: string, payload: unknown): void
  subscribe(event: string, handler: (payload: unknown) => void): () => void
}

export interface Bridge {
  emit<K extends BridgeEventName>(event: K, payload: BridgeEvents[K]): void
  on<K extends BridgeEventName>(event: K, handler: BridgeHandler<K>): () => void
  request<T = unknown>(method: string, params?: unknown): Promise<T>
  provide(method: string, handler: (params: unknown) => unknown | Promise<unknown>): void
}

type AnyHandler = (payload: unknown) => void
type Provider = (params: unknown) => unknown | Promise<unknown>

export function createBridge(transport?: BridgeTransport): Bridge {
  const localHandlers = new Map<string, Set<AnyHandler>>()
  const providers = new Map<string, Provider>()

  if (transport) {
    transport.subscribe('*', (payload) => {
      const message = payload as { event?: string; data?: unknown }
      if (!message?.event) return
      localHandlers.get(message.event)?.forEach((handler) => handler(message.data))
    })
  }

  function emit<K extends BridgeEventName>(event: K, payload: BridgeEvents[K]) {
    localHandlers.get(event)?.forEach((handler) => handler(payload))
    transport?.post(event, payload)
  }

  return {
    emit,
    on<K extends BridgeEventName>(event: K, handler: BridgeHandler<K>) {
      const set = localHandlers.get(event) ?? new Set<AnyHandler>()
      set.add(handler as AnyHandler)
      localHandlers.set(event, set)
      return () => set.delete(handler as AnyHandler)
    },
    async request<T = unknown>(method: string, params?: unknown): Promise<T> {
      const provider = providers.get(method)
      if (!provider) {
        throw new Error(`[admin-bridge] no provider registered for "${method}"`)
      }
      return (await provider(params)) as T
    },
    provide(method: string, handler: Provider) {
      providers.set(method, handler)
    },
  }
}
