import { createRouter, createWebHistory } from 'vue-router'
import OrderList from './views/OrderList.vue'
import OrderDetail from './views/OrderDetail.vue'

const base = window.__POWERED_BY_WUJIE__ ? '/order' : '/'

export const router = createRouter({
  history: createWebHistory(base),
  routes: [
    { path: '/', redirect: '/orders' },
    { path: '/orders', name: 'OrderList', component: OrderList, meta: { title: '订单列表' } },
    { path: '/orders/:id', name: 'OrderDetail', component: OrderDetail, meta: { title: '订单详情' } },
  ],
})
