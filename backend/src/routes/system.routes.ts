import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createSystemController } from '../controllers/system.controller.js';
import { HttpError } from '../middleware/errors.js';
import { success } from '../types/api.js';

export interface SystemRouteDependencies {
  probeDatabase: () => Promise<void>;
  controller: ReturnType<typeof createSystemController>;
  authenticate: RequestHandler;
  requireAdmin: RequestHandler;
  requireSuperAdmin: RequestHandler;
}

export function createSystemRouter(dependencies: SystemRouteDependencies) {
  const router = Router();

  router.get('/system/public-config', dependencies.controller.publicConfig);

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

  router.get(
    '/admin/system/status',
    dependencies.authenticate,
    dependencies.requireAdmin,
    dependencies.controller.status,
  );
  router.get(
    '/admin/system/settings',
    dependencies.authenticate,
    dependencies.requireAdmin,
    dependencies.controller.getSettings,
  );
  router.put(
    '/admin/system/settings',
    dependencies.authenticate,
    dependencies.requireSuperAdmin,
    dependencies.controller.updateSettings,
  );

  return router;
}
