<script setup lang="ts">
import {
  Calendar,
  CircleCheck,
  DataLine,
  RefreshRight,
  TrendCharts,
  Warning,
} from '@element-plus/icons-vue'
import type { EChartsCoreOption } from 'echarts/core'
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { getStatisticsOverview, getStatisticsTrend } from '../../api/statistics'
import StatisticsChart from '../../components/statistics/StatisticsChart.vue'
import { useThemeStore } from '../../stores/theme'
import type {
  StatisticsOverview,
  StatisticsTrend,
  StatisticsTrendItem,
} from '../../types/statistics'
import { RequestError } from '../../utils/request'
import { formatDateTime } from '../../utils/reservation'
import { addDays, businessToday } from '../../utils/study-room'
import { formatMetricRate, formatRate } from '../../utils/statistics'

const themeStore = useThemeStore()
const today = businessToday()
const selectedDate = shallowRef(today)
const overview = shallowRef<StatisticsOverview | null>(null)
const dayTrend = shallowRef<StatisticsTrend | null>(null)
const roomTrend = shallowRef<StatisticsTrend | null>(null)
const slotTrend = shallowRef<StatisticsTrend | null>(null)
const loading = shallowRef(false)
const error = shallowRef('')
let controller: AbortController | null = null
let loadSequence = 0

const trendDateFrom = computed(() => addDays(selectedDate.value, -6))
const metricCards = computed(() => [
  {
    label: '预约场次',
    value: overview.value?.cards.reservationCount ?? 0,
    suffix: '场',
    hint: '不含取消预约',
    icon: Calendar,
    tone: 'primary',
  },
  {
    label: '已签到',
    value: overview.value?.cards.checkedInCount ?? 0,
    suffix: '场',
    hint: `签到率 ${formatRate(
      overview.value?.rates.signInRate ?? 0,
      overview.value?.rates.hasSettledData ?? false,
    )}`,
    icon: CircleCheck,
    tone: 'success',
  },
  {
    label: '失约',
    value: overview.value?.cards.noShowCount ?? 0,
    suffix: '场',
    hint: `失约率 ${formatRate(
      overview.value?.rates.noShowRate ?? 0,
      overview.value?.rates.hasSettledData ?? false,
    )}`,
    icon: Warning,
    tone: 'danger',
  },
  {
    label: '座位利用率',
    value: formatRate(
      overview.value?.cards.utilizationRate ?? 0,
      overview.value?.rates.hasUtilizationData ?? false,
    ),
    suffix: '',
    hint: '已签到预约计划时长 / 计划容量',
    icon: TrendCharts,
    tone: 'info',
  },
])

const colors = computed(() =>
  themeStore.isDark
    ? {
        primary: '#72afd4',
        success: '#76c79e',
        warning: '#e3b76c',
        danger: '#f18b81',
        info: '#7db8dc',
        text: '#b5c4d1',
        muted: '#91a4b5',
        grid: 'rgba(145, 164, 181, 0.18)',
        tooltip: '#17232f',
      }
    : {
        primary: '#1f4e79',
        success: '#2b7354',
        warning: '#a15c07',
        danger: '#b42318',
        info: '#28628f',
        text: '#4c6478',
        muted: '#5a7183',
        grid: 'rgba(90, 113, 131, 0.16)',
        tooltip: '#ffffff',
      },
)
const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

const dayChartOption = computed<EChartsCoreOption>(() => {
  const items = dayTrend.value?.items ?? []
  return {
    animation: animate,
    color: [colors.value.primary, colors.value.success],
    aria: { enabled: true, description: '最近七天预约场次与签到场次趋势' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.value.tooltip,
      borderColor: colors.value.grid,
      textStyle: { color: colors.value.text },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: colors.value.muted },
      data: ['预约场次', '已签到'],
    },
    grid: { left: 8, right: 12, top: 46, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: items.map((item) => item.label),
      axisLabel: { color: colors.value.muted },
      axisLine: { lineStyle: { color: colors.value.grid } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: colors.value.muted },
      splitLine: { lineStyle: { color: colors.value.grid } },
    },
    series: [
      {
        name: '预约场次',
        type: 'line',
        smooth: 0.28,
        symbolSize: 7,
        data: items.map((item) => item.reservationCount),
        areaStyle: { opacity: 0.08 },
      },
      {
        name: '已签到',
        type: 'line',
        smooth: 0.28,
        symbolSize: 7,
        data: items.map((item) => item.checkedInCount),
      },
    ],
  }
})

const rateChartOption = computed<EChartsCoreOption>(() => {
  const items = dayTrend.value?.items ?? []
  return {
    animation: animate,
    color: [colors.value.success, colors.value.danger],
    aria: { enabled: true, description: '最近七天签到率与失约率' },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: unknown) => `${Number(value).toFixed(1)}%`,
      backgroundColor: colors.value.tooltip,
      borderColor: colors.value.grid,
      textStyle: { color: colors.value.text },
    },
    legend: { top: 0, right: 0, textStyle: { color: colors.value.muted } },
    grid: { left: 8, right: 12, top: 46, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map((item) => item.label),
      axisLabel: { color: colors.value.muted },
      axisLine: { lineStyle: { color: colors.value.grid } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: colors.value.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: colors.value.grid } },
    },
    series: [
      {
        name: '签到率',
        type: 'bar',
        barMaxWidth: 24,
        data: items.map((item) =>
          item.hasSettledData ? Number((item.signInRate * 100).toFixed(1)) : 0,
        ),
      },
      {
        name: '失约率',
        type: 'line',
        symbolSize: 7,
        data: items.map((item) =>
          item.hasSettledData ? Number((item.noShowRate * 100).toFixed(1)) : 0,
        ),
      },
    ],
  }
})

const roomChartOption = computed<EChartsCoreOption>(() => {
  const items = [...(roomTrend.value?.items ?? [])].sort(
    (left, right) => right.utilizationRate - left.utilizationRate,
  )
  return {
    animation: animate,
    color: [colors.value.primary],
    aria: { enabled: true, description: '最近七天自习室座位利用率排行' },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: unknown) => `${Number(value).toFixed(1)}%`,
      backgroundColor: colors.value.tooltip,
      borderColor: colors.value.grid,
      textStyle: { color: colors.value.text },
    },
    grid: { left: 8, right: 24, top: 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: colors.value.grid } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: items.map((item) => item.label),
      axisLabel: { color: colors.value.text, width: 110, overflow: 'truncate' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '利用率',
        type: 'bar',
        barMaxWidth: 18,
        data: items.map((item) =>
          item.hasUtilizationData ? Number((item.utilizationRate * 100).toFixed(1)) : 0,
        ),
        label: {
          show: true,
          position: 'right',
          color: colors.value.text,
          formatter: '{c}%',
        },
      },
    ],
  }
})

const slotChartOption = computed<EChartsCoreOption>(() => {
  const items = slotTrend.value?.items ?? []
  return {
    animation: animate,
    color: [colors.value.info],
    aria: { enabled: true, description: '最近七天各开放时段预约分布' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.value.tooltip,
      borderColor: colors.value.grid,
      textStyle: { color: colors.value.text },
    },
    grid: { left: 8, right: 12, top: 18, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map((item) => item.label),
      axisLabel: { color: colors.value.muted, rotate: 24 },
      axisLine: { lineStyle: { color: colors.value.grid } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: colors.value.muted },
      splitLine: { lineStyle: { color: colors.value.grid } },
    },
    series: [
      {
        name: '预约场次',
        type: 'bar',
        barMaxWidth: 28,
        data: items.map((item) => item.reservationCount),
      },
    ],
  }
})

const hasDayChartData = computed(() => dayTrend.value?.items.some((item) => item.hasData) ?? false)
const hasRateChartData = computed(
  () => dayTrend.value?.items.some((item) => item.hasSettledData) ?? false,
)
const hasRoomChartData = computed(
  () => roomTrend.value?.items.some((item) => item.hasData) ?? false,
)
const hasSlotChartData = computed(
  () => slotTrend.value?.items.some((item) => item.hasData) ?? false,
)

async function load() {
  controller?.abort()
  controller = new AbortController()
  const current = ++loadSequence
  loading.value = true
  error.value = ''
  const range = { dateFrom: trendDateFrom.value, dateTo: selectedDate.value }
  try {
    const [overviewResult, dayResult, roomResult, slotResult] = await Promise.all([
      getStatisticsOverview(selectedDate.value, controller.signal),
      getStatisticsTrend({ ...range, groupBy: 'day' }, controller.signal),
      getStatisticsTrend({ ...range, groupBy: 'room' }, controller.signal),
      getStatisticsTrend({ ...range, groupBy: 'slot' }, controller.signal),
    ])
    if (current !== loadSequence) return
    overview.value = overviewResult
    dayTrend.value = dayResult
    roomTrend.value = roomResult
    slotTrend.value = slotResult
  } catch (cause) {
    if (cause instanceof RequestError && cause.kind === 'cancel') return
    if (current !== loadSequence) return
    overview.value = null
    dayTrend.value = null
    roomTrend.value = null
    slotTrend.value = null
    error.value = cause instanceof RequestError ? cause.message : '统计数据加载失败'
  } finally {
    if (current === loadSequence) loading.value = false
  }
}

function rowUtilization(row: unknown): string {
  const item = row as StatisticsTrendItem
  return formatMetricRate(item.utilizationRate, item.hasUtilizationData)
}

function rowSignInRate(row: unknown): string {
  const item = row as StatisticsTrendItem
  return formatMetricRate(item.signInRate, item.hasSettledData)
}

function rowNoShowRate(row: unknown): string {
  const item = row as StatisticsTrendItem
  return formatMetricRate(item.noShowRate, item.hasSettledData)
}

onMounted(() => {
  void load()
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <section class="statistics-page" aria-labelledby="dashboard-title">
    <header class="statistics-hero">
      <div>
        <p class="page-eyebrow">管理后台 / 统计</p>
        <h1 id="dashboard-title">管理仪表盘</h1>
        <p>从预约、签到、失约和计划容量中快速识别当天运行状态与近七天变化。</p>
      </div>
      <div class="hero-actions">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择统计日期"
          style="width: 160px"
        />
        <el-button type="primary" :loading="loading" :icon="RefreshRight" @click="load">
          刷新
        </el-button>
      </div>
    </header>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="load">重新加载</el-button>
      </template>
    </el-alert>

    <div v-loading="loading" class="metric-grid">
      <article
        v-for="card in metricCards"
        :key="card.label"
        class="metric-card"
        :class="`metric-${card.tone}`"
      >
        <div class="metric-icon">
          <el-icon><component :is="card.icon" /></el-icon>
        </div>
        <div class="metric-copy">
          <span>{{ card.label }}</span>
          <strong
            >{{ card.value }}<small>{{ card.suffix }}</small></strong
          >
          <p>{{ card.hint }}</p>
        </div>
      </article>
    </div>

    <div class="context-strip">
      <span>
        <el-icon><DataLine /></el-icon>
        数据状态：
        <strong>{{ overview?.dataStatus === 'live' ? '实时聚合' : '历史冻结' }}</strong>
      </span>
      <span v-if="overview?.finalizedAt"> 冻结于 {{ formatDateTime(overview.finalizedAt) }} </span>
      <span v-else-if="overview">更新于 {{ formatDateTime(overview.generatedAt) }}</span>
      <span v-if="overview?.rates.outageCancelledCount">
        系统停机取消 {{ overview.rates.outageCancelledCount }} 场，已从正常预约指标中排除
      </span>
      <span>统计区间 {{ trendDateFrom }} 至 {{ selectedDate }}</span>
    </div>

    <div v-if="loading && !overview" class="chart-loading-grid">
      <el-skeleton v-for="index in 4" :key="index" animated :rows="5" />
    </div>

    <div v-else class="chart-grid">
      <article class="chart-panel chart-wide">
        <header class="panel-heading">
          <div>
            <span>预约趋势</span>
            <h2>近七天预约与签到</h2>
          </div>
          <small>场次</small>
        </header>
        <StatisticsChart
          :option="dayChartOption"
          label="近七天预约与签到趋势图"
          :empty="!hasDayChartData"
          height="330px"
        />
      </article>

      <article class="chart-panel chart-wide">
        <header class="panel-heading">
          <div>
            <span>结算质量</span>
            <h2>签到率与失约率</h2>
          </div>
          <small>按已结算预约计算</small>
        </header>
        <StatisticsChart
          :option="rateChartOption"
          label="近七天签到率与失约率图表"
          :empty="!hasRateChartData"
          height="330px"
          empty-text="所选区间暂无已结算预约"
        />
      </article>

      <article class="chart-panel">
        <header class="panel-heading">
          <div>
            <span>资源效率</span>
            <h2>自习室利用率排行</h2>
          </div>
          <small>计划时长口径</small>
        </header>
        <StatisticsChart
          :option="roomChartOption"
          label="自习室利用率排行图"
          :empty="!hasRoomChartData"
          height="300px"
        />
      </article>

      <article class="chart-panel">
        <header class="panel-heading">
          <div>
            <span>时段结构</span>
            <h2>开放时段预约分布</h2>
          </div>
          <small>所有房间汇总</small>
        </header>
        <StatisticsChart
          :option="slotChartOption"
          label="开放时段预约分布图"
          :empty="!hasSlotChartData"
          height="300px"
        />
      </article>
    </div>

    <section class="detail-table-panel">
      <header class="panel-heading">
        <div>
          <span>文字明细</span>
          <h2>近七天指标对照</h2>
        </div>
        <small>与图表使用同一组数据</small>
      </header>
      <el-table :data="dayTrend?.items ?? []" border stripe>
        <el-table-column prop="label" label="日期" min-width="80" />
        <el-table-column prop="reservationCount" label="预约" width="58" />
        <el-table-column prop="checkedInCount" label="签到" width="58" />
        <el-table-column prop="noShowCount" label="失约" width="58" />
        <el-table-column label="签到率" width="82">
          <template #default="{ row }">{{ rowSignInRate(row) }}</template>
        </el-table-column>
        <el-table-column label="失约率" width="82">
          <template #default="{ row }">{{ rowNoShowRate(row) }}</template>
        </el-table-column>
        <el-table-column label="利用率" width="82">
          <template #default="{ row }">{{ rowUtilization(row) }}</template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<style scoped>
.statistics-page {
  display: grid;
  gap: 16px;
}

.statistics-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding: 26px 28px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background:
    radial-gradient(
      circle at 88% 8%,
      color-mix(in srgb, var(--accent) 18%, transparent),
      transparent 30%
    ),
    linear-gradient(135deg, var(--surface), var(--accent-soft));
}

.page-eyebrow {
  margin: 0;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.12em;
}

.statistics-hero h1 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: clamp(1.7rem, 2.8vw, 2.45rem);
  letter-spacing: -0.045em;
}

.statistics-hero p:last-child {
  max-width: 720px;
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  min-height: 120px;
}

.metric-card {
  display: flex;
  gap: 13px;
  align-items: flex-start;
  padding: 17px 18px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.metric-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 8px;
  font-size: 17px;
}

.metric-primary .metric-icon {
  color: var(--status-info);
  background: var(--status-info-tint);
}

.metric-success .metric-icon {
  color: var(--status-ok);
  background: var(--status-ok-tint);
}

.metric-danger .metric-icon {
  color: var(--status-bad);
  background: var(--status-bad-tint);
}

.metric-info .metric-icon {
  color: var(--accent);
  background: var(--accent-soft);
}

.metric-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.metric-copy > span {
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 650;
}

.metric-copy strong {
  color: var(--text);
  font-size: 1.62rem;
  line-height: 1.2;
}

.metric-copy small {
  margin-left: 3px;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 500;
}

.metric-copy p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.68rem;
  line-height: 1.45;
}

.context-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 18px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text-muted);
  background: var(--surface-muted);
  font-size: 0.72rem;
}

.context-strip span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.context-strip strong {
  color: var(--text);
}

.chart-loading-grid,
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chart-loading-grid {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.chart-panel,
.detail-table-panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.panel-heading span {
  color: var(--accent);
  font-size: 0.66rem;
  font-weight: 750;
  letter-spacing: 0.1em;
}

.panel-heading h2 {
  margin: 4px 0 0;
  color: var(--text);
  font-size: 0.98rem;
}

.panel-heading small {
  color: var(--text-muted);
  font-size: 0.68rem;
}

.detail-table-panel {
  overflow: hidden;
}

@media (max-width: 1120px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .statistics-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 21px;
  }

  .hero-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .metric-grid,
  .chart-grid,
  .chart-loading-grid {
    grid-template-columns: 1fr;
  }

  .chart-panel,
  .detail-table-panel {
    padding: 15px;
  }
}
</style>
