<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { reactive, shallowRef, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import type { LoginInput } from '../../types/auth'
import { safeRedirectPath } from '../../utils/auth-session'
import { RequestError } from '../../utils/request'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const formRef = useTemplateRef<FormInstance>('formRef')
const pending = shallowRef(false)
const serverError = shallowRef('')
const fieldErrors = reactive<Record<string, string>>({})

const form = reactive<LoginInput>({
  username: typeof route.query.username === 'string' ? route.query.username : '',
  password: '',
})

const rules: FormRules<LoginInput> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9_]{4,32}$/,
      message: '用户名需为 4-32 位字母、数字或下划线',
      trigger: 'blur',
    },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
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
    await auth.login(form)
    ElMessage.success('登录成功')
    const redirect = safeRedirectPath(route.query.redirect)
    await router.replace(redirect ?? auth.homePath)
  } catch (error) {
    if (error instanceof RequestError) {
      Object.assign(fieldErrors, error.fields)
      serverError.value =
        error.retryAfterSeconds === null
          ? error.message
          : `${error.message}（约 ${error.retryAfterSeconds} 秒后重试）`
    } else {
      serverError.value = '登录失败，请稍后重试'
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="auth-card" aria-labelledby="login-title">
    <div class="auth-intro">
      <p class="auth-eyebrow">身份认证</p>
      <h1 id="login-title" class="auth-title">回到你的学习空间</h1>
      <p class="auth-summary">使用用户名登录。学号、邮箱和手机号仅作为账号资料，不作为登录账号。</p>
    </div>

    <el-alert
      v-if="route.query.registered === '1'"
      class="auth-alert"
      type="success"
      :closable="false"
      show-icon
      title="注册成功，请使用新用户名登录"
    />
    <el-alert
      v-if="serverError"
      class="auth-alert"
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
      size="large"
      @submit.prevent="submit"
    >
      <el-form-item label="用户名" prop="username" :error="fieldErrors.username || ''">
        <el-input
          v-model="form.username"
          name="username"
          autocomplete="username"
          placeholder="例如 study_2023001001"
          :prefix-icon="User"
        />
      </el-form-item>
      <el-form-item label="密码" prop="password" :error="fieldErrors.password || ''">
        <el-input
          v-model="form.password"
          name="password"
          type="password"
          autocomplete="current-password"
          show-password
          placeholder="请输入密码"
          :prefix-icon="Lock"
          @keyup.enter="submit"
        />
      </el-form-item>
      <el-button class="submit-button" type="primary" native-type="submit" :loading="pending">
        登录
      </el-button>
    </el-form>

    <div class="auth-switch">
      <span>还没有学生账号？</span>
      <RouterLink to="/register">创建账号</RouterLink>
    </div>
    <p class="auth-note">管理员账号由系统初始化脚本创建，不开放自助注册。</p>
  </section>
</template>

<style scoped>
.auth-card {
  width: min(100%, 460px);
  margin-inline: auto;
  padding: 36px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-raised);
}

.auth-intro {
  margin-bottom: 28px;
}

.auth-eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.auth-title {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 650;
  letter-spacing: -0.035em;
  line-height: 1.2;
}

.auth-summary {
  margin: 12px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.auth-alert {
  margin-bottom: 20px;
}

.submit-button {
  width: 100%;
  margin-top: 4px;
}

.auth-switch {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.auth-switch a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}

.auth-switch a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-note {
  margin: 20px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 600px) {
  .auth-card {
    padding: 28px 22px;
  }
}
</style>
