<script setup lang="ts">
import { ArrowLeft, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { cancelReservation, getReservation } from '../../api/reservation'
import CheckInPanel from '../../components/reservation/CheckInPanel.vue'
import ReservationTimeline from '../../components/reservation/ReservationTimeline.vue'
import type { ReservationDetail } from '../../types/reservation'
import { RequestError } from '../../utils/request'
import {
  canCancel,
  formatDateTime,
  formatTimeRange,
  reservationStatusLabels,
  reservationStatusTagType,
  windowHint,
  windowState,
} from '../../utils/reservation'

const route = useRoute()
const detail = shallowRef<ReservationDetail | null>(null)
const loading = shallowRef(false)
const error = shallowRef('')

const id = computed(() => String(route.params.id))
const state = computed(() =>
  detail.value ? windowState(detail.value.checkInWindow) : ('before' as const),
)
const cancellable = computed(() =>
  detail.value ? canCancel(detail.value.startAt, detail.value.status) : false,
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    detail.value = await getReservation(id.value)
  } catch (cause) {
    detail.value = null
    error.value = cause instanceof RequestError ? cause.message : '预约详情加载失败'
  } finally {
    loading.value = false
  }
}

async function cancel() {
  if (!detail.value) return
  try {
    const { value } = await ElMessageBox.prompt('确认取消该预约吗？', '取消预约', {
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      inputPlaceholder: '取消原因（可选）',
      inputValidator: () => true,
    })
    await cancelReservation(detail.value.id, value ?? '')
    ElMessage.success('预约已取消')
    await load()
  } catch (cause) {
    if (cause === 'cancel' || cause === 'close') return
    ElMessage.error(cause instanceof RequestError ? cause.message : '取消预约失败')
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="detail-page page-shell">
    <RouterLink class="back-link" to="/reservations">
      <el-icon><ArrowLeft /></el-icon>
      返回我的预约
    </RouterLink>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="load">重试</el-button>
      </template>
    </el-alert>

    <div v-loading="loading" class="detail-body">
      <template v-if="detail">
        <header class="detail-header page-hero">
          <div class="page-hero-copy">
            <p class="page-eyebrow">预约详情 · 编号 {{ detail.id }}</p>
            <h1>{{ detail.roomName }}</h1>
            <p class="header-meta">
              {{ detail.roomLocation }} · {{ detail.reserveDate }}
              {{ formatTimeRange(detail.startAt, detail.endAt) }} · 座位 {{ detail.seatNo }}
            </p>
          </div>
          <div class="header-actions page-actions">
            <el-tag :type="reservationStatusTagType(detail.status)" effect="light">
              {{ reservationStatusLabels[detail.status] }}
            </el-tag>
            <el-button :icon="RefreshRight" :loading="loading" @click="load">刷新</el-button>
          </div>
        </header>

        <section class="info-grid">
          <div class="info-item">
            <span>预约状态</span>
            <strong>{{ reservationStatusLabels[detail.status] }}</strong>
          </div>
          <div class="info-item">
            <span>签到窗口</span>
            <strong>
              {{ formatDateTime(detail.checkInWindow.openAt) }} 至
              {{ formatDateTime(detail.checkInWindow.deadline) }}
            </strong>
          </div>
          <div class="info-item">
            <span>签到时间</span>
            <strong>{{
              detail.checkIn ? formatDateTime(detail.checkIn.checkedInAt) : '尚未签到'
            }}</strong>
          </div>
          <div class="info-item">
            <span>签到方式</span>
            <strong>{{
              detail.checkIn ? (detail.checkIn.method === 'qr' ? '二维码签到' : '管理员核验') : '—'
            }}</strong>
          </div>
        </section>

        <el-alert
          v-if="detail.status === 'pending'"
          :type="state === 'open' ? 'success' : 'info'"
          :title="windowHint(detail.checkInWindow, state)"
          :closable="false"
          show-icon
        />
        <el-alert
          v-if="detail.status === 'no_show'"
          type="error"
          title="该预约已失约，该时段不再放出"
          :closable="false"
          show-icon
        />
        <el-alert
          v-if="detail.status === 'cancelled'"
          type="warning"
          :title="`预约已取消${detail.cancelReason ? `：${detail.cancelReason}` : ''}`"
          :closable="false"
          show-icon
        />

        <CheckInPanel v-if="detail.status === 'pending'" :reservation="detail" @checked-in="load" />

        <section v-if="detail.status === 'pending'" class="cancel-bar">
          <div>
            <strong>需要取消？</strong>
            <span>预约开始前可以自行取消，取消后座位立即释放。</span>
          </div>
          <el-button type="danger" plain :disabled="!cancellable" @click="cancel"
            >取消预约</el-button
          >
        </section>

        <section class="timeline-section">
          <h2>状态时间线</h2>
          <ReservationTimeline :items="detail.timeline" />
        </section>
      </template>
    </div>
  </section>
</template>

<style scoped>
.detail-page {
  display: grid;
  gap: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-decoration: none;
}

.detail-body {
  display: grid;
  gap: 16px;
  min-height: 260px;
}

.detail-header {
  min-height: 210px;
}

.page-eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.detail-header h1 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: clamp(2rem, 3.2vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.04em;
}

.header-meta {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: grid;
  gap: 6px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.info-item span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.info-item strong {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
}

.cancel-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
}

.cancel-bar div {
  display: grid;
  gap: 4px;
}

.cancel-bar strong {
  color: var(--text);
  font-size: 0.875rem;
}

.cancel-bar span {
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.timeline-section {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.timeline-section h2 {
  margin: 0 0 12px;
  color: var(--text);
  font-size: 1.125rem;
  font-weight: 500;
}

@media (max-width: 720px) {
  .detail-header,
  .cancel-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
