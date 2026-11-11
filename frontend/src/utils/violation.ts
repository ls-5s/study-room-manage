import type { ViolationStatus, ViolationType } from '../types/violation'

export const violationStatusLabels: Record<ViolationStatus, string> = {
  active: '有效',
  revoked: '已撤销',
}

export const violationStatusOptions: { value: ViolationStatus; label: string }[] = [
  { value: 'active', label: '有效' },
  { value: 'revoked', label: '已撤销' },
]

export const violationTypeLabels: Record<ViolationType, string> = {
  no_show: '预约未签到',
}

export function violationStatusTagType(status: ViolationStatus): 'danger' | 'info' {
  return status === 'active' ? 'danger' : 'info'
}

export function restrictionHint(until: string | null): string {
  return until ? `当前处于预约限制期，截止至 ${until}` : '当前没有预约限制'
}
