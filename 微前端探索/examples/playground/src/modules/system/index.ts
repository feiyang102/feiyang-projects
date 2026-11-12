import { defineModule, dictionary } from '@admin/core'

export default defineModule({
  name: 'system',
  permissions: {
    'system:view': '访问系统管理',
    'system:user:list': '查看用户',
    'system:user:create': '新建用户',
    'system:user:export': '导出用户',
    'system:user:delete': '删除用户',
    'system:role:list': '查看角色',
    'system:role:create': '新建角色',
  },
  setup() {
    dictionary.register('user_status', async () => {
      await new Promise((resolve) => setTimeout(resolve, 120))
      return [
        { label: '启用', value: 'active', color: 'success' },
        { label: '停用', value: 'disabled', color: 'info' },
      ]
    })
  },
  routes: [
    {
      path: '/system',
      redirect: '/system/user',
      meta: {
        title: '系统管理',
        permission: 'system:view',
        menu: { order: 90, icon: 'setting' },
      },
      children: [
        {
          path: 'user',
          name: 'SystemUser',
          component: () => import('./views/UserList.vue'),
          meta: {
            title: '用户管理',
            permission: 'system:user:list',
            cache: true,
          },
        },
        {
          path: 'user/:id',
          name: 'SystemUserDetail',
          component: () => import('./views/UserDetail.vue'),
          meta: {
            title: '用户详情',
            permission: 'system:user:list',
            menu: false,
            activeMenu: '/system/user',
          },
        },
        {
          path: 'role',
          name: 'SystemRole',
          component: () => import('./views/RoleList.vue'),
          meta: {
            title: '角色管理',
            permission: 'system:role:list',
          },
        },
      ],
    },
  ],
})
