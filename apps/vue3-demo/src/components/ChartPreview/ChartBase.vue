<template>
  <div
    ref="chartContainerRef"
    :style="{ width: width, height: height }"
    class="chart-container"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

// Props定义
interface ChartBaseProps {
  width?: string | number
  height?: string | number
  autoResize?: boolean
}

// 定义props，提供默认值
const props = withDefaults(defineProps<ChartBaseProps>(), {
  width: '100%' as string | number,
  height: '400px' as string | number,
  autoResize: true,
})

// 定义emits
const emit = defineEmits<{
  // 图表挂载完成事件，用于父组件获取图表实例
  'chart-mounted': [chartInstance: ECharts]
}>()

// 图表容器引用
const chartContainerRef = ref<HTMLDivElement>()

// 图表实例
let chartInstance: ECharts | null = null

const throttle = <T extends (...args: unknown[]) => unknown>(func: T, wait: number): T => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>): void {
    if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(this as ThisParameterType<T>, args)
        timeout = null
      }, wait)
    }
  } as T
}

// 初始化图表
const initChart = () => {
  debugger
  if (!chartContainerRef.value) return

  // 销毁已存在的图表实例
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 创建新的图表实例
  chartInstance = echarts.init(chartContainerRef.value)
  debugger

  // 图表初始化后，需要通过setOption方法设置图表配置
  emit('chart-mounted', chartInstance)
}

// 调整图表尺寸
const resizeChart = () => {
  nextTick(() => {
    chartInstance?.resize()
  })
}

// 节流后的resize函数
const throttledResize = throttle(resizeChart, 300)

// 注意：不监听options属性变化，以提高性能
// 请通过组件暴露的setOption方法来更新图表配置

watch(
  () => [props.width, props.height],
  () => {
    resizeChart()
  },
)

// 生命周期钩子
onMounted(() => {
  initChart()

  // 添加窗口尺寸变化监听
  if (props.autoResize) {
    window.addEventListener('resize', throttledResize)
  }
})

onUnmounted(() => {
  // 移除事件监听
  if (props.autoResize) {
    window.removeEventListener('resize', throttledResize)
  }

  // 销毁图表实例
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// 暴露方法给父组件
defineExpose({
  resizeChart,
  getChartInstance: () => chartInstance,
  setOption: (options: echarts.EChartsOption) => {
    chartInstance?.setOption(options)
  },
})
</script>

<style scoped>
.chart-container {
  position: relative;
  min-width: 0;
  min-height: 0;
}
</style>
