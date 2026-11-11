import { Op, UniqueConstraintError, type Transaction, type WhereOptions } from 'sequelize';
import {
  assertTimeRange,
  formatSeatNumber,
  isValidSeatPrefix,
  nextBusinessDate,
  normalizeSeatPrefix,
  normalizeTime,
  toBusinessDate,
  validateBookableDate,
} from '../lib/study-room-time.js';
import { HttpError } from '../middleware/errors.js';
import type { RoomTimeSlot } from '../models/room-time-slot.model.js';
import type { Seat, SeatStatus } from '../models/seat.model.js';
import type { StudyRoomModels } from '../models/study-room-models.js';
import type { StudyRoom, StudyRoomStatus } from '../models/study-room.model.js';

export type DynamicSeatStatus = SeatStatus | 'reserved';

export interface ReservationAvailabilityPort {
  findReservedSeatIds(input: {
    seatIds: readonly string[];
    startAt: Date;
    endAt: Date;
  }): Promise<ReadonlySet<string>>;
  countPendingReservations(resource: {
    roomId?: string;
    slotId?: string;
    seatId?: string;
  }): Promise<number>;
  countActiveReservations(resource: {
    roomId?: string;
    slotId?: string;
    seatId?: string;
  }): Promise<number>;
}

export class NoopReservationAvailability implements ReservationAvailabilityPort {
  async findReservedSeatIds(): Promise<ReadonlySet<string>> {
    return new Set();
  }

  async countPendingReservations(): Promise<number> {
    return 0;
  }

  async countActiveReservations(): Promise<number> {
    return 0;
  }
}

export interface PublicRoomFilter {
  keyword?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  page: number;
  pageSize: number;
}

export interface AdminRoomFilter {
  keyword?: string;
  status?: StudyRoomStatus;
  page: number;
  pageSize: number;
}

export interface RoomInput {
  name: string;
  location: string;
  description?: string | null;
  gridRows: number;
  gridColumns: number;
}

export interface RoomUpdateInput extends Partial<RoomInput> {
  status?: StudyRoomStatus;
}

export interface TimeSlotInput {
  label: string;
  startTime: string;
  endTime: string;
  status?: 'active' | 'inactive';
}

export type TimeSlotUpdateInput = Partial<TimeSlotInput>;

export interface SeatBatchInput {
  prefix: string;
  rows: number;
  columns: number;
  startRow: number;
  startColumn: number;
  skip?: readonly { row: number; column: number }[];
}

export interface SeatUpdateInput {
  seatNo?: string;
  row?: number;
  column?: number;
  status?: SeatStatus;
  remark?: string | null;
}

interface SeatMapSeat {
  id: string;
  seatNo: string;
  row: number;
  column: number;
  status: DynamicSeatStatus;
  disabledReason: string | null;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function fieldError(field: string, message: string): HttpError {
  return new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
    fields: { [field]: message },
  });
}

function normalizeName(value: string): string {
  const normalized = value.trim();
  if (normalized.length < 2 || normalized.length > 64) {
    throw fieldError('name', '自习室名称需为 2-64 个字符');
  }
  return normalized;
}

function normalizeLocation(value: string): string {
  const normalized = value.trim();
  if (normalized.length < 2 || normalized.length > 128) {
    throw fieldError('location', '位置需为 2-128 个字符');
  }
  return normalized;
}

function normalizeDescription(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value.trim() === '') return null;
  const normalized = value.trim();
  if (normalized.length > 500) throw fieldError('description', '说明不能超过 500 个字符');
  return normalized;
}

function normalizeGrid(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw fieldError(field, '网格尺寸必须为 1-50 的整数');
  }
  return value;
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
  field: string,
  maximum: number,
): number {
  const normalized = value ?? fallback;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > maximum) {
    throw fieldError(field, `必须为 1-${maximum} 的整数`);
  }
  return normalized;
}

function normalizeLabel(value: string): string {
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > 32) {
    throw fieldError('label', '时段名称需为 1-32 个字符');
  }
  return normalized;
}

function roomStatusLabel(status: StudyRoomStatus): string {
  return status === 'open' ? '开放' : status === 'closed' ? '关闭' : '停用';
}

function seatStatusLabel(status: SeatStatus): string {
  return status === 'available' ? '可用' : status === 'maintenance' ? '维修' : '停用';
}

function uniqueConflict(error: unknown): never {
  if (error instanceof UniqueConstraintError) {
    throw new HttpError(409, 'CONFLICT', '名称、时段名称、批次前缀、座位编号或坐标已存在');
  }
  throw error;
}

function combineBusinessDateTime(date: string, time: string): Date {
  return new Date(`${date}T${normalizeTime(time)}:00+08:00`);
}

export function resolveSeatAvailability(
  seats: readonly Seat[],
  reservedSeatIds: ReadonlySet<string>,
): SeatMapSeat[] {
  return seats.map((seat) => {
    const reserved = reservedSeatIds.has(String(seat.id));
    const status: DynamicSeatStatus =
      seat.status !== 'available' ? seat.status : reserved ? 'reserved' : 'available';
    return {
      id: String(seat.id),
      seatNo: seat.seat_no,
      row: seat.row_no,
      column: seat.column_no,
      status,
      disabledReason: status === 'maintenance' || status === 'disabled' ? seat.remark : null,
    };
  });
}

function slotView(slot: RoomTimeSlot) {
  return {
    id: String(slot.id),
    label: slot.label,
    startTime: normalizeTime(slot.start_time),
    endTime: normalizeTime(slot.end_time),
    status: slot.status,
    bookableFrom: slot.bookable_from,
  };
}

function seatView(seat: Seat) {
  return {
    id: String(seat.id),
    batchPrefix: seat.batch_prefix,
    seatNo: seat.seat_no,
    row: seat.row_no,
    column: seat.column_no,
    status: seat.status,
    bookableFrom: seat.bookable_from,
    remark: seat.remark,
  };
}

export class StudyRoomService {
  constructor(
    private readonly models: StudyRoomModels,
    private readonly reservations: ReservationAvailabilityPort = new NoopReservationAvailability(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private publicRoomWhere(date: string, keyword?: string): WhereOptions {
    const where: Record<string | symbol, unknown> = {
      status: 'open',
      bookable_from: { [Op.lte]: date },
    };
    if (keyword) {
      const escaped = escapeLike(keyword);
      where[Op.or] = [
        { name: { [Op.like]: `%${escaped}%` } },
        { location: { [Op.like]: `%${escaped}%` } },
      ];
    }
    return where as WhereOptions;
  }

  private assertPublicDate(date: string): string {
    try {
      return validateBookableDate(date, this.now()).date;
    } catch (error) {
      throw fieldError('date', error instanceof Error ? error.message : '日期无效');
    }
  }

  private async countSeatMetrics(roomId: string, date: string) {
    const [seatCount, available] = await Promise.all([
      this.models.Seat.count({ where: { room_id: roomId } }),
      this.models.Seat.findAll({
        where: {
          room_id: roomId,
          status: 'available',
          bookable_from: { [Op.lte]: date },
        },
        attributes: ['id'],
      }),
    ]);
    return {
      seatCount,
      availableSeatIds: available.map((seat) => String(seat.id)),
      bookableSeatCount: available.length,
    };
  }

  private async roomSummary(room: StudyRoom, date: string) {
    const metrics = await this.countSeatMetrics(String(room.id), date);
    return {
      id: String(room.id),
      name: room.name,
      location: room.location,
      description: room.description,
      status: room.status,
      bookableFrom: room.bookable_from,
      grid: { rows: room.grid_rows, columns: room.grid_columns },
      seatCount: metrics.seatCount,
      bookableSeatCount: metrics.bookableSeatCount,
    };
  }

  async listPublicRooms(filter: PublicRoomFilter) {
    const hasAnyTimeFilter =
      filter.date !== undefined || filter.startTime !== undefined || filter.endTime !== undefined;
    const hasAllTimeFilters =
      filter.date !== undefined && filter.startTime !== undefined && filter.endTime !== undefined;
    if (hasAnyTimeFilter && !hasAllTimeFilters) {
      throw new HttpError(422, 'VALIDATION_ERROR', '请同时选择日期、开始时间和结束时间', {
        fields: { date: '日期、开始时间和结束时间必须同时提供' },
      });
    }

    const today = toBusinessDate(this.now());
    const date = hasAllTimeFilters ? this.assertPublicDate(filter.date!) : today;
    const startTime = filter.startTime ? normalizeTime(filter.startTime) : undefined;
    const endTime = filter.endTime ? normalizeTime(filter.endTime) : undefined;
    if (startTime && endTime) {
      try {
        assertTimeRange(startTime, endTime);
      } catch (error) {
        throw fieldError('startTime', error instanceof Error ? error.message : '时间范围无效');
      }
    }

    if (!hasAllTimeFilters) {
      const { rows, count } = await this.models.StudyRoom.findAndCountAll({
        where: this.publicRoomWhere(today, filter.keyword),
        order: [
          ['name', 'ASC'],
          ['id', 'ASC'],
        ],
        offset: (filter.page - 1) * filter.pageSize,
        limit: filter.pageSize,
      });
      const items = await Promise.all(rows.map((room) => this.roomSummary(room, today)));
      return { items, page: filter.page, pageSize: filter.pageSize, total: count };
    }

    const rooms = await this.models.StudyRoom.findAll({
      where: this.publicRoomWhere(date, filter.keyword),
      order: [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    const matched = [];
    for (const room of rooms) {
      const slot = await this.models.RoomTimeSlot.findOne({
        where: {
          room_id: room.id,
          status: 'active',
          start_time: startTime!,
          end_time: endTime!,
          bookable_from: { [Op.lte]: date },
        },
        order: [['id', 'ASC']],
      });
      if (!slot) continue;
      const metrics = await this.countSeatMetrics(String(room.id), date);
      const reserved = await this.reservations.findReservedSeatIds({
        seatIds: metrics.availableSeatIds,
        startAt: combineBusinessDateTime(date, startTime!),
        endAt: combineBusinessDateTime(date, endTime!),
      });
      matched.push({
        ...(await this.roomSummary(room, date)),
        matchedSlot: slotView(slot),
        availableSeatCount: Math.max(0, metrics.bookableSeatCount - reserved.size),
      });
    }
    const offset = (filter.page - 1) * filter.pageSize;
    return {
      items: matched.slice(offset, offset + filter.pageSize),
      page: filter.page,
      pageSize: filter.pageSize,
      total: matched.length,
    };
  }

  async getPublicRoom(roomId: string, requestedDate?: string) {
    const date = this.assertPublicDate(requestedDate ?? toBusinessDate(this.now()));
    const room = await this.models.StudyRoom.findOne({
      where: { id: roomId, ...this.publicRoomWhere(date) },
    });
    if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在或暂不可预约');
    const [summary, slots] = await Promise.all([
      this.roomSummary(room, date),
      this.models.RoomTimeSlot.findAll({
        where: {
          room_id: room.id,
          status: 'active',
          bookable_from: { [Op.lte]: date },
        },
        order: [
          ['start_time', 'ASC'],
          ['id', 'ASC'],
        ],
      }),
    ]);
    return {
      ...summary,
      date,
      timeSlots: slots.map(slotView),
    };
  }

  async getPublicSeats(roomId: string, requestedDate: string, slotId: string) {
    const date = this.assertPublicDate(requestedDate);
    const room = await this.models.StudyRoom.findOne({
      where: { id: roomId, ...this.publicRoomWhere(date) },
    });
    if (!room) throw new HttpError(409, 'CONFLICT', '自习室当前不可预约');
    const slot = await this.models.RoomTimeSlot.findOne({
      where: {
        id: slotId,
        room_id: room.id,
        status: 'active',
        bookable_from: { [Op.lte]: date },
      },
    });
    if (!slot) throw new HttpError(409, 'CONFLICT', '所选时段当前不可预约');
    const seats = await this.models.Seat.findAll({
      where: {
        room_id: room.id,
        bookable_from: { [Op.lte]: date },
      },
      order: [
        ['row_no', 'ASC'],
        ['column_no', 'ASC'],
      ],
    });
    const startAt = combineBusinessDateTime(date, slot.start_time);
    const endAt = combineBusinessDateTime(date, slot.end_time);
    const seatIds = seats.map((seat) => String(seat.id));
    const reserved = await this.reservations.findReservedSeatIds({ seatIds, startAt, endAt });
    const items = resolveSeatAvailability(seats, reserved);
    return {
      roomId: String(room.id),
      date,
      slot: {
        id: String(slot.id),
        label: slot.label,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      },
      seats: items,
      availableSeatCount: items.filter((seat) => seat.status === 'available').length,
    };
  }

  async listAdminRooms(filter: AdminRoomFilter) {
    const where: Record<string | symbol, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.keyword) {
      const escaped = escapeLike(filter.keyword);
      where[Op.or] = [
        { name: { [Op.like]: `%${escaped}%` } },
        { location: { [Op.like]: `%${escaped}%` } },
      ];
    }
    const today = toBusinessDate(this.now());
    const { rows, count } = await this.models.StudyRoom.findAndCountAll({
      where: where as WhereOptions,
      order: [
        ['updated_at', 'DESC'],
        ['id', 'DESC'],
      ],
      offset: (filter.page - 1) * filter.pageSize,
      limit: filter.pageSize,
    });
    return {
      items: await Promise.all(rows.map((room) => this.roomSummary(room, today))),
      page: filter.page,
      pageSize: filter.pageSize,
      total: count,
    };
  }

  async getAdminRoom(roomId: string) {
    const room = await this.models.StudyRoom.findByPk(roomId);
    if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在');
    const [slots, seats, metrics] = await Promise.all([
      this.models.RoomTimeSlot.findAll({
        where: { room_id: room.id },
        order: [
          ['start_time', 'ASC'],
          ['id', 'ASC'],
        ],
      }),
      this.models.Seat.findAll({
        where: { room_id: room.id },
        order: [
          ['row_no', 'ASC'],
          ['column_no', 'ASC'],
        ],
      }),
      this.countSeatMetrics(String(room.id), toBusinessDate(this.now())),
    ]);
    return {
      id: String(room.id),
      name: room.name,
      location: room.location,
      description: room.description,
      grid: { rows: room.grid_rows, columns: room.grid_columns },
      status: room.status,
      bookableFrom: room.bookable_from,
      seatCount: metrics.seatCount,
      bookableSeatCount: metrics.bookableSeatCount,
      timeSlots: slots.map(slotView),
      seats: seats.map(seatView),
    };
  }

  async createRoom(operatorId: string, input: RoomInput) {
    const name = normalizeName(input.name);
    const location = normalizeLocation(input.location);
    const description = normalizeDescription(input.description);
    const gridRows = normalizeGrid(input.gridRows, 'gridRows');
    const gridColumns = normalizeGrid(input.gridColumns, 'gridColumns');
    try {
      const roomId = await this.models.StudyRoom.sequelize!.transaction(async (transaction) => {
        const room = await this.models.StudyRoom.create(
          {
            name,
            location,
            description,
            grid_rows: gridRows,
            grid_columns: gridColumns,
            status: 'closed',
            bookable_from: nextBusinessDate(this.now()),
          },
          { transaction },
        );
        await this.models.AuditLog.create(
          {
            operator_id: operatorId,
            action: 'study_room.created',
            resource_type: 'study_room',
            resource_id: String(room.id),
            before_json: null,
            after_json: { name, location, gridRows, gridColumns, status: 'closed' },
            reason: '创建自习室',
            request_id: null,
            created_at: this.now(),
          },
          { transaction },
        );
        return String(room.id);
      });
      return this.getAdminRoom(roomId);
    } catch (error) {
      return uniqueConflict(error);
    }
  }

  private async assertRoomOpenable(room: StudyRoom, targetDate: string, transaction: Transaction) {
    const [slotCount, seatCount] = await Promise.all([
      this.models.RoomTimeSlot.count({
        where: {
          room_id: room.id,
          status: 'active',
          bookable_from: { [Op.lte]: targetDate },
        },
        transaction,
      }),
      this.models.Seat.count({
        where: {
          room_id: room.id,
          status: 'available',
          bookable_from: { [Op.lte]: targetDate },
        },
        transaction,
      }),
    ]);
    if (slotCount < 1 || seatCount < 1) {
      throw new HttpError(409, 'CONFLICT', '至少配置一个有效时段和一个可用座位后才能开放');
    }
  }

  private async autoCloseIfEmpty(
    room: StudyRoom,
    operatorId: string,
    transaction: Transaction,
    reason: string,
  ) {
    if (room.status !== 'open') return false;
    const today = toBusinessDate(this.now());
    const date = room.bookable_from > today ? room.bookable_from : today;
    const [slotCount, seatCount] = await Promise.all([
      this.models.RoomTimeSlot.count({
        where: {
          room_id: room.id,
          status: 'active',
          bookable_from: { [Op.lte]: date },
        },
        transaction,
      }),
      this.models.Seat.count({
        where: {
          room_id: room.id,
          status: 'available',
          bookable_from: { [Op.lte]: date },
        },
        transaction,
      }),
    ]);
    if (slotCount > 0 && seatCount > 0) return false;
    room.status = 'closed';
    await room.save({ transaction });
    await this.models.AuditLog.create(
      {
        operator_id: operatorId,
        action: 'study_room.auto_closed',
        resource_type: 'study_room',
        resource_id: String(room.id),
        before_json: { status: 'open' },
        after_json: { status: 'closed' },
        reason,
        request_id: null,
        created_at: this.now(),
      },
      { transaction },
    );
    return true;
  }

  async updateRoom(operatorId: string, roomId: string, input: RoomUpdateInput) {
    const result = await this.models.StudyRoom.sequelize!.transaction(async (transaction) => {
      const room = await this.models.StudyRoom.findByPk(roomId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在');
      const before = {
        name: room.name,
        location: room.location,
        description: room.description,
        gridRows: room.grid_rows,
        gridColumns: room.grid_columns,
        status: room.status,
      };
      const nextGridRows =
        input.gridRows === undefined ? room.grid_rows : normalizeGrid(input.gridRows, 'gridRows');
      const nextGridColumns =
        input.gridColumns === undefined
          ? room.grid_columns
          : normalizeGrid(input.gridColumns, 'gridColumns');
      const outOfBounds = await this.models.Seat.count({
        where: {
          room_id: room.id,
          [Op.or]: [
            { row_no: { [Op.gt]: nextGridRows } },
            { column_no: { [Op.gt]: nextGridColumns } },
          ],
        },
        transaction,
      });
      if (outOfBounds > 0) {
        throw new HttpError(409, 'CONFLICT', '请先移动超出新网格范围的座位');
      }

      const locationChanged =
        input.location !== undefined && normalizeLocation(input.location) !== room.location;
      if (locationChanged) {
        const active = await this.reservations.countActiveReservations({ roomId });
        if (active > 0) throw new HttpError(409, 'CONFLICT', '自习室仍有活动预约，不能修改位置');
      }
      if (input.name !== undefined) room.name = normalizeName(input.name);
      if (input.location !== undefined) room.location = normalizeLocation(input.location);
      if (input.description !== undefined) {
        room.description = normalizeDescription(input.description);
      }
      room.grid_rows = nextGridRows;
      room.grid_columns = nextGridColumns;

      let autoClosed = false;
      let nextBookableFrom = room.bookable_from;
      if (input.status !== undefined && input.status !== room.status) {
        if (room.status === 'open' && (input.status === 'closed' || input.status === 'disabled')) {
          const pending = await this.reservations.countPendingReservations({ roomId });
          if (pending > 0) {
            throw new HttpError(409, 'CONFLICT', `仍有 ${pending} 条待签到预约，请先处理`);
          }
        }
        if (input.status === 'open') {
          const candidate = nextBusinessDate(this.now());
          nextBookableFrom = room.bookable_from > candidate ? room.bookable_from : candidate;
          await this.assertRoomOpenable(room, nextBookableFrom, transaction);
        }
        room.status = input.status;
        room.bookable_from = nextBookableFrom;
      }
      await room.save({ transaction });
      if (input.status !== 'open') {
        autoClosed = await this.autoCloseIfEmpty(
          room,
          operatorId,
          transaction,
          '房间已无有效时段或可用座位',
        );
      }
      await this.models.AuditLog.create(
        {
          operator_id: operatorId,
          action: 'study_room.updated',
          resource_type: 'study_room',
          resource_id: String(room.id),
          before_json: before,
          after_json: {
            name: room.name,
            location: room.location,
            description: room.description,
            gridRows: room.grid_rows,
            gridColumns: room.grid_columns,
            status: room.status,
          },
          reason: '修改自习室',
          request_id: null,
          created_at: this.now(),
        },
        { transaction },
      );
      return { roomId: String(room.id), autoClosed };
    });
    return { ...(await this.getAdminRoom(result.roomId)), autoClosed: result.autoClosed };
  }

  async createTimeSlot(operatorId: string, roomId: string, input: TimeSlotInput) {
    const label = normalizeLabel(input.label);
    const startTime = normalizeTime(input.startTime);
    const endTime = normalizeTime(input.endTime);
    try {
      assertTimeRange(startTime, endTime);
    } catch (error) {
      throw fieldError('startTime', error instanceof Error ? error.message : '时间范围无效');
    }
    try {
      const created = await this.models.StudyRoom.sequelize!.transaction(async (transaction) => {
        const room = await this.models.StudyRoom.findByPk(roomId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在');
        if (input.status !== 'inactive') {
          const overlap = await this.models.RoomTimeSlot.findOne({
            where: {
              room_id: room.id,
              status: 'active',
              start_time: { [Op.lt]: `${endTime}:00` },
              end_time: { [Op.gt]: `${startTime}:00` },
            },
            transaction,
          });
          if (overlap) throw new HttpError(409, 'CONFLICT', '开放时段与现有有效时段重叠');
        }
        const slot = await this.models.RoomTimeSlot.create(
          {
            room_id: String(room.id),
            label,
            start_time: startTime,
            end_time: endTime,
            status: input.status ?? 'active',
            bookable_from: nextBusinessDate(this.now()),
          },
          { transaction },
        );
        await this.models.AuditLog.create(
          {
            operator_id: operatorId,
            action: 'study_room.slot_created',
            resource_type: 'room_time_slot',
            resource_id: String(slot.id),
            before_json: null,
            after_json: {
              roomId: String(room.id),
              label,
              startTime,
              endTime,
              status: slot.status,
            },
            reason: '新增开放时段',
            request_id: null,
            created_at: this.now(),
          },
          { transaction },
        );
        return String(slot.id);
      });
      return { id: created, room: await this.getAdminRoom(roomId), autoClosed: false };
    } catch (error) {
      return uniqueConflict(error);
    }
  }

  async updateTimeSlot(operatorId: string, slotId: string, input: TimeSlotUpdateInput) {
    const result = await this.models.StudyRoom.sequelize!.transaction(async (transaction) => {
      const snapshot = await this.models.RoomTimeSlot.findByPk(slotId, { transaction });
      if (!snapshot) throw new HttpError(404, 'NOT_FOUND', '开放时段不存在');
      const room = await this.models.StudyRoom.findByPk(snapshot.room_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在');
      const slot = await this.models.RoomTimeSlot.findByPk(slotId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!slot) throw new HttpError(404, 'NOT_FOUND', '开放时段不存在');
      const before = {
        label: slot.label,
        startTime: normalizeTime(slot.start_time),
        endTime: normalizeTime(slot.end_time),
        status: slot.status,
      };
      const startTime =
        input.startTime === undefined
          ? normalizeTime(slot.start_time)
          : normalizeTime(input.startTime);
      const endTime =
        input.endTime === undefined ? normalizeTime(slot.end_time) : normalizeTime(input.endTime);
      try {
        assertTimeRange(startTime, endTime);
      } catch (error) {
        throw fieldError('startTime', error instanceof Error ? error.message : '时间范围无效');
      }
      const boundaryChanged =
        startTime !== normalizeTime(slot.start_time) || endTime !== normalizeTime(slot.end_time);
      if (boundaryChanged) {
        const active = await this.reservations.countActiveReservations({ slotId });
        if (active > 0) throw new HttpError(409, 'CONFLICT', '时段仍有活动预约，不能修改起止时间');
      }
      const nextStatus = input.status ?? slot.status;
      if (slot.status === 'active' && nextStatus === 'inactive') {
        const pending = await this.reservations.countPendingReservations({ slotId });
        if (pending > 0) {
          throw new HttpError(409, 'CONFLICT', `仍有 ${pending} 条待签到预约，请先处理`);
        }
      }
      if (nextStatus === 'active' && (boundaryChanged || slot.status === 'inactive')) {
        const overlap = await this.models.RoomTimeSlot.findOne({
          where: {
            room_id: room.id,
            id: { [Op.ne]: slot.id },
            status: 'active',
            start_time: { [Op.lt]: `${endTime}:00` },
            end_time: { [Op.gt]: `${startTime}:00` },
          },
          transaction,
        });
        if (overlap) throw new HttpError(409, 'CONFLICT', '开放时段与现有有效时段重叠');
      }
      if (input.label !== undefined) slot.label = normalizeLabel(input.label);
      slot.start_time = startTime;
      slot.end_time = endTime;
      slot.status = nextStatus;
      if (slot.status === 'active' && before.status === 'inactive') {
        slot.bookable_from = nextBusinessDate(this.now());
      }
      await slot.save({ transaction });
      const autoClosed = await this.autoCloseIfEmpty(
        room,
        operatorId,
        transaction,
        '时段停用后房间已无有效时段或可用座位',
      );
      await this.models.AuditLog.create(
        {
          operator_id: operatorId,
          action: 'study_room.slot_updated',
          resource_type: 'room_time_slot',
          resource_id: String(slot.id),
          before_json: before,
          after_json: {
            label: slot.label,
            startTime,
            endTime,
            status: slot.status,
          },
          reason: '修改开放时段',
          request_id: null,
          created_at: this.now(),
        },
        { transaction },
      );
      return { roomId: String(room.id), autoClosed };
    });
    return { room: await this.getAdminRoom(result.roomId), autoClosed: result.autoClosed };
  }

  async createSeatBatch(operatorId: string, roomId: string, input: SeatBatchInput) {
    const prefix = normalizeSeatPrefix(input.prefix);
    if (!isValidSeatPrefix(prefix)) {
      throw fieldError('prefix', '批次前缀需为 1-8 位字母或数字');
    }
    const rows = normalizePositiveInteger(input.rows, 1, 'rows', 50);
    const columns = normalizePositiveInteger(input.columns, 1, 'columns', 50);
    const startRow = normalizePositiveInteger(input.startRow, 1, 'startRow', 50);
    const startColumn = normalizePositiveInteger(input.startColumn, 1, 'startColumn', 50);
    if (rows * columns > 500) throw fieldError('rows', '单批最多生成 500 个座位');
    const skipKeys = new Set<string>();
    for (const item of input.skip ?? []) {
      if (
        !Number.isInteger(item.row) ||
        !Number.isInteger(item.column) ||
        item.row < startRow ||
        item.row >= startRow + rows ||
        item.column < startColumn ||
        item.column >= startColumn + columns
      ) {
        throw fieldError('skip', '跳过坐标必须位于生成范围内');
      }
      const key = `${item.row}:${item.column}`;
      if (skipKeys.has(key)) throw fieldError('skip', '跳过坐标不能重复');
      skipKeys.add(key);
    }

    try {
      const result = await this.models.StudyRoom.sequelize!.transaction(async (transaction) => {
        const room = await this.models.StudyRoom.findByPk(roomId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在');
        if (startRow + rows - 1 > room.grid_rows || startColumn + columns - 1 > room.grid_columns) {
          throw new HttpError(409, 'CONFLICT', '生成范围超出自习室网格尺寸');
        }
        const duplicatePrefix = await this.models.Seat.findOne({
          where: { room_id: room.id, batch_prefix: prefix },
          transaction,
        });
        if (duplicatePrefix) throw new HttpError(409, 'CONFLICT', `批次前缀 ${prefix} 已存在`);
        const seats = [];
        let sequence = 1;
        for (let row = startRow; row < startRow + rows; row += 1) {
          for (let column = startColumn; column < startColumn + columns; column += 1) {
            if (skipKeys.has(`${row}:${column}`)) continue;
            seats.push({
              room_id: String(room.id),
              batch_prefix: prefix,
              seat_no: formatSeatNumber(prefix, sequence),
              row_no: row,
              column_no: column,
              status: 'available' as const,
              bookable_from: nextBusinessDate(this.now()),
              remark: null,
            });
            sequence += 1;
          }
        }
        if (seats.length === 0) {
          throw fieldError('skip', '至少需要保留一个座位');
        }
        await this.models.Seat.bulkCreate(seats, { transaction });
        await this.models.AuditLog.create(
          {
            operator_id: operatorId,
            action: 'study_room.seats_created',
            resource_type: 'study_room',
            resource_id: String(room.id),
            before_json: null,
            after_json: {
              prefix,
              count: seats.length,
              startRow,
              startColumn,
              rows,
              columns,
              skip: [...skipKeys],
            },
            reason: '批量新增座位',
            request_id: null,
            created_at: this.now(),
          },
          { transaction },
        );
        return { roomId: String(room.id), count: seats.length };
      });
      return { ...result, room: await this.getAdminRoom(result.roomId) };
    } catch (error) {
      return uniqueConflict(error);
    }
  }

  async updateSeat(operatorId: string, seatId: string, input: SeatUpdateInput) {
    const result = await this.models.StudyRoom.sequelize!.transaction(async (transaction) => {
      const snapshot = await this.models.Seat.findByPk(seatId, { transaction });
      if (!snapshot) throw new HttpError(404, 'NOT_FOUND', '座位不存在');
      const room = await this.models.StudyRoom.findByPk(snapshot.room_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在');
      const seat = await this.models.Seat.findByPk(seatId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!seat) throw new HttpError(404, 'NOT_FOUND', '座位不存在');
      const before = {
        seatNo: seat.seat_no,
        row: seat.row_no,
        column: seat.column_no,
        status: seat.status,
        remark: seat.remark,
      };
      const nextSeatNo = input.seatNo === undefined ? seat.seat_no : input.seatNo.trim();
      const nextRow =
        input.row === undefined ? seat.row_no : normalizePositiveInteger(input.row, 1, 'row', 50);
      const nextColumn =
        input.column === undefined
          ? seat.column_no
          : normalizePositiveInteger(input.column, 1, 'column', 50);
      if (nextSeatNo.length < 1 || nextSeatNo.length > 32) {
        throw fieldError('seatNo', '座位编号需为 1-32 个字符');
      }
      if (nextRow > room.grid_rows || nextColumn > room.grid_columns) {
        throw new HttpError(409, 'CONFLICT', '座位坐标超出自习室网格');
      }
      const identityChanged =
        nextSeatNo !== seat.seat_no || nextRow !== seat.row_no || nextColumn !== seat.column_no;
      if (identityChanged) {
        const active = await this.reservations.countActiveReservations({ seatId });
        if (active > 0)
          throw new HttpError(409, 'CONFLICT', '座位仍有活动预约，不能修改编号或坐标');
      }
      const nextStatus = input.status ?? seat.status;
      if (seat.status === 'available' && nextStatus !== 'available') {
        const pending = await this.reservations.countPendingReservations({ seatId });
        if (pending > 0) {
          throw new HttpError(409, 'CONFLICT', `仍有 ${pending} 条待签到预约，请先处理`);
        }
      }
      const nextRemark = input.remark === undefined ? seat.remark : input.remark?.trim() || null;
      if (nextStatus === 'maintenance' && !nextRemark) {
        throw fieldError('remark', '维修座位必须填写说明');
      }
      seat.seat_no = nextSeatNo;
      seat.row_no = nextRow;
      seat.column_no = nextColumn;
      seat.status = nextStatus;
      seat.remark = nextRemark;
      if (seat.status === 'available' && before.status !== 'available') {
        seat.bookable_from = nextBusinessDate(this.now());
      }
      await seat.save({ transaction });
      const autoClosed = await this.autoCloseIfEmpty(
        room,
        operatorId,
        transaction,
        '座位停用后房间已无有效时段或可用座位',
      );
      await this.models.AuditLog.create(
        {
          operator_id: operatorId,
          action: 'study_room.seat_updated',
          resource_type: 'seat',
          resource_id: String(seat.id),
          before_json: before,
          after_json: {
            seatNo: seat.seat_no,
            row: seat.row_no,
            column: seat.column_no,
            status: seat.status,
            remark: seat.remark,
          },
          reason: '修改座位',
          request_id: null,
          created_at: this.now(),
        },
        { transaction },
      );
      return { roomId: String(room.id), autoClosed };
    });
    return { room: await this.getAdminRoom(result.roomId), autoClosed: result.autoClosed };
  }
}

export function describeRoomStatus(status: StudyRoomStatus): string {
  return roomStatusLabel(status);
}

export function describeSeatStatus(status: SeatStatus): string {
  return seatStatusLabel(status);
}
