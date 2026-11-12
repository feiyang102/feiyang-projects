<script setup lang="ts">
import { ElAlert, ElButton, ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { AdminPage } from '@admin/ui'

interface RoleRow {
  id: number
  name: string
  code: string
  members: number
  permissions: string[]
  status: 'active' | 'disabled'
}

const roles: RoleRow[] = [
  { id: 1, name: '超级管理员', code: 'admin', members: 2, permissions: ['*'], status: 'active' },
  {
    id: 2,
    name: '运营',
    code: 'operator',
    members: 8,
    permissions: ['dashboard:view', 'system:user:list', 'order:view'],
    status: 'active',
  },
  {
    id: 3,
    name: '访客',
    code: 'guest',
    members: 15,
    permissions: ['dashboard:view', 'system:view'],
    status: 'active',
  },
  { id: 4, name: '外包协作', code: 'outsourcing', members: 3, permissions: ['dashboard:view'], status: 'disabled' },
]

function permissionSummary(row: unknown) {
  const role = row as RoleRow
  return role.permissions.includes('*') ? '全部权限' : `${role.permissions.length} 项权限`
}

function createRole() {
  ElMessage.info('新建角色（演示）')
}

function editRole(row: unknown) {
  ElMessage.info(`编辑角色：${(row as RoleRow).name}（演示）`)
}

function removeRole(row: unknown) {
  const role = row as RoleRow
  ElMessage.warning(`删除角色：${role.name}（演示，不会真正删除）`)
}
</script>

<template>
  <AdminPage title="角色管理" description="角色与权限码的对应关系；只有拥有 system:role:list 权限的用户才能看到本页。">
    <template #extra>
      <ElButton v-perm="'system:role:create'" type="primary" @click="createRole">新建角色</ElButton>
    </template>

    <ElAlert
      class="role-list__tip"
      type="info"
      :closable="false"
      show-icon
      title="用 guest 账号访问本页会被重定向到 403。"
    />

    <ElTable :data="roles" border>
      <ElTableColumn prop="name" label="角色名称" min-width="140" />
      <ElTableColumn prop="code" label="标识" min-width="130">
        <template #default="{ row }">
          <code class="role-list__code">{{ row.code }}</code>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="members" label="成员数" width="100" align="center" />
      <ElTableColumn label="权限范围" min-width="140">
        <template #default="{ row }">
          <ElTag size="small" effect="plain" round>{{ permissionSummary(row) }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="100">
        <template #default="{ row }">
          <ElTag :type="row.status === 'active' ? 'success' : 'info'" effect="light" round>
            {{ row.status === 'active' ? '启用' : '停用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <ElButton link type="primary" @click="editRole(row)">编辑</ElButton>
          <ElButton link type="danger" @click="removeRole(row)">删除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <p class="role-list__hint">演示数据；真实项目由后端返回角色与权限点，前端只负责展示与操作权限校验。</p>
  </AdminPage>
</template>

<style scoped>
.role-list__tip {
  margin-bottom: 16px;
}

.role-list__code {
  padding: 1px 6px;
  font-size: 12px;
  color: var(--admin-color-text-secondary);
  background: var(--admin-color-surface-muted);
  border: 1px solid var(--admin-color-border);
  border-radius: 5px;
}

.role-list__hint {
  margin: 16px 0 0;
  font-size: 12.5px;
  color: var(--admin-color-text-tertiary);
}
</style>
