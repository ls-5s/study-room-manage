import type { Request, RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';
import type { ViolationStatus } from '../models/violation.model.js';
import type { AdminViolationFilter, ViolationService } from '../services/violation.service.js';
import { success } from '../types/api.js';

const STATUSES: readonly ViolationStatus[] = ['active', 'revoked'];

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

function parseStatus(value: unknown): ViolationStatus | undefined {
  const status = optionalString(value);
  if (!status) return undefined;
  if (!STATUSES.includes(status as ViolationStatus)) {
    throw new HttpError(400, 'BAD_REQUEST', '违约状态筛选无效');
  }
  return status as ViolationStatus;
}

export function createViolationController(
  violations: ViolationService,
): Record<'listMine' | 'listAdmin' | 'revoke' | 'getRules' | 'updateRules', RequestHandler> {
  return {
    listMine: async (request, response) => {
      const filter: Parameters<ViolationService['listMine']>[1] = {
        page: positiveInteger(request.query.page, 1, 1_000_000),
        pageSize: positiveInteger(request.query.pageSize, 20, 100),
      };
      const status = parseStatus(request.query.status);
      if (status) filter.status = status;
      response.json(success(await violations.listMine(actorId(request), filter), '查询成功'));
    },

    listAdmin: async (request, response) => {
      const filter: AdminViolationFilter = {
        page: positiveInteger(request.query.page, 1, 1_000_000),
        pageSize: positiveInteger(request.query.pageSize, 20, 100),
      };
      const status = parseStatus(request.query.status);
      if (status) filter.status = status;
      for (const key of ['studentNo', 'roomId', 'dateFrom', 'dateTo'] as const) {
        const value = optionalString(request.query[key]);
        if (value !== undefined) {
          (filter as unknown as Record<string, unknown>)[key] = value;
        }
      }
      response.json(success(await violations.listAdmin(filter), '查询成功'));
    },

    revoke: async (request, response) => {
      const body = request.body as { reason: string };
      const result = await violations.revoke(actorId(request), String(request.params.id), body.reason);
      response.json(success(result, result.changed ? '违约记录已撤销' : '该记录已是撤销状态'));
    },

    getRules: async (_request, response) => {
      response.json(success(await violations.getRules(), '查询成功'));
    },

    updateRules: async (request, response) => {
      const body = request.body as { threshold: unknown; restrictionDays: unknown };
      const rules = await violations.updateRules(actorId(request), body);
      response.json(success(rules, '违约规则已更新'));
    },
  };
}
