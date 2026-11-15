import type { Logger } from '../lib/logger.js';
import { addBusinessDays, toBusinessDate } from '../lib/study-room-time.js';
import type { StatisticsService } from '../services/statistics.service.js';
import { SnapshotPendingError } from '../services/statistics.repository.js';
import type { ReservationStateJob } from './reservation-state.job.js';
import type { JobRuntimeStatus } from '../types/jobs.js';

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
  readonly name = 'statistics';
  private readonly now: () => Date;
  private readonly logger: Logger | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private running = false;
  private activeRun: Promise<void> | undefined;
  private lastStartedAt: Date | null = null;
  private lastFinishedAt: Date | null = null;
  private lastDurationMs: number | null = null;
  private consecutiveFailures = 0;
  private lastErrorName: string | null = null;

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
    void this.schedule();
    this.timer = setInterval(() => void this.schedule(), intervalMs);
    this.timer.unref();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    await this.activeRun;
  }

  getStatus(): JobRuntimeStatus {
    return {
      name: this.name,
      state: this.running
        ? 'running'
        : this.lastErrorName
          ? 'error'
          : this.lastFinishedAt
            ? 'success'
            : 'idle',
      lastStartedAt: this.lastStartedAt,
      lastFinishedAt: this.lastFinishedAt,
      lastDurationMs: this.lastDurationMs,
      consecutiveFailures: this.consecutiveFailures,
      lastErrorName: this.lastErrorName,
    };
  }

  private schedule(): Promise<void> {
    if (this.running) return this.activeRun ?? Promise.resolve();
    this.running = true;
    this.lastStartedAt = this.now();
    const started = performance.now();
    this.activeRun = this.run()
      .then(() => {
        this.consecutiveFailures = 0;
        this.lastErrorName = null;
      })
      .catch((error: unknown) => {
        this.consecutiveFailures += 1;
        this.lastErrorName = error instanceof Error ? error.name : 'UnknownError';
        this.logger?.error('job.statistics_crashed', {
          requestId: 'background',
          errorName: this.lastErrorName,
        });
      })
      .finally(() => {
        this.running = false;
        this.lastFinishedAt = this.now();
        this.lastDurationMs = Math.round(performance.now() - started);
        this.activeRun = undefined;
      });
    return this.activeRun;
  }
}
