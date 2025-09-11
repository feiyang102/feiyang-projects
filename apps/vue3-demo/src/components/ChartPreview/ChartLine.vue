<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ChartBase from './ChartBase.vue'

const chartLineRef = ref()
const chartOptions = ref<echarts.EChartsOption>({
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      data: [150, 230, 224, 218, 135, 147, 260],
      type: 'line',
    },
  ],
})

const handleChartMounted = (chartInstance: echarts.ECharts) => {
  chartInstance.setOption(chartOptions.value)
}

onMounted(() => {
  // chartLineRef.value.setOption(chartOptions.value)
})
</script>

<template>
  <ChartBase ref="chartLineRef" @chart-mounted="handleChartMounted" />
</template>
