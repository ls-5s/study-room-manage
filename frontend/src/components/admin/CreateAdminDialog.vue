<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, useTemplateRef, watch } from 'vue'
import type { CreateAdminInput } from '../../types/auth'

interface CreateAdminDraft {
  username: string
  displayName: string
  password: string
  confirmPassword: string
  email: string
  phone: string
}

const open = defineModel<boolean>({ required: true })

const { pending, errors } = defineProps<{
  pending: boolean
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  submit: [input: CreateAdminInput]
}>()

const formRef = useTemplateRef<FormInstance>('formRef')
const form = reactive<CreateAdminDraft>({
  username: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
})

const rules: FormRules<CreateAdminDraft> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9_]{4,32}$/,
      message: '用户名需为 4-32 位字母、数字或下划线',
      trigger: 'blur',
    },
  ],
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 2, max: 64, message: '显示名称需为 2-64 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,32}$/,
      message: '密码需为 8-32 位，并同时包含字母和数字',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入初始密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  email: [{ type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }],
  phone: [
    {
      validator: (_rule, value: string, callback) => {
        if (!value || /^(?:1\d{10}|\+86\d{11}|\+\d{8,15})$/.test(value.replace(/[\s-]/g, ''))) {
          callback()
        } else {
          callback(new Error('请输入有效的手机号'))
        }
      },
      trigger: 'blur',
    },
  ],
}

watch(open, (visible) => {
  if (!visible) return
  form.username = ''
  form.displayName = ''
  form.password = ''
  form.confirmPassword = ''
  form.email = ''
  form.phone = ''
  formRef.value?.clearValidate()
})

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('submit', {
    username: form.username,
    displayName: form.displayName,
    password: form.password,
    email: form.email || null,
    phone: form.phone || null,
  })
}
</script>

<template>
  <el-dialog
    v-model="open"
    title="新建管理员"
    width="min(94vw, 620px)"
    :close-on-click-modal="!pending"
    :close-on-press-escape="!pending"
    :show-close="!pending"
  >
    <el-alert
      class="dialog-alert"
      type="info"
      :closable="false"
      show-icon
      title="新账号将拥有普通管理员权限。内部编号由系统自动生成。"
    />

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="submit"
    >
      <div class="form-grid">
        <el-form-item label="用户名" prop="username" :error="errors.username || ''">
          <el-input v-model="form.username" autocomplete="off" placeholder="例如 admin_library" />
        </el-form-item>
        <el-form-item label="显示名称" prop="displayName" :error="errors.displayName || ''">
          <el-input v-model="form.displayName" autocomplete="name" placeholder="管理员姓名" />
        </el-form-item>
        <el-form-item label="初始密码" prop="password" :error="errors.password || ''">
          <el-input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            show-password
            placeholder="至少 8 位，包含字母和数字"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            show-password
            placeholder="再次输入初始密码"
          />
        </el-form-item>
        <el-form-item label="邮箱（可选）" prop="email" :error="errors.email || ''">
          <el-input v-model="form.email" autocomplete="email" placeholder="name@example.edu.cn" />
        </el-form-item>
        <el-form-item label="手机号（可选）" prop="phone" :error="errors.phone || ''">
          <el-input v-model="form.phone" autocomplete="tel" placeholder="13800138000" />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button :disabled="pending" @click="open = false">取消</el-button>
      <el-button type="primary" :loading="pending" :disabled="pending" @click="submit">
        创建管理员
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-alert {
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

@media (max-width: 620px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
