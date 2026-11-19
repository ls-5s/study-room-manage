import assert from 'node:assert/strict';
import test from 'node:test';
import { addBusinessDays } from '../src/lib/study-room-time.js';
import { isFinalizationWindow, StatisticsJob } from '../src/jobs/statistics.job.js';
import {
  SnapshotPendingError,
  type StatisticsRepository,
} from '../src/services/statistics.repository.js';
import { StatisticsService } from '../src/services/statistics.service.js';
import type { DailySlotMetric } from '../src/models/daily-slot-metric.model.js';
import {
  aggregateStatistics,
  buildStatisticsCsv,
  groupStatisticsMetrics,
  resolveOverviewDate,
  resolveStatisticsRange,
} from '../src/services/statistics.service.js';

const now = new Date('2026-11-11T15:00:00+08:00');

function metric(overrides: Partial<DailySlotMetric> = {}): DailySlotMetric {
  return {
    id: '1',
    stat_date: '2026-11-11',
    room_id: '1',
    room_name_snapshot: '图书馆自习室',
    slot_id: '1',
    slot_label: '上午',
    slot_start_time: '08:00:00',
    slot_end_time: '10:00:00',
    bookable_seat_count: 20,
    available_seat_minutes: 2400,
    reservation_count: 10,
    checked_in_count: 8,
    no_show_count: 1,
    outage_cancelled_count: 1,
    used_seat_minutes: 960,
    finalized_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  } as DailySlotMetric;
}

test('默认统计范围为最近 7 天，未来日期被拒绝', () => {
  assert.deepEqual(resolveStatisticsRange(undefined, undefined, now), {
    dateFrom: '2026-11-05',
    dateTo: '2026-11-11',
  });
  assert.equal(resolveOverviewDate(undefined, now), '2026-11-11');
  assert.throws(() => resolveOverviewDate('2026-11-12', now));
  assert.throws(() => resolveStatisticsRange('2026-11-01', undefined, now));
});

test('统计范围最多 366 天', () => {
  const today = '2026-11-11';
  assert.doesNotThrow(() => resolveStatisticsRange(addBusinessDays(today, -365), today, now));
  assert.throws(() => resolveStatisticsRange(addBusinessDays(today, -366), today, now));
});

test('汇总先累加分子分母再计算比率', () => {
  const totals = aggregateStatistics([
    metric(),
    metric({
      id: '2',
      reservation_count: 6,
      checked_in_count: 2,
      no_show_count: 2,
      outage_cancelled_count: 0,
      used_seat_minutes: 240,
      available_seat_minutes: 1200,
    }),
  ]);
  assert.equal(totals.checkedInCount, 10);
  assert.equal(totals.settledReservationCount, 13);
  assert.equal(totals.signInRate, 0.7692);
  assert.equal(totals.noShowRate, 0.2308);
  assert.equal(totals.utilizationRate, 0.3333);
  assert.equal(totals.outageCancelledCount, 1);
});

test('零分母返回比例 0 并标记无结算数据', () => {
  const totals = aggregateStatistics([
    metric({
      reservation_count: 0,
      checked_in_count: 0,
      no_show_count: 0,
      used_seat_minutes: 0,
      available_seat_minutes: 0,
    }),
  ]);
  assert.equal(totals.signInRate, 0);
  assert.equal(totals.utilizationRate, 0);
  assert.equal(totals.hasSettledData, false);
  assert.equal(totals.hasUtilizationData, false);
});

test('按日分组补齐缺失日期，按房间使用最后一天名称快照', () => {
  const days = groupStatisticsMetrics(
    [
      metric({ stat_date: '2026-11-09', reservation_count: 2 }),
      metric({ stat_date: '2026-11-11', reservation_count: 4 }),
    ],
    'day',
    { dateFrom: '2026-11-09', dateTo: '2026-11-11' },
  );
  assert.deepEqual(
    days.map((item) => [item.key, item.reservationCount]),
    [
      ['2026-11-09', 2],
      ['2026-11-10', 0],
      ['2026-11-11', 4],
    ],
  );

  const rooms = groupStatisticsMetrics(
    [
      metric({ stat_date: '2026-11-09', room_name_snapshot: '旧名称' }),
      metric({ stat_date: '2026-11-10', room_name_snapshot: '新名称' }),
    ],
    'room',
    { dateFrom: '2026-11-09', dateTo: '2026-11-10' },
  );
  assert.equal(rooms[0]?.label, '新名称');
});

test('CSV 带 BOM、固定表头并阻止公式注入', () => {
  const csv = buildStatisticsCsv(
    [
      {
        key: 'room-1',
        label: '=HYPERLINK("https://example.com")',
        reservationCount: 1,
        checkedInCount: 1,
        noShowCount: 0,
        outageCancelledCount: 0,
        settledReservationCount: 1,
        availableSeatMinutes: 120,
        usedSeatMinutes: 60,
        signInRate: 1,
        noShowRate: 0,
        utilizationRate: 0.5,
        hasSettledData: true,
        hasUtilizationData: true,
        hasData: true,
      },
    ],
    'room',
  );
  assert.ok(csv.startsWith('\uFEFF"分组","分组名称"'));
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example.com""\)"/);
});

test('历史冻结任务在 01:10 后进入执行窗口', () => {
  assert.equal(isFinalizationWindow(new Date('2026-11-11T01:09:59+08:00')), false);
  assert.equal(isFinalizationWindow(new Date('2026-11-11T01:10:00+08:00')), true);
  assert.equal(isFinalizationWindow(new Date('2026-11-11T10:00:00+08:00')), true);
});

test('缺失和待结算日期不会阻断默认报表，也不会被当作零值或混入分组汇总', async () => {
  const repository = {
    listRuns: async () => [
      { stat_date: '2026-11-09', finalized_at: now },
      { stat_date: '2026-11-10', finalized_at: null },
      { stat_date: '2026-11-11', finalized_at: null },
    ],
    listMetrics: async () => [
      metric({ stat_date: '2026-11-09', reservation_count: 2 }),
      metric({ stat_date: '2026-11-10', reservation_count: 99 }),
      metric({ stat_date: '2026-11-11', reservation_count: 3 }),
    ],
  } as unknown as StatisticsRepository;
  const service = new StatisticsService(repository, () => now);
  const day = await service.trend('2026-11-08', '2026-11-11', 'day');
  assert.deepEqual(
    day.items.map((item) => item.key),
    ['2026-11-09', '2026-11-11'],
  );
  assert.deepEqual(day.coverage, {
    availableDates: ['2026-11-09', '2026-11-11'],
    missingDates: ['2026-11-08'],
    pendingDates: ['2026-11-10'],
    isComplete: false,
  });
  for (const group of ['room', 'slot'] as const) {
    const trend = await service.trend('2026-11-08', '2026-11-11', group);
    assert.equal(trend.items[0]?.reservationCount, 5);
  }
  const csv = buildStatisticsCsv(day.items, 'day', day.coverage);
  assert.match(csv, /仅含可用日期/);
  assert.match(csv, /"2026-11-08","2026-11-10"/);
  const emptyCsv = buildStatisticsCsv([], 'room', { ...day.coverage, availableDates: [] });
  assert.match(emptyCsv, /无可用统计数据/);
  assert.match(emptyCsv, /2026-11-08/);
  await assert.rejects(service.overview('2026-11-08'), /快照尚未完成/);
});

test('停机后补结算所有已有快照；一日待结算不阻止其他日期，且不吞掉失败', async () => {
  const finalized: string[] = [];
  const service = new StatisticsService(
    {
      listUnfinalizedRuns: async () => [
        { stat_date: '2026-11-05' },
        { stat_date: '2026-11-06' },
        { stat_date: '2026-11-10' },
      ],
      finalize: async (date: string) => {
        finalized.push(date);
        if (date === '2026-11-06') throw new SnapshotPendingError(date);
        return true;
      },
    } as unknown as StatisticsRepository,
    () => now,
  );
  await assert.rejects(service.finalizeHistory('2026-11-11'), SnapshotPendingError);
  assert.deepEqual(finalized, ['2026-11-05', '2026-11-06', '2026-11-10']);
});

test('结算未完成时任务状态为 error，并单独报告近七天历史完整性', async () => {
  const coverage = {
    availableDates: ['2026-11-11'],
    missingDates: ['2026-11-05'],
    pendingDates: ['2026-11-10'],
    isComplete: false,
  };
  const calls: string[] = [];
  const job = new StatisticsJob(
    {
      refreshCurrentDay: async (date) => {
        calls.push(`refresh:${date}`);
      },
      finalizeHistory: async () => {
        calls.push('finalize');
        throw new SnapshotPendingError('2026-11-10');
      },
      coverage: async () => coverage,
    },
    {
      run: async () => {
        calls.push('reservations');
        return { scanned: 0, noShow: 0, outageCancelled: 0, completed: 0, failed: 0 };
      },
    },
    { now: () => now },
  );
  job.start();
  await job.stop();
  assert.deepEqual(calls, ['refresh:2026-11-11', 'reservations', 'finalize']);
  assert.equal(job.getStatus().state, 'error');
  assert.equal(job.getStatus().lastErrorName, 'SnapshotPendingError');
  assert.deepEqual(job.getStatus().statisticsCoverage, coverage);
});
