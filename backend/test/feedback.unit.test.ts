import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FEEDBACK_TRANSITIONS,
  validateFeedbackCreateInput,
  validateFeedbackTransition,
} from '../src/services/feedback.service.js';

test('有效占座举报会规范化描述和资源编号', () => {
  assert.deepEqual(
    validateFeedbackCreateInput({
      type: 'occupied_seat',
      roomId: 12,
      seatId: '205',
      description: '  该座位长期放置物品，现场无人使用。  ',
    }),
    {
      type: 'occupied_seat',
      roomId: '12',
      seatId: '205',
      description: '该座位长期放置物品，现场无人使用。',
    },
  );
});

test('占座举报必须同时提供自习室和座位', () => {
  assert.throws(() =>
    validateFeedbackCreateInput({
      type: 'occupied_seat',
      roomId: 12,
      description: '该座位长期放置物品，现场无人使用。',
    }),
  );
});

test('提供座位时必须提供自习室', () => {
  assert.throws(() =>
    validateFeedbackCreateInput({
      type: 'equipment',
      seatId: 205,
      description: '台灯无法正常打开，需要检修。',
    }),
  );
});

test('描述长度按去除首尾空白后的字符数校验', () => {
  assert.throws(() =>
    validateFeedbackCreateInput({
      type: 'other',
      description: '  短  ',
    }),
  );
  assert.throws(() =>
    validateFeedbackCreateInput({
      type: 'other',
      description: '描'.repeat(1001),
    }),
  );
});

test('状态机只允许文档约定的转换', () => {
  assert.deepEqual(FEEDBACK_TRANSITIONS, {
    pending: ['processing', 'rejected'],
    processing: ['resolved', 'rejected'],
    resolved: [],
    rejected: [],
  });
  assert.deepEqual(validateFeedbackTransition('pending', 'processing', undefined), {
    status: 'processing',
    result: null,
  });
  assert.deepEqual(
    validateFeedbackTransition('processing', 'resolved', '  已现场核实并完成清理。  '),
    {
      status: 'resolved',
      result: '已现场核实并完成清理。',
    },
  );
});

test('解决或驳回必须填写有效结果', () => {
  assert.throws(() => validateFeedbackTransition('processing', 'resolved', ''));
  assert.throws(() => validateFeedbackTransition('processing', 'rejected', '短'));
});

test('跳过处理中直接解决和修改终态返回冲突', () => {
  assert.throws(
    () => validateFeedbackTransition('pending', 'resolved', '已处理完成'),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 409,
  );
  assert.throws(
    () => validateFeedbackTransition('resolved', 'processing', undefined),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 409,
  );
});
