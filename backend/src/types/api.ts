export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export type ApiResponse<T> =
  { code: 'OK'; message: string; data: T } | { code: ErrorCode; message: string; data: null };

export function success<T>(data: T, message: string): ApiResponse<T> {
  return { code: 'OK', message, data };
}

export function failure(code: ErrorCode, message: string): ApiResponse<never> {
  return { code, message, data: null };
}
