<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, useTemplateRef, watch } from 'vue'
import type { PasswordChangeInput } from '../../types/auth'

interface PasswordDraft {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const props = defineProps<{
  pending: boolean
  errors: Record<string, string>
  resetSignal: number
}>()

const emit = defineEmits<{
  submit: [input: PasswordChangeInput]
}>()

const formRef = useTemplateRef<FormInstance>('formRef')
const form = reactive<PasswordDraft>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const rules: FormRules<PasswordDraft> = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,32}$/,
      message: '新密码需为 8-32 位，并同时包含字母和数字',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== form.newPassword) callback(new Error('两次输入的新密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

watch(
  () => props.resetSignal,
  () => {
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    formRef.value?.clearValidate()
  },
)

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('submit', {
    oldPassword: form.oldPassword,
    newPassword: form.newPassword,
  })
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
    <el-form-item label="当前密码" prop="oldPassword" :error="errors.oldPassword || ''">
      <el-input
        v-model="form.oldPassword"
        type="password"
        autocomplete="current-password"
        show-password
      />
    </el-form-item>
    <div class="password-grid">
      <el-form-item label="新密码" prop="newPassword" :error="errors.newPassword || ''">
        <el-input
          v-model="form.newPassword"
          type="password"
          autocomplete="new-password"
          show-password
        />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          show-password
        />
      </el-form-item>
    </div>
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="修改密码后，当前账号的全部会话都会失效，需要重新登录。"
    />
    <el-button
      class="password-submit"
      type="primary"
      native-type="submit"
      :loading="pending"
      :disabled="pending"
    >
      更新密码
    </el-button>
  </el-form>
</template>

<style scoped>
.password-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.password-submit {
  margin-top: 18px;
}

@media (max-width: 680px) {
  .password-grid {
    grid-template-columns: 1fr;
  }
}
</style>
