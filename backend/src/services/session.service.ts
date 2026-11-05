import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import type { AuthConfig } from '../config/env.js';
import { HttpError } from '../middleware/errors.js';
import type { AuthenticationModels } from '../models/index.js';
import type { User } from '../models/user.model.js';
import type { AccessTokenPayload, AuthContext } from '../types/auth.js';

interface IssueSessionInput {
  user: User;
  now: Date;
}

export interface IssuedSession {
  sessionId: string;
  jti: string;
  token: string;
  expiresAt: Date;
}

export class SessionService {
  constructor(
    private readonly models: AuthenticationModels,
    private readonly config: AuthConfig,
  ) {}

  issue(input: IssueSessionInput): IssuedSession {
    const sessionId = randomUUID();
    const jti = randomUUID();
    const expiresAt = new Date(input.now.getTime() + this.config.tokenTtlSeconds * 1_000);
    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: String(input.user.id),
      role: input.user.role,
      sid: sessionId,
      jti,
    };
    const token = jwt.sign(payload, this.config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: this.config.tokenTtlSeconds,
    });
    return { sessionId, jti, token, expiresAt };
  }

  verifyTokenOnly(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ['HS256'],
      });
      if (
        typeof payload === 'string' ||
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        typeof payload.jti !== 'string' ||
        !['student', 'admin', 'super_admin'].includes(String(payload.role)) ||
        typeof payload.iat !== 'number' ||
        typeof payload.exp !== 'number' ||
        payload.exp <= payload.iat
      ) {
        throw new Error('Invalid token payload');
      }
      return payload as AccessTokenPayload;
    } catch {
      throw new HttpError(401, 'UNAUTHORIZED', '登录状态已失效，请重新登录');
    }
  }

  async authenticate(token: string): Promise<AuthContext> {
    const payload = this.verifyTokenOnly(token);
    const now = new Date();
    const session = await this.models.UserSession.findOne({
      where: {
        id: payload.sid,
        jti: payload.jti,
        user_id: payload.sub,
        revoked_at: null,
        expires_at: { [Op.gt]: now },
      },
    });
    if (!session) {
      throw new HttpError(401, 'UNAUTHORIZED', '登录状态已失效，请重新登录');
    }

    const user = await this.models.User.findByPk(payload.sub);
    if (!user || user.status !== 'active') {
      throw new HttpError(401, 'UNAUTHORIZED', '登录状态已失效，请重新登录');
    }

    return {
      sessionId: session.id,
      user: {
        id: String(user.id),
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        status: user.status,
      },
    };
  }

  async revoke(sessionId: string): Promise<void> {
    await this.models.UserSession.update(
      { revoked_at: new Date() },
      { where: { id: sessionId, revoked_at: null } },
    );
  }
}
