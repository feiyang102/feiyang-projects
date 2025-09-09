<script lang="ts" setup>
import createReuseableTemplate from './createReuseableTemplate'
const [DefineTemplate, UseTemplate] = createReuseableTemplate()
</script>

<template>
  <div>
    <!-- 模版使用事件，如果是 foo，在这里需要使用 onFoo 取到事件 -->
    <DefineTemplate v-slot="{ title, onFoo }">
      <h2 @click="onFoo(1111)">测试模板{{ title }}</h2>
    </DefineTemplate>
    <!-- 在使用时传入事件 -->
    <UseTemplate :key="1" title="111111" @foo="console.log">test1</UseTemplate>
    <UseTemplate :key="2" title="222222">test2</UseTemplate>
  </div>
</template>

<style scoped></style>
