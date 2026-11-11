<script setup lang="ts">
import { ArrowLeft, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getSeatMap, getStudyRoom } from '../../api/study-room'
import { createReservation } from '../../api/reservation'
import type { CreateReservationResult } from '../../types/reservation'
import type { SeatMapSeat, StudyRoomDetail, TimeSlot } from '../../types/study-room'
import { RequestError } from '../../utils/request'
import { formatDateTime } from '../../utils/reservation'
import { formatTimeRange } from '../../utils/reservation'

const route = useRoute()
const router = useRouter()

const roomId = computed(() => String(route.query.roomId ?? ''))
const slotId = computed(() => String(route.query.slotId ?? ''))
const seatId = computed(() => String(route.query.seatId ?? ''))
const reserveDate = computed(() => String(route.query.date ?? ''))

const room = shallowRef<StudyRoomDetail | null>(null)
const slot = shallowRef<TimeSlot | null>(null)
const seat = shallowRef<SeatMapSeat | null>(null)
const loading = shallowRef(true)
const loadError = shallowRef('')
const submitError = shallowRef('')
const conflict = shallowRef(false)
const submitting = shallowRef(false)
const created = shallowRef<CreateReservationResult | null>(null)

// A fresh key per confirmation page; retries reuse it so a double submit cannot double book.
const idempotencyKey = crypto.randomUUID()

const ready = computed(() => Boolean(room.value && slot.value && seat.value && reserveDate.value))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    if (!roomId.value || !slotId.value || !seatId.value || !reserveDate.value) {
      loadError.value = '预约参数不完整，请重新选择座位'
      return
    }
    const detail = await getStudyRoom(roomId.value, reserveDate.value)
    const map = await getSeatMap(roomId.value, reserveDate.value, slotId.value)
    room.value = detail
    slot.value = detail.timeSlots.find((item) => item.id === slotId.value) ?? null
    seat.value = map.seats.find((item) => item.id === seatId.value) ?? null
    if (!slot.value || !seat.value) loadError.value = '所选时段或座位已失效，请重新选择'
  } catch (cause) {
    loadError.value = cause instanceof RequestError ? cause.message : '预约信息加载失败'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!ready.value || submitting.value) return
  submitting.value = true
  submitError.value = ''
  conflict.value = false
  try {
    created.value = await createReservation(
      {
        roomId: roomId.value,
        slotId: slotId.value,
        seatId: seatId.value,
        reserveDate: reserveDate.value,
      },
      idempotencyKey,
    )
    ElMessage.success(created.value.replayed ? '预约已存在，已为你打开详情' : '预约创建成功')
  } catch (cause) {
    if (cause instanceof RequestError) {
      submitError.value = cause.message
      conflict.value = cause.httpStatus === 409
    } else {
      submitError.value = '预约提交失败，请稍后重试'
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="confirm-page">
    <RouterLink class="back-link" to="/home">
      <el-icon><ArrowLeft /></el-icon>
      返回自习室列表
    </RouterLink>

    <el-alert v-if="loadError" type="error" :title="loadError" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="router.push('/home')">返回首页</el-button>
      </template>
    </el-alert>

    <div v-loading="loading" class="confirm-body">
      <template v-if="created">
        <el-result icon="success" title="预约创建成功" :sub-title="`预约编号 ${created.id}`">
          <template #extra>
            <div class="result-meta">
              <p>{{ created.roomName }} · {{ created.roomLocation }}</p>
              <p>
                {{ created.reserveDate }} {{ formatTimeRange(created.startAt, created.endAt) }} ·
                座位 {{ created.seatNo }}
              </p>
              <p>
                签到窗口：{{ formatDateTime(created.checkInWindow.openAt) }} 至
                {{ formatDateTime(created.checkInWindow.deadline) }}
              </p>
            </div>
            <div class="result-actions">
              <el-button type="primary" @click="router.push(`/reservations/${created.id}`)">
                查看预约详情
              </el-button>
              <el-button @click="router.push('/reservations')">我的预约</el-button>
            </div>
          </template>
        </el-result>
      </template>

      <template v-else>
        <header class="confirm-header">
          <div>
            <p class="page-eyebrow">学生服务 / 预约</p>
            <h1>确认预约信息</h1>
            <p class="header-note">提交后座位将为你保留，请在签到窗口内到场签到。</p>
          </div>
          <div v-if="room" class="header-room">
            <span>{{ room.name }}</span>
            <small>{{ room.location }}</small>
          </div>
        </header>

        <div v-if="room && slot && seat" class="summary-grid">
          <div class="summary-item">
            <span>预约日期</span>
            <strong>{{ reserveDate }}</strong>
          </div>
          <div class="summary-item">
            <span>开放时段</span>
            <strong>{{ slot.label }} · {{ slot.startTime }}–{{ slot.endTime }}</strong>
          </div>
          <div class="summary-item">
            <span>座位</span>
            <strong>{{ seat.seatNo }}</strong>
          </div>
          <div class="summary-item">
            <span>自习室</span>
            <strong>{{ room.name }}</strong>
          </div>
        </div>

        <el-alert
          v-if="submitError"
          type="error"
          :title="submitError"
          :closable="false"
          show-icon
        >
          <template v-if="conflict" #default>
            <el-button link type="primary" @click="load">刷新座位状态</el-button>
            <el-button link type="primary" @click="router.push(`/study-rooms/${roomId}`)">
              重新选择座位
            </el-button>
          </template>
        </el-alert>

        <section class="rules">
          <h2>预约规则</h2>
          <ul>
            <li>每位学生每日最多保留 2 条有效预约。</li>
            <li>签到窗口为预约开始前 30 分钟至开始后 15 分钟，超时未签到记为失约。</li>
            <li>预约开始前可以自行取消；开始后如需取消请联系管理员。</li>
            <li>同一时间不能重复预约，座位提交后以服务端校验结果为准。</li>
          </ul>
        </section>

        <footer class="confirm-actions">
          <el-button @click="router.back()">返回</el-button>
          <el-button type="primary" :loading="submitting" :disabled="!ready" @click="submit">
            <el-icon><CircleCheck /></el-icon>
            提交预约
          </el-button>
        </footer>
      </template>
    </div>
  </section>
</template>

<style scoped>
.confirm-page {
  display: grid;
  gap: 18px;
  padding-bottom: 20px;
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

.confirm-body {
  display: grid;
  gap: 18px;
  min-height: 320px;
}

.confirm-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--surface), var(--accent-soft));
}

.confirm-header h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.5rem, 2.6vw, 2.1rem);
}

.page-eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.header-note {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.header-room {
  display: grid;
  gap: 4px;
  text-align: right;
}

.header-room span {
  color: var(--text);
  font-weight: 600;
}

.header-room small {
  color: var(--text-muted);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.summary-item {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}

.summary-item span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.summary-item strong {
  color: var(--text);
  font-size: 0.92rem;
}

.rules {
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.rules h2 {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: var(--text);
}

.rules ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.result-meta {
  display: grid;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.result-meta p {
  margin: 0;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

@media (max-width: 720px) {
  .confirm-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-room {
    text-align: left;
  }
}
</style>
