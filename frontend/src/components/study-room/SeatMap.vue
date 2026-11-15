<script setup lang="ts">
import { computed } from 'vue'
import type { RoomGrid, SeatMapSeat } from '../../types/study-room'
import { seatStatusLabels } from '../../utils/study-room'

const props = defineProps<{
  grid: RoomGrid
  seats: SeatMapSeat[]
  selectedId: string
  allowUnavailable?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [seat: SeatMapSeat]
}>()

const cells = computed(() => {
  const seatByPosition = new Map(props.seats.map((seat) => [`${seat.row}:${seat.column}`, seat]))
  return Array.from({ length: props.grid.rows }, (_, rowIndex) =>
    Array.from(
      { length: props.grid.columns },
      (_, columnIndex) => seatByPosition.get(`${rowIndex + 1}:${columnIndex + 1}`) ?? null,
    ),
  )
})
</script>

<template>
  <div class="seat-map-shell">
    <div class="front-marker">讲台 / 入口方向</div>
    <div
      class="seat-map"
      :style="{ '--seat-columns': String(grid.columns) }"
      role="grid"
      :aria-label="`座位平面图，共 ${grid.rows} 行 ${grid.columns} 列`"
    >
      <template v-for="(row, rowIndex) in cells" :key="rowIndex">
        <div
          v-for="(seat, columnIndex) in row"
          :key="seat?.id ?? `aisle-${rowIndex}-${columnIndex}`"
          class="seat-cell"
          role="gridcell"
        >
          <button
            v-if="seat"
            type="button"
            class="seat"
            :class="[`status-${seat.status}`, { selected: seat.id === selectedId }]"
            :disabled="disabled || (!allowUnavailable && seat.status !== 'available')"
            :aria-label="`${seat.seatNo}，${seatStatusLabels[seat.status]}${seat.disabledReason ? `，${seat.disabledReason}` : ''}`"
            :title="seat.disabledReason ?? seatStatusLabels[seat.status]"
            @click="emit('select', seat)"
          >
            {{ seat.seatNo }}
          </button>
          <span v-else class="aisle" aria-hidden="true" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.seat-map-shell {
  display: grid;
  gap: 14px;
  min-width: 0;
  overflow-x: auto;
  padding-bottom: 8px;
}

.front-marker {
  min-width: max-content;
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--text-muted);
  background: var(--surface-muted);
  font-size: 0.75rem;
  text-align: center;
}

.seat-map {
  display: grid;
  grid-template-columns: repeat(var(--seat-columns), minmax(58px, 1fr));
  gap: 7px;
  min-width: max-content;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px), var(--surface-muted);
  background-size: 28px 28px;
}

.seat-cell {
  display: grid;
  min-height: 48px;
}

.seat {
  min-width: 0;
  min-height: 48px;
  padding: 6px 4px;
  border: 1px solid var(--status-ok-border);
  border-radius: var(--radius-sm);
  color: var(--status-ok);
  background: var(--status-ok-tint);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.seat:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-raised);
}

.seat.selected {
  color: var(--accent-contrast);
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.seat.status-reserved {
  border-color: var(--status-warn-border);
  color: var(--status-warn);
  background: var(--status-warn-tint);
  cursor: not-allowed;
}

.seat.status-maintenance {
  border-color: var(--status-info-border);
  color: var(--status-info);
  background: var(--status-info-tint);
  cursor: not-allowed;
}

.seat.status-disabled {
  border-color: var(--status-bad-border);
  color: var(--status-bad);
  background: var(--status-bad-tint);
  cursor: not-allowed;
}

.aisle {
  border-radius: var(--radius-sm);
  background: transparent;
}

@media (max-width: 640px) {
  .seat-map {
    grid-template-columns: repeat(var(--seat-columns), 54px);
    padding: 12px;
  }

  .seat-cell,
  .seat {
    min-height: 44px;
  }
}
</style>
