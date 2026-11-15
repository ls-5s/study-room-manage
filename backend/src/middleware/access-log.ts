import type { RequestHandler } from 'express';
import { currentRequestStartedAt } from '../lib/request-context.js';
import type { Logger } from '../lib/logger.js';

export function accessLog(logger: Logger): RequestHandler {
  return (request, response, next) => {
    response.once('finish', () => {
      logger.info('request.completed', {
        requestId: request.requestId ?? 'unknown',
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.round(performance.now() - currentRequestStartedAt()),
        userId: request.auth?.user.id ?? '',
        queryKeys: Object.keys(request.query).sort().join(','),
      });
    });
    next();
  };
}
