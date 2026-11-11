<script setup lang="ts">
import {
  CircleCheck,
  Document,
  Location,
  RefreshRight,
  Search,
  Service,
  Warning,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, shallowRef, watch } from 'vue'
import { createFeedback, getMyFeedback, listMyFeedback } from '../../api/feedback'
import { getSeatMap, getStudyRoom, getStudyRooms } from '../../api/study-room'
import type {
  CreateFeedbackResult,
  FeedbackStatus,
  FeedbackSummary,
  FeedbackType,
  StudentFeedbackDetail,
} from '../../types/feedback'
import type { SeatMapSeat, StudyRoomDetail, StudyRoomSummary } from '../../types/study-room'
import { RequestError } from '../../utils/request'
import { formatDateTime } from '../../utils/reservation'
import { businessToday } from '../../utils/study-room'
import {
  feedbackLocationLabel,
  feedbackStatusLabels,
  feedbackStatusOptions,
  feedbackStatusTagType,
  feedbackTypeHint,
  feedbackTypeLabels,
  feedbackTypeOptions,
} from '../../utils/feedback'

const activeTab = shallowRef<'submit' | 'mine'>('submit')
const today = businessToday()

const rooms = shallowRef<StudyRoomSummary[]>([])
const roomsLoading = shallowRef(false)
const roomDetail = shallowRef<StudyRoomDetail | null>(null)
const seats = shallowRef<SeatMapSeat[]>([])
const seatsLoading = shallowRef(false)
const seatLoadError = shallowRef('')
const submitting = shallowRef(false)
const submitError = shallowRef('')
const submitted = shallowRef<CreateFeedbackResult | null>(null)

const form = reactive({
  type: 'occupied_seat' as FeedbackType,
  roomId: '',
  seatId: '',
  description: '',
})
const formErrors = reactive<Record<'type' | 'roomId' | 'seatId' | 'description', string>>({
  type: '',
  roomId: '',
  seatId: '',
  description: '',
})

const mineFilters = reactive({
  status: '' as FeedbackStatus | '',
  type: '' as FeedbackType | '',
  page: 1,
  pageSize: 10,
})
const mineItems = shallowRef<FeedbackSummary[]>([])
const mineTotal = shallowRef(0)
const mineLoading = shallowRef(false)
const mineError = shallowRef('')
const detailOpen = shallowRef(false)
const detailLoading = shallowRef(false)
const detailError = shallowRef('')
const selectedTicket = shallowRef<StudentFeedbackDetail | null>(null)
let mineController: AbortController | null = null
let mineSequence = 0
let detailSequence = 0

const descriptionLength = computed(() => form.description.trim().length)
const roomRequired = computed(() => form.type === 'occupied_seat')
const seatRequired = computed(() => form.type === 'occupied_seat')
const selectedRoom = computed(() => rooms.value.find((room) => room.id === form.roomId) ?? null)
const selectedSeat = computed(() => seats.value.find((seat) => seat.id === form.seatId) ?? null)

const seatStatusLabels: Readonly<Record<SeatMapSeat['status'], string>> = {
  available: '空闲',
  maintenance: '维修',
  disabled: '停用',
  reserved: '已预约',
}

function typeLabel(row: unknown): string {
  return feedbackTypeLabels[(row as FeedbackSummary).type]
}

function statusLabel(row: unknown): string {
  return feedbackStatusLabels[(row as FeedbackSummary).status]
}

function statusTag(row: unknown): 'warning' | 'primary' | 'success' | 'danger' {
  return feedbackStatusTagType((row as FeedbackSummary).status)
}

function locationLabel(row: unknown): string {
  return feedbackLocationLabel(row as FeedbackSummary)
}

function openDetailRow(row: unknown) {
  void openDetail(row as FeedbackSummary)
}

async function loadRooms() {
  roomsLoading.value = true
  try {
    const result = await getStudyRooms({ page: 1, pageSize: 100 })
    rooms.value = result.items
  } catch (cause) {
    submitError.value = cause instanceof RequestError ? cause.message : '自习室列表加载失败'
  } finally {
    roomsLoading.value = false
  }
}

watch(
  () => form.roomId,
  async (roomId, _previous, onCleanup) => {
    form.seatId = ''
    roomDetail.value = null
    seats.value = []
    seatLoadError.value = ''
    if (!roomId) return

    let current = true
    onCleanup(() => {
      current = false
    })
    seatsLoading.value = true
    try {
      const room = await getStudyRoom(roomId, today)
      if (!current) return
      roomDetail.value = room
      const slot = room.timeSlots.find((item) => item.status === 'active')
      if (!slot) {
        seatLoadError.value = '该自习室当前没有可用的开放时段，暂时无法选择座位。'
        return
      }
      const seatMap = await getSeatMap(roomId, today, slot.id)
      if (current) seats.value = seatMap.seats
    } catch (cause) {
      if (current) {
        seatLoadError.value = cause instanceof RequestError ? cause.message : '座位列表加载失败'
      }
    } finally {
      if (current) seatsLoading.value = false
    }
  },
)

function clearFormErrors() {
  formErrors.type = ''
  formErrors.roomId = ''
  formErrors.seatId = ''
  formErrors.description = ''
  submitError.value = ''
}

function validateForm(): boolean {
  clearFormErrors()
  if (descriptionLength.value < 5 || descriptionLength.value > 1000) {
    formErrors.description = '问题描述需为 5-1000 个字符'
  }
  if (form.type === 'occupied_seat' && !form.roomId) {
    formErrors.roomId = '占座举报必须选择自习室'
  }
  if (form.type === 'occupied_seat' && !form.seatId) {
    formErrors.seatId = '占座举报必须选择座位'
  }
  if (form.seatId && !form.roomId) {
    formErrors.roomId = '选择座位时必须同时选择自习室'
  }
  return !Object.values(formErrors).some(Boolean)
}

async function submitFeedback() {
  if (submitting.value || !validateForm()) return
  submitting.value = true
  submitError.value = ''
  try {
    const result = await createFeedback({
      type: form.type,
      description: form.description.trim(),
      ...(form.roomId ? { roomId: form.roomId } : {}),
      ...(form.seatId ? { seatId: form.seatId } : {}),
    })
    submitted.value = result
    await loadMine()
    ElMessage.success('反馈已提交，管理员会尽快核实处理')
  } catch (cause) {
    if (cause instanceof RequestError) {
      submitError.value = cause.message
      formErrors.type = cause.fields.type ?? ''
      formErrors.roomId = cause.fields.roomId ?? ''
      formErrors.seatId = cause.fields.seatId ?? ''
      formErrors.description = cause.fields.description ?? ''
    } else {
      submitError.value = '反馈提交失败，请稍后重试'
    }
  } finally {
    submitting.value = false
  }
}

function startAnotherTicket() {
  submitted.value = null
  clearFormErrors()
  form.type = 'occupied_seat'
  form.roomId = ''
  form.seatId = ''
  form.description = ''
}

async function loadMine() {
  mineController?.abort()
  mineController = new AbortController()
  const current = ++mineSequence
  mineLoading.value = true
  mineError.value = ''
  try {
    const result = await listMyFeedback(
      {
        status: mineFilters.status,
        type: mineFilters.type,
        page: mineFilters.page,
        pageSize: mineFilters.pageSize,
      },
      mineController.signal,
    )
    if (current !== mineSequence) return
    mineItems.value = result.items
    mineTotal.value = result.total
  } catch (cause) {
    if (cause instanceof RequestError && cause.kind === 'cancel') return
    if (current !== mineSequence) return
    mineItems.value = []
    mineTotal.value = 0
    mineError.value = cause instanceof RequestError ? cause.message : '反馈列表加载失败'
  } finally {
    if (current === mineSequence) mineLoading.value = false
  }
}

function searchMine() {
  mineFilters.page = 1
  void loadMine()
}

function resetMineFilters() {
  mineFilters.status = ''
  mineFilters.type = ''
  mineFilters.page = 1
  void loadMine()
}

function changeTab(name: string | number) {
  if (name === 'mine') void loadMine()
}

async function openDetail(ticket: FeedbackSummary | StudentFeedbackDetail) {
  const current = ++detailSequence
  detailOpen.value = true
  detailLoading.value = true
  detailError.value = ''
  selectedTicket.value = null
  try {
    const result = await getMyFeedback(ticket.id)
    if (current === detailSequence) selectedTicket.value = result
  } catch (cause) {
    if (current !== detailSequence) return
    detailError.value = cause instanceof RequestError ? cause.message : '工单详情加载失败'
  } finally {
    if (current === detailSequence) detailLoading.value = false
  }
}

async function viewSubmittedTicket() {
  activeTab.value = 'mine'
  await loadMine()
  if (submitted.value) {
    const pending = mineItems.value.find((item) => item.id === submitted.value?.id)
    if (pending) void openDetail(pending)
  }
}

onMounted(() => {
  void loadRooms()
  void loadMine()
})

onBeforeUnmount(() => {
  mineController?.abort()
})
</script>

<template>
  <section class="feedback-page page-shell" aria-labelledby="feedback-title">
    <header class="feedback-hero page-hero">
      <div class="hero-copy page-hero-copy">
        <p class="page-eyebrow">学生服务 / 反馈工单</p>
        <h1 id="feedback-title">让每一个使用问题都有回应</h1>
        <p>
          提交占座举报、设施与环境问题，并持续查看管理员核实结果。紧急预约操作请前往预约记录处理。
        </p>
      </div>
      <div class="hero-steps" aria-label="处理流程">
        <span><strong>01</strong> 提交问题</span>
        <span><strong>02</strong> 管理员核实</span>
        <span><strong>03</strong> 查看结果</span>
      </div>
    </header>

    <div class="feedback-tab-shell">
      <div class="feedback-tab-list" role="tablist" aria-label="反馈工单导航">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'submit'"
          :class="{ active: activeTab === 'submit' }"
          @click="changeTab('submit')"
        >
          <el-icon><Document /></el-icon>
          提交反馈
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'mine'"
          :class="{ active: activeTab === 'mine' }"
          @click="changeTab('mine')"
        >
          <el-icon><CircleCheck /></el-icon>
          我的反馈
        </button>
      </div>

      <section v-if="activeTab === 'submit'" role="tabpanel">
        <div class="student-workspace">
          <section class="surface form-surface">
            <header class="section-heading">
              <div>
                <p class="section-kicker">NEW TICKET</p>
                <h2>描述你遇到的问题</h2>
              </div>
              <span class="required-note">* 为必填项</span>
            </header>

            <el-alert
              v-if="submitted"
              class="submit-success"
              type="success"
              :closable="false"
              show-icon
            >
              <template #title> 工单 #{{ submitted.id }} 已提交 </template>
              <p>当前状态为待处理，管理员处理后可在“我的反馈”中查看结果。</p>
              <div class="success-actions">
                <el-button type="primary" @click="viewSubmittedTicket">查看我的反馈</el-button>
                <el-button @click="startAnotherTicket">继续提交</el-button>
              </div>
            </el-alert>

            <template v-else>
              <div class="field-block">
                <label class="field-label">反馈类型 <span>*</span></label>
                <el-radio-group v-model="form.type" class="type-grid" @change="clearFormErrors">
                  <el-radio-button
                    v-for="option in feedbackTypeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    <strong>{{ option.label }}</strong>
                    <small>{{ feedbackTypeHint(option.value) }}</small>
                  </el-radio-button>
                </el-radio-group>
                <p v-if="formErrors.type" class="field-error">{{ formErrors.type }}</p>
                <p class="field-hint">{{ feedbackTypeHint(form.type) }}</p>
              </div>

              <div class="resource-grid">
                <div class="field-block">
                  <label class="field-label" for="feedback-room">
                    自习室
                    <span v-if="roomRequired">*</span>
                    <small v-else>可选</small>
                  </label>
                  <select
                    id="feedback-room"
                    v-model="form.roomId"
                    class="native-select"
                    :disabled="roomsLoading"
                    aria-label="选择相关自习室"
                  >
                    <option value="">请选择自习室</option>
                    <option v-for="room in rooms" :key="room.id" :value="room.id">
                      {{ room.name }} · {{ room.location }}
                    </option>
                  </select>
                  <p v-if="formErrors.roomId" class="field-error">{{ formErrors.roomId }}</p>
                </div>

                <div class="field-block">
                  <label class="field-label" for="feedback-seat">
                    座位
                    <span v-if="seatRequired">*</span>
                    <small v-else>可选</small>
                  </label>
                  <select
                    id="feedback-seat"
                    v-model="form.seatId"
                    class="native-select"
                    :disabled="!form.roomId || Boolean(seatLoadError)"
                    aria-label="选择相关座位"
                  >
                    <option value="">
                      {{
                        seatsLoading
                          ? '正在载入座位…'
                          : form.roomId
                            ? '不选择具体座位'
                            : '请先选择自习室'
                      }}
                    </option>
                    <option v-for="seat in seats" :key="seat.id" :value="seat.id">
                      {{ seat.seatNo }} · {{ seatStatusLabels[seat.status] }}
                    </option>
                  </select>
                  <p v-if="formErrors.seatId" class="field-error">{{ formErrors.seatId }}</p>
                  <p v-if="seatLoadError" class="field-warning">{{ seatLoadError }}</p>
                  <p v-else-if="roomDetail && seats.length" class="field-hint">
                    已载入 {{ seats.length }} 个座位，维修或停用座位也可用于问题反馈。
                  </p>
                </div>
              </div>

              <div class="field-block">
                <label class="field-label" for="feedback-description">
                  问题描述 <span>*</span>
                  <small>{{ descriptionLength }}/1000</small>
                </label>
                <el-input
                  id="feedback-description"
                  v-model="form.description"
                  type="textarea"
                  :rows="7"
                  maxlength="1000"
                  placeholder="请说明发生位置、时间和具体情况，至少 5 个字符。"
                  :aria-invalid="Boolean(formErrors.description)"
                />
                <p v-if="formErrors.description" class="field-error">
                  {{ formErrors.description }}
                </p>
              </div>

              <el-alert
                v-if="submitError"
                type="error"
                :title="submitError"
                :closable="false"
                show-icon
              />

              <div class="form-footer">
                <p>提交后原始描述不可修改；如需补充，请重新提交新工单。</p>
                <el-button
                  type="primary"
                  size="large"
                  :loading="submitting"
                  :disabled="submitting"
                  @click="submitFeedback"
                >
                  {{ submitting ? '正在提交…' : '提交反馈' }}
                </el-button>
              </div>
            </template>
          </section>

          <aside class="feedback-guide">
            <div class="guide-mark">
              <el-icon><Service /></el-icon>
            </div>
            <h2>提交前请确认</h2>
            <ul>
              <li>占座举报请准确选择自习室和座位。</li>
              <li>设施与环境问题尽量说明具体位置。</li>
              <li>反馈不替代预约取消或违约申诉。</li>
              <li>请勿填写与问题无关的他人隐私。</li>
            </ul>
            <div class="guide-summary">
              <span>当前选择</span>
              <strong>{{ feedbackTypeLabels[form.type] }}</strong>
              <small>{{ selectedRoom?.name || '尚未选择自习室' }}</small>
              <small>{{ selectedSeat?.seatNo || '尚未选择座位' }}</small>
            </div>
          </aside>
        </div>
      </section>

      <section v-else role="tabpanel">
        <section class="surface mine-surface">
          <header class="section-heading">
            <div>
              <p class="section-kicker">MY TICKETS</p>
              <h2>跟踪处理进度</h2>
            </div>
            <el-button :icon="RefreshRight" :loading="mineLoading" @click="loadMine">
              刷新
            </el-button>
          </header>

          <el-form class="filter-panel" @submit.prevent="searchMine">
            <el-form-item label="状态">
              <select v-model="mineFilters.status" class="native-select" aria-label="按状态筛选">
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
              <select v-model="mineFilters.type" class="native-select" aria-label="按类型筛选">
                <option value="">全部类型</option>
                <option
                  v-for="option in feedbackTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </el-form-item>
            <div class="filter-actions">
              <el-button native-type="submit" type="primary" :icon="Search">查询</el-button>
              <el-button @click="resetMineFilters">重置</el-button>
            </div>
          </el-form>

          <el-alert v-if="mineError" type="error" :title="mineError" :closable="false" show-icon>
            <template #default>
              <el-button link type="primary" @click="loadMine">重新加载</el-button>
            </template>
          </el-alert>

          <el-table
            v-loading="mineLoading"
            :data="mineItems"
            class="ticket-table"
            @row-click="openDetailRow"
          >
            <el-table-column label="工单" min-width="220">
              <template #default="{ row }">
                <div class="ticket-cell">
                  <span class="ticket-id">#{{ row.id }}</span>
                  <strong>{{ typeLabel(row) }}</strong>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="关联资源" min-width="220">
              <template #default="{ row }">
                <span class="resource-cell">
                  <el-icon><Location /></el-icon>
                  {{ locationLabel(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="提交时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="statusTag(row)" effect="light" round>
                  {{ statusLabel(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click.stop="openDetailRow(row)"> 详情 </el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无符合条件的反馈工单" :image-size="88" />
            </template>
          </el-table>

          <div v-if="mineTotal > mineFilters.pageSize" class="pagination-row">
            <el-pagination
              v-model:current-page="mineFilters.page"
              :page-size="mineFilters.pageSize"
              :total="mineTotal"
              layout="total, prev, pager, next"
              background
              @current-change="loadMine"
            />
          </div>
        </section>
      </section>
    </div>

    <el-drawer v-model="detailOpen" title="我的反馈详情" size="min(520px, 100vw)" destroy-on-close>
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="selectedTicket">
          <header class="detail-heading">
            <div>
              <p>工单 #{{ selectedTicket.id }}</p>
              <h2>{{ feedbackTypeLabels[selectedTicket.type] }}</h2>
            </div>
            <el-tag :type="feedbackStatusTagType(selectedTicket.status)" effect="light" round>
              {{ feedbackStatusLabels[selectedTicket.status] }}
            </el-tag>
          </header>

          <dl class="detail-grid">
            <div>
              <dt>关联资源</dt>
              <dd>{{ feedbackLocationLabel(selectedTicket) }}</dd>
            </div>
            <div>
              <dt>提交时间</dt>
              <dd>{{ formatDateTime(selectedTicket.createdAt) }}</dd>
            </div>
            <div>
              <dt>开始处理</dt>
              <dd>
                {{
                  selectedTicket.processedAt
                    ? formatDateTime(selectedTicket.processedAt)
                    : '尚未处理'
                }}
              </dd>
            </div>
            <div>
              <dt>结束时间</dt>
              <dd>
                {{
                  selectedTicket.closedAt
                    ? formatDateTime(selectedTicket.closedAt)
                    : '处理中或待处理'
                }}
              </dd>
            </div>
          </dl>

          <section class="detail-section">
            <h3>问题描述</h3>
            <p>{{ selectedTicket.description }}</p>
          </section>

          <section v-if="selectedTicket.result" class="detail-result">
            <div class="result-title">
              <el-icon><CircleCheck /></el-icon>
              <h3>管理员处理结果</h3>
            </div>
            <p>{{ selectedTicket.result }}</p>
          </section>
          <div v-else class="waiting-note">
            <el-icon><Warning /></el-icon>
            <span>管理员尚未填写处理结果，请稍后刷新查看。</span>
          </div>
        </template>
        <el-alert
          v-else-if="detailError"
          type="error"
          :title="detailError"
          :closable="false"
          show-icon
        />
      </div>
    </el-drawer>
  </section>
</template>

<style scoped>
.feedback-page {
  display: grid;
  gap: 24px;
}

.feedback-hero {
  min-height: 230px;
}

.hero-copy {
  max-width: 720px;
}

.page-eyebrow,
.section-kicker {
  margin: 0;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.feedback-hero h1 {
  margin: 9px 0 0;
}

.feedback-hero p:last-child {
  max-width: 680px;
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.75;
}

.hero-steps {
  display: grid;
  min-width: 160px;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface-raised) 58%, transparent);
  backdrop-filter: blur(18px);
}

.hero-steps span {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.hero-steps strong {
  color: var(--accent);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.feedback-tab-shell {
  display: grid;
  gap: 14px;
}

.feedback-tab-list {
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--border);
}

.feedback-tab-list button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 14px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

.feedback-tab-list button:hover {
  color: var(--text);
}

.feedback-tab-list button.active {
  border-bottom-color: var(--accent);
  color: var(--accent);
}

.student-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: start;
}

.surface {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
  box-shadow: var(--shadow-card);
}

.form-surface {
  display: grid;
  gap: 22px;
  padding: 24px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-heading h2 {
  margin: 5px 0 0;
  color: var(--text);
  font-size: 1.25rem;
  font-weight: 500;
}

.required-note,
.field-label small {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-label {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
}

.field-label > span {
  color: var(--status-bad);
}

.field-label small {
  margin-left: 7px;
}

.field-hint,
.field-error,
.field-warning {
  margin: 0;
  font-size: 0.75rem;
}

.field-hint {
  color: var(--text-muted);
}

.field-error {
  color: var(--status-bad);
}

.field-warning {
  color: var(--status-warn);
}

.native-select {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  background: var(--surface-raised);
  font-size: 0.875rem;
}

.native-select:disabled {
  color: var(--text-muted);
  background: var(--surface-muted);
  cursor: not-allowed;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.type-grid :deep(.el-radio-button__inner) {
  display: grid;
  width: 100%;
  min-height: 74px;
  gap: 5px;
  padding: 13px 14px;
  text-align: left;
  white-space: normal;
}

.type-grid :deep(.el-radio-button) {
  width: 100%;
}

.type-grid :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  box-shadow: -1px 0 0 0 var(--accent);
}

.type-grid strong {
  font-size: 0.875rem;
}

.type-grid small {
  color: inherit;
  font-size: 0.75rem;
  opacity: 0.78;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-top: 2px;
}

.form-footer p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.55;
}

.submit-success p {
  margin: 6px 0 12px;
}

.success-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feedback-guide {
  position: sticky;
  top: 86px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.guide-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 9px;
  color: var(--accent-contrast);
  background: var(--accent);
  font-size: 19px;
}

.feedback-guide h2 {
  margin: 16px 0 10px;
  color: var(--text);
  font-size: 1.125rem;
  font-weight: 500;
}

.feedback-guide ul {
  display: grid;
  gap: 9px;
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  line-height: 1.6;
}

.guide-summary {
  display: grid;
  gap: 4px;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.guide-summary span,
.guide-summary small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.guide-summary strong {
  margin-bottom: 4px;
  color: var(--text);
  font-size: 1rem;
}

.mine-surface {
  display: grid;
  gap: 16px;
  padding: 22px;
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0 14px;
  padding: 14px 14px 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-muted);
}

.filter-panel :deep(.el-form-item) {
  margin-bottom: 14px;
}

.filter-panel .native-select {
  width: 160px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.ticket-table {
  width: 100%;
}

.ticket-table :deep(.el-table__row) {
  cursor: pointer;
}

.ticket-cell {
  display: grid;
  gap: 3px;
}

.ticket-id {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.ticket-cell strong {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
}

.resource-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.pagination-row {
  display: flex;
  justify-content: center;
}

.detail-body {
  min-height: 260px;
}

.detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.detail-heading p {
  margin: 0 0 5px;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

.detail-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.25rem;
  font-weight: 500;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 20px 0;
  margin: 0;
  border-bottom: 1px solid var(--border);
}

.detail-grid dt {
  margin-bottom: 4px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.detail-grid dd {
  margin: 0;
  color: var(--text);
  font-size: 0.875rem;
  line-height: 1.5;
}

.detail-section {
  padding: 20px 0;
}

.detail-section h3,
.detail-result h3 {
  margin: 0 0 10px;
  color: var(--text);
  font-size: 0.875rem;
}

.detail-section p,
.detail-result p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.detail-result {
  padding: 16px;
  border: 1px solid var(--status-ok-border);
  border-radius: 9px;
  background: var(--status-ok-tint);
}

.result-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--status-ok);
}

.result-title h3 {
  color: var(--status-ok);
}

.waiting-note {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 14px 16px;
  border-radius: 8px;
  color: var(--status-warn);
  background: var(--status-warn-tint);
  font-size: 0.8125rem;
}

@media (max-width: 1050px) {
  .student-workspace {
    grid-template-columns: 1fr;
  }

  .feedback-guide {
    position: static;
  }
}

@media (max-width: 720px) {
  .feedback-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .hero-steps {
    width: 100%;
  }

  .surface {
    border-radius: 10px;
  }

  .form-surface,
  .mine-surface {
    padding: 18px;
  }

  .type-grid,
  .resource-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .form-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .form-footer :deep(.el-button) {
    width: 100%;
  }

  .filter-panel {
    align-items: stretch;
    flex-direction: column;
    padding: 14px;
  }

  .filter-panel :deep(.el-form-item),
  .filter-panel .native-select {
    width: 100%;
  }
}
</style>
