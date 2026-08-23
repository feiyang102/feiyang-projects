<template>
  <div class="form-design">
    <div class="container">
      <!-- 左侧组件面板 -->
      <component-panel class="left-panel" />

      <!-- 中间画布区域 -->
      <form-canvas
        class="main-panel"
        :form-items="formItems"
        @select-item="handleSelect"
        @add-item="handleAddItem"
      />

      <!-- 右侧属性面板 -->
      <property-panel
        class="right-panel"
        :selected-item="selectedItem"
        @update-item="handleUpdate"
      />
    </div>

    <!-- 代码生成对话框 -->
    <code-type-dialog ref="codeDialog" />
  </div>
</template>

<script>
import ComponentPanel from '@/components/formGenerator/ComponentPanel.vue'
import FormCanvas from '@/components/formGenerator/FormCanvas.vue'
import PropertyPanel from '@/components/formGenerator/PropertyPanel.vue'
import CodeTypeDialog from '@/components/formGenerator/CodeTypeDialog.vue'

export default {
  components: {
    ComponentPanel,
    FormCanvas,
    PropertyPanel,
    CodeTypeDialog,
  },
  data() {
    return {
      formItems: [],
      selectedItem: null,
    }
  },
  methods: {
    handleSelect(item) {
      this.selectedItem = item
    },
    handleUpdate(updatedItem) {
      const index = this.formItems.findIndex((i) => i.id === updatedItem.id)
      this.$set(this.formItems, index, updatedItem)
    },
    handleAddItem(newItem) {
      this.formItems = [...this.formItems, newItem]
    },
    generateCode() {
      this.$refs.codeDialog.open(this.formItems)
    },
    handleUpdateField({ field, value }) {
      this.formModel = { 
        ...this.formModel,
        [field]: value 
      }
    }
  }
}
</script>

<style scoped lang="scss">
.form-design {
  height: 100vh;
  display: flex;

  .container {
    flex: 1;
    display: flex;

    .left-panel,
    .right-panel {
      width: 300px;
      border: 1px solid #ebeef5;
      padding: 20px;
    }

    .main-panel {
      flex: 1;
      padding: 20px;
      border: 1px dashed #dcdfe6;
    }
  }
}
</style>
