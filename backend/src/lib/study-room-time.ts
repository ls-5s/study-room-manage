export const BUSINESS_TIME_ZONE = 'Asia/Shanghai';
export const MAX_BOOKING_DAYS = 7;

const businessDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function toBusinessDate(value: Date): string {
  const parts = businessDateFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) throw new Error('无法解析上海业务日期');
  return `${year}-${month}-${day}`;
}

export function isValidBusinessDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function addBusinessDays(value: string, days: number): string {
  if (!isValidBusinessDate(value) || !Number.isInteger(days)) {
    throw new Error('业务日期或天数无效');
  }
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return [
    String(next.getUTCFullYear()).padStart(4, '0'),
    String(next.getUTCMonth() + 1).padStart(2, '0'),
    String(next.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function nextBusinessDate(now = new Date()): string {
  return addBusinessDays(toBusinessDate(now), 1);
}

export function validateBookableDate(
  value: string,
  now = new Date(),
): { date: string; firstDate: string; lastDate: string } {
  if (!isValidBusinessDate(value)) {
    throw new Error('日期格式必须为 YYYY-MM-DD');
  }
  const firstDate = toBusinessDate(now);
  const lastDate = addBusinessDays(firstDate, MAX_BOOKING_DAYS - 1);
  if (value < firstDate || value > lastDate) {
    throw new Error(`日期必须在 ${firstDate} 至 ${lastDate} 之间`);
  }
  return { date: value, firstDate, lastDate };
}

export function assertTimeRange(startTime: string, endTime: string): number {
  const pattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!pattern.test(startTime) || !pattern.test(endTime)) {
    throw new Error('时段必须使用 HH:mm 格式');
  }
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (startMinutes >= endMinutes) throw new Error('开始时间必须早于结束时间');
  const duration = endMinutes - startMinutes;
  if (duration < 30) throw new Error('开放时段不能少于 30 分钟');
  if (duration > 240) throw new Error('开放时段不能超过 4 小时');
  return duration;
}

export function timeToMinutes(value: string): number {
  const [hour = 0, minute = 0] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function normalizeTime(value: string): string {
  return value.length === 5 ? value : value.slice(0, 5);
}

export function formatSeatNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(2, '0')}`;
}

export function normalizeSeatPrefix(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidSeatPrefix(value: string): boolean {
  return /^[A-Z0-9]{1,8}$/.test(value);
}
