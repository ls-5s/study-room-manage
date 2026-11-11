import assert from 'node:assert/strict'
import test from 'node:test'
import { isSlotStarted } from '../src/utils/study-room.ts'

test('预约时段在开始瞬间不可再预约，而不是等到结束', () => {
  assert.equal(isSlotStarted('2026-11-11', '16:00', new Date('2026-11-11T07:59:59Z')), false)
  assert.equal(isSlotStarted('2026-11-11', '16:00', new Date('2026-11-11T08:00:00Z')), true)
  assert.equal(isSlotStarted('2026-11-11', '16:00', new Date('2026-11-11T09:00:00Z')), true)
})

test('按上海业务时区比较跨日时段，不依赖设备本地小时', () => {
  const now = new Date('2026-11-11T16:05:00Z')
  assert.equal(isSlotStarted('2026-11-12', '00:00', now), true)
  assert.equal(isSlotStarted('2026-11-12', '08:00', now), false)
  assert.equal(isSlotStarted('2026-11-11', '23:59', now), true)
})

test('带秒的后端时段格式与分钟格式行为一致', () => {
  const now = new Date('2026-11-11T08:00:00Z')
  assert.equal(isSlotStarted('2026-11-11', '16:00:00', now), true)
})
