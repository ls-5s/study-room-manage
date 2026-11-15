<script setup lang="ts">
import { computed } from 'vue'
import type {
  AdminFeedbackDetail,
  FeedbackStatus,
  FeedbackTargetStatus,
} from '../../types/feedback'
import { formatDateTime } from '../../utils/reservation'
import {
  feedbackLocationLabel,
  feedbackStatusLabels,
  feedbackStatusTagType,
  feedbackTypeLabels,
} from '../../utils/feedback'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  ticket: AdminFeedbackDetail | null
  loading: boolean
  actionBusy: boolean
}>()
const emit = defineEmits<{
  transition: [status: FeedbackTargetStatus]
}>()

const timeline = computed(() => {
  if (!props.ticket) return []
  return [
    {
      id: 'created',
      toStatus: 'pending' as FeedbackStatus,
      occurredAt: props.ticket.createdAt,
      operator: props.ticket.student.displayName,
      label: '提交工单',
    },
    ...props.ticket.timeline.map((item) => ({
      id: item.id,
      toStatus: item.toStatus,
      occurredAt: item.occurredAt,
      operator: item.operator?.displayName ?? '系统',
      label: timelineTitle(item.toStatus),
    })),
  ]
})

function timelineTitle(status: FeedbackStatus): string {
  if (status === 'processing') return '开始处理'
  if (status === 'resolved') return '标记已解决'
  if (status === 'rejected') return '驳回工单'
  return '提交工单'
}
</script>

<template>
  <el-drawer v-model="open" title="工单详情" size="min(560px, 100vw)" destroy-on-close>
    <div v-loading="props.loading" class="drawer-body">
      <template v-if="props.ticket">
        <header class="ticket-heading">
          <div>
            <p class="ticket-number">工单 #{{ props.ticket.id }}</p>
            <h2>{{ feedbackTypeLabels[props.ticket.type] }}</h2>
          </div>
          <el-tag :type="feedbackStatusTagType(props.ticket.status)" effect="light" round>
            {{ feedbackStatusLabels[props.ticket.status] }}
          </el-tag>
        </header>

        <section class="ticket-section">
          <h3>来源信息</h3>
          <dl class="detail-grid">
            <div>
              <dt>提交学生</dt>
              <dd>
                {{ props.ticket.student.displayName || '—' }}
                <small>{{ props.ticket.student.studentNo }}</small>
              </dd>
            </div>
            <div>
              <dt>关联资源</dt>
              <dd>{{ feedbackLocationLabel(props.ticket) }}</dd>
            </div>
            <div>
              <dt>提交时间</dt>
              <dd>{{ formatDateTime(props.ticket.createdAt) }}</dd>
            </div>
            <div>
              <dt>最后处理人</dt>
              <dd>{{ props.ticket.handledBy?.displayName || '尚未处理' }}</dd>
            </div>
          </dl>
        </section>

        <section class="ticket-section">
          <h3>问题描述</h3>
          <p class="long-text">{{ props.ticket.description }}</p>
        </section>

        <section v-if="props.ticket.result" class="ticket-section result-section">
          <h3>处理结果</h3>
          <p class="long-text">{{ props.ticket.result }}</p>
        </section>

        <section class="ticket-section">
          <h3>处理时间线</h3>
          <el-timeline class="ticket-timeline">
            <el-timeline-item
              v-for="item in timeline"
              :key="item.id"
              :timestamp="formatDateTime(item.occurredAt)"
              placement="top"
              :type="feedbackStatusTagType(item.toStatus)"
            >
              <strong>{{ item.label }}</strong>
              <p>{{ item.operator }}</p>
            </el-timeline-item>
          </el-timeline>
        </section>
      </template>
      <el-empty v-else-if="!props.loading" description="请选择一条反馈工单" />
    </div>

    <template v-if="props.ticket" #footer>
      <div class="drawer-actions">
        <template v-if="props.ticket.status === 'pending'">
          <el-button
            type="primary"
            :loading="props.actionBusy"
            :disabled="props.actionBusy"
            @click="emit('transition', 'processing')"
          >
            开始处理
          </el-button>
          <el-button
            type="danger"
            plain
            :disabled="props.actionBusy"
            @click="emit('transition', 'rejected')"
          >
            驳回
          </el-button>
        </template>
        <template v-else-if="props.ticket.status === 'processing'">
          <el-button
            type="success"
            :disabled="props.actionBusy"
            @click="emit('transition', 'resolved')"
          >
            标记解决
          </el-button>
          <el-button
            type="danger"
            plain
            :disabled="props.actionBusy"
            @click="emit('transition', 'rejected')"
          >
            驳回
          </el-button>
        </template>
        <span v-else class="closed-note">该工单已结束，不能再次修改。</span>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-body {
  min-height: 240px;
}

.ticket-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.ticket-number {
  margin: 0 0 5px;
  color: var(--text-muted);
  font-size: 0.74rem;
  font-weight: 650;
  letter-spacing: 0.06em;
}

.ticket-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.25rem;
}

.ticket-section {
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
}

.ticket-section:last-child {
  border-bottom: 0;
}

.ticket-section h3 {
  margin: 0 0 12px;
  color: var(--text);
  font-size: 0.88rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.detail-grid div {
  min-width: 0;
}

.detail-grid dt {
  margin-bottom: 4px;
  color: var(--text-muted);
  font-size: 0.72rem;
}

.detail-grid dd {
  margin: 0;
  color: var(--text);
  font-size: 0.82rem;
  line-height: 1.55;
}

.detail-grid small {
  display: block;
  margin-top: 2px;
  color: var(--text-muted);
}

.long-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.result-section {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid var(--status-ok-border);
  border-radius: 9px;
  background: var(--status-ok-tint);
}

.ticket-timeline {
  padding-left: 2px;
}

.ticket-timeline strong {
  color: var(--text);
  font-size: 0.82rem;
}

.ticket-timeline p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 0.74rem;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.closed-note {
  color: var(--text-muted);
  font-size: 0.78rem;
}

@media (max-width: 560px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
