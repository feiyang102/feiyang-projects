<script setup lang="ts">
import { ElButton } from 'element-plus'

withDefaults(
  defineProps<{
    message?: string
    description?: string
    retryText?: string
  }>(),
  {
    message: '加载失败',
    retryText: '重试',
  },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="admin-error-state">
    <div class="admin-error-state__icon" aria-hidden="true">!</div>
    <p class="admin-error-state__message">{{ message }}</p>
    <p v-if="description" class="admin-error-state__desc">{{ description }}</p>
    <ElButton size="small" @click="$emit('retry')">{{ retryText }}</ElButton>
  </div>
</template>
