<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { checkHealth, checkReadiness } from '../api/system'
import ConnectionStatusCard from '../components/ConnectionStatusCard.vue'
import type { ConnectionState, ConnectionStatus } from '../types/status'
import { apiBaseUrl, RequestError } from '../utils/request'

// The two services are the single source of truth: cards, overview tiles and counters all derive from it.
const services = [
  {
    title: '后端服务',
    caption: 'HTTP 接口是否可访问',
    kind: 'server' as const,
    path: '/health',
  },
  {
    title: '数据库',
    caption: '后端能否连上项目库',
    kind: 'database' as const,
    path: '/ready',
  },
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
const results = shallowRef<Record<'server' | 'database', ConnectionStatus>>({
  server: { state: 'checking', description: '正在连接后端服务…' },
  database: { state: 'checking', description: '正在通过后端验证数据库连接…' },
})

let controller: AbortController | undefined

const healthyCount = computed(
  () => services.filter((service) => results.value[service.kind].state === 'healthy').length,
)
const summaryState = computed<ConnectionState>(() => {
  if (checking.value) return 'checking'
  if (healthyCount.value === services.length) return 'healthy'
  return services.some((service) => results.value[service.kind].state === 'unhealthy')
    ? 'unhealthy'
    : 'unknown'
})
const summary = computed(() => {
  if (checking.value) return '正在检测'
  if (summaryState.value === 'healthy') return '服务运行正常'
  return summaryState.value === 'unhealthy' ? '服务需要关注' : '状态待确认'
})
const summaryDescription = computed(() => {
  if (checking.value) return '正在分别验证后端接口与数据库连接。'
  if (summaryState.value === 'healthy') return '后端接口与数据库连接均已就绪。'
  return '下方显示了失败项，处理后可重新检测。'
})

const stateLabels: Record<ConnectionState, string> = {
  checking: '检测中',
  healthy: '正常',
  unhealthy: '异常',
  unknown: '未知',
}

const tiles = computed(() =>
  services.map((service) => ({
    key: service.kind,
    label: service.title,
    state: results.value[service.kind].state,
    value: stateLabels[results.value[service.kind].state],
  })),
)
const checkedAtLabel = computed(() =>
  checkedAt.value ? timeFormatter.format(checkedAt.value) : '尚未检测',
)

// A network error, a timeout, or a gateway error means the backend never answered; only then
// is the database unknowable. Every other failure belongs to the service that failed.
function isUnreachable(error: unknown): boolean {
  if (!(error instanceof RequestError)) return false
  if (error.kind === 'network' || error.kind === 'timeout') return true
  return error.httpStatus === 502 || error.httpStatus === 503 || error.httpStatus === 504
}

function serverStatus(result: PromiseSettledResult<unknown>): ConnectionStatus {
  if (result.status === 'fulfilled') {
    return { state: 'healthy', description: '接口可正常访问，响应正常。' }
  }
  return isUnreachable(result.reason)
    ? { state: 'unknown', description: '无法连接后端，请确认服务已启动并检查接口代理配置。' }
    : { state: 'unhealthy', description: '后端响应异常，请检查服务日志与接口配置。' }
}

function databaseStatus(
  health: PromiseSettledResult<unknown>,
  database: PromiseSettledResult<unknown>,
): ConnectionStatus {
  if (health.status === 'rejected' && isUnreachable(health.reason)) {
    return { state: 'unknown', description: '后端不可达，无法确认数据库状态。' }
  }
  if (database.status === 'fulfilled') {
    return { state: 'healthy', description: '后端已成功访问项目数据库。' }
  }
  if (isUnreachable(database.reason)) {
    return { state: 'unknown', description: '无法确认数据库状态，请稍后重试。' }
  }
  return { state: 'unhealthy', description: '数据库未就绪，请检查 MySQL 与后端连接配置。' }
}

async function refresh() {
  if (checking.value) return

  const current = new AbortController()
  controller = current
  checking.value = true

  const [health, database] = await Promise.allSettled([
    checkHealth(current.signal),
    checkReadiness(current.signal),
  ])

  controller = undefined
  if (current.signal.aborted) return

  results.value = {
    server: serverStatus(health),
    database: databaseStatus(health, database),
  }
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
    <header class="page-heading">
      <div>
        <p class="eyebrow">运行监测</p>
        <h1 class="page-title">系统状态</h1>
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
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M13 8a5 5 0 1 1-1.5-3.5M13 3v3h-3"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {{ checking ? '正在检测' : '重新检测' }}
      </button>
    </header>

    <section class="hero" :data-state="summaryState" aria-label="运行概览">
      <div class="hero-main">
        <span class="hero-indicator" aria-hidden="true" />
        <div>
          <p class="hero-kicker">运行概览</p>
          <p class="hero-title" role="status" aria-live="polite">{{ summary }}</p>
          <p class="hero-description">{{ summaryDescription }}</p>
        </div>
      </div>
      <div class="hero-metric">
        <p class="hero-count" aria-label="正常连接数">
          <strong>{{ String(healthyCount).padStart(2, '0') }}</strong>
          <span>/ {{ String(services.length).padStart(2, '0') }}</span>
        </p>
        <div class="hero-meter" aria-hidden="true">
          <span
            v-for="index in services.length"
            :key="index"
            :class="{ 'is-on': index <= healthyCount }"
          />
        </div>
        <p class="hero-metric-label">连接正常</p>
      </div>
    </section>

    <div class="tiles">
      <div v-for="tile in tiles" :key="tile.key" class="tile" :data-state="tile.state">
        <span class="tile-dot" aria-hidden="true" />
        <p class="tile-value">{{ tile.value }}</p>
        <p class="tile-label">{{ tile.label }}</p>
      </div>
      <div class="tile" data-state="neutral">
        <p class="tile-value">{{ checkedAtLabel }}</p>
        <p class="tile-label">最近检测</p>
      </div>
    </div>

    <section class="services" aria-label="连接详情">
      <ConnectionStatusCard
        v-for="service in services"
        :key="service.path"
        :title="service.title"
        :caption="service.caption"
        :kind="service.kind"
        :endpoint="`${apiBaseUrl}${service.path}`"
        :state="results[service.kind].state"
        :description="results[service.kind].description"
      />
    </section>

    <details class="status-note">
      <summary class="note-toggle">
        <svg class="note-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.25" />
          <path d="M8 7v3.5M8 5h.01" stroke="currentColor" stroke-width="1.4" />
        </svg>
        <span>这些状态是怎么检测的？</span>
        <svg class="note-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.25" />
        </svg>
      </summary>
      <p class="note-description">
        打开页面或点击“重新检测”时向后端发送真实请求。两项检查互不影响：后端不可用时，数据库状态显示为未知；数据库异常不影响后端检测。结果只反映最近一次检测，页面不会自动刷新。
      </p>
    </details>
  </div>
</template>

<style scoped>
.status-page {
  max-width: 920px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--text-muted);
  font-size: 10.5px;
  letter-spacing: 0.16em;
}

.page-title {
  margin: 0;
  font-size: 30px;
  font-weight: 680;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.refresh-button {
  flex-shrink: 0;
  margin-bottom: 2px;
}

/* ---------- hero ---------- */

.hero {
  --hero-accent: var(--status-ok);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 28px;
  border: 1px solid #2e4c3c;
  border-radius: 18px;
  color: #f2f7ee;
  background:
    radial-gradient(120% 160% at 100% 0%, #3d6049 0%, transparent 55%),
    linear-gradient(140deg, #2b4736 0%, #1f3628 100%);
  box-shadow: 0 14px 30px -18px #1f3628a6;
}

.hero[data-state='checking'] {
  --hero-accent: #9ec4e8;
  background:
    radial-gradient(120% 160% at 100% 0%, #3b5670 0%, transparent 55%),
    linear-gradient(140deg, #2c4054 0%, #1f2f3e 100%);
}

.hero[data-state='unhealthy'] {
  --hero-accent: #fbcfc4;
  background:
    radial-gradient(120% 160% at 100% 0%, #6a3b34 0%, transparent 55%),
    linear-gradient(140deg, #4e332d 0%, #3a2622 100%);
}

.hero[data-state='unknown'] {
  --hero-accent: #f2d9a2;
  background:
    radial-gradient(120% 160% at 100% 0%, #5f4c30 0%, transparent 55%),
    linear-gradient(140deg, #4a3c28 0%, #382d1f 100%);
}

.hero-main {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 14px;
}

.hero-indicator {
  width: 9px;
  height: 9px;
  flex-shrink: 0;
  margin-top: 7px;
  border-radius: 50%;
  background: var(--hero-accent);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--hero-accent) 18%, transparent);
}

.hero[data-state='checking'] .hero-indicator {
  animation: pulse 1.2s ease-in-out infinite;
}

.hero-kicker {
  margin: 0 0 7px;
  color: #c3d2c6;
  font-size: 10.5px;
  letter-spacing: 0.12em;
}

.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.hero-description {
  margin: 7px 0 0;
  max-width: 34em;
  color: #c8d5ca;
  font-size: 12px;
  line-height: 1.65;
}

.hero-metric {
  flex-shrink: 0;
  padding-left: 26px;
  border-left: 1px solid #ffffff26;
  text-align: right;
}

.hero-count {
  margin: 0;
  color: #d7eda8;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.hero-count strong {
  font-size: 40px;
  font-weight: 550;
  letter-spacing: -0.04em;
}

.hero-count span {
  margin-left: 4px;
  color: #b9c8bc;
}

.hero-meter {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 10px;
}

.hero-meter span {
  width: 22px;
  height: 3px;
  border-radius: 2px;
  background: #ffffff4d;
}

.hero-meter span.is-on {
  background: #d7eda8;
}

.hero-metric-label {
  margin: 8px 0 0;
  color: #b9c8bc;
  font-size: 10.5px;
}

/* ---------- tiles ---------- */

.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 22px;
}

.tile {
  --tile-color: var(--text-secondary);
  position: relative;
  padding: 13px 15px 12px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
  box-shadow: 0 1px 2px #24342b08;
}

.tile[data-state='healthy'] {
  --tile-color: var(--status-ok);
}

.tile[data-state='unhealthy'] {
  --tile-color: var(--status-bad);
}

.tile[data-state='unknown'] {
  --tile-color: var(--status-warn);
}

.tile[data-state='checking'] {
  --tile-color: var(--status-info);
}

.tile-dot {
  position: absolute;
  top: 15px;
  right: 13px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--tile-color);
  opacity: 0.85;
}

.tile-value {
  margin: 0;
  color: var(--text);
  font-size: 15px;
  font-weight: 620;
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
}

.tile-label {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 10.5px;
}

/* ---------- services ---------- */

.services {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

/* ---------- note ---------- */

.status-note {
  margin-top: 22px;
}

.note-toggle {
  display: flex;
  width: fit-content;
  min-height: 38px;
  align-items: center;
  gap: 7px;
  padding: 4px 0;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 11.5px;
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
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.note-chevron {
  width: 10px;
  height: 10px;
  transition: transform 160ms ease;
}

.status-note[open] .note-chevron {
  transform: rotate(90deg);
}

.note-description {
  max-width: 620px;
  margin: 2px 0 0 21px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.8;
}

.is-spinning {
  animation: spin 0.9s linear infinite;
}

.button svg {
  width: 14px;
  height: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 720px) {
  .services {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
    gap: 18px;
    padding: 22px;
  }

  .hero-metric {
    padding: 16px 0 0;
    border-top: 1px solid #ffffff1f;
    border-left: 0;
    text-align: left;
  }

  .hero-meter {
    justify-content: flex-start;
  }

  .tiles {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 25px;
  }

  .hero {
    border-radius: 15px;
  }

  .hero-title {
    font-size: 21px;
  }

  .tiles {
    grid-template-columns: 1fr;
  }

  .status-note {
    margin-top: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-spinning,
  .hero[data-state='checking'] .hero-indicator {
    animation: none;
  }

  .note-chevron {
    transition: none;
  }
}
</style>
