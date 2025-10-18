<template>
  <div class="page-index">
    <div class="index-content">
      <div class="icon"></div>
      <div class="text">
        这是一段测试文字这是一段测试文字这是一段测试文字这是一段测试文字这是一段测试文字这是一段测试文字这是一段测试文字这是一段测试文字这是一段测试文字这是一段测试文字这是一段测试文字
      </div>
      <div class="btns">
        <button @click="handlerClick(1)">测试按钮1</button>
        <button @click="handlerClick(2)">测试按钮2</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// import { reactive, toRefs, ref, onBeforeMount, onMounted } from "vue";
function handlerClick(val) {
  console.log(val);
}
</script>

<style lang="scss" scoped>
.page-index {
  @mixin flex-center-col {
    display: flex;
    flex-flow: column;
    justify-content: center;
    align-items: center;
  }
  @include flex-center-col;
  height: 100vh;
  padding: 0 5vw;
  .index-content {
    @include flex-center-col;
    transform: translateY(-10vh);
    .icon {
      height: 80px;
      width: 80px;
      background-color: #e37373;
      margin-bottom: 10px;
    }
    text {
      font-size: 15px;
      color: #5d6067;
    }
    .btns {
      display: flex;
      flex-flow: column;
      margin-top: 50px;
      width: 100%;
      & > button {
        width: 100%;
        height: 60px;
      }
      & > button:last-child {
        margin-top: 20px;
      }
    }
  }
}
</style>
