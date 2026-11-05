import type { ApiResponse, HealthData, ReadinessData } from '../types/api'
import { request, RequestError } from '../utils/request'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function checkHealth(signal: AbortSignal): Promise<HealthData> {
  const { data } = await request.get<ApiResponse<unknown>>('/health', { signal })
  if (!isRecord(data.data) || data.data.status !== 'ok') {
    throw new RequestError('invalid-response')
  }
  return { status: 'ok' }
}

export async function checkReadiness(signal: AbortSignal): Promise<ReadinessData> {
  const { data } = await request.get<ApiResponse<unknown>>('/ready', { signal })
  if (!isRecord(data.data) || data.data.status !== 'ready' || data.data.database !== 'connected') {
    throw new RequestError('invalid-response')
  }
  return { status: 'ready', database: 'connected' }
}
