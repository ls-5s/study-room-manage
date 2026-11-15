import type { Request, RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';
import {
  buildStatisticsCsv,
  parseStatisticsGroupBy,
  resolveOverviewDate,
  resolveStatisticsRange,
  type StatisticsGroupBy,
  type StatisticsService,
} from '../services/statistics.service.js';
import { success } from '../types/api.js';

function optionalString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new HttpError(400, 'BAD_REQUEST', '查询参数格式无效');
  const normalized = value.trim();
  return normalized || undefined;
}

function parseRoomId(value: unknown): string | undefined {
  const roomId = optionalString(value);
  if (!roomId) return undefined;
  if (!/^\d{1,20}$/.test(roomId) || Number(roomId) <= 0) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { roomId: '自习室编号格式不正确' },
    });
  }
  return roomId;
}

function trendQuery(request: Request): {
  dateFrom: string;
  dateTo: string;
  groupBy: StatisticsGroupBy;
  roomId?: string;
} {
  const range = resolveStatisticsRange(
    optionalString(request.query.dateFrom),
    optionalString(request.query.dateTo),
  );
  const roomId = parseRoomId(request.query.roomId);
  return {
    ...range,
    groupBy: parseStatisticsGroupBy(optionalString(request.query.groupBy)),
    ...(roomId ? { roomId } : {}),
  };
}

function exportFilename(dateFrom: string, dateTo: string): string {
  return `study-room-report-${dateFrom.replaceAll('-', '')}-${dateTo.replaceAll('-', '')}.csv`;
}

export function createStatisticsController(
  statistics: StatisticsService,
): Record<'overview' | 'trend' | 'export', RequestHandler> {
  return {
    overview: async (request, response) => {
      const date = resolveOverviewDate(optionalString(request.query.date));
      response.json(success(await statistics.overview(date), '查询成功'));
    },

    trend: async (request, response) => {
      const query = trendQuery(request);
      response.json(
        success(
          await statistics.trend(query.dateFrom, query.dateTo, query.groupBy, query.roomId),
          '查询成功',
        ),
      );
    },

    export: async (request, response) => {
      const query = trendQuery(request);
      const result = await statistics.trend(
        query.dateFrom,
        query.dateTo,
        query.groupBy,
        query.roomId,
      );
      const csv = buildStatisticsCsv(result.items, result.groupBy);
      response
        .status(200)
        .set({
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${exportFilename(query.dateFrom, query.dateTo)}"`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        })
        .send(csv);
    },
  };
}
