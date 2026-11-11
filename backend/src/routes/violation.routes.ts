import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createViolationController } from '../controllers/violation.controller.js';
import { revokeViolationValidation, violationRulesValidation } from '../validators/violation.validator.js';

interface ViolationRouterDependencies {
  controller: ReturnType<typeof createViolationController>;
  authenticate: RequestHandler;
  requireAdmin: RequestHandler;
}

export function createViolationRouter(dependencies: ViolationRouterDependencies) {
  const router = Router();
  const guard = [dependencies.authenticate, dependencies.requireAdmin];

  router.get('/me/violations', dependencies.authenticate, dependencies.controller.listMine);

  router.get('/admin/violations', ...guard, dependencies.controller.listAdmin);
  router.patch(
    '/admin/violations/:id',
    ...guard,
    ...revokeViolationValidation,
    dependencies.controller.revoke,
  );
  router.get('/admin/violation-rules', ...guard, dependencies.controller.getRules);
  router.put(
    '/admin/violation-rules',
    ...guard,
    ...violationRulesValidation,
    dependencies.controller.updateRules,
  );
  return router;
}
