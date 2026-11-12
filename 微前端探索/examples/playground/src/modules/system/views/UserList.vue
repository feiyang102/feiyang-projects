<script setup lang="ts">
import {
  ElButton,
  ElCheckbox,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { exportCsv, useColumns, useTable, useDictionary } from '@admin/core'
import type { TableResult, TableSort } from '@admin/core'
import { AdminErrorState, AdminPage } from '@admin/ui'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface Row {
  id: number
  name: string
  role: string
  status: 'active' | 'disabled'
  createdAt: string
}

interface Query {
  keyword: string
  status: string
}

const ALL: Row[] = [
  { id: 1, name: '张三', role: '管理员', status: 'active', createdAt: '2026-09-01' },
  { id: 2, name: '李四', role: '运营', status: 'active', createdAt: '2026-09-12' },
  { id: 3, name: '王五', role: '访客', status: 'disabled', createdAt: '2026-10-03' },
  { id: 4, name: '赵六', role: '运营', status: 'active', createdAt: '2026-10-18' },
  { id: 5, name: '孙七', role: '访客', status: 'active', createdAt: '2026-11-02' },
  { id: 6, name: '周八', role: '财务', status: 'disabled', createdAt: '2026-11-06' },
]

const router = useRouter()

function filterRows(keyword: string, status: string): Row[] {
  return ALL.filter((row) => {
    const matchKeyword = !keyword || row.name.includes(keyword) || row.role.includes(keyword)
    const matchStatus = !status || row.status === status
    return matchKeyword && matchStatus
  })
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

async function fetchUsers(
  params: Query & { page: number; pageSize: number; sort?: TableSort; signal?: AbortSignal },
): Promise<TableResult<Row>> {
  await wait(220, params.signal)
  const filtered = filterRows(params.keyword, params.status)
  if (params.sort) {
    const { prop, order } = params.sort
    filtered.sort((left, right) => {
      const a = left[prop as keyof Row]
      const b = right[prop as keyof Row]
      const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'zh-Hans-CN')
      return order === 'asc' ? result : -result
    })
  }
  const start = (params.page - 1) * params.pageSize
  return {
    rows: filtered.slice(start, start + params.pageSize),
    total: filtered.length,
  }
}

const {
  rows,
  total,
  page,
  pageSize,
  query,
  loading,
  error,
  search,
  reset,
  refresh,
  changePage,
  changePageSize,
  changeSort,
} = useTable<Row, Query>({
  fetcher: fetchUsers,
  defaultQuery: { keyword: '', status: '' },
  pageSize: 5,
})

function onSortChange(payload: { prop: string | null; order: 'ascending' | 'descending' | null }) {
  void changeSort(payload.prop ?? '', payload.order === 'ascending' ? 'asc' : payload.order === 'descending' ? 'desc' : null)
}

const { items: statusItems } = useDictionary('user_status')

const { columns, visibleKeys, toggle: toggleColumn, setWidth, widthOf, move: moveColumn } = useColumns(
  [
    { key: 'id', title: 'ID' },
    { key: 'name', title: '姓名' },
    { key: 'role', title: '角色' },
    { key: 'status', title: '状态' },
    { key: 'createdAt', title: '创建时间' },
  ],
  { storageKey: 'playground:user-columns' },
)

function onHeaderDragend(newWidth: number, _oldWidth: number, column: { property?: string }) {
  if (column.property) setWidth(column.property, newWidth)
}

function isVisible(key: string) {
  return visibleKeys.value.includes(key)
}

function onColumnChange(key: string, value: unknown) {
  toggleColumn(key, Boolean(value))
}

function statusMeta(value: string) {
  const item = statusItems.value.find((entry) => entry.value === value)
  return {
    label: item?.label ?? value,
    type: (item?.color as 'success' | 'info' | undefined) ?? 'info',
  }
}

function create() {
  ElMessage.info('新建用户（演示）')
}

const selected = ref<Row[]>([])

function onSelectionChange(selection: unknown[]) {
  selected.value = selection as Row[]
}

function batchRemove() {
  if (selected.value.length === 0) return
  ElMessage.success(`已选择 ${selected.value.length} 条（演示，不会真正删除）`)
}

function exportAll() {
  const filtered = filterRows(query.keyword, query.status)
  exportCsv('users', filtered, [
    { key: 'id', title: 'ID' },
    { key: 'name', title: '姓名' },
    { key: 'role', title: '角色' },
    { key: 'status', title: '状态', format: (value) => statusMeta(String(value)).label },
    { key: 'createdAt', title: '创建时间' },
  ])
  ElMessage.success(`已导出 ${filtered.length} 条（按当前筛选条件）`)
}

function openDetail(row: unknown) {
  void router.push(`/system/user/${(row as Row).id}`)
}
</script>

<template>
  <AdminPage title="用户管理" description="演示 useTable：查询、排序、分页与地址栏同步（刷新后条件仍在）。">
    <template #extra>
      <ElButton v-perm="'system:user:create'" type="primary" @click="create">新建用户</ElButton>
      <ElButton :disabled="selected.length === 0" @click="batchRemove">
        批量操作{{ selected.length ? ` (${selected.length})` : '' }}
      </ElButton>
      <ElButton v-perm="'system:user:export'" @click="exportAll">导出</ElButton>
    </template>

    <div class="user-list">
      <div class="user-list__toolbar">
        <ElInput
          v-model="query.keyword"
          class="user-list__search"
          placeholder="搜索姓名或角色"
          clearable
          @keyup.enter="search"
          @clear="search"
        />
        <ElSelect v-model="query.status" class="user-list__status" @change="search">
          <ElOption label="全部状态" value="" />
          <ElOption label="启用" value="active" />
          <ElOption label="停用" value="disabled" />
        </ElSelect>
        <ElButton @click="search">查询</ElButton>
        <ElButton @click="reset">重置</ElButton>
        <ElDropdown trigger="click">
          <ElButton>列设置</ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem v-for="(col, index) in columns" :key="col.key">
                <div class="user-list__column">
                  <ElCheckbox :model-value="col.visible !== false" @change="onColumnChange(col.key, $event)">
                    {{ col.title }}
                  </ElCheckbox>
                  <span class="user-list__column-actions">
                    <button
                      type="button"
                      class="user-list__column-move"
                      :disabled="index === 0"
                      aria-label="上移列"
                      @click.stop="moveColumn(col.key, -1)"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      class="user-list__column-move"
                      :disabled="index === columns.length - 1"
                      aria-label="下移列"
                      @click.stop="moveColumn(col.key, 1)"
                    >
                      ↓
                    </button>
                  </span>
                </div>
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>

      <AdminErrorState
        v-if="error"
        message="用户列表加载失败"
        :description="error instanceof Error ? error.message : String(error)"
        @retry="refresh"
      />
      <ElSkeleton v-else-if="loading && rows.length === 0" :rows="5" animated />
      <template v-else>
        <ElTable
          :data="rows"
          border
          @selection-change="onSelectionChange"
          @sort-change="onSortChange"
          @header-dragend="onHeaderDragend"
        >
          <ElTableColumn type="selection" width="48" />
          <ElTableColumn v-if="isVisible('id')" prop="id" label="ID" :width="widthOf('id') ?? 70" />
          <ElTableColumn
            v-if="isVisible('name')"
            prop="name"
            label="姓名"
            :width="widthOf('name')"
            min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <ElButton link type="primary" @click="openDetail(row)">{{ row.name }}</ElButton>
            </template>
          </ElTableColumn>
          <ElTableColumn v-if="isVisible('role')" prop="role" label="角色" :width="widthOf('role')" min-width="110" />
          <ElTableColumn v-if="isVisible('status')" label="状态" :width="widthOf('status') ?? 110">
            <template #default="{ row }">
              <ElTag :type="statusMeta(row.status).type" effect="light" round>
                {{ statusMeta(row.status).label }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn
            v-if="isVisible('createdAt')"
            prop="createdAt"
            label="创建时间"
            :width="widthOf('createdAt') ?? 140"
            sortable="custom"
          />
          <ElTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <ElButton v-perm="'system:user:delete'" link type="danger" @click="openDetail(row)">查看</ElButton>
            </template>
          </ElTableColumn>
          <template #empty>
            <ElEmpty description="没有符合条件的用户" :image-size="72" />
          </template>
        </ElTable>

        <div class="user-list__footer">
          <span class="user-list__summary">共 {{ total }} 条</span>
          <ElPagination
            :current-page="page"
            :page-size="pageSize"
            :page-sizes="[5, 10, 20]"
            :total="total"
            layout="sizes, prev, pager, next"
            size="small"
            background
            @current-change="changePage"
            @size-change="changePageSize"
          />
        </div>
      </template>
    </div>
  </AdminPage>
</template>

<style scoped>
.user-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.user-list__toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.user-list__search {
  width: 220px;
}

.user-list__status {
  width: 140px;
}

.user-list__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.user-list__summary {
  font-size: 12.5px;
  color: var(--admin-color-text-secondary);
}

.user-list__column {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.user-list__column-actions {
  display: flex;
  gap: 2px;
}

.user-list__column-move {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 12px;
  color: var(--admin-color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
}

.user-list__column-move:hover:not(:disabled) {
  color: var(--admin-color-text);
  background: var(--admin-color-surface-muted);
  border-color: var(--admin-color-border);
}

.user-list__column-move:disabled {
  color: var(--admin-color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
