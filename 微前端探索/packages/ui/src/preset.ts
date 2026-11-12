import type { VNodeChild } from 'vue'
import type { LayoutPreset } from '@admin/core'
import type { WatermarkOptions } from './watermark'
import Layout from './Layout.vue'

export interface AdminPresetOptions {
  logo?: string
  tabs?: boolean
  breadcrumb?: boolean
  watermark?: boolean | WatermarkOptions
  slots?: Record<string, () => VNodeChild>
}

export function adminPreset(options: AdminPresetOptions = {}): LayoutPreset {
  const { slots, ...props } = options
  return {
    component: Layout,
    props: props as Record<string, unknown>,
    slots,
  }
}
