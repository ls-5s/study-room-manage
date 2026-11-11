import type {
  SeatMapStatus,
  SeatStaticStatus,
  StudyRoomStatus,
  TimeSlotStatus,
} from '../types/study-room'

export const roomStatusLabels: Record<StudyRoomStatus, string> = {
  open: '开放',
  closed: '关闭',
  disabled: '停用',
}

export const slotStatusLabels: Record<TimeSlotStatus, string> = {
  active: '启用',
  inactive: '停用',
}

export const seatStatusLabels: Record<SeatMapStatus, string> = {
  available: '空闲',
  reserved: '已预约',
  maintenance: '维修',
  disabled: '停用',
}

export const staticSeatStatusLabels: Record<SeatStaticStatus, string> = {
  available: '可用',
  maintenance: '维修',
  disabled: '停用',
}

export function roomStatusTagType(status: StudyRoomStatus): 'success' | 'info' | 'danger' {
  return status === 'open' ? 'success' : status === 'closed' ? 'info' : 'danger'
}

export function seatStatusTagType(
  status: SeatMapStatus,
): 'success' | 'warning' | 'info' | 'danger' {
  return status === 'available'
    ? 'success'
    : status === 'reserved'
      ? 'warning'
      : status === 'maintenance'
        ? 'info'
        : 'danger'
}

export function businessToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function addDays(date: string, days: number): string {
  const [year = 0, month = 0, day = 0] = date.split('-').map(Number)
  const value = new Date(Date.UTC(year, month - 1, day + days))
  return [
    String(value.getUTCFullYear()).padStart(4, '0'),
    String(value.getUTCMonth() + 1).padStart(2, '0'),
    String(value.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

export function isPastSlot(date: string, endTime: string): boolean {
  const today = businessToday()
  if (date !== today) return false
  const now = new Date()
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return endTime <= current
}
