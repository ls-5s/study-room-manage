import type { Sequelize } from 'sequelize';
import { AuditLog } from './audit-log.model.js';
import { RoomTimeSlot, initRoomTimeSlotModel } from './room-time-slot.model.js';
import { Seat, initSeatModel } from './seat.model.js';
import { StudyRoom, initStudyRoomModel } from './study-room.model.js';
import type { User } from './user.model.js';

export interface StudyRoomModels {
  StudyRoom: typeof StudyRoom;
  RoomTimeSlot: typeof RoomTimeSlot;
  Seat: typeof Seat;
  AuditLog: typeof AuditLog;
  User: typeof User;
}

export function createStudyRoomModels(
  sequelize: Sequelize,
  models: Pick<StudyRoomModels, 'AuditLog' | 'User'>,
): StudyRoomModels {
  initStudyRoomModel(sequelize);
  initRoomTimeSlotModel(sequelize);
  initSeatModel(sequelize);
  StudyRoom.hasMany(RoomTimeSlot, { foreignKey: 'room_id', as: 'timeSlots' });
  StudyRoom.hasMany(Seat, { foreignKey: 'room_id', as: 'seats' });
  RoomTimeSlot.belongsTo(StudyRoom, { foreignKey: 'room_id', as: 'room' });
  Seat.belongsTo(StudyRoom, { foreignKey: 'room_id', as: 'room' });
  return {
    StudyRoom,
    RoomTimeSlot,
    Seat,
    AuditLog: models.AuditLog,
    User: models.User,
  };
}
