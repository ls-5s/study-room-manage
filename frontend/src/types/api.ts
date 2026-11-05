export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export type ApiResponse<T> =
  | { code: 'OK'; message: string; data: T }
  | {
      code: ErrorCode
      message: string
      data: { fields?: Record<string, string> } | null
    }

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}
