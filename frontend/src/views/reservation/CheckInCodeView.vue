<script setup lang="ts">
import { CopyDocument, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { getAdminStudyRooms } from '../../api/admin-room'
import { getCheckInCode } from '../../api/check-in'
import type { CheckInCodeResult } from '../../types/reservation'
import type { StudyRoomSummary } from '../../types/study-room'
import { RequestError } from '../../utils/request'
import { formatDateTime } from '../../utils/reservation'

const rooms = shallowRef<StudyRoomSummary[]>([])
const roomId = shallowRef('')
const code = shallowRef<CheckInCodeResult | null>(null)
const qrDataUrl = shallowRef('')
const loading = shallowRef(false)
const error = shallowRef('')
// The code itself never expires; this only redraws the QR image once a minute.
const REFRESH_INTERVAL_MS = 60_000
let ticker: ReturnType<typeof setInterval> | undefined
let refreshing = false

const currentRoom = computed(() => rooms.value.find((room) => room.id === roomId.value) ?? null)
const payloadText = computed(() => (code.value ? JSON.stringify(code.value.payload) : ''))

async function loadRooms() {
  try {
    const result = await getAdminStudyRooms({ page: 1, pageSize: 100 })
    rooms.value = result.items
    if (!roomId.value && result.items.length > 0) {
      const preferred = result.items.find((room) => room.status === 'open') ?? result.items[0]
      roomId.value = preferred?.id ?? ''
    }
  } catch (cause) {
    error.value = cause instanceof RequestError ? cause.message : '自习室列表加载失败'
  }
}

function roomLabel(room: StudyRoomSummary): string {
  if (room.status === 'open') return room.name
  return `${room.name}（${room.status === 'closed' ? '已关闭' : '已停用'}）`
}

async function refresh() {
  if (!roomId.value || refreshing) return
  refreshing = true
  loading.value = true
  error.value = ''
  try {
    const result = await getCheckInCode(roomId.value)
    code.value = result
    qrDataUrl.value = await QRCode.toDataURL(JSON.stringify(result.payload), {
      margin: 1,
      width: 280,
      errorCorrectionLevel: 'M',
    })
  } catch (cause) {
    code.value = null
    qrDataUrl.value = ''
    error.value = cause instanceof RequestError ? cause.message : '签到码生成失败'
  } finally {
    loading.value = false
    refreshing = false
  }
}

async function copyPayload() {
  try {
    await navigator.clipboard.writeText(payloadText.value)
    ElMessage.success('签到码数据已复制，可用于学生端粘贴签到')
  } catch {
    ElMessage.warning('当前浏览器不允许自动复制，请手动选择文本复制')
  }
}

watch(roomId, () => {
  code.value = null
  qrDataUrl.value = ''
  void refresh()
})

onMounted(async () => {
  await loadRooms()
  await refresh()
  // Cosmetic rotation only: a fresh nonce every minute, while earlier codes stay valid.
  ticker = setInterval(() => {
    if (!refreshing) void refresh()
  }, REFRESH_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (ticker) clearInterval(ticker)
  ticker = undefined
})
</script>

<template>
  <section class="code-page page-shell">
    <header class="page-header page-hero">
      <div class="page-hero-copy">
        <p class="page-eyebrow">管理后台 / 预约</p>
        <h1>签到码展示</h1>
        <p class="page-note">
          签到码长期有效、不设过期时间；页面每 60 秒自动换一张二维码，换图不影响已发出的码。
        </p>
      </div>
      <el-button :icon="RefreshRight" :loading="loading" @click="refresh">立即刷新</el-button>
    </header>

    <el-form class="room-picker toolbar-panel" @submit.prevent>
      <el-form-item label="自习室">
        <!-- Native select: Element's ElSelect prop typings do not resolve under this
             element-plus + vue-tsc combination, and a plain select keeps the page typed. -->
        <select v-model="roomId" class="native-select" aria-label="选择自习室">
          <option v-for="room in rooms" :key="room.id" :value="room.id">
            {{ roomLabel(room) }}
          </option>
        </select>
      </el-form-item>
      <el-form-item v-if="currentRoom" label="位置">
        <span class="room-location">{{ currentRoom.location }}</span>
      </el-form-item>
    </el-form>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon />

    <div v-loading="loading" class="code-body">
      <template v-if="code">
        <div class="qr-card">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="签到二维码" width="280" height="280" />
          <el-empty v-else :image-size="80" description="二维码渲染失败，请使用下方签到码数据" />
          <p class="qr-hint">二维码长期有效，学生可随时扫码签到</p>
        </div>

        <div class="code-meta">
          <div class="meta-row">
            <span>有效期</span>
            <strong>长期有效（不会过期）</strong>
          </div>
          <div class="meta-row">
            <span>生成时间</span>
            <strong>{{ formatDateTime(code.issuedAt) }}</strong>
          </div>
          <div class="meta-row">
            <span>自习室编号</span>
            <strong>{{ code.roomId }}</strong>
          </div>
          <el-button :icon="CopyDocument" @click="copyPayload">复制签到码数据</el-button>
        </div>

        <div class="payload-box">
          <header>
            <span>签到码原始数据</span>
            <small>粘贴到学生端"扫码签到"即可完成核验</small>
          </header>
          <pre>{{ payloadText }}</pre>
        </div>
      </template>
      <el-empty v-else-if="!loading" :image-size="90" description="请选择自习室以生成签到码" />
    </div>
  </section>
</template>

<style scoped>
.code-page {
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

.room-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  padding: 14px 16px 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface) 72%, transparent);
}

.room-location {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.native-select {
  min-width: 260px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--text);
  font-size: 0.875rem;
}

.code-body {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(220px, 1fr);
  gap: 16px;
  align-items: start;
}

.qr-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: #fff;
}

.qr-hint {
  margin: 0;
  color: #4b5563;
  font-size: 0.8125rem;
}

.code-meta {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.meta-row span {
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.meta-row strong {
  color: var(--text);
  font-size: 0.875rem;
}

.payload-box {
  grid-column: 1 / -1;
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.payload-box header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.payload-box header span {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
}

.payload-box header small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.payload-box pre {
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 820px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .code-body {
    grid-template-columns: 1fr;
  }
}
</style>
