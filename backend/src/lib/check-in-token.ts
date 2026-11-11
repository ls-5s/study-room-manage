import { createHmac, timingSafeEqual } from 'node:crypto';
import { toBusinessIso } from './reservation-time.js';

export interface CheckInPayload {
  roomId: string;
  nonce: string;
  issuedAt: string;
  /** Always null: room codes are long-lived and never expire. Kept for client compatibility. */
  expiresAt: string | null;
  signature: string;
}

export type CheckInVerifyFailure = 'malformed' | 'signature';

export interface CheckInVerifyResult {
  ok: boolean;
  failure?: CheckInVerifyFailure;
}

/**
 * The canonical string intentionally excludes any expiry: the code stays valid until the
 * room's nonce is rotated. `issuedAt` is signed so the shown code can be traced to the moment
 * it was generated.
 */
export function canonicalCheckInText(roomId: string, nonce: string, issuedAt: string): string {
  return `${roomId}|${nonce}|${issuedAt}`;
}

export function signCheckInPayload(
  secret: string,
  roomId: string,
  nonce: string,
  issuedAt: string,
): string {
  return createHmac('sha256', secret)
    .update(canonicalCheckInText(roomId, nonce, issuedAt))
    .digest('base64url');
}

export function createCheckInPayload(
  secret: string,
  roomId: string,
  nonce: string,
  now: Date,
): CheckInPayload {
  const issuedAt = toBusinessIso(now);
  return {
    roomId,
    nonce,
    issuedAt,
    expiresAt: null,
    signature: signCheckInPayload(secret, roomId, nonce, issuedAt),
  };
}

interface VerifyInput {
  roomId?: unknown;
  nonce?: unknown;
  issuedAt?: unknown;
  signature?: unknown;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * A code is valid whenever its signature matches: there is no expiry and no rotation state,
 * so a code photographed earlier keeps working. Rotating the nonce only changes what the
 * screen shows; it cannot invalidate copies that were already handed out.
 */
export function verifyCheckInPayload(
  input: VerifyInput,
  secret: string,
): CheckInVerifyResult {
  const roomId = asString(input.roomId);
  const nonce = asString(input.nonce);
  const issuedAt = asString(input.issuedAt);
  const signature = asString(input.signature);
  if (!roomId || !nonce || !issuedAt || !signature) {
    return { ok: false, failure: 'malformed' };
  }
  if (Number.isNaN(Date.parse(issuedAt))) {
    return { ok: false, failure: 'malformed' };
  }

  const expected = signCheckInPayload(secret, roomId, nonce, issuedAt);
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(signature, 'utf8');
  const signatureMatches =
    expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
  if (!signatureMatches) return { ok: false, failure: 'signature' };
  return { ok: true };
}
