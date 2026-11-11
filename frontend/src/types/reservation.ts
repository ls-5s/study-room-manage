import type { Paginated } from './api'

export type ReservationStatus = 'pending' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
export type CheckInMethod = 'qr' | 'manual'

export interface CheckInWindow {
  openAt: string
  deadline: string
}

export interface ReservationSummary {
  id: string
  roomId: string
  roomName: string
  roomLocation: string
  seatId: string
  seatNo: string
  reserveDate: string
  startAt: string
  endAt: string
  status: ReservationStatus
  checkInWindow: CheckInWindow
}

export interface CheckInRecord {
  checkedInAt: string
  method: CheckInMethod
  remark: string | null
}

export interface ReservationTimelineItem {
  fromStatus: ReservationStatus | null
  toStatus: ReservationStatus
  actorType: 'user' | 'admin' | 'system'
  reason: string | null
  occurredAt: string
}

export interface ReservationDetail extends ReservationSummary {
  slotId: string
  cancelReason: string | null
  cancelledAt: string | null
  checkIn: CheckInRecord | null
  timeline: ReservationTimelineItem[]
}

export interface AdminReservation extends ReservationSummary {
  student: {
    id: string
    studentNo: string
    displayName: string
    username: string
  }
  checkInMethod: CheckInMethod | null
  checkedInAt: string | null
}

export interface CheckInPayload {
  roomId: string
  nonce: string
  issuedAt: string
  /** Always null: room codes do not expire. */
  expiresAt: string | null
  signature: string
}

export interface CheckInCodeResult {
  roomId: string
  issuedAt: string
  payload: CheckInPayload
}

export interface CreateReservationInput {
  roomId: string
  seatId: string
  slotId: string
  reserveDate: string
}

export interface CreateReservationResult extends ReservationSummary {
  replayed: boolean
}

export interface CheckInResult {
  id: string
  status: 'checked_in'
  checkedInAt: string
  method: CheckInMethod
}

export interface CancelResult {
  id: string
  status: 'cancelled'
  cancelReason: string | null
}

export interface ReservationListQuery {
  status?: ReservationStatus | '' | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  page: number
  pageSize: number
}

export interface AdminReservationQuery extends ReservationListQuery {
  roomId?: string | undefined
  seatNo?: string | undefined
  studentNo?: string | undefined
  keyword?: string | undefined
}

export type ReservationPage = Paginated<ReservationSummary>
export type AdminReservationPage = Paginated<AdminReservation>
