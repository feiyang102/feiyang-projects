import { defineModule } from '@admin/core'

export default defineModule({
  name: 'dashboard',
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('./views/Dashboard.vue'),
      meta: {
        title: '工作台',
        permission: 'dashboard:view',
        affix: true,
        cache: true,
        menu: { order: 1, icon: 'home' },
      },
    },
  ],
})
