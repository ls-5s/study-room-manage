import { UniqueConstraintError } from 'sequelize';
import { HttpError } from '../middleware/errors.js';
import type { Logger } from '../lib/logger.js';
import { toBusinessIso } from '../lib/reservation-time.js';
import { verifyCheckInPayload } from '../lib/check-in-token.js';
import type { ReservationModels } from '../models/reservation-models.js';
import type { CheckInMethod } from '../models/check-in.model.js';
import type { ReservationActor } from './reservation.service.js';

export interface CheckInInput {
  roomId: string;
  nonce: string;
  issuedAt: string;
  /** Kept optional: codes no longer carry an expiry. */
  expiresAt?: string | null;
  signature: string;
}

export interface CheckInResult {
  id: string;
  status: 'checked_in';
  checkedInAt: string;
  method: CheckInMethod;
}

interface CheckInServiceOptions {
  secret: string;
  now?: (() => Date) | undefined;
  logger?: Logger | undefined;
}

function conflict(message: string): HttpError {
  return new HttpError(409, 'CONFLICT', message);
}

function fieldError(field: string, message: string): HttpError {
  return new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
    fields: { [field]: message },
  });
}

export class CheckInService {
  private readonly now: () => Date;
  private readonly logger: Logger | undefined;

  constructor(
    private readonly models: ReservationModels,
    private readonly options: CheckInServiceOptions,
  ) {
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger;
  }

  private async loadReservation(id: string) {
    if (!/^\d{1,20}$/.test(id)) throw fieldError('id', '预约编号格式不正确');
    const reservation = await this.models.Reservation.findByPk(id);
    if (!reservation) throw new HttpError(404, 'NOT_FOUND', '预约不存在');
    return reservation;
  }

  private windowText(reservation: {
    check_in_open_at: Date;
    check_in_deadline: Date;
  }): string {
    return `${toBusinessIso(reservation.check_in_open_at)} 至 ${toBusinessIso(
      reservation.check_in_deadline,
    )}`;
  }

  async checkIn(actor: ReservationActor, reservationId: string, input: CheckInInput) {
    const reservation = await this.loadReservation(reservationId);
    if (String(reservation.user_id) !== actor.id) throw new HttpError(403, 'FORBIDDEN', '无权签到该预约');
    if (reservation.status === 'checked_in') throw conflict('该预约已签到');
    if (reservation.status !== 'pending') throw conflict('该预约当前状态无法签到');

    const now = this.now();
    if (now.getTime() < reservation.check_in_open_at.getTime()) {
      throw conflict(`尚未到签到时间，签到窗口：${this.windowText(reservation)}`);
    }

    if (String(input.roomId) !== String(reservation.room_id)) {
      throw conflict('签到码与预约自习室不匹配');
    }

    // Room codes never expire; only the signature (and the per-reservation window below) gates
    // a check-in. That is intentional: a photographed code stays usable.
    const verification = verifyCheckInPayload(input, this.options.secret);
    if (!verification.ok) {
      throw new HttpError(403, 'FORBIDDEN', '签到码无效');
    }

    if (now.getTime() > reservation.check_in_deadline.getTime()) {
      throw conflict(`已超过签到截止时间，签到窗口：${this.windowText(reservation)}`);
    }

    return this.persist(reservation.id, reservation.reserve_date, {
      method: 'qr',
      nonce: input.nonce,
      operatorId: null,
      remark: null,
      actor,
      now,
    });
  }

  async manualCheckIn(actor: ReservationActor, reservationId: string, rawReason: string) {
    const reason = (rawReason ?? '').trim();
    if (reason.length < 2 || reason.length > 255) {
      throw fieldError('reason', '原因需为 2-255 个字符');
    }
    const reservation = await this.loadReservation(reservationId);
    if (reservation.status === 'checked_in') throw conflict('该预约已签到');
    if (reservation.status !== 'pending') throw conflict('该预约为终态，不能补签');
    const now = this.now();
    if (now.getTime() < reservation.check_in_open_at.getTime()) {
      throw conflict('尚未到签到时间，不能人工核验');
    }
    if (now.getTime() > reservation.end_at.getTime()) {
      throw conflict('预约已结束，不能人工核验');
    }
    return this.persist(reservation.id, reservation.reserve_date, {
      method: 'manual',
      nonce: null,
      operatorId: actor.id,
      remark: reason,
      actor,
      now,
    });
  }

  private async persist(
    reservationId: string,
    businessDate: string,
    context: {
      method: CheckInMethod;
      nonce: string | null;
      operatorId: string | null;
      remark: string | null;
      actor: ReservationActor;
      now: Date;
    },
  ): Promise<CheckInResult> {
    const { method, nonce, operatorId, remark, actor, now } = context;
    const transaction = await this.models.Reservation.sequelize!.transaction();
    try {
      const [affected] = await this.models.Reservation.update(
        { status: 'checked_in' },
        { where: { id: reservationId, status: 'pending' }, transaction },
      );
      if (affected === 0) throw conflict('预约状态已变化，请刷新后重试');

      await this.models.CheckIn.create(
        {
          reservation_id: reservationId,
          checked_in_at: now,
          business_date: businessDate,
          method,
          nonce,
          operator_id: operatorId,
          remark,
          created_at: now,
        },
        { transaction },
      );

      await this.models.ReservationStatusLog.create(
        {
          reservation_id: reservationId,
          from_status: 'pending',
          to_status: 'checked_in',
          actor_type: operatorId ? 'admin' : 'user',
          actor_id: actor.id,
          reason: method === 'manual' ? remark : null,
          occurred_at: now,
        },
        { transaction },
      );

      if (method === 'manual') {
        await this.models.AuditLog.create(
          {
            operator_id: actor.id,
            action: 'reservation.manual_check_in',
            resource_type: 'reservation',
            resource_id: reservationId,
            before_json: { status: 'pending' },
            after_json: { status: 'checked_in', method },
            reason: remark,
            request_id: null,
            created_at: now,
          },
          { transaction },
        );
      }

      await transaction.commit();
      this.logger?.info('reservation.checked_in', { reservationId, method });
      return {
        id: reservationId,
        status: 'checked_in',
        checkedInAt: toBusinessIso(now),
        method,
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UniqueConstraintError) {
        throw conflict('该预约已签到');
      }
      throw error;
    }
  }
}
