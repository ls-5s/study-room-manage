<script setup lang="ts">
import { computed, reactive, useTemplateRef, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { AdminUser, UserStatus } from '../../types/auth'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  user: AdminUser | null
  pending: boolean
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  confirm: [status: UserStatus, reason: string]
}>()

const formRef = useTemplateRef<FormInstance>('formRef')
const form = reactive({ reason: '' })
const nextStatus = computed<UserStatus>(() =>
  props.user?.status === 'active' ? 'disabled' : 'active',
)
const actionLabel = computed(() => (nextStatus.value === 'disabled' ? '确认停用' : '确认恢复'))

const rules: FormRules<typeof form> = {
  reason: [
    { required: true, message: '请填写操作原因', trigger: 'blur' },
    { min: 2, max: 255, message: '原因需为 2-255 个字符', trigger: 'blur' },
  ],
}

watch(open, (value) => {
  if (value) {
    form.reason = ''
    formRef.value?.clearValidate()
  }
})

async function confirm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('confirm', nextStatus.value, form.reason.trim())
}
</script>

<template>
  <el-dialog
    v-model="open"
    :title="nextStatus === 'disabled' ? '停用账号' : '恢复账号'"
    width="min(92vw, 480px)"
    :close-on-click-modal="!pending"
    :close-on-press-escape="!pending"
    :show-close="!pending"
  >
    <div v-if="user" class="dialog-content">
      <div class="user-summary">
        <strong>{{ user.displayName }}</strong>
        <span>{{ user.studentNo }} · {{ user.username }}</span>
      </div>
      <el-alert
        :type="nextStatus === 'disabled' ? 'warning' : 'info'"
        :closable="false"
        show-icon
        :title="
          nextStatus === 'disabled'
            ? '停用后该账号的全部会话会立即失效，历史业务记录仍会保留。'
            : '恢复后旧会话不会重新生效，用户需要重新登录。'
        "
      />
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="操作原因" prop="reason" :error="errors.reason || ''">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="请填写可审计的操作原因"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button :disabled="pending" @click="open = false">取消</el-button>
      <el-button
        :type="nextStatus === 'disabled' ? 'danger' : 'primary'"
        :loading="pending"
        :disabled="pending"
        @click="confirm"
      >
        {{ actionLabel }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-content {
  display: grid;
  gap: 18px;
}

.user-summary {
  display: grid;
  gap: 5px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-muted);
}

.user-summary strong {
  color: var(--text);
}

.user-summary span {
  color: var(--text-secondary);
  font-size: 0.8125rem;
}
</style>
