import { body } from 'express-validator';
import { validateRequest } from './request.js';

function hasAnyKey(value: unknown, keys: readonly string[]): boolean {
  if (typeof value !== 'object' || value === null) return false;
  return keys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

export const createRoomValidation = [
  body('name').isString().trim().notEmpty().withMessage('请输入自习室名称'),
  body('location').isString().trim().notEmpty().withMessage('请输入自习室位置'),
  body('description').optional({ nullable: true }).isString().withMessage('说明格式不正确'),
  body('gridRows').isInt({ min: 1, max: 50 }).withMessage('行数必须为 1-50'),
  body('gridColumns').isInt({ min: 1, max: 50 }).withMessage('列数必须为 1-50'),
  validateRequest,
];

export const updateRoomValidation = [
  body().custom((value: unknown) => {
    if (
      !hasAnyKey(value, ['name', 'location', 'description', 'gridRows', 'gridColumns', 'status'])
    ) {
      throw new Error('至少需要修改一个字段');
    }
    return true;
  }),
  body('name').optional().isString().withMessage('自习室名称格式不正确'),
  body('location').optional().isString().withMessage('自习室位置格式不正确'),
  body('description').optional({ nullable: true }).isString().withMessage('说明格式不正确'),
  body('gridRows').optional().isInt({ min: 1, max: 50 }).withMessage('行数必须为 1-50'),
  body('gridColumns').optional().isInt({ min: 1, max: 50 }).withMessage('列数必须为 1-50'),
  body('status').optional().isIn(['open', 'closed', 'disabled']).withMessage('房间状态无效'),
  validateRequest,
];

export const createTimeSlotValidation = [
  body('label').isString().trim().notEmpty().withMessage('请输入时段名称'),
  body('startTime')
    .isString()
    .matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('开始时间无效'),
  body('endTime')
    .isString()
    .matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('结束时间无效'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('时段状态无效'),
  validateRequest,
];

export const updateTimeSlotValidation = [
  body().custom((value: unknown) => {
    if (!hasAnyKey(value, ['label', 'startTime', 'endTime', 'status'])) {
      throw new Error('至少需要修改一个字段');
    }
    return true;
  }),
  body('label').optional().isString().withMessage('时段名称格式不正确'),
  body('startTime')
    .optional()
    .isString()
    .matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('开始时间无效'),
  body('endTime')
    .optional()
    .isString()
    .matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('结束时间无效'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('时段状态无效'),
  validateRequest,
];

export const createSeatBatchValidation = [
  body('prefix').isString().trim().notEmpty().withMessage('请输入批次前缀'),
  body('rows').isInt({ min: 1, max: 50 }).withMessage('行数必须为 1-50'),
  body('columns').isInt({ min: 1, max: 50 }).withMessage('列数必须为 1-50'),
  body('startRow').isInt({ min: 1, max: 50 }).withMessage('起始行无效'),
  body('startColumn').isInt({ min: 1, max: 50 }).withMessage('起始列无效'),
  body('skip').optional().isArray().withMessage('跳过坐标格式无效'),
  body('skip.*.row').optional().isInt({ min: 1, max: 50 }).withMessage('跳过行号无效'),
  body('skip.*.column').optional().isInt({ min: 1, max: 50 }).withMessage('跳过列号无效'),
  validateRequest,
];

export const updateSeatValidation = [
  body().custom((value: unknown) => {
    if (!hasAnyKey(value, ['seatNo', 'row', 'column', 'status', 'remark'])) {
      throw new Error('至少需要修改一个字段');
    }
    return true;
  }),
  body('seatNo').optional().isString().withMessage('座位编号格式不正确'),
  body('row').optional().isInt({ min: 1, max: 50 }).withMessage('行号必须为 1-50'),
  body('column').optional().isInt({ min: 1, max: 50 }).withMessage('列号必须为 1-50'),
  body('status')
    .optional()
    .isIn(['available', 'maintenance', 'disabled'])
    .withMessage('座位状态无效'),
  body('remark').optional({ nullable: true }).isString().withMessage('备注格式不正确'),
  validateRequest,
];
