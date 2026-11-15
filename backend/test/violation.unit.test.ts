import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeRestriction,
  validateRulesInput,
  DEFAULT_RESTRICTION_DAYS,
  DEFAULT_THRESHOLD,
} from '../src/services/violation.service.js';

const DAY = 24 * 60 * 60 * 1_000;
const occurredAt = new Date('2026-11-11T08:15:00+08:00');

test('未达到阈值时不产生限制', () => {
  const result = computeRestriction({
    activeCount: 2,
    threshold: 3,
    restrictionDays: 7,
    occurredAt,
    startedAt: null,
    until: null,
  });
  assert.deepEqual(result, { startedAt: null, until: null });
});

test('刚好达到阈值时从违约发生时间开始限制', () => {
  const result = computeRestriction({
    activeCount: 3,
    threshold: 3,
    restrictionDays: 7,
    occurredAt,
    startedAt: null,
    until: null,
  });
  assert.equal(result.startedAt?.getTime(), occurredAt.getTime());
  assert.equal(result.until?.getTime(), occurredAt.getTime() + 7 * DAY);
});

test('限制期内再次违约保留原开始时间并延长截止时间', () => {
  const startedAt = new Date(occurredAt.getTime() - 2 * DAY);
  const until = new Date(occurredAt.getTime() + 1 * DAY);
  const result = computeRestriction({
    activeCount: 4,
    threshold: 3,
    restrictionDays: 7,
    occurredAt,
    startedAt,
    until,
  });
  assert.equal(result.startedAt?.getTime(), startedAt.getTime());
  assert.equal(result.until?.getTime(), occurredAt.getTime() + 7 * DAY);
});

test('已有限制更长时不会被缩短', () => {
  const until = new Date(occurredAt.getTime() + 30 * DAY);
  const result = computeRestriction({
    activeCount: 4,
    threshold: 3,
    restrictionDays: 7,
    occurredAt,
    startedAt: occurredAt,
    until,
  });
  assert.equal(result.until?.getTime(), until.getTime());
});

test('限制已过期后再次违约重新起算', () => {
  const result = computeRestriction({
    activeCount: 4,
    threshold: 3,
    restrictionDays: 3,
    occurredAt,
    startedAt: new Date(occurredAt.getTime() - 10 * DAY),
    until: new Date(occurredAt.getTime() - 3 * DAY),
  });
  assert.equal(result.startedAt?.getTime(), occurredAt.getTime());
  assert.equal(result.until?.getTime(), occurredAt.getTime() + 3 * DAY);
});

test('规则范围校验：阈值 1-20、天数 1-90', () => {
  assert.deepEqual(validateRulesInput({ threshold: 3, restrictionDays: 7 }), {
    threshold: 3,
    restrictionDays: 7,
  });
  assert.deepEqual(validateRulesInput({ threshold: '1', restrictionDays: '90' }), {
    threshold: 1,
    restrictionDays: 90,
  });
  assert.throws(() => validateRulesInput({ threshold: 0, restrictionDays: 7 }));
  assert.throws(() => validateRulesInput({ threshold: 21, restrictionDays: 7 }));
  assert.throws(() => validateRulesInput({ threshold: 3, restrictionDays: 0 }));
  assert.throws(() => validateRulesInput({ threshold: 3, restrictionDays: 91 }));
  assert.throws(() => validateRulesInput({ threshold: 1.5, restrictionDays: 7 }));
  assert.throws(() => validateRulesInput({ threshold: 'x', restrictionDays: 7 }));
});

test('默认规则与文档一致', () => {
  assert.equal(DEFAULT_THRESHOLD, 3);
  assert.equal(DEFAULT_RESTRICTION_DAYS, 7);
});
