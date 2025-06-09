<template>
  <div class="form-canvas" @dragover.prevent @drop.prevent="handleDrop">
    <div class="form-container">
      <el-form :model="formModel" label-width="100px">
        <draggable
          :list="formItems"
          group="components"
          @end="$emit('select-item', null)"
          class="form-draggable"
        >
          <component
            v-for="item in formItems"
            :key="item.id"
            :is="item.type"
            :item="item"
            :form-model="formModel"
            @click.native="$emit('select-item', item)"
          />
        </draggable>
      </el-form>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import InputComponent from '@/components/formGenerator/InputComponent.vue'
import SelectComponent from '@/components/formGenerator/SelectComponent.vue'
import DateComponent from '@/components/formGenerator/DateComponent.vue'
import CheckboxComponent from '@/components/formGenerator/CheckboxComponent.vue'

export default {
  components: {
    draggable,
    'input-component': InputComponent,
    'select-component': SelectComponent,
    'date-component': DateComponent,
    'checkbox-component': CheckboxComponent,
  },
  props: ['formItems'],
  data() {
    return {
      formModel: {},
    }
  },
  methods: {
    handleDrop(event) {
      const component = JSON.parse(event.dataTransfer.getData('component'))
      const newItem = {
        type: component.type,
        id: Date.now(),
        field: `field_${Date.now()}`,
        label: component.label,
        options: [],
        required: false,
      }

      this.$set(this.formModel, newItem.field, null)
      // 使用Vue的响应式数组方法
      this.$emit('add-item', newItem)
    },
  },
}
</script>

<style scoped lang="scss">
.form-canvas {
  flex: 1;
  height: 100%;
  overflow: auto;
  padding: 20px;

  .form-container {
    min-height: 800px;
    height: 100%; // 新增容器高度定义
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    display: flex; // 新增flex布局
    flex-direction: column;
    .form-draggable {
      min-height: 300px;
      background-color: antiquewhite;
    }
  }

  ::v-deep .el-form {
    height: 100% !important; // 强制覆盖默认样式
    flex: 1;
    overflow: auto;
  }
}
</style>
