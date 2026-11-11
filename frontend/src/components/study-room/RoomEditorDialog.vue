<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { reactive, ref, watch } from 'vue'
import type {
  RoomInput,
  RoomUpdateInput,
  StudyRoomStatus,
  StudyRoomSummary,
} from '../../types/study-room'
import { roomStatusLabels } from '../../utils/study-room'

const props = defineProps<{
  modelValue: boolean
  room: StudyRoomSummary | null
  pending: boolean
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: RoomInput | RoomUpdateInput]
}>()

const form = reactive({
  name: '',
  location: '',
  description: '',
  gridRows: 8,
  gridColumns: 10,
  status: 'closed' as StudyRoomStatus,
})
const localErrors = reactive<Record<string, string>>({})
const confirming = ref(false)

function reset() {
  const room = props.room
  form.name = room?.name ?? ''
  form.location = room?.location ?? ''
  form.description = room?.description ?? ''
  form.gridRows = room?.grid.rows ?? 8
  form.gridColumns = room?.grid.columns ?? 10
  form.status = room?.status ?? 'closed'
  Object.keys(localErrors).forEach((key) => delete localErrors[key])
}

watch(
  () => [props.modelValue, props.room],
  () => {
    if (props.modelValue) reset()
  },
  { deep: true },
)

function validate(): boolean {
  Object.keys(localErrors).forEach((key) => delete localErrors[key])
  if (form.name.trim().length < 2) localErrors.name = '名称至少 2 个字符'
  if (form.location.trim().length < 2) localErrors.location = '位置至少 2 个字符'
  if (!Number.isInteger(form.gridRows) || form.gridRows < 1 || form.gridRows > 50) {
    localErrors.gridRows = '请输入 1-50'
  }
  if (!Number.isInteger(form.gridColumns) || form.gridColumns < 1 || form.gridColumns > 50) {
    localErrors.gridColumns = '请输入 1-50'
  }
  return Object.keys(localErrors).length === 0
}

async function submit() {
  if (!validate() || props.pending || confirming.value) return
  const changingStatus = Boolean(props.room && form.status !== props.room.status)
  if (changingStatus) {
    confirming.value = true
    try {
      await ElMessageBox.confirm(
        `确定将房间状态改为“${roomStatusLabels[form.status]}”吗？可能存在预约的资源会在后端再次校验。`,
        '确认状态变更',
        {
          type: form.status === 'open' ? 'warning' : 'info',
          confirmButtonText: '确认修改',
          cancelButtonText: '取消',
        },
      )
    } catch {
      return
    } finally {
      confirming.value = false
    }
  }
  const base: RoomInput = {
    name: form.name.trim(),
    location: form.location.trim(),
    description: form.description.trim() || null,
    gridRows: form.gridRows,
    gridColumns: form.gridColumns,
  }
  emit('submit', props.room ? { ...base, status: form.status } : base)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="room ? '编辑自习室' : '新增自习室'"
    width="min(94vw, 620px)"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top" @submit.prevent="submit">
      <div class="form-grid">
        <el-form-item label="自习室名称" :error="localErrors.name || errors.name || ''">
          <el-input v-model="form.name" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="位置" :error="localErrors.location || errors.location || ''">
          <el-input v-model="form.location" maxlength="128" placeholder="例如：图书馆 3F-301" />
        </el-form-item>
      </div>
      <el-form-item label="使用说明" :error="errors.description || ''">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <div class="form-grid">
        <el-form-item label="网格行数" :error="localErrors.gridRows || errors.gridRows || ''">
          <el-input-number v-model="form.gridRows" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="网格列数" :error="localErrors.gridColumns || errors.gridColumns || ''">
          <el-input-number v-model="form.gridColumns" :min="1" :max="50" />
        </el-form-item>
      </div>
      <el-form-item v-if="room" label="房间状态">
        <select v-model="form.status" class="native-select">
          <option value="open">开放</option>
          <option value="closed">关闭</option>
          <option value="disabled">停用</option>
        </select>
        <p class="field-note">开放前必须配置有效时段和可用座位；恢复开放从下一个业务日生效。</p>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="pending" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="pending" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field-note {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
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

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
