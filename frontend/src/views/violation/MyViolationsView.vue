<script setup lang="ts">
import { RefreshRight, Warning } from '@element-plus/icons-vue'
import { onMounted, reactive, shallowRef } from 'vue'
import { listMyViolations } from '../../api/violation'
import type { ViolationRecord, ViolationStatus, ViolationSummary } from '../../types/violation'
import { RequestError } from '../../utils/request'
import { formatDateTime, formatTimeRange } from '../../utils/reservation'
import {
  violationStatusLabels,
  violationStatusOptions,
  violationStatusTagType,
  violationTypeLabels,
} from '../../utils/violation'

const filters = reactive({
  status: '' as ViolationStatus | '',
  page: 1,
  pageSize: 10,
})
const items = shallowRef<ViolationRecord[]>([])
const summary = shallowRef<ViolationSummary>({
  activeCount: 0,
  threshold: 0,
  restrictionDays: 0,
  restrictionUntil: null,
})
const total = shallowRef(0)
const loading = shallowRef(false)
const error = shallowRef('')
let sequence = 0

async function load() {
  const current = ++sequence
  loading.value = true
  error.value = ''
  try {
    const result = await listMyViolations({
      status: filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
    })
    if (current !== sequence) return
    items.value = result.items
    summary.value = result.summary
    total.value = result.total
  } catch (cause) {
    if (current !== sequence) return
    items.value = []
    total.value = 0
    error.value = cause instanceof RequestError ? cause.message : '违约记录加载失败'
  } finally {
    if (current === sequence) loading.value = false
  }
}

function changeFilter() {
  filters.page = 1
  void load()
}

function typeLabel(row: unknown): string {
  return violationTypeLabels[(row as ViolationRecord).type]
}

function statusLabel(row: unknown): string {
  return violationStatusLabels[(row as ViolationRecord).status]
}

function statusTag(row: unknown): 'danger' | 'info' {
  return violationStatusTagType((row as ViolationRecord).status)
}

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="violation-page page-shell">
    <header class="page-header page-hero">
      <div class="page-hero-copy">
        <p class="page-eyebrow">学生服务 / 违约</p>
        <h1>我的违约</h1>
        <p class="page-note">预约未在签到窗口内完成签到会记为一次失约，累计到阈值后限制预约。</p>
      </div>
      <el-button :icon="RefreshRight" :loading="loading" @click="load">刷新</el-button>
    </header>

    <div class="summary-grid">
      <article class="summary-card">
        <span>当前有效违约</span>
        <strong>{{ summary.activeCount }}</strong>
        <small>次</small>
      </article>
      <article class="summary-card">
        <span>触发限制阈值</span>
        <strong>{{ summary.threshold }}</strong>
        <small>次</small>
      </article>
      <article class="summary-card" :class="{ danger: summary.restrictionUntil }">
        <span>预约限制</span>
        <strong>{{ summary.restrictionUntil ? '限制中' : '正常' }}</strong>
        <small v-if="summary.restrictionUntil">
          截止 {{ formatDateTime(summary.restrictionUntil) }}
        </small>
        <small v-else>可以正常预约</small>
      </article>
    </div>

    <el-alert
      v-if="summary.restrictionUntil"
      type="error"
      :title="`当前处于预约限制期，截止至 ${formatDateTime(summary.restrictionUntil)}`"
      :closable="false"
      show-icon
    />

    <el-form class="filter-panel toolbar-panel" @submit.prevent="changeFilter">
      <el-form-item label="状态">
        <el-radio-group v-model="filters.status" @change="changeFilter">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button
            v-for="option in violationStatusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="load">重试</el-button>
      </template>
    </el-alert>

    <el-table v-loading="loading" :data="items">
      <el-table-column label="发生时间" width="170">
        <template #default="{ row }">{{ formatDateTime(row.occurredAt) }}</template>
      </el-table-column>
      <el-table-column label="来源预约" min-width="200">
        <template #default="{ row }">
          <div class="cell-stack">
            <strong>{{ row.roomName }}</strong>
            <small>
              {{ row.reserveDate }} {{ formatTimeRange(row.startAt, row.endAt) }} · 座位
              {{ row.seatNo }}
            </small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="120">
        <template #default="{ row }">{{ typeLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row)" effect="light">{{ statusLabel(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="撤销说明" min-width="180">
        <template #default="{ row }">
          <span v-if="row.status === 'revoked'">{{ row.resolutionReason || '—' }}</span>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <template #empty>
        <div class="empty-state">
          <el-icon><Warning /></el-icon>
          <p>暂无违约记录，保持按时签到即可。</p>
        </div>
      </template>
    </el-table>

    <el-pagination
      v-model:current-page="filters.page"
      :page-size="filters.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      background
      @current-change="load"
    />
  </section>
</template>

<style scoped>
.violation-page {
  display: grid;
  gap: 24px;
}

.page-header {
  min-height: 190px;
}

.page-eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.page-header h1 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: -0.04em;
}

.page-note {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.summary-card {
  display: grid;
  gap: 4px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.summary-card span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.summary-card strong {
  color: var(--text);
  font-size: 2rem;
  font-weight: 500;
}

.summary-card small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.summary-card.danger {
  border-color: var(--status-bad-border);
  background: var(--status-bad-tint);
}

.summary-card.danger strong {
  color: var(--status-bad-text, var(--text));
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding: 14px 16px 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface) 72%, transparent);
}

.cell-stack {
  display: grid;
  gap: 2px;
}

.cell-stack strong {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
}

.cell-stack small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.muted {
  color: var(--text-muted);
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 18px 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

@media (max-width: 720px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
