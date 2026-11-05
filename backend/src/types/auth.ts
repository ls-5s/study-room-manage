import type { UserRole, UserStatus } from '../models/user.model.js';

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthContext {
  sessionId: string;
  user: AuthenticatedUser;
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  sid: string;
  jti: string;
  iat: number;
  exp: number;
}
