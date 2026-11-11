<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { RoomGrid, SeatBatchInput } from '../../types/study-room'

const props = defineProps<{
  modelValue: boolean
  grid: RoomGrid
  pending: boolean
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: SeatBatchInput]
}>()

const form = reactive({
  prefix: 'C',
  rows: 4,
  columns: 6,
  startRow: 1,
  startColumn: 1,
  skipText: '',
})
const localErrors = reactive<Record<string, string>>({})

const parsedSkip = computed(() => {
  if (!form.skipText.trim()) return []
  const result: { row: number; column: number }[] = []
  for (const part of form.skipText.split(',')) {
    const match = /^\s*(\d+)\s*:\s*(\d+)\s*$/.exec(part)
    if (!match) return null
    result.push({ row: Number(match[1]), column: Number(match[2]) })
  }
  return result
})

const preview = computed(() => {
  if (!parsedSkip.value) return { count: 0, first: '', last: '' }
  const skip = new Set(parsedSkip.value.map((item) => `${item.row}:${item.column}`))
  let count = 0
  let first = ''
  let last = ''
  for (let row = form.startRow; row < form.startRow + form.rows; row += 1) {
    for (let column = form.startColumn; column < form.startColumn + form.columns; column += 1) {
      if (skip.has(`${row}:${column}`)) continue
      count += 1
      const seatNo = `${form.prefix.trim().toUpperCase() || 'A'}-${String(count).padStart(2, '0')}`
      if (!first) first = seatNo
      last = seatNo
    }
  }
  return { count, first, last }
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    form.prefix = 'C'
    form.rows = Math.min(4, props.grid.rows)
    form.columns = Math.min(6, props.grid.columns)
    form.startRow = 1
    form.startColumn = 1
    form.skipText = ''
    Object.keys(localErrors).forEach((key) => delete localErrors[key])
  },
)

function validate() {
  Object.keys(localErrors).forEach((key) => delete localErrors[key])
  if (!/^[A-Za-z0-9]{1,8}$/.test(form.prefix.trim())) {
    localErrors.prefix = '请输入 1-8 位字母或数字'
  }
  if (form.startRow + form.rows - 1 > props.grid.rows) localErrors.rows = '超出网格行数'
  if (form.startColumn + form.columns - 1 > props.grid.columns) {
    localErrors.columns = '超出网格列数'
  }
  if (form.rows * form.columns > 500) localErrors.rows = '单批最多 500 个座位'
  if (!parsedSkip.value) localErrors.skip = '跳过坐标请使用“行:列”，并以逗号分隔'
  if (preview.value.count < 1) localErrors.skip = '至少需要保留一个座位'
  return Object.keys(localErrors).length === 0
}

function submit() {
  if (!validate() || props.pending || !parsedSkip.value) return
  emit('submit', {
    prefix: form.prefix.trim().toUpperCase(),
    rows: form.rows,
    columns: form.columns,
    startRow: form.startRow,
    startColumn: form.startColumn,
    skip: parsedSkip.value,
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="批量生成座位"
    width="min(94vw, 600px)"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item label="批次前缀" :error="localErrors.prefix || errors.prefix || ''">
        <el-input v-model="form.prefix" maxlength="8" placeholder="例如：C" />
      </el-form-item>
      <div class="number-grid">
        <el-form-item label="生成行数" :error="localErrors.rows || errors.rows || ''">
          <el-input-number v-model="form.rows" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="生成列数" :error="localErrors.columns || errors.columns || ''">
          <el-input-number v-model="form.columns" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="起始行" :error="errors.startRow || ''">
          <el-input-number v-model="form.startRow" :min="1" :max="grid.rows" />
        </el-form-item>
        <el-form-item label="起始列" :error="errors.startColumn || ''">
          <el-input-number v-model="form.startColumn" :min="1" :max="grid.columns" />
        </el-form-item>
      </div>
      <el-form-item label="跳过坐标（过道）" :error="localErrors.skip || errors.skip || ''">
        <el-input v-model="form.skipText" placeholder="例如：1:4, 2:4, 3:4" />
        <p class="field-note">格式为“行:列”，多个坐标用逗号分隔；未填坐标将连续生成座位编号。</p>
      </el-form-item>
      <div class="preview">
        <span>预计生成</span>
        <strong>{{ preview.count }} 个座位</strong>
        <code v-if="preview.first">{{ preview.first }} … {{ preview.last }}</code>
      </div>
    </el-form>
    <template #footer>
      <el-button :disabled="pending" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="pending" @click="submit">确认生成</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.number-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.field-note {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--surface-muted);
}

.preview span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.preview strong {
  color: var(--text);
}

.preview code {
  color: var(--accent);
  font-size: 0.78rem;
}

@media (max-width: 520px) {
  .number-grid {
    grid-template-columns: 1fr;
  }
}
</style>
