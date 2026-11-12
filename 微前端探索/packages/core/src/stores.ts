import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  fullPath: string
  title: string
  name?: string
  affix: boolean
  cache: boolean
}

export const useTabsStore = defineStore('admin-tabs', {
  state: () => ({
    tabs: [] as TabItem[],
    visited: [] as string[],
  }),
  getters: {
    cachedNames(state): string[] {
      return state.tabs.filter((tab) => tab.cache && tab.name).map((tab) => tab.name as string)
    },
  },
  actions: {
    open(route: RouteLocationNormalized) {
      if (!route.meta?.title) return
      const exists = this.tabs.find((tab) => tab.path === route.path)
      if (exists) {
        exists.fullPath = route.fullPath
        return
      }
      this.tabs.push({
        path: route.path,
        fullPath: route.fullPath,
        title: route.meta.title,
        name: typeof route.name === 'string' ? route.name : undefined,
        affix: route.meta.affix === true,
        cache: route.meta.cache === true,
      })
      if (route.meta.cache && typeof route.name === 'string' && !this.visited.includes(route.name)) {
        this.visited.push(route.name)
      }
    },
    close(fullPath: string): TabItem | undefined {
      const index = this.tabs.findIndex((tab) => tab.fullPath === fullPath)
      if (index < 0) return undefined
      const [removed] = this.tabs.splice(index, 1)
      if (removed?.name) {
        this.visited = this.visited.filter((name) => name !== removed.name)
      }
      return this.tabs[index] ?? this.tabs[index - 1]
    },
    closeOthers(fullPath: string) {
      this.tabs = this.tabs.filter((tab) => tab.affix || tab.fullPath === fullPath)
      this.visited = this.tabs
        .filter((tab) => tab.cache)
        .map((tab) => tab.name)
        .filter((name): name is string => Boolean(name))
    },
    closeAll(): TabItem | undefined {
      this.tabs = this.tabs.filter((tab) => tab.affix)
      this.visited = this.tabs
        .filter((tab) => tab.cache)
        .map((tab) => tab.name)
        .filter((name): name is string => Boolean(name))
      return this.tabs[this.tabs.length - 1]
    },
    prune(isAllowed: (path: string) => boolean) {
      this.tabs = this.tabs.filter((tab) => isAllowed(tab.path))
      this.visited = this.tabs
        .filter((tab) => tab.cache)
        .map((tab) => tab.name)
        .filter((name): name is string => Boolean(name))
    },
    reset() {
      this.tabs = []
      this.visited = []
    },
  },
})
