import { Op } from 'sequelize';
import { ACTIVE_RESERVATION_STATUSES } from '../models/reservation.model.js';
import type { ReservationModels } from '../models/reservation-models.js';
import type { ReservationAvailabilityPort } from './study-room.service.js';

function resourceWhere(resource: { roomId?: string; slotId?: string; seatId?: string }) {
  const where: Record<string, unknown> = {};
  if (resource.roomId) where.room_id = resource.roomId;
  if (resource.slotId) where.slot_id = resource.slotId;
  if (resource.seatId) where.seat_id = resource.seatId;
  return where;
}

/**
 * Bridges the study-room module's availability port to the reservation tables so that seat
 * maps and admin maintenance guards reflect live bookings without duplicating query rules.
 */
export class ReservationAvailabilityAdapter implements ReservationAvailabilityPort {
  constructor(private readonly models: ReservationModels) {}

  async findReservedSeatIds(input: {
    seatIds: readonly string[];
    startAt: Date;
    endAt: Date;
  }): Promise<ReadonlySet<string>> {
    if (input.seatIds.length === 0) return new Set();
    const rows = await this.models.Reservation.findAll({
      attributes: ['seat_id'],
      where: {
        seat_id: { [Op.in]: [...input.seatIds] },
        status: { [Op.in]: [...ACTIVE_RESERVATION_STATUSES] },
        start_at: { [Op.lt]: input.endAt },
        end_at: { [Op.gt]: input.startAt },
      },
    });
    return new Set(rows.map((row) => String(row.seat_id)));
  }

  async countPendingReservations(resource: {
    roomId?: string;
    slotId?: string;
    seatId?: string;
  }): Promise<number> {
    return this.models.Reservation.count({
      where: { ...resourceWhere(resource), status: 'pending' },
    });
  }

  async countActiveReservations(resource: {
    roomId?: string;
    slotId?: string;
    seatId?: string;
  }): Promise<number> {
    return this.models.Reservation.count({
      where: {
        ...resourceWhere(resource),
        status: { [Op.in]: [...ACTIVE_RESERVATION_STATUSES] },
      },
    });
  }
}
