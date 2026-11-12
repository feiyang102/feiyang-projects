<script setup lang="ts">
import { ElCard } from 'element-plus'
</script>

<template>
  <ElCard>
    <template #header>子应用首页</template>
    <p>该页面既能独立启动，也能被基座挂载。</p>
    <p>在 <code>src/router.ts</code> 中新增路由即可扩展页面。</p>
  </ElCard>
</template>
