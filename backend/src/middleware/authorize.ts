import type { RequestHandler } from 'express';
import type { UserRole } from '../models/user.model.js';
import { HttpError } from './errors.js';

export function requireRole(...roles: readonly UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(new HttpError(401, 'UNAUTHORIZED', '请先登录'));
      return;
    }
    if (!roles.includes(request.auth.user.role)) {
      next(new HttpError(403, 'FORBIDDEN', '无权访问该资源'));
      return;
    }
    next();
  };
}
