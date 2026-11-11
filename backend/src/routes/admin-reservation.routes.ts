import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createReservationController } from '../controllers/reservation.controller.js';
import type { createCheckInController } from '../controllers/check-in.controller.js';
import { manualCheckInValidation } from '../validators/reservation.validator.js';

interface AdminReservationRouterDependencies {
  reservations: ReturnType<typeof createReservationController>;
  checkIns: ReturnType<typeof createCheckInController>;
  authenticate: RequestHandler;
  requireAdmin: RequestHandler;
}

export function createAdminReservationRouter(dependencies: AdminReservationRouterDependencies) {
  const router = Router();
  const guard = [dependencies.authenticate, dependencies.requireAdmin];

  router.get('/admin/reservations', ...guard, dependencies.reservations.listAdmin);
  router.get('/admin/check-in-codes', ...guard, dependencies.checkIns.issueCode);
  router.post(
    '/admin/reservations/:id/check-in',
    ...guard,
    ...manualCheckInValidation,
    dependencies.checkIns.manualCheckIn,
  );
  return router;
}
