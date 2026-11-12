import { defineModule } from '@admin/core'

export default defineModule({
  name: '__MODULE_NAME__',
  routes: [
    {
      path: '/__MODULE_NAME__',
      name: '__MODULE_PASCAL__',
      component: () => import('./views/__MODULE_PASCAL__.vue'),
      meta: {
        title: '__MODULE_TITLE__',
        menu: { order: 50, icon: 'file' },
      },
    },
  ],
})
