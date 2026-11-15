import type { UserRole } from '../types/auth'

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function roleLabel(role: UserRole): string {
  if (role === 'super_admin') return '超级管理员'
  if (role === 'admin') return '管理员'
  return '学生'
}

export function roleTagType(role: UserRole): 'warning' | 'danger' | 'info' {
  if (role === 'super_admin') return 'danger'
  if (role === 'admin') return 'warning'
  return 'info'
}
