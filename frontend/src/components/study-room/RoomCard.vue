<script setup lang="ts">
import { ArrowRight, Location } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { StudyRoomSummary } from '../../types/study-room'
import { roomStatusLabels, roomStatusTagType } from '../../utils/study-room'

const props = defineProps<{
  room: StudyRoomSummary
}>()

const availability = computed(() => props.room.availableSeatCount ?? props.room.bookableSeatCount)
</script>

<template>
  <article class="room-card">
    <div class="room-card-accent" :class="`status-${room.status}`" aria-hidden="true" />
    <div class="room-card-heading">
      <div>
        <h2>{{ room.name }}</h2>
        <p class="room-location">
          <el-icon><Location /></el-icon>{{ room.location }}
        </p>
      </div>
      <el-tag :type="roomStatusTagType(room.status)" effect="plain" round>
        {{ roomStatusLabels[room.status] }}
      </el-tag>
    </div>
    <p class="room-description">{{ room.description || '暂无使用说明' }}</p>
    <div v-if="room.matchedSlot" class="matched-slot">
      <span>{{ room.matchedSlot.label }}</span>
      <strong>{{ room.matchedSlot.startTime }}–{{ room.matchedSlot.endTime }}</strong>
    </div>
    <div class="room-metrics">
      <div>
        <span>{{ room.availableSeatCount === undefined ? '静态可预约座位' : '当前时段可用' }}</span>
        <strong>{{ availability }}</strong>
      </div>
      <div>
        <span>座位总数</span>
        <strong>{{ room.seatCount }}</strong>
      </div>
      <div>
        <span>网格布局</span>
        <strong>{{ room.grid.rows }} × {{ room.grid.columns }}</strong>
      </div>
    </div>
    <RouterLink class="room-card-action" :to="`/study-rooms/${room.id}`">
      查看座位
      <el-icon><ArrowRight /></el-icon>
    </RouterLink>
  </article>
</template>

<style scoped>
.room-card {
  position: relative;
  display: grid;
  gap: 18px;
  min-height: 280px;
  padding: 24px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.room-card-accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--status-info);
}

.room-card-accent.status-open {
  background: var(--status-ok);
}

.room-card-accent.status-disabled {
  background: var(--status-bad);
}

.room-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.room-card-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}

.room-location {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 7px 0 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.room-description {
  min-height: 42px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.65;
}

.matched-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 0.8rem;
}

.room-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.room-metrics div {
  display: grid;
  gap: 4px;
}

.room-metrics span {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.room-metrics strong {
  color: var(--text);
  font-size: 0.95rem;
}

.room-card-action {
  display: inline-flex;
  align-items: center;
  align-self: end;
  gap: 6px;
  color: var(--accent);
  font-size: 0.84rem;
  font-weight: 700;
  text-decoration: none;
}

.room-card-action:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 520px) {
  .room-card {
    min-height: 0;
    padding: 20px;
  }

  .room-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
