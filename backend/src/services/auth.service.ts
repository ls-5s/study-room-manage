import { Op, UniqueConstraintError, type Transaction } from 'sequelize';
import type { Sequelize } from 'sequelize';
import type { AuthConfig } from '../config/env.js';
import {
  assertValidDisplayName,
  assertValidEmail,
  assertValidStudentNo,
  assertValidUsername,
  normalizeDisplayName,
  normalizeEmail,
  normalizeStudentNo,
  normalizeUsername,
} from '../lib/auth-normalization.js';
import { assertValidPassword, hashPassword, verifyPassword } from '../lib/password.js';
import { HttpError } from '../middleware/errors.js';
import type { AuthenticationModels } from '../models/index.js';
import { toUserProfile, toUserSummary } from './presenters.js';
import type { SessionService } from './session.service.js';

export interface RegisterInput {
  studentNo: string;
  username: string;
  displayName: string;
  password: string;
  email?: string | null;
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  user: ReturnType<typeof toUserSummary>;
}

export class AuthService {
  constructor(
    private readonly models: AuthenticationModels,
    private readonly sequelize: Sequelize,
    private readonly sessions: SessionService,
    private readonly config: AuthConfig,
  ) {}

  async register(input: RegisterInput) {
    const studentNo = normalizeStudentNo(input.studentNo);
    const username = normalizeUsername(input.username);
    const displayName = normalizeDisplayName(input.displayName);
    const email = normalizeEmail(input.email);
    assertValidStudentNo(studentNo);
    assertValidUsername(username);
    assertValidPassword(input.password);
    assertValidEmail(email);
    assertValidDisplayName(displayName);

    const duplicateConditions: Record<string, string>[] = [{ student_no: studentNo }, { username }];
    if (email) duplicateConditions.push({ email });
    if (await this.models.User.findOne({ where: { [Op.or]: duplicateConditions } })) {
      throw new HttpError(409, 'CONFLICT', '账号信息已存在');
    }

    try {
      const user = await this.models.User.create({
        student_no: studentNo,
        username,
        display_name: displayName,
        email,
        phone: null,
        avatar_url: null,
        password_hash: await hashPassword(input.password, this.config.bcryptCost),
        role: 'student',
        status: 'active',
        violation_count: 0,
        restriction_started_at: null,
        restriction_until: null,
        last_login_at: null,
      });
      return toUserProfile(user);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new HttpError(409, 'CONFLICT', '账号信息已存在');
      }
      throw error;
    }
  }

  async login(usernameInput: string, password: string): Promise<LoginResult> {
    const username = normalizeUsername(usernameInput);
    const user = await this.models.User.findOne({ where: { username } });
    const passwordMatches = await verifyPassword(password, user?.password_hash);
    if (!user || !passwordMatches) {
      throw new HttpError(401, 'UNAUTHORIZED', '账号或密码错误');
    }
    if (user.status === 'disabled') {
      throw new HttpError(403, 'FORBIDDEN', '账号已停用，请联系管理员');
    }

    const now = new Date();
    const issued = this.sessions.issue({ user, now });
    try {
      await this.sequelize.transaction(async (transaction) => {
        const lockedUser = await this.models.User.findByPk(user.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!lockedUser || lockedUser.password_hash !== user.password_hash) {
          throw new HttpError(401, 'UNAUTHORIZED', '账号或密码错误');
        }
        if (lockedUser.status !== 'active') {
          throw new HttpError(403, 'FORBIDDEN', '账号已停用，请联系管理员');
        }

        await this.enforceSessionLimit(lockedUser.id, now, transaction);
        await this.models.UserSession.create(
          {
            id: issued.sessionId,
            user_id: lockedUser.id,
            jti: issued.jti,
            expires_at: issued.expiresAt,
            revoked_at: null,
            created_at: now,
          },
          { transaction },
        );
        lockedUser.last_login_at = now;
        await lockedUser.save({ transaction });
      });
    } catch (error) {
      if (error instanceof HttpError && error.statusCode === 401) {
        throw error;
      }
      throw error;
    }

    return {
      token: issued.token,
      expiresAt: issued.expiresAt.toISOString(),
      user: toUserSummary(user, now),
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    assertValidPassword(newPassword, 'newPassword');
    await this.sequelize.transaction(async (transaction) => {
      const user = await this.models.User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user || user.status !== 'active') {
        throw new HttpError(401, 'UNAUTHORIZED', '登录状态已失效，请重新登录');
      }
      if (!(await verifyPassword(oldPassword, user.password_hash))) {
        throw new HttpError(422, 'VALIDATION_ERROR', '当前密码不正确', {
          fields: { oldPassword: '当前密码不正确' },
        });
      }
      if (await verifyPassword(newPassword, user.password_hash)) {
        throw new HttpError(422, 'VALIDATION_ERROR', '新密码不能与旧密码相同', {
          fields: { newPassword: '新密码不能与当前密码相同' },
        });
      }

      user.password_hash = await hashPassword(newPassword, this.config.bcryptCost);
      await user.save({ transaction });
      await this.models.UserSession.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null }, transaction },
      );
    });
  }

  private async enforceSessionLimit(
    userId: string,
    now: Date,
    transaction: Transaction,
  ): Promise<void> {
    const sessions = await this.models.UserSession.findAll({
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { [Op.gt]: now },
      },
      order: [
        ['created_at', 'ASC'],
        ['id', 'ASC'],
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const excess = sessions.length - 4;
    for (let index = 0; index < excess; index += 1) {
      const session = sessions[index];
      if (session) {
        session.revoked_at = now;
        await session.save({ transaction });
      }
    }
  }
}
