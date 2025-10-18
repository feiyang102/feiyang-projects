<script setup lang="ts">
// import TheWelcome from '../components/TheWelcome.vue'
import ReuseableTemplate from '../components/ReuseableTemplate/ReuseableTemplate.vue'
</script>

<template>
  <main>
    <!-- <TheWelcome /> -->
    <ReuseableTemplate />
    <n-button type="primary"> Primary </n-button>
    <n-space>
      <n-button>Default</n-button>
      <n-button type="tertiary"> Tertiary </n-button>
      <n-button type="primary"> Primary </n-button>
      <n-button type="info"> Info </n-button>
      <n-button type="success"> Success </n-button>
      <n-button type="warning"> Warning </n-button>
      <n-button type="error"> Error </n-button>
    </n-space>
  </main>
</template>
