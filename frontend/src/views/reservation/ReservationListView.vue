<script setup lang="ts">
import { RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { cancelReservation, listMyReservations } from '../../api/reservation'
import ReservationCard from '../../components/reservation/ReservationCard.vue'
import type { ReservationStatus, ReservationSummary } from '../../types/reservation'
import { RequestError } from '../../utils/request'
import { reservationStatusOptions } from '../../utils/reservation'

const router = useRouter()
const filters = reactive({
  status: '' as ReservationStatus | '',
  dates: [] as string[],
  page: 1,
  pageSize: 6,
})
const items = shallowRef<ReservationSummary[]>([])
const total = shallowRef(0)
const loading = shallowRef(false)
const error = shallowRef('')
let sequence = 0

async function load() {
  const current = ++sequence
  loading.value = true
  error.value = ''
  try {
    const result = await listMyReservations({
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

function reloadFromFirstPage() {
  filters.page = 1
  void load()
}

function openDetail(id: string) {
  void router.push(`/reservations/${id}`)
}

async function cancel(reservation: ReservationSummary) {
  try {
    const { value } = await ElMessageBox.prompt(
      `确定取消 ${reservation.reserveDate} ${reservation.roomName} 座位 ${reservation.seatNo} 的预约吗？`,
      '取消预约',
      {
        confirmButtonText: '确认取消',
        cancelButtonText: '返回',
        inputPlaceholder: '取消原因（可选）',
        inputValidator: () => true,
      },
    )
    await cancelReservation(reservation.id, value ?? '')
    ElMessage.success('预约已取消')
    await load()
  } catch (cause) {
    if (cause === 'cancel' || cause === 'close') return
    ElMessage.error(cause instanceof RequestError ? cause.message : '取消预约失败')
  }
}

watch(
  () => [filters.status, filters.dates],
  () => reloadFromFirstPage(),
  { deep: true },
)

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="reservation-page page-shell">
    <header class="page-header page-hero">
      <div class="page-hero-copy">
        <p class="page-eyebrow">学生服务 / 预约</p>
        <h1>我的预约</h1>
        <p class="page-note">查看预约状态与签到窗口，预约开始前可以自行取消。</p>
      </div>
      <el-button :icon="RefreshRight" :loading="loading" @click="load">刷新</el-button>
    </header>

    <el-form class="filter-panel toolbar-panel" @submit.prevent="reloadFromFirstPage">
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
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="filters.dates"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="true"
        />
      </el-form-item>
    </el-form>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="load">重试</el-button>
      </template>
    </el-alert>

    <div v-loading="loading" class="list-body">
      <div v-if="items.length" class="card-grid">
        <ReservationCard
          v-for="item in items"
          :key="item.id"
          :reservation="item"
          @detail="openDetail"
          @cancel="cancel"
          @checkin="openDetail"
        />
      </div>
      <el-empty v-else-if="!loading" :image-size="90" description="暂无符合条件的预约" />
    </div>

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
.reservation-page {
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

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface) 72%, transparent);
}

.list-body {
  min-height: 220px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
</style>
