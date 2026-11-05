<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { checkHealth, checkReadiness } from '../api/system'
import ConnectionStatusCard from '../components/ConnectionStatusCard.vue'
import type { ConnectionStatus } from '../types/status'
import { apiBaseUrl, RequestError } from '../utils/request'

const services = [
  { title: '后端服务', subtitle: '服务存活检测', kind: 'server' as const, path: '/health' },
  { title: '数据库连接', subtitle: '数据库就绪检测', kind: 'database' as const, path: '/ready' },
]

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const checking = shallowRef(false)
const checkedAt = shallowRef<Date | null>(null)
const backend = shallowRef<ConnectionStatus>({
  state: 'checking',
  description: '正在连接后端服务…',
})
const database = shallowRef<ConnectionStatus>({
  state: 'checking',
  description: '正在通过后端验证数据库连接…',
})

let controller: AbortController | undefined

const statuses = computed(() => [backend.value, database.value])
const healthyCount = computed(() => statuses.value.filter((s) => s.state === 'healthy').length)
const totalLabel = String(services.length).padStart(2, '0')
const checkedAtLabel = computed(() =>
  checkedAt.value ? timeFormatter.format(checkedAt.value) : '等待检测完成',
)
const summaryState = computed(() => {
  if (checking.value) return 'checking'
  if (healthyCount.value === services.length) return 'healthy'
  return statuses.value.some((s) => s.state === 'unhealthy') ? 'unhealthy' : 'unknown'
})
const summary = computed(() => {
  if (checking.value) return '正在检查系统连接'
  if (summaryState.value === 'healthy') return '所有服务运行正常'
  return '部分连接需要关注'
})
const summaryDescription = computed(() => {
  if (checking.value) return '正在分别验证后端服务与数据库，请稍候。'
  if (summaryState.value === 'healthy') return '后端服务与数据库均已就绪，连接一切如常。'
  return '请查看下方检测结果，排查后可重新检测。'
})

function backendUnreachable(error: unknown): boolean {
  return error instanceof RequestError && (error.kind === 'network' || error.kind === 'timeout')
}

function healthStatus(error: unknown): ConnectionStatus {
  return {
    state: 'unhealthy',
    description: backendUnreachable(error)
      ? '后端无法连接。请确认后端已启动，并检查接口代理配置。'
      : '后端接口响应异常，请检查后端服务和接口配置。',
  }
}

function readinessStatus(error: unknown): ConnectionStatus {
  return {
    state: backendUnreachable(error) ? 'unknown' : 'unhealthy',
    description: backendUnreachable(error)
      ? '无法确认数据库状态，请检查后端服务后重新检测。'
      : '数据库尚未就绪。请检查 MySQL 运行状态与后端数据库连接配置。',
  }
}

async function refresh() {
  if (checking.value) return

  const current = new AbortController()
  controller = current
  checking.value = true

  const [backendResult, databaseResult] = await Promise.allSettled([
    checkHealth(current.signal),
    checkReadiness(current.signal),
  ])

  controller = undefined
  if (current.signal.aborted) return

  backend.value =
    backendResult.status === 'fulfilled'
      ? { state: 'healthy', description: '后端服务正在运行，接口可正常访问。' }
      : healthStatus(backendResult.reason)
  database.value =
    backendResult.status === 'rejected'
      ? { state: 'unknown', description: '后端不可达，无法确认数据库状态。' }
      : databaseResult.status === 'fulfilled'
        ? { state: 'healthy', description: '后端已成功连接项目数据库。' }
        : readinessStatus(databaseResult.reason)

  checkedAt.value = new Date()
  checking.value = false
}

onMounted(() => void refresh())
onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <div class="status-page">
    <div class="page-heading">
      <div class="heading-copy">
        <p class="eyebrow">系统概览 <span aria-hidden="true">/</span> 运行监测</p>
        <h1 class="page-title">系统状态<span class="title-period" aria-hidden="true">.</span></h1>
      </div>
      <button
        class="button button-primary refresh-button"
        type="button"
        :disabled="checking"
        :aria-busy="checking"
        @click="refresh"
      >
        <svg
          :class="{ 'is-spinning': checking }"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M15.5 7a6 6 0 1 0 .3 5M15.5 3.5V7H12"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {{ checking ? '正在检测…' : '重新检测' }}
      </button>
    </div>
    <p class="page-description">连接是否顺畅，在这里一目了然。</p>

    <section class="overview" :data-state="summaryState" aria-label="运行概览">
      <div class="overview-copy" role="status" aria-live="polite" aria-atomic="true">
        <p class="overview-label"><span class="overview-dot" aria-hidden="true" />运行概览</p>
        <h2 class="overview-title">{{ summary }}</h2>
        <p class="overview-description">{{ summaryDescription }}</p>
      </div>
      <div class="overview-count" aria-label="正常连接数">
        <div class="count-value">
          {{ healthyCount.toString().padStart(2, '0') }}<span>/ {{ totalLabel }}</span>
        </div>
        <span class="count-label">连接正常</span>
      </div>
      <div class="overview-footer">
        <span class="last-checked">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.25" />
            <path
              d="M8 4.5V8l2 1.5"
              stroke="currentColor"
              stroke-width="1.25"
              stroke-linecap="round"
            />
          </svg>
          最近检测
          <time v-if="checkedAt" :datetime="checkedAt.toISOString()">{{ checkedAtLabel }}</time>
          <span v-else>{{ checkedAtLabel }}</span>
        </span>
        <span class="overview-mode">{{ checking ? '检测进行中' : '本次检测结果' }}</span>
      </div>
    </section>

    <div class="section-heading">
      <h2 class="section-title">
        服务连接<span class="service-count">{{ services.length }}</span>
      </h2>
      <span class="section-caption">独立检测 · 真实请求</span>
    </div>

    <div class="status-grid">
      <ConnectionStatusCard
        v-for="service in services"
        :key="service.path"
        :title="service.title"
        :subtitle="service.subtitle"
        :kind="service.kind"
        :endpoint="`${apiBaseUrl}${service.path}`"
        :state="service.kind === 'server' ? backend.state : database.state"
        :description="service.kind === 'server' ? backend.description : database.description"
      />
    </div>

    <details class="status-note">
      <summary class="note-toggle">
        <svg class="note-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4" />
          <path
            d="M10 9v4m0-6.5v.2"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
        <span>这些状态是如何检测的？</span>
        <svg class="note-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="m5.5 3 5 5-5 5"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </summary>
      <p class="note-description">
        打开页面或点击“重新检测”时，会向后端发送真实请求。服务存活与数据库就绪分别检查，数据库异常不会影响存活检查；结果以最近一次检测为准，不会自动刷新。
      </p>
    </details>
  </div>
</template>

<style scoped>
.eyebrow {
  display: flex;
  gap: 10px;
  margin: 0 0 12px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.4;
}
.eyebrow span {
  color: #a4ada1;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.heading-copy {
  min-width: 0;
}
.page-title {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.05em;
}
.title-period {
  margin-left: 2px;
  color: #7d9a59;
}
.refresh-button {
  flex-shrink: 0;
  align-self: flex-end;
  margin-bottom: 2px;
}
.page-description {
  margin: 12px 0 28px;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}
.overview {
  --overview-accent: var(--highlight);
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 24px;
  overflow: hidden;
  padding: 28px 32px 0;
  border: 1px solid #304c38;
  border-radius: 18px;
  color: #fff;
  background: #263f30;
  box-shadow: 0 5px 14px #263f3008;
}
.overview::after {
  position: absolute;
  top: -120px;
  right: 40px;
  width: 340px;
  height: 340px;
  border: 1px solid #ffffff06;
  border-radius: 50%;
  box-shadow:
    0 0 0 45px #ffffff03,
    0 0 0 90px #ffffff02;
  content: '';
  pointer-events: none;
}
.overview[data-state='checking'] {
  --overview-accent: #c5d9f5;
  border-color: #3b4c60;
  background: #2c4054;
}
.overview[data-state='unhealthy'],
.overview[data-state='unknown'] {
  --overview-accent: #f5d4a2;
  border-color: #65533a;
  background: #4e412e;
}
.overview-copy,
.overview-count,
.overview-footer {
  position: relative;
  z-index: 1;
}
.overview-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: #dee7da;
  font-size: 11px;
  letter-spacing: 0.08em;
}
.overview-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--overview-accent);
  box-shadow: 0 0 0 4px #ffffff0a;
}
.overview-title {
  margin: 0;
  font-size: 25px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.02em;
}
.overview-description {
  margin: 8px 0 0;
  color: #d0dbcb;
  font-size: 12px;
  line-height: 1.7;
}
.overview-count {
  padding: 0 10px 0 30px;
  border-left: 1px solid #ffffff1c;
  text-align: center;
}
.count-value {
  color: var(--overview-accent);
  font-size: 48px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  letter-spacing: -0.05em;
}
.count-value span {
  margin-left: 8px;
  color: #d0dbcb;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: 0;
}
.count-label {
  display: block;
  margin-top: 8px;
  color: #d0dbcb;
  font-size: 11px;
}
.overview-footer {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  padding: 13px 0;
  border-top: 1px solid #ffffff16;
  color: #c5d2bf;
  font-size: 11px;
  line-height: 1.6;
}
.last-checked {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}
.last-checked svg {
  width: 14px;
  height: 14px;
}
.last-checked time {
  color: #eff4eb;
  font-variant-numeric: tabular-nums;
}
.overview-mode {
  flex-shrink: 0;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 30px 0 14px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}
.service-count {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border: 1px solid #dfe5d8;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
}
.section-caption {
  color: var(--text-muted);
  font-size: 11px;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 800px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}
.status-note {
  margin-top: 20px;
}
.note-toggle {
  display: flex;
  width: fit-content;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  list-style: none;
  cursor: pointer;
}
.note-toggle::-webkit-details-marker {
  display: none;
}
.note-toggle:hover {
  color: var(--accent);
}
.note-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.note-chevron {
  width: 12px;
  height: 12px;
  margin-left: 2px;
  transition: transform 160ms ease;
}
.status-note[open] .note-chevron {
  transform: rotate(90deg);
}
.note-description {
  max-width: 720px;
  margin: 4px 0 0 26px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.9;
}
.is-spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .is-spinning {
    animation: none;
  }
  .note-chevron {
    transition: none;
  }
}
@media (max-width: 600px) {
  .eyebrow {
    margin-bottom: 8px;
    font-size: 10px;
  }
  .page-title {
    font-size: 28px;
  }
  .page-description {
    margin: 10px 0 20px;
    font-size: 12px;
  }
  .refresh-button {
    min-height: 42px;
    gap: 6px;
    padding: 9px 11px;
    font-size: 12px;
  }
  .overview {
    column-gap: 12px;
    padding: 20px 20px 0;
    border-radius: 14px;
  }
  .overview-label {
    margin-bottom: 9px;
    font-size: 10px;
  }
  .overview-title {
    font-size: 18px;
  }
  .overview-description {
    max-width: 22em;
    margin-top: 6px;
    font-size: 11px;
  }
  .overview-count {
    align-self: start;
    padding: 16px 0 0;
    border: 0;
  }
  .count-value {
    font-size: 32px;
  }
  .count-value span {
    margin-left: 5px;
    font-size: 12px;
  }
  .count-label {
    margin-top: 5px;
    font-size: 10px;
  }
  .overview-footer {
    margin-top: 16px;
    padding: 10px 0;
    font-size: 10px;
  }
  .section-heading {
    margin: 22px 0 12px;
  }
  .section-title {
    font-size: 14px;
  }
  .section-caption {
    font-size: 10px;
  }
  .status-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .status-note {
    margin-top: 12px;
  }
}
@media (max-width: 359px) {
  .overview {
    column-gap: 8px;
    padding-right: 16px;
    padding-left: 16px;
  }
  .overview-title {
    font-size: 17px;
  }
  .count-value {
    font-size: 28px;
  }
  .overview-mode {
    display: none;
  }
}
</style>
