<script setup lang="ts">
import { Calendar, Key, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import PasswordForm from '../../components/account/PasswordForm.vue'
import ProfileForm from '../../components/account/ProfileForm.vue'
import { changeCurrentPassword, getCurrentUser, updateCurrentUser } from '../../api/user'
import { useAuthStore } from '../../stores/auth'
import type { PasswordChangeInput, ProfileUpdateInput, UserProfile } from '../../types/auth'
import { RequestError } from '../../utils/request'
import { roleLabel, roleTagType } from '../../utils/auth-role'

const auth = useAuthStore()
const router = useRouter()
const profile = shallowRef<UserProfile | null>(auth.currentUser)
const loading = shallowRef(false)
const loadError = shallowRef('')
const profilePending = shallowRef(false)
const passwordPending = shallowRef(false)
const activeTab = shallowRef('profile')
const passwordResetSignal = shallowRef(0)
const profileErrors = reactive<Record<string, string>>({})
const passwordErrors = reactive<Record<string, string>>({})

const initials = computed(() => profile.value?.displayName.trim().slice(0, 1) || '学')
const restrictionText = computed(() => {
  if (!profile.value?.restrictionUntil) return '当前没有预约限制'
  return `预约限制至 ${formatDate(profile.value.restrictionUntil)}`
})

function clearErrors(target: Record<string, string>) {
  for (const key of Object.keys(target)) delete target[key]
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}

async function loadProfile() {
  loading.value = true
  loadError.value = ''
  try {
    profile.value = await getCurrentUser()
    auth.updateUser(profile.value)
  } catch (error) {
    loadError.value = error instanceof RequestError ? error.message : '个人资料加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function saveProfile(input: ProfileUpdateInput) {
  clearErrors(profileErrors)
  profilePending.value = true
  try {
    const updated = await updateCurrentUser(input)
    profile.value = updated
    auth.updateUser(updated)
    ElMessage.success('个人资料已更新')
  } catch (error) {
    if (error instanceof RequestError) {
      Object.assign(profileErrors, error.fields)
      ElMessage.error(error.message)
    } else {
      ElMessage.error('资料更新失败，请稍后重试')
    }
  } finally {
    profilePending.value = false
  }
}

async function savePassword(input: PasswordChangeInput) {
  clearErrors(passwordErrors)
  passwordPending.value = true
  try {
    await changeCurrentPassword(input)
    passwordResetSignal.value += 1
    auth.clearSession()
    ElMessage.success('密码已更新，请重新登录')
    await router.replace({ name: 'login', query: { username: profile.value?.username } })
  } catch (error) {
    if (error instanceof RequestError) {
      Object.assign(passwordErrors, error.fields)
      ElMessage.error(error.message)
    } else {
      ElMessage.error('密码修改失败，请稍后重试')
    }
  } finally {
    passwordPending.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <section class="profile-page" aria-labelledby="profile-title">
    <header class="profile-header">
      <div class="profile-heading">
        <div class="avatar" aria-hidden="true">
          <img v-if="profile?.avatarUrl" :src="profile.avatarUrl" alt="" />
          <span v-else>{{ initials }}</span>
        </div>
        <div>
          <p class="page-eyebrow">账号与资料</p>
          <h1 id="profile-title" class="page-title">{{ profile?.displayName ?? '个人中心' }}</h1>
          <p class="page-summary">查看账号身份、联系方式和预约限制。</p>
        </div>
      </div>
      <div v-if="profile" class="profile-tags">
        <el-tag :type="roleTagType(profile.role)" effect="plain">
          {{ roleLabel(profile.role) }}
        </el-tag>
        <el-tag :type="profile.status === 'active' ? 'success' : 'danger'" effect="plain">
          {{ profile.status === 'active' ? '账号正常' : '账号已停用' }}
        </el-tag>
      </div>
    </header>

    <el-skeleton v-if="loading && !profile" :rows="5" animated />
    <el-empty v-else-if="loadError && !profile" :description="loadError">
      <el-button type="primary" @click="loadProfile">重新加载</el-button>
    </el-empty>
    <template v-else-if="profile">
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">学号</span>
          <strong>{{ profile.studentNo }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">用户名</span>
          <strong>{{ profile.username }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">有效违约</span>
          <strong>{{ profile.violationCount }} 次</strong>
          <RouterLink class="summary-link" to="/violations">查看违约记录</RouterLink>
        </div>
        <div class="summary-item">
          <span class="summary-label">预约权限</span>
          <strong :class="{ 'restriction-active': profile.restrictionUntil }">
            {{ restrictionText }}
          </strong>
        </div>
      </div>

      <div class="profile-content">
        <div class="account-tabs">
          <div class="account-tablist" role="tablist" aria-label="账号设置">
            <button
              class="account-tab-button"
              :class="{ 'is-active': activeTab === 'profile' }"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'profile'"
              @click="activeTab = 'profile'"
            >
              <el-icon><User /></el-icon>
              个人资料
            </button>
            <button
              class="account-tab-button"
              :class="{ 'is-active': activeTab === 'password' }"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'password'"
              @click="activeTab = 'password'"
            >
              <el-icon><Key /></el-icon>
              修改密码
            </button>
          </div>
          <div v-if="activeTab === 'profile'" class="tab-body" role="tabpanel">
            <div class="tab-intro">
              <h2 class="section-title">基本资料</h2>
              <p>学号、用户名和角色由系统维护，其他信息可以自行更新。</p>
            </div>
            <ProfileForm
              :user="profile"
              :pending="profilePending"
              :errors="profileErrors"
              @submit="saveProfile"
            />
          </div>
          <div v-else class="tab-body" role="tabpanel">
            <div class="tab-intro">
              <h2 class="section-title">账号安全</h2>
              <p>修改成功后，所有设备上的当前会话都会失效。</p>
            </div>
            <PasswordForm
              :pending="passwordPending"
              :errors="passwordErrors"
              :reset-signal="passwordResetSignal"
              @submit="savePassword"
            />
          </div>
        </div>

        <aside class="profile-aside">
          <div class="aside-icon" aria-hidden="true">
            <el-icon><Calendar /></el-icon>
          </div>
          <h2 class="aside-title">账号状态</h2>
          <dl class="account-list">
            <div>
              <dt>邮箱</dt>
              <dd>{{ profile.email || '未填写' }}</dd>
            </div>
            <div>
              <dt>手机号</dt>
              <dd>{{ profile.phone || '未填写' }}</dd>
            </div>
            <div>
              <dt>当前限制</dt>
              <dd>{{ restrictionText }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
  width: 100%;
  gap: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.profile-heading {
  display: flex;
  align-items: center;
  gap: 18px;
}

.avatar {
  display: grid;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  place-items: center;
  overflow: hidden;
  border-radius: 18px;
  color: var(--accent-contrast);
  background: var(--accent);
  font-size: 1.5rem;
  font-weight: 700;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.page-title {
  margin: 0;
  color: var(--text);
  font-size: 1.75rem;
  line-height: 1.25;
}

.page-summary {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

.profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.summary-item {
  min-width: 0;
  padding: 18px 22px;
  border-right: 1px solid var(--border);
}

.summary-item:last-child {
  border-right: 0;
}

.summary-label {
  display: block;
  margin-bottom: 7px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.summary-link {
  display: inline-block;
  margin-top: 6px;
  color: var(--accent);
  font-size: 0.72rem;
  text-decoration: none;
}

.summary-link:hover {
  text-decoration: underline;
}

.summary-item strong {
  display: block;
  overflow: hidden;
  color: var(--text);
  font-size: 0.9375rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.restriction-active {
  color: var(--status-warn) !important;
}

.profile-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 34%);
  gap: 24px;
  align-items: start;
}

.account-tabs,
.profile-aside {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.account-tabs {
  padding: 0 26px 28px;
}

.account-tablist {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--border);
}

.account-tab-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 14px 2px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  background: transparent;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.account-tab-button:hover,
.account-tab-button.is-active {
  color: var(--accent);
}

.account-tab-button.is-active {
  border-bottom-color: var(--accent);
}

.tab-body {
  padding-top: 20px;
}

.tab-intro {
  margin-bottom: 22px;
}

.tab-intro p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.section-title {
  margin: 0;
  font-size: 1rem;
}

.profile-aside {
  padding: 24px;
}

.aside-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 10px;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 20px;
}

.aside-title {
  margin: 16px 0;
  font-size: 1rem;
}

.account-list {
  display: grid;
  gap: 16px;
  margin: 0;
}

.account-list div {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.account-list div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.account-list dt {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.account-list dd {
  margin: 5px 0 0;
  color: var(--text);
  font-size: 0.875rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

@media (max-width: 1000px) {
  .profile-content {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item:nth-child(2) {
    border-right: 0;
  }

  .summary-item:nth-child(-n + 2) {
    border-bottom: 1px solid var(--border);
  }
}

@media (max-width: 640px) {
  .profile-header,
  .profile-heading {
    align-items: flex-start;
  }

  .profile-header {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-item {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .summary-item:nth-child(2) {
    border-right: 0;
  }

  .summary-item:last-child {
    border-bottom: 0;
  }

  .account-tabs {
    padding-inline: 18px;
  }
}
</style>
