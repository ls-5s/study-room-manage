import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createFeedbackController } from '../controllers/feedback.controller.js';
import {
  createFeedbackValidation,
  feedbackIdValidation,
  transitionFeedbackValidation,
} from '../validators/feedback.validator.js';

interface FeedbackRouterDependencies {
  controller: ReturnType<typeof createFeedbackController>;
  authenticate: RequestHandler;
  requireStudent: RequestHandler;
  requireAdmin: RequestHandler;
  minuteLimiter: RequestHandler;
  hourLimiter: RequestHandler;
}

export function createFeedbackRouter(dependencies: FeedbackRouterDependencies) {
  const router = Router();
  const studentGuard = [dependencies.authenticate, dependencies.requireStudent];
  const adminGuard = [dependencies.authenticate, dependencies.requireAdmin];

  router.post(
    '/feedback-tickets',
    ...studentGuard,
    dependencies.minuteLimiter,
    dependencies.hourLimiter,
    ...createFeedbackValidation,
    dependencies.controller.create,
  );
  router.get('/me/feedback-tickets', ...studentGuard, dependencies.controller.listMine);
  router.get(
    '/me/feedback-tickets/:id',
    ...studentGuard,
    ...feedbackIdValidation,
    dependencies.controller.getMine,
  );

  router.get('/admin/feedback-tickets', ...adminGuard, dependencies.controller.listAdmin);
  router.get(
    '/admin/feedback-tickets/:id',
    ...adminGuard,
    ...feedbackIdValidation,
    dependencies.controller.getAdmin,
  );
  router.patch(
    '/admin/feedback-tickets/:id',
    ...adminGuard,
    ...transitionFeedbackValidation,
    dependencies.controller.transition,
  );
  return router;
}
