<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import {
  ElAside,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElColorPicker,
  ElContainer,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElDrawer,
  ElHeader,
  ElMain,
  ElPopover,
} from 'element-plus'
import { useAdminRuntime, useTabsStore } from '@admin/core'
import type { NotificationItem } from '@admin/core'
import { useRuntimeAuth } from './use-runtime-auth'
import { useThemeColor } from './use-theme-color'
import { useDensity } from './use-density'
import SideMenu from './SideMenu'
import TabsBar from './TabsBar.vue'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import CommandPalette from './CommandPalette.vue'
import { mergeRecentCommands } from './command'
import Watermark from './Watermark.vue'
import type { WatermarkOptions } from './watermark'
import type { CommandItem } from './command'

const props = withDefaults(
  defineProps<{
    logo?: string
    tabs?: boolean
    breadcrumb?: boolean
    watermark?: boolean | WatermarkOptions
  }>(),
  {
    tabs: true,
    breadcrumb: true,
    watermark: false,
  },
)

const runtime = useAdminRuntime()
const route = useRoute()
const router = useRouter()
const tabs = useTabsStore()
const { user, logout } = useRuntimeAuth()
const theme = runtime.theme
const version = runtime.version
const session = runtime.session
const notifications = runtime.notifications
const { primary, presets, set: setPrimary, reset: resetPrimary } = useThemeColor()
const { density, setDensity } = useDensity()

const menus = runtime.menus
const collapsed = runtime.collapsed
const navigating = ref(false)
const paletteOpen = ref(false)
const drawerOpen = ref(false)
const isMobile = ref(false)
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const mainRef = ref<HTMLElement | null>(null)
const scrollPositions = new Map<string, number>()
let navigateTimer: ReturnType<typeof setTimeout> | undefined
let scrollTimer: ReturnType<typeof setTimeout> | undefined

const commands = computed<CommandItem[]>(() => {
  const list: CommandItem[] = []
  const walk = (nodes: typeof menus.value, group?: string) => {
    for (const node of nodes) {
      list.push({ key: node.key, title: node.title, path: node.path, group })
      if (node.children?.length) walk(node.children, node.title)
    }
  }
  walk(menus.value)
  return list
})

const RECENT_COMMANDS_KEY = 'admin:recent-commands'
const RECENT_LIMIT = 5

function readRecentCommands(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COMMANDS_KEY)
    const values = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(values)
      ? values.filter((value): value is string => typeof value === 'string').slice(0, RECENT_LIMIT)
      : []
  } catch {
    return []
  }
}

const recentCommands = ref<string[]>(readRecentCommands())
const paletteItems = computed(() => mergeRecentCommands(commands.value, recentCommands.value))

function rememberCommand(item: CommandItem) {
  recentCommands.value = [item.key, ...recentCommands.value.filter((key) => key !== item.key)].slice(
    0,
    RECENT_LIMIT,
  )
  try {
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recentCommands.value))
  } catch {
    // 忽略存储不可用
  }
}

function handleCommandSelect(item: CommandItem) {
  rememberCommand(item)
  if (item.path !== route.path) void router.push(item.path)
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    paletteOpen.value = !paletteOpen.value
  }
}

const removeBeforeEach = router.beforeEach(() => {
  navigating.value = true
  if (mainRef.value) scrollPositions.set(route.fullPath, mainRef.value.scrollTop)
})

const removeAfterEach = router.afterEach((to) => {
  if (navigateTimer) clearTimeout(navigateTimer)
  navigateTimer = setTimeout(() => {
    navigating.value = false
  }, 180)
  const top = to.meta.cache === true ? scrollPositions.get(to.fullPath) ?? 0 : 0
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    mainRef.value?.scrollTo?.({ top })
  }, 0)
})

watch(
  () => tabs.tabs.map((tab) => tab.fullPath),
  (openPaths) => {
    for (const key of scrollPositions.keys()) {
      if (!openPaths.includes(key)) scrollPositions.delete(key)
    }
  },
)
const isDark = computed(() => theme.mode.value === 'dark')
const brandLetter = computed(() => runtime.config.app.title.slice(0, 1).toUpperCase())

const modeOptions = [
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
  { value: 'system', label: '跟随系统' },
] as const

const watermarkOptions = computed<WatermarkOptions>(() =>
  typeof props.watermark === 'object' ? props.watermark : {},
)

const watermarkText = computed(() => {
  if (watermarkOptions.value.text) return watermarkOptions.value.text
  const name = user.value?.name ?? ''
  const date = new Date().toLocaleDateString('zh-CN')
  return name ? `${name} ${date}` : date
})

const breadcrumbs = computed(() => {
  const list = route.matched
    .filter((record) => Boolean(record.meta?.title))
    .map((record, index, all) => ({
      title: record.meta.title as string,
      path: record.path,
      current: index === all.length - 1,
    }))

  // 子应用内部路由标题由页签上报，若与路由 meta 不同则作为最后一级面包屑
  const tabTitle = tabs.tabs.find((tab) => tab.path === route.path)?.title
  if (tabTitle && list.length > 0 && list[list.length - 1].title !== tabTitle) {
    list[list.length - 1].current = false
    list.push({ title: tabTitle, path: route.path, current: true })
  }

  return list
})

const activeMenu = computed(() => {
  if (typeof route.meta.activeMenu === 'string') return route.meta.activeMenu
  if (typeof route.meta.menuPath === 'string') return route.meta.menuPath
  return route.path
})

function toggleCollapse() {
  if (isMobile.value) {
    drawerOpen.value = true
    return
  }
  collapsed.value = !collapsed.value
}

function toggleTheme() {
  theme.toggle()
}

function onPrimaryChange(value: string | null) {
  if (value) setPrimary(value)
}

function onSelect(index: string) {
  drawerOpen.value = false
  if (/^https?:\/\//.test(index)) {
    window.open(index, '_blank', 'noopener')
    return
  }
  if (route.path !== index) void router.push(index)
}

async function handleUserCommand(command: string) {
  if (command !== 'logout') return
  await logout()
  void router.replace('/login')
}

function handleResize() {
  isMobile.value = window.innerWidth < 900
  if (isMobile.value) collapsed.value = true
}

function handleOnline() {
  online.value = true
}

function handleOffline() {
  online.value = false
}

function refreshPage() {
  window.location.reload()
}

function openNotification(item: NotificationItem) {
  notifications?.read(item.id)
  if (item.link && item.link !== route.path) void router.push(item.link)
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  removeBeforeEach()
  removeAfterEach()
  if (navigateTimer) clearTimeout(navigateTimer)
  if (scrollTimer) clearTimeout(scrollTimer)
})
</script>

<template>
  <ElContainer class="admin-layout">
    <a class="admin-skip-link" href="#admin-main">跳到主要内容</a>
    <div class="admin-progress" :class="{ 'is-active': navigating }" />
    <Watermark
      v-if="watermark"
      class="admin-layout__watermark"
      :text="watermarkText"
      v-bind="watermarkOptions"
    />
    <ElAside
      v-if="!isMobile"
      class="admin-layout__aside"
      :width="collapsed ? 'var(--admin-aside-collapsed-width)' : 'var(--admin-aside-width)'"
    >
      <div class="admin-layout__brand">
        <img v-if="logo" :src="logo" alt="logo" class="admin-layout__logo" />
        <span v-else class="admin-layout__brand-mark">{{ brandLetter }}</span>
        <span v-show="!collapsed" class="admin-layout__title">{{ runtime.config.app.title }}</span>
      </div>
      <SideMenu :items="menus" :collapsed="collapsed" :default-active="activeMenu" @select="onSelect" />
    </ElAside>
    <ElDrawer
      v-else
      v-model="drawerOpen"
      direction="ltr"
      size="240px"
      :with-header="false"
      class="admin-mobile-drawer"
    >
      <div class="admin-mobile-menu">
        <div class="admin-layout__brand">
          <img v-if="logo" :src="logo" alt="logo" class="admin-layout__logo" />
          <span v-else class="admin-layout__brand-mark">{{ brandLetter }}</span>
          <span class="admin-layout__title">{{ runtime.config.app.title }}</span>
        </div>
        <SideMenu :items="menus" :default-active="activeMenu" @select="onSelect" />
      </div>
    </ElDrawer>
    <ElContainer>
      <ElHeader class="admin-layout__header" height="var(--admin-header-height)">
        <div class="admin-layout__header-left">
          <button class="admin-layout__icon-button" type="button" aria-label="切换侧边栏" @click="toggleCollapse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>
          <ElBreadcrumb v-if="breadcrumb && !isMobile" class="admin-layout__breadcrumb" separator="/">
            <ElBreadcrumbItem v-for="item in breadcrumbs" :key="item.path" :to="item.current ? undefined : item.path">
              {{ item.title }}
            </ElBreadcrumbItem>
          </ElBreadcrumb>
        </div>
        <div class="admin-layout__header-right">
          <slot name="header-right">
            <ElPopover
              v-if="notifications"
              trigger="click"
              placement="bottom-end"
              :width="320"
              popper-class="admin-notification-popover"
            >
              <template #reference>
                <button class="admin-layout__icon-button admin-layout__bell" type="button" aria-label="通知">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  <span v-if="notifications.unread.value > 0" class="admin-layout__bell-badge">
                    {{ notifications.unread.value > 99 ? '99+' : notifications.unread.value }}
                  </span>
                </button>
              </template>
              <div class="admin-notifications">
                <header class="admin-notifications__header">
                  <span>通知</span>
                  <button
                    type="button"
                    :disabled="notifications.unread.value === 0"
                    @click="notifications.readAll()"
                  >
                    全部已读
                  </button>
                </header>
                <ul class="admin-notifications__list">
                  <li v-for="item in notifications.items.value" :key="item.id">
                    <button
                      type="button"
                      class="admin-notifications__item"
                      :class="{ 'is-unread': !item.read }"
                      @click="openNotification(item)"
                    >
                      <span class="admin-notifications__title">{{ item.title }}</span>
                      <span v-if="item.time" class="admin-notifications__time">{{ item.time }}</span>
                      <span v-if="item.description" class="admin-notifications__desc">{{ item.description }}</span>
                    </button>
                  </li>
                  <li v-if="notifications.items.value.length === 0" class="admin-notifications__empty">暂无通知</li>
                </ul>
              </div>
            </ElPopover>
            <button
              class="admin-layout__search-button"
              type="button"
              aria-label="搜索菜单"
              @click="paletteOpen = true"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <span class="admin-layout__search-text">搜索</span>
              <span class="admin-layout__search-kbd">⌘K</span>
            </button>
            <ElPopover trigger="click" placement="bottom-end" :width="190" popper-class="admin-theme-popover">
              <template #reference>
                <button class="admin-layout__icon-button" type="button" aria-label="主题色">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H13a2 2 0 0 1 0-4h4a4 4 0 0 0 0-8h-5Z" />
                    <circle cx="8.5" cy="9" r="1.1" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="14" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                </button>
              </template>
              <div class="admin-theme-panel">
                <div class="admin-theme-modes">
                  <button
                    v-for="option in modeOptions"
                    :key="option.value"
                    type="button"
                    class="admin-theme-modes__item"
                    :class="{ 'is-active': theme.preference.value === option.value }"
                    @click="theme.setMode(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
                <div class="admin-theme-modes admin-theme-modes--density" role="group" aria-label="信息密度">
                  <button
                    type="button"
                    class="admin-theme-modes__item"
                    :class="{ 'is-active': density === 'comfortable' }"
                    @click="setDensity('comfortable')"
                  >
                    默认
                  </button>
                  <button
                    type="button"
                    class="admin-theme-modes__item"
                    :class="{ 'is-active': density === 'compact' }"
                    @click="setDensity('compact')"
                  >
                    紧凑
                  </button>
                </div>
                <div class="admin-theme-colors">
                  <button
                    v-for="preset in presets"
                    :key="preset.value"
                    type="button"
                    class="admin-theme-colors__item"
                    :class="{ 'is-active': primary === preset.value }"
                    :style="{ background: preset.value }"
                    :title="preset.name"
                    :aria-label="preset.name"
                    @click="setPrimary(preset.value)"
                  />
                  <button type="button" class="admin-theme-colors__reset" @click="resetPrimary">恢复默认</button>
                </div>
                <div class="admin-theme-custom">
                  <ElColorPicker :model-value="primary || '#3b6cf6'" size="small" @change="onPrimaryChange" />
                  <span>自定义主色</span>
                </div>
              </div>
            </ElPopover>
            <button
              class="admin-layout__icon-button"
              type="button"
              :aria-label="isDark ? '切换到亮色主题' : '切换到暗色主题'"
              @click="toggleTheme"
            >
              <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
              </svg>
            </button>
            <ElDropdown trigger="click" @command="handleUserCommand">
              <div class="admin-layout__user">
                <span class="admin-layout__avatar">{{ (user?.name ?? '?').slice(0, 1) }}</span>
                <span class="admin-layout__user-name">{{ user?.name ?? '未登录' }}</span>
              </div>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="logout">退出登录</ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </slot>
        </div>
      </ElHeader>
      <TabsBar v-if="tabs" />
      <ElMain class="admin-layout__main">
        <div id="admin-main" ref="mainRef" class="admin-layout__scroll" tabindex="-1">
          <RouterView v-slot="{ Component }">
            <RouteErrorBoundary>
              <Transition name="admin-fade" mode="out-in">
                <KeepAlive :include="tabs.cachedNames">
                  <component :is="Component" :key="route.name ?? route.path" />
                </KeepAlive>
              </Transition>
            </RouteErrorBoundary>
          </RouterView>
        </div>
      </ElMain>
    </ElContainer>
    <CommandPalette v-model="paletteOpen" :items="paletteItems" @select="handleCommandSelect" />
    <Transition name="admin-fade">
      <div v-if="version?.updateAvailable.value" class="admin-version" role="status" aria-live="polite">
        <span class="admin-version__dot" />
        <span class="admin-version__text">发现新版本 {{ version?.latest.value }}</span>
        <button type="button" class="admin-version__action" @click="refreshPage">立即刷新</button>
        <button type="button" class="admin-version__close" aria-label="忽略此版本" @click="version?.dismiss()">×</button>
      </div>
    </Transition>
    <Transition name="admin-fade">
      <div v-if="!online" class="admin-offline" role="status" aria-live="polite">
        <span class="admin-offline__dot" />
        网络连接已断开，部分操作可能不可用
      </div>
    </Transition>
    <Teleport to="body">
      <Transition name="admin-fade">
        <div
          v-if="session?.warning.value"
          class="admin-session"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="admin-session-title"
        >
          <div class="admin-session__card">
            <h3 id="admin-session-title" class="admin-session__title">会话即将过期</h3>
            <p class="admin-session__desc">
              您已长时间未操作，系统将在 <strong>{{ session?.remaining.value }}</strong> 秒后自动退出。
            </p>
            <button type="button" class="admin-session__action" @click="session?.extend()">继续使用</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ElContainer>
</template>
