import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createStatisticsController } from '../controllers/statistics.controller.js';

interface StatisticsRouterDependencies {
  controller: ReturnType<typeof createStatisticsController>;
  authenticate: RequestHandler;
  requireAdmin: RequestHandler;
}

export function createStatisticsRouter(dependencies: StatisticsRouterDependencies) {
  const router = Router();
  const guard = [dependencies.authenticate, dependencies.requireAdmin];

  router.get('/admin/statistics/overview', ...guard, dependencies.controller.overview);
  router.get('/admin/statistics/trend', ...guard, dependencies.controller.trend);
  router.get('/admin/statistics/export', ...guard, dependencies.controller.export);
  return router;
}
