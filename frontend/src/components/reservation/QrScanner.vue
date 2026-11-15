<script setup lang="ts">
import jsQR from 'jsqr'
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'

const emit = defineEmits<{
  detected: [text: string]
  close: []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const fileRef = ref<HTMLInputElement | null>(null)
const scanning = shallowRef(false)
const busy = shallowRef(false)
const error = shallowRef('')

const cameraAvailable = computed(
  () => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
)

let stream: MediaStream | null = null
let frameHandle = 0
let lastScanAt = 0
let stopped = false

function stopCamera() {
  stopped = true
  if (frameHandle) cancelAnimationFrame(frameHandle)
  frameHandle = 0
  if (stream) {
    for (const track of stream.getTracks()) track.stop()
    stream = null
  }
  if (videoRef.value) videoRef.value.srcObject = null
  scanning.value = false
}

function decodeImageData(imageData: ImageData): boolean {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  })
  if (!result) return false
  stopCamera()
  emit('detected', result.data)
  return true
}

function scanFrame() {
  if (stopped) return
  const video = videoRef.value
  if (!video || video.readyState < video.HAVE_CURRENT_DATA) {
    frameHandle = requestAnimationFrame(scanFrame)
    return
  }
  const now = performance.now()
  if (now - lastScanAt < 120) {
    frameHandle = requestAnimationFrame(scanFrame)
    return
  }
  lastScanAt = now
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context || canvas.width === 0) {
    frameHandle = requestAnimationFrame(scanFrame)
    return
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  if (!decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height))) {
    frameHandle = requestAnimationFrame(scanFrame)
  }
}

async function startCamera() {
  error.value = ''
  if (!cameraAvailable.value) {
    error.value = '当前浏览器不支持摄像头，请改用上传二维码图片或粘贴签到数据'
    return
  }
  busy.value = true
  stopped = false
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
    const video = videoRef.value
    if (!video) return
    video.srcObject = stream
    await video.play()
    scanning.value = true
    frameHandle = requestAnimationFrame(scanFrame)
  } catch (cause) {
    stopCamera()
    const name = cause instanceof DOMException ? cause.name : ''
    error.value =
      name === 'NotAllowedError'
        ? '摄像头权限被拒绝，请允许后重试，或改用上传图片/粘贴数据'
        : name === 'NotFoundError'
          ? '未检测到摄像头，请改用上传图片或粘贴数据'
          : '无法启动摄像头，请改用上传图片或粘贴数据'
  } finally {
    busy.value = false
  }
}

async function decodeFile(file: File) {
  busy.value = true
  error.value = ''
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('canvas context unavailable')
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    const found = decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height))
    if (!found) error.value = '图片中没有识别到二维码，请换一张更清晰的截图'
  } catch {
    error.value = '图片读取失败，请换一张图片重试'
  } finally {
    busy.value = false
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) await decodeFile(file)
}

onBeforeUnmount(stopCamera)
</script>

<template>
  <section class="qr-scanner">
    <header>
      <div>
        <strong>摄像头扫码 / 图片识别</strong>
        <small>手机用摄像头对准签到二维码；电脑可上传二维码截图</small>
      </div>
      <el-button link @click="emit('close')">收起</el-button>
    </header>

    <el-alert v-if="error" type="warning" :title="error" :closable="false" show-icon />

    <div class="scanner-body">
      <div class="video-shell" :class="{ active: scanning }">
        <video ref="videoRef" muted playsinline aria-label="摄像头预览" />
        <p v-if="!scanning" class="video-hint">摄像头未开启</p>
      </div>

      <div class="scanner-actions">
        <el-button type="primary" :loading="busy" :disabled="scanning" @click="startCamera">
          开启摄像头扫码
        </el-button>
        <el-button :loading="busy" @click="fileRef?.click()">上传二维码图片</el-button>
        <el-button v-if="scanning" @click="stopCamera">停止扫描</el-button>
        <input
          ref="fileRef"
          class="file-input"
          type="file"
          accept="image/*"
          @change="onFileChange"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.qr-scanner {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px dashed var(--border-strong);
  border-radius: 10px;
  background: var(--surface-muted);
}

.qr-scanner header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.qr-scanner header div {
  display: grid;
  gap: 3px;
}

.qr-scanner strong {
  color: var(--text);
  font-size: 0.86rem;
}

.qr-scanner small {
  color: var(--text-muted);
  font-size: 0.74rem;
}

.scanner-body {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.video-shell {
  position: relative;
  display: grid;
  place-items: center;
  width: min(320px, 100%);
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #0b1220;
}

.video-shell video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-hint {
  position: absolute;
  margin: 0;
  color: #cbd5e1;
  font-size: 0.76rem;
}

.scanner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-input {
  display: none;
}
</style>
