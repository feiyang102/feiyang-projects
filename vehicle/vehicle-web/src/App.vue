<script setup lang="ts">
// 车辆管理系统 PC 端（vehicle-web）
// 骨架入口：后续接入动态路由（公务车/系统管理/消息管理/数据统计/工作台/关于）
</script>

<template>
  <el-container class="layout">
    <el-header class="header">车辆管理系统（vehicle-web）</el-header>
    <el-main>
      <el-card>
        <template #header>项目骨架已就绪</template>
        <p>技术栈：Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router + ECharts + vue-i18n</p>
      </el-card>
    </el-main>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  color: #fff;
  background-color: #409eff;
  font-size: 18px;
  font-weight: 600;
}
</style>
