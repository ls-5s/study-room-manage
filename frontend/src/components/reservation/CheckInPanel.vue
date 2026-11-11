<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, shallowRef } from 'vue'
import { submitCheckIn } from '../../api/check-in'
import type { CheckInPayload, ReservationDetail } from '../../types/reservation'
import { RequestError } from '../../utils/request'
import { windowState } from '../../utils/reservation'
import QrScanner from './QrScanner.vue'

const props = defineProps<{
  reservation: ReservationDetail
}>()

const emit = defineEmits<{
  'checked-in': []
}>()

const raw = shallowRef('')
const pending = shallowRef(false)
const error = shallowRef('')
const scannerOpen = shallowRef(false)
const state = computed(() => windowState(props.reservation.checkInWindow))
const disabled = computed(
  () => pending.value || props.reservation.status !== 'pending' || state.value !== 'open',
)

function parsePayload(): CheckInPayload | null {
  const text = raw.value.trim()
  if (!text) {
    error.value = '请粘贴签到码数据'
    return null
  }
  try {
    const parsed = JSON.parse(text) as Partial<CheckInPayload>
    if (
      typeof parsed.roomId !== 'string' ||
      typeof parsed.nonce !== 'string' ||
      typeof parsed.issuedAt !== 'string' ||
      typeof parsed.signature !== 'string'
    ) {
      error.value = '签到码数据缺少必要字段'
      return null
    }
    return {
      roomId: parsed.roomId,
      nonce: parsed.nonce,
      issuedAt: parsed.issuedAt,
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : null,
      signature: parsed.signature,
    }
  } catch {
    error.value = '签到码数据不是有效的 JSON'
    return null
  }
}

async function readClipboard() {
  try {
    raw.value = await navigator.clipboard.readText()
    error.value = ''
  } catch {
    ElMessage.warning('无法读取剪贴板，请手动粘贴签到码数据')
  }
}

async function submit() {
  error.value = ''
  const payload = parsePayload()
  if (!payload) return
  pending.value = true
  try {
    await submitCheckIn(props.reservation.id, payload)
    ElMessage.success('签到成功')
    raw.value = ''
    emit('checked-in')
  } catch (cause) {
    error.value = cause instanceof RequestError ? cause.message : '签到失败，请稍后重试'
  } finally {
    pending.value = false
  }
}

async function onDetected(text: string) {
  scannerOpen.value = false
  raw.value = text
  await submit()
}
</script>

<template>
  <section class="check-in-panel">
    <header>
      <div>
        <h2>扫码签到</h2>
        <p>用摄像头扫描自习室二维码，或上传二维码截图；也可以手动粘贴签到数据。</p>
      </div>
      <el-tag :type="state === 'open' ? 'success' : 'info'" effect="plain">
        {{ state === 'open' ? '窗口已开启' : state === 'before' ? '未到签到时间' : '窗口已关闭' }}
      </el-tag>
    </header>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon />

    <QrScanner v-if="scannerOpen" @detected="onDetected" @close="scannerOpen = false" />

    <el-input
      v-model="raw"
      type="textarea"
      :rows="4"
      :disabled="disabled"
      placeholder='粘贴形如 {"roomId":"4","nonce":"...","issuedAt":"...","expiresAt":"...","signature":"..."} 的签到数据'
    />

    <footer>
      <el-button :disabled="disabled" @click="scannerOpen = !scannerOpen">
        {{ scannerOpen ? '收起扫码' : '扫一扫' }}
      </el-button>
      <el-button :disabled="pending" @click="readClipboard">读取剪贴板</el-button>
      <el-button type="primary" :loading="pending" :disabled="disabled" @click="submit">
        提交签到
      </el-button>
    </footer>
  </section>
</template>

<style scoped>
.check-in-panel {
  display: grid;
  gap: 12px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.check-in-panel header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.check-in-panel h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.125rem;
  font-weight: 500;
}

.check-in-panel p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.check-in-panel footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
