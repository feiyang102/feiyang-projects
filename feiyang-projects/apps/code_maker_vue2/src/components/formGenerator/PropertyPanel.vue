<template>
  <div class="property-panel">
    <el-form v-if="selectedItem" :model="selectedItem">
      <el-form-item label="字段名称">
        <el-input v-model="selectedItem.field"/>
      </el-form-item>
      <el-form-item label="标签文本">
        <el-input v-model="selectedItem.label"/>
      </el-form-item>
      <el-form-item label="是否必填">
        <el-switch v-model="selectedItem.required"/>
      </el-form-item>
    </el-form>
    <div v-else class="placeholder">请选择表单组件</div>
  </div>
</template>

<script>
export default {
  props: ['selectedItem'],
  watch: {
    selectedItem: {
      handler(newVal) {
        this.$emit('update-item', newVal)
      },
      deep: true
    }
  }
}
</script>