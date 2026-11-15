import { toBusinessIso } from '../lib/reservation-time.js';
import { currentRequestId } from '../lib/request-context.js';
import { toBusinessDate } from '../lib/study-room-time.js';
import type { ServerJob } from '../types/jobs.js';
import type { OperationalSettingsService } from './operational-settings.service.js';

const SERVICE_NAME = 'study-room-backend';
const SERVICE_VERSION = '0.1.0';

interface SystemServiceOptions {
  nodeEnv: 'development' | 'production' | 'test';
  trustProxy: number;
  jobsEnabled: boolean;
  jobs: readonly ServerJob[];
  probeDatabase: () => Promise<void>;
  now?: (() => Date) | undefined;
  startedAt?: Date | undefined;
}

export class SystemService {
  private readonly now: () => Date;
  private readonly startedAt: Date;

  constructor(
    private readonly settings: OperationalSettingsService,
    private readonly options: SystemServiceOptions,
  ) {
    this.now = options.now ?? (() => new Date());
    this.startedAt = options.startedAt ?? new Date();
  }

  async publicConfig() {
    const settings = await this.settings.getAll();
    return {
      timezone: 'Asia/Shanghai' as const,
      businessDate: toBusinessDate(this.now()),
      bookingWindowDays: settings.reservation.advanceDays,
    };
  }

  async status() {
    const started = performance.now();
    let databaseStatus: 'connected' | 'unavailable' = 'connected';
    let databaseLatencyMs: number | null = null;
    try {
      await this.options.probeDatabase();
      databaseLatencyMs = Math.round(performance.now() - started);
    } catch {
      databaseStatus = 'unavailable';
    }
    const now = this.now();
    return {
      requestId: currentRequestId(),
      service: {
        name: SERVICE_NAME,
        version: SERVICE_VERSION,
        environment: this.options.nodeEnv,
        startedAt: this.startedAt.toISOString(),
        uptimeSeconds: Math.max(0, Math.floor((now.getTime() - this.startedAt.getTime()) / 1_000)),
        currentTime: toBusinessIso(now),
        timezone: 'Asia/Shanghai' as const,
        businessDate: toBusinessDate(now),
        trustProxy: this.options.trustProxy,
        jobsEnabled: this.options.jobsEnabled,
      },
      database: {
        status: databaseStatus,
        latencyMs: databaseLatencyMs,
      },
      jobs: this.options.jobs.map((job) => {
        const status = job.getStatus();
        return {
          name: status.name,
          state: status.state,
          lastStartedAt: status.lastStartedAt?.toISOString() ?? null,
          lastFinishedAt: status.lastFinishedAt?.toISOString() ?? null,
          lastDurationMs: status.lastDurationMs,
          consecutiveFailures: status.consecutiveFailures,
          lastErrorName: status.lastErrorName,
        };
      }),
    };
  }

  getSettings() {
    return this.settings.getAll(true);
  }

  updateSettings(operatorId: string, input: unknown) {
    return this.settings.update(operatorId, input);
  }
}
