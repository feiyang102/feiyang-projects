import { defineComponent, h } from 'vue'
import type { ErrorPageKind } from './types'

const PRESET: Record<ErrorPageKind, { title: string; description: string }> = {
  '403': { title: '403', description: '抱歉，你没有访问该页面的权限。' },
  '404': { title: '404', description: '页面不存在或已被移除。' },
  '500': { title: '500', description: '服务开小差了，请稍后重试。' },
}

export const ErrorPage = defineComponent({
  name: 'AdminErrorPage',
  props: {
    kind: { type: String as () => ErrorPageKind, default: '404' },
  },
  setup(props) {
    return () => {
      const preset = PRESET[props.kind]
      return h('div', { class: 'admin-error-page' }, [
        h('div', { class: 'admin-error-page__code' }, preset.title),
        h('div', { class: 'admin-error-page__desc' }, preset.description),
        h(
          'a',
          { class: 'admin-error-page__action', href: '/' },
          '返回首页',
        ),
      ])
    }
  },
})
