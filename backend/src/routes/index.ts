import { Router } from 'express';
import type { AuthConfig } from '../config/env.js';
import type { Database } from '../config/database.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { createUserController } from '../controllers/user.controller.js';
import { createStudyRoomController } from '../controllers/study-room.controller.js';
import { createReservationController } from '../controllers/reservation.controller.js';
import { createCheckInController } from '../controllers/check-in.controller.js';
import { createUserRateLimiter } from '../lib/user-rate-limit.js';
import type { Logger } from '../lib/logger.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { verifyTokenOnly } from '../middleware/verify-token.js';
import { createAuthenticationModels } from '../models/index.js';
import { createStudyRoomModels } from '../models/study-room-models.js';
import { createReservationModels } from '../models/reservation-models.js';
import { ReservationStateJob } from '../jobs/reservation-state.job.js';
import { AuthService } from '../services/auth.service.js';
import { SessionService } from '../services/session.service.js';
import { StudyRoomService } from '../services/study-room.service.js';
import { UserService } from '../services/user.service.js';
import { ReservationService } from '../services/reservation.service.js';
import { ReservationAvailabilityAdapter } from '../services/reservation-availability.adapter.js';
import { CheckInService } from '../services/check-in.service.js';
import { CheckInCodeService } from '../services/check-in-code.service.js';
import { NoopViolationPort } from '../services/violation.port.js';
import { createAdminRoomRouter } from './admin-room.routes.js';
import { createAdminReservationRouter } from './admin-reservation.routes.js';
import { createReservationRouter } from './reservation.routes.js';
import { createStudyRoomRouter } from './study-room.routes.js';
import { createAuthRouter } from './auth.routes.js';
import { createSystemRouter } from './system.routes.js';
import type { SystemRouteDependencies } from './system.routes.js';
import { createUserRouter } from './user.routes.js';

export interface ApiRouteDependencies extends SystemRouteDependencies {
  database: Database;
  auth: AuthConfig;
  logger?: Logger;
}

export interface ApiRouter {
  router: Router;
  reservationJob: ReservationStateJob;
}

export function createApiRouter(dependencies: ApiRouteDependencies): ApiRouter {
  const router = Router();
  const models = createAuthenticationModels(dependencies.database.sequelize);
  const sessions = new SessionService(models, dependencies.auth);
  const authService = new AuthService(
    models,
    dependencies.database.sequelize,
    sessions,
    dependencies.auth,
  );
  const userService = new UserService(
    models,
    dependencies.database.sequelize,
    dependencies.auth.bcryptCost,
  );
  const studyRoomModels = createStudyRoomModels(dependencies.database.sequelize, models);
  const reservationModels = createReservationModels(dependencies.database.sequelize, {
    StudyRoom: studyRoomModels.StudyRoom,
    RoomTimeSlot: studyRoomModels.RoomTimeSlot,
    Seat: studyRoomModels.Seat,
    User: models.User,
    AuditLog: models.AuditLog,
  });
  const availability = new ReservationAvailabilityAdapter(reservationModels);
  const studyRoomService = new StudyRoomService(studyRoomModels, availability);
  const studyRoomController = createStudyRoomController(studyRoomService);

  const reservationService = new ReservationService(reservationModels, {
    logger: dependencies.logger,
  });
  const checkInService = new CheckInService(reservationModels, {
    secret: dependencies.auth.checkInSigningSecret,
    logger: dependencies.logger,
  });
  const checkInCodeService = new CheckInCodeService(
    reservationModels,
    dependencies.auth.checkInSigningSecret,
  );
  const reservationJob = new ReservationStateJob(reservationModels, new NoopViolationPort(), {
    logger: dependencies.logger,
  });

  const reservationController = createReservationController(reservationService);
  const checkInController = createCheckInController(checkInService, checkInCodeService);
  const authenticateUser = authenticate(sessions);
  const requireAdmin = requireRole('admin', 'super_admin');
  const adminRoomDependencies = {
    controller: studyRoomController,
    authenticate: authenticateUser,
    requireAdmin,
  };

  router.use(createSystemRouter(dependencies));
  router.use(
    createAuthRouter({
      controller: createAuthController(authService, sessions),
      verifyTokenOnly: verifyTokenOnly(sessions),
    }),
  );
  router.use(
    createUserRouter({
      controller: createUserController(userService, authService),
      authenticate: authenticateUser,
      requireAdmin,
      requireSuperAdmin: requireRole('super_admin'),
    }),
  );
  router.use(createStudyRoomRouter(studyRoomController));
  router.use(createAdminRoomRouter(adminRoomDependencies));
  router.use(
    createReservationRouter({
      reservations: reservationController,
      checkIns: checkInController,
      authenticate: authenticateUser,
      createLimiter: createUserRateLimiter({ limit: 10, windowMs: 60_000 }),
      cancelLimiter: createUserRateLimiter({ limit: 10, windowMs: 60_000 }),
    }),
  );
  router.use(
    createAdminReservationRouter({
      reservations: reservationController,
      checkIns: checkInController,
      authenticate: authenticateUser,
      requireAdmin,
    }),
  );
  return { router, reservationJob };
}
