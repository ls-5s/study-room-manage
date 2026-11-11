import { Router } from 'express';
import type { AuthConfig } from '../config/env.js';
import type { Database } from '../config/database.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { createUserController } from '../controllers/user.controller.js';
import { createStudyRoomController } from '../controllers/study-room.controller.js';
import { createReservationController } from '../controllers/reservation.controller.js';
import { createCheckInController } from '../controllers/check-in.controller.js';
import { createViolationController } from '../controllers/violation.controller.js';
import { createFeedbackController } from '../controllers/feedback.controller.js';
import { createStatisticsController } from '../controllers/statistics.controller.js';
import { createSystemController } from '../controllers/system.controller.js';
import { createDynamicUserRateLimiter } from '../lib/user-rate-limit.js';
import type { Logger } from '../lib/logger.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { verifyTokenOnly } from '../middleware/verify-token.js';
import { createAuthenticationModels } from '../models/index.js';
import { createStudyRoomModels } from '../models/study-room-models.js';
import { createReservationModels } from '../models/reservation-models.js';
import { createViolationModels } from '../models/violation-models.js';
import { createFeedbackModels } from '../models/feedback-models.js';
import { createStatisticsModels } from '../models/statistics-models.js';
import { ReservationStateJob } from '../jobs/reservation-state.job.js';
import { StatisticsJob } from '../jobs/statistics.job.js';
import { AuthService } from '../services/auth.service.js';
import { SessionService } from '../services/session.service.js';
import { StudyRoomService } from '../services/study-room.service.js';
import { UserService } from '../services/user.service.js';
import { ReservationService } from '../services/reservation.service.js';
import { ReservationAvailabilityAdapter } from '../services/reservation-availability.adapter.js';
import { CheckInService } from '../services/check-in.service.js';
import { CheckInCodeService } from '../services/check-in-code.service.js';
import { SettingsService } from '../services/settings.service.js';
import { ViolationService } from '../services/violation.service.js';
import { FeedbackService } from '../services/feedback.service.js';
import { StatisticsRepository } from '../services/statistics.repository.js';
import { StatisticsService } from '../services/statistics.service.js';
import { OperationalSettingsService } from '../services/operational-settings.service.js';
import { SystemService } from '../services/system.service.js';
import { createAdminRoomRouter } from './admin-room.routes.js';
import { createAdminReservationRouter } from './admin-reservation.routes.js';
import { createReservationRouter } from './reservation.routes.js';
import { createViolationRouter } from './violation.routes.js';
import { createFeedbackRouter } from './feedback.routes.js';
import { createStatisticsRouter } from './statistics.routes.js';
import { createStudyRoomRouter } from './study-room.routes.js';
import { createAuthRouter } from './auth.routes.js';
import { createSystemRouter } from './system.routes.js';
import { createUserRouter } from './user.routes.js';
import type { ServerJob } from '../types/jobs.js';

export interface ApiRouteDependencies {
  database: Database;
  auth: AuthConfig;
  logger?: Logger;
  nodeEnv: 'development' | 'production' | 'test';
  trustProxy: number;
  jobsEnabled: boolean;
}

export interface ApiRouter {
  router: Router;
  jobs: readonly ServerJob[];
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
  const violationModels = createViolationModels(dependencies.database.sequelize, {
    User: models.User,
    Reservation: reservationModels.Reservation,
    AuditLog: models.AuditLog,
  });
  const settingsService = new SettingsService(violationModels);
  const operationalSettings = new OperationalSettingsService({
    Settings: settingsService,
    AuditLog: models.AuditLog,
  });
  settingsService.onChange(() => operationalSettings.invalidate());
  const availability = new ReservationAvailabilityAdapter(reservationModels);
  const studyRoomService = new StudyRoomService(
    studyRoomModels,
    availability,
    undefined,
    operationalSettings,
  );
  const studyRoomController = createStudyRoomController(studyRoomService);
  const violationService = new ViolationService(violationModels, settingsService, {
    logger: dependencies.logger,
  });
  const feedbackModels = createFeedbackModels(dependencies.database.sequelize, {
    User: models.User,
    StudyRoom: studyRoomModels.StudyRoom,
    Seat: studyRoomModels.Seat,
    AuditLog: models.AuditLog,
  });
  const feedbackService = new FeedbackService(feedbackModels, {
    logger: dependencies.logger,
  });
  const statisticsModels = createStatisticsModels(dependencies.database.sequelize, {
    Reservation: reservationModels.Reservation,
    StudyRoom: studyRoomModels.StudyRoom,
    RoomTimeSlot: studyRoomModels.RoomTimeSlot,
    Seat: studyRoomModels.Seat,
  });
  const statisticsRepository = new StatisticsRepository(statisticsModels);
  const statisticsService = new StatisticsService(statisticsRepository);

  const reservationService = new ReservationService(reservationModels, {
    logger: dependencies.logger,
    policy: violationService,
    settings: operationalSettings,
  });
  const checkInService = new CheckInService(reservationModels, {
    secret: dependencies.auth.checkInSigningSecret,
    logger: dependencies.logger,
  });
  const checkInCodeService = new CheckInCodeService(
    reservationModels,
    dependencies.auth.checkInSigningSecret,
  );
  const reservationJob = new ReservationStateJob(reservationModels, violationService, {
    logger: dependencies.logger,
  });
  const statisticsJob = new StatisticsJob(statisticsService, reservationJob, {
    logger: dependencies.logger,
  });
  const jobs = [reservationJob, statisticsJob] as const;
  const systemService = new SystemService(operationalSettings, {
    nodeEnv: dependencies.nodeEnv,
    trustProxy: dependencies.trustProxy,
    jobsEnabled: dependencies.jobsEnabled,
    jobs,
    probeDatabase: dependencies.database.probe,
  });

  const reservationController = createReservationController(reservationService);
  const checkInController = createCheckInController(checkInService, checkInCodeService);
  const violationController = createViolationController(violationService);
  const feedbackController = createFeedbackController(feedbackService);
  const statisticsController = createStatisticsController(statisticsService);
  const systemController = createSystemController(systemService);
  const authenticateUser = authenticate(sessions);
  const requireStudent = requireRole('student');
  const requireAdmin = requireRole('admin', 'super_admin');
  const requireSuperAdmin = requireRole('super_admin');
  const adminRoomDependencies = {
    controller: studyRoomController,
    authenticate: authenticateUser,
    requireAdmin,
  };

  router.use(
    createSystemRouter({
      probeDatabase: dependencies.database.probe,
      controller: systemController,
      authenticate: authenticateUser,
      requireAdmin,
      requireSuperAdmin,
    }),
  );
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
      requireSuperAdmin,
    }),
  );
  router.use(createStudyRoomRouter(studyRoomController));
  router.use(createAdminRoomRouter(adminRoomDependencies));
  router.use(
    createReservationRouter({
      reservations: reservationController,
      checkIns: checkInController,
      authenticate: authenticateUser,
      createLimiter: createDynamicUserRateLimiter({
        limit: async () => (await operationalSettings.getAll()).reservation.createPerMinute,
        windowMs: 60_000,
      }),
      cancelLimiter: createDynamicUserRateLimiter({
        limit: async () => (await operationalSettings.getAll()).reservation.cancelPerMinute,
        windowMs: 60_000,
      }),
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
  router.use(
    createViolationRouter({
      controller: violationController,
      authenticate: authenticateUser,
      requireAdmin,
    }),
  );
  router.use(
    createFeedbackRouter({
      controller: feedbackController,
      authenticate: authenticateUser,
      requireStudent,
      requireAdmin,
      minuteLimiter: createDynamicUserRateLimiter({
        limit: async () => (await operationalSettings.getAll()).feedback.createPerMinute,
        windowMs: 60_000,
      }),
      hourLimiter: createDynamicUserRateLimiter({
        limit: async () => (await operationalSettings.getAll()).feedback.createPerHour,
        windowMs: 60 * 60_000,
      }),
    }),
  );
  router.use(
    createStatisticsRouter({
      controller: statisticsController,
      authenticate: authenticateUser,
      requireAdmin,
    }),
  );
  return { router, jobs };
}
