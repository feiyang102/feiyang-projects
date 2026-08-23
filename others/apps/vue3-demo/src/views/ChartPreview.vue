<script lang="ts" setup>
import { ref } from 'vue'
import ChartLine from '../components/ChartPreview/ChartLine.vue'
// import ChartBar from '../components/ChartPreview/ChartBar.vue'
// import ChartPie from '../components/ChartPreview/ChartPie.vue'

const chartLineRef = ref()
</script>

<template>
  <div>
    <ChartLine ref="chartLineRef" title="ChartLine" />
    <!-- <ChartBar title="ChartBar" />
    <ChartPie title="ChartPie" /> -->
  </div>
</template>
