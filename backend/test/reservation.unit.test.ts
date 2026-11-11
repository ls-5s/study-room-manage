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
    const request = { auth: { user: { id: userId } } } as unknown as Parameters<
      typeof handler
    >[0];
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
