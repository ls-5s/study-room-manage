<script setup lang="ts">
import { Calendar, Location, Timer } from '@element-plus/icons-vue'
import { computed } from 'vue'
import type { ReservationSummary } from '../../types/reservation'
import {
  canCancel,
  formatTimeRange,
  reservationStatusLabels,
  reservationStatusTagType,
  windowHint,
  windowState,
} from '../../utils/reservation'

const props = defineProps<{
  reservation: ReservationSummary
}>()

const emit = defineEmits<{
  detail: [id: string]
  cancel: [reservation: ReservationSummary]
  checkin: [id: string]
}>()

const state = computed(() => windowState(props.reservation.checkInWindow))
const showCancel = computed(() => canCancel(props.reservation.startAt, props.reservation.status))
const showCheckIn = computed(() => props.reservation.status === 'pending' && state.value === 'open')
</script>

<template>
  <article class="reservation-card">
    <header>
      <div>
        <p class="card-date">{{ reservation.reserveDate }}</p>
        <h3>{{ reservation.roomName }}</h3>
      </div>
      <el-tag :type="reservationStatusTagType(reservation.status)" effect="light">
        {{ reservationStatusLabels[reservation.status] }}
      </el-tag>
    </header>

    <dl class="card-meta">
      <div>
        <dt>
          <el-icon><Location /></el-icon>位置
        </dt>
        <dd>{{ reservation.roomLocation }}</dd>
      </div>
      <div>
        <dt>
          <el-icon><Timer /></el-icon>时段
        </dt>
        <dd>{{ formatTimeRange(reservation.startAt, reservation.endAt) }}</dd>
      </div>
      <div>
        <dt>
          <el-icon><Calendar /></el-icon>座位
        </dt>
        <dd>{{ reservation.seatNo }}</dd>
      </div>
    </dl>

    <p v-if="reservation.status === 'pending'" class="window-hint">
      {{ windowHint(reservation.checkInWindow, state) }}
    </p>
    <p v-else-if="reservation.status === 'no_show'" class="window-hint is-danger">
      已失约，该时段不再放出
    </p>

    <footer>
      <el-button link type="primary" @click="emit('detail', reservation.id)">查看详情</el-button>
      <el-button
        v-if="showCheckIn"
        type="primary"
        size="small"
        @click="emit('checkin', reservation.id)"
      >
        去签到
      </el-button>
      <el-button v-if="showCancel" size="small" @click="emit('cancel', reservation)"
        >取消预约</el-button
      >
    </footer>
  </article>
</template>

<style scoped>
.reservation-card {
  position: relative;
  display: grid;
  gap: 16px;
  overflow: hidden;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  transition:
    border-color 300ms var(--ease-out),
    box-shadow 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.reservation-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent 68%);
  content: '';
}

.reservation-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-raised);
  transform: translateY(-2px);
}

.reservation-card header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-date {
  margin: 0 0 4px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
}

.reservation-card h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.125rem;
  font-weight: 500;
}

.card-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px 18px;
  margin: 0;
}

.card-meta dt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.card-meta dd {
  margin: 2px 0 0;
  color: var(--text);
  font-size: 0.875rem;
}

.window-hint {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.window-hint.is-danger {
  background: var(--status-bad-tint);
  color: var(--status-bad-text, var(--text-secondary));
}

.reservation-card footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--border);
  padding-top: 14px;
}
</style>
