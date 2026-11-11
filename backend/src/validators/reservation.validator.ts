import { body } from 'express-validator';
import { validateRequest } from './request.js';

const idBody = (field: string, message: string) =>
  body(field)
    .isString()
    .withMessage(message)
    .trim()
    .matches(/^\d{1,20}$/)
    .withMessage(message);

export const createReservationValidation = [
  idBody('roomId', '请选择有效的自习室'),
  idBody('seatId', '请选择有效的座位'),
  idBody('slotId', '请选择有效的开放时段'),
  body('reserveDate')
    .isString()
    .withMessage('请选择预约日期')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('日期格式必须为 YYYY-MM-DD'),
  validateRequest,
];

export const cancelReservationValidation = [
  body('reason')
    .optional({ values: 'null' })
    .isString()
    .withMessage('取消原因格式不正确')
    .isLength({ max: 255 })
    .withMessage('取消原因不能超过 255 个字符'),
  validateRequest,
];

export const checkInValidation = [
  idBody('roomId', '签到码缺少自习室信息'),
  body('nonce').isString().trim().isLength({ min: 8, max: 64 }).withMessage('签到码缺少随机标识'),
  body('issuedAt').isString().withMessage('签到码缺少签发时间'),
  body('signature').isString().withMessage('签到码缺少签名'),
  validateRequest,
];

export const manualCheckInValidation = [
  body('reason')
    .isString()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('原因需为 2-255 个字符'),
  validateRequest,
];
