import type { RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';

interface Window {
  count: number;
  resetAt: number;
}

export interface UserRateLimitOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

/**
 * Small in-memory per-user limiter for write endpoints. It complements (not replaces) the
 * database-level rules: the goal is to stop double clicks and scripted seat grabbing.
 */
export function createUserRateLimiter(options: UserRateLimitOptions): RequestHandler {
  const now = options.now ?? Date.now;
  const windows = new Map<string, Window>();

  function prune(current: number) {
    if (windows.size < 1_000) return;
    for (const [key, window] of windows) {
      if (window.resetAt <= current) windows.delete(key);
    }
  }

  return (request, _response, next) => {
    const userId = request.auth?.user.id;
    if (!userId) {
      next(new HttpError(401, 'UNAUTHORIZED', '请先登录'));
      return;
    }
    const current = now();
    prune(current);
    let window = windows.get(userId);
    if (!window || window.resetAt <= current) {
      window = { count: 0, resetAt: current + options.windowMs };
      windows.set(userId, window);
    }
    window.count += 1;
    if (window.count > options.limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((window.resetAt - current) / 1_000));
      next(
        new HttpError(429, 'RATE_LIMITED', '操作过于频繁，请稍后重试', null, {
          'Retry-After': String(retryAfterSeconds),
        }),
      );
      return;
    }
    next();
  };
}
