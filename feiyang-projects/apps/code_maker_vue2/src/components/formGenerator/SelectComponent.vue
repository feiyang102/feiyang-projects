<template>
  <el-form-item :label="item.label" :prop="item.field">
    <el-select
      v-model="formModel[item.field]"
      :placeholder="item.placeholder || '请选择' + item.label"
    >
      <el-option
        v-for="(option, index) in item.options"
        :key="index"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
  </el-form-item>
</template>

<script>
export default {
  props: ['item', 'formModel']
}
</script>