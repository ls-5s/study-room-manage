import type { AxiosRequestConfig } from 'axios'
import type {
  ExportedStatistics,
  StatisticsOverview,
  StatisticsTrend,
  StatisticsTrendQuery,
} from '../types/statistics'
import { envelopeData, request } from '../utils/request'

function trendParams(query: StatisticsTrendQuery): Record<string, string> {
  const params: Record<string, string> = { groupBy: query.groupBy }
  if (query.dateFrom) params.dateFrom = query.dateFrom
  if (query.dateTo) params.dateTo = query.dateTo
  if (query.roomId) params.roomId = query.roomId
  return params
}

export async function getStatisticsOverview(
  date: string,
  signal?: AbortSignal,
): Promise<StatisticsOverview> {
  const config: AxiosRequestConfig = { params: { date } }
  if (signal) config.signal = signal
  const response = await request.get('/admin/statistics/overview', config)
  return envelopeData(response)
}

export async function getStatisticsTrend(
  query: StatisticsTrendQuery,
  signal?: AbortSignal,
): Promise<StatisticsTrend> {
  const config: AxiosRequestConfig = { params: trendParams(query) }
  if (signal) config.signal = signal
  const response = await request.get('/admin/statistics/trend', config)
  return envelopeData(response)
}

function downloadFilename(contentDisposition: unknown): string {
  const header = Array.isArray(contentDisposition) ? contentDisposition[0] : contentDisposition
  const match = typeof header === 'string' ? /filename="?([^";]+)"?/i.exec(header) : null
  return match?.[1] ?? 'study-room-report.csv'
}

export async function getStatisticsExport(
  query: StatisticsTrendQuery,
): Promise<ExportedStatistics> {
  const response = await request.get('/admin/statistics/export', {
    params: trendParams(query),
    responseType: 'blob',
    skipEnvelope: true,
  })
  return {
    blob: response.data as Blob,
    filename: downloadFilename(response.headers['content-disposition']),
  }
}
