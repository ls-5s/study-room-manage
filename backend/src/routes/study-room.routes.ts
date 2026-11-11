import { Router } from 'express';
import type { createStudyRoomController } from '../controllers/study-room.controller.js';

export function createStudyRoomRouter(controller: ReturnType<typeof createStudyRoomController>) {
  const router = Router();
  router.get('/study-rooms', controller.listPublic);
  router.get('/study-rooms/:roomId/seats', controller.getPublicSeats);
  router.get('/study-rooms/:roomId', controller.getPublic);
  return router;
}
