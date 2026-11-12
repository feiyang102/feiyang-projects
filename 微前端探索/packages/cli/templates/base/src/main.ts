import { createAdminApp } from '@admin/core'
import { AdminLoginPage, adminPreset } from '@admin/ui'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@admin/ui/style.css'
import { createMockAuth } from './mock/auth'
import dashboard from './modules/dashboard'
import users from './modules/users'

const app = createAdminApp({
  configVersion: 1,
  app: {
    name: '__APP_NAME__',
    title: '__APP_TITLE__',
  },
  auth: createMockAuth(),
  layout: adminPreset({ tabs: true, breadcrumb: true, watermark: { opacity: 0.06 } }),
  loginComponent: AdminLoginPage,
  theme: { mode: 'light' },
  session: { idleTimeout: 30 * 60 * 1000 },
  modules: [dashboard, users],
})

void app.mount('#app')
