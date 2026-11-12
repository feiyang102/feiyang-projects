import { defineModule } from '@admin/core'

export default defineModule({
  name: 'form',
  permissions: {
    'form:demo:view': '查看表单示例',
    'form:demo:submit': '提交表单示例',
  },
  routes: [
    {
      path: '/form',
      name: 'FormDemo',
      component: () => import('./views/BasicForm.vue'),
      meta: {
        title: '表单示例',
        permission: 'form:demo:view',
        cache: true,
        menu: { order: 30, icon: 'file' },
      },
    },
  ],
})
