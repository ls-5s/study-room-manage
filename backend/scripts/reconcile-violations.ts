import { createDatabase } from '../src/config/database.js';
import { ConfigurationError, loadDatabaseConfig } from '../src/config/env.js';
import { createLogger } from '../src/lib/logger.js';
import { createAuthenticationModels } from '../src/models/index.js';
import { createStudyRoomModels } from '../src/models/study-room-models.js';
import { createReservationModels } from '../src/models/reservation-models.js';
import { createViolationModels } from '../src/models/violation-models.js';
import { SettingsService } from '../src/services/settings.service.js';
import { ViolationService } from '../src/services/violation.service.js';

async function main() {
  const logger = createLogger();
  const database = createDatabase(loadDatabaseConfig());
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
    const settings = new SettingsService(violationModels);
    const service = new ViolationService(violationModels, settings, { logger });
    const result = await service.reconcile();
    console.info(JSON.stringify(result));
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof ConfigurationError ? `配置无效：${error.message}` : '违约数据修复失败',
  );
  process.exitCode = 1;
});
