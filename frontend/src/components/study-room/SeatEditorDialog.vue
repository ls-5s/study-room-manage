<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Seat, SeatStaticStatus, SeatUpdateInput } from '../../types/study-room'

const props = defineProps<{
  modelValue: boolean
  seat: Seat | null
  pending: boolean
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: SeatUpdateInput]
}>()

const form = reactive({
  seatNo: '',
  row: 1,
  column: 1,
  status: 'available' as SeatStaticStatus,
  remark: '',
})
const localErrors = reactive<Record<string, string>>({})

watch(
  () => [props.modelValue, props.seat],
  () => {
    if (!props.modelValue || !props.seat) return
    form.seatNo = props.seat.seatNo
    form.row = props.seat.row
    form.column = props.seat.column
    form.status = props.seat.status
    form.remark = props.seat.remark ?? ''
    Object.keys(localErrors).forEach((key) => delete localErrors[key])
  },
  { deep: true },
)

function submit() {
  Object.keys(localErrors).forEach((key) => delete localErrors[key])
  if (!form.seatNo.trim()) localErrors.seatNo = '请输入座位编号'
  if (form.status === 'maintenance' && !form.remark.trim()) {
    localErrors.remark = '维修座位必须填写说明'
  }
  if (Object.keys(localErrors).length > 0 || props.pending) return
  emit('submit', {
    seatNo: form.seatNo.trim(),
    row: form.row,
    column: form.column,
    status: form.status,
    remark: form.remark.trim() || null,
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="编辑座位"
    width="min(94vw, 520px)"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item label="座位编号" :error="localErrors.seatNo || errors.seatNo || ''">
        <el-input v-model="form.seatNo" maxlength="32" />
      </el-form-item>
      <div class="number-grid">
        <el-form-item label="行号" :error="errors.row || ''">
          <el-input-number v-model="form.row" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="列号" :error="errors.column || ''">
          <el-input-number v-model="form.column" :min="1" :max="50" />
        </el-form-item>
      </div>
      <el-form-item label="座位状态" :error="errors.status || ''">
        <select v-model="form.status" class="native-select">
          <option value="available">可用</option>
          <option value="maintenance">维修</option>
          <option value="disabled">停用</option>
        </select>
      </el-form-item>
      <el-form-item label="备注" :error="localErrors.remark || errors.remark || ''">
        <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="pending" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="pending" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.number-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.native-select {
  width: 100%;
  height: 34px;
  padding: 0 34px 0 11px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  color: var(--text);
  background: var(--surface);
}

@media (max-width: 520px) {
  .number-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
