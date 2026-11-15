import { Op, type Transaction } from 'sequelize';
import { OUTAGE_CANCELLATION_REASON } from '../lib/reservation-status.js';
import { normalizeTime, timeToMinutes } from '../lib/study-room-time.js';
import type { DailySlotMetric } from '../models/daily-slot-metric.model.js';
import type { DailyStatisticsRun } from '../models/daily-statistics-run.model.js';
import type { StatisticsModels } from '../models/statistics-models.js';
import type { ReservationStatus } from '../models/reservation.model.js';

export class SnapshotPendingError extends Error {
  constructor(readonly statDate: string) {
    super(`统计日期 ${statDate} 尚未完成结算`);
    this.name = 'SnapshotPendingError';
  }
}

interface UsageTotals {
  reservationCount: number;
  checkedInCount: number;
  noShowCount: number;
  outageCancelledCount: number;
  usedSeatMinutes: number;
}

function metricKey(roomId: string, slotId: string): string {
  return `${roomId}:${slotId}`;
}

function emptyUsage(): UsageTotals {
  return {
    reservationCount: 0,
    checkedInCount: 0,
    noShowCount: 0,
    outageCancelledCount: 0,
    usedSeatMinutes: 0,
  };
}

const COUNTED_RESERVATION_STATUSES: readonly ReservationStatus[] = [
  'pending',
  'checked_in',
  'completed',
  'no_show',
];

export class StatisticsRepository {
  constructor(private readonly models: StatisticsModels) {}

  async findRun(statDate: string): Promise<DailyStatisticsRun | null> {
    return this.models.DailyStatisticsRun.findByPk(statDate);
  }

  async listRuns(dateFrom: string, dateTo: string): Promise<DailyStatisticsRun[]> {
    return this.models.DailyStatisticsRun.findAll({
      where: { stat_date: { [Op.between]: [dateFrom, dateTo] } },
      order: [['stat_date', 'ASC']],
    });
  }

  async listMetrics(dateFrom: string, dateTo: string, roomId?: string): Promise<DailySlotMetric[]> {
    return this.models.DailySlotMetric.findAll({
      where: {
        stat_date: { [Op.between]: [dateFrom, dateTo] },
        ...(roomId ? { room_id: roomId } : {}),
      },
      order: [
        ['stat_date', 'ASC'],
        ['room_id', 'ASC'],
        ['slot_start_time', 'ASC'],
      ],
    });
  }

  async ensureCapacity(statDate: string, now: Date): Promise<DailyStatisticsRun> {
    const existing = await this.models.DailyStatisticsRun.findByPk(statDate);
    if (existing) return existing;

    try {
      return await this.models.DailyStatisticsRun.sequelize!.transaction(async (transaction) => {
        const locked = await this.models.DailyStatisticsRun.findByPk(statDate, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (locked) return locked;

        const [rooms, slots, seats] = await Promise.all([
          this.models.StudyRoom.findAll({
            attributes: ['id', 'name'],
            where: {
              status: 'open',
              bookable_from: { [Op.lte]: statDate },
            },
            transaction,
          }),
          this.models.RoomTimeSlot.findAll({
            attributes: ['id', 'room_id', 'label', 'start_time', 'end_time'],
            where: {
              status: 'active',
              bookable_from: { [Op.lte]: statDate },
            },
            transaction,
          }),
          this.models.Seat.findAll({
            attributes: ['room_id'],
            where: {
              status: 'available',
              bookable_from: { [Op.lte]: statDate },
            },
            transaction,
          }),
        ]);

        const seatsByRoom = new Map<string, number>();
        for (const seat of seats) {
          const roomId = String(seat.room_id);
          seatsByRoom.set(roomId, (seatsByRoom.get(roomId) ?? 0) + 1);
        }

        const metrics = rooms.flatMap((room) => {
          const roomId = String(room.id);
          const bookableSeatCount = seatsByRoom.get(roomId) ?? 0;
          return slots
            .filter((slot) => String(slot.room_id) === roomId)
            .map((slot) => {
              const startTime = normalizeTime(slot.start_time);
              const endTime = normalizeTime(slot.end_time);
              const minutes = timeToMinutes(endTime) - timeToMinutes(startTime);
              return {
                stat_date: statDate,
                room_id: roomId,
                room_name_snapshot: room.name,
                slot_id: String(slot.id),
                slot_label: slot.label,
                slot_start_time: startTime,
                slot_end_time: endTime,
                bookable_seat_count: bookableSeatCount,
                available_seat_minutes: bookableSeatCount * minutes,
                reservation_count: 0,
                checked_in_count: 0,
                no_show_count: 0,
                outage_cancelled_count: 0,
                used_seat_minutes: 0,
                finalized_at: null,
                created_at: now,
                updated_at: now,
              };
            });
        });

        if (metrics.length > 0) {
          await this.models.DailySlotMetric.bulkCreate(metrics, { transaction });
        }
        return this.models.DailyStatisticsRun.create(
          {
            stat_date: statDate,
            capacity_snapshotted_at: now,
            finalized_at: null,
            created_at: now,
            updated_at: now,
          },
          { transaction },
        );
      });
    } catch (error) {
      const raced = await this.models.DailyStatisticsRun.findByPk(statDate);
      if (raced) return raced;
      throw error;
    }
  }

  async refreshUsage(statDate: string, now: Date): Promise<void> {
    await this.models.DailySlotMetric.sequelize!.transaction(async (transaction) => {
      await this.refreshUsageInTransaction(statDate, now, transaction);
    });
  }

  async finalize(statDate: string, now: Date): Promise<boolean> {
    return this.models.DailyStatisticsRun.sequelize!.transaction(async (transaction) => {
      const run = await this.models.DailyStatisticsRun.findByPk(statDate, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!run) throw new SnapshotPendingError(statDate);
      if (run.finalized_at) return false;

      const [pending, endedButCheckedIn] = await Promise.all([
        this.models.Reservation.count({
          where: { reserve_date: statDate, status: 'pending' },
          transaction,
        }),
        this.models.Reservation.count({
          where: {
            reserve_date: statDate,
            status: 'checked_in',
            end_at: { [Op.lte]: now },
          },
          transaction,
        }),
      ]);
      if (pending > 0 || endedButCheckedIn > 0) throw new SnapshotPendingError(statDate);

      await this.refreshUsageInTransaction(statDate, now, transaction);
      await this.models.DailySlotMetric.update(
        { finalized_at: now, updated_at: now },
        { where: { stat_date: statDate, finalized_at: null }, transaction },
      );
      run.finalized_at = now;
      run.updated_at = now;
      await run.save({ transaction });
      return true;
    });
  }

  private async refreshUsageInTransaction(
    statDate: string,
    now: Date,
    transaction: Transaction,
  ): Promise<void> {
    const metrics = await this.models.DailySlotMetric.findAll({
      where: { stat_date: statDate, finalized_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (metrics.length === 0) return;

    const reservations = await this.models.Reservation.findAll({
      attributes: ['room_id', 'slot_id', 'status', 'cancel_reason', 'start_at', 'end_at'],
      where: { reserve_date: statDate },
      transaction,
    });

    const totals = new Map<string, UsageTotals>();
    for (const reservation of reservations) {
      const key = metricKey(String(reservation.room_id), String(reservation.slot_id));
      const current = totals.get(key) ?? emptyUsage();
      if (
        reservation.status === 'cancelled' &&
        reservation.cancel_reason === OUTAGE_CANCELLATION_REASON
      ) {
        current.outageCancelledCount += 1;
      } else if (COUNTED_RESERVATION_STATUSES.includes(reservation.status)) {
        current.reservationCount += 1;
        if (reservation.status === 'no_show') current.noShowCount += 1;
        if (reservation.status === 'checked_in' || reservation.status === 'completed') {
          current.checkedInCount += 1;
          current.usedSeatMinutes += Math.max(
            0,
            Math.round((reservation.end_at.getTime() - reservation.start_at.getTime()) / 60_000),
          );
        }
      }
      totals.set(key, current);
    }

    for (const metric of metrics) {
      const usage =
        totals.get(metricKey(String(metric.room_id), String(metric.slot_id))) ?? emptyUsage();
      metric.reservation_count = usage.reservationCount;
      metric.checked_in_count = usage.checkedInCount;
      metric.no_show_count = usage.noShowCount;
      metric.outage_cancelled_count = usage.outageCancelledCount;
      metric.used_seat_minutes = usage.usedSeatMinutes;
      metric.updated_at = now;
      await metric.save({ transaction });
    }
  }
}
