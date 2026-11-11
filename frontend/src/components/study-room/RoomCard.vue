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
    <div class="room-visual" :class="`room-visual-${room.status}`" aria-hidden="true">
      <div class="room-visual-meta">
        <span>STUDY SPACE</span>
        <small>{{ room.grid.rows }} × {{ room.grid.columns }}</small>
      </div>
      <div class="room-seat-plan">
        <span v-for="index in 24" :key="index" :class="{ active: index % 7 === 0 }" />
      </div>
    </div>

    <div class="room-card-body">
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
          <span>
            {{ room.availableSeatCount === undefined ? '静态可预约座位' : '当前时段可用' }}
          </span>
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
        <span>查看座位</span>
        <el-icon><ArrowRight /></el-icon>
      </RouterLink>
    </div>
  </article>
</template>

<style scoped>
.room-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  transition:
    border-color 300ms var(--ease-out),
    box-shadow 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.room-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-raised);
  transform: translateY(-2px);
}

.room-visual {
  position: relative;
  display: grid;
  min-height: 140px;
  padding: 20px;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(circle at 82% 14%, var(--gradient-accent), transparent 40%),
    radial-gradient(circle at 12% 110%, var(--gradient-secondary), transparent 44%),
    linear-gradient(
      135deg,
      var(--surface-muted),
      color-mix(in srgb, var(--surface) 78%, var(--accent-soft))
    );
}

.room-visual::after {
  position: absolute;
  right: -38px;
  bottom: -64px;
  width: 180px;
  height: 180px;
  border: 1px solid var(--border);
  border-radius: 50%;
  content: '';
}

.room-visual-disabled {
  opacity: 0.72;
}

.room-visual-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.room-visual-meta small {
  font-size: 0.75rem;
  letter-spacing: 0;
}

.room-seat-plan {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
  align-self: end;
  margin-top: 24px;
}

.room-seat-plan span {
  aspect-ratio: 1.8;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: color-mix(in srgb, var(--surface) 48%, transparent);
}

.room-seat-plan span.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.room-card-body {
  display: grid;
  gap: 20px;
  padding: 24px;
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
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.4;
}

.room-location {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.room-description {
  min-height: 48px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.65;
}

.matched-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 0.875rem;
}

.room-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.room-metrics div {
  display: grid;
  gap: 4px;
}

.room-metrics span {
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.3;
}

.room-metrics strong {
  color: var(--text);
  font-size: 1rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.room-card-action {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition:
    color 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.room-card-action:hover {
  color: var(--accent);
  transform: translateX(2px);
}

@media (max-width: 520px) {
  .room-card {
    border-radius: var(--radius-md);
  }

  .room-card-body {
    padding: 20px;
  }

  .room-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
