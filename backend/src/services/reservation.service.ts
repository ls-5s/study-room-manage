import { Op, UniqueConstraintError, type WhereOptions } from 'sequelize';
import { isAdminRole, type UserRole } from '../models/user.model.js';
import type { ReservationModels } from '../models/reservation-models.js';
import type { ReservationStatus } from '../models/reservation.model.js';
import {
  ACTIVE_RESERVATION_STATUSES,
  type Reservation as ReservationModel,
} from '../models/reservation.model.js';
import type { CheckIn } from '../models/check-in.model.js';
import type { ReservationStatusLog } from '../models/reservation-status-log.model.js';
import { HttpError } from '../middleware/errors.js';
import type { Logger } from '../lib/logger.js';
import { currentRequestId } from '../lib/request-context.js';
import { toBusinessIso, buildSlotWindow } from '../lib/reservation-time.js';
import { MAX_BOOKING_DAYS, validateBookableDate } from '../lib/study-room-time.js';
import {
  AllowAllReservationPolicy,
  type ReservationPolicyPort,
} from './reservation-policy.port.js';
import type { OperationalSettingsService } from './operational-settings.service.js';

export const DAILY_RESERVATION_LIMIT = 2;

export interface ReservationActor {
  id: string;
  role: UserRole;
}

export interface CreateReservationInput {
  roomId: string;
  seatId: string;
  slotId: string;
  reserveDate: string;
}

export interface ReservationListFilter {
  status?: ReservationStatus;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface AdminReservationFilter extends ReservationListFilter {
  roomId?: string;
  seatNo?: string;
  studentNo?: string;
  keyword?: string;
}

export interface CheckInView {
  checkedInAt: string;
  method: 'qr' | 'manual';
  remark: string | null;
}

export interface TimelineItem {
  fromStatus: ReservationStatus | null;
  toStatus: ReservationStatus;
  actorType: 'user' | 'admin' | 'system';
  reason: string | null;
  occurredAt: string;
}

export interface ReservationSummaryView {
  id: string;
  roomId: string;
  roomName: string;
  roomLocation: string;
  seatId: string;
  seatNo: string;
  reserveDate: string;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  checkInWindow: { openAt: string; deadline: string };
}

export interface ReservationDetailView extends ReservationSummaryView {
  slotId: string;
  cancelReason: string | null;
  cancelledAt: string | null;
  checkIn: CheckInView | null;
  timeline: TimelineItem[];
}

export interface AdminReservationView extends ReservationSummaryView {
  student: { id: string; studentNo: string; displayName: string; username: string };
  checkInMethod: 'qr' | 'manual' | null;
  checkedInAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

interface ServiceOptions {
  now?: (() => Date) | undefined;
  logger?: Logger | undefined;
  policy?: ReservationPolicyPort | undefined;
  settings?: OperationalSettingsService | undefined;
}

function fieldError(field: string, message: string): HttpError {
  return new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
    fields: { [field]: message },
  });
}

function normalizeId(value: string, field: string): string {
  const normalized = value.trim();
  if (!/^\d{1,20}$/.test(normalized)) throw fieldError(field, '参数格式不正确');
  return normalized;
}

function normalizeReason(value: string | null | undefined, required: boolean): string | null {
  const normalized = (value ?? '').trim();
  if (!normalized) {
    if (required) throw fieldError('reason', '请填写操作原因');
    return null;
  }
  if (normalized.length < 2 || normalized.length > 255) {
    throw fieldError('reason', '原因需为 2-255 个字符');
  }
  return normalized;
}

function conflict(message: string): HttpError {
  return new HttpError(409, 'CONFLICT', message);
}

function forbidden(message: string): HttpError {
  return new HttpError(403, 'FORBIDDEN', message);
}

function uniqueReservationError(error: unknown): 'seat' | 'idempotency' | null {
  if (!(error instanceof UniqueConstraintError)) return null;
  const parent = error.parent as { sqlMessage?: string } | undefined;
  const message = String(parent?.sqlMessage ?? error.message);
  if (message.includes('uk_reservations_user_idempotency')) return 'idempotency';
  if (message.includes('uk_reservations_active_slot')) return 'seat';
  return null;
}

export class ReservationService {
  private readonly now: () => Date;
  private readonly logger: Logger | undefined;
  private readonly policy: ReservationPolicyPort;
  private readonly settings: OperationalSettingsService | undefined;

  constructor(
    private readonly models: ReservationModels,
    options: ServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger;
    this.policy = options.policy ?? new AllowAllReservationPolicy();
    this.settings = options.settings;
  }

  private toSummary(reservation: ReservationModel): ReservationSummaryView {
    return {
      id: String(reservation.id),
      roomId: String(reservation.room_id),
      roomName: reservation.room_name_snapshot,
      roomLocation: reservation.room_location_snapshot,
      seatId: String(reservation.seat_id),
      seatNo: reservation.seat_no_snapshot,
      reserveDate: reservation.reserve_date,
      startAt: toBusinessIso(reservation.start_at),
      endAt: toBusinessIso(reservation.end_at),
      status: reservation.status,
      checkInWindow: {
        openAt: toBusinessIso(reservation.check_in_open_at),
        deadline: toBusinessIso(reservation.check_in_deadline),
      },
    };
  }

  private async findReplay(
    userId: string,
    idempotencyKey: string,
  ): Promise<ReservationModel | null> {
    return this.models.Reservation.findOne({
      where: { user_id: userId, idempotency_key: idempotencyKey },
    });
  }

  private assertSameRequest(reservation: ReservationModel, input: CreateReservationInput): void {
    const same =
      String(reservation.room_id) === input.roomId &&
      String(reservation.seat_id) === input.seatId &&
      String(reservation.slot_id) === input.slotId &&
      reservation.reserve_date === input.reserveDate;
    if (!same) {
      throw fieldError('idempotencyKey', '该幂等键已用于其他预约，请重新选择');
    }
  }

  async create(
    actor: ReservationActor,
    idempotencyKey: string,
    rawInput: CreateReservationInput,
  ): Promise<ReservationSummaryView & { replayed: boolean }> {
    const input: CreateReservationInput = {
      roomId: normalizeId(rawInput.roomId, 'roomId'),
      seatId: normalizeId(rawInput.seatId, 'seatId'),
      slotId: normalizeId(rawInput.slotId, 'slotId'),
      reserveDate: rawInput.reserveDate,
    };
    const now = this.now();
    const operational = await this.settings?.getAll();
    const advanceDays = operational?.reservation.advanceDays ?? MAX_BOOKING_DAYS;
    const dailyLimit = operational?.reservation.dailyLimit ?? DAILY_RESERVATION_LIMIT;
    try {
      validateBookableDate(input.reserveDate, now, advanceDays);
    } catch (error) {
      throw fieldError('reserveDate', error instanceof Error ? error.message : '日期无效');
    }

    const replay = await this.findReplay(actor.id, idempotencyKey);
    if (replay) {
      this.assertSameRequest(replay, input);
      return { ...this.toSummary(replay), replayed: true };
    }

    try {
      const created = await this.models.Reservation.sequelize!.transaction(async (transaction) => {
        const user = await this.models.User.findByPk(actor.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!user) throw new HttpError(401, 'UNAUTHORIZED', '请先登录');
        if (user.status !== 'active') throw forbidden('账号已停用，请联系管理员');
        // The restriction rule lives in the violation module; M03 only calls the port.
        this.policy.assertCanReserve(user, now);

        const sameDayCount = await this.models.Reservation.count({
          where: {
            user_id: user.id,
            reserve_date: input.reserveDate,
            status: { [Op.in]: [...ACTIVE_RESERVATION_STATUSES] },
          },
          transaction,
        });
        if (sameDayCount >= dailyLimit) {
          throw conflict(`今日有效预约已达到上限（${dailyLimit} 条）`);
        }

        const room = await this.models.StudyRoom.findByPk(input.roomId, {
          transaction,
          lock: transaction.LOCK.SHARE,
        });
        if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在');
        if (room.status !== 'open') throw conflict('自习室当前不可预约');
        if (room.bookable_from > input.reserveDate) throw conflict('自习室尚未到可预约日期');

        const slot = await this.models.RoomTimeSlot.findByPk(input.slotId, {
          transaction,
          lock: transaction.LOCK.SHARE,
        });
        if (!slot) throw new HttpError(404, 'NOT_FOUND', '开放时段不存在');
        if (String(slot.room_id) !== String(room.id)) {
          throw fieldError('slotId', '开放时段不属于该自习室');
        }
        if (slot.status !== 'active') throw conflict('所选时段当前不可预约');
        if (slot.bookable_from > input.reserveDate) throw conflict('所选时段尚未到可预约日期');

        const window = buildSlotWindow(
          input.reserveDate,
          String(slot.start_time),
          String(slot.end_time),
        );
        if (window.startAt.getTime() <= now.getTime()) {
          throw conflict('所选时段已经开始，无法预约');
        }

        const seat = await this.models.Seat.findByPk(input.seatId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!seat) throw new HttpError(404, 'NOT_FOUND', '座位不存在');
        if (String(seat.room_id) !== String(room.id)) {
          throw fieldError('seatId', '座位不属于该自习室');
        }
        if (seat.status !== 'available') throw conflict('座位当前不可预约');
        if (seat.bookable_from > input.reserveDate) throw conflict('座位尚未到可预约日期');

        const seatConflict = await this.models.Reservation.findOne({
          where: {
            seat_id: seat.id,
            status: { [Op.in]: [...ACTIVE_RESERVATION_STATUSES] },
            start_at: { [Op.lt]: window.endAt },
            end_at: { [Op.gt]: window.startAt },
          },
          transaction,
        });
        if (seatConflict) throw conflict('该座位在所选时段已被预约');

        const userConflict = await this.models.Reservation.findOne({
          where: {
            user_id: user.id,
            status: { [Op.in]: [...ACTIVE_RESERVATION_STATUSES] },
            start_at: { [Op.lt]: window.endAt },
            end_at: { [Op.gt]: window.startAt },
          },
          transaction,
        });
        if (userConflict) throw conflict('所选时段与已有预约重叠');

        const reservation = await this.models.Reservation.create(
          {
            user_id: String(user.id),
            room_id: String(room.id),
            seat_id: String(seat.id),
            slot_id: String(slot.id),
            room_name_snapshot: room.name,
            room_location_snapshot: room.location,
            seat_no_snapshot: seat.seat_no,
            reserve_date: input.reserveDate,
            start_at: window.startAt,
            end_at: window.endAt,
            check_in_open_at: window.checkInOpenAt,
            check_in_deadline: window.checkInDeadline,
            status: 'pending',
            idempotency_key: idempotencyKey,
            cancel_reason: null,
            cancelled_by: null,
            cancelled_at: null,
          },
          { transaction },
        );

        await this.models.ReservationStatusLog.create(
          {
            reservation_id: String(reservation.id),
            from_status: null,
            to_status: 'pending',
            actor_type: 'user',
            actor_id: String(user.id),
            reason: null,
            occurred_at: now,
          },
          { transaction },
        );

        return reservation;
      });

      this.logger?.info('reservation.created', {
        reservationId: String(created.id),
        roomId: String(created.room_id),
      });
      return { ...this.toSummary(created), replayed: false };
    } catch (error) {
      // A concurrent duplicate submission may lose the race on the seat or idempotency index;
      // both must resolve to the same stored reservation instead of a confusing conflict.
      const existing = await this.findReplay(actor.id, idempotencyKey);
      if (existing) {
        this.assertSameRequest(existing, input);
        return { ...this.toSummary(existing), replayed: true };
      }
      const unique = uniqueReservationError(error);
      if (unique === 'seat') throw conflict('该座位在所选时段已被预约');
      if (unique === 'idempotency') throw conflict('请求重复提交，请刷新后查看预约');
      throw error;
    }
  }

  async listMine(
    actor: ReservationActor,
    filter: ReservationListFilter,
  ): Promise<PagedResult<ReservationSummaryView>> {
    const where: WhereOptions = { user_id: actor.id };
    const scoped = this.withFilters(where, filter);
    const { rows, count } = await this.models.Reservation.findAndCountAll({
      where: scoped,
      order: [
        ['reserve_date', 'DESC'],
        ['start_at', 'DESC'],
        ['id', 'DESC'],
      ],
      offset: (filter.page - 1) * filter.pageSize,
      limit: filter.pageSize,
    });
    return {
      items: rows.map((row) => this.toSummary(row)),
      page: filter.page,
      pageSize: filter.pageSize,
      total: count,
    };
  }

  private withFilters(where: WhereOptions, filter: ReservationListFilter): WhereOptions {
    const query = { ...(where as Record<string | symbol, unknown>) };
    if (filter.status) query.status = filter.status;
    const dateRange: Record<symbol, string> = {};
    if (filter.dateFrom) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.dateFrom)) {
        throw fieldError('dateFrom', '日期格式必须为 YYYY-MM-DD');
      }
      dateRange[Op.gte] = filter.dateFrom;
    }
    if (filter.dateTo) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.dateTo)) {
        throw fieldError('dateTo', '日期格式必须为 YYYY-MM-DD');
      }
      dateRange[Op.lte] = filter.dateTo;
    }
    if (Object.getOwnPropertySymbols(dateRange).length > 0) {
      query.reserve_date = dateRange;
    }
    return query as WhereOptions;
  }

  private async timelineFor(reservationId: string): Promise<TimelineItem[]> {
    const rows = await this.models.ReservationStatusLog.findAll({
      where: { reservation_id: reservationId },
      order: [
        ['occurred_at', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return rows.map((row) => this.toTimelineItem(row));
  }

  private toTimelineItem(row: ReservationStatusLog): TimelineItem {
    return {
      fromStatus: row.from_status,
      toStatus: row.to_status,
      actorType: row.actor_type,
      reason: row.reason,
      occurredAt: toBusinessIso(row.occurred_at),
    };
  }

  private toCheckInView(checkIn: CheckIn | null): CheckInView | null {
    if (!checkIn) return null;
    return {
      checkedInAt: toBusinessIso(checkIn.checked_in_at),
      method: checkIn.method,
      remark: checkIn.remark,
    };
  }

  async getDetail(actor: ReservationActor, rawId: string): Promise<ReservationDetailView> {
    const id = normalizeId(rawId, 'id');
    const reservation = await this.models.Reservation.findByPk(id);
    if (!reservation) throw new HttpError(404, 'NOT_FOUND', '预约不存在');
    this.assertCanRead(actor, reservation);
    const [checkIn, timeline] = await Promise.all([
      this.models.CheckIn.findOne({ where: { reservation_id: id } }),
      this.timelineFor(id),
    ]);
    return {
      ...this.toSummary(reservation),
      slotId: String(reservation.slot_id),
      cancelReason: reservation.cancel_reason,
      cancelledAt: reservation.cancelled_at ? toBusinessIso(reservation.cancelled_at) : null,
      checkIn: this.toCheckInView(checkIn),
      timeline,
    };
  }

  private assertCanRead(actor: ReservationActor, reservation: ReservationModel): void {
    if (isAdminRole(actor.role)) return;
    if (String(reservation.user_id) !== actor.id) throw forbidden('无权访问该预约');
  }

  async cancel(actor: ReservationActor, rawId: string, rawReason: string | undefined) {
    const id = normalizeId(rawId, 'id');
    const admin = isAdminRole(actor.role);
    const reason = normalizeReason(rawReason, admin);
    const now = this.now();

    return this.models.Reservation.sequelize!.transaction(async (transaction) => {
      const snapshot = await this.models.Reservation.findByPk(id, { transaction });
      if (!snapshot) throw new HttpError(404, 'NOT_FOUND', '预约不存在');
      if (!admin && String(snapshot.user_id) !== actor.id) throw forbidden('无权取消该预约');

      // Keep the same lock order as creation: user row first, then the reservation.
      await this.models.User.findByPk(snapshot.user_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const reservation = await this.models.Reservation.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!reservation) throw new HttpError(404, 'NOT_FOUND', '预约不存在');
      if (reservation.status !== 'pending') {
        throw conflict(
          reservation.status === 'checked_in' ? '已签到预约不支持取消' : '该预约当前状态不允许取消',
        );
      }
      if (!admin && reservation.start_at.getTime() <= now.getTime()) {
        throw conflict('预约已开始，学生不能取消，请联系管理员');
      }

      const [affected] = await this.models.Reservation.update(
        {
          status: 'cancelled',
          cancel_reason: reason,
          cancelled_by: actor.id,
          cancelled_at: now,
        },
        { where: { id, status: 'pending' }, transaction },
      );
      if (affected === 0) throw conflict('预约状态已变化，请刷新后重试');

      await this.models.ReservationStatusLog.create(
        {
          reservation_id: id,
          from_status: 'pending',
          to_status: 'cancelled',
          actor_type: admin ? 'admin' : 'user',
          actor_id: actor.id,
          reason,
          occurred_at: now,
        },
        { transaction },
      );

      if (admin) {
        await this.models.AuditLog.create(
          {
            operator_id: actor.id,
            action: 'reservation.cancelled',
            resource_type: 'reservation',
            resource_id: id,
            before_json: { status: 'pending' },
            after_json: { status: 'cancelled', reason },
            reason,
            request_id: currentRequestId(),
            created_at: now,
          },
          { transaction },
        );
      }
      return { id, status: 'cancelled' as const, cancelReason: reason };
    });
  }

  async listAdmin(filter: AdminReservationFilter): Promise<PagedResult<AdminReservationView>> {
    const where: Record<string | symbol, unknown> = {};
    if (filter.roomId) where.room_id = normalizeId(filter.roomId, 'roomId');
    if (filter.seatNo) where.seat_no_snapshot = filter.seatNo.trim();
    if (filter.status) where.status = filter.status;
    if (filter.dateFrom)
      where.reserve_date = { ...(where.reserve_date as object), [Op.gte]: filter.dateFrom };
    if (filter.dateTo)
      where.reserve_date = { ...(where.reserve_date as object), [Op.lte]: filter.dateTo };

    const or: unknown[] = [];
    if (filter.studentNo) or.push({ '$user.student_no$': filter.studentNo.trim() });
    if (filter.keyword) {
      const keyword = filter.keyword.trim();
      or.push({ '$user.student_no$': keyword });
      or.push({ '$user.display_name$': { [Op.like]: `%${keyword}%` } });
      or.push({ room_name_snapshot: { [Op.like]: `%${keyword}%` } });
      or.push({ seat_no_snapshot: keyword });
    }
    if (or.length > 0) where[Op.or] = or;

    const { rows, count } = await this.models.Reservation.findAndCountAll({
      where: where as WhereOptions,
      include: [
        {
          model: this.models.User,
          as: 'user',
          attributes: ['id', 'student_no', 'display_name', 'username'],
          required: false,
        },
      ],
      order: [
        ['start_at', 'DESC'],
        ['id', 'DESC'],
      ],
      offset: (filter.page - 1) * filter.pageSize,
      limit: filter.pageSize,
      subQuery: false,
    });

    const checkIns = await this.checkInsFor(rows.map((row) => String(row.id)));

    return {
      items: rows.map((row) => this.toAdminView(row, checkIns.get(String(row.id)) ?? null)),
      page: filter.page,
      pageSize: filter.pageSize,
      total: count,
    };
  }

  private async checkInsFor(reservationIds: string[]): Promise<Map<string, CheckIn>> {
    if (reservationIds.length === 0) return new Map();
    const rows = await this.models.CheckIn.findAll({
      where: { reservation_id: { [Op.in]: reservationIds } },
    });
    return new Map(rows.map((row) => [String(row.reservation_id), row]));
  }

  private toAdminView(
    reservation: ReservationModel,
    checkIn: CheckIn | null,
  ): AdminReservationView {
    const user = (reservation as unknown as { user?: Record<string, unknown> }).user;
    return {
      ...this.toSummary(reservation),
      student: {
        id: String(user?.id ?? reservation.user_id),
        studentNo: String(user?.student_no ?? ''),
        displayName: String(user?.display_name ?? ''),
        username: String(user?.username ?? ''),
      },
      checkInMethod: checkIn?.method ?? null,
      checkedInAt: checkIn ? toBusinessIso(checkIn.checked_in_at) : null,
    };
  }
}
