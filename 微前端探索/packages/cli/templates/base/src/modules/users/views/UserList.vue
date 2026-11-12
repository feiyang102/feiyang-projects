<script setup lang="ts">
import { ElPagination, ElSkeleton, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { useTable } from '@admin/core'
import type { TableResult } from '@admin/core'
import { AdminErrorState, AdminPage } from '@admin/ui'

interface Row {
  id: number
  name: string
  status: 'active' | 'disabled'
  createdAt: string
}

const ALL: Row[] = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1,
  name: `用户 ${index + 1}`,
  status: index % 3 === 0 ? 'disabled' : 'active',
  createdAt: `2026-11-${String((index % 28) + 1).padStart(2, '0')}`,
}))

async function fetcher(params: { page: number; pageSize: number }): Promise<TableResult<Row>> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const start = (params.page - 1) * params.pageSize
  return { rows: ALL.slice(start, start + params.pageSize), total: ALL.length }
}

const { rows, total, page, pageSize, loading, error, refresh, changePage } = useTable<Row, Record<string, never>>({
  fetcher,
  pageSize: 10,
})
</script>

<template>
  <AdminPage title="用户列表" description="useTable 示例：分页、加载态、错误重试与地址栏同步。">
    <AdminErrorState v-if="error" message="列表加载失败" @retry="refresh" />
    <ElSkeleton v-else-if="loading && rows.length === 0" :rows="6" animated />
    <template v-else>
      <ElTable :data="rows" border>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="name" label="姓名" />
        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'" effect="light" round>
              {{ row.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" label="创建时间" width="160" />
      </ElTable>

      <div class="list-footer">
        <span class="list-footer__summary">共 {{ total }} 条</span>
        <ElPagination
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          size="small"
          background
          @current-change="changePage"
        />
      </div>
    </template>
  </AdminPage>
</template>

<style scoped>
.list-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.list-footer__summary {
  font-size: 12.5px;
  color: var(--admin-color-text-secondary);
}
</style>
