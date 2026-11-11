<script setup lang="ts">
import type { TimeSlot } from '../../types/study-room'

defineProps<{
  slots: TimeSlot[]
  selectedId: string
  disabledIds: ReadonlySet<string>
}>()

const emit = defineEmits<{
  select: [slot: TimeSlot]
}>()
</script>

<template>
  <div class="slot-picker" role="radiogroup" aria-label="选择开放时段">
    <button
      v-for="slot in slots"
      :key="slot.id"
      type="button"
      role="radio"
      :aria-checked="slot.id === selectedId"
      :disabled="disabledIds.has(slot.id)"
      class="slot-option"
      :class="{ selected: slot.id === selectedId }"
      @click="emit('select', slot)"
    >
      <span>{{ slot.label }}</span>
      <strong>{{ slot.startTime }}–{{ slot.endTime }}</strong>
      <small v-if="disabledIds.has(slot.id)">已结束</small>
    </button>
  </div>
</template>

<style scoped>
.slot-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.slot-option {
  display: grid;
  min-width: 138px;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text-secondary);
  background: var(--surface);
  text-align: left;
  cursor: pointer;
}

.slot-option:hover:not(:disabled) {
  border-color: var(--accent);
}

.slot-option.selected {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.slot-option:disabled {
  color: var(--text-muted);
  background: var(--surface-muted);
  cursor: not-allowed;
  opacity: 0.7;
}

.slot-option span {
  font-size: 0.78rem;
}

.slot-option strong {
  font-size: 0.88rem;
}

.slot-option small {
  color: var(--status-bad);
  font-size: 0.68rem;
}
</style>
