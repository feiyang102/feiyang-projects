<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ElTable, ElTableColumn } from 'element-plus'

const orders = [
  { id: 'A1001', customer: '张三', amount: 128, status: '已支付' },
  { id: 'A1002', customer: '李四', amount: 76, status: '待发货' },
  { id: 'A1003', customer: '王五', amount: 320, status: '已完成' },
]
</script>

<template>
  <ElTable :data="orders" border>
    <ElTableColumn prop="id" label="订单号" width="120">
      <template #default="{ row }">
        <RouterLink :to="`/orders/${row.id}`">{{ row.id }}</RouterLink>
      </template>
    </ElTableColumn>
    <ElTableColumn prop="customer" label="客户" />
    <ElTableColumn prop="amount" label="金额" width="100" />
    <ElTableColumn prop="status" label="状态" width="120" />
  </ElTable>
</template>
