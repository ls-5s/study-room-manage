import type { UserAuditLogItem } from '../types/auth'

const actionLabels: Record<string, string> = {
  'user.admin_created': '创建管理员账号',
  'user.disabled': '停用账号',
  'user.restored': '恢复账号',
}

const statusLabels: Record<string, string> = {
  active: '正常',
  disabled: '已停用',
}

export function auditActionLabel(action: string): string {
  return actionLabels[action] ?? action
}

export function auditTimelineType(
  action: string,
): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (action === 'user.disabled') return 'danger'
  if (action === 'user.restored') return 'primary'
  if (action === 'user.admin_created') return 'success'
  return 'info'
}

export function auditStatusChange(item: UserAuditLogItem): string | null {
  const before = typeof item.before?.status === 'string' ? item.before.status : null
  const after = typeof item.after?.status === 'string' ? item.after.status : null
  if (!before && !after) return null
  if (!before && after) return `初始状态：${statusLabels[after] ?? after}`
  if (before && after && before !== after) {
    return `${statusLabels[before] ?? before} → ${statusLabels[after] ?? after}`
  }
  return null
}
