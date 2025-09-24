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
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  series: [
    {
      data: [120, 200, 150, 80, 70, 110, 130],
      type: 'bar',
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
