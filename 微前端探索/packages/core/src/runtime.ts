import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { AdminRuntime } from './types'

export const ADMIN_RUNTIME_KEY: InjectionKey<AdminRuntime> = Symbol('admin-runtime')

export function useAdminRuntime(): AdminRuntime {
  const runtime = inject(ADMIN_RUNTIME_KEY, null)
  if (!runtime) {
    throw new Error('[admin-core] admin runtime not found. Components must be rendered inside createAdminApp().')
  }
  return runtime
}
