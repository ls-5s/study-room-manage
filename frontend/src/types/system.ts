export interface PublicSystemConfig {
  timezone: 'Asia/Shanghai'
  businessDate: string
  bookingWindowDays: number
}

export type JobState = 'idle' | 'running' | 'success' | 'error'

export interface SystemJobStatus {
  name: string
  state: JobState
  lastStartedAt: string | null
  lastFinishedAt: string | null
  lastDurationMs: number | null
  consecutiveFailures: number
  lastErrorName: string | null
}

export interface SystemStatus {
  requestId: string | null
  service: {
    name: string
    version: string
    environment: 'development' | 'production' | 'test'
    startedAt: string
    uptimeSeconds: number
    currentTime: string
    timezone: 'Asia/Shanghai'
    businessDate: string
    trustProxy: number
    jobsEnabled: boolean
  }
  database: {
    status: 'connected' | 'unavailable'
    latencyMs: number | null
  }
  jobs: SystemJobStatus[]
}

export interface OperationalSettings {
  reservation: {
    advanceDays: number
    dailyLimit: number
    createPerMinute: number
    cancelPerMinute: number
  }
  feedback: {
    createPerMinute: number
    createPerHour: number
  }
  violation: {
    threshold: number
    restrictionDays: number
  }
}
