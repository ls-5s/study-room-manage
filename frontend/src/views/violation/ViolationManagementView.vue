<script setup lang="ts">
import { RefreshRight, Search, Warning } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, shallowRef } from 'vue'
import { getAdminStudyRooms } from '../../api/admin-room'
import { getViolationRules, listAdminViolations, revokeViolation, updateViolationRules } from '../../api/violation'
import type { StudyRoomSummary } from '../../types/study-room'
import type {
  AdminViolationRecord,
  ViolationRules,
  ViolationStatus,
  ViolationSummary,
} from '../../types/violation'
import { RequestError } from '../../utils/request'
import { formatDateTime, formatTimeRange } from '../../utils/reservation'
import {
  violationStatusLabels,
  violationStatusOptions,
  violationStatusTagType,
  violationTypeLabels,
} from '../../utils/violation'

const rules = reactive<ViolationRules>({ threshold: 3, restrictionDays: 7 })
const rulesLoading = shallowRef(false)
const rulesSaving = shallowRef(false)

const filters = reactive({
  studentNo: '',
  roomId: '',
  status: '' as ViolationStatus | '',
  dates: [] as string[],
  page: 1,
  pageSize: 10,
})
const items = shallowRef<AdminViolationRecord[]>([])
const summary = shallowRef<ViolationSummary>({
  activeCount: 0,
  threshold: 0,
  restrictionDays: 0,
  restrictionUntil: null,
})
const rooms = shallowRef<StudyRoomSummary[]>([])
const total = shallowRef(0)
const loading = shallowRef(false)
const error = shallowRef('')
const detailOpen = shallowRef(false)
const detail = shallowRef<AdminViolationRecord | null>(null)
let sequence = 0

async function loadRules() {
  rulesLoading.value = true
  try {
    const result = await getViolationRules()
    rules.threshold = result.threshold
    rules.restrictionDays = result.restrictionDays
  } catch (cause) {
    ElMessage.error(cause instanceof RequestError ? cause.message : '违约规则加载失败')
  } finally {
    rulesLoading.value = false
  }
}

async function saveRules() {
  if (
    !Number.isInteger(rules.threshold) ||
    rules.threshold < 1 ||
    rules.threshold > 20 ||
    !Number.isInteger(rules.restrictionDays) ||
    rules.restrictionDays < 1 ||
    rules.restrictionDays > 90
  ) {
    ElMessage.warning('阈值需为 1-20，限制天数需为 1-90')
    return
  }
  rulesSaving.value = true
  try {
    const result = await updateViolationRules({
      threshold: rules.threshold,
      restrictionDays: rules.restrictionDays,
    })
    rules.threshold = result.threshold
    rules.restrictionDays = result.restrictionDays
    ElMessage.success('违约规则已更新，只影响之后触发的限制')
    await load()
  } catch (cause) {
    ElMessage.error(cause instanceof RequestError ? cause.message : '规则保存失败')
  } finally {
    rulesSaving.value = false
  }
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
  const current = ++sequence
  loading.value = true
  error.value = ''
  try {
    const result = await listAdminViolations({
      studentNo: filters.studentNo.trim(),
      roomId: filters.roomId,
      status: filters.status,
      dateFrom: filters.dates[0],
      dateTo: filters.dates[1],
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
    error.value = cause instanceof RequestError ? cause.message : '违约列表加载失败'
  } finally {
    if (current === sequence) loading.value = false
  }
}

function search() {
  filters.page = 1
  void load()
}

function reset() {
  filters.studentNo = ''
  filters.roomId = ''
  filters.status = ''
  filters.dates = []
  filters.page = 1
  void load()
}

function openDetail(rawRow: unknown) {
  detail.value = rawRow as AdminViolationRecord
  detailOpen.value = true
}

function typeLabel(row: unknown): string {
  return violationTypeLabels[(row as AdminViolationRecord).type]
}

function statusLabel(row: unknown): string {
  return violationStatusLabels[(row as AdminViolationRecord).status]
}

function statusTag(row: unknown): 'danger' | 'info' {
  return violationStatusTagType((row as AdminViolationRecord).status)
}

async function revoke(rawRow: unknown) {
  const row = rawRow as AdminViolationRecord
  try {
    const { value } = await ElMessageBox.prompt(
      `撤销 ${row.student.studentNo} 在 ${row.reserveDate} 的失约记录，请填写原因。`,
      '撤销违约',
      {
        confirmButtonText: '确认撤销',
        cancelButtonText: '返回',
        inputPlaceholder: '撤销原因（必填，2-255 字）',
        inputValidator: (input: string) => (input ?? '').trim().length >= 2 || '请填写撤销原因',
      },
    )
    await revokeViolation(row.id, value)
    ElMessage.success('违约记录已撤销')
    if (detailOpen.value && detail.value?.id === row.id) detailOpen.value = false
    await load()
  } catch (cause) {
    if (cause === 'cancel' || cause === 'close') return
    ElMessage.error(cause instanceof RequestError ? cause.message : '撤销失败')
  }
}

onMounted(() => {
  void loadRules()
  void loadRooms()
  void load()
})
</script>

<template>
  <section class="admin-violation-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">管理后台 / 违约</p>
        <h1>违约管理</h1>
        <p class="page-note">配置限制规则、核对失约记录，并在核实后带原因撤销。</p>
      </div>
      <el-button :icon="RefreshRight" :loading="loading" @click="load">刷新</el-button>
    </header>

    <section v-loading="rulesLoading" class="rules-card">
      <div class="rules-heading">
        <h2>规则配置</h2>
        <p>阈值指累计有效违约达到多少次后开始限制预约；修改只影响之后触发的限制，不追溯已生效区间。</p>
      </div>
      <div class="rules-form">
        <label>
          <span>违约阈值（次）</span>
          <input v-model.number="rules.threshold" class="native-input" type="number" min="1" max="20" />
        </label>
        <label>
          <span>限制天数（天）</span>
          <input
            v-model.number="rules.restrictionDays"
            class="native-input"
            type="number"
            min="1"
            max="90"
          />
        </label>
        <el-button type="primary" :loading="rulesSaving" @click="saveRules">保存规则</el-button>
      </div>
      <p class="rules-summary">
        当前规则：累计 <strong>{{ summary.threshold }}</strong> 次有效违约后限制
        <strong>{{ summary.restrictionDays }}</strong> 天。
      </p>
    </section>

    <el-form class="filter-panel" @submit.prevent="search">
      <el-form-item label="学号">
        <el-input v-model="filters.studentNo" placeholder="精确学号" clearable style="width: 150px" />
      </el-form-item>
      <el-form-item label="自习室">
        <select v-model="filters.roomId" class="native-select" aria-label="按自习室筛选">
          <option value="">全部</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="filters.status">
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
      <el-form-item label="日期">
        <el-date-picker
          v-model="filters.dates"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon />

    <el-table v-loading="loading" :data="items" border stripe>
      <el-table-column label="学生" min-width="150">
        <template #default="{ row }">
          <div class="cell-stack">
            <strong>{{ row.student.displayName || '—' }}</strong>
            <small>{{ row.student.studentNo }}</small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="来源预约" min-width="200">
        <template #default="{ row }">
          <div class="cell-stack">
            <strong>{{ row.roomName }} · {{ row.seatNo }}</strong>
            <small>
              {{ row.reserveDate }} {{ formatTimeRange(row.startAt, row.endAt) }}
            </small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="120">
        <template #default="{ row }">{{ typeLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="触发时间" width="170">
        <template #default="{ row }">{{ formatDateTime(row.occurredAt) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row)" effect="light">{{ statusLabel(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button v-if="row.status === 'active'" link type="danger" @click="revoke(row)">
            撤销
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="empty-state">
          <el-icon><Warning /></el-icon>
          <p>暂无违约记录</p>
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

    <el-drawer v-model="detailOpen" title="违约详情" size="440px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="违约编号">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="学生">
          {{ detail.student.displayName }}（{{ detail.student.studentNo }}）
        </el-descriptions-item>
        <el-descriptions-item label="来源预约">
          {{ detail.roomName }} · 座位 {{ detail.seatNo }}
        </el-descriptions-item>
        <el-descriptions-item label="预约时段">
          {{ detail.reserveDate }} {{ formatTimeRange(detail.startAt, detail.endAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="触发时间">{{ formatDateTime(detail.occurredAt) }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ detail.reason }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ violationStatusLabels[detail.status] }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.resolvedAt" label="撤销时间">
          {{ formatDateTime(detail.resolvedAt) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.resolutionReason" label="撤销原因">
          {{ detail.resolutionReason }}
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </section>
</template>

<style scoped>
.admin-violation-page {
  display: grid;
  gap: 14px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.page-eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.page-header h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.4rem, 2.4vw, 1.9rem);
}

.page-note {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.rules-card {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.rules-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 0.98rem;
}

.rules-heading p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.76rem;
}

.rules-form {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 14px;
}

.rules-form label {
  display: grid;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.74rem;
}

.native-input {
  width: 130px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.84rem;
}

.native-select {
  min-width: 180px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.84rem;
}

.rules-summary {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.rules-summary strong {
  color: var(--text);
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding: 14px 16px 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}

.cell-stack {
  display: grid;
  gap: 2px;
}

.cell-stack strong {
  color: var(--text);
  font-size: 0.84rem;
}

.cell-stack small {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 18px 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

@media (max-width: 820px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
