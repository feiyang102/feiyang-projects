import { defineComponent, h, onErrorCaptured, ref } from 'vue'

/**
 * 捕获子树在渲染、生命周期与 setup 中抛出的错误，展示可重试的错误态。
 * 不处理异步回调中的错误（由全局 errorHandler 兜底）。
 */
export const RouteErrorBoundary = defineComponent({
  name: 'AdminRouteErrorBoundary',
  setup(_, { slots }) {
    const error = ref<Error | null>(null)
    const version = ref(0)

    onErrorCaptured((reason) => {
      error.value = reason instanceof Error ? reason : new Error(String(reason))
      return false
    })

    function retry() {
      error.value = null
      version.value += 1
    }

    return () =>
      error.value
        ? h('div', { class: 'admin-error-state' }, [
            h('div', { class: 'admin-error-state__icon', 'aria-hidden': 'true' }, '!'),
            h('p', { class: 'admin-error-state__message' }, error.value.message || '页面渲染出错'),
            h('button', { type: 'button', class: 'admin-error-state__action', onClick: retry }, '重试'),
          ])
        : h('div', { key: version.value, class: 'admin-route-boundary' }, slots.default?.())
  },
})
