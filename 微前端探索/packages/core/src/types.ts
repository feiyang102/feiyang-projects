import type { App, Component, Ref, VNodeChild } from 'vue'
import type { Pinia } from 'pinia'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded, RouteRecordRaw, Router, RouterHistory } from 'vue-router'
import type { Bridge } from '@admin/bridge'
import type { VersionCheckOptions, VersionChecker } from './version'
import type { NotificationCenter, NotificationCenterOptions } from './notification'

export interface AdminUser {
  id: string
  name: string
  avatar?: string
  [key: string]: unknown
}

export interface AuthSnapshot {
  user: AdminUser
  roles: string[]
  permissions: string[]
  permissionsVersion?: string
}

export interface AuthAdapter {
  load(): Promise<AuthSnapshot>
  getSnapshot(): AuthSnapshot | null
  isAuthenticated(): boolean
  can(required: string | string[], mode?: 'any' | 'all'): boolean
  login(payload?: unknown): Promise<void>
  logout(): Promise<void>
  refresh?(): Promise<AuthSnapshot>
  subscribe?(handler: () => void): () => void
  install?(app: App): void
}

export interface MenuMeta {
  icon?: string
  order?: number
  group?: string
  hidden?: boolean
  badge?: string | number
}

export interface AdminRouteMeta {
  title?: string
  permission?: string | string[]
  permissionMode?: 'any' | 'all'
  menu?: false | MenuMeta
  cache?: boolean
  affix?: boolean
  micro?: string
  menuPath?: string
  external?: string
  activeMenu?: string
}

declare module 'vue-router' {
  interface RouteMeta extends AdminRouteMeta {}
}

export interface ModuleContext {
  router: Router
  pinia: Pinia
  auth: AuthAdapter | null
  http: HttpClient
  bridge: Bridge
}

export interface AdminModule {
  name: string
  routes: RouteRecordRaw[]
  permissions?: Record<string, string>
  setup?: (ctx: ModuleContext) => void | Promise<void>
}

export interface LayoutPreset {
  component: Component
  props?: Record<string, unknown>
  slots?: Record<string, () => VNodeChild>
}

export interface MicroPropsContext {
  auth: AuthAdapter | null
  theme: Record<string, string>
  locale: string
  route: RouteLocationNormalizedLoaded
}

export interface MicroAppDefinition {
  name: string
  entry: string
  basePath: string
  mode?: 'delegated' | 'autonomous'
  adapter?: string
  menu?: { title?: string; icon?: string; order?: number }
  permission?: string | string[]
  alive?: boolean
  timeout?: number
  /** 挂载前探测地址，非 2xx 视为不可用 */
  healthCheckUrl?: string
  healthCheckTimeout?: number
  props?: (ctx: MicroPropsContext) => Record<string, unknown>
}

export interface MicroPlugin {
  apps: MicroAppDefinition[]
  component: Component
}

export interface MenuOverride {
  key: string
  title?: string
  icon?: string
  order?: number
  hidden?: boolean
}

export interface MenuNode {
  key: string
  path: string
  title: string
  icon?: string
  order: number
  external?: string
  children?: MenuNode[]
}

export interface HttpRequestOptions {
  method?: string
  params?: Record<string, unknown>
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  timeout?: number
  retry?: number
  dedupe?: boolean
}

export interface HttpRequestConfig {
  url: string
  method: string
  params?: Record<string, unknown>
  body?: unknown
  headers: Record<string, string>
  signal?: AbortSignal
  timeout: number
  retry: number
  dedupe: boolean
}

export interface HttpInterceptors {
  request?: (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>
  response?: (data: unknown, config: HttpRequestConfig) => unknown
  error?: (error: unknown, config: HttpRequestConfig) => unknown
}

export interface HttpClient {
  request<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>
  get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T>
  post<T = unknown>(url: string, body?: unknown): Promise<T>
}

export interface HttpOptions {
  baseURL?: string
  headers?: Record<string, string>
  unwrap?: (raw: unknown) => unknown
  onUnauthorized?: () => void
  timeout?: number
  retry?: number
  dedupe?: boolean
  interceptors?: HttpInterceptors
}

export interface MenuOptions {
  overridesUrl?: string
  timeout?: number
  fetch?: () => Promise<MenuOverride[]>
}

export interface AdminHooks {
  onBeforeMount?: (ctx: AdminRuntime) => void
  onReady?: (ctx: AdminRuntime) => void
  onRouteChange?: (to: RouteLocationNormalized, from: RouteLocationNormalized, ctx: AdminRuntime) => void
  onAuthExpired?: (ctx: AdminRuntime) => void
  onError?: (error: unknown, info: string) => void
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface ThemeOptions {
  mode?: ThemePreference
  tokens?: Record<string, string>
  light?: Record<string, string>
  dark?: Record<string, string>
}

export interface ThemeState {
  mode: Ref<'light' | 'dark'>
  /** 用户选择的外观偏好，system 表示跟随系统 */
  preference: Ref<ThemePreference>
  setMode(mode: ThemePreference): void
  toggle(): void
}

export interface SessionOptions {
  /** 空闲超时时间（毫秒），未设置或非正数表示不启用 */
  idleTimeout?: number
  /** 超时前多少毫秒提示用户，未设置则不提示 */
  warning?: number
  /** 视为用户活动的 DOM 事件，默认 mousedown/keydown/touchstart/scroll/mousemove */
  events?: string[]
}

export interface SessionState {
  /** 是否处于「即将过期」提示状态 */
  warning: Ref<boolean>
  /** 距离自动退出剩余秒数 */
  remaining: Ref<number>
  /** 用户选择继续使用，重置空闲计时 */
  extend: () => void
}

export interface AdminAppOptions {
  configVersion: number
  app: { name: string; title: string; copyright?: string }
  router?: { base?: string; mode?: 'history' | 'hash'; history?: RouterHistory }
  modules?: AdminModule[]
  routes?: RouteRecordRaw[]
  auth?: AuthAdapter | false
  layout?: LayoutPreset | false
  loginComponent?: Component
  micro?: MicroPlugin
  http?: HttpOptions
  menu?: MenuOptions
  theme?: ThemeOptions
  session?: SessionOptions
  version?: VersionCheckOptions
  notifications?: NotificationCenterOptions
  hooks?: AdminHooks
  /** 全局错误上报入口，与 hooks.onError 同时触发 */
  errorReporter?: (error: unknown, info: string) => void
}

export interface ResolvedOptions extends AdminAppOptions {
  router: { base: string; mode: 'history' | 'hash'; history?: RouterHistory }
  modules: AdminModule[]
  routes: RouteRecordRaw[]
  http: HttpOptions
  loginPath: string
}

export interface AdminRuntime {
  config: ResolvedOptions
  router: Router
  pinia: Pinia
  auth: AuthAdapter | null
  http: HttpClient
  bridge: Bridge
  microApps: MicroAppDefinition[]
  menus: Ref<MenuNode[]>
  collapsed: Ref<boolean>
  theme: ThemeState
  version?: VersionChecker
  session?: SessionState
  notifications?: NotificationCenter
  refreshAccess?: () => Promise<void>
}

export interface AdminApp {
  mount(selector: string | Element): Promise<void>
  unmount(): void
  router: Router
  pinia: Pinia
  auth: AuthAdapter | null
  runtime: AdminRuntime
}

export type ErrorPageKind = '403' | '404' | '500'
