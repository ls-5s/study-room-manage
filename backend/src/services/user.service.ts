import { randomUUID } from 'node:crypto';
import { Op, type Sequelize, type WhereOptions } from 'sequelize';
import { UniqueConstraintError } from 'sequelize';
import {
  assertValidDisplayName,
  assertValidEmail,
  assertValidUsername,
  normalizeAvatarUrl,
  normalizeDisplayName,
  normalizeEmail,
  normalizePhone,
  normalizeUsername,
} from '../lib/auth-normalization.js';
import { assertValidPassword, hashPassword } from '../lib/password.js';
import { HttpError } from '../middleware/errors.js';
import type { AuthenticationModels } from '../models/index.js';
import type { UserStatus } from '../models/user.model.js';
import type { User } from '../models/user.model.js';
import { toAdminUserView, toUserProfile } from './presenters.js';

export interface ProfileUpdateInput {
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UserListFilter {
  studentNo?: string;
  username?: string;
  role?: 'student' | 'admin' | 'super_admin';
  status?: UserStatus;
  page: number;
  pageSize: number;
}

export interface CreateAdminInput {
  username: string;
  displayName: string;
  password: string;
  email?: string | null;
  phone?: string | null;
}

export interface UserAuditLogItem {
  id: string;
  action: string;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  operator: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  createdAt: string;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export class UserService {
  constructor(
    private readonly models: AuthenticationModels,
    private readonly sequelize: Sequelize,
    private readonly bcryptCost: number,
  ) {}

  async getProfile(userId: string) {
    const user = await this.models.User.findByPk(userId);
    if (!user) throw new HttpError(404, 'NOT_FOUND', '用户不存在');
    return toUserProfile(user);
  }

  async updateProfile(userId: string, input: ProfileUpdateInput) {
    const user = await this.models.User.findByPk(userId);
    if (!user || user.status !== 'active') {
      throw new HttpError(401, 'UNAUTHORIZED', '登录状态已失效，请重新登录');
    }

    if (input.displayName !== undefined) {
      const displayName = normalizeDisplayName(input.displayName);
      if (displayName.length < 2 || displayName.length > 64) {
        throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
          fields: { displayName: '显示名称需为 2-64 个字符' },
        });
      }
      user.display_name = displayName;
    }
    if (input.email !== undefined) user.email = normalizeEmail(input.email);
    if (input.phone !== undefined) user.phone = normalizePhone(input.phone);
    if (input.avatarUrl !== undefined) user.avatar_url = normalizeAvatarUrl(input.avatarUrl);

    if (user.email) {
      const duplicate = await this.models.User.findOne({
        where: { email: user.email, id: { [Op.ne]: user.id } },
      });
      if (duplicate) throw new HttpError(409, 'CONFLICT', '邮箱已被其他账号使用');
    }

    try {
      await user.save();
      return toUserProfile(user);
    } catch (error) {
      if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
        throw new HttpError(409, 'CONFLICT', '邮箱已被其他账号使用');
      }
      throw error;
    }
  }

  async listUsers(filter: UserListFilter) {
    const where: Record<string | symbol, unknown> = {};
    if (filter.studentNo) {
      where.student_no = { [Op.like]: `${escapeLike(filter.studentNo)}%` };
    }
    if (filter.username) {
      where.username = { [Op.like]: `${escapeLike(filter.username)}%` };
    }
    if (filter.role) where.role = filter.role;
    if (filter.status) where.status = filter.status;

    const [{ rows, count }, total, students, admins, disabled] = await Promise.all([
      this.models.User.findAndCountAll({
        where: where as WhereOptions,
        order: [
          ['created_at', 'DESC'],
          ['id', 'DESC'],
        ],
        offset: (filter.page - 1) * filter.pageSize,
        limit: filter.pageSize,
      }),
      this.models.User.count(),
      this.models.User.count({ where: { role: 'student' } }),
      this.models.User.count({ where: { role: { [Op.in]: ['admin', 'super_admin'] } } }),
      this.models.User.count({ where: { status: 'disabled' } }),
    ]);
    return {
      items: rows.map((user) => toAdminUserView(user)),
      page: filter.page,
      pageSize: filter.pageSize,
      total: count,
      summary: {
        total,
        students,
        admins,
        disabled,
      },
    };
  }

  async getAdminUser(userId: string) {
    const user = await this.models.User.findByPk(userId);
    if (!user) throw new HttpError(404, 'NOT_FOUND', '用户不存在');
    return toAdminUserView(user);
  }

  async listUserAuditLogs(userId: string, page: number, pageSize: number) {
    const target = await this.models.User.findByPk(userId, { attributes: ['id'] });
    if (!target) throw new HttpError(404, 'NOT_FOUND', '用户不存在');

    const { rows, count } = await this.models.AuditLog.findAndCountAll({
      where: {
        resource_type: 'user',
        resource_id: userId,
      },
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    const operatorIds = [...new Set(rows.map((row) => String(row.operator_id)))];
    const operators =
      operatorIds.length > 0
        ? await this.models.User.findAll({
            where: { id: { [Op.in]: operatorIds } },
            attributes: ['id', 'username', 'display_name'],
          })
        : [];
    const operatorById = new Map(operators.map((operator) => [String(operator.id), operator]));

    return {
      items: rows.map((row): UserAuditLogItem => {
        const operator = operatorById.get(String(row.operator_id));
        return {
          id: String(row.id),
          action: row.action,
          reason: row.reason,
          before: row.before_json,
          after: row.after_json,
          operator: operator
            ? {
                id: String(operator.id),
                username: operator.username,
                displayName: operator.display_name,
              }
            : null,
          createdAt: row.created_at.toISOString(),
        };
      }),
      page,
      pageSize,
      total: count,
    };
  }

  async createAdmin(operatorId: string, input: CreateAdminInput) {
    const username = normalizeUsername(input.username);
    const displayName = normalizeDisplayName(input.displayName);
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    assertValidUsername(username);
    assertValidDisplayName(displayName);
    assertValidEmail(email);
    assertValidPassword(input.password);

    const duplicateConditions: Record<string, string>[] = [{ username }];
    if (email) duplicateConditions.push({ email });
    if (await this.models.User.findOne({ where: { [Op.or]: duplicateConditions } })) {
      throw new HttpError(409, 'CONFLICT', '账号信息已存在');
    }

    const studentNo = `ADMIN-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const passwordHash = await hashPassword(input.password, this.bcryptCost);
    try {
      const user = await this.sequelize.transaction(async (transaction) => {
        const created = await this.models.User.create(
          {
            username,
            student_no: studentNo,
            display_name: displayName,
            email,
            phone,
            avatar_url: null,
            password_hash: passwordHash,
            role: 'admin',
            status: 'active',
            violation_count: 0,
            restriction_started_at: null,
            restriction_until: null,
            last_login_at: null,
          },
          { transaction },
        );
        await this.models.AuditLog.create(
          {
            operator_id: operatorId,
            action: 'user.admin_created',
            resource_type: 'user',
            resource_id: created.id,
            before_json: null,
            after_json: {
              username: created.username,
              role: created.role,
              status: created.status,
              studentNo: created.student_no,
            },
            reason: '超级管理员创建管理员账号',
            request_id: null,
            created_at: new Date(),
          },
          { transaction },
        );
        return created;
      });
      return toAdminUserView(user);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new HttpError(409, 'CONFLICT', '账号信息已存在');
      }
      throw error;
    }
  }

  async changeStatus(operatorId: string, userId: string, status: UserStatus, reason: string) {
    const snapshot = await this.models.User.findByPk(userId);
    if (!snapshot) throw new HttpError(404, 'NOT_FOUND', '用户不存在');

    return this.sequelize.transaction(async (transaction) => {
      const admins =
        snapshot.role === 'admin' || snapshot.role === 'super_admin'
          ? await this.models.User.findAll({
              where: { role: { [Op.in]: ['admin', 'super_admin'] } },
              order: [['id', 'ASC']],
              transaction,
              lock: transaction.LOCK.UPDATE,
            })
          : [];
      const user =
        snapshot.role === 'admin' || snapshot.role === 'super_admin'
          ? admins.find((candidate) => String(candidate.id) === userId)
          : await this.models.User.findByPk(userId, {
              transaction,
              lock: transaction.LOCK.UPDATE,
            });
      if (!user) throw new HttpError(404, 'NOT_FOUND', '用户不存在');
      if (user.status === status) return toAdminUserView(user);
      if (status === 'disabled' && String(user.id) === operatorId) {
        throw new HttpError(409, 'CONFLICT', '不能停用当前登录的管理员账号');
      }
      if (
        status === 'disabled' &&
        (user.role === 'admin' || user.role === 'super_admin') &&
        admins.filter((candidate) => candidate.status === 'active').length <= 1
      ) {
        throw new HttpError(409, 'CONFLICT', '系统必须至少保留一名有效管理员');
      }

      const previousStatus = user.status;
      user.status = status;
      await user.save({ transaction });
      if (status === 'disabled') {
        await this.models.UserSession.update(
          { revoked_at: new Date() },
          { where: { user_id: user.id, revoked_at: null }, transaction },
        );
      }
      await this.models.AuditLog.create(
        {
          operator_id: operatorId,
          action: status === 'disabled' ? 'user.disabled' : 'user.restored',
          resource_type: 'user',
          resource_id: user.id,
          before_json: { status: previousStatus },
          after_json: { status },
          reason,
          request_id: null,
          created_at: new Date(),
        },
        { transaction },
      );
      return toAdminUserView(user);
    });
  }
}

export function isUserActive(user: User): boolean {
  return user.status === 'active';
}
