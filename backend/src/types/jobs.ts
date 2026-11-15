export type JobState = 'idle' | 'running' | 'success' | 'error';

export interface JobRuntimeStatus {
  name: string;
  state: JobState;
  lastStartedAt: Date | null;
  lastFinishedAt: Date | null;
  lastDurationMs: number | null;
  consecutiveFailures: number;
  lastErrorName: string | null;
}

export interface ServerJob {
  readonly name: string;
  start: () => void;
  stop: () => Promise<void>;
  getStatus: () => JobRuntimeStatus;
}
