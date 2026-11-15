import assert from 'node:assert/strict';
import test from 'node:test';
import { addBusinessDays } from '../src/lib/study-room-time.js';
import { isFinalizationWindow } from '../src/jobs/statistics.job.js';
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
