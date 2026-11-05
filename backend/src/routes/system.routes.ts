import { Router } from 'express';
import { HttpError } from '../middleware/errors.js';
import { success } from '../types/api.js';

export interface SystemRouteDependencies {
  probeDatabase: () => Promise<void>;
}

export function createSystemRouter(dependencies: SystemRouteDependencies) {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.json(success({ status: 'ok' }, '服务运行正常'));
  });

  // The probe enforces its own deadline; this route only translates failure into a response.
  router.get('/ready', async (_request, response, next) => {
    try {
      await dependencies.probeDatabase();
      response.json(success({ status: 'ready', database: 'connected' }, '数据库连接正常'));
    } catch {
      next(new HttpError(503, 'DATABASE_UNAVAILABLE', '数据库暂时不可用'));
    }
  });

  return router;
}
