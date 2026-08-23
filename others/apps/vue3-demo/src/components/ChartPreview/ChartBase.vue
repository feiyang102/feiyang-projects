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
import type { ECharts, EChartsOption } from 'echarts'

// Props定义
interface ChartBaseProps {
  width?: string | number
  height?: string | number
  autoResize?: boolean
  title?: string
}

// 定义props，提供默认值
const props = withDefaults(defineProps<ChartBaseProps>(), {
  width: '100%' as string | number,
  height: '400px' as string | number,
  title: '' as string,
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

// 缓存的图表配置，用于图表初始化前调用setOption时
let cachedOption: EChartsOption | null = null

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
  if (!chartContainerRef.value) return

  // 销毁已存在的图表实例
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 创建新的图表实例
  chartInstance = echarts.init(chartContainerRef.value)

  // 图表初始化后，如果有缓存的配置，则直接渲染
  if (cachedOption) {
    chartInstance.setOption(cachedOption)
    // 使用完缓存的配置后，将其销毁
    cachedOption = null
  }

  // 图表初始化后，需要通过setOption方法设置图表配置
  emit('chart-mounted', chartInstance)
}

// 调整图表尺寸
const resizeChart = () => {
  nextTick(() => {
    chartInstance?.resize()
  })
}

const setOption = (options: EChartsOption) => {
  // 如果图表实例已存在，直接设置配置
  if (chartInstance) {
    chartInstance.setOption(options)
  } else {
    // 如果图表实例不存在，缓存配置
    cachedOption = options
  }
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
  console.log(`${props.title} ChartBase onMounted`)
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
  setOption,
  resizeChart,
  getChartInstance: () => chartInstance,
})
console.log(`${props.title} ChartBase created`)
</script>

<style scoped>
.chart-container {
  position: relative;
  min-width: 0;
  min-height: 0;
}
</style>
