<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionState } from '../types/status'

const { title, subtitle, kind, endpoint, state, description } = defineProps<{
  title: string
  subtitle: string
  kind: 'server' | 'database'
  endpoint: string
  state: ConnectionState
  description: string
}>()

const stateLabels: Record<ConnectionState, string> = {
  checking: '检测中',
  healthy: '连接正常',
  unhealthy: '连接异常',
  unknown: '状态未知',
}
const stateLabel = computed(() => stateLabels[state])
</script>

<template>
  <section class="connection-card" :data-state="state" :aria-label="title">
    <div class="card-heading">
      <span class="service-icon" aria-hidden="true">
        <svg v-if="kind === 'server'" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="6" rx="2" />
          <rect x="4" y="14" width="16" height="6" rx="2" />
          <path d="M8 7h.01M8 17h.01M15 7h2M15 17h2" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
          <path
            d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"
          />
        </svg>
      </span>
      <div class="card-titles">
        <h3 class="card-title">{{ title }}</h3>
        <p class="card-subtitle">{{ subtitle }}</p>
      </div>
      <span class="card-state" role="status" aria-live="polite" aria-atomic="true">
        <span class="sr-only">{{ title }}：</span>
        <svg
          v-if="state === 'healthy'"
          class="state-check"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m4 8 2.5 2.5L12 5"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span v-else-if="state === 'checking'" class="spinner" aria-hidden="true" />
        <span v-else class="state-symbol" aria-hidden="true">{{
          state === 'unknown' ? '?' : '!'
        }}</span>
        {{ stateLabel }}
      </span>
    </div>
    <p class="card-description">{{ description }}</p>
    <div class="card-endpoint">
      <span class="request-method">GET</span>
      <code class="endpoint-path">{{ endpoint }}</code>
      <svg class="endpoint-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="m5.5 4-4 4 4 4m5-8 4 4-4 4"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </section>
</template>

<style scoped>
.connection-card {
  --state-color: #796134;
  --state-background: #f7f0e3;
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 2px 3px #263f3003;
}

.connection-card[data-state='healthy'] {
  --state-color: #3b6848;
  --state-background: #eef5e9;
}

.connection-card[data-state='unhealthy'] {
  --state-color: #ab4237;
  --state-background: #fcf0ed;
}

.connection-card[data-state='checking'] {
  --state-color: #42698c;
  --state-background: #eef3f9;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid #e5eadd;
  border-radius: 12px;
  color: #546e4d;
  background: #f5f7f0;
}

.service-icon svg {
  width: 23px;
  height: 23px;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.card-titles {
  min-width: 0;
}

.card-subtitle {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.card-state {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 5px 9px;
  border: 1px solid color-mix(in srgb, var(--state-color) 10%, transparent);
  border-radius: 6px;
  color: var(--state-color);
  background: var(--state-background);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.5;
}

.state-check {
  width: 14px;
  height: 14px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.state-symbol {
  display: grid;
  width: 13px;
  height: 13px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.card-description {
  margin: 20px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.card-endpoint {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #edf0e9;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
}

.request-method {
  flex-shrink: 0;
  padding: 2px 5px;
  border-radius: 4px;
  color: #526949;
  background: #f0f3eb;
  font-size: 9px;
  font-weight: 600;
  line-height: 1.5;
}

.endpoint-path {
  min-width: 0;
  overflow-wrap: anywhere;
}

.endpoint-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-left: auto;
  color: #929f8d;
}

.spinner {
  width: 11px;
  height: 11px;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}

@media (max-width: 600px) {
  .connection-card {
    padding: 16px;
    border-radius: 12px;
  }

  .card-heading {
    gap: 10px;
  }
  .service-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
  .service-icon svg {
    width: 20px;
    height: 20px;
  }
  .card-title {
    font-size: 14px;
  }
  .card-subtitle {
    margin-top: 2px;
    font-size: 10px;
  }
  .card-state {
    gap: 3px;
    padding: 4px 6px;
    font-size: 10px;
  }
  .card-description {
    margin-top: 12px;
    font-size: 11px;
  }
  .card-endpoint {
    margin-top: 12px;
    padding-top: 10px;
    font-size: 10px;
  }
}
</style>
