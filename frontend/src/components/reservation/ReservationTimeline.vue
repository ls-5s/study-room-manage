<script setup lang="ts">
import { computed } from 'vue'
import type { ReservationTimelineItem } from '../../types/reservation'
import {
  formatDateTime,
  reservationStatusLabels,
  timelineActorLabel,
} from '../../utils/reservation'

const props = defineProps<{
  items: ReservationTimelineItem[]
}>()

const entries = computed(() =>
  props.items.map((item) => ({
    key: `${item.occurredAt}-${item.toStatus}`,
    time: formatDateTime(item.occurredAt),
    title: item.fromStatus
      ? `${reservationStatusLabels[item.fromStatus]} → ${reservationStatusLabels[item.toStatus]}`
      : reservationStatusLabels[item.toStatus],
    actor: timelineActorLabel(item.actorType),
    reason: item.reason,
  })),
)
</script>

<template>
  <el-empty v-if="entries.length === 0" :image-size="64" description="暂无状态记录" />
  <el-timeline v-else class="reservation-timeline">
    <el-timeline-item
      v-for="entry in entries"
      :key="entry.key"
      :timestamp="entry.time"
      placement="top"
    >
      <div class="timeline-entry">
        <strong>{{ entry.title }}</strong>
        <el-tag size="small" effect="plain" type="info">{{ entry.actor }}</el-tag>
        <p v-if="entry.reason">{{ entry.reason }}</p>
      </div>
    </el-timeline-item>
  </el-timeline>
</template>

<style scoped>
.reservation-timeline {
  padding-left: 4px;
}

.timeline-entry {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-entry strong {
  color: var(--text);
  font-size: 0.86rem;
}

.timeline-entry p {
  flex-basis: 100%;
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}
</style>
