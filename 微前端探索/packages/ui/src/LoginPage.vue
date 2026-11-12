<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import { useAdminRuntime } from '@admin/core'

const runtime = useAdminRuntime()
const router = useRouter()
const route = useRoute()
const theme = runtime.theme

const REMEMBER_KEY = 'admin:last-username'

function readRemembered(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

function remember(value: string) {
  try {
    localStorage.setItem(REMEMBER_KEY, value)
  } catch {
    // 忽略存储不可用
  }
}

const username = ref(readRemembered())
const password = ref('')
const loading = ref(false)

const brandLetter = computed(() => runtime.config.app.title.slice(0, 1).toUpperCase())
const isDark = computed(() => theme.mode.value === 'dark')
const year = new Date().getFullYear()

function toggleTheme() {
  theme.toggle()
}

async function submit() {
  const auth = runtime.auth
  if (!auth) {
    ElMessage.error('当前应用未启用认证')
    return
  }
  if (!username.value.trim()) {
    ElMessage.warning('请输入账号')
    return
  }
  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    await auth.login({ username: username.value, password: password.value })
    remember(username.value.trim())
    await runtime.refreshAccess?.()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-login">
    <button
      class="admin-layout__icon-button admin-login__theme"
      type="button"
      :aria-label="isDark ? '切换到亮色主题' : '切换到暗色主题'"
      :title="isDark ? '切换到亮色主题' : '切换到暗色主题'"
      @click="toggleTheme"
    >
      <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
      </svg>
    </button>

    <div class="admin-login__panel">
      <div class="admin-login__brand">
        <span class="admin-login__brand-mark">{{ brandLetter }}</span>
        <h1 class="admin-login__title">{{ runtime.config.app.title }}</h1>
      </div>
      <p class="admin-login__subtitle">登录以继续使用管理后台</p>
      <ElForm class="admin-login__form" label-position="top" @submit.prevent="submit">
        <ElFormItem label="账号">
          <ElInput v-model="username" autocomplete="username" placeholder="请输入账号" />
        </ElFormItem>
        <ElFormItem label="密码">
          <ElInput
            v-model="password"
            type="password"
            show-password
            autocomplete="current-password"
            placeholder="请输入密码"
            @keyup.enter="submit"
          />
        </ElFormItem>
        <ElButton type="primary" class="admin-login__submit" :loading="loading" @click="submit">登录</ElButton>
      </ElForm>
      <p class="admin-login__hint">演示账号：admin（全部权限） / guest（受限权限）</p>
      <p v-if="runtime.config.app.copyright" class="admin-login__footer">
        © {{ year }} {{ runtime.config.app.copyright }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.admin-login__theme {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;
  background: var(--admin-color-surface);
  border-color: var(--admin-color-border);
}

.admin-login__footer {
  margin: 18px 0 0;
  font-size: 11.5px;
  color: var(--admin-color-text-tertiary);
  text-align: center;
}
</style>
