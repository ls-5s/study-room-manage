import { body } from 'express-validator';
import { validateRequest } from './request.js';

export const revokeViolationValidation = [
  body('status').equals('revoked').withMessage('仅支持将违约记录撤销'),
  body('reason')
    .isString()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('撤销原因需为 2-255 个字符'),
  validateRequest,
];

export const violationRulesValidation = [
  body('threshold').isInt({ min: 1, max: 20 }).withMessage('违约阈值需为 1-20 的整数'),
  body('restrictionDays').isInt({ min: 1, max: 90 }).withMessage('限制天数需为 1-90 的整数'),
  validateRequest,
];
