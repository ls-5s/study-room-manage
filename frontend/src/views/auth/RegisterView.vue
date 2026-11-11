<script setup lang="ts">
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { reactive, shallowRef, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { registerStudent } from '../../api/auth'
import { RequestError } from '../../utils/request'

interface RegisterForm {
  studentNo: string
  username: string
  displayName: string
  email: string
  password: string
  confirmPassword: string
}

const router = useRouter()
const formRef = useTemplateRef<FormInstance>('formRef')
const pending = shallowRef(false)
const serverError = shallowRef('')
const fieldErrors = reactive<Record<string, string>>({})
const form = reactive<RegisterForm>({
  studentNo: '',
  username: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules<RegisterForm> = {
  studentNo: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9-]{4,32}$/,
      message: '学号需为 4-32 位字母、数字或连字符',
      trigger: 'blur',
    },
  ],
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
  email: [{ type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,32}$/,
      message: '密码需为 8-32 位，并同时包含字母和数字',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

function clearFieldErrors() {
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key]
}

async function submit() {
  clearFieldErrors()
  serverError.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  pending.value = true
  try {
    await registerStudent({
      studentNo: form.studentNo,
      username: form.username,
      displayName: form.displayName,
      email: form.email || null,
      password: form.password,
    })
    ElMessage.success('注册成功，请登录')
    await router.replace({
      name: 'login',
      query: { registered: '1', username: form.username },
    })
  } catch (error) {
    if (error instanceof RequestError) {
      Object.assign(fieldErrors, error.fields)
      serverError.value = error.message
    } else {
      serverError.value = '注册失败，请稍后重试'
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="register-card" aria-labelledby="register-title">
    <div class="register-heading">
      <div>
        <p class="register-eyebrow">学生账号</p>
        <h1 id="register-title" class="register-title">创建学习空间账号</h1>
        <p class="register-summary">注册成功后使用用户名登录。第一版不核验学号的真实归属。</p>
      </div>
      <el-tag type="info" effect="plain">仅学生</el-tag>
    </div>

    <el-alert
      v-if="serverError"
      class="register-alert"
      type="error"
      :closable="false"
      show-icon
      :title="serverError"
    />

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="submit"
    >
      <div class="form-grid">
        <el-form-item label="学号" prop="studentNo" :error="fieldErrors.studentNo || ''">
          <el-input v-model="form.studentNo" autocomplete="off" placeholder="2023001001" />
        </el-form-item>
        <el-form-item label="用户名" prop="username" :error="fieldErrors.username || ''">
          <el-input
            v-model="form.username"
            autocomplete="username"
            placeholder="study_2023001001"
          />
        </el-form-item>
        <el-form-item label="显示名称" prop="displayName" :error="fieldErrors.displayName || ''">
          <el-input v-model="form.displayName" autocomplete="name" placeholder="张同学" />
        </el-form-item>
        <el-form-item label="邮箱（可选）" prop="email" :error="fieldErrors.email || ''">
          <el-input
            v-model="form.email"
            autocomplete="email"
            placeholder="student@example.edu.cn"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password" :error="fieldErrors.password || ''">
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
            placeholder="再次输入密码"
          />
        </el-form-item>
      </div>

      <el-button class="register-submit" type="primary" native-type="submit" :loading="pending">
        创建账号
      </el-button>
    </el-form>

    <p class="register-foot">
      已有账号？
      <RouterLink to="/login">返回登录</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.register-card {
  position: relative;
  width: min(100%, 760px);
  margin-inline: auto;
  overflow: hidden;
  padding: 32px;
  border: 1px solid var(--border-strong);
  border-radius: 24px;
  background: var(--glass-gradient);
  box-shadow: var(--shadow-glass);
  backdrop-filter: blur(28px) saturate(118%);
}

.register-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 38%), transparent);
  content: '';
}

.register-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.register-eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.register-title {
  margin: 0;
  color: var(--text);
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.15;
}

.register-summary {
  margin: 10px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
}

.register-alert {
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.register-submit {
  width: 100%;
  margin-top: 8px;
}

.register-foot {
  margin: 22px 0 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
}

.register-foot a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 680px) {
  .register-card {
    border-radius: 16px;
    padding: 28px 22px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .register-heading {
    flex-direction: column;
  }

  .register-title {
    font-size: 1.875rem;
  }
}
</style>
