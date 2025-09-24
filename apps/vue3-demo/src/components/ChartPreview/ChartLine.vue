<script setup lang="ts">
import { onMounted, ref } from 'vue'
// import type { ECharts, EChartsOption } from 'echarts'
import type { EChartsOption } from 'echarts'
import ChartBase from './ChartBase.vue'

// TODO 这里不设置 props.title 在 ChartBase 中设置，引用时为什么 title 可以透传?
// const props = defineProps(['height'])

const chartLineRef = ref<InstanceType<typeof ChartBase> | null>(null)
const chartOptions = ref<EChartsOption>({
  tooltip: {
    trigger: 'axis', // 对于线图，使用axis触发模式更好
    axisPointer: {
      type: 'cross', // 显示十字准星
      label: {
        backgroundColor: '#6a7985',
      },
      crossStyle: {
        color: '#999',
      },
      lineStyle: {
        color: '#ddd',
        type: 'dashed',
      },
    },
  },
  legend: {
    orient: 'vertical',
    left: 'left',
  },
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

// chartLineRef.value?.setOption(chartOptions.value as EChartsOption)

// const handleChartMounted = (chartInstance: ECharts) => {
//   chartInstance.setOption(chartOptions.value)
// }
onMounted(() => {
  chartLineRef.value?.setOption(chartOptions.value as EChartsOption)
})

defineExpose({
  setOption: (options: EChartsOption) => chartLineRef.value?.setOption(options),
  getChartInstance: () => chartLineRef.value?.getChartInstance(),
})
</script>

<template>
  <!-- <ChartBase ref="chartLineRef" @chart-mounted="handleChartMounted" /> -->
  <ChartBase ref="chartLineRef" title="折线图示例" />
</template>
