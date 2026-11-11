<script setup lang="ts">
import { Plus, RefreshRight, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { changeUserStatus, createAdmin, getUser, getUserAuditLogs, getUsers } from '../../api/user'
import CreateAdminDialog from '../../components/admin/CreateAdminDialog.vue'
import UserStatusDialog from '../../components/admin/UserStatusDialog.vue'
import { useAuthStore } from '../../stores/auth'
import type {
  AdminUser,
  CreateAdminInput,
  UserAuditLogItem,
  UserListQuery,
  UserStatus,
} from '../../types/auth'
import { auditActionLabel, auditStatusChange, auditTimelineType } from '../../utils/audit'
import { roleLabel, roleTagType } from '../../utils/auth-role'
import { RequestError } from '../../utils/request'

const auth = useAuthStore()
const filters = reactive<UserListQuery>({
  studentNo: '',
  username: '',
  role: '',
  status: '',
  page: 1,
  pageSize: 10,
})
const users = shallowRef<AdminUser[]>([])
const total = shallowRef(0)
const summary = shallowRef({
  total: 0,
  students: 0,
  admins: 0,
  disabled: 0,
})
const loading = shallowRef(false)
const error = shallowRef('')
const statusDialogOpen = shallowRef(false)
const selectedUser = shallowRef<AdminUser | null>(null)
const statusPending = shallowRef(false)
const statusErrors = reactive<Record<string, string>>({})
const detailOpen = shallowRef(false)
const detailLoading = shallowRef(false)
const detail = shallowRef<AdminUser | null>(null)
const auditItems = shallowRef<UserAuditLogItem[]>([])
const auditLoading = shallowRef(false)
const auditError = shallowRef('')
const auditPage = shallowRef(1)
const auditPageSize = 10
const auditTotal = shallowRef(0)
const createDialogOpen = shallowRef(false)
const createPending = shallowRef(false)
const createErrors = reactive<Record<string, string>>({})
let requestSequence = 0

const currentAdminId = computed(() => auth.currentUser?.id)

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

function asAdminUser(row: unknown): AdminUser {
  return row as AdminUser
}

async function loadUsers() {
  const sequence = ++requestSequence
  loading.value = true
  error.value = ''
  try {
    const result = await getUsers(filters)
    if (sequence !== requestSequence) return
    users.value = result.items
    total.value = result.total
    summary.value = result.summary
  } catch (cause) {
    if (sequence !== requestSequence) return
    users.value = []
    total.value = 0
    error.value = cause instanceof RequestError ? cause.message : '用户列表加载失败'
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

function search() {
  filters.page = 1
  void loadUsers()
}

function reset() {
  filters.studentNo = ''
  filters.username = ''
  filters.role = ''
  filters.status = ''
  filters.page = 1
  void loadUsers()
}

async function loadDetail(userId: string, fallback: AdminUser) {
  detailLoading.value = true
  try {
    detail.value = await getUser(userId)
  } catch (cause) {
    detail.value = fallback
    ElMessage.error(cause instanceof RequestError ? cause.message : '用户详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function loadAuditLogs(userId: string, page = 1) {
  auditLoading.value = true
  auditError.value = ''
  try {
    const result = await getUserAuditLogs(userId, page, auditPageSize)
    auditItems.value = result.items
    auditPage.value = result.page
    auditTotal.value = result.total
  } catch (cause) {
    auditItems.value = []
    auditTotal.value = 0
    auditError.value = cause instanceof RequestError ? cause.message : '操作记录加载失败'
  } finally {
    auditLoading.value = false
  }
}

async function openDetail(user: AdminUser) {
  detail.value = user
  detailOpen.value = true
  auditItems.value = []
  auditPage.value = 1
  auditTotal.value = 0
  await Promise.all([loadDetail(user.id, user), loadAuditLogs(user.id, 1)])
}

function changeAuditPage(page: number) {
  if (detail.value) void loadAuditLogs(detail.value.id, page)
}

function retryAuditLogs() {
  if (detail.value) void loadAuditLogs(detail.value.id, auditPage.value)
}

function openStatusDialog(user: AdminUser) {
  selectedUser.value = user
  clearErrors(statusErrors)
  statusDialogOpen.value = true
}

async function confirmStatus(status: UserStatus, reason: string) {
  if (!selectedUser.value) return
  clearErrors(statusErrors)
  statusPending.value = true
  try {
    await changeUserStatus(selectedUser.value.id, status, reason)
    ElMessage.success(status === 'disabled' ? '账号已停用' : '账号已恢复')
    statusDialogOpen.value = false
    await loadUsers()
  } catch (cause) {
    if (cause instanceof RequestError) {
      Object.assign(statusErrors, cause.fields)
      ElMessage.error(cause.message)
    } else {
      ElMessage.error('账号状态更新失败')
    }
  } finally {
    statusPending.value = false
  }
}

function openCreateDialog() {
  clearErrors(createErrors)
  createDialogOpen.value = true
}

async function submitCreateAdmin(input: CreateAdminInput) {
  clearErrors(createErrors)
  createPending.value = true
  try {
    const created = await createAdmin(input)
    ElMessage.success(`管理员账号 ${created.username} 已创建`)
    createDialogOpen.value = false
    await loadUsers()
  } catch (cause) {
    if (cause instanceof RequestError) {
      Object.assign(createErrors, cause.fields)
      ElMessage.error(cause.message)
    } else {
      ElMessage.error('管理员账号创建失败')
    }
  } finally {
    createPending.value = false
  }
}

onMounted(() => {
  void loadUsers()
})
</script>

<template>
  <section class="users-page page-shell" aria-labelledby="users-title">
    <header class="page-header page-hero">
      <div class="page-hero-copy">
        <p class="page-eyebrow">管理员功能</p>
        <h1 id="users-title" class="page-title">用户管理</h1>
        <p class="page-summary">查询学生与管理员账号，查看脱敏资料并处理账号状态。</p>
      </div>
      <div class="page-actions">
        <el-tag effect="plain" round>{{ total }} 个账号</el-tag>
        <el-button v-if="auth.isSuperAdmin" type="primary" :icon="Plus" @click="openCreateDialog">
          新建管理员
        </el-button>
      </div>
    </header>

    <section class="summary-strip" aria-label="全站账号概览">
      <div class="summary-card summary-card-primary">
        <span class="summary-label">全部账号</span>
        <strong class="summary-value">{{ summary.total }}</strong>
        <span class="summary-note">已纳入系统管理</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">学生账号</span>
        <strong class="summary-value">{{ summary.students }}</strong>
        <span class="summary-note">可预约学生用户</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">管理员</span>
        <strong class="summary-value">{{ summary.admins }}</strong>
        <span class="summary-note">后台管理角色</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">已停用</span>
        <strong class="summary-value">{{ summary.disabled }}</strong>
        <span class="summary-note">当前不可登录</span>
      </div>
    </section>

    <el-form class="filter-bar toolbar-panel" :model="filters" @submit.prevent="search">
      <el-form-item label="学号">
        <el-input v-model="filters.studentNo" clearable placeholder="输入学号前缀" />
      </el-form-item>
      <el-form-item label="用户名">
        <el-input v-model="filters.username" clearable placeholder="输入用户名前缀" />
      </el-form-item>
      <el-form-item label="角色">
        <select v-model="filters.role" class="native-filter-select" aria-label="角色筛选">
          <option value="">全部角色</option>
          <option value="student">学生</option>
          <option value="admin">管理员</option>
          <option value="super_admin">超级管理员</option>
        </select>
      </el-form-item>
      <el-form-item label="状态">
        <select v-model="filters.status" class="native-filter-select" aria-label="状态筛选">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="disabled">已停用</option>
        </select>
      </el-form-item>
      <div class="filter-actions">
        <el-button native-type="submit" type="primary" :icon="Search">查询</el-button>
        <el-button :icon="RefreshRight" @click="reset">重置</el-button>
      </div>
    </el-form>

    <div class="table-panel">
      <el-alert
        v-if="error"
        class="table-alert"
        type="error"
        :closable="false"
        show-icon
        :title="error"
      >
        <template #default>
          <el-button link type="primary" @click="loadUsers">重新加载</el-button>
        </template>
      </el-alert>

      <div v-loading="loading" class="user-results">
        <el-table :data="users" row-key="id" class="users-table desktop-user-table">
          <el-table-column label="账号" min-width="190">
            <template #default="{ row }">
              <div class="identity-cell">
                <strong>{{ row.displayName }}</strong>
                <span>{{ row.studentNo }} · {{ row.username }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="roleTagType(row.role)" effect="plain">
                {{ roleLabel(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="160">
            <template #default="{ row }">{{ row.email || '—' }}</template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" min-width="120">
            <template #default="{ row }">{{ row.phone || '—' }}</template>
          </el-table-column>
          <el-table-column label="违约 / 限制" min-width="150">
            <template #default="{ row }">
              <div class="restriction-cell">
                <span>{{ row.violationCount }} 次</span>
                <el-tag v-if="row.restrictionActive" type="warning" size="small" effect="plain">
                  限制至 {{ formatDate(row.restrictionUntil) }}
                </el-tag>
                <span v-else class="muted">无限制</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'" effect="plain">
                {{ row.status === 'active' ? '正常' : '已停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button link type="primary" @click="openDetail(asAdminUser(row))"
                  >详情</el-button
                >
                <el-button
                  link
                  :type="row.status === 'active' ? 'danger' : 'primary'"
                  :disabled="row.id === currentAdminId"
                  @click="openStatusDialog(asAdminUser(row))"
                >
                  {{ row.status === 'active' ? '停用' : '恢复' }}
                </el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty :description="loading ? '正在加载' : '没有符合条件的账号'" />
          </template>
        </el-table>

        <div class="mobile-user-list">
          <article v-for="user in users" :key="user.id" class="mobile-user-card">
            <div class="mobile-card-heading">
              <div class="identity-cell">
                <strong>{{ user.displayName }}</strong>
                <span>{{ user.studentNo }} · {{ user.username }}</span>
              </div>
              <div class="mobile-tags">
                <el-tag :type="roleTagType(user.role)" size="small" effect="plain">
                  {{ roleLabel(user.role) }}
                </el-tag>
                <el-tag
                  :type="user.status === 'active' ? 'success' : 'danger'"
                  size="small"
                  effect="plain"
                >
                  {{ user.status === 'active' ? '正常' : '已停用' }}
                </el-tag>
              </div>
            </div>
            <dl class="mobile-user-fields">
              <div>
                <dt>邮箱</dt>
                <dd>{{ user.email || '—' }}</dd>
              </div>
              <div>
                <dt>手机号</dt>
                <dd>{{ user.phone || '—' }}</dd>
              </div>
              <div>
                <dt>违约 / 限制</dt>
                <dd>
                  {{ user.violationCount }} 次 ·
                  {{
                    user.restrictionActive
                      ? `限制至 ${formatDate(user.restrictionUntil)}`
                      : '无限制'
                  }}
                </dd>
              </div>
            </dl>
            <div class="mobile-card-actions">
              <el-button size="small" @click="openDetail(user)">查看详情</el-button>
              <el-button
                size="small"
                :type="user.status === 'active' ? 'danger' : 'primary'"
                plain
                :disabled="user.id === currentAdminId"
                @click="openStatusDialog(user)"
              >
                {{ user.status === 'active' ? '停用账号' : '恢复账号' }}
              </el-button>
            </div>
          </article>
          <el-empty v-if="!loading && users.length === 0" description="没有符合条件的账号" />
        </div>
      </div>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadUsers"
          @size-change="search"
        />
      </div>
    </div>

    <UserStatusDialog
      v-model="statusDialogOpen"
      :user="selectedUser"
      :pending="statusPending"
      :errors="statusErrors"
      @confirm="confirmStatus"
    />

    <CreateAdminDialog
      v-model="createDialogOpen"
      :pending="createPending"
      :errors="createErrors"
      @submit="submitCreateAdmin"
    />

    <el-drawer v-model="detailOpen" title="用户详情" size="min(94vw, 540px)">
      <el-skeleton v-if="detailLoading" :rows="6" animated />
      <template v-else-if="detail">
        <div class="detail-list">
          <div>
            <span>显示名称</span><strong>{{ detail.displayName }}</strong>
          </div>
          <div>
            <span>学号</span><strong>{{ detail.studentNo }}</strong>
          </div>
          <div>
            <span>用户名</span><strong>{{ detail.username }}</strong>
          </div>
          <div>
            <span>角色</span><strong>{{ roleLabel(detail.role) }}</strong>
          </div>
          <div>
            <span>账号状态</span
            ><strong>{{ detail.status === 'active' ? '正常' : '已停用' }}</strong>
          </div>
          <div>
            <span>邮箱</span><strong>{{ detail.email || '—' }}</strong>
          </div>
          <div>
            <span>手机号</span><strong>{{ detail.phone || '—' }}</strong>
          </div>
          <div>
            <span>有效违约</span><strong>{{ detail.violationCount }} 次</strong>
          </div>
          <div>
            <span>限制截止</span><strong>{{ formatDate(detail.restrictionUntil) }}</strong>
          </div>
          <div>
            <span>创建时间</span><strong>{{ formatDate(detail.createdAt) }}</strong>
          </div>
        </div>

        <section v-loading="auditLoading" class="audit-section" aria-labelledby="audit-title">
          <div class="audit-heading">
            <div>
              <h3 id="audit-title" class="audit-title">操作记录</h3>
              <p class="audit-summary">账号创建、停用和恢复等关键操作</p>
            </div>
            <el-tag size="small" effect="plain">{{ auditTotal }} 条</el-tag>
          </div>

          <el-alert v-if="auditError" type="error" :closable="false" show-icon :title="auditError">
            <template #default>
              <el-button link type="primary" @click="retryAuditLogs">重新加载</el-button>
            </template>
          </el-alert>

          <el-empty
            v-else-if="!auditLoading && auditItems.length === 0"
            :image-size="72"
            description="暂无操作记录"
          />

          <el-timeline v-else class="audit-timeline">
            <el-timeline-item
              v-for="item in auditItems"
              :key="item.id"
              :timestamp="formatDate(item.createdAt)"
              placement="top"
              :type="auditTimelineType(item.action)"
            >
              <article class="audit-entry">
                <div class="audit-entry-heading">
                  <strong>{{ auditActionLabel(item.action) }}</strong>
                  <span>
                    {{ item.operator?.displayName || '系统' }}
                    <template v-if="item.operator">（@{{ item.operator.username }}）</template>
                  </span>
                </div>
                <p v-if="auditStatusChange(item)" class="audit-status">
                  {{ auditStatusChange(item) }}
                </p>
                <p v-if="item.reason" class="audit-reason">原因：{{ item.reason }}</p>
              </article>
            </el-timeline-item>
          </el-timeline>

          <div v-if="auditTotal > auditPageSize" class="audit-pagination">
            <el-pagination
              small
              background
              layout="prev, pager, next"
              :current-page="auditPage"
              :page-size="auditPageSize"
              :total="auditTotal"
              @current-change="changeAuditPage"
            />
          </div>
        </section>
      </template>
    </el-drawer>
  </section>
</template>

<style scoped>
.users-page {
  display: grid;
  min-height: calc(100svh - 180px);
  align-content: start;
  gap: 24px;
}

.page-header {
  min-height: 190px;
}

.page-eyebrow {
  margin: 0 0 7px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.page-title {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 3rem;
  font-weight: 600;
  letter-spacing: -0.045em;
}

.page-summary {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
}

.page-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  position: relative;
  display: grid;
  gap: 6px;
  min-height: 104px;
  align-content: center;
  padding: 20px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
}

.summary-card-primary {
  border-color: color-mix(in srgb, var(--accent) 48%, var(--border));
  background: color-mix(in srgb, var(--accent-soft) 42%, var(--surface));
}

.summary-label {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

.summary-value {
  color: var(--text);
  font-size: 2rem;
  font-weight: 500;
  line-height: 1.1;
}

.summary-note {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(130px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface) 72%, transparent);
}

.filter-bar :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.native-filter-select {
  width: 100%;
  height: 38px;
  padding: 0 30px 0 11px;
  border: 1px solid var(--control-border);
  border-radius: var(--el-border-radius-base);
  color: var(--text);
  background: var(--surface-raised);
  font-size: 0.875rem;
}

.native-filter-select:focus-visible {
  border-color: var(--accent);
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.table-panel {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
  box-shadow: var(--shadow-card);
}

.table-alert {
  margin: 16px 16px 0;
}

.users-table {
  width: 100%;
}

.user-results {
  min-height: 220px;
}

.mobile-user-list {
  display: none;
}

.identity-cell,
.restriction-cell {
  display: grid;
  gap: 4px;
}

.identity-cell strong {
  color: var(--text);
}

.identity-cell span,
.restriction-cell span,
.muted {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.row-actions {
  display: flex;
  gap: 4px;
  white-space: nowrap;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid var(--border);
}

.detail-list {
  display: grid;
  gap: 0;
}

.detail-list div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}

.detail-list span {
  color: var(--text-muted);
}

.detail-list strong {
  color: var(--text);
  text-align: right;
  overflow-wrap: anywhere;
}

.audit-section {
  min-height: 180px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.audit-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.audit-title {
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.audit-summary {
  margin: 5px 0 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.audit-timeline {
  padding-left: 4px;
}

.audit-entry {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-muted);
}

.audit-entry-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.audit-entry-heading strong {
  color: var(--text);
  font-size: 0.875rem;
}

.audit-entry-heading span {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-align: right;
  overflow-wrap: anywhere;
}

.audit-status,
.audit-reason {
  margin: 8px 0 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.audit-status {
  color: var(--accent);
  font-weight: 600;
}

.audit-reason {
  color: var(--text-secondary);
}

.audit-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 1050px) {
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .users-page {
    min-height: auto;
  }

  .page-header {
    flex-direction: column;
  }

  .page-actions {
    width: 100%;
    justify-content: space-between;
  }

  .filter-bar {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .summary-card {
    min-height: 88px;
    padding: 14px 16px;
  }

  .summary-value {
    font-size: 1.45rem;
  }

  .filter-actions {
    grid-column: auto;
  }

  .pagination-row {
    justify-content: center;
    overflow-x: auto;
  }

  .desktop-user-table {
    display: none;
  }

  .mobile-user-list {
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  .mobile-user-card {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
  }

  .mobile-card-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .mobile-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .mobile-user-fields {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 12px;
    border-radius: 8px;
    background: var(--surface-muted);
  }

  .mobile-user-fields div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .mobile-user-fields dt {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .mobile-user-fields dd {
    margin: 0;
    color: var(--text);
    font-size: 0.8125rem;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .mobile-card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .audit-entry-heading {
    flex-direction: column;
    gap: 4px;
  }

  .audit-entry-heading span {
    text-align: left;
  }
}
</style>
