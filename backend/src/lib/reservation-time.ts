import { addBusinessDays, isValidBusinessDate, toBusinessDate } from './study-room-time.js';

export const CHECK_IN_BEFORE_MINUTES = 30;
export const CHECK_IN_AFTER_MINUTES = 15;
export const NO_SHOW_GRACE_MINUTES = 30;

const MINUTE_MS = 60_000;

/** Combinies an Asia/Shanghai business date with a HH:mm slot boundary into a UTC instant. */
export function combineBusinessDateTime(date: string, time: string): Date {
  const normalized = time.length === 5 ? time : time.slice(0, 5);
  return new Date(`${date}T${normalized}:00+08:00`);
}

export interface SlotWindow {
  reserveDate: string;
  startAt: Date;
  endAt: Date;
  checkInOpenAt: Date;
  checkInDeadline: Date;
}

export function buildSlotWindow(
  businessDate: string,
  startTime: string,
  endTime: string,
): SlotWindow {
  const startAt = combineBusinessDateTime(businessDate, startTime);
  const endAt = combineBusinessDateTime(businessDate, endTime);
  return {
    reserveDate: businessDate,
    startAt,
    endAt,
    checkInOpenAt: new Date(startAt.getTime() - CHECK_IN_BEFORE_MINUTES * MINUTE_MS),
    checkInDeadline: new Date(startAt.getTime() + CHECK_IN_AFTER_MINUTES * MINUTE_MS),
  };
}

const businessFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** Formats an instant as an ISO 8601 string with the fixed Asia/Shanghai offset. */
export function toBusinessIso(value: Date): string {
  const parts = businessFormatter.formatToParts(value);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';
  const hour = pick('hour') === '24' ? '00' : pick('hour');
  return `${pick('year')}-${pick('month')}-${pick('day')}T${hour}:${pick('minute')}:${pick('second')}+08:00`;
}

export function shiftBusinessDays(date: string, days: number): string {
  return addBusinessDays(date, days);
}

export function isBusinessDate(value: string): boolean {
  return isValidBusinessDate(value);
}

export function businessDateOf(value: Date): string {
  return toBusinessDate(value);
}

export type DeadlineClass = 'due' | 'stale' | 'future';

/**
 * The no-show job only converts records whose deadline has just passed. A record whose
 * deadline is far in the past means the job was not running, so the student could not
 * have checked in; those are converted to `cancelled` instead of `no_show`.
 */
export function classifyDeadline(
  deadline: Date,
  now: Date,
  graceMinutes = NO_SHOW_GRACE_MINUTES,
): DeadlineClass {
  const elapsed = now.getTime() - deadline.getTime();
  if (elapsed <= 0) return 'future';
  return elapsed <= graceMinutes * MINUTE_MS ? 'due' : 'stale';
}

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidIdempotencyKey(value: unknown): value is string {
  return typeof value === 'string' && IDEMPOTENCY_KEY_PATTERN.test(value);
}
