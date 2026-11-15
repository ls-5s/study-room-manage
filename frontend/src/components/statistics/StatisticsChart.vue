<script setup lang="ts">
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { AriaComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use, type EChartsCoreOption, type EChartsType } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'

use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  CanvasRenderer,
])

const props = withDefaults(
  defineProps<{
    option: EChartsCoreOption
    label: string
    height?: string
    empty?: boolean
    emptyText?: string
  }>(),
  {
    height: '320px',
    empty: false,
    emptyText: '当前筛选条件下暂无统计数据',
  },
)

const chartEl = useTemplateRef<HTMLDivElement>('chartEl')
const chart = shallowRef<EChartsType | null>(null)
let resizeObserver: ResizeObserver | null = null

function render() {
  chart.value?.setOption(props.option, { notMerge: true })
}

function ensureChart(): boolean {
  if (chart.value) return true
  const element = chartEl.value
  if (!element || element.clientWidth === 0 || element.clientHeight === 0) return false
  chart.value = init(element, undefined, { renderer: 'canvas' })
  render()
  return true
}

function resize() {
  if (!ensureChart()) return
  const width = chartEl.value?.clientWidth
  const height = chartEl.value?.clientHeight
  if (width && height) chart.value?.resize({ width, height })
}

watch(
  () => props.option,
  () => {
    if (ensureChart()) render()
  },
  { deep: true },
)

onMounted(() => {
  if (!chartEl.value) return
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(chartEl.value)
  window.addEventListener('resize', resize)
  resize()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', resize)
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div class="chart-frame" :style="{ height: props.height }">
    <div
      v-show="!props.empty"
      ref="chartEl"
      class="chart-canvas"
      role="img"
      :aria-label="props.label"
    />
    <el-empty v-if="props.empty" :description="props.emptyText" :image-size="72" />
  </div>
</template>

<style scoped>
.chart-frame {
  position: relative;
  display: grid;
  min-width: 0;
  overflow: hidden;
  place-items: stretch;
}

.chart-canvas {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.chart-frame :deep(.el-empty) {
  align-self: center;
}
</style>
