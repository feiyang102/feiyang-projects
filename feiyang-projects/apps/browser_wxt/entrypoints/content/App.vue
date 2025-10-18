<script lang="ts" setup>
import vueLogo from "~/assets/vue.svg";
const dialogVisible = ref(false);

function handleClose() {
  dialogVisible.value = false;
};
</script>

<template>
  <div class="container">
    <img :src="vueLogo" />
    <p>Hello World</p>
    <el-button @click="dialogVisible = true">123213</el-button>
    <el-dialog
      v-model="dialogVisible"
      title="Tips"
      width="500"
      :before-close="handleClose"
    >
      <span>This is a message</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="dialogVisible = false">
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.container {
  position: fixed;
  right: 16px;
  top: 16px;
  width: 250px;
  height: 200px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  color: black;
  .el-button {
    background-color: blue;
  }
}

img {
  width: 72px;
}
</style>
<style>
html {
  position: relative !important;
  z-index: 20000;
}
</style>