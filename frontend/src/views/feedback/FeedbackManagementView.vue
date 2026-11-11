<script setup lang="ts">
import {
  ChatDotRound,
  CircleCheck,
  Clock,
  RefreshRight,
  Search,
  Warning,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue'
import { getAdminStudyRooms } from '../../api/admin-room'
import { getAdminFeedback, listAdminFeedback, transitionFeedback } from '../../api/feedback'
import FeedbackActionDialog from '../../components/feedback/FeedbackActionDialog.vue'
import FeedbackAdminDrawer from '../../components/feedback/FeedbackAdminDrawer.vue'
import type {
  AdminFeedbackDetail,
  AdminFeedbackSummary,
  FeedbackStatus,
  FeedbackStatusSummary,
  FeedbackTargetStatus,
  FeedbackType,
} from '../../types/feedback'
import type { StudyRoomSummary } from '../../types/study-room'
import { RequestError } from '../../utils/request'
import { formatDateTime } from '../../utils/reservation'
import {
  feedbackLocationLabel,
  feedbackStatusLabels,
  feedbackStatusOptions,
  feedbackStatusTagType,
  feedbackTypeLabels,
  feedbackTypeOptions,
} from '../../utils/feedback'

const filters = reactive({
  status: '' as FeedbackStatus | '',
  type: '' as FeedbackType | '',
  roomId: '',
  dates: [] as string[],
  studentNo: '',
  keyword: '',
  page: 1,
  pageSize: 10,
})
const items = shallowRef<AdminFeedbackSummary[]>([])
const total = shallowRef(0)
const summary = shallowRef<FeedbackStatusSummary>({
  pending: 0,
  processing: 0,
  resolved: 0,
  rejected: 0,
  total: 0,
})
const rooms = shallowRef<StudyRoomSummary[]>([])
const loading = shallowRef(false)
const error = shallowRef('')
const detailOpen = shallowRef(false)
const detailLoading = shallowRef(false)
const selectedTicket = shallowRef<AdminFeedbackDetail | null>(null)
const actionBusy = shallowRef(false)
const actionDialogOpen = shallowRef(false)
const actionStatus = shallowRef<'resolved' | 'rejected' | null>(null)
let listController: AbortController | null = null
let listSequence = 0
let detailSequence = 0

const summaryCards = computed(() => [
  {
    value: 'pending' as const,
    label: '待处理',
    count: summary.value.pending,
    icon: Clock,
  },
  {
    value: 'processing' as const,
    label: '处理中',
    count: summary.value.processing,
    icon: ChatDotRound,
  },
  {
    value: 'resolved' as const,
    label: '已解决',
    count: summary.value.resolved,
    icon: CircleCheck,
  },
  {
    value: 'rejected' as const,
    label: '已驳回',
    count: summary.value.rejected,
    icon: Warning,
  },
])

const actionDialogMeta = computed(() => {
  if (actionStatus.value === 'resolved') {
    return {
      title: '标记工单为解决',
      message: '请填写核实情况和处理结果。提交后工单进入终态，学生可立即查看。',
      confirmLabel: '确认解决',
      tone: 'primary' as const,
    }
  }
  return {
    title: '驳回反馈工单',
    message: '请说明驳回原因。提交后工单进入终态，学生可立即查看。',
    confirmLabel: '确认驳回',
    tone: 'danger' as const,
  }
})

function typeLabel(row: unknown): string {
  return feedbackTypeLabels[(row as AdminFeedbackSummary).type]
}

function statusLabel(row: unknown): string {
  return feedbackStatusLabels[(row as AdminFeedbackSummary).status]
}

function statusTag(row: unknown): 'warning' | 'primary' | 'success' | 'danger' {
  return feedbackStatusTagType((row as AdminFeedbackSummary).status)
}

function locationLabel(row: unknown): string {
  return feedbackLocationLabel(row as AdminFeedbackSummary)
}

function openDetailRow(row: unknown) {
  void openDetail(row as AdminFeedbackSummary)
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
  listController?.abort()
  listController = new AbortController()
  const current = ++listSequence
  loading.value = true
  error.value = ''
  try {
    const result = await listAdminFeedback(
      {
        status: filters.status,
        type: filters.type,
        roomId: filters.roomId,
        dateFrom: filters.dates[0],
        dateTo: filters.dates[1],
        studentNo: filters.studentNo.trim(),
        keyword: filters.keyword.trim(),
        page: filters.page,
        pageSize: filters.pageSize,
      },
      listController.signal,
    )
    if (current !== listSequence) return
    items.value = result.items
    total.value = result.total
    summary.value = result.summary
  } catch (cause) {
    if (cause instanceof RequestError && cause.kind === 'cancel') return
    if (current !== listSequence) return
    items.value = []
    total.value = 0
    error.value = cause instanceof RequestError ? cause.message : '反馈工单加载失败'
  } finally {
    if (current === listSequence) loading.value = false
  }
}

function search() {
  filters.page = 1
  void load()
}

function filterByStatus(status: FeedbackStatus) {
  filters.status = filters.status === status ? '' : status
  search()
}

function reset() {
  filters.status = ''
  filters.type = ''
  filters.roomId = ''
  filters.dates = []
  filters.studentNo = ''
  filters.keyword = ''
  filters.page = 1
  void load()
}

async function openDetail(ticket: AdminFeedbackSummary) {
  const current = ++detailSequence
  detailOpen.value = true
  detailLoading.value = true
  selectedTicket.value = null
  try {
    const result = await getAdminFeedback(ticket.id)
    if (current === detailSequence) selectedTicket.value = result
  } catch (cause) {
    if (current !== detailSequence) return
    detailOpen.value = false
    ElMessage.error(cause instanceof RequestError ? cause.message : '工单详情加载失败')
  } finally {
    if (current === detailSequence) detailLoading.value = false
  }
}

async function startProcessing() {
  if (!selectedTicket.value || actionBusy.value) return
  try {
    await ElMessageBox.confirm(
      '开始处理后，工单将进入“处理中”，并记录当前管理员和开始时间。',
      '开始处理工单',
      {
        confirmButtonText: '开始处理',
        cancelButtonText: '暂不处理',
      },
    )
    await runTransition('processing')
  } catch (cause) {
    if (cause === 'cancel' || cause === 'close') return
    ElMessage.error(cause instanceof RequestError ? cause.message : '工单状态更新失败')
  }
}

function requestResultAction(status: FeedbackTargetStatus) {
  if (status === 'processing') {
    void startProcessing()
    return
  }
  actionStatus.value = status
  actionDialogOpen.value = true
}

async function confirmResultAction(result: string) {
  if (!actionStatus.value) return
  await runTransition(actionStatus.value, result)
}

async function runTransition(status: FeedbackStatus, result?: string) {
  if (!selectedTicket.value || actionBusy.value) return
  actionBusy.value = true
  try {
    selectedTicket.value = await transitionFeedback(selectedTicket.value.id, status, result)
    actionDialogOpen.value = false
    ElMessage.success(
      status === 'processing' ? '已开始处理' : status === 'resolved' ? '工单已解决' : '工单已驳回',
    )
    await load()
  } catch (cause) {
    ElMessage.error(cause instanceof RequestError ? cause.message : '工单状态更新失败')
  } finally {
    actionBusy.value = false
  }
}

onMounted(() => {
  void loadRooms()
  void load()
})

onBeforeUnmount(() => {
  listController?.abort()
})
</script>

<template>
  <section class="admin-feedback-page" aria-labelledby="admin-feedback-title">
    <header class="admin-hero">
      <div>
        <p class="page-eyebrow">管理后台 / 反馈处理</p>
        <h1 id="admin-feedback-title">反馈处理工作台</h1>
        <p>集中核实占座举报与使用问题，留下可追溯的处理结果。</p>
      </div>
      <div class="hero-total">
        <span>全部工单</span>
        <strong>{{ summary.total }}</strong>
        <small>条记录</small>
      </div>
    </header>

    <div class="summary-grid" aria-label="工单状态汇总">
      <button
        v-for="card in summaryCards"
        :key="card.value"
        type="button"
        class="summary-card"
        :class="[`summary-${card.value}`, { active: filters.status === card.value }]"
        :aria-pressed="filters.status === card.value"
        @click="filterByStatus(card.value)"
      >
        <el-icon><component :is="card.icon" /></el-icon>
        <span>{{ card.label }}</span>
        <strong>{{ card.count }}</strong>
      </button>
    </div>

    <section class="surface">
      <header class="surface-heading">
        <div>
          <p class="section-kicker">TICKET QUEUE</p>
          <h2>工单队列</h2>
        </div>
        <el-button :icon="RefreshRight" :loading="loading" @click="load">刷新</el-button>
      </header>

      <el-form class="filter-panel" @submit.prevent="search">
        <el-form-item label="状态">
          <select v-model="filters.status" class="native-select" aria-label="按状态筛选">
            <option value="">全部状态</option>
            <option
              v-for="option in feedbackStatusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </el-form-item>
        <el-form-item label="类型">
          <select v-model="filters.type" class="native-select" aria-label="按类型筛选">
            <option value="">全部类型</option>
            <option v-for="option in feedbackTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </el-form-item>
        <el-form-item label="自习室">
          <select v-model="filters.roomId" class="native-select" aria-label="按自习室筛选">
            <option value="">全部自习室</option>
            <option v-for="room in rooms" :key="room.id" :value="room.id">
              {{ room.name }}
            </option>
          </select>
        </el-form-item>
        <el-form-item label="提交日期">
          <el-date-picker
            v-model="filters.dates"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="filters.studentNo" clearable placeholder="精确学号" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="房间、座位或描述"
            :prefix-icon="Search"
          />
        </el-form-item>
        <div class="filter-actions">
          <el-button native-type="submit" type="primary" :icon="Search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </el-form>

      <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
        <template #default>
          <el-button link type="primary" @click="load">重新加载</el-button>
        </template>
      </el-alert>

      <el-table
        v-loading="loading"
        :data="items"
        class="ticket-table"
        row-key="id"
        @row-click="openDetailRow"
      >
        <el-table-column label="工单" width="70">
          <template #default="{ row }">
            <span class="ticket-id">#{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="学生" min-width="110">
          <template #default="{ row }">
            <div class="cell-stack">
              <strong>{{ row.student.displayName || '—' }}</strong>
              <small>{{ row.student.studentNo }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="问题" min-width="210">
          <template #default="{ row }">
            <div class="problem-cell">
              <span>{{ typeLabel(row) }}</span>
              <p>{{ row.descriptionExcerpt }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="关联资源"
          min-width="160"
          class-name="admin-resource-column"
          label-class-name="admin-resource-column"
        >
          <template #default="{ row }">
            {{ locationLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column
          label="提交时间"
          width="155"
          class-name="admin-time-column"
          label-class-name="admin-time-column"
        >
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="86">
          <template #default="{ row }">
            <el-tag :type="statusTag(row)" effect="light" round>
              {{ statusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openDetailRow(row)">处理</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无符合条件的反馈工单" :image-size="88" />
        </template>
      </el-table>

      <div v-if="total > filters.pageSize" class="pagination-row">
        <el-pagination
          v-model:current-page="filters.page"
          :page-size="filters.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          background
          @current-change="load"
        />
      </div>
    </section>

    <FeedbackAdminDrawer
      v-model:open="detailOpen"
      :ticket="selectedTicket"
      :loading="detailLoading"
      :action-busy="actionBusy"
      @transition="requestResultAction"
    />

    <FeedbackActionDialog
      v-model:open="actionDialogOpen"
      :title="actionDialogMeta.title"
      :message="actionDialogMeta.message"
      :confirm-label="actionDialogMeta.confirmLabel"
      :tone="actionDialogMeta.tone"
      :busy="actionBusy"
      @confirm="confirmResultAction"
    />
  </section>
</template>

<style scoped>
.admin-feedback-page {
  display: grid;
  gap: 16px;
}

.admin-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding: 25px 28px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background:
    radial-gradient(
      circle at 90% 15%,
      color-mix(in srgb, var(--accent) 16%, transparent),
      transparent 30%
    ),
    linear-gradient(135deg, var(--surface), var(--accent-soft));
}

.page-eyebrow,
.section-kicker {
  margin: 0;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.12em;
}

.admin-hero h1 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: clamp(1.65rem, 2.7vw, 2.35rem);
  letter-spacing: -0.04em;
}

.admin-hero p:last-child {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.hero-total {
  display: grid;
  min-width: 125px;
  padding: 15px 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface) 84%, transparent);
}

.hero-total span,
.hero-total small {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.hero-total strong {
  margin: 4px 0;
  color: var(--text);
  font-size: 2rem;
  line-height: 1;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 9px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-secondary);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
}

.summary-card:hover,
.summary-card.active {
  border-color: var(--accent);
}

.summary-card.active {
  box-shadow: 0 0 0 1px var(--accent);
}

.summary-card .el-icon {
  font-size: 17px;
}

.summary-card span {
  font-size: 0.78rem;
  font-weight: 600;
}

.summary-card strong {
  color: var(--text);
  font-size: 1.35rem;
}

.summary-pending .el-icon {
  color: var(--status-warn);
}

.summary-processing .el-icon {
  color: var(--status-info);
}

.summary-resolved .el-icon {
  color: var(--status-ok);
}

.summary-rejected .el-icon {
  color: var(--status-bad);
}

.surface {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.surface-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.surface-heading h2 {
  margin: 5px 0 0;
  color: var(--text);
  font-size: 1.08rem;
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(135px, 1fr));
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface-muted);
}

.filter-panel :deep(.el-form-item) {
  display: block;
  margin: 0;
}

.filter-panel :deep(.el-form-item__label) {
  display: block;
  height: auto;
  margin-bottom: 5px;
  line-height: 1.25;
}

.filter-panel :deep(.el-select),
.filter-panel :deep(.el-input) {
  width: 100%;
}

.native-select {
  width: 100%;
  height: 34px;
  padding: 0 9px;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  color: var(--text);
  background: var(--surface);
  font-size: 0.8rem;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.ticket-table {
  width: 100%;
}

.ticket-table :deep(.el-table__row) {
  cursor: pointer;
}

.ticket-id {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 700;
}

.cell-stack,
.problem-cell {
  display: grid;
  gap: 3px;
}

.cell-stack strong {
  color: var(--text);
  font-size: 0.8rem;
}

.cell-stack small {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.problem-cell span {
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 700;
}

.problem-cell p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 0.76rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.pagination-row {
  display: flex;
  justify-content: center;
}

@media (max-width: 1180px) {
  .filter-panel {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }
}

@media (max-width: 850px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .ticket-table :deep(.admin-resource-column),
  .ticket-table :deep(.admin-time-column) {
    display: none;
  }
}

@media (max-width: 680px) {
  .admin-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 21px;
  }

  .hero-total {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .surface {
    padding: 16px;
  }

  .filter-panel {
    grid-template-columns: 1fr;
  }
}
</style>
