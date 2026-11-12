import { createAdminApp } from '@admin/core'
import { AdminLoginPage, adminPreset } from '@admin/ui'
import { createMicroPlugin, defineMicroApp } from '@admin/micro'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@admin/ui/style.css'
import { createMockAuth } from './mock/auth'
import dashboard from './modules/dashboard'
import form from './modules/form'
import system from './modules/system'

const micro = createMicroPlugin(
  [
    defineMicroApp({
      name: 'order',
      entry: 'http://localhost:5174',
      basePath: '/order',
      mode: 'delegated',
      adapter: 'wujie',
      menu: { title: '订单中心', icon: 'order', order: 20 },
      permission: 'order:view',
      alive: true,
      timeout: 10_000,
      healthCheckUrl: 'http://localhost:5174/',
      healthCheckTimeout: 2_000,
    }),
  ],
  { allowedOrigins: ['http://localhost:5174'] },
)

const app = createAdminApp({
  configVersion: 1,
  app: {
    name: 'playground',
    title: '运营管理后台',
    copyright: 'Admin Framework Playground',
  },
  auth: createMockAuth(),
  layout: adminPreset({ tabs: true, breadcrumb: true, watermark: { opacity: 0.06 } }),
  loginComponent: AdminLoginPage,
  modules: [dashboard, form, system],
  micro,
  menu: {
    fetch: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return [{ key: 'SystemUser', title: '账号管理' }]
    },
  },
  theme: {
    mode: 'light',
  },
  session: {
    idleTimeout: 30 * 60 * 1000,
    warning: 60 * 1000,
  },
  version: {
    current: '0.1.0',
    interval: 5 * 60 * 1000,
    check: async () => {
      const response = await fetch('/version.json', { cache: 'no-store' })
      if (!response.ok) return '0.1.0'
      const data = (await response.json()) as { version?: string }
      return data.version ?? '0.1.0'
    },
  },
  notifications: {
    interval: 5 * 60 * 1000,
    fetch: async () => [
      {
        id: 'notice-maintenance',
        title: '系统将于今晚 23:00 维护',
        description: '预计 30 分钟，期间部分功能不可用',
        time: '10:00',
      },
      { id: 'notice-approval', title: '你有 3 条待审批事项', time: '09:12', link: '/system/user' },
      { id: 'notice-order', title: '订单中心已更新', description: '新增订单详情页', time: '昨天' },
    ],
  },
  hooks: {
    onReady: (ctx) => {
      // eslint-disable-next-line no-console
      console.info('[playground] app ready', ctx.config.app.title)
    },
    onAuthExpired: () => {
      ElMessage.warning('登录状态已失效，请重新登录')
    },
    onError: (error, info) => {
      // eslint-disable-next-line no-console
      console.error('[playground] error', info, error)
    },
  },
})

void app.mount('#app')
