import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createStudyRoomController } from '../controllers/study-room.controller.js';
import {
  createRoomValidation,
  createSeatBatchValidation,
  createTimeSlotValidation,
  updateRoomValidation,
  updateSeatValidation,
  updateTimeSlotValidation,
} from '../validators/study-room.validator.js';

export function createAdminRoomRouter(dependencies: {
  controller: ReturnType<typeof createStudyRoomController>;
  authenticate: RequestHandler;
  requireAdmin: RequestHandler;
}) {
  const router = Router();
  router.use('/admin/study-rooms', dependencies.authenticate, dependencies.requireAdmin);
  router.use('/admin/time-slots', dependencies.authenticate, dependencies.requireAdmin);
  router.use('/admin/seats', dependencies.authenticate, dependencies.requireAdmin);

  router.get('/admin/study-rooms', dependencies.controller.listAdmin);
  router.get('/admin/study-rooms/:roomId', dependencies.controller.getAdmin);
  router.post('/admin/study-rooms', ...createRoomValidation, dependencies.controller.createRoom);
  router.patch(
    '/admin/study-rooms/:roomId',
    ...updateRoomValidation,
    dependencies.controller.updateRoom,
  );
  router.post(
    '/admin/study-rooms/:roomId/time-slots',
    ...createTimeSlotValidation,
    dependencies.controller.createSlot,
  );
  router.patch(
    '/admin/time-slots/:slotId',
    ...updateTimeSlotValidation,
    dependencies.controller.updateSlot,
  );
  router.post(
    '/admin/study-rooms/:roomId/seats',
    ...createSeatBatchValidation,
    dependencies.controller.createSeats,
  );
  router.patch('/admin/seats/:seatId', ...updateSeatValidation, dependencies.controller.updateSeat);
  return router;
}
