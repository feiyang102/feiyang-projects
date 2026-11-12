<script setup lang="ts">
import { computed } from 'vue'
import { createWatermarkDataUrl } from './watermark'

const props = withDefaults(
  defineProps<{
    text: string
    opacity?: number
    color?: string
    gap?: number
    fontSize?: number
  }>(),
  {
    opacity: 0.08,
    color: '#8c8c8c',
    gap: 120,
    fontSize: 14,
  },
)

const background = computed(() => createWatermarkDataUrl(props.text, props))
</script>

<template>
  <div
    class="admin-watermark"
    aria-hidden="true"
    :style="background ? { backgroundImage: `url(${background})` } : undefined"
  />
</template>
