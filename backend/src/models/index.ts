import type { Sequelize } from 'sequelize';
import { AuditLog, initAuditLogModel } from './audit-log.model.js';
import { initUserModel, User } from './user.model.js';
import { initUserSessionModel, UserSession } from './user-session.model.js';

export interface AuthenticationModels {
  User: typeof User;
  UserSession: typeof UserSession;
  AuditLog: typeof AuditLog;
}

export function createAuthenticationModels(sequelize: Sequelize): AuthenticationModels {
  initUserModel(sequelize);
  initUserSessionModel(sequelize);
  initAuditLogModel(sequelize);

  return {
    User,
    UserSession,
    AuditLog,
  };
}
