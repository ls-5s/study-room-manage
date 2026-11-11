import { addBusinessDays, isValidBusinessDate, toBusinessDate } from '../lib/study-room-time.js';
import { toBusinessIso } from '../lib/reservation-time.js';
import { HttpError } from '../middleware/errors.js';
import type { DailySlotMetric } from '../models/daily-slot-metric.model.js';
import { SnapshotPendingError, type StatisticsRepository } from './statistics.repository.js';

export const STATISTICS_TIMEZONE = 'Asia/Shanghai';
export const MAX_STATISTICS_DAYS = 366;
export const DEFAULT_STATISTICS_DAYS = 7;
export type StatisticsGroupBy = 'day' | 'room' | 'slot';

export interface StatisticsTotals {
  reservationCount: number;
  checkedInCount: number;
  noShowCount: number;
  outageCancelledCount: number;
  settledReservationCount: number;
  availableSeatMinutes: number;
  usedSeatMinutes: number;
  signInRate: number;
  noShowRate: number;
  utilizationRate: number;
  hasSettledData: boolean;
  hasUtilizationData: boolean;
}

export interface StatisticsOverview {
  date: string;
  timezone: typeof STATISTICS_TIMEZONE;
  generatedAt: string;
  dataStatus: 'live' | 'finalized';
  finalizedAt: string | null;
  cards: {
    reservationCount: number;
    checkedInCount: number;
    noShowCount: number;
    utilizationRate: number;
  };
  rates: {
    signInRate: number;
    noShowRate: number;
    outageCancelledCount: number;
    settledReservationCount: number;
    hasSettledData: boolean;
    hasUtilizationData: boolean;
  };
}

export interface StatisticsTrendItem extends StatisticsTotals {
  key: string;
  label: string;
  hasData: boolean;
}

export interface StatisticsTrend {
  dateFrom: string;
  dateTo: string;
  groupBy: StatisticsGroupBy;
  timezone: typeof STATISTICS_TIMEZONE;
  generatedAt: string;
  items: StatisticsTrendItem[];
}

interface DateRange {
  dateFrom: string;
  dateTo: string;
}

function validationError(field: string, message: string): HttpError {
  return new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
    fields: { [field]: message },
  });
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0;
}

function assertBusinessDate(value: string, field: string): string {
  if (!isValidBusinessDate(value)) throw validationError(field, '日期格式必须为 YYYY-MM-DD');
  return value;
}

export function resolveOverviewDate(rawDate: string | undefined, now = new Date()): string {
  const today = toBusinessDate(now);
  const date = rawDate ?? today;
  assertBusinessDate(date, 'date');
  if (date > today) throw validationError('date', '统计日期不能晚于今天');
  return date;
}

export function resolveStatisticsRange(
  rawDateFrom: string | undefined,
  rawDateTo: string | undefined,
  now = new Date(),
): DateRange {
  const today = toBusinessDate(now);
  const defaultFrom = addBusinessDays(today, -(DEFAULT_STATISTICS_DAYS - 1));
  const dateFrom = rawDateFrom ?? (rawDateTo ? undefined : defaultFrom);
  const dateTo = rawDateTo ?? (rawDateFrom ? undefined : today);
  if (!dateFrom || !dateTo) {
    throw validationError('dateFrom', '开始日期和结束日期必须同时提供');
  }
  assertBusinessDate(dateFrom, 'dateFrom');
  assertBusinessDate(dateTo, 'dateTo');
  if (dateFrom > dateTo) throw validationError('dateTo', '结束日期不能早于开始日期');
  if (dateTo > today) throw validationError('dateTo', '统计日期不能晚于今天');

  let days = 0;
  for (let date = dateFrom; date <= dateTo; date = addBusinessDays(date, 1)) {
    days += 1;
    if (days > MAX_STATISTICS_DAYS) {
      throw validationError('dateTo', `统计范围不能超过 ${MAX_STATISTICS_DAYS} 天`);
    }
  }
  return { dateFrom, dateTo };
}

export function parseStatisticsGroupBy(value: string | undefined): StatisticsGroupBy {
  const groupBy = value ?? 'day';
  if (!['day', 'room', 'slot'].includes(groupBy)) {
    throw validationError('groupBy', '分组维度必须为 day、room 或 slot');
  }
  return groupBy as StatisticsGroupBy;
}

export function aggregateStatistics(metrics: readonly DailySlotMetric[]): StatisticsTotals {
  let reservationCount = 0;
  let checkedInCount = 0;
  let noShowCount = 0;
  let outageCancelledCount = 0;
  let availableSeatMinutes = 0;
  let usedSeatMinutes = 0;

  for (const metric of metrics) {
    reservationCount += Number(metric.reservation_count);
    checkedInCount += Number(metric.checked_in_count);
    noShowCount += Number(metric.no_show_count);
    outageCancelledCount += Number(metric.outage_cancelled_count);
    availableSeatMinutes += Number(metric.available_seat_minutes);
    usedSeatMinutes += Number(metric.used_seat_minutes);
  }

  const settledReservationCount = checkedInCount + noShowCount;
  return {
    reservationCount,
    checkedInCount,
    noShowCount,
    outageCancelledCount,
    settledReservationCount,
    availableSeatMinutes,
    usedSeatMinutes,
    signInRate: ratio(checkedInCount, settledReservationCount),
    noShowRate: ratio(noShowCount, settledReservationCount),
    utilizationRate: ratio(usedSeatMinutes, availableSeatMinutes),
    hasSettledData: settledReservationCount > 0,
    hasUtilizationData: availableSeatMinutes > 0,
  };
}

export function groupStatisticsMetrics(
  metrics: readonly DailySlotMetric[],
  groupBy: StatisticsGroupBy,
  range: DateRange,
): StatisticsTrendItem[] {
  const grouped = new Map<string, DailySlotMetric[]>();
  const labels = new Map<string, { date: string; label: string }>();

  for (const metric of metrics) {
    let key: string;
    if (groupBy === 'day') {
      key = metric.stat_date;
    } else if (groupBy === 'room') {
      key = String(metric.room_id);
      const prior = labels.get(key);
      if (!prior || metric.stat_date >= prior.date) {
        labels.set(key, {
          date: metric.stat_date,
          label: metric.room_name_snapshot,
        });
      }
    } else {
      const start = metric.slot_start_time.slice(0, 5);
      const end = metric.slot_end_time.slice(0, 5);
      key = `${start}-${end}`;
    }
    const rows = grouped.get(key) ?? [];
    rows.push(metric);
    grouped.set(key, rows);
  }

  if (groupBy === 'day') {
    for (let date = range.dateFrom; date <= range.dateTo; date = addBusinessDays(date, 1)) {
      if (!grouped.has(date)) grouped.set(date, []);
    }
  }

  return [...grouped.entries()]
    .map(([key, rows]) => {
      const totals = aggregateStatistics(rows);
      const fallbackLabel = groupBy === 'day' ? key.slice(5) : key;
      return {
        key,
        label: labels.get(key)?.label ?? fallbackLabel,
        ...totals,
        hasData: totals.reservationCount > 0 || totals.availableSeatMinutes > 0,
      };
    })
    .sort((left, right) => {
      if (groupBy === 'day') return left.key.localeCompare(right.key);
      if (groupBy === 'slot') return left.key.localeCompare(right.key);
      return left.label.localeCompare(right.label, 'zh-CN');
    });
}

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildStatisticsCsv(
  items: readonly StatisticsTrendItem[],
  groupBy: StatisticsGroupBy,
): string {
  const groupLabel = groupBy === 'day' ? '日期' : groupBy === 'room' ? '房间' : '时段';
  const lines = [
    [
      '分组',
      '分组名称',
      '预约数',
      '已签到数',
      '失约数',
      '系统停机取消数',
      '签到率',
      '失约率',
      '利用率',
    ],
    ...items.map((item) => [
      groupLabel,
      item.label,
      item.reservationCount,
      item.checkedInCount,
      item.noShowCount,
      item.outageCancelledCount,
      item.hasSettledData ? item.signInRate.toFixed(4) : '',
      item.hasSettledData ? item.noShowRate.toFixed(4) : '',
      item.hasUtilizationData ? item.utilizationRate.toFixed(4) : '',
    ]),
  ];
  return `\uFEFF${lines.map((line) => line.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export class StatisticsService {
  constructor(
    private readonly repository: StatisticsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async ensureCapacity(statDate: string) {
    return this.repository.ensureCapacity(statDate, this.now());
  }

  async refreshCurrentDay(statDate = toBusinessDate(this.now())): Promise<void> {
    await this.repository.ensureCapacity(statDate, this.now());
    await this.repository.refreshUsage(statDate, this.now());
  }

  async finalize(statDate: string): Promise<boolean> {
    try {
      return await this.repository.finalize(statDate, this.now());
    } catch (error) {
      if (error instanceof SnapshotPendingError) throw error;
      throw error;
    }
  }

  async overview(date: string): Promise<StatisticsOverview> {
    await this.assertRangeReady(date, date);
    const run = await this.repository.findRun(date);
    if (!run) throw snapshotConflict(date);
    const metrics = await this.repository.listMetrics(date, date);
    const totals = aggregateStatistics(metrics);
    const today = toBusinessDate(this.now());
    return {
      date,
      timezone: STATISTICS_TIMEZONE,
      generatedAt: toBusinessIso(this.now()),
      dataStatus: date === today ? 'live' : 'finalized',
      finalizedAt: run.finalized_at ? toBusinessIso(run.finalized_at) : null,
      cards: {
        reservationCount: totals.reservationCount,
        checkedInCount: totals.checkedInCount,
        noShowCount: totals.noShowCount,
        utilizationRate: totals.utilizationRate,
      },
      rates: {
        signInRate: totals.signInRate,
        noShowRate: totals.noShowRate,
        outageCancelledCount: totals.outageCancelledCount,
        settledReservationCount: totals.settledReservationCount,
        hasSettledData: totals.hasSettledData,
        hasUtilizationData: totals.hasUtilizationData,
      },
    };
  }

  async trend(
    dateFrom: string,
    dateTo: string,
    groupBy: StatisticsGroupBy,
    roomId?: string,
  ): Promise<StatisticsTrend> {
    await this.assertRangeReady(dateFrom, dateTo);
    const metrics = await this.repository.listMetrics(dateFrom, dateTo, roomId);
    return {
      dateFrom,
      dateTo,
      groupBy,
      timezone: STATISTICS_TIMEZONE,
      generatedAt: toBusinessIso(this.now()),
      items: groupStatisticsMetrics(metrics, groupBy, { dateFrom, dateTo }),
    };
  }

  private async assertRangeReady(dateFrom: string, dateTo: string): Promise<void> {
    const runs = await this.repository.listRuns(dateFrom, dateTo);
    const runsByDate = new Map(runs.map((run) => [run.stat_date, run]));
    const today = toBusinessDate(this.now());
    for (let date = dateFrom; date <= dateTo; date = addBusinessDays(date, 1)) {
      const run = runsByDate.get(date);
      if (!run) throw snapshotConflict(date);
      if (date < today && !run.finalized_at) throw snapshotConflict(date);
    }
  }
}

function snapshotConflict(date: string): HttpError {
  return new HttpError(409, 'CONFLICT', `统计日期 ${date} 的快照尚未完成`, {
    fields: { date },
  });
}
