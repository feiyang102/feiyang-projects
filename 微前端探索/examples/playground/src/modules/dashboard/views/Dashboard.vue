<script setup lang="ts">
import { ElCard, ElTag } from 'element-plus'
import { useAuth } from '@admin/auth'

const { user, roles, permissions } = useAuth()

const stats = [
  { label: '今日访问', value: '1,284', trend: '+12.5%' },
  { label: '待处理事项', value: '23', trend: '-4.1%' },
  { label: '在线用户', value: '86', trend: '+2.8%' },
  { label: '接口成功率', value: '99.96%', trend: '+0.02%' },
]

const trend = [
  { label: '周一', value: 42 },
  { label: '周二', value: 58 },
  { label: '周三', value: 51 },
  { label: '周四', value: 74 },
  { label: '周五', value: 88 },
  { label: '周六', value: 36 },
  { label: '周日', value: 48 },
]
</script>

<template>
  <div class="dashboard">
    <section class="dashboard__hero">
      <div>
        <p class="dashboard__eyebrow">概览</p>
        <h2 class="dashboard__title">你好，{{ user?.name ?? '访客' }}</h2>
        <p class="dashboard__subtitle">这里是你的工作台。菜单来自路由，权限来自接口，子应用按需挂载。</p>
      </div>
      <div class="dashboard__badge">
        <span class="dashboard__badge-dot" />
        {{ roles.join(' / ') || '未分配角色' }}
      </div>
    </section>

    <section class="dashboard__stats">
      <div v-for="item in stats" :key="item.label" class="dashboard__stat">
        <span class="dashboard__stat-label">{{ item.label }}</span>
        <strong class="dashboard__stat-value">{{ item.value }}</strong>
        <span class="dashboard__stat-trend">{{ item.trend }}</span>
      </div>
    </section>

    <div class="dashboard__panels">
      <ElCard>
        <template #header>当前权限码</template>
        <div class="dashboard__tags">
          <ElTag v-for="code in permissions" :key="code" size="small" effect="plain" round>{{ code }}</ElTag>
        </div>
        <p class="dashboard__hint">用 guest 登录可以看到菜单与按钮同步收敛。</p>
      </ElCard>
      <ElCard>
        <template #header>近 7 天访问</template>
        <div class="dashboard__chart">
          <div v-for="item in trend" :key="item.label" class="dashboard__bar">
            <div class="dashboard__bar-track">
              <div class="dashboard__bar-fill" :style="{ height: `${item.value}%` }" />
            </div>
            <span class="dashboard__bar-label">{{ item.label }}</span>
          </div>
        </div>
        <p class="dashboard__hint">演示数据；真实项目可替换为图表库。</p>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border: 1px solid var(--admin-color-border);
  border-radius: 14px;
  background:
    radial-gradient(600px 200px at 0% 0%, var(--admin-color-primary-soft), transparent 70%),
    var(--admin-color-surface);
  box-shadow: var(--admin-shadow-sm);
}

.dashboard__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--admin-color-primary);
}

.dashboard__title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--admin-color-text);
}

.dashboard__subtitle {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--admin-color-text-secondary);
}

.dashboard__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  font-size: 12px;
  color: var(--admin-color-text-secondary);
  border: 1px solid var(--admin-color-border);
  border-radius: 999px;
  background: var(--admin-color-surface);
  white-space: nowrap;
}

.dashboard__badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--admin-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--admin-color-success) 18%, transparent);
}

.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.dashboard__stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid var(--admin-color-border);
  border-radius: 12px;
  background: var(--admin-color-surface);
  box-shadow: var(--admin-shadow-sm);
  transition: border-color 180ms ease, transform 180ms ease;
}

.dashboard__stat:hover {
  border-color: color-mix(in srgb, var(--admin-color-primary) 36%, var(--admin-color-border));
  transform: translateY(-1px);
}

.dashboard__stat-label {
  font-size: 12.5px;
  color: var(--admin-color-text-secondary);
}

.dashboard__stat-value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--admin-color-text);
}

.dashboard__stat-trend {
  font-size: 12px;
  color: var(--admin-color-success);
}

.dashboard__panels {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 14px;
}

.dashboard__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dashboard__hint {
  margin: 14px 0 0;
  font-size: 12.5px;
  color: var(--admin-color-text-tertiary);
}

.dashboard__list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.9;
  color: var(--admin-color-text-secondary);
}

.dashboard__chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  height: 150px;
  padding: 4px 2px 0;
}

.dashboard__bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  height: 100%;
}

.dashboard__bar-track {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: var(--admin-color-surface-muted);
  overflow: hidden;
}

.dashboard__bar-fill {
  width: 100%;
  border-radius: 6px;
  background: linear-gradient(180deg, var(--admin-color-primary), color-mix(in srgb, var(--admin-color-primary) 45%, transparent));
  transition: height 320ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dashboard__bar-label {
  font-size: 11.5px;
  color: var(--admin-color-text-tertiary);
}

.dashboard__list code {
  padding: 1px 6px;
  font-size: 12px;
  border-radius: 5px;
  background: var(--admin-color-surface-muted);
  border: 1px solid var(--admin-color-border);
}

@media (max-width: 1100px) {
  .dashboard__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dashboard__panels {
    grid-template-columns: 1fr;
  }
}
</style>
