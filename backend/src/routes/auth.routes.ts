import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';
import { loginValidation, registerValidation } from '../validators/auth.validator.js';
import type { createAuthController } from '../controllers/auth.controller.js';

interface AuthRouterDependencies {
  controller: ReturnType<typeof createAuthController>;
  verifyTokenOnly: RequestHandler;
}

export function createAuthRouter(dependencies: AuthRouterDependencies) {
  const router = Router();
  const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1_000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) =>
      next(
        new HttpError(429, 'RATE_LIMITED', '注册请求过于频繁，请稍后重试', null, {
          'Retry-After': '3600',
        }),
      ),
  });

  router.post(
    '/auth/register',
    registrationLimiter,
    ...registerValidation,
    dependencies.controller.register,
  );
  router.post('/auth/login', ...loginValidation, dependencies.controller.login);
  router.post('/auth/logout', dependencies.verifyTokenOnly, dependencies.controller.logout);
  return router;
}
