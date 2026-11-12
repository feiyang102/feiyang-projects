<script setup lang="ts">
import { RouterView } from 'vue-router'

const mounted = Boolean(window.__POWERED_BY_WUJIE__)
const userName = window.$wujie?.props?.userName
</script>

<template>
  <div class="micro-app">
    <header class="micro-app__header">
      <strong>__APP_TITLE__</strong>
      <span class="micro-app__badge">{{ mounted ? `被基座挂载 · ${userName ?? ''}` : '独立运行' }}</span>
    </header>
    <main class="micro-app__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.micro-app {
  padding: 16px;
  color: var(--admin-color-text, #1f2937);
  font-family: system-ui, -apple-system, 'PingFang SC', sans-serif;
}
.micro-app__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--admin-color-border, #e5e7eb);
}
.micro-app__badge {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--admin-color-primary, #1677ff);
  background: var(--admin-color-primary-soft, #e6f0ff);
  border-radius: 999px;
}
.micro-app__main {
  margin-top: 12px;
}
</style>
