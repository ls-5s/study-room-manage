<script setup lang="ts">
import { Edit, Plus, RefreshRight, Search, Tickets } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  createRoomTimeSlot,
  createStudyRoom,
  getAdminStudyRoom,
  getAdminStudyRooms,
  updateRoomTimeSlot,
  updateStudyRoom,
} from '../../api/admin-room'
import RoomEditorDialog from '../../components/study-room/RoomEditorDialog.vue'
import TimeSlotDialog from '../../components/study-room/TimeSlotDialog.vue'
import type {
  AdminRoomListQuery,
  AdminStudyRoomDetail,
  RoomInput,
  RoomUpdateInput,
  StudyRoomSummary,
  TimeSlot,
  TimeSlotInput,
  TimeSlotUpdateInput,
} from '../../types/study-room'
import { roomStatusLabels, roomStatusTagType, slotStatusLabels } from '../../utils/study-room'
import { RequestError } from '../../utils/request'

const router = useRouter()
const filters = reactive<AdminRoomListQuery>({
  keyword: '',
  status: '',
  page: 1,
  pageSize: 10,
})
const rooms = shallowRef<StudyRoomSummary[]>([])
const total = shallowRef(0)
const loading = shallowRef(false)
const error = shallowRef('')
const editorOpen = shallowRef(false)
const editingRoom = shallowRef<StudyRoomSummary | null>(null)
const roomPending = shallowRef(false)
const roomErrors = reactive<Record<string, string>>({})

const slotDrawerOpen = shallowRef(false)
const slotRoom = shallowRef<AdminStudyRoomDetail | null>(null)
const slotLoading = shallowRef(false)
const slotError = shallowRef('')
const slotDialogOpen = shallowRef(false)
const editingSlot = shallowRef<TimeSlot | null>(null)
const slotPending = shallowRef(false)
const slotErrors = reactive<Record<string, string>>({})

function clearErrors(target: Record<string, string>) {
  Object.keys(target).forEach((key) => delete target[key])
}

function asRoom(row: unknown): StudyRoomSummary {
  return row as StudyRoomSummary
}

function assignErrors(target: Record<string, string>, cause: unknown) {
  clearErrors(target)
  if (cause instanceof RequestError) Object.assign(target, cause.fields)
}

async function loadRooms() {
  loading.value = true
  error.value = ''
  try {
    const result = await getAdminStudyRooms(filters)
    rooms.value = result.items
    total.value = result.total
  } catch (cause) {
    rooms.value = []
    total.value = 0
    error.value = cause instanceof RequestError ? cause.message : '自习室列表加载失败'
  } finally {
    loading.value = false
  }
}

function search() {
  filters.page = 1
  void loadRooms()
}

function reset() {
  filters.keyword = ''
  filters.status = ''
  filters.page = 1
  void loadRooms()
}

function openCreate() {
  editingRoom.value = null
  clearErrors(roomErrors)
  editorOpen.value = true
}

function openEdit(room: StudyRoomSummary) {
  editingRoom.value = room
  clearErrors(roomErrors)
  editorOpen.value = true
}

async function saveRoom(input: RoomInput | RoomUpdateInput) {
  roomPending.value = true
  clearErrors(roomErrors)
  try {
    if (editingRoom.value) {
      const result = await updateStudyRoom(editingRoom.value.id, input as RoomUpdateInput)
      ElMessage.success(result.autoClosed ? '已保存，房间因资源变化自动关闭' : '自习室已更新')
    } else {
      await createStudyRoom(input as RoomInput)
      ElMessage.success('自习室已创建，默认关闭')
    }
    editorOpen.value = false
    await loadRooms()
  } catch (cause) {
    assignErrors(roomErrors, cause)
    ElMessage.error(cause instanceof RequestError ? cause.message : '保存失败')
  } finally {
    roomPending.value = false
  }
}

async function loadSlotRoom(roomId: string) {
  slotLoading.value = true
  slotError.value = ''
  try {
    slotRoom.value = await getAdminStudyRoom(roomId)
  } catch (cause) {
    slotError.value = cause instanceof RequestError ? cause.message : '开放时段加载失败'
  } finally {
    slotLoading.value = false
  }
}

function openSlots(room: StudyRoomSummary) {
  slotRoom.value = null
  slotDrawerOpen.value = true
  void loadSlotRoom(room.id)
}

function openCreateSlot() {
  editingSlot.value = null
  clearErrors(slotErrors)
  slotDialogOpen.value = true
}

function openEditSlot(slot: TimeSlot) {
  editingSlot.value = slot
  clearErrors(slotErrors)
  slotDialogOpen.value = true
}

async function saveSlot(input: TimeSlotInput | TimeSlotUpdateInput) {
  if (!slotRoom.value) return
  slotPending.value = true
  clearErrors(slotErrors)
  try {
    const result = editingSlot.value
      ? await updateRoomTimeSlot(editingSlot.value.id, input as TimeSlotUpdateInput)
      : await createRoomTimeSlot(slotRoom.value.id, input as TimeSlotInput)
    slotRoom.value = result.room
    ElMessage.success(editingSlot.value ? '开放时段已更新' : '开放时段已新增，次日生效')
    slotDialogOpen.value = false
    await loadRooms()
  } catch (cause) {
    assignErrors(slotErrors, cause)
    ElMessage.error(cause instanceof RequestError ? cause.message : '时段保存失败')
  } finally {
    slotPending.value = false
  }
}

function manageSeats(room: StudyRoomSummary) {
  void router.push(`/admin/study-rooms/${room.id}/seats`)
}

onMounted(() => {
  void loadRooms()
})
</script>

<template>
  <section class="rooms-admin-page page-shell" aria-labelledby="rooms-admin-title">
    <header class="page-header page-hero">
      <div class="page-hero-copy">
        <p class="page-eyebrow">管理后台 / 资源维护</p>
        <h1 id="rooms-admin-title">自习室管理</h1>
        <p class="page-summary">配置自习室基础信息、开放时段与座位布局，状态变更会记录审计。</p>
      </div>
      <div class="page-actions">
        <el-tag effect="plain" round>{{ total }} 个房间</el-tag>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增自习室</el-button>
      </div>
    </header>

    <el-form class="filter-bar toolbar-panel" :model="filters" @submit.prevent="search">
      <el-form-item label="名称或位置">
        <el-input v-model="filters.keyword" clearable :prefix-icon="Search" />
      </el-form-item>
      <el-form-item label="状态">
        <select v-model="filters.status" class="native-filter-select" aria-label="房间状态筛选">
          <option value="">全部状态</option>
          <option value="open">开放</option>
          <option value="closed">关闭</option>
          <option value="disabled">停用</option>
        </select>
      </el-form-item>
      <div class="filter-actions">
        <el-button native-type="submit" type="primary" :icon="Search">查询</el-button>
        <el-button :icon="RefreshRight" @click="reset">重置</el-button>
      </div>
    </el-form>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="loadRooms">重新加载</el-button>
      </template>
    </el-alert>

    <div class="table-panel">
      <div v-loading="loading" class="results">
        <el-table :data="rooms" row-key="id" class="desktop-table">
          <el-table-column label="自习室" min-width="210">
            <template #default="{ row }">
              <div class="identity-cell">
                <strong>{{ row.name }}</strong>
                <span>{{ row.location }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="roomStatusTagType(asRoom(row).status)" effect="plain">
                {{ roomStatusLabels[asRoom(row).status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="容量" min-width="150">
            <template #default="{ row }">
              <span>{{ row.bookableSeatCount }} / {{ row.seatCount }} 静态可用</span>
            </template>
          </el-table-column>
          <el-table-column label="网格" width="100">
            <template #default="{ row }">{{ row.grid.rows }} × {{ row.grid.columns }}</template>
          </el-table-column>
          <el-table-column label="生效日期" width="120" prop="bookableFrom" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button link type="primary" :icon="Edit" @click="openEdit(asRoom(row))"
                  >编辑</el-button
                >
                <el-button link type="primary" :icon="Tickets" @click="openSlots(asRoom(row))"
                  >开放时段</el-button
                >
                <el-button link type="primary" @click="manageSeats(asRoom(row))"
                  >座位管理</el-button
                >
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty :image-size="80" :description="loading ? '正在加载' : '暂无自习室'" />
          </template>
        </el-table>

        <div class="mobile-rooms">
          <article v-for="room in rooms" :key="room.id" class="mobile-room-card">
            <div class="mobile-card-heading">
              <div class="identity-cell">
                <strong>{{ room.name }}</strong>
                <span>{{ room.location }}</span>
              </div>
              <el-tag :type="roomStatusTagType(room.status)" size="small" effect="plain">
                {{ roomStatusLabels[room.status] }}
              </el-tag>
            </div>
            <dl>
              <div>
                <dt>静态可用</dt>
                <dd>{{ room.bookableSeatCount }} / {{ room.seatCount }}</dd>
              </div>
              <div>
                <dt>网格</dt>
                <dd>{{ room.grid.rows }} × {{ room.grid.columns }}</dd>
              </div>
              <div>
                <dt>生效日期</dt>
                <dd>{{ room.bookableFrom }}</dd>
              </div>
            </dl>
            <div class="mobile-actions">
              <el-button size="small" @click="openEdit(room)">编辑</el-button>
              <el-button size="small" @click="openSlots(room)">开放时段</el-button>
              <el-button size="small" type="primary" plain @click="manageSeats(room)"
                >座位管理</el-button
              >
            </div>
          </article>
          <el-empty
            v-if="!loading && rooms.length === 0"
            :image-size="80"
            description="暂无自习室"
          />
        </div>
      </div>
      <div v-if="total > filters.pageSize" class="pagination-row">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadRooms"
          @size-change="search"
        />
      </div>
    </div>

    <RoomEditorDialog
      v-model="editorOpen"
      :room="editingRoom"
      :pending="roomPending"
      :errors="roomErrors"
      @submit="saveRoom"
    />

    <el-drawer
      v-model="slotDrawerOpen"
      :title="slotRoom ? `${slotRoom.name} · 开放时段` : '开放时段'"
      size="min(96vw, 640px)"
    >
      <el-alert v-if="slotError" type="error" :title="slotError" :closable="false" show-icon />
      <div v-loading="slotLoading" class="slot-drawer-content">
        <template v-if="slotRoom">
          <div class="drawer-toolbar">
            <p>新增或重新启用的时段从下一个上海业务日生效。</p>
            <el-button type="primary" :icon="Plus" @click="openCreateSlot">新增时段</el-button>
          </div>
          <div v-if="slotRoom.timeSlots.length" class="slot-list">
            <article v-for="slot in slotRoom.timeSlots" :key="slot.id" class="slot-row">
              <div>
                <strong>{{ slot.label }}</strong>
                <span>{{ slot.startTime }}–{{ slot.endTime }}</span>
              </div>
              <div class="slot-row-meta">
                <el-tag
                  size="small"
                  :type="slot.status === 'active' ? 'success' : 'info'"
                  effect="plain"
                >
                  {{ slotStatusLabels[slot.status] }}
                </el-tag>
                <small>生效 {{ slot.bookableFrom }}</small>
                <el-button link type="primary" @click="openEditSlot(slot)">编辑</el-button>
              </div>
            </article>
          </div>
          <el-empty v-else :image-size="72" description="尚未配置开放时段" />
        </template>
      </div>
    </el-drawer>

    <TimeSlotDialog
      v-model="slotDialogOpen"
      :time-slot="editingSlot"
      :pending="slotPending"
      :errors="slotErrors"
      @submit="saveSlot"
    />
  </section>
</template>

<style scoped>
.rooms-admin-page {
  display: grid;
  gap: 24px;
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

.page-actions,
.filter-actions,
.row-actions,
.mobile-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 180px auto;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface) 72%, transparent);
}

.filter-bar :deep(.el-form-item) {
  margin-bottom: 0;
}

.native-filter-select {
  width: 100%;
  height: 38px;
  padding: 0 34px 0 11px;
  border: 1px solid var(--control-border);
  border-radius: var(--el-border-radius-base);
  color: var(--text);
  background: var(--surface-raised);
}

.table-panel {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.results {
  min-height: 220px;
}

.identity-cell {
  display: grid;
  gap: 4px;
}

.identity-cell strong {
  color: var(--text);
}

.identity-cell span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.mobile-rooms {
  display: none;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid var(--border);
}

.slot-drawer-content {
  min-height: 220px;
}

.drawer-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.drawer-toolbar p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.6;
}

.slot-list {
  display: grid;
  gap: 10px;
}

.slot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.slot-row > div:first-child,
.slot-row-meta {
  display: grid;
  gap: 5px;
}

.slot-row strong {
  color: var(--text);
}

.slot-row span,
.slot-row small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.slot-row-meta {
  justify-items: end;
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }

  .desktop-table {
    display: none;
  }

  .mobile-rooms {
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  .mobile-room-card {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 9px;
  }

  .mobile-card-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .mobile-room-card dl {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 12px;
    border-radius: 7px;
    background: var(--surface-muted);
  }

  .mobile-room-card dl div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .mobile-room-card dt {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .mobile-room-card dd {
    margin: 0;
    color: var(--text);
    font-size: 0.8rem;
  }

  .mobile-actions {
    flex-wrap: wrap;
  }

  .drawer-toolbar,
  .slot-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .slot-row-meta {
    justify-items: start;
  }
}
</style>
