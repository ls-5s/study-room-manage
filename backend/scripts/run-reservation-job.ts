import { createDatabase } from '../src/config/database.js';
import { ConfigurationError, loadDatabaseConfig } from '../src/config/env.js';
import { createLogger } from '../src/lib/logger.js';
import { createAuthenticationModels } from '../src/models/index.js';
import { createStudyRoomModels } from '../src/models/study-room-models.js';
import { createReservationModels } from '../src/models/reservation-models.js';
import { createViolationModels } from '../src/models/violation-models.js';
import { ReservationStateJob } from '../src/jobs/reservation-state.job.js';
import { SettingsService } from '../src/services/settings.service.js';
import { ViolationService } from '../src/services/violation.service.js';

function parseNow(): Date {
  const index = process.argv.indexOf('--now');
  if (index === -1) return new Date();
  const raw = process.argv[index + 1];
  if (!raw) throw new Error('--now 需要一个 ISO 时间');
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) throw new Error('--now 不是有效时间');
  return parsed;
}

async function main() {
  const databaseConfig = loadDatabaseConfig();
  const logger = createLogger();
  const now = parseNow();
  const database = createDatabase(databaseConfig);
  try {
    const authModels = createAuthenticationModels(database.sequelize);
    const studyRoomModels = createStudyRoomModels(database.sequelize, authModels);
    const reservationModels = createReservationModels(database.sequelize, {
      StudyRoom: studyRoomModels.StudyRoom,
      RoomTimeSlot: studyRoomModels.RoomTimeSlot,
      Seat: studyRoomModels.Seat,
      User: authModels.User,
      AuditLog: authModels.AuditLog,
    });
    const violationModels = createViolationModels(database.sequelize, {
      User: authModels.User,
      Reservation: reservationModels.Reservation,
      AuditLog: authModels.AuditLog,
    });
    const settingsService = new SettingsService(violationModels);
    const violationService = new ViolationService(violationModels, settingsService, { logger });
    const job = new ReservationStateJob(reservationModels, violationService, { logger });
    const result = await job.run(now);
    console.info(JSON.stringify({ now: now.toISOString(), ...result }));
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof ConfigurationError
      ? `配置无效：${error.message}`
      : error instanceof Error
        ? error.message
        : '任务执行失败',
  );
  process.exitCode = 1;
});
