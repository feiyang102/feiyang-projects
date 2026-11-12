<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const mounted = Boolean(window.__POWERED_BY_WUJIE__)
const props = computed(() => window.$wujie?.props ?? {})
const permissions = computed(() => props.value.permissions ?? [])
</script>

<template>
  <div class="remote-order">
    <header class="remote-order__header">
      <div>
        <strong>订单中心</strong>
        <span class="remote-order__badge">{{ mounted ? '被基座挂载' : '独立运行' }}</span>
      </div>
      <div class="remote-order__meta">
        <span v-if="mounted">当前用户：{{ props.userName ?? '未知' }}</span>
        <span v-if="mounted">权限码：{{ permissions.length }}</span>
      </div>
    </header>
    <nav class="remote-order__nav">
      <RouterLink to="/orders">订单列表</RouterLink>
    </nav>
    <main class="remote-order__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.remote-order {
  font-family: system-ui, -apple-system, 'PingFang SC', sans-serif;
  padding: 16px;
  color: var(--admin-color-text, #1f2937);
}
.remote-order__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--admin-color-border, #e5e7eb);
}
.remote-order__badge {
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--admin-color-primary, #1677ff);
  background: var(--admin-color-primary-soft, #e6f0ff);
  border-radius: 999px;
}
.remote-order__meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--admin-color-text-secondary, #6b7280);
}
.remote-order__nav {
  margin: 12px 0;
}
.remote-order__nav a {
  margin-right: 12px;
  color: var(--admin-color-primary, #1677ff);
  text-decoration: none;
}
.remote-order__main {
  min-height: 200px;
}
</style>
