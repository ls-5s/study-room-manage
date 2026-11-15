import type { RequestHandler } from 'express';
import { HttpError } from './errors.js';
import type { SessionService } from '../services/session.service.js';

export function verifyTokenOnly(sessions: SessionService): RequestHandler {
  return (request, _response, next) => {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      next(new HttpError(401, 'UNAUTHORIZED', '请先登录'));
      return;
    }
    try {
      request.tokenPayload = sessions.verifyTokenOnly(authorization.slice('Bearer '.length));
      next();
    } catch (error) {
      next(error);
    }
  };
}
