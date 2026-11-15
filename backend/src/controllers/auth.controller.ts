import type { RequestHandler } from 'express';
import { LoginFailureRateLimiter } from '../lib/failure-rate-limiter.js';
import { success } from '../types/api.js';
import type { AuthService, RegisterInput } from '../services/auth.service.js';
import type { SessionService } from '../services/session.service.js';

interface LoginBody {
  username: string;
  password: string;
}

export function createAuthController(
  authService: AuthService,
  sessions: SessionService,
): {
  register: RequestHandler;
  login: RequestHandler;
  logout: RequestHandler;
  limiter: LoginFailureRateLimiter;
} {
  const limiter = new LoginFailureRateLimiter();

  return {
    limiter,
    register: async (request, response) => {
      const user = await authService.register(request.body as RegisterInput);
      response.status(201).json(success(user, '注册成功'));
    },
    login: async (request, response) => {
      const body = request.body as LoginBody;
      const username = body.username.trim().toLowerCase();
      const ip = request.ip ?? 'unknown';
      limiter.check(username, ip);
      try {
        const result = await authService.login(username, body.password);
        limiter.recordSuccess(username);
        response.json(success(result, '登录成功'));
      } catch (error) {
        limiter.recordFailure(username, ip);
        throw error;
      }
    },
    logout: async (request, response) => {
      const sessionId = request.tokenPayload?.sid;
      if (sessionId) await sessions.revoke(sessionId);
      response.json(success(null, '已退出登录'));
    },
  };
}
