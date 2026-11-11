import type { Request, RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';
import { isValidIdempotencyKey } from '../lib/reservation-time.js';
import type { ReservationStatus } from '../models/reservation.model.js';
import type {
  AdminReservationFilter,
  CreateReservationInput,
  ReservationActor,
  ReservationService,
} from '../services/reservation.service.js';
import { success } from '../types/api.js';

const STATUSES: readonly ReservationStatus[] = [
  'pending',
  'checked_in',
  'completed',
  'cancelled',
  'no_show',
];

function actorOf(request: Request): ReservationActor {
  if (!request.auth) throw new HttpError(401, 'UNAUTHORIZED', '请先登录');
  return { id: request.auth.user.id, role: request.auth.user.role };
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

function parseStatus(value: unknown): ReservationStatus | undefined {
  const status = optionalString(value);
  if (!status) return undefined;
  if (!STATUSES.includes(status as ReservationStatus)) {
    throw new HttpError(400, 'BAD_REQUEST', '预约状态筛选无效');
  }
  return status as ReservationStatus;
}

export function createReservationController(
  reservations: ReservationService,
): Record<
  'create' | 'listMine' | 'getOne' | 'cancel' | 'listAdmin',
  RequestHandler
> {
  return {
    create: async (request, response) => {
      const rawKey = request.header('idempotency-key');
      if (!isValidIdempotencyKey(rawKey)) {
        throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
          fields: { idempotencyKey: '缺少有效的幂等键' },
        });
      }
      const result = await reservations.create(
        actorOf(request),
        rawKey,
        request.body as CreateReservationInput,
      );
      response
        .status(result.replayed ? 200 : 201)
        .json(success(result, result.replayed ? '预约已存在' : '预约创建成功'));
    },

    listMine: async (request, response) => {
      const filter = {
        page: positiveInteger(request.query.page, 1, 1_000_000),
        pageSize: positiveInteger(request.query.pageSize, 20, 100),
      } as Parameters<ReservationService['listMine']>[1];
      const status = parseStatus(request.query.status);
      const dateFrom = optionalString(request.query.dateFrom);
      const dateTo = optionalString(request.query.dateTo);
      if (status) filter.status = status;
      if (dateFrom) filter.dateFrom = dateFrom;
      if (dateTo) filter.dateTo = dateTo;
      response.json(success(await reservations.listMine(actorOf(request), filter), '查询成功'));
    },

    getOne: async (request, response) => {
      response.json(
        success(
          await reservations.getDetail(actorOf(request), String(request.params.id)),
          '查询成功',
        ),
      );
    },

    cancel: async (request, response) => {
      const body = request.body as { reason?: string };
      const result = await reservations.cancel(actorOf(request), String(request.params.id), body.reason);
      response.json(success(result, '预约已取消'));
    },

    listAdmin: async (request, response) => {
      const filter: AdminReservationFilter = {
        page: positiveInteger(request.query.page, 1, 1_000_000),
        pageSize: positiveInteger(request.query.pageSize, 20, 100),
      };
      const status = parseStatus(request.query.status);
      if (status) filter.status = status;
      const pairs: (keyof AdminReservationFilter)[] = [
        'dateFrom',
        'dateTo',
        'roomId',
        'seatNo',
        'studentNo',
        'keyword',
      ];
      for (const key of pairs) {
        const value = optionalString(request.query[key]);
        if (value !== undefined) {
          (filter as unknown as Record<string, unknown>)[key] = value;
        }
      }
      response.json(success(await reservations.listAdmin(filter), '查询成功'));
    },
  };
}
