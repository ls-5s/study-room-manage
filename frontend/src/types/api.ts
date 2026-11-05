export type ErrorCode = 'BAD_REQUEST' | 'NOT_FOUND' | 'DATABASE_UNAVAILABLE' | 'INTERNAL_ERROR'

export type ApiResponse<T> =
  { code: 'OK'; message: string; data: T } | { code: ErrorCode; message: string; data: null }
