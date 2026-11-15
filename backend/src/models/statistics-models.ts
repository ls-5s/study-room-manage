import type { Sequelize } from 'sequelize';
import { DailySlotMetric, initDailySlotMetricModel } from './daily-slot-metric.model.js';
import { DailyStatisticsRun, initDailyStatisticsRunModel } from './daily-statistics-run.model.js';
import type { Reservation } from './reservation.model.js';
import type { RoomTimeSlot } from './room-time-slot.model.js';
import type { Seat } from './seat.model.js';
import type { StudyRoom } from './study-room.model.js';

export interface StatisticsModels {
  DailyStatisticsRun: typeof DailyStatisticsRun;
  DailySlotMetric: typeof DailySlotMetric;
  Reservation: typeof Reservation;
  StudyRoom: typeof StudyRoom;
  RoomTimeSlot: typeof RoomTimeSlot;
  Seat: typeof Seat;
}

export function createStatisticsModels(
  sequelize: Sequelize,
  models: Pick<StatisticsModels, 'Reservation' | 'StudyRoom' | 'RoomTimeSlot' | 'Seat'>,
): StatisticsModels {
  initDailyStatisticsRunModel(sequelize);
  initDailySlotMetricModel(sequelize);

  return {
    DailyStatisticsRun,
    DailySlotMetric,
    Reservation: models.Reservation,
    StudyRoom: models.StudyRoom,
    RoomTimeSlot: models.RoomTimeSlot,
    Seat: models.Seat,
  };
}
