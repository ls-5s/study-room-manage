import type { Sequelize } from 'sequelize';
import { AuditLog } from './audit-log.model.js';
import { Reservation } from './reservation.model.js';
import { SystemSetting, initSystemSettingModel } from './system-setting.model.js';
import { User } from './user.model.js';
import { Violation, initViolationModel } from './violation.model.js';

export interface ViolationModels {
  Violation: typeof Violation;
  SystemSetting: typeof SystemSetting;
  User: typeof User;
  Reservation: typeof Reservation;
  AuditLog: typeof AuditLog;
}

export function createViolationModels(
  sequelize: Sequelize,
  models: Pick<ViolationModels, 'User' | 'Reservation' | 'AuditLog'>,
): ViolationModels {
  initViolationModel(sequelize);
  initSystemSettingModel(sequelize);

  Violation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  Violation.belongsTo(models.Reservation, { foreignKey: 'reservation_id', as: 'reservation' });
  models.Reservation.hasOne(Violation, { foreignKey: 'reservation_id', as: 'violation' });

  return {
    Violation,
    SystemSetting,
    User: models.User,
    Reservation: models.Reservation,
    AuditLog: models.AuditLog,
  };
}
