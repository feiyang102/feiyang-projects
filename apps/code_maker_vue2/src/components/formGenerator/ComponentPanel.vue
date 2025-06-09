<template>
  <div class="component-panel">
    <el-card class="panel-box">
      <div slot="header" class="panel-title">
        <i class="el-icon-menu"></i>
        表单组件库
      </div>
      <div class="component-list">
        <div
          v-for="(item, index) in components"
          :key="index"
          class="component-item"
          draggable
          @dragstart="handleDragStart(item)"
          @dragend="handleDragEnd"
        >
          <i :class="item.icon" />
          {{ item.label }}
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      components: [
        { type: 'inputComponent', label: '输入框', icon: 'el-icon-edit' },
        { type: 'selectComponent', label: '下拉框', icon: 'el-icon-arrow-down' },
        { type: 'dateComponent', label: '日期选择', icon: 'el-icon-date' },
        { type: 'checkboxComponent', label: '多选框', icon: 'el-icon-check' }
      ],
    }
  },
  methods: {
    handleDragStart(item) {
      // 使用正则表达式转换驼峰命名
      const componentType = item.type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
      const componentData = {
        type: componentType,
        label: item.label
      }
      event.dataTransfer.setData('component', JSON.stringify(componentData))
    },
    handleDragEnd() {
      // Optional: Add drag end handling logic if needed
    }
  },
}
</script>

<style scoped lang="scss">
.component-panel {
  background: #fff;
  height: 100%;

  .component-list {
    padding: 10px;

    .component-item {
      background: #f5f7fa;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      padding: 12px 15px;
      margin-bottom: 10px;
      cursor: move;
      transition: all 0.3s;
      display: flex;
      align-items: center;

      &:hover {
        background: #ecf5ff;
        border-color: #409eff;

        i {
          color: #409eff;
        }
      }

      i {
        font-size: 18px;
        margin-right: 8px;
        color: #909399;
        transition: color 0.3s;
      }
    }
  }

  .panel-title {
    font-size: 16px;
    color: #303133;
    padding: 15px;
    border-bottom: 1px solid #ebeef5;
    margin: 0;
    display: flex;
    align-items: center;

    i {
      margin-right: 8px;
      font-size: 18px;
    }
  }
}
</style>
