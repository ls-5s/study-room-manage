<script setup lang="ts">
import { Download, RefreshRight, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { EChartsCoreOption } from 'echarts/core'
import { computed, onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue'
import { getAdminStudyRooms } from '../../api/admin-room'
import { getStatisticsExport, getStatisticsTrend } from '../../api/statistics'
import StatisticsChart from '../../components/statistics/StatisticsChart.vue'
import { useThemeStore } from '../../stores/theme'
import type { StudyRoomSummary } from '../../types/study-room'
import type {
  StatisticsGroupBy,
  StatisticsTrend,
  StatisticsTrendItem,
  StatisticsTrendQuery,
} from '../../types/statistics'
import { RequestError } from '../../utils/request'
import { formatDateTime } from '../../utils/reservation'
import { addDays, businessToday } from '../../utils/study-room'
import {
  formatMetricRate,
  statisticsGroupLabel,
  statisticsGroupOptions,
  statisticsRangeLabel,
} from '../../utils/statistics'

const themeStore = useThemeStore()
const today = businessToday()
const filters = reactive({
  dates: [addDays(today, -6), today] as string[],
  groupBy: 'day' as StatisticsGroupBy,
  roomId: '',
})
const rooms = shallowRef<StudyRoomSummary[]>([])
const trend = shallowRef<StatisticsTrend | null>(null)
const loading = shallowRef(false)
const exporting = shallowRef(false)
const error = shallowRef('')
let controller: AbortController | null = null
let loadSequence = 0

const query = computed<StatisticsTrendQuery>(() => ({
  dateFrom: filters.dates[0],
  dateTo: filters.dates[1],
  groupBy: filters.groupBy,
  roomId: filters.roomId || undefined,
}))
const rangeLabel = computed(() =>
  filters.dates.length === 2
    ? statisticsRangeLabel(filters.dates[0] ?? '', filters.dates[1] ?? '')
    : '最近 7 天',
)
const colors = computed(() =>
  themeStore.isDark
    ? {
        primary: '#72afd4',
        success: '#76c79e',
        danger: '#f18b81',
        text: '#b5c4d1',
        muted: '#91a4b5',
        grid: 'rgba(145, 164, 181, 0.18)',
        tooltip: '#17232f',
      }
    : {
        primary: '#1f4e79',
        success: '#2b7354',
        danger: '#b42318',
        text: '#4c6478',
        muted: '#5a7183',
        grid: 'rgba(90, 113, 131, 0.16)',
        tooltip: '#ffffff',
      },
)
const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

const countChartOption = computed<EChartsCoreOption>(() => {
  const items = trend.value?.items ?? []
  return {
    animation: animate,
    color: [colors.value.primary, colors.value.success, colors.value.danger],
    aria: { enabled: true, description: '所选分组下的预约、签到和失约场次' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.value.tooltip,
      borderColor: colors.value.grid,
      textStyle: { color: colors.value.text },
    },
    legend: { top: 0, right: 0, textStyle: { color: colors.value.muted } },
    grid: { left: 8, right: 12, top: 46, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map((item) => item.label),
      axisLabel: {
        color: colors.value.muted,
        rotate: items.length > 12 ? 30 : 0,
        hideOverlap: true,
      },
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
        barMaxWidth: 26,
        data: items.map((item) => item.reservationCount),
      },
      {
        name: '已签到',
        type: 'bar',
        barMaxWidth: 26,
        data: items.map((item) => item.checkedInCount),
      },
      {
        name: '失约',
        type: 'bar',
        barMaxWidth: 26,
        data: items.map((item) => item.noShowCount),
      },
    ],
  }
})

const rateChartOption = computed<EChartsCoreOption>(() => {
  const items = trend.value?.items ?? []
  return {
    animation: animate,
    color: [colors.value.success, colors.value.danger],
    aria: { enabled: true, description: '所选分组下的签到率和失约率' },
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
      axisLabel: {
        color: colors.value.muted,
        rotate: items.length > 12 ? 30 : 0,
        hideOverlap: true,
      },
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
        type: 'line',
        smooth: 0.24,
        symbolSize: 7,
        data: items.map((item) =>
          item.hasSettledData ? Number((item.signInRate * 100).toFixed(1)) : 0,
        ),
      },
      {
        name: '失约率',
        type: 'line',
        smooth: 0.24,
        symbolSize: 7,
        data: items.map((item) =>
          item.hasSettledData ? Number((item.noShowRate * 100).toFixed(1)) : 0,
        ),
      },
    ],
  }
})

const hasCountData = computed(() => trend.value?.items.some((item) => item.hasData) ?? false)
const hasRateData = computed(() => trend.value?.items.some((item) => item.hasSettledData) ?? false)

function rowRate(row: unknown): string {
  const item = row as StatisticsTrendItem
  return formatMetricRate(item.signInRate, item.hasSettledData)
}

function rowNoShowRate(row: unknown): string {
  const item = row as StatisticsTrendItem
  return formatMetricRate(item.noShowRate, item.hasSettledData)
}

function rowUtilization(row: unknown): string {
  const item = row as StatisticsTrendItem
  return formatMetricRate(item.utilizationRate, item.hasUtilizationData)
}

async function loadRooms() {
  try {
    const result = await getAdminStudyRooms({ page: 1, pageSize: 100 })
    rooms.value = result.items
  } catch {
    rooms.value = []
  }
}

async function load() {
  if (filters.dates.length !== 2 || !filters.dates[0] || !filters.dates[1]) {
    ElMessage.warning('请选择完整的统计日期范围')
    return
  }
  controller?.abort()
  controller = new AbortController()
  const current = ++loadSequence
  loading.value = true
  error.value = ''
  try {
    const result = await getStatisticsTrend(query.value, controller.signal)
    if (current !== loadSequence) return
    trend.value = result
  } catch (cause) {
    if (cause instanceof RequestError && cause.kind === 'cancel') return
    if (current !== loadSequence) return
    trend.value = null
    error.value = cause instanceof RequestError ? cause.message : '统计报表加载失败'
  } finally {
    if (current === loadSequence) loading.value = false
  }
}

function reset() {
  filters.dates = [addDays(today, -6), today]
  filters.groupBy = 'day'
  filters.roomId = ''
  void load()
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function exportReport() {
  if (exporting.value || !trend.value) return
  exporting.value = true
  try {
    const result = await getStatisticsExport(query.value)
    saveBlob(result.blob, result.filename)
    ElMessage.success('统计报表已导出')
  } catch (cause) {
    ElMessage.error(cause instanceof RequestError ? cause.message : '统计报表导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  void loadRooms()
  void load()
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <section class="reports-page" aria-labelledby="reports-title">
    <header class="reports-hero">
      <div>
        <p class="page-eyebrow">管理后台 / 报表</p>
        <h1 id="reports-title">统计报表</h1>
        <p>按日期、自习室或开放时段汇总预约与使用数据，并导出当前筛选结果。</p>
      </div>
      <div class="hero-export">
        <span>{{ rangeLabel }}</span>
        <el-button
          type="primary"
          :icon="Download"
          :loading="exporting"
          :disabled="exporting || loading || !trend?.items.length"
          @click="exportReport"
        >
          {{ exporting ? '正在导出…' : '导出当前结果' }}
        </el-button>
      </div>
    </header>

    <el-form class="filter-panel" @submit.prevent="load">
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="filters.dates"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item label="分组维度">
        <select v-model="filters.groupBy" class="native-select" aria-label="选择分组维度">
          <option
            v-for="option in statisticsGroupOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </el-form-item>
      <el-form-item label="自习室">
        <select v-model="filters.roomId" class="native-select" aria-label="选择自习室">
          <option value="">全部自习室</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">
            {{ room.name }}
          </option>
        </select>
      </el-form-item>
      <div class="filter-actions">
        <el-button native-type="submit" type="primary" :icon="Search">生成报表</el-button>
        <el-button :icon="RefreshRight" @click="reset">重置</el-button>
      </div>
    </el-form>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="load">重新加载</el-button>
      </template>
    </el-alert>

    <div v-if="loading && !trend" v-loading="loading" class="loading-panel" />

    <template v-else>
      <div class="report-context">
        <span>当前按{{ statisticsGroupLabel(filters.groupBy) }}分组</span>
        <span v-if="trend">更新于 {{ formatDateTime(trend.generatedAt) }}</span>
        <span>共 {{ trend?.items.length ?? 0 }} 个分组</span>
      </div>

      <div class="chart-grid">
        <article class="chart-panel">
          <header class="panel-heading">
            <div>
              <span>场次结构</span>
              <h2>预约、签到与失约</h2>
            </div>
            <small>场次</small>
          </header>
          <StatisticsChart
            :option="countChartOption"
            label="报表预约签到失约柱状图"
            :empty="!hasCountData"
            height="310px"
          />
        </article>

        <article class="chart-panel">
          <header class="panel-heading">
            <div>
              <span>结算质量</span>
              <h2>签到率与失约率</h2>
            </div>
            <small>按已结算预约计算</small>
          </header>
          <StatisticsChart
            :option="rateChartOption"
            label="报表签到率与失约率折线图"
            :empty="!hasRateData"
            empty-text="当前筛选范围暂无已结算预约"
            height="310px"
          />
        </article>
      </div>

      <section class="table-panel">
        <header class="panel-heading">
          <div>
            <span>文字明细</span>
            <h2>{{ statisticsGroupLabel(filters.groupBy) }}统计表</h2>
          </div>
          <small>CSV 与此表使用同一接口结果</small>
        </header>
        <el-table v-loading="loading" :data="trend?.items ?? []" border stripe max-height="560">
          <el-table-column
            prop="label"
            :label="statisticsGroupLabel(filters.groupBy)"
            min-width="120"
          />
          <el-table-column prop="reservationCount" label="预约数" width="70" />
          <el-table-column prop="checkedInCount" label="已签到" width="70" />
          <el-table-column prop="noShowCount" label="失约数" width="70" />
          <el-table-column prop="outageCancelledCount" label="停机取消" width="70" />
          <el-table-column label="签到率" width="80">
            <template #default="{ row }">{{ rowRate(row) }}</template>
          </el-table-column>
          <el-table-column label="失约率" width="80">
            <template #default="{ row }">{{ rowNoShowRate(row) }}</template>
          </el-table-column>
          <el-table-column label="利用率" width="80">
            <template #default="{ row }">{{ rowUtilization(row) }}</template>
          </el-table-column>
          <template #empty>
            <el-empty description="当前筛选条件下没有统计数据" :image-size="80" />
          </template>
        </el-table>
      </section>
    </template>
  </section>
</template>

<style scoped>
.reports-page {
  display: grid;
  gap: 16px;
}

.reports-hero {
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

.reports-hero h1 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: clamp(1.7rem, 2.8vw, 2.4rem);
  letter-spacing: -0.045em;
}

.reports-hero p:last-child {
  max-width: 700px;
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.hero-export {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.hero-export span {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) minmax(130px, 0.55fr) minmax(160px, 0.8fr) auto;
  gap: 12px;
  align-items: end;
  padding: 17px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.filter-panel :deep(.el-form-item) {
  margin: 0;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.native-select {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  color: var(--text);
  background: var(--surface);
  font-size: 0.8rem;
}

.loading-panel {
  min-height: 360px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.report-context {
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

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chart-panel,
.table-panel {
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

.table-panel {
  overflow: hidden;
}

@media (max-width: 1100px) {
  .reports-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 21px;
  }

  .hero-export {
    width: 100%;
    justify-items: start;
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .filter-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .filter-panel {
    grid-template-columns: 1fr;
  }

  .chart-panel,
  .table-panel {
    padding: 15px;
  }
}
</style>
