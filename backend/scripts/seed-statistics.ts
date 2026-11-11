import { createDatabase } from '../src/config/database.js';
import { ConfigurationError, loadDatabaseConfig } from '../src/config/env.js';
import { addBusinessDays, normalizeTime, toBusinessDate } from '../src/lib/study-room-time.js';
import { createAuthenticationModels } from '../src/models/index.js';
import { createReservationModels } from '../src/models/reservation-models.js';
import { createStatisticsModels } from '../src/models/statistics-models.js';
import { createStudyRoomModels } from '../src/models/study-room-models.js';
import { StatisticsRepository } from '../src/services/statistics.repository.js';
import { StatisticsService } from '../src/services/statistics.service.js';

function minutesBetween(start: string, end: string): number {
  const toMinutes = (value: string) => {
    const [hour = 0, minute = 0] = value.split(':').map(Number);
    return hour * 60 + minute;
  };
  return Math.max(0, toMinutes(end) - toMinutes(start));
}

async function main() {
  const database = createDatabase(loadDatabaseConfig());
  try {
    const authModels = createAuthenticationModels(database.sequelize);
    const roomModels = createStudyRoomModels(database.sequelize, authModels);
    const reservationModels = createReservationModels(database.sequelize, {
      StudyRoom: roomModels.StudyRoom,
      RoomTimeSlot: roomModels.RoomTimeSlot,
      Seat: roomModels.Seat,
      User: authModels.User,
      AuditLog: authModels.AuditLog,
    });
    const models = createStatisticsModels(database.sequelize, {
      Reservation: reservationModels.Reservation,
      StudyRoom: roomModels.StudyRoom,
      RoomTimeSlot: roomModels.RoomTimeSlot,
      Seat: roomModels.Seat,
    });
    const repository = new StatisticsRepository(models);
    const service = new StatisticsService(repository);
    const now = new Date();
    const today = toBusinessDate(now);
    let seededDays = 0;

    for (let daysAgo = 6; daysAgo >= 1; daysAgo -= 1) {
      const statDate = addBusinessDays(today, -daysAgo);
      await service.ensureCapacity(statDate);
      const [demoRooms, demoSlots, demoSeats] = await Promise.all([
        roomModels.StudyRoom.findAll({ where: { status: 'open' } }),
        roomModels.RoomTimeSlot.findAll({ where: { status: 'active' } }),
        roomModels.Seat.findAll({ where: { status: 'available' } }),
      ]);
      const seatCounts = new Map<string, number>();
      for (const seat of demoSeats) {
        const roomId = String(seat.room_id);
        seatCounts.set(roomId, (seatCounts.get(roomId) ?? 0) + 1);
      }
      const demoRows = demoRooms.flatMap((room) =>
        demoSlots
          .filter((slot) => String(slot.room_id) === String(room.id))
          .map((slot) => {
            const startTime = normalizeTime(slot.start_time);
            const endTime = normalizeTime(slot.end_time);
            const seatCount = seatCounts.get(String(room.id)) ?? 0;
            return {
              stat_date: statDate,
              room_id: String(room.id),
              room_name_snapshot: room.name,
              slot_id: String(slot.id),
              slot_label: slot.label,
              slot_start_time: startTime,
              slot_end_time: endTime,
              bookable_seat_count: seatCount,
              available_seat_minutes: seatCount * minutesBetween(startTime, endTime),
              reservation_count: 0,
              checked_in_count: 0,
              no_show_count: 0,
              outage_cancelled_count: 0,
              used_seat_minutes: 0,
              finalized_at: null,
              created_at: now,
              updated_at: now,
            };
          }),
      );
      if (demoRows.length > 0) {
        await models.DailySlotMetric.bulkCreate(demoRows, { ignoreDuplicates: true });
      }
      const metrics = await models.DailySlotMetric.findAll({
        where: { stat_date: statDate },
        order: [
          ['room_id', 'ASC'],
          ['slot_start_time', 'ASC'],
        ],
      });
      const finalizedAt = new Date(`${addBusinessDays(statDate, 1)}T01:10:00+08:00`);
      for (const [index, metric] of metrics.entries()) {
        const roomSeed = Number(metric.room_id) % 5;
        const slotSeed = Number(metric.slot_start_time.slice(0, 2));
        const capacity = Number(metric.bookable_seat_count);
        const reservationCount = Math.min(
          capacity,
          7 + ((daysAgo * 3 + roomSeed * 2 + slotSeed + index) % 13),
        );
        const checkedInCount = Math.min(
          reservationCount,
          Math.floor(reservationCount * (0.62 + ((roomSeed + daysAgo) % 3) * 0.09)),
        );
        const noShowCount = Math.min(
          reservationCount - checkedInCount,
          1 + ((daysAgo + slotSeed) % 3),
        );
        const duration = minutesBetween(metric.slot_start_time, metric.slot_end_time);
        await metric.update({
          reservation_count: reservationCount,
          checked_in_count: checkedInCount,
          no_show_count: noShowCount,
          outage_cancelled_count: (daysAgo + slotSeed) % 17 === 0 ? 1 : 0,
          used_seat_minutes: checkedInCount * duration,
          finalized_at: finalizedAt,
          updated_at: finalizedAt,
        });
      }
      const run = await repository.findRun(statDate);
      if (run) {
        await run.update({ finalized_at: finalizedAt, updated_at: finalizedAt });
      }
      seededDays += 1;
    }

    await service.refreshCurrentDay(today);
    console.info(
      seededDays > 0
        ? `统计演示数据已创建：最近 7 天（新增历史快照 ${seededDays} 天）`
        : '统计演示历史快照已存在；今日实时数据已刷新',
    );
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof ConfigurationError
      ? `配置无效：${error.message}`
      : '统计演示数据初始化失败，请检查迁移和数据库连接。',
  );
  if (error instanceof Error && !(error instanceof ConfigurationError)) {
    console.error(error.message);
  }
  process.exitCode = 1;
});
