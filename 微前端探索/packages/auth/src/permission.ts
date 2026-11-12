import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { useAuth } from './use-auth'

export const Permission = defineComponent({
  name: 'AdminPermission',
  props: {
    code: {
      type: [String, Array] as PropType<string | string[]>,
      required: true,
    },
    mode: {
      type: String as PropType<'any' | 'all'>,
      default: 'any',
    },
  },
  setup(props, { slots }) {
    const { can } = useAuth()
    return () => (can(props.code, props.mode) ? slots.default?.() ?? null : slots.fallback?.() ?? null)
  },
})
