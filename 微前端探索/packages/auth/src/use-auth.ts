import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'
import { useAdminRuntime } from '@admin/core'
import type { AuthSnapshot } from '@admin/core'

export function useAuth() {
  const runtime = useAdminRuntime()
  const auth = runtime.auth
  const version = ref(0)

  if (auth?.subscribe && getCurrentScope()) {
    onScopeDispose(
      auth.subscribe(() => {
        version.value += 1
      }),
    )
  }

  const snapshot = computed<AuthSnapshot | null>(() => {
    void version.value
    return auth?.getSnapshot() ?? null
  })

  return {
    snapshot,
    user: computed(() => snapshot.value?.user ?? null),
    permissions: computed(() => snapshot.value?.permissions ?? []),
    roles: computed(() => snapshot.value?.roles ?? []),
    can: (codes: string | string[] | undefined, mode: 'any' | 'all' = 'any') => {
      void version.value
      return auth ? auth.can(codes ?? [], mode) : true
    },
    login: (payload?: unknown) => (auth ? auth.login(payload) : Promise.resolve()),
    logout: () => (auth ? auth.logout() : Promise.resolve()),
  }
}
