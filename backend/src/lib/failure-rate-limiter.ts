import { HttpError } from '../middleware/errors.js';

interface AttemptWindow {
  failures: number;
  resetAt: number;
}

export interface LoginAttemptResult {
  retryAfterSeconds: number | null;
}

export class LoginFailureRateLimiter {
  readonly #usernameAttempts = new Map<string, AttemptWindow>();
  readonly #ipAttempts = new Map<string, AttemptWindow>();

  constructor(
    private readonly usernameLimit = 10,
    private readonly ipLimit = 30,
    private readonly windowMs = 5 * 60 * 1_000,
    private readonly now: () => number = Date.now,
  ) {}

  check(username: string, ip: string): LoginAttemptResult {
    const now = this.now();
    const usernameWindow = this.#read(this.#usernameAttempts, username, now);
    const ipWindow = this.#read(this.#ipAttempts, ip, now);
    const retryAtCandidates: number[] = [];

    if (usernameWindow && usernameWindow.failures >= this.usernameLimit) {
      retryAtCandidates.push(usernameWindow.resetAt);
    }
    if (ipWindow && ipWindow.failures >= this.ipLimit) {
      retryAtCandidates.push(ipWindow.resetAt);
    }

    if (retryAtCandidates.length > 0) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((Math.max(...retryAtCandidates) - now) / 1_000),
      );
      throw new HttpError(429, 'RATE_LIMITED', '登录尝试过于频繁，请稍后重试', null, {
        'Retry-After': String(retryAfterSeconds),
      });
    }

    return { retryAfterSeconds: null };
  }

  recordFailure(username: string, ip: string): void {
    const now = this.now();
    this.#increment(this.#usernameAttempts, username, now);
    this.#increment(this.#ipAttempts, ip, now);
  }

  recordSuccess(username: string): void {
    this.#usernameAttempts.delete(username);
  }

  #read(store: Map<string, AttemptWindow>, key: string, now: number): AttemptWindow | undefined {
    const window = store.get(key);
    if (window && window.resetAt <= now) {
      store.delete(key);
      return undefined;
    }
    return window;
  }

  #increment(store: Map<string, AttemptWindow>, key: string, now: number): void {
    const current = this.#read(store, key, now);
    store.set(key, {
      failures: (current?.failures ?? 0) + 1,
      resetAt: current?.resetAt ?? now + this.windowMs,
    });
  }
}
