<script setup lang="ts">
import { ElCard } from 'element-plus'
import { useAuth } from '@admin/auth'
import { AdminPage } from '@admin/ui'

const { user } = useAuth()
</script>

<template>
  <AdminPage title="工作台" description="从这里的模块开始开发你的业务页面。">
    <ElCard shadow="never">
      <p>欢迎，{{ user?.name ?? '未登录' }}。</p>
      <p>在 <code>src/modules</code> 下新增模块，并通过 <code>createAdminApp({ modules })</code> 注册即可。</p>
      <p>主题切换、菜单权限、页签与微前端已开箱可用。</p>
    </ElCard>
  </AdminPage>
</template>
