<template>
  <el-dialog title="生成代码" :visible.sync="visible">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Vue模板" name="vue">
        <pre>{{ vueCode }}</pre>
      </el-tab-pane>
      <el-tab-pane label="JSON Schema" name="json">
        <pre>{{ jsonCode }}</pre>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script>
export default {
  data() {
    return {
      visible: false,
      activeTab: 'vue',
      formData: []
    }
  },
  computed: {
    vueCode() {
      return this.formData.map(item => {
        return `<el-form-item label="${item.label}" prop="${item.field}">
  <el-${item.type} v-model="form.${item.field}"/>
</el-form-item>`
      }).join('\n')
    },
    jsonCode() {
      return JSON.stringify(this.formData, null, 2)
    }
  },
  methods: {
    open(data) {
      this.formData = data
      this.visible = true
    }
  }
}
</script>