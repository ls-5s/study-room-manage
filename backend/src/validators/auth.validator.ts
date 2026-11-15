import { body } from 'express-validator';
import { validateRequest } from './request.js';

export const registerValidation = [
  body('studentNo').isString().withMessage('请输入学号'),
  body('username').isString().withMessage('请输入用户名'),
  body('displayName').isString().withMessage('请输入显示名称'),
  body('password').isString().withMessage('请输入密码'),
  body('email').optional({ values: 'falsy' }).isString().withMessage('邮箱格式不正确'),
  validateRequest,
];

export const loginValidation = [
  body('username').isString().trim().notEmpty().withMessage('请输入用户名'),
  body('password').isString().notEmpty().withMessage('请输入密码'),
  validateRequest,
];
