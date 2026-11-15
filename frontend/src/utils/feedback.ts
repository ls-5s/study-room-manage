import type { FeedbackStatus, FeedbackType } from '../types/feedback'

export const feedbackTypeLabels: Readonly<Record<FeedbackType, string>> = {
  occupied_seat: '占座举报',
  equipment: '设施问题',
  environment: '环境问题',
  other: '其他问题',
}

export const feedbackStatusLabels: Readonly<Record<FeedbackStatus, string>> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  rejected: '已驳回',
}

export const feedbackTypeOptions = Object.entries(feedbackTypeLabels).map(([value, label]) => ({
  value: value as FeedbackType,
  label,
}))

export const feedbackStatusOptions = Object.entries(feedbackStatusLabels).map(([value, label]) => ({
  value: value as FeedbackStatus,
  label,
}))

export function feedbackStatusTagType(
  status: FeedbackStatus,
): 'warning' | 'primary' | 'success' | 'danger' {
  if (status === 'pending') return 'warning'
  if (status === 'processing') return 'primary'
  if (status === 'resolved') return 'success'
  return 'danger'
}

export function feedbackTypeHint(type: FeedbackType): string {
  if (type === 'occupied_seat') return '需要选择具体自习室和座位'
  if (type === 'equipment') return '可关联自习室或座位'
  if (type === 'environment') return '可关联发生问题的自习室'
  return '描述具体情况，可暂不选择资源'
}

export function feedbackLocationLabel(ticket: {
  roomName: string | null
  seatNo: string | null
}): string {
  if (ticket.roomName && ticket.seatNo) return `${ticket.roomName} · ${ticket.seatNo}`
  if (ticket.roomName) return ticket.roomName
  return '未关联具体资源'
}
