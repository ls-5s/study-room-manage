import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSlotWindow,
  classifyDeadline,
  isValidIdempotencyKey,
  toBusinessIso,
} from '../src/lib/reservation-time.js';
import { createCheckInPayload, verifyCheckInPayload } from '../src/lib/check-in-token.js';
import { createUserRateLimiter } from '../src/lib/user-rate-limit.js';
import { Op } from 'sequelize';
import { ReservationService } from '../src/services/reservation.service.js';
import type { ReservationModels } from '../src/models/reservation-models.js';

const SECRET = 'unit-test-check-in-secret-value-0123456789';

test('预约时间窗口按东八区生成，签到窗口在开始前 30 分钟', () => {
  const window = buildSlotWindow('2026-11-12', '08:00', '10:00');
  assert.equal(toBusinessIso(window.startAt), '2026-11-12T08:00:00+08:00');
  assert.equal(toBusinessIso(window.endAt), '2026-11-12T10:00:00+08:00');
  assert.equal(toBusinessIso(window.checkInOpenAt), '2026-11-12T07:30:00+08:00');
  assert.equal(toBusinessIso(window.checkInDeadline), '2026-11-12T08:15:00+08:00');
});

test('签到窗口跨午夜时仍然归属业务日期', () => {
  const window = buildSlotWindow('2026-11-12', '00:15', '02:15');
  assert.equal(toBusinessIso(window.checkInOpenAt), '2026-11-11T23:45:00+08:00');
  assert.equal(window.reserveDate, '2026-11-12');
});

test('UTC 与上海业务日期在 23:59 边界一致', () => {
  assert.equal(toBusinessIso(new Date('2026-11-11T15:59:59.000Z')), '2026-11-11T23:59:59+08:00');
  assert.equal(toBusinessIso(new Date('2026-11-11T16:00:00.000Z')), '2026-11-12T00:00:00+08:00');
});

test('失约候选按 30 分钟停机豁免分类', () => {
  const deadline = new Date('2026-11-11T08:15:00+08:00');
  assert.equal(classifyDeadline(deadline, new Date('2026-11-11T08:10:00+08:00')), 'future');
  assert.equal(classifyDeadline(deadline, new Date('2026-11-11T08:16:00+08:00')), 'due');
  assert.equal(classifyDeadline(deadline, new Date('2026-11-11T08:45:00+08:00')), 'due');
  assert.equal(classifyDeadline(deadline, new Date('2026-11-11T08:46:00+08:00')), 'stale');
});

test('幂等键格式校验', () => {
  assert.equal(isValidIdempotencyKey('5c1e2f0a-9f3a-4b0e-8f0e-2f6e7f0b1c22'), true);
  assert.equal(isValidIdempotencyKey('short'), false);
  assert.equal(isValidIdempotencyKey('bad key with spaces'), false);
  assert.equal(isValidIdempotencyKey('x'.repeat(65)), false);
  assert.equal(isValidIdempotencyKey(undefined), false);
});

test('签到码长期有效，签发一年后仍然可以校验通过', () => {
  const now = new Date('2026-11-11T09:00:00+08:00');
  const payload = createCheckInPayload(SECRET, '12', 'nonce-value', now);
  assert.equal(payload.expiresAt, null);
  assert.equal(verifyCheckInPayload(payload, SECRET).ok, true);
});

test('签到码被篡改时签名校验失败', () => {
  const now = new Date('2026-11-11T09:00:00+08:00');
  const payload = createCheckInPayload(SECRET, '12', 'nonce-value', now);
  const result = verifyCheckInPayload({ ...payload, roomId: '13' }, SECRET);
  assert.deepEqual(result, { ok: false, failure: 'signature' });
});

test('换一家自习室的签名不能复用', () => {
  const now = new Date('2026-11-11T09:00:00+08:00');
  const payload = createCheckInPayload(SECRET, '12', 'nonce-value', now);
  const forged = { ...payload, roomId: '13' };
  assert.equal(verifyCheckInPayload(forged, SECRET).ok, false);
});

test('更换密钥后旧签名立即失效', () => {
  const now = new Date('2026-11-11T09:00:00+08:00');
  const payload = createCheckInPayload(SECRET, '12', 'nonce-value', now);
  const other = 'another-signing-secret-value-0123456789';
  assert.deepEqual(verifyCheckInPayload(payload, other), { ok: false, failure: 'signature' });
});

test('缺少字段或时间不可解析时返回 malformed', () => {
  assert.deepEqual(verifyCheckInPayload({ roomId: '12' }, SECRET), {
    ok: false,
    failure: 'malformed',
  });
  assert.deepEqual(
    verifyCheckInPayload(
      { roomId: '12', nonce: 'n', issuedAt: 'not-a-date', signature: 'x' },
      SECRET,
    ),
    { ok: false, failure: 'malformed' },
  );
});

function runLimiter(handler: ReturnType<typeof createUserRateLimiter>, userId: string) {
  return new Promise<unknown>((resolve) => {
    const request = { auth: { user: { id: userId } } } as unknown as Parameters<typeof handler>[0];
    const response = {} as Parameters<typeof handler>[1];
    handler(request, response, (error?: unknown) => resolve(error));
  });
}

test('按用户限流在第 11 次请求时返回 429', async () => {
  const handler = createUserRateLimiter({ limit: 10, windowMs: 60_000, now: () => Date.now() });
  for (let index = 0; index < 10; index += 1) {
    assert.equal(await runLimiter(handler, 'user-1'), undefined);
  }
  const rejected = await runLimiter(handler, 'user-1');
  assert.ok(rejected instanceof Error);
  assert.match(rejected.message, /频繁/);

  // A different user keeps the full budget.
  assert.equal(await runLimiter(handler, 'user-2'), undefined);
});

// Evaluate the service's actual Sequelize conditions against stored reservation fixtures.
// This catches both missing end-time comparisons and strict start-time exclusions.
function reservationFixture(existingStart: string, existingEnd: string, sameSeat = false) {
  const existing = {
    user_id: sameSeat ? '2' : '1',
    seat_id: sameSeat ? '10' : '11',
    start_at: new Date(`2026-11-12T${existingStart}:00+08:00`),
    end_at: new Date(`2026-11-12T${existingEnd}:00+08:00`),
  };
  const transaction = { LOCK: { UPDATE: 'UPDATE', SHARE: 'SHARE' } };
  let persisted = false;
  const models = {
    User: { findByPk: async () => ({ id: '1', status: 'active' }) },
    StudyRoom: {
      findByPk: async () => ({ id: '4', status: 'open', bookable_from: '2026-11-01' }),
    },
    RoomTimeSlot: {
      findByPk: async () => ({
        id: '20',
        room_id: '4',
        status: 'active',
        bookable_from: '2026-11-01',
        start_time: '10:00',
        end_time: '12:00',
      }),
    },
    Seat: {
      findByPk: async () => ({
        id: '10',
        room_id: '4',
        status: 'available',
        bookable_from: '2026-11-01',
      }),
    },
    Reservation: {
      sequelize: {
        transaction: async (run: (tx: typeof transaction) => unknown) => run(transaction),
      },
      count: async () => 1,
      findOne: async ({ where }: { where: Record<string, unknown> }) => {
        if ('idempotency_key' in where) return null;
        for (const field of ['user_id', 'seat_id'] as const) {
          if (where[field] !== undefined && where[field] !== existing[field]) return null;
        }
        for (const field of ['start_at', 'end_at'] as const) {
          const condition = where[field] as Record<symbol, Date> | undefined;
          if (!condition) continue;
          const before = condition[Op.lt];
          const after = condition[Op.gt];
          if (before && !(existing[field] < before)) return null;
          if (after && !(existing[field] > after)) return null;
        }
        return existing;
      },
      create: async (input: object) => {
        persisted = true;
        return { id: '99', ...input };
      },
    },
    ReservationStatusLog: { create: async () => undefined },
  } as unknown as ReservationModels;
  const service = new ReservationService(models, { now: () => new Date('2026-11-11T09:00:00Z') });
  return {
    create: () =>
      service.create({ id: '1', role: 'student' }, 'regression-key-1111', {
        roomId: '4',
        seatId: '10',
        slotId: '20',
        reserveDate: '2026-11-12',
      }),
    persisted: () => persisted,
  };
}

for (const [start, end] of [
  ['10:00', '12:00'],
  ['09:00', '13:00'],
  ['09:00', '11:00'],
  ['11:00', '13:00'],
]) {
  test(`已有 ${start}–${end} 预约时不能再预约 10:00–12:00 的其他座位`, async () => {
    const fixture = reservationFixture(start!, end!);
    await assert.rejects(fixture.create, /已有预约重叠/);
    assert.equal(fixture.persisted(), false);
  });
}

test('包含目标时段的同座位预约也阻止另一学生预约', async () => {
  const fixture = reservationFixture('09:00', '13:00', true);
  await assert.rejects(fixture.create, /该座位在所选时段已被预约/);
  assert.equal(fixture.persisted(), false);
});

test('首尾相邻但不重叠的预约可以创建', async () => {
  for (const [start, end] of [
    ['08:00', '10:00'],
    ['12:00', '14:00'],
  ]) {
    const fixture = reservationFixture(start!, end!);
    assert.equal((await fixture.create()).status, 'pending');
    assert.equal(fixture.persisted(), true);
  }
});
