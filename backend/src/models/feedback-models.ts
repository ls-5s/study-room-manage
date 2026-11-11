import type { Sequelize } from 'sequelize';
import type { AuditLog } from './audit-log.model.js';
import { FeedbackTicket, initFeedbackTicketModel } from './feedback-ticket.model.js';
import type { Seat } from './seat.model.js';
import type { StudyRoom } from './study-room.model.js';
import type { User } from './user.model.js';

export interface FeedbackModels {
  FeedbackTicket: typeof FeedbackTicket;
  User: typeof User;
  StudyRoom: typeof StudyRoom;
  Seat: typeof Seat;
  AuditLog: typeof AuditLog;
}

export function createFeedbackModels(
  sequelize: Sequelize,
  models: Pick<FeedbackModels, 'User' | 'StudyRoom' | 'Seat' | 'AuditLog'>,
): FeedbackModels {
  initFeedbackTicketModel(sequelize);

  FeedbackTicket.belongsTo(models.User, { foreignKey: 'user_id', as: 'submitter' });
  FeedbackTicket.belongsTo(models.User, { foreignKey: 'handled_by', as: 'handler' });
  FeedbackTicket.belongsTo(models.StudyRoom, { foreignKey: 'room_id', as: 'room' });
  FeedbackTicket.belongsTo(models.Seat, { foreignKey: 'seat_id', as: 'seat' });

  return {
    FeedbackTicket,
    User: models.User,
    StudyRoom: models.StudyRoom,
    Seat: models.Seat,
    AuditLog: models.AuditLog,
  };
}
