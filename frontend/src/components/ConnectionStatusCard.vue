<script setup lang="ts">
const { title, caption, kind, endpoint, state, description } = defineProps<{
  title: string
  caption: string
  kind: 'server' | 'database'
  endpoint: string
  state: 'checking' | 'healthy' | 'unhealthy' | 'unknown'
  description: string
}>()

const stateLabels = {
  checking: '检测中',
  healthy: '正常',
  unhealthy: '异常',
  unknown: '未知',
} as const
</script>

<template>
  <article class="connection-card" :data-state="state" :aria-label="title">
    <span class="state-bar" aria-hidden="true" />

    <header class="card-header">
      <span class="service-icon" aria-hidden="true">
        <svg v-if="kind === 'server'" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="5" rx="1.5" />
          <rect x="3" y="11" width="14" height="5" rx="1.5" />
          <path d="M6 6.5h.01M6 13.5h.01M12 6.5h2M12 13.5h2" />
        </svg>
        <svg v-else viewBox="0 0 20 20" fill="none">
          <ellipse cx="10" cy="5" rx="6" ry="2.4" />
          <path
            d="M4 5v5c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4V5M4 10v5c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4v-5"
          />
        </svg>
      </span>
      <div class="card-heading">
        <h2 class="card-title">{{ title }}</h2>
        <p class="card-caption">{{ caption }}</p>
      </div>
      <p class="card-state" role="status" aria-live="polite">
        <span class="state-dot" aria-hidden="true" />
        {{ stateLabels[state] }}
      </p>
    </header>

    <p class="card-description">{{ description }}</p>

    <footer class="card-footer">
      <span class="endpoint">
        <span class="endpoint-method">GET</span>
        <code>{{ endpoint }}</code>
      </span>
      <span class="endpoint-arrow" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </footer>
  </article>
</template>

<style scoped>
.connection-card {
  --state-color: var(--status-ok);
  --state-tint: var(--status-ok-tint);
  position: relative;
  overflow: hidden;
  padding: 20px 20px 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.connection-card:hover {
  border-color: var(--border-strong);
  box-shadow: 0 8px 20px -16px #24342b66;
}

.connection-card[data-state='unhealthy'] {
  --state-color: var(--status-bad);
  --state-tint: var(--status-bad-tint);
  border-color: var(--status-bad-border);
}

.connection-card[data-state='unknown'] {
  --state-color: var(--status-warn);
  --state-tint: var(--status-warn-tint);
}

.connection-card[data-state='checking'] {
  --state-color: var(--status-info);
  --state-tint: var(--status-info-tint);
}

.state-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--state-color);
  opacity: 0.9;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 11px;
}

.service-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9px;
  color: var(--accent);
  background: var(--accent-soft);
}

.service-icon svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.card-heading {
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 620;
  line-height: 1.35;
}

.card-caption {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.4;
}

.card-state {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  margin: 0 0 0 auto;
  padding: 3px 9px;
  border-radius: 999px;
  color: var(--state-color);
  background: var(--state-tint);
  font-size: 10.5px;
  font-weight: 620;
  line-height: 1.6;
}

.state-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.card-description {
  margin: 15px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.65;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.endpoint {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 10.5px;
}

.endpoint-method {
  flex-shrink: 0;
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.endpoint code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.endpoint-arrow {
  display: inline-flex;
  flex-shrink: 0;
  margin-left: auto;
  color: var(--text-muted);
}

.endpoint-arrow svg {
  width: 13px;
  height: 13px;
}

@media (max-width: 480px) {
  .connection-card {
    padding: 16px 16px 15px;
  }
}
</style>
