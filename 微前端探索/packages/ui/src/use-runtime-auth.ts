import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'
import { useAdminRuntime } from '@admin/core'

export function useRuntimeAuth() {
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

  const user = computed(() => {
    void version.value
    return auth?.getSnapshot()?.user ?? null
  })

  return {
    user,
    logout: () => (auth ? auth.logout() : Promise.resolve()),
  }
}
