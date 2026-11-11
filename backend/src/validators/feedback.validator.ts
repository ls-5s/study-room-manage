import { body, param } from 'express-validator';
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from '../services/feedback.service.js';
import { validateRequest } from './request.js';

export const createFeedbackValidation = [
  body('type').isIn(FEEDBACK_TYPES).withMessage('反馈类型无效'),
  body('roomId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('自习室编号格式不正确'),
  body('seatId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('座位编号格式不正确'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('问题描述需为 5-1000 个字符'),
  validateRequest,
];

export const feedbackIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('工单编号格式不正确'),
  validateRequest,
];

export const transitionFeedbackValidation = [
  param('id').isInt({ min: 1 }).withMessage('工单编号格式不正确'),
  body('status').isIn(['processing', 'resolved', 'rejected']).withMessage('目标状态无效'),
  body('result')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ min: 2, max: 1000 })
    .withMessage('处理结果需为 2-1000 个字符'),
  body('status').custom((value) => {
    if (!FEEDBACK_STATUSES.includes(value) || value === 'pending') {
      throw new Error('目标状态无效');
    }
    return true;
  }),
  validateRequest,
];
