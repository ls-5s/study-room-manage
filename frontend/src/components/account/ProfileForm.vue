<script setup lang="ts">
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { computed, reactive, useTemplateRef, watch } from 'vue'
import type { ProfileUpdateInput, UserProfile } from '../../types/auth'

interface ProfileDraft {
  displayName: string
  email: string
  phone: string
  avatar: string
}

const props = defineProps<{
  user: UserProfile
  pending: boolean
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  submit: [input: ProfileUpdateInput]
}>()

const formRef = useTemplateRef<FormInstance>('formRef')
const form = reactive<ProfileDraft>({
  displayName: '',
  email: '',
  phone: '',
  avatar: '',
})
const avatarModel = computed({
  get: () => form.avatar,
  set: (value: string) => {
    form.avatar = value
  },
})

const rules: FormRules<ProfileDraft> = {
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 2, max: 64, message: '显示名称需为 2-64 个字符', trigger: 'blur' },
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
  avatar: [
    {
      validator: (_rule, value: string, callback) => {
        if (!value || /^https?:\/\//i.test(value)) callback()
        else callback(new Error('头像地址必须以 http:// 或 https:// 开头'))
      },
      trigger: 'blur',
    },
  ],
}

watch(
  () => props.user,
  (user) => {
    form.displayName = user.displayName
    form.email = user.email ?? ''
    form.phone = user.phone ?? ''
    form.avatar = user.avatarUrl ?? ''
  },
  { immediate: true },
)

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (
    form.displayName === props.user.displayName &&
    form.email === (props.user.email ?? '') &&
    form.phone === (props.user.phone ?? '') &&
    form.avatar === (props.user.avatarUrl ?? '')
  ) {
    ElMessage.info('资料没有变化')
    return
  }

  emit('submit', {
    displayName: form.displayName,
    email: form.email || null,
    phone: form.phone || null,
    avatarUrl: form.avatar || null,
  })
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
    <div class="form-grid">
      <el-form-item label="显示名称" prop="displayName" :error="errors.displayName || ''">
        <el-input v-model="form.displayName" autocomplete="name" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email" :error="errors.email || ''">
        <el-input v-model="form.email" autocomplete="email" placeholder="可留空" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone" :error="errors.phone || ''">
        <el-input v-model="form.phone" autocomplete="tel" placeholder="可留空" />
      </el-form-item>
      <el-form-item label="头像地址" prop="avatar" :error="errors.avatarUrl || ''">
        <el-input v-model="avatarModel" placeholder="https://..." />
      </el-form-item>
    </div>
    <el-button type="primary" native-type="submit" :loading="pending" :disabled="pending">
      保存资料
    </el-button>
  </el-form>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

@media (max-width: 680px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
