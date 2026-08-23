<template>
  <el-form-item :label="item.label" :prop="item.field">
    <el-input
      :value="formModel[item.field]"
      @input="val => $emit('update-field', { field: item.field, value: val })"
      :placeholder="item.placeholder || '请输入' + item.label"
      :required="item.required"
    />
  </el-form-item>
</template>

<script>
export default {
  props: ['item', 'formModel'],
}
</script>
