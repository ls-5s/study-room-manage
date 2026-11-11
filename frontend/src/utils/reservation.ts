import type { CheckInWindow, ReservationStatus } from '../types/reservation'

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  pending: '待签到',
  checked_in: '已签到',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '已失约',
}

export const reservationStatusOptions: { value: ReservationStatus; label: string }[] = [
  { value: 'pending', label: '待签到' },
  { value: 'checked_in', label: '已签到' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'no_show', label: '已失约' },
]

export function reservationStatusTagType(
  status: ReservationStatus,
): 'success' | 'info' | 'warning' | 'danger' | 'primary' {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'checked_in':
      return 'success'
    case 'completed':
      return 'info'
    case 'no_show':
      return 'danger'
    default:
      return 'info'
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return dateTimeFormatter.format(new Date(value))
}

export function formatTimeRange(startAt: string, endAt: string): string {
  return `${timeFormatter.format(new Date(startAt))}–${timeFormatter.format(new Date(endAt))}`
}

export type WindowState = 'before' | 'open' | 'closed'

export function windowState(window: CheckInWindow, now = new Date()): WindowState {
  const current = now.getTime()
  if (current < new Date(window.openAt).getTime()) return 'before'
  if (current > new Date(window.deadline).getTime()) return 'closed'
  return 'open'
}

export function windowHint(window: CheckInWindow, state: WindowState): string {
  const openAt = formatDateTime(window.openAt)
  const deadline = formatDateTime(window.deadline)
  if (state === 'before') return `签到窗口将于 ${openAt} 开启`
  if (state === 'closed') return `签到窗口已于 ${deadline} 关闭`
  return `请在 ${deadline} 前完成签到`
}

export function canCancel(startAt: string, status: ReservationStatus): boolean {
  return status === 'pending' && new Date(startAt).getTime() > Date.now()
}

export function timelineActorLabel(actorType: 'user' | 'admin' | 'system'): string {
  return actorType === 'user' ? '本人' : actorType === 'admin' ? '管理员' : '系统'
}
