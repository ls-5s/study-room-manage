<script setup lang="ts">
import {
  Clock,
  Connection,
  CopyDocument,
  Monitor,
  RefreshRight,
  Setting,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue'
import { getSystemSettings, getSystemStatus, updateSystemSettings } from '../../api/system'
import { useAuthStore } from '../../stores/auth'
import type {
  JobState,
  OperationalSettings,
  SystemJobStatus,
  SystemStatus,
} from '../../types/system'
import { RequestError } from '../../utils/request'
import { formatDateTime } from '../../utils/reservation'

const auth = useAuthStore()
const status = shallowRef<SystemStatus | null>(null)
const loading = shallowRef(false)
const saving = shallowRef(false)
const error = shallowRef('')
const fieldErrors = reactive<Record<string, string>>({})
let controller: AbortController | null = null
let sequence = 0

const form = reactive<OperationalSettings>({
  reservation: {
    advanceDays: 7,
    dailyLimit: 2,
    createPerMinute: 10,
    cancelPerMinute: 10,
  },
  feedback: {
    createPerMinute: 3,
    createPerHour: 10,
  },
  violation: {
    threshold: 3,
    restrictionDays: 7,
  },
})

const canEdit = computed(() => auth.isSuperAdmin)
const statusCards = computed(() => [
  {
    label: 'API 服务',
    value: status.value ? '运行中' : '未知',
    detail: status.value
      ? `${status.value.service.environment} · ${status.value.service.version}`
      : '',
    icon: Monitor,
    tone: 'success',
  },
  {
    label: '数据库',
    value: status.value?.database.status === 'connected' ? '已连接' : '不可用',
    detail:
      status.value?.database.latencyMs === null || status.value?.database.latencyMs === undefined
        ? '未取得延迟'
        : `${status.value.database.latencyMs} ms`,
    icon: Connection,
    tone: status.value?.database.status === 'connected' ? 'success' : 'danger',
  },
  {
    label: '运行时长',
    value: formatUptime(status.value?.service.uptimeSeconds ?? 0),
    detail: status.value ? `启动于 ${formatDateTime(status.value.service.startedAt)}` : '',
    icon: Clock,
    tone: 'info',
  },
  {
    label: '后台任务',
    value: status.value?.service.jobsEnabled ? '已启用' : '已停用',
    detail: `${status.value?.jobs.length ?? 0} 个任务`,
    icon: Setting,
    tone: status.value?.service.jobsEnabled ? 'primary' : 'warning',
  },
])

const jobStateLabels: Readonly<Record<JobState, string>> = {
  idle: '等待调度',
  running: '运行中',
  success: '上次成功',
  error: '上次失败',
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${minutes}分`
  return `${minutes}分钟`
}

function jobTagType(state: JobState): 'info' | 'primary' | 'success' | 'danger' {
  if (state === 'running') return 'primary'
  if (state === 'success') return 'success'
  if (state === 'error') return 'danger'
  return 'info'
}

function jobLabel(name: string): string {
  if (name === 'reservation-state') return '预约状态任务'
  if (name === 'statistics') return '统计快照任务'
  return name
}

function jobStateLabel(row: unknown): string {
  return jobStateLabels[(row as SystemJobStatus).state]
}

function validateForm(): boolean {
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key]
  const rules: ReadonlyArray<[string, number, number, number]> = [
    ['reservation.advanceDays', form.reservation.advanceDays, 1, 30],
    ['reservation.dailyLimit', form.reservation.dailyLimit, 1, 10],
    ['reservation.createPerMinute', form.reservation.createPerMinute, 1, 100],
    ['reservation.cancelPerMinute', form.reservation.cancelPerMinute, 1, 100],
    ['feedback.createPerMinute', form.feedback.createPerMinute, 1, 60],
    ['feedback.createPerHour', form.feedback.createPerHour, 1, 1000],
    ['violation.threshold', form.violation.threshold, 1, 20],
    ['violation.restrictionDays', form.violation.restrictionDays, 1, 90],
  ]
  for (const [field, value, minimum, maximum] of rules) {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      fieldErrors[field] = `必须为 ${minimum}-${maximum} 的整数`
    }
  }
  return Object.keys(fieldErrors).length === 0
}

function applySettings(settings: OperationalSettings) {
  Object.assign(form.reservation, settings.reservation)
  Object.assign(form.feedback, settings.feedback)
  Object.assign(form.violation, settings.violation)
}

async function load() {
  controller?.abort()
  controller = new AbortController()
  const current = ++sequence
  loading.value = true
  error.value = ''
  try {
    const [statusResult, settingsResult] = await Promise.all([
      getSystemStatus(controller.signal),
      getSystemSettings(),
    ])
    if (current !== sequence) return
    status.value = statusResult
    applySettings(settingsResult)
  } catch (cause) {
    if (cause instanceof RequestError && cause.kind === 'cancel') return
    if (current !== sequence) return
    error.value =
      cause instanceof RequestError
        ? `${cause.message}${cause.requestId ? `（请求 ID: ${cause.requestId}）` : ''}`
        : '系统状态加载失败'
  } finally {
    if (current === sequence) loading.value = false
  }
}

async function save() {
  if (!canEdit.value || saving.value || !validateForm()) return
  saving.value = true
  try {
    const result = await updateSystemSettings(form)
    applySettings(result)
    ElMessage.success('系统设置已更新并立即生效')
    await load()
  } catch (cause) {
    if (cause instanceof RequestError) {
      for (const [field, message] of Object.entries(cause.fields)) {
        fieldErrors[field] = message
      }
      ElMessage.error(cause.message)
    } else {
      ElMessage.error('系统设置保存失败')
    }
  } finally {
    saving.value = false
  }
}

async function copyRequestId() {
  const requestId = status.value?.requestId
  if (!requestId) return
  try {
    await navigator.clipboard.writeText(requestId)
    ElMessage.success('请求 ID 已复制')
  } catch {
    ElMessage.warning(`请求 ID：${requestId}`)
  }
}

onMounted(() => {
  void load()
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <section class="system-page" aria-labelledby="system-title">
    <header class="system-hero">
      <div>
        <p class="page-eyebrow">管理后台 / 系统运维</p>
        <h1 id="system-title">系统运维中心</h1>
        <p>检查服务与数据库状态，查看后台任务，并集中维护全局业务参数。</p>
      </div>
      <el-button type="primary" :icon="RefreshRight" :loading="loading" @click="load">
        刷新状态
      </el-button>
    </header>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="load">重新加载</el-button>
      </template>
    </el-alert>

    <div v-loading="loading" class="status-card-grid">
      <article
        v-for="card in statusCards"
        :key="card.label"
        class="status-card"
        :class="`status-${card.tone}`"
      >
        <div class="status-icon">
          <el-icon><component :is="card.icon" /></el-icon>
        </div>
        <div>
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small>{{ card.detail }}</small>
        </div>
      </article>
    </div>

    <section v-if="status" class="surface service-surface">
      <header class="surface-heading">
        <div>
          <p class="section-kicker">RUNTIME</p>
          <h2>运行信息</h2>
        </div>
        <span class="environment-pill">{{ status.service.environment }}</span>
      </header>
      <dl class="runtime-grid">
        <div>
          <dt>服务</dt>
          <dd>{{ status.service.name }} v{{ status.service.version }}</dd>
        </div>
        <div>
          <dt>当前业务时间</dt>
          <dd>{{ formatDateTime(status.service.currentTime) }}</dd>
        </div>
        <div>
          <dt>业务日期 / 时区</dt>
          <dd>{{ status.service.businessDate }} · {{ status.service.timezone }}</dd>
        </div>
        <div>
          <dt>代理信任跳数</dt>
          <dd>{{ status.service.trustProxy }}</dd>
        </div>
        <div class="request-id-cell">
          <dt>本次请求 ID</dt>
          <dd>
            <code>{{ status.requestId || '—' }}</code>
            <el-button
              link
              type="primary"
              :icon="CopyDocument"
              :disabled="!status.requestId"
              @click="copyRequestId"
            >
              复制
            </el-button>
          </dd>
        </div>
      </dl>
    </section>

    <section v-if="status" class="surface jobs-surface">
      <header class="surface-heading">
        <div>
          <p class="section-kicker">BACKGROUND JOBS</p>
          <h2>后台任务</h2>
        </div>
        <el-tag :type="status.service.jobsEnabled ? 'success' : 'info'" effect="light" round>
          {{ status.service.jobsEnabled ? '调度已启用' : '调度已停用' }}
        </el-tag>
      </header>
      <el-table :data="status.jobs" border stripe>
        <el-table-column label="任务" min-width="170">
          <template #default="{ row }">{{ jobLabel(row.name) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="jobTagType(row.state)" effect="light" round>
              {{ jobStateLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近完成" width="165">
          <template #default="{ row }">
            {{ row.lastFinishedAt ? formatDateTime(row.lastFinishedAt) : '尚未运行' }}
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="90">
          <template #default="{ row }">
            {{ row.lastDurationMs === null ? '—' : `${row.lastDurationMs} ms` }}
          </template>
        </el-table-column>
        <el-table-column prop="consecutiveFailures" label="连续失败" width="90" />
        <el-table-column label="最近错误" min-width="130">
          <template #default="{ row }">{{ row.lastErrorName || '—' }}</template>
        </el-table-column>
        <template #empty>
          <el-empty description="当前没有可显示的后台任务" :image-size="72" />
        </template>
      </el-table>
    </section>

    <section class="surface settings-surface">
      <header class="surface-heading">
        <div>
          <p class="section-kicker">BUSINESS SETTINGS</p>
          <h2>全局业务参数</h2>
        </div>
        <el-tag :type="canEdit ? 'warning' : 'info'" effect="light" round>
          {{ canEdit ? '超级管理员可修改' : '只读' }}
        </el-tag>
      </header>
      <el-alert
        v-if="!canEdit"
        type="info"
        title="普通管理员可以查看配置，但只有超级管理员可以修改。"
        :closable="false"
        show-icon
      />

      <form class="settings-form" @submit.prevent="save">
        <fieldset :disabled="!canEdit || saving">
          <legend>预约策略</legend>
          <div class="settings-grid">
            <label>
              <span>预约窗口（天）</span>
              <input v-model.number="form.reservation.advanceDays" type="number" min="1" max="30" />
              <small>影响首页日期范围和预约日期校验</small>
              <em v-if="fieldErrors['reservation.advanceDays']">
                {{ fieldErrors['reservation.advanceDays'] }}
              </em>
            </label>
            <label>
              <span>每日有效预约上限</span>
              <input v-model.number="form.reservation.dailyLimit" type="number" min="1" max="10" />
              <small>待签到和已签到预约计入上限</small>
              <em v-if="fieldErrors['reservation.dailyLimit']">
                {{ fieldErrors['reservation.dailyLimit'] }}
              </em>
            </label>
            <label>
              <span>创建预约限流（次/分钟）</span>
              <input
                v-model.number="form.reservation.createPerMinute"
                type="number"
                min="1"
                max="100"
              />
              <em v-if="fieldErrors['reservation.createPerMinute']">
                {{ fieldErrors['reservation.createPerMinute'] }}
              </em>
            </label>
            <label>
              <span>取消预约限流（次/分钟）</span>
              <input
                v-model.number="form.reservation.cancelPerMinute"
                type="number"
                min="1"
                max="100"
              />
              <em v-if="fieldErrors['reservation.cancelPerMinute']">
                {{ fieldErrors['reservation.cancelPerMinute'] }}
              </em>
            </label>
          </div>
        </fieldset>

        <fieldset :disabled="!canEdit || saving">
          <legend>反馈与违约</legend>
          <div class="settings-grid">
            <label>
              <span>反馈提交（次/分钟）</span>
              <input
                v-model.number="form.feedback.createPerMinute"
                type="number"
                min="1"
                max="60"
              />
              <em v-if="fieldErrors['feedback.createPerMinute']">
                {{ fieldErrors['feedback.createPerMinute'] }}
              </em>
            </label>
            <label>
              <span>反馈提交（次/小时）</span>
              <input
                v-model.number="form.feedback.createPerHour"
                type="number"
                min="1"
                max="1000"
              />
              <em v-if="fieldErrors['feedback.createPerHour']">
                {{ fieldErrors['feedback.createPerHour'] }}
              </em>
            </label>
            <label>
              <span>违约限制阈值（次）</span>
              <input v-model.number="form.violation.threshold" type="number" min="1" max="20" />
              <em v-if="fieldErrors['violation.threshold']">
                {{ fieldErrors['violation.threshold'] }}
              </em>
            </label>
            <label>
              <span>限制天数（天）</span>
              <input
                v-model.number="form.violation.restrictionDays"
                type="number"
                min="1"
                max="90"
              />
              <em v-if="fieldErrors['violation.restrictionDays']">
                {{ fieldErrors['violation.restrictionDays'] }}
              </em>
            </label>
          </div>
        </fieldset>

        <div class="settings-footer">
          <p>保存后当前实例立即生效；多实例部署最多可能有 30 秒缓存差异。</p>
          <el-button
            native-type="submit"
            type="primary"
            :loading="saving"
            :disabled="!canEdit || saving"
          >
            {{ saving ? '正在保存…' : '保存设置' }}
          </el-button>
        </div>
      </form>
    </section>
  </section>
</template>

<style scoped>
.system-page {
  display: grid;
  gap: 16px;
}

.system-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding: 26px 28px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background:
    radial-gradient(
      circle at 88% 8%,
      color-mix(in srgb, var(--accent) 18%, transparent),
      transparent 30%
    ),
    linear-gradient(135deg, var(--surface), var(--accent-soft));
}

.page-eyebrow,
.section-kicker {
  margin: 0;
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.12em;
}

.system-hero h1 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: clamp(1.7rem, 2.8vw, 2.4rem);
  letter-spacing: -0.045em;
}

.system-hero p:last-child {
  max-width: 700px;
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.status-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  min-height: 115px;
}

.status-card {
  display: flex;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.status-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 8px;
}

.status-success .status-icon {
  color: var(--status-ok);
  background: var(--status-ok-tint);
}

.status-danger .status-icon {
  color: var(--status-bad);
  background: var(--status-bad-tint);
}

.status-info .status-icon {
  color: var(--status-info);
  background: var(--status-info-tint);
}

.status-primary .status-icon {
  color: var(--accent);
  background: var(--accent-soft);
}

.status-warning .status-icon {
  color: var(--status-warn);
  background: var(--status-warn-tint);
}

.status-card > div:last-child {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.status-card span,
.status-card small {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.status-card strong {
  color: var(--text);
  font-size: 1.22rem;
}

.surface {
  display: grid;
  gap: 15px;
  padding: 19px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.surface-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.surface-heading h2 {
  margin: 4px 0 0;
  color: var(--text);
  font-size: 1.02rem;
}

.environment-pill {
  padding: 4px 9px;
  border-radius: 999px;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 0.68rem;
  font-weight: 700;
}

.runtime-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 18px;
  margin: 0;
}

.runtime-grid dt {
  margin-bottom: 4px;
  color: var(--text-muted);
  font-size: 0.7rem;
}

.runtime-grid dd {
  margin: 0;
  color: var(--text);
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}

.request-id-cell {
  grid-column: span 2;
}

.request-id-cell dd {
  display: flex;
  align-items: center;
  gap: 7px;
}

.settings-form {
  display: grid;
  gap: 16px;
}

.settings-form fieldset {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 9px;
}

.settings-form fieldset:disabled {
  opacity: 0.76;
}

.settings-form legend {
  padding: 0 6px;
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 700;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.settings-grid label {
  display: grid;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 0.74rem;
}

.settings-grid input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  color: var(--text);
  background: var(--surface);
}

.settings-grid small {
  color: var(--text-muted);
  font-size: 0.66rem;
}

.settings-grid em {
  color: var(--status-bad);
  font-size: 0.68rem;
  font-style: normal;
}

.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.settings-footer p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.72rem;
}

@media (max-width: 1080px) {
  .status-card-grid,
  .settings-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .runtime-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .system-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 21px;
  }

  .status-card-grid,
  .settings-grid,
  .runtime-grid {
    grid-template-columns: 1fr;
  }

  .request-id-cell {
    grid-column: auto;
  }

  .surface {
    padding: 15px;
  }

  .settings-footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
