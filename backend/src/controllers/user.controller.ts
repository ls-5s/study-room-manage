import type { Request, RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';
import type { UserStatus } from '../models/user.model.js';
import type {
  CreateAdminInput,
  ProfileUpdateInput,
  UserService,
} from '../services/user.service.js';
import type { AuthService } from '../services/auth.service.js';
import { success } from '../types/api.js';

function authenticatedRequest(request: Request) {
  if (!request.auth) throw new HttpError(401, 'UNAUTHORIZED', '请先登录');
  return request.auth;
}

function integerQuery(value: unknown, fallback: number, maximum: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new HttpError(400, 'BAD_REQUEST', '分页参数无效');
  }
  return parsed;
}

export function createUserController(
  users: UserService,
  auth: AuthService,
): Record<
  | 'getMe'
  | 'updateMe'
  | 'changePassword'
  | 'listUsers'
  | 'createAdmin'
  | 'getUser'
  | 'changeStatus',
  RequestHandler
> {
  return {
    getMe: async (request, response) => {
      const context = authenticatedRequest(request);
      response.json(success(await users.getProfile(context.user.id), '查询成功'));
    },
    updateMe: async (request, response) => {
      const context = authenticatedRequest(request);
      response.json(
        success(
          await users.updateProfile(context.user.id, request.body as ProfileUpdateInput),
          '资料已更新',
        ),
      );
    },
    changePassword: async (request, response) => {
      const context = authenticatedRequest(request);
      const body = request.body as { oldPassword: string; newPassword: string };
      await auth.changePassword(context.user.id, body.oldPassword, body.newPassword);
      response.json(success(null, '密码已更新，请重新登录'));
    },
    listUsers: async (request, response) => {
      const page = integerQuery(request.query.page, 1, 1_000_000);
      const pageSize = integerQuery(request.query.pageSize, 20, 100);
      const filter = {
        page,
        pageSize,
      } as {
        page: number;
        pageSize: number;
        studentNo?: string;
        username?: string;
        role?: 'student' | 'admin' | 'super_admin';
        status?: 'active' | 'disabled';
      };
      if (typeof request.query.studentNo === 'string') filter.studentNo = request.query.studentNo;
      if (typeof request.query.username === 'string') filter.username = request.query.username;
      if (
        request.query.role === 'student' ||
        request.query.role === 'admin' ||
        request.query.role === 'super_admin'
      ) {
        filter.role = request.query.role;
      }
      if (request.query.status === 'active' || request.query.status === 'disabled') {
        filter.status = request.query.status;
      }
      const result = await users.listUsers(filter);
      response.json(success(result, '查询成功'));
    },
    createAdmin: async (request, response) => {
      const context = authenticatedRequest(request);
      const result = await users.createAdmin(context.user.id, request.body as CreateAdminInput);
      response.status(201).json(success(result, '管理员账号已创建'));
    },
    getUser: async (request, response) => {
      response.json(success(await users.getAdminUser(String(request.params.userId)), '查询成功'));
    },
    changeStatus: async (request, response) => {
      const context = authenticatedRequest(request);
      const body = request.body as { status: UserStatus; reason: string };
      const result = await users.changeStatus(
        context.user.id,
        String(request.params.userId),
        body.status,
        body.reason,
      );
      response.json(success(result, body.status === 'disabled' ? '账号已停用' : '账号已恢复'));
    },
  };
}
