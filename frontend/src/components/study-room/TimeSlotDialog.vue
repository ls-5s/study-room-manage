<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { TimeSlot, TimeSlotInput, TimeSlotUpdateInput } from '../../types/study-room'

const props = defineProps<{
  modelValue: boolean
  timeSlot: TimeSlot | null
  pending: boolean
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: TimeSlotInput | TimeSlotUpdateInput]
}>()

const form = reactive({
  label: '',
  startTime: '08:00',
  endTime: '10:00',
  status: 'active' as 'active' | 'inactive',
})
const localErrors = reactive<Record<string, string>>({})

watch(
  () => [props.modelValue, props.timeSlot],
  () => {
    if (!props.modelValue) return
    form.label = props.timeSlot?.label ?? ''
    form.startTime = props.timeSlot?.startTime ?? '08:00'
    form.endTime = props.timeSlot?.endTime ?? '10:00'
    form.status = props.timeSlot?.status ?? 'active'
    Object.keys(localErrors).forEach((key) => delete localErrors[key])
  },
  { deep: true },
)

function validate() {
  Object.keys(localErrors).forEach((key) => delete localErrors[key])
  if (!form.label.trim()) localErrors.label = '请输入时段名称'
  if (form.startTime >= form.endTime) localErrors.endTime = '结束时间必须晚于开始时间'
  const [startHour = 0, startMinute = 0] = form.startTime.split(':').map(Number)
  const [endHour = 0, endMinute = 0] = form.endTime.split(':').map(Number)
  const duration = endHour * 60 + endMinute - startHour * 60 - startMinute
  if (duration < 30) localErrors.endTime = '时段不能少于 30 分钟'
  if (duration > 240) localErrors.endTime = '时段不能超过 4 小时'
  return Object.keys(localErrors).length === 0
}

function submit() {
  if (!validate() || props.pending) return
  emit('submit', {
    label: form.label.trim(),
    startTime: form.startTime,
    endTime: form.endTime,
    status: form.status,
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="timeSlot ? '编辑开放时段' : '新增开放时段'"
    width="min(94vw, 520px)"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item label="时段名称" :error="localErrors.label || errors.label || ''">
        <el-input v-model="form.label" maxlength="32" placeholder="例如：上午一" />
      </el-form-item>
      <div class="time-grid">
        <el-form-item label="开始时间" :error="errors.startTime || ''">
          <el-time-select
            v-model="form.startTime"
            start="06:00"
            end="22:00"
            step="00:30"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" :error="localErrors.endTime || errors.endTime || ''">
          <el-time-select
            v-model="form.endTime"
            start="06:30"
            end="23:00"
            step="00:30"
            style="width: 100%"
          />
        </el-form-item>
      </div>
      <el-form-item label="状态" :error="errors.status || ''">
        <el-radio-group v-model="form.status">
          <el-radio value="active">启用</el-radio>
          <el-radio value="inactive">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <p class="field-note">
        新增或重新启用的时段从下一个业务日生效；已有活动预约的时段不能修改边界。
      </p>
    </el-form>
    <template #footer>
      <el-button :disabled="pending" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="pending" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.time-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field-note {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.6;
}

@media (max-width: 520px) {
  .time-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
