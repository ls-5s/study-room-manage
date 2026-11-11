export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ErrorDetails {
  fields?: Record<string, string>;
  requestId?: string;
}

export type ApiResponse<T> =
  | { code: 'OK'; message: string; data: T }
  | { code: ErrorCode; message: string; data: ErrorDetails | null };

export function success<T>(data: T, message: string): ApiResponse<T> {
  return { code: 'OK', message, data };
}

export function failure(
  code: ErrorCode,
  message: string,
  data: ErrorDetails | null = null,
): ApiResponse<never> {
  return { code, message, data };
}
