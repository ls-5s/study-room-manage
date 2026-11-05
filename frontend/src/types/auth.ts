import type { Paginated } from './api'

export type UserRole = 'student' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'disabled'

export interface UserSummary {
  id: string
  studentNo: string
  username: string
  displayName: string
  role: UserRole
  status: UserStatus
  restrictionUntil: string | null
}

export interface UserProfile extends UserSummary {
  email: string | null
  phone: string | null
  avatarUrl: string | null
  violationCount: number
}

export interface AdminUser extends UserSummary {
  email: string | null
  phone: string | null
  violationCount: number
  restrictionActive: boolean
  createdAt: string
}

export interface LoginInput {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  expiresAt: string
  user: UserSummary
}

export interface RegisterInput {
  studentNo: string
  username: string
  displayName: string
  password: string
  email?: string | null
}

export interface ProfileUpdateInput {
  displayName?: string
  email?: string | null
  phone?: string | null
  avatarUrl?: string | null
}

export interface PasswordChangeInput {
  oldPassword: string
  newPassword: string
}

export interface CreateAdminInput {
  username: string
  displayName: string
  password: string
  email?: string | null
  phone?: string | null
}

export interface UserListQuery {
  studentNo?: string
  username?: string
  role?: UserRole | ''
  status?: UserStatus | ''
  page: number
  pageSize: number
}

export interface UserPage extends Paginated<AdminUser> {
  summary: {
    total: number
    students: number
    admins: number
    disabled: number
  }
}

export interface UserAuditLogItem {
  id: string
  action: string
  reason: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  operator: {
    id: string
    username: string
    displayName: string
  } | null
  createdAt: string
}

export type UserAuditLogPage = Paginated<UserAuditLogItem>
