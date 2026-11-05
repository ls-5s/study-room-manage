import { Router } from 'express';
import { createSystemRouter } from './system.routes.js';
import type { SystemRouteDependencies } from './system.routes.js';

export function createApiRouter(dependencies: SystemRouteDependencies) {
  const router = Router();
  router.use(createSystemRouter(dependencies));
  return router;
}
