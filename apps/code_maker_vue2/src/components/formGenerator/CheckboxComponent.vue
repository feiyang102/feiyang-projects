<template>
  <el-form-item :label="item.label" :prop="item.field">
    <el-checkbox-group v-model="formModel[item.field]">
      <el-checkbox 
        v-for="(option, index) in item.options"
        :key="index"
        :label="option.value"
      >
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>
  </el-form-item>
</template>

<script>
export default {
  props: ['item', 'formModel']
}
</script>