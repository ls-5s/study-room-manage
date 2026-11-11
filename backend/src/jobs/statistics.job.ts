import type { Logger } from '../lib/logger.js';
import { addBusinessDays, toBusinessDate } from '../lib/study-room-time.js';
import type { StatisticsService } from '../services/statistics.service.js';
import { SnapshotPendingError } from '../services/statistics.repository.js';
import type { ReservationStateJob } from './reservation-state.job.js';

interface StatisticsJobOptions {
  now?: (() => Date) | undefined;
  logger?: Logger | undefined;
}

export function isFinalizationWindow(now: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour > 1 || (hour === 1 && minute >= 10);
}

export class StatisticsJob {
  private readonly now: () => Date;
  private readonly logger: Logger | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private running = false;

  constructor(
    private readonly statistics: StatisticsService,
    private readonly reservationState: ReservationStateJob,
    options: StatisticsJobOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger;
  }

  async run(now = this.now()): Promise<void> {
    const today = toBusinessDate(now);
    await this.statistics.refreshCurrentDay(today);

    if (!isFinalizationWindow(now)) return;
    const yesterday = addBusinessDays(today, -1);
    await this.reservationState.run(now);
    try {
      const changed = await this.statistics.finalize(yesterday);
      if (changed) this.logger?.info('statistics.finalized', { statDate: yesterday });
    } catch (error) {
      if (error instanceof SnapshotPendingError) {
        this.logger?.info('statistics.finalize_pending', { statDate: yesterday });
        return;
      }
      throw error;
    }
  }

  start(intervalMs = 60_000): void {
    if (this.timer) return;
    const tick = async () => {
      if (this.running) return;
      this.running = true;
      try {
        await this.run();
      } catch {
        this.logger?.error('job.statistics_crashed');
      } finally {
        this.running = false;
      }
    };
    void tick();
    this.timer = setInterval(() => void tick(), intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}
