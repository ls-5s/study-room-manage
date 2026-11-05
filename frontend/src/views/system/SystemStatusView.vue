<script setup lang="ts">
import { InfoFilled, Refresh } from '@element-plus/icons-vue'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { checkHealth, checkReadiness } from '../../api/system'
import ConnectionStatusCard from '../../components/ConnectionStatusCard.vue'
import type { ConnectionStatus } from '../../types/status'
import { apiBaseUrl, RequestError } from '../../utils/request'

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

const checkingStatuses: Record<'server' | 'database', ConnectionStatus> = {
  server: { state: 'checking', description: '正在连接后端服务…' },
  database: { state: 'checking', description: '正在通过后端验证数据库连接…' },
}

const checking = shallowRef(false)
const results = shallowRef<Record<'server' | 'database', ConnectionStatus>>(checkingStatuses)

let controller: AbortController | undefined

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
  results.value = {
    server: { ...checkingStatuses.server },
    database: { ...checkingStatuses.database },
  }

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
      <div class="heading-copy">
        <p class="eyebrow">运行与连接</p>
        <h1 class="page-title">系统状态</h1>
        <p class="page-description">检查后端服务与数据库连接，确认系统当前是否可用。</p>
      </div>
      <el-button
        class="refresh-button"
        type="primary"
        size="large"
        :loading="checking"
        :disabled="checking"
        @click="refresh"
      >
        <el-icon v-if="!checking"><Refresh /></el-icon>
        <span>{{ checking ? '正在检测' : '重新检测' }}</span>
      </el-button>
    </header>

    <section class="services-section" aria-labelledby="services-heading">
      <div class="section-heading">
        <div>
          <h2 id="services-heading" class="section-title">连接详情</h2>
          <p class="section-description">每项检查独立执行，单项失败不会阻止另一项检测。</p>
        </div>
        <span class="section-count">{{ services.length }} 项检查</span>
      </div>

      <div class="services">
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
      </div>
    </section>

    <el-collapse class="status-note">
      <el-collapse-item name="method">
        <template #title>
          <span class="note-title">
            <el-icon><InfoFilled /></el-icon>
            这些状态是怎么检测的？
          </span>
        </template>
        <p class="note-description">
          打开页面或点击“重新检测”时向后端发送真实请求。两项检查互不影响：后端不可用时，数据库状态显示为未知；数据库异常不影响后端检测。结果只反映最近一次检测，页面不会自动刷新。
        </p>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.status-page {
  width: 100%;
}

.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.heading-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  line-height: 1rem;
}

.page-title {
  margin: 0;
  color: var(--text);
  font-size: 1.875rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 2.25rem;
}

.page-description {
  max-width: 38rem;
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5rem;
}

.refresh-button {
  flex-shrink: 0;
}

.refresh-button .el-icon {
  margin-inline-end: 4px;
}

.services-section {
  margin-top: 0;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  color: var(--text);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.75rem;
}

.section-description {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5rem;
}

.section-count {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  line-height: 1rem;
}

.services {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.status-note {
  margin-top: 24px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.note-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.5rem;
}

.note-description {
  max-width: 42rem;
  margin: 0;
  padding: 0 0 16px 24px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.75rem;
}

.status-note :deep(.el-collapse) {
  border: 0;
}

.status-note :deep(.el-collapse-item__header) {
  border-bottom: 0;
  background: transparent;
}

.status-note :deep(.el-collapse-item__wrap) {
  border-bottom: 0;
  background: transparent;
}

@media (max-width: 760px) {
  .services {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .page-heading {
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
  }

  .page-title {
    font-size: 1.5rem;
    line-height: 2rem;
  }

  .section-heading {
    align-items: flex-start;
  }

  .section-count {
    padding-top: 4px;
  }

  .status-note {
    padding: 0 12px;
  }

  .note-description {
    padding-inline-start: 0;
  }
}
</style>
