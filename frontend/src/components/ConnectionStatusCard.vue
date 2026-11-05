<script setup lang="ts">
import {
  CircleCheck,
  Coin,
  Loading,
  Monitor,
  QuestionFilled,
  Warning,
} from '@element-plus/icons-vue'
import { computed } from 'vue'

const { title, caption, kind, endpoint, state, description } = defineProps<{
  title: string
  caption: string
  kind: 'server' | 'database'
  endpoint: string
  state: 'checking' | 'healthy' | 'unhealthy' | 'unknown'
  description: string
}>()

const stateMeta = {
  checking: { label: '检测中', tagType: 'info', icon: Loading },
  healthy: { label: '正常', tagType: 'success', icon: CircleCheck },
  unhealthy: { label: '异常', tagType: 'danger', icon: Warning },
  unknown: { label: '未知', tagType: 'warning', icon: QuestionFilled },
} as const

const serviceIcon = computed(() => (kind === 'server' ? Monitor : Coin))
const currentState = computed(() => stateMeta[state])
</script>

<template>
  <el-card
    class="connection-card"
    :class="`connection-card--${state}`"
    shadow="never"
    tag="article"
    :aria-label="title"
  >
    <template #header>
      <div class="card-header">
        <span class="service-icon" aria-hidden="true">
          <el-icon><component :is="serviceIcon" /></el-icon>
        </span>
        <div class="card-heading">
          <h3 class="card-title">{{ title }}</h3>
          <p class="card-caption">{{ caption }}</p>
        </div>
        <el-tag
          class="card-state"
          :type="currentState.tagType"
          effect="light"
          round
          role="status"
          aria-live="polite"
        >
          <el-icon :class="{ 'is-spinning': state === 'checking' }" aria-hidden="true">
            <component :is="currentState.icon" />
          </el-icon>
          {{ currentState.label }}
        </el-tag>
      </div>
    </template>

    <p class="card-description">{{ description }}</p>

    <footer class="card-footer">
      <el-tag class="endpoint-method" size="small" effect="plain">GET</el-tag>
      <code class="endpoint" :title="endpoint">{{ endpoint }}</code>
    </footer>
  </el-card>
</template>

<style scoped>
.connection-card {
  --state-color: var(--status-ok);
  --state-border: var(--status-ok-border);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  transition:
    border-color 200ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.connection-card--unhealthy {
  --state-color: var(--status-bad);
  --state-border: var(--status-bad-border);
}

.connection-card--unknown {
  --state-color: var(--status-warn);
  --state-border: var(--status-warn-border);
}

.connection-card--checking {
  --state-color: var(--status-info);
  --state-border: var(--status-info-border);
}

.card-header {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.service-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--status-info-border);
  border-radius: 8px;
  color: var(--accent);
  background: var(--blue-50);
  font-size: 20px;
}

.card-heading {
  min-width: 0;
}

.card-title {
  margin: 0;
  color: var(--text);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5rem;
}

.card-caption {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1rem;
}

.card-state {
  flex-shrink: 0;
  margin-inline-start: auto;
  font-weight: 600;
}

.card-state .el-icon {
  margin-inline-end: 4px;
  font-size: 12px;
}

.card-description {
  min-height: 0;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5rem;
}

.card-footer {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.endpoint-method {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
}

.endpoint {
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-card :deep(.el-card__header) {
  padding: 24px 24px 0;
  border-bottom: 0;
}

.connection-card :deep(.el-card__body) {
  padding: 16px 24px 24px;
}

.is-spinning {
  animation: spin 900ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (hover: hover) {
  .connection-card:hover {
    border-color: var(--state-border);
    box-shadow: var(--shadow-raised);
  }
}

@media (max-width: 600px) {
  .card-header {
    flex-wrap: wrap;
  }

  .connection-card :deep(.el-card__header),
  .connection-card :deep(.el-card__body) {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .connection-card {
    transition: none;
  }

  .is-spinning {
    animation: none;
  }
}
</style>
