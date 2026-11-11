<script setup lang="ts">
import { ArrowLeft, Plus, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { createSeatBatch, getAdminStudyRoom, updateSeat } from '../../api/admin-room'
import SeatBatchDialog from '../../components/study-room/SeatBatchDialog.vue'
import SeatEditorDialog from '../../components/study-room/SeatEditorDialog.vue'
import SeatMap from '../../components/study-room/SeatMap.vue'
import type {
  AdminStudyRoomDetail,
  Seat,
  SeatBatchInput,
  SeatMapSeat,
  SeatUpdateInput,
} from '../../types/study-room'
import { roomStatusLabels, roomStatusTagType } from '../../utils/study-room'
import { RequestError } from '../../utils/request'

const route = useRoute()
const roomId = computed(() => String(route.params.id))
const room = shallowRef<AdminStudyRoomDetail | null>(null)
const loading = shallowRef(false)
const error = shallowRef('')
const selectedSeat = shallowRef<Seat | null>(null)
const batchOpen = shallowRef(false)
const batchPending = shallowRef(false)
const batchErrors = reactive<Record<string, string>>({})
const editorOpen = shallowRef(false)
const editPending = shallowRef(false)
const editErrors = reactive<Record<string, string>>({})

const seatMapSeats = computed<SeatMapSeat[]>(() =>
  (room.value?.seats ?? []).map((seat) => ({
    id: seat.id,
    seatNo: seat.seatNo,
    row: seat.row,
    column: seat.column,
    status: seat.status,
    disabledReason: seat.remark,
  })),
)

const statusSummary = computed(() => {
  const seats = room.value?.seats ?? []
  return {
    available: seats.filter((seat) => seat.status === 'available').length,
    maintenance: seats.filter((seat) => seat.status === 'maintenance').length,
    disabled: seats.filter((seat) => seat.status === 'disabled').length,
  }
})

function clearErrors(target: Record<string, string>) {
  Object.keys(target).forEach((key) => delete target[key])
}

function assignErrors(target: Record<string, string>, cause: unknown) {
  clearErrors(target)
  if (cause instanceof RequestError) Object.assign(target, cause.fields)
}

async function loadRoom() {
  loading.value = true
  error.value = ''
  try {
    room.value = await getAdminStudyRoom(roomId.value)
    if (selectedSeat.value) {
      selectedSeat.value =
        room.value.seats.find((seat) => seat.id === selectedSeat.value?.id) ?? null
    }
  } catch (cause) {
    room.value = null
    error.value = cause instanceof RequestError ? cause.message : '座位数据加载失败'
  } finally {
    loading.value = false
  }
}

function editSeat(seat: SeatMapSeat) {
  selectedSeat.value = room.value?.seats.find((item) => item.id === seat.id) ?? null
  clearErrors(editErrors)
  editorOpen.value = true
}

async function saveSeat(input: SeatUpdateInput) {
  if (!selectedSeat.value) return
  editPending.value = true
  clearErrors(editErrors)
  try {
    const result = await updateSeat(selectedSeat.value.id, input)
    room.value = result.room
    ElMessage.success(result.autoClosed ? '座位已更新，房间已自动关闭' : '座位已更新')
    editorOpen.value = false
  } catch (cause) {
    assignErrors(editErrors, cause)
    ElMessage.error(cause instanceof RequestError ? cause.message : '座位更新失败')
  } finally {
    editPending.value = false
  }
}

async function saveBatch(input: SeatBatchInput) {
  batchPending.value = true
  clearErrors(batchErrors)
  try {
    const result = await createSeatBatch(roomId.value, input)
    room.value = result.room
    ElMessage.success(`已生成 ${result.count} 个座位，次日起可预约`)
    batchOpen.value = false
  } catch (cause) {
    assignErrors(batchErrors, cause)
    ElMessage.error(cause instanceof RequestError ? cause.message : '座位生成失败')
  } finally {
    batchPending.value = false
  }
}

onMounted(() => {
  void loadRoom()
})
</script>

<template>
  <section class="seat-admin-page page-shell" aria-labelledby="seat-admin-title">
    <RouterLink class="back-link" to="/admin/study-rooms">
      <el-icon><ArrowLeft /></el-icon>
      返回自习室管理
    </RouterLink>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="loadRoom">重新加载</el-button>
      </template>
    </el-alert>

    <div v-loading="loading" class="seat-admin-content">
      <template v-if="room">
        <header class="page-header page-hero">
          <div class="page-hero-copy">
            <p class="page-eyebrow">管理后台 / 座位布局</p>
            <h1 id="seat-admin-title">{{ room.name }}</h1>
            <p class="page-summary">
              {{ room.location }} · {{ room.grid.rows }} 行 × {{ room.grid.columns }} 列
              <el-tag
                :type="roomStatusTagType(room.status)"
                size="small"
                effect="plain"
                class="status-tag"
              >
                {{ roomStatusLabels[room.status] }}
              </el-tag>
            </p>
          </div>
          <div class="page-actions">
            <el-button :icon="RefreshRight" :loading="loading" @click="loadRoom">刷新</el-button>
            <el-button type="primary" :icon="Plus" @click="batchOpen = true">批量生成</el-button>
          </div>
        </header>

        <section class="summary-strip" aria-label="座位状态概览">
          <div>
            <span>座位总数</span><strong>{{ room.seatCount }}</strong
            ><small>已布局座位</small>
          </div>
          <div>
            <span>可用</span><strong>{{ statusSummary.available }}</strong
            ><small>静态可用</small>
          </div>
          <div>
            <span>维修</span><strong>{{ statusSummary.maintenance }}</strong
            ><small>暂不可预约</small>
          </div>
          <div>
            <span>停用</span><strong>{{ statusSummary.disabled }}</strong
            ><small>长期停用</small>
          </div>
        </section>

        <section class="seat-panel" aria-labelledby="layout-title">
          <div class="section-heading">
            <div>
              <h2 id="layout-title">座位平面图</h2>
              <p>点击座位可编辑编号、坐标、状态和备注；空白网格表示过道。</p>
            </div>
            <div class="legend">
              <span><i class="available" />可用</span>
              <span><i class="maintenance" />维修</span>
              <span><i class="disabled" />停用</span>
            </div>
          </div>
          <SeatMap
            v-if="room.seats.length"
            :grid="room.grid"
            :seats="seatMapSeats"
            :selected-id="selectedSeat?.id ?? ''"
            allow-unavailable
            @select="editSeat"
          />
          <el-empty v-else :image-size="90" description="尚未生成座位，请先使用批量生成配置布局">
            <el-button type="primary" @click="batchOpen = true">批量生成座位</el-button>
          </el-empty>
        </section>

        <section v-if="room.timeSlots.length" class="slot-summary">
          <div>
            <span>当前开放时段</span>
            <strong>{{ room.timeSlots.length }} 个</strong>
          </div>
          <p>
            {{ room.timeSlots.map((slot) => `${slot.startTime}–${slot.endTime}`).join('、') }}
          </p>
        </section>
      </template>
    </div>

    <SeatBatchDialog
      v-model="batchOpen"
      :grid="room?.grid ?? { rows: 1, columns: 1 }"
      :pending="batchPending"
      :errors="batchErrors"
      @submit="saveBatch"
    />
    <SeatEditorDialog
      v-model="editorOpen"
      :seat="selectedSeat"
      :pending="editPending"
      :errors="editErrors"
      @submit="saveSeat"
    />
  </section>
</template>

<style scoped>
.seat-admin-page {
  display: grid;
  gap: 24px;
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

.seat-admin-content {
  display: grid;
  gap: 20px;
  min-height: 500px;
}

.page-header {
  min-height: 190px;
}

.page-eyebrow {
  margin: 0 0 7px;
  color: var(--accent);
  font-size: 0.75rem;
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

.page-summary {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
}

.status-tag {
  margin-left: 8px;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-strip > div {
  display: grid;
  gap: 5px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.summary-strip span,
.summary-strip small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.summary-strip strong {
  color: var(--text);
  font-size: 2rem;
  font-weight: 500;
}

.seat-panel {
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
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend i {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend .available {
  background: var(--status-ok-tint);
  border: 1px solid var(--status-ok-border);
}

.legend .maintenance {
  background: var(--status-info-tint);
  border: 1px solid var(--status-info-border);
}

.legend .disabled {
  background: var(--status-bad-tint);
  border: 1px solid var(--status-bad-border);
}

.slot-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.slot-summary div {
  display: grid;
  gap: 4px;
}

.slot-summary span,
.slot-summary p {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.slot-summary strong {
  color: var(--text);
}

.slot-summary p {
  margin: 0;
  text-align: right;
}

@media (max-width: 720px) {
  .page-header,
  .section-heading,
  .slot-summary {
    align-items: stretch;
    flex-direction: column;
  }

  .page-actions {
    width: 100%;
  }

  .page-actions .el-button {
    flex: 1;
  }

  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .seat-panel {
    padding: 16px 12px;
  }

  .slot-summary p {
    text-align: left;
  }
}
</style>
