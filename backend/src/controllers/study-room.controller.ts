import type { Request, RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';
import type {
  RoomInput,
  RoomUpdateInput,
  SeatBatchInput,
  SeatUpdateInput,
  StudyRoomService,
  TimeSlotInput,
  TimeSlotUpdateInput,
} from '../services/study-room.service.js';
import type { StudyRoomStatus } from '../models/study-room.model.js';
import { success } from '../types/api.js';

function operatorId(request: Request): string {
  if (!request.auth) throw new HttpError(401, 'UNAUTHORIZED', '请先登录');
  return request.auth.user.id;
}

function positiveInteger(value: unknown, fallback: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new HttpError(400, 'BAD_REQUEST', '分页参数无效');
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new HttpError(400, 'BAD_REQUEST', '分页参数无效');
  }
  return parsed;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new HttpError(400, 'BAD_REQUEST', '查询参数格式无效');
  const normalized = value.trim();
  return normalized || undefined;
}

export function createStudyRoomController(
  rooms: StudyRoomService,
): Record<
  | 'listPublic'
  | 'getPublic'
  | 'getPublicSeats'
  | 'listAdmin'
  | 'getAdmin'
  | 'createRoom'
  | 'updateRoom'
  | 'createSlot'
  | 'updateSlot'
  | 'createSeats'
  | 'updateSeat',
  RequestHandler
> {
  return {
    listPublic: async (request, response) => {
      const page = positiveInteger(request.query.page, 1, 1_000_000);
      const pageSize = positiveInteger(request.query.pageSize, 20, 100);
      const filter: Parameters<StudyRoomService['listPublicRooms']>[0] = { page, pageSize };
      const keyword = optionalString(request.query.keyword);
      const date = optionalString(request.query.date);
      const startTime = optionalString(request.query.startTime);
      const endTime = optionalString(request.query.endTime);
      if (keyword) filter.keyword = keyword;
      if (date) filter.date = date;
      if (startTime) filter.startTime = startTime;
      if (endTime) filter.endTime = endTime;
      const result = await rooms.listPublicRooms(filter);
      response.json(success(result, '查询成功'));
    },
    getPublic: async (request, response) => {
      response.json(
        success(
          await rooms.getPublicRoom(
            String(request.params.roomId),
            optionalString(request.query.date),
          ),
          '查询成功',
        ),
      );
    },
    getPublicSeats: async (request, response) => {
      const date = optionalString(request.query.date);
      const slotId = optionalString(request.query.slotId);
      if (!date || !slotId) {
        throw new HttpError(422, 'VALIDATION_ERROR', '请选择日期和开放时段', {
          fields: {
            date: !date ? '请选择日期' : '',
            slotId: !slotId ? '请选择开放时段' : '',
          },
        });
      }
      response.json(
        success(
          await rooms.getPublicSeats(String(request.params.roomId), date, slotId),
          '查询成功',
        ),
      );
    },
    listAdmin: async (request, response) => {
      const status = request.query.status;
      if (
        status !== undefined &&
        status !== 'open' &&
        status !== 'closed' &&
        status !== 'disabled'
      ) {
        throw new HttpError(400, 'BAD_REQUEST', '房间状态筛选无效');
      }
      const filter: Parameters<StudyRoomService['listAdminRooms']>[0] = {
        page: positiveInteger(request.query.page, 1, 1_000_000),
        pageSize: positiveInteger(request.query.pageSize, 20, 100),
      };
      const keyword = optionalString(request.query.keyword);
      if (keyword) filter.keyword = keyword;
      if (status) filter.status = status as StudyRoomStatus;
      const result = await rooms.listAdminRooms(filter);
      response.json(success(result, '查询成功'));
    },
    getAdmin: async (request, response) => {
      response.json(success(await rooms.getAdminRoom(String(request.params.roomId)), '查询成功'));
    },
    createRoom: async (request, response) => {
      response
        .status(201)
        .json(
          success(
            await rooms.createRoom(operatorId(request), request.body as RoomInput),
            '自习室已创建',
          ),
        );
    },
    updateRoom: async (request, response) => {
      const result = await rooms.updateRoom(
        operatorId(request),
        String(request.params.roomId),
        request.body as RoomUpdateInput,
      );
      response.json(
        success(
          result,
          result.autoClosed ? '保存成功，房间因无可用资源已自动关闭' : '自习室已更新',
        ),
      );
    },
    createSlot: async (request, response) => {
      const result = await rooms.createTimeSlot(
        operatorId(request),
        String(request.params.roomId),
        request.body as TimeSlotInput,
      );
      response.status(201).json(success(result, '开放时段已新增'));
    },
    updateSlot: async (request, response) => {
      const result = await rooms.updateTimeSlot(
        operatorId(request),
        String(request.params.slotId),
        request.body as TimeSlotUpdateInput,
      );
      response.json(
        success(result, result.autoClosed ? '保存成功，房间已自动关闭' : '开放时段已更新'),
      );
    },
    createSeats: async (request, response) => {
      const result = await rooms.createSeatBatch(
        operatorId(request),
        String(request.params.roomId),
        request.body as SeatBatchInput,
      );
      response.status(201).json(success(result, `已生成 ${result.count} 个座位`));
    },
    updateSeat: async (request, response) => {
      const result = await rooms.updateSeat(
        operatorId(request),
        String(request.params.seatId),
        request.body as SeatUpdateInput,
      );
      response.json(success(result, result.autoClosed ? '保存成功，房间已自动关闭' : '座位已更新'));
    },
  };
}
