import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'

const base = window.__POWERED_BY_WUJIE__ ? '__APP_BASE__' : '/'

export const router = createRouter({
  history: createWebHistory(base),
  routes: [{ path: '/', name: 'Home', component: Home, meta: { title: '首页' } }],
})
