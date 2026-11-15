import { body } from 'express-validator';
import { validateRequest } from './request.js';

export const profileValidation = [
  body().custom((value: unknown) => {
    if (typeof value !== 'object' || value === null) throw new Error('请求内容无效');
    const keys = ['displayName', 'email', 'phone', 'avatarUrl'];
    if (!keys.some((key) => Object.prototype.hasOwnProperty.call(value, key))) {
      throw new Error('至少需要修改一个字段');
    }
    return true;
  }),
  body('displayName').optional().isString().withMessage('显示名称格式不正确'),
  body('email').optional({ nullable: true }).isString().withMessage('邮箱格式不正确'),
  body('phone').optional({ nullable: true }).isString().withMessage('手机号格式不正确'),
  body('avatarUrl').optional({ nullable: true }).isString().withMessage('头像地址格式不正确'),
  validateRequest,
];

export const passwordValidation = [
  body('oldPassword').isString().notEmpty().withMessage('请输入当前密码'),
  body('newPassword').isString().notEmpty().withMessage('请输入新密码'),
  validateRequest,
];

export const userStatusValidation = [
  body('status').isIn(['active', 'disabled']).withMessage('账号状态无效'),
  body('reason')
    .isString()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('请填写 2-255 字的原因'),
  validateRequest,
];

export const createAdminValidation = [
  body('username').isString().notEmpty().withMessage('请输入用户名'),
  body('displayName').isString().notEmpty().withMessage('请输入显示名称'),
  body('password').isString().notEmpty().withMessage('请输入初始密码'),
  body('email').optional({ values: 'falsy' }).isString().withMessage('邮箱格式不正确'),
  body('phone').optional({ values: 'falsy' }).isString().withMessage('手机号格式不正确'),
  validateRequest,
];
