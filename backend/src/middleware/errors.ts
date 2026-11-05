import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ErrorCode } from '../types/api.js';
import { failure } from '../types/api.js';
import type { Logger } from '../lib/logger.js';

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json(failure('NOT_FOUND', '接口不存在'));
};

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    let statusCode = 500;
    let code: ErrorCode = 'INTERNAL_ERROR';
    let message = '服务器内部错误，请稍后重试';

    if (error instanceof HttpError) {
      statusCode = error.statusCode;
      code = error.code;
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'type' in error) {
      if (error.type === 'entity.parse.failed') {
        statusCode = 400;
        code = 'BAD_REQUEST';
        message = '请求正文不是有效的 JSON';
      } else if (error.type === 'entity.too.large') {
        statusCode = 413;
        code = 'BAD_REQUEST';
        message = '请求正文超过大小限制';
      }
    }

    if (statusCode >= 500) {
      // Never serialize the source error: it may contain SQL, credentials, or a request body.
      logger.error(code === 'DATABASE_UNAVAILABLE' ? 'database.unavailable' : 'request.failed', {
        statusCode,
        method: request.method,
      });
    }
    response.status(statusCode).json(failure(code, message));
  };
}
