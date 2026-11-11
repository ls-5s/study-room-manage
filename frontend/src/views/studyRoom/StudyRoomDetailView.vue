<script setup lang="ts">
import { ArrowLeft, Calendar, Location, RefreshRight } from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getSeatMap, getStudyRoom } from '../../api/study-room'
import { getPublicSystemConfig } from '../../api/system'
import SeatMap from '../../components/study-room/SeatMap.vue'
import TimeSlotPicker from '../../components/study-room/TimeSlotPicker.vue'
import type { SeatMapResult, SeatMapSeat, StudyRoomDetail, TimeSlot } from '../../types/study-room'
import { RequestError } from '../../utils/request'
import {
  addDays,
  businessToday,
  isSlotStarted,
  seatStatusLabels,
  seatStatusTagType,
} from '../../utils/study-room'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => String(route.params.id))
const today = businessToday()
const bookingWindowDays = shallowRef(7)
const lastDate = computed(() => addDays(today, bookingWindowDays.value - 1))
const now = shallowRef(new Date())
let clock: ReturnType<typeof setInterval> | undefined
const date = shallowRef(today)
const room = shallowRef<StudyRoomDetail | null>(null)
const selectedSlot = shallowRef<TimeSlot | null>(null)
const seatMap = shallowRef<SeatMapResult | null>(null)
const selectedSeat = shallowRef<SeatMapSeat | null>(null)
const loadingRoom = shallowRef(false)
const loadingSeats = shallowRef(false)
const roomError = shallowRef('')
const seatError = shallowRef('')
let roomSequence = 0
let seatSequence = 0

const disabledSlotIds = computed(
  () =>
    new Set(
      room.value?.timeSlots
        .filter((slot) => isSlotStarted(date.value, slot.startTime, now.value))
        .map((slot) => slot.id),
    ),
)

const legend = computed(() =>
  (['available', 'reserved', 'maintenance', 'disabled'] as const).map((status) => ({
    status,
    label: seatStatusLabels[status],
    tagType: seatStatusTagType(status),
  })),
)

async function loadSeats() {
  const slot = selectedSlot.value
  if (!slot) {
    seatMap.value = null
    selectedSeat.value = null
    return
  }
  const sequence = ++seatSequence
  loadingSeats.value = true
  seatError.value = ''
  selectedSeat.value = null
  try {
    const result = await getSeatMap(roomId.value, date.value, slot.id)
    if (sequence === seatSequence) seatMap.value = result
  } catch (cause) {
    if (sequence !== seatSequence) return
    seatMap.value = null
    seatError.value = cause instanceof RequestError ? cause.message : '座位图加载失败'
  } finally {
    if (sequence === seatSequence) loadingSeats.value = false
  }
}

async function loadRoom() {
  const sequence = ++roomSequence
  if (date.value < today || date.value > lastDate.value) {
    roomError.value = `日期必须在 ${today} 至 ${lastDate.value} 之间`
    return
  }
  loadingRoom.value = true
  roomError.value = ''
  room.value = null
  seatMap.value = null
  selectedSlot.value = null
  selectedSeat.value = null
  try {
    const result = await getStudyRoom(roomId.value, date.value)
    if (sequence !== roomSequence) return
    room.value = result
    now.value = new Date()
    const firstAvailable = result.timeSlots.find(
      (slot) => !isSlotStarted(date.value, slot.startTime, now.value),
    )
    if (firstAvailable) {
      selectedSlot.value = firstAvailable
      await loadSeats()
    }
  } catch (cause) {
    if (sequence !== roomSequence) return
    roomError.value = cause instanceof RequestError ? cause.message : '自习室详情加载失败'
  } finally {
    if (sequence === roomSequence) loadingRoom.value = false
  }
}

function selectSlot(slot: TimeSlot) {
  selectedSlot.value = slot
  void loadSeats()
}

function selectSeat(seat: SeatMapSeat) {
  selectedSeat.value = seat
}

function goToReservation() {
  if (!selectedSlot.value || !selectedSeat.value || !room.value) return
  now.value = new Date()
  if (disabledSlotIds.value.has(selectedSlot.value.id)) return
  void router.push({
    path: '/reservations/confirm',
    query: {
      roomId: room.value.id,
      slotId: selectedSlot.value.id,
      seatId: selectedSeat.value.id,
      date: date.value,
    },
  })
}

watch(date, () => {
  void loadRoom()
})

onMounted(async () => {
  clock = setInterval(() => {
    now.value = new Date()
  }, 15_000)
  try {
    const config = await getPublicSystemConfig()
    bookingWindowDays.value = config.bookingWindowDays
  } catch {
    bookingWindowDays.value = 7
  }
  await loadRoom()
})

onBeforeUnmount(() => {
  if (clock) clearInterval(clock)
})
</script>

<template>
  <section class="detail-page page-shell" aria-labelledby="room-title">
    <RouterLink class="back-link" to="/home">
      <el-icon><ArrowLeft /></el-icon>
      返回自习室列表
    </RouterLink>

    <el-alert v-if="roomError" type="error" :title="roomError" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="loadRoom">重新加载</el-button>
      </template>
    </el-alert>

    <div v-loading="loadingRoom" class="detail-loading">
      <template v-if="room">
        <header class="room-header page-hero">
          <div class="page-hero-copy">
            <p class="page-eyebrow">自习室详情</p>
            <h1 id="room-title">{{ room.name }}</h1>
            <p class="room-meta">
              <span
                ><el-icon><Location /></el-icon>{{ room.location }}</span
              >
              <span
                ><el-icon><Calendar /></el-icon>{{ date }}</span
              >
              <span>{{ room.grid.rows }} 行 × {{ room.grid.columns }} 列</span>
            </p>
          </div>
          <div class="hero-count">
            <span>静态可预约</span>
            <strong>{{ room.bookableSeatCount }}</strong>
            <small>/ {{ room.seatCount }} 座</small>
          </div>
        </header>

        <p class="room-description">{{ room.description || '暂无使用说明' }}</p>

        <section class="control-section" aria-labelledby="date-title">
          <div class="section-heading">
            <div>
              <h2 id="date-title">选择日期与时段</h2>
              <p>日期变化后会重新读取当天有效时段。</p>
            </div>
            <el-date-picker
              v-model="date"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              :clearable="false"
            />
          </div>
          <TimeSlotPicker
            v-if="room.timeSlots.length"
            :slots="room.timeSlots"
            :selected-id="selectedSlot?.id ?? ''"
            :disabled-ids="disabledSlotIds"
            @select="selectSlot"
          />
          <el-empty v-else :image-size="72" description="该日期暂无有效开放时段" />
        </section>

        <section class="seat-section" aria-labelledby="seat-title">
          <div class="section-heading">
            <div>
              <h2 id="seat-title">座位平面图</h2>
              <p v-if="selectedSlot">
                {{ selectedSlot.label }} · {{ selectedSlot.startTime }}–{{ selectedSlot.endTime }}
              </p>
              <p v-else>先选择开放时段</p>
            </div>
            <el-button
              v-if="selectedSlot"
              :icon="RefreshRight"
              :loading="loadingSeats"
              @click="loadSeats"
            >
              刷新座位
            </el-button>
          </div>

          <div class="legend" aria-label="座位状态图例">
            <span v-for="item in legend" :key="item.status">
              <i :class="`legend-${item.status}`" aria-hidden="true" />
              {{ item.label }}
            </span>
          </div>

          <el-alert v-if="seatError" type="error" :title="seatError" :closable="false" show-icon />
          <div v-loading="loadingSeats" class="seat-content">
            <SeatMap
              v-if="seatMap"
              :grid="room.grid"
              :seats="seatMap.seats"
              :selected-id="selectedSeat?.id ?? ''"
              @select="selectSeat"
            />
            <el-empty
              v-else-if="selectedSlot && !loadingSeats && !seatError"
              :image-size="80"
              description="当前时段暂无座位数据"
            />
          </div>
        </section>

        <aside class="selection-bar">
          <div v-if="selectedSeat && selectedSlot">
            <span>已选择</span>
            <strong>{{ selectedSeat.seatNo }}</strong>
            <el-tag :type="seatStatusTagType(selectedSeat.status)" effect="plain">
              {{ seatStatusLabels[selectedSeat.status] }}
            </el-tag>
            <small
              >{{ room.name }} · {{ date }} {{ selectedSlot.startTime }}–{{
                selectedSlot.endTime
              }}</small
            >
          </div>
          <div v-else class="selection-empty">
            <span>尚未选择座位</span>
            <small>选择空闲座位后可前往预约确认。</small>
          </div>
          <el-button
            type="primary"
            :disabled="!selectedSeat || !selectedSlot || disabledSlotIds.has(selectedSlot.id)"
            @click="goToReservation"
          >
            前往预约
          </el-button>
        </aside>
      </template>
    </div>
  </section>
</template>

<style scoped>
.detail-page {
  display: grid;
  gap: 24px;
  min-height: 70svh;
  padding-bottom: 86px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  color: var(--text-muted);
  font-size: 0.875rem;
  text-decoration: none;
}

.back-link:hover {
  color: var(--accent);
}

.detail-loading {
  display: grid;
  gap: 20px;
  min-height: 500px;
}

.room-header {
  min-height: 220px;
}

.page-eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.room-header h1 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: clamp(2.25rem, 4vw, 3.5rem);
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.room-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin: 14px 0 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.room-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.hero-count {
  display: flex;
  align-items: baseline;
  gap: 5px;
  white-space: nowrap;
}

.hero-count span {
  margin-right: 5px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.hero-count strong {
  color: var(--text);
  font-size: 3rem;
  font-weight: 500;
}

.hero-count small {
  color: var(--text-muted);
}

.room-description {
  margin: -4px 2px 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
}

.control-section,
.seat-section {
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.section-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.125rem;
  font-weight: 500;
}

.section-heading p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--surface-muted) 66%, transparent);
  color: var(--text-muted);
  font-size: 0.75rem;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend i {
  width: 13px;
  height: 13px;
  border: 1px solid transparent;
  border-radius: 3px;
}

.legend-available {
  border-color: var(--status-ok-border) !important;
  background: var(--status-ok-tint);
}

.legend-reserved {
  border-color: var(--status-warn-border) !important;
  background: var(--status-warn-tint);
}

.legend-maintenance {
  border-color: var(--status-info-border) !important;
  background: var(--status-info-tint);
}

.legend-disabled {
  border-color: var(--status-bad-border) !important;
  background: var(--status-bad-tint);
}

.seat-content {
  min-height: 180px;
}

.selection-bar {
  position: fixed;
  z-index: 9;
  right: clamp(20px, 2.5vw, 40px);
  bottom: 18px;
  left: calc(248px + clamp(20px, 2.4vw, 40px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 18px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--topbar-surface);
  box-shadow: var(--shadow-raised);
  backdrop-filter: blur(22px) saturate(118%);
}

.selection-bar > div:first-child {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
}

.selection-bar span,
.selection-bar small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.selection-bar strong {
  color: var(--text);
}

.selection-empty {
  display: grid;
  gap: 3px;
}

@media (max-width: 900px) {
  .selection-bar {
    right: 24px;
    left: 24px;
  }
}

@media (max-width: 650px) {
  .room-header,
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-count {
    width: 100%;
  }

  .control-section,
  .seat-section {
    padding: 18px 14px;
  }

  .selection-bar {
    right: 12px;
    bottom: 10px;
    left: 12px;
    align-items: stretch;
    flex-direction: column;
  }

  .selection-bar .el-button {
    width: 100%;
  }
}
</style>
