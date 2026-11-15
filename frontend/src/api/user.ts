import type {
  AdminUser,
  CreateAdminInput,
  PasswordChangeInput,
  ProfileUpdateInput,
  UserListQuery,
  UserAuditLogPage,
  UserPage,
  UserProfile,
  UserStatus,
} from '../types/auth'
import { envelopeData, request } from '../utils/request'

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await request.get('/me')
  return envelopeData(response)
}

export async function updateCurrentUser(input: ProfileUpdateInput): Promise<UserProfile> {
  const response = await request.patch('/me', input)
  return envelopeData(response)
}

export async function changeCurrentPassword(input: PasswordChangeInput): Promise<void> {
  await request.patch('/me/password', input)
}

export async function getUsers(query: UserListQuery): Promise<UserPage> {
  const response = await request.get('/admin/users', {
    params: {
      ...query,
      role: query.role || undefined,
      status: query.status || undefined,
    },
  })
  return envelopeData(response)
}

export async function getUser(userId: string): Promise<AdminUser> {
  const response = await request.get(`/admin/users/${encodeURIComponent(userId)}`)
  return envelopeData(response)
}

export async function changeUserStatus(
  userId: string,
  status: UserStatus,
  reason: string,
): Promise<AdminUser> {
  const response = await request.patch(`/admin/users/${encodeURIComponent(userId)}/status`, {
    status,
    reason,
  })
  return envelopeData(response)
}

export async function createAdmin(input: CreateAdminInput): Promise<AdminUser> {
  const response = await request.post('/admin/users', input)
  return envelopeData(response)
}

export async function getUserAuditLogs(
  userId: string,
  page: number,
  pageSize: number,
): Promise<UserAuditLogPage> {
  const response = await request.get(`/admin/users/${encodeURIComponent(userId)}/audit-logs`, {
    params: { page, pageSize },
  })
  return envelopeData(response)
}
