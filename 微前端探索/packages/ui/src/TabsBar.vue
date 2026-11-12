<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { useTabsStore } from '@admin/core'
import type { TabItem } from '@admin/core'

const router = useRouter()
const route = useRoute()
const tabs = useTabsStore()

const menu = reactive({ visible: false, x: 0, y: 0, fullPath: '' })

function activate(fullPath: string) {
  if (route.fullPath !== fullPath) void router.push(fullPath)
}

function close(fullPath: string) {
  const closingActive = route.fullPath === fullPath
  const next = tabs.close(fullPath)
  if (closingActive) {
    void router.push(next?.fullPath ?? '/')
  }
}

function closeOthers(fullPath: string) {
  tabs.closeOthers(fullPath)
}

function closeAll() {
  const next = tabs.closeAll()
  void router.push(next?.fullPath ?? '/')
}

function onCommand(command: string) {
  if (command === 'others') closeOthers(route.fullPath)
  else closeAll()
}

function openMenu(event: MouseEvent, tab: TabItem) {
  event.preventDefault()
  menu.visible = true
  menu.x = Math.min(event.clientX, window.innerWidth - 168)
  menu.y = event.clientY
  menu.fullPath = tab.fullPath
}

function hideMenu() {
  menu.visible = false
}

function closeFromMenu() {
  close(menu.fullPath)
  hideMenu()
}

function closeOthersFromMenu() {
  closeOthers(menu.fullPath)
  hideMenu()
}

function closeAllFromMenu() {
  closeAll()
  hideMenu()
}

onMounted(() => {
  window.addEventListener('click', hideMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', hideMenu)
})
</script>

<template>
  <div class="admin-tabs">
    <div class="admin-tabs__list">
      <button
        v-for="tab in tabs.tabs"
        :key="tab.fullPath"
        class="admin-tabs__item"
        :class="{ 'is-active': tab.fullPath === route.fullPath }"
        type="button"
        @click="activate(tab.fullPath)"
        @contextmenu="openMenu($event, tab)"
      >
        <span>{{ tab.title }}</span>
        <span
          v-if="!tab.affix"
          class="admin-tabs__close"
          role="button"
          aria-label="关闭页签"
          @click.stop="close(tab.fullPath)"
        >
          ×
        </span>
      </button>
    </div>
    <div class="admin-tabs__actions">
      <ElDropdown trigger="click" @command="onCommand">
        <ElButton text size="small">页签操作</ElButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem command="others">关闭其他</ElDropdownItem>
            <ElDropdownItem command="all">关闭全部</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>

    <div
      v-if="menu.visible"
      class="admin-tabs__menu"
      :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
      @click.stop
    >
      <button type="button" @click="closeFromMenu">关闭</button>
      <button type="button" @click="closeOthersFromMenu">关闭其他</button>
      <button type="button" @click="closeAllFromMenu">关闭全部</button>
    </div>
  </div>
</template>
