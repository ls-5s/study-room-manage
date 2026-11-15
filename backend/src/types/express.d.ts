import type { AccessTokenPayload, AuthContext } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      tokenPayload?: AccessTokenPayload;
      requestId?: string;
    }
  }
}

export {};
