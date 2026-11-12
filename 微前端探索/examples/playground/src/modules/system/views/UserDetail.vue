<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { AdminPage } from '@admin/ui'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <AdminPage title="用户详情" description="该页面不进入菜单，但会让「账号管理」保持高亮。">
    <ElDescriptions :column="1" border>
      <ElDescriptionsItem label="用户 ID">{{ id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="说明">刷新该地址仍可打开，页签标题固定为「用户详情」。</ElDescriptionsItem>
    </ElDescriptions>
  </AdminPage>
</template>
