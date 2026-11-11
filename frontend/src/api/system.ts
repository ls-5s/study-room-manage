import type { AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '../types/api'
import type { OperationalSettings, PublicSystemConfig, SystemStatus } from '../types/system'
import { envelopeData, request } from '../utils/request'

export async function getPublicSystemConfig(): Promise<PublicSystemConfig> {
  const response = await request.get<ApiResponse<PublicSystemConfig>>('/system/public-config', {
    skipAuth: true,
  })
  return envelopeData(response)
}

export async function getSystemStatus(signal?: AbortSignal) {
  const config: AxiosRequestConfig = {}
  if (signal) config.signal = signal
  const response = await request.get<ApiResponse<SystemStatus>>('/admin/system/status', config)
  return envelopeData(response)
}

export async function getSystemSettings(): Promise<OperationalSettings> {
  const response = await request.get<ApiResponse<OperationalSettings>>('/admin/system/settings')
  return envelopeData(response)
}

export async function updateSystemSettings(
  settings: OperationalSettings,
): Promise<OperationalSettings> {
  const response = await request.put<ApiResponse<OperationalSettings>>(
    '/admin/system/settings',
    settings,
  )
  return envelopeData(response)
}
