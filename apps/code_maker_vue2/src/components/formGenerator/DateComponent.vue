<template>
  <el-form-item :label="item.label" :prop="item.field">
    <el-date-picker
      v-model="formModel[item.field]"
      :type="item.dateType || 'date'"
      :placeholder="item.placeholder || '选择日期'"
      value-format="yyyy-MM-dd"
    />
  </el-form-item>
</template>

<script>
export default {
  props: ['item', 'formModel']
}
</script>