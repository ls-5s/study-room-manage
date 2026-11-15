export type FeedbackType = 'occupied_seat' | 'equipment' | 'environment' | 'other'
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'rejected'

export interface FeedbackSummary {
  id: string
  type: FeedbackType
  status: FeedbackStatus
  roomName: string | null
  seatNo: string | null
  createdAt: string
  processedAt: string | null
  closedAt: string | null
}

export interface StudentFeedbackDetail extends FeedbackSummary {
  roomId: string | null
  seatId: string | null
  description: string
  result: string | null
}

export interface AdminFeedbackSummary extends FeedbackSummary {
  descriptionExcerpt: string
  student: {
    id: string
    studentNo: string
    username: string
    displayName: string
  }
}

export interface FeedbackTimelineItem {
  id: string
  action: string
  fromStatus: FeedbackStatus | null
  toStatus: FeedbackStatus
  occurredAt: string
  operator: { id: string; displayName: string } | null
}

export interface AdminFeedbackDetail extends AdminFeedbackSummary {
  roomId: string | null
  seatId: string | null
  description: string
  result: string | null
  handledBy: { id: string; displayName: string } | null
  timeline: FeedbackTimelineItem[]
}

export interface FeedbackStatusSummary {
  pending: number
  processing: number
  resolved: number
  rejected: number
  total: number
}

export interface FeedbackPage<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface AdminFeedbackPage extends FeedbackPage<AdminFeedbackSummary> {
  summary: FeedbackStatusSummary
}

export interface FeedbackListQuery {
  status?: FeedbackStatus | '' | undefined
  type?: FeedbackType | '' | undefined
  page: number
  pageSize: number
}

export interface AdminFeedbackListQuery extends FeedbackListQuery {
  roomId?: string | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  studentNo?: string | undefined
  keyword?: string | undefined
}

export interface CreateFeedbackInput {
  type: FeedbackType
  roomId?: string
  seatId?: string
  description: string
}

export interface CreateFeedbackResult {
  id: string
  status: 'pending'
  createdAt: string
}

export type FeedbackTargetStatus = 'processing' | 'resolved' | 'rejected'
