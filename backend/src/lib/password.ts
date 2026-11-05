import bcrypt from 'bcryptjs';
import { HttpError } from '../middleware/errors.js';

const visibleAsciiPattern = /^[\x21-\x7E]{8,32}$/;
const dummyHash = '$2b$12$jETOzoxklGIzFtNVV1SqEu3mFuzQf6rdAVo9HG8X.0LLs5nN6nAui';

export function assertValidPassword(password: string, field = 'password'): void {
  if (
    !visibleAsciiPattern.test(password) ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password) ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { [field]: '密码需为 8-32 位可见 ASCII 字符，并同时包含字母和数字' },
    });
  }
}

export async function hashPassword(password: string, cost: number): Promise<string> {
  return bcrypt.hash(password, cost);
}

export async function verifyPassword(password: string, hash?: string | null): Promise<boolean> {
  return bcrypt.compare(password, hash ?? dummyHash);
}
