import { defineModule } from '@admin/core'

export default defineModule({
  name: 'users',
  routes: [
    {
      path: '/users',
      name: 'UserList',
      component: () => import('./views/UserList.vue'),
      meta: {
        title: '用户列表',
        menu: { order: 10, icon: 'users' },
      },
    },
  ],
})
