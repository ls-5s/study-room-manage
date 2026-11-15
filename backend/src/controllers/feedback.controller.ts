import type { Request, RequestHandler } from 'express';
import { isBusinessDate } from '../lib/reservation-time.js';
import { HttpError } from '../middleware/errors.js';
import {
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
  type AdminFeedbackListFilter,
  type FeedbackListFilter,
  type FeedbackService,
} from '../services/feedback.service.js';
import type { FeedbackStatus, FeedbackType } from '../models/feedback-ticket.model.js';
import { success } from '../types/api.js';

function actorId(request: Request): string {
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

function parseStatus(value: unknown): FeedbackStatus | undefined {
  const status = optionalString(value);
  if (!status) return undefined;
  if (!FEEDBACK_STATUSES.includes(status as FeedbackStatus)) {
    throw new HttpError(400, 'BAD_REQUEST', '工单状态筛选无效');
  }
  return status as FeedbackStatus;
}

function parseType(value: unknown): FeedbackType | undefined {
  const type = optionalString(value);
  if (!type) return undefined;
  if (!FEEDBACK_TYPES.includes(type as FeedbackType)) {
    throw new HttpError(400, 'BAD_REQUEST', '工单类型筛选无效');
  }
  return type as FeedbackType;
}

function parseDate(value: unknown, field: string): string | undefined {
  const date = optionalString(value);
  if (!date) return undefined;
  if (!isBusinessDate(date)) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { [field]: '日期格式必须为 YYYY-MM-DD' },
    });
  }
  return date;
}

function parseIdQuery(value: unknown, field: string): string | undefined {
  const id = optionalString(value);
  if (!id) return undefined;
  if (!/^\d{1,20}$/.test(id) || Number(id) <= 0) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { [field]: '编号格式不正确' },
    });
  }
  return id;
}

function parseAdminFilter(request: Request): AdminFeedbackListFilter {
  const filter: AdminFeedbackListFilter = {
    page: positiveInteger(request.query.page, 1, 1_000_000),
    pageSize: positiveInteger(request.query.pageSize, 20, 100),
  };
  const status = parseStatus(request.query.status);
  if (status) filter.status = status;
  const type = parseType(request.query.type);
  if (type) filter.type = type;

  const roomId = parseIdQuery(request.query.roomId, 'roomId');
  if (roomId) filter.roomId = roomId;
  for (const key of ['studentNo', 'keyword'] as const) {
    const value = optionalString(request.query[key]);
    if (value !== undefined) filter[key] = value;
  }
  const dateFrom = parseDate(request.query.dateFrom, 'dateFrom');
  const dateTo = parseDate(request.query.dateTo, 'dateTo');
  if (dateFrom) filter.dateFrom = dateFrom;
  if (dateTo) filter.dateTo = dateTo;
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { dateTo: '结束日期不能早于开始日期' },
    });
  }
  return filter;
}

export function createFeedbackController(
  feedback: FeedbackService,
): Record<
  'create' | 'listMine' | 'getMine' | 'listAdmin' | 'getAdmin' | 'transition',
  RequestHandler
> {
  return {
    create: async (request, response) => {
      const result = await feedback.create(
        actorId(request),
        (request.body ?? {}) as Record<string, unknown>,
      );
      response.status(201).json(success(result, '反馈已提交'));
    },

    listMine: async (request, response) => {
      const filter: FeedbackListFilter = {
        page: positiveInteger(request.query.page, 1, 1_000_000),
        pageSize: positiveInteger(request.query.pageSize, 20, 100),
      };
      const status = parseStatus(request.query.status);
      if (status) filter.status = status;
      const type = parseType(request.query.type);
      if (type) filter.type = type;
      response.json(success(await feedback.listMine(actorId(request), filter), '查询成功'));
    },

    getMine: async (request, response) => {
      response.json(
        success(await feedback.getMine(actorId(request), String(request.params.id)), '查询成功'),
      );
    },

    listAdmin: async (request, response) => {
      response.json(success(await feedback.listAdmin(parseAdminFilter(request)), '查询成功'));
    },

    getAdmin: async (request, response) => {
      response.json(success(await feedback.getAdmin(String(request.params.id)), '查询成功'));
    },

    transition: async (request, response) => {
      const body = request.body as { status?: unknown; result?: unknown };
      const result = await feedback.transition(
        actorId(request),
        String(request.params.id),
        body.status,
        body.result,
      );
      response.json(success(result, '工单状态已更新'));
    },
  };
}
