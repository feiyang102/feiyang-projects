<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElCard, ElDescriptions, ElDescriptionsItem } from 'element-plus'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <ElCard>
    <template #header>订单详情</template>
    <ElDescriptions :column="1" border>
      <ElDescriptionsItem label="订单号">{{ id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="说明">刷新该地址应仍能打开本页（基座持有 URL 主权）。</ElDescriptionsItem>
    </ElDescriptions>
  </ElCard>
</template>
