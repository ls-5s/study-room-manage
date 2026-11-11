export type ViolationStatus = 'active' | 'revoked'
export type ViolationType = 'no_show'

export interface ViolationRecord {
  id: string
  type: ViolationType
  status: ViolationStatus
  reason: string
  occurredAt: string
  resolvedAt: string | null
  resolutionReason: string | null
  roomName: string
  seatNo: string
  reserveDate: string
  startAt: string
  endAt: string
}

export interface AdminViolationRecord extends ViolationRecord {
  student: {
    id: string
    studentNo: string
    displayName: string
    username: string
  }
  resolvedBy: string | null
}

export interface ViolationSummary {
  activeCount: number
  threshold: number
  restrictionDays: number
  restrictionUntil: string | null
}

export interface ViolationPage<T> {
  summary: ViolationSummary
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface ViolationRules {
  threshold: number
  restrictionDays: number
}

export interface MyViolationQuery {
  status?: ViolationStatus | '' | undefined
  page: number
  pageSize: number
}

export interface AdminViolationQuery extends MyViolationQuery {
  studentNo?: string | undefined
  roomId?: string | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
}

export interface RevokeResult {
  id: string
  status: 'revoked'
  changed: boolean
}
