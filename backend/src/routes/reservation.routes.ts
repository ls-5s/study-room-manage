import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createReservationController } from '../controllers/reservation.controller.js';
import type { createCheckInController } from '../controllers/check-in.controller.js';
import {
  cancelReservationValidation,
  checkInValidation,
  createReservationValidation,
} from '../validators/reservation.validator.js';

interface ReservationRouterDependencies {
  reservations: ReturnType<typeof createReservationController>;
  checkIns: ReturnType<typeof createCheckInController>;
  authenticate: RequestHandler;
  createLimiter: RequestHandler;
  cancelLimiter: RequestHandler;
}

export function createReservationRouter(dependencies: ReservationRouterDependencies) {
  const router = Router();
  router.post(
    '/reservations',
    dependencies.authenticate,
    dependencies.createLimiter,
    ...createReservationValidation,
    dependencies.reservations.create,
  );
  router.get('/me/reservations', dependencies.authenticate, dependencies.reservations.listMine);
  router.get('/reservations/:id', dependencies.authenticate, dependencies.reservations.getOne);
  router.post(
    '/reservations/:id/cancel',
    dependencies.authenticate,
    dependencies.cancelLimiter,
    ...cancelReservationValidation,
    dependencies.reservations.cancel,
  );
  router.post(
    '/reservations/:id/check-in',
    dependencies.authenticate,
    ...checkInValidation,
    dependencies.checkIns.checkIn,
  );
  return router;
}
