import type { Sequelize } from 'sequelize';
import { AuditLog } from './audit-log.model.js';
import { CheckIn, initCheckInModel } from './check-in.model.js';
import { Reservation, initReservationModel } from './reservation.model.js';
import {
  ReservationStatusLog,
  initReservationStatusLogModel,
} from './reservation-status-log.model.js';
import { RoomTimeSlot, initRoomTimeSlotModel } from './room-time-slot.model.js';
import { Seat, initSeatModel } from './seat.model.js';
import { StudyRoom, initStudyRoomModel } from './study-room.model.js';
import type { User } from './user.model.js';

export interface ReservationModels {
  Reservation: typeof Reservation;
  CheckIn: typeof CheckIn;
  ReservationStatusLog: typeof ReservationStatusLog;
  StudyRoom: typeof StudyRoom;
  RoomTimeSlot: typeof RoomTimeSlot;
  Seat: typeof Seat;
  User: typeof User;
  AuditLog: typeof AuditLog;
}

export function createReservationModels(
  sequelize: Sequelize,
  models: Pick<ReservationModels, 'StudyRoom' | 'RoomTimeSlot' | 'Seat' | 'User' | 'AuditLog'>,
): ReservationModels {
  initReservationModel(sequelize);
  initCheckInModel(sequelize);
  initReservationStatusLogModel(sequelize);

  Reservation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  Reservation.belongsTo(StudyRoom, { foreignKey: 'room_id', as: 'room' });
  Reservation.belongsTo(RoomTimeSlot, { foreignKey: 'slot_id', as: 'slot' });
  Reservation.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });
  Reservation.hasOne(CheckIn, { foreignKey: 'reservation_id', as: 'checkIn' });
  Reservation.hasMany(ReservationStatusLog, { foreignKey: 'reservation_id', as: 'timeline' });

  CheckIn.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });
  ReservationStatusLog.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });

  return {
    Reservation,
    CheckIn,
    ReservationStatusLog,
    StudyRoom: models.StudyRoom,
    RoomTimeSlot: models.RoomTimeSlot,
    Seat: models.Seat,
    User: models.User,
    AuditLog: models.AuditLog,
  };
}

export function createReservationModelsFromScratch(sequelize: Sequelize) {
  // Scripts (job runner, demo seeding) need the resource tables too; initialize them here
  // instead of requiring the HTTP wiring.
  initStudyRoomModel(sequelize);
  initRoomTimeSlotModel(sequelize);
  initSeatModel(sequelize);
  return {
    StudyRoom,
    RoomTimeSlot,
    Seat,
  };
}
