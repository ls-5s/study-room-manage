import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addBusinessDays,
  assertTimeRange,
  formatSeatNumber,
  isValidBusinessDate,
  nextBusinessDate,
  toBusinessDate,
  validateBookableDate,
} from '../src/lib/study-room-time.js';
import { resolveSeatAvailability } from '../src/services/study-room.service.js';

test('上海业务日期在 UTC 日期边界仍然正确', () => {
  assert.equal(toBusinessDate(new Date('2026-11-10T15:59:00.000Z')), '2026-11-10');
  assert.equal(toBusinessDate(new Date('2026-11-10T16:00:00.000Z')), '2026-11-11');
});

test('业务日期加减和七日预约窗口正确', () => {
  assert.equal(addBusinessDays('2026-11-11', 1), '2026-11-12');
  assert.equal(addBusinessDays('2026-12-31', 1), '2027-01-01');
  assert.equal(isValidBusinessDate('2026-02-29'), false);
  const range = validateBookableDate('2026-11-17', new Date('2026-11-11T02:00:00.000Z'));
  assert.equal(range.lastDate, '2026-11-17');
  assert.throws(() => validateBookableDate('2026-11-18', new Date('2026-11-11T02:00:00.000Z')));
});

test('新建资源默认从下一个业务日生效', () => {
  assert.equal(nextBusinessDate(new Date('2026-11-11T15:59:00.000Z')), '2026-11-12');
  assert.equal(nextBusinessDate(new Date('2026-11-11T16:00:00.000Z')), '2026-11-13');
});

test('时段长度和顺序校验正确', () => {
  assert.equal(assertTimeRange('08:00', '10:00'), 120);
  assert.throws(() => assertTimeRange('10:00', '08:00'));
  assert.throws(() => assertTimeRange('08:00', '08:29'));
  assert.throws(() => assertTimeRange('08:00', '12:01'));
});

test('座位编号超过九十九后自然扩展为三位', () => {
  assert.equal(formatSeatNumber('A', 1), 'A-01');
  assert.equal(formatSeatNumber('A', 99), 'A-99');
  assert.equal(formatSeatNumber('A', 100), 'A-100');
});

test('预约端口返回的座位标识覆盖静态可用状态', () => {
  const seats = [
    {
      id: '1',
      seat_no: 'A-01',
      row_no: 1,
      column_no: 1,
      status: 'available' as const,
      remark: null,
    },
    {
      id: '2',
      seat_no: 'A-02',
      row_no: 1,
      column_no: 2,
      status: 'maintenance' as const,
      remark: '维修',
    },
  ];
  const result = resolveSeatAvailability(seats, new Set(['1']));
  assert.equal(result[0]?.status, 'reserved');
  assert.equal(result[1]?.status, 'maintenance');
  assert.equal(result[1]?.disabledReason, '维修');
});
