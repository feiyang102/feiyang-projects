<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElSelect, ElSpace, ElSwitch, ElTag } from 'element-plus'
import { useForm } from '@admin/core'
import { AdminPage } from '@admin/ui'

const form = useForm({
  initial: { name: '', type: 'basic', enabled: true, remark: '' },
  rules: {
    name: [
      { required: true, message: '请输入名称' },
      { max: 20, message: '名称不能超过 20 个字符' },
    ],
    remark: { max: 100, message: '备注不能超过 100 个字符' },
  },
})

async function submit() {
  if (!(await form.validate())) {
    ElMessage.warning('请先修正表单中的错误')
    return
  }
  form.submitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 400))
  form.submitting.value = false
  form.markSaved()
  ElMessage.success('已保存（演示，不会提交到后端）')
}

onBeforeRouteLeave(async () => {
  if (!form.dirty.value) return true
  try {
    await ElMessageBox.confirm('表单尚未保存，确定离开吗？', '未保存的修改', {
      type: 'warning',
      confirmButtonText: '离开',
      cancelButtonText: '留在本页',
    })
    return true
  } catch {
    return false
  }
})
</script>

<template>
  <AdminPage title="表单示例" description="基于 useForm 的字段绑定、校验、提交权限与离开前未保存确认。">
    <template #extra>
      <ElTag v-if="form.dirty.value" size="small" type="warning" effect="light" round>有未保存修改</ElTag>
      <ElTag v-else size="small" type="success" effect="light" round>已保存</ElTag>
    </template>

    <ElAlert
      class="form-demo__tip"
      type="info"
      :closable="false"
      show-icon
      title="guest 账号没有 form:demo:submit 权限，保存按钮会被隐藏。"
    />

    <ElForm label-position="top" class="form-demo__form">
      <ElFormItem label="名称" :error="form.errors.name">
        <ElInput
          v-model="form.values.name"
          placeholder="请输入名称"
          clearable
          @blur="form.validateField('name')"
        />
      </ElFormItem>
      <ElFormItem label="类型">
        <ElSelect v-model="form.values.type" style="width: 220px">
          <ElOption label="基础" value="basic" />
          <ElOption label="进阶" value="advanced" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="form.values.enabled" />
      </ElFormItem>
      <ElFormItem label="备注" :error="form.errors.remark">
        <ElInput
          v-model="form.values.remark"
          type="textarea"
          :rows="3"
          placeholder="可选"
          @blur="form.validateField('remark')"
        />
      </ElFormItem>
    </ElForm>

    <ElSpace>
      <ElButton v-perm="'form:demo:submit'" type="primary" :loading="form.submitting.value" @click="submit">
        保存
      </ElButton>
      <ElButton :disabled="!form.dirty.value" @click="form.reset()">重置</ElButton>
    </ElSpace>

    <p class="form-demo__hint">名称为必填且最多 20 字，备注最多 100 字；修改内容后切换路由会触发离开确认。</p>
  </AdminPage>
</template>

<style scoped>
.form-demo__tip {
  margin-bottom: 18px;
}

.form-demo__form {
  max-width: 520px;
}

.form-demo__hint {
  margin: 18px 0 0;
  font-size: 12.5px;
  color: var(--admin-color-text-tertiary);
}
</style>
