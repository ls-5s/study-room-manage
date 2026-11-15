<script setup lang="ts">
import { RefreshRight, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminStudyRooms } from '../../api/admin-room'
import { manualCheckIn } from '../../api/check-in'
import { cancelReservation, getReservation, listAdminReservations } from '../../api/reservation'
import ReservationTimeline from '../../components/reservation/ReservationTimeline.vue'
import type {
  AdminReservation,
  ReservationDetail,
  ReservationStatus,
} from '../../types/reservation'
import type { StudyRoomSummary } from '../../types/study-room'
import { RequestError } from '../../utils/request'
import {
  formatDateTime,
  formatTimeRange,
  reservationStatusLabels,
  reservationStatusOptions,
  reservationStatusTagType,
} from '../../utils/reservation'

const router = useRouter()
const filters = reactive({
  studentNo: '',
  roomId: '',
  status: '' as ReservationStatus | '',
  dates: [] as string[],
  page: 1,
  pageSize: 10,
})
const items = shallowRef<AdminReservation[]>([])
const total = shallowRef(0)
const rooms = shallowRef<StudyRoomSummary[]>([])
const loading = shallowRef(false)
const error = shallowRef('')
const detailOpen = shallowRef(false)
const detailLoading = shallowRef(false)
const detail = shallowRef<ReservationDetail | null>(null)
let sequence = 0

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
    const result = await listAdminReservations({
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
    total.value = result.total
  } catch (cause) {
    if (current !== sequence) return
    items.value = []
    total.value = 0
    error.value = cause instanceof RequestError ? cause.message : '预约列表加载失败'
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

async function openDetail(id: string) {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await getReservation(id)
  } catch (cause) {
    ElMessage.error(cause instanceof RequestError ? cause.message : '详情加载失败')
    detailOpen.value = false
  } finally {
    detailLoading.value = false
  }
}

async function cancel(rawRow: unknown) {
  const row = rawRow as AdminReservation
  try {
    const { value } = await ElMessageBox.prompt(
      `取消 ${row.student.studentNo} 在 ${row.roomName} 座位 ${row.seatNo} 的预约，请填写原因。`,
      '管理员取消预约',
      {
        confirmButtonText: '确认取消',
        cancelButtonText: '返回',
        inputPlaceholder: '取消原因（必填，2-255 字）',
        inputValidator: (input: string) => (input ?? '').trim().length >= 2 || '请填写取消原因',
      },
    )
    await cancelReservation(row.id, value)
    ElMessage.success('预约已取消')
    if (detailOpen.value && detail.value?.id === row.id) await openDetail(row.id)
    await load()
  } catch (cause) {
    if (cause === 'cancel' || cause === 'close') return
    ElMessage.error(cause instanceof RequestError ? cause.message : '取消预约失败')
  }
}

async function verify(rawRow: unknown) {
  const row = rawRow as AdminReservation
  try {
    const { value } = await ElMessageBox.prompt(
      `为 ${row.student.studentNo} 的人工核验签到填写原因。`,
      '人工核验签到',
      {
        confirmButtonText: '确认签到',
        cancelButtonText: '返回',
        inputPlaceholder: '核验原因（必填，2-255 字）',
        inputValidator: (input: string) => (input ?? '').trim().length >= 2 || '请填写核验原因',
      },
    )
    await manualCheckIn(row.id, value)
    ElMessage.success('已人工核验签到')
    if (detailOpen.value && detail.value?.id === row.id) await openDetail(row.id)
    await load()
  } catch (cause) {
    if (cause === 'cancel' || cause === 'close') return
    ElMessage.error(cause instanceof RequestError ? cause.message : '人工核验失败')
  }
}

onMounted(() => {
  void loadRooms()
  void load()
})
</script>

<template>
  <section class="admin-reservation-page page-shell">
    <header class="page-header page-hero">
      <div class="page-hero-copy">
        <p class="page-eyebrow">管理后台 / 预约</p>
        <h1>预约管理</h1>
        <p class="page-note">按学生、自习室、日期和状态查询预约，异常情况可人工取消或核验签到。</p>
      </div>
      <div class="header-actions page-actions">
        <el-button @click="router.push('/admin/reservations/check-in-code')">签到码展示</el-button>
        <el-button :icon="RefreshRight" :loading="loading" @click="load">刷新</el-button>
      </div>
    </header>

    <el-form class="filter-panel toolbar-panel" @submit.prevent="search">
      <el-form-item label="学号">
        <el-input
          v-model="filters.studentNo"
          placeholder="精确学号"
          clearable
          style="width: 160px"
        />
      </el-form-item>
      <el-form-item label="自习室">
        <!-- Native select keeps the filter typed; Element's ElSelect props do not resolve
             under this element-plus + vue-tsc combination. -->
        <select v-model="filters.roomId" class="native-select" aria-label="按自习室筛选">
          <option value="">全部</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="filters.status">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button
            v-for="option in reservationStatusOptions"
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

    <el-table v-loading="loading" :data="items">
      <el-table-column label="学生" min-width="150">
        <template #default="{ row }">
          <div class="student-cell">
            <strong>{{ row.student.displayName || '—' }}</strong>
            <small>{{ row.student.studentNo }}</small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="自习室 / 座位" min-width="180">
        <template #default="{ row }">
          <div class="student-cell">
            <strong>{{ row.roomName }}</strong>
            <small>{{ row.seatNo }} · {{ row.roomLocation }}</small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="预约时间" min-width="170">
        <template #default="{ row }">
          <div class="student-cell">
            <strong>{{ row.reserveDate }}</strong>
            <small>{{ formatTimeRange(row.startAt, row.endAt) }}</small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="reservationStatusTagType(row.status)" effect="light">
            {{ reservationStatusLabels[row.status as ReservationStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="签到" width="150">
        <template #default="{ row }">
          <span v-if="row.checkedInAt">{{ formatDateTime(row.checkedInAt) }}</span>
          <span v-else class="muted">未签到</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="row.status === 'pending'" link type="success" @click="verify(row)">
            人工核验
          </el-button>
          <el-button v-if="row.status === 'pending'" link type="danger" @click="cancel(row)">
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="filters.page"
      :page-size="filters.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      background
      @current-change="load"
    />

    <el-drawer v-model="detailOpen" title="预约详情" size="460px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="预约编号">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="自习室">{{ detail.roomName }}</el-descriptions-item>
            <el-descriptions-item label="位置">{{ detail.roomLocation }}</el-descriptions-item>
            <el-descriptions-item label="座位">{{ detail.seatNo }}</el-descriptions-item>
            <el-descriptions-item label="日期">{{ detail.reserveDate }}</el-descriptions-item>
            <el-descriptions-item label="时段">
              {{ formatTimeRange(detail.startAt, detail.endAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              {{ reservationStatusLabels[detail.status] }}
            </el-descriptions-item>
            <el-descriptions-item label="签到窗口">
              {{ formatDateTime(detail.checkInWindow.openAt) }} 至
              {{ formatDateTime(detail.checkInWindow.deadline) }}
            </el-descriptions-item>
            <el-descriptions-item label="签到记录">
              {{
                detail.checkIn
                  ? `${formatDateTime(detail.checkIn.checkedInAt)} · ${
                      detail.checkIn.method === 'qr' ? '二维码' : '人工核验'
                    }`
                  : '未签到'
              }}
            </el-descriptions-item>
            <el-descriptions-item v-if="detail.cancelReason" label="取消原因">
              {{ detail.cancelReason }}
            </el-descriptions-item>
          </el-descriptions>

          <h3 class="timeline-title">状态时间线</h3>
          <ReservationTimeline :items="detail.timeline" />
        </template>
      </div>
    </el-drawer>
  </section>
</template>

<style scoped>
.admin-reservation-page {
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

.header-actions {
  display: flex;
  gap: 8px;
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

.native-select {
  min-width: 180px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--text);
  font-size: 0.875rem;
}

.student-cell {
  display: grid;
  gap: 2px;
}

.student-cell strong {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
}

.student-cell small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.muted {
  color: var(--text-muted);
}

.timeline-title {
  margin: 18px 0 10px;
  color: var(--text);
  font-size: 0.9rem;
}

@media (max-width: 820px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
