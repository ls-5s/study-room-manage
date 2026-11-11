import type { AxiosRequestConfig } from 'axios'
import type {
  AdminFeedbackDetail,
  AdminFeedbackListQuery,
  AdminFeedbackPage,
  CreateFeedbackInput,
  CreateFeedbackResult,
  FeedbackListQuery,
  FeedbackPage,
  FeedbackStatus,
  FeedbackSummary,
  StudentFeedbackDetail,
} from '../types/feedback'
import { envelopeData, request } from '../utils/request'

function listParams(query: FeedbackListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.status) params.status = query.status
  if (query.type) params.type = query.type
  return params
}

export async function createFeedback(input: CreateFeedbackInput): Promise<CreateFeedbackResult> {
  const response = await request.post('/feedback-tickets', input)
  return envelopeData(response)
}

export async function listMyFeedback(
  query: FeedbackListQuery,
  signal?: AbortSignal,
): Promise<FeedbackPage<FeedbackSummary>> {
  const config: AxiosRequestConfig = { params: listParams(query) }
  if (signal) config.signal = signal
  const response = await request.get('/me/feedback-tickets', config)
  return envelopeData(response)
}

export async function getMyFeedback(id: string): Promise<StudentFeedbackDetail> {
  const response = await request.get(`/me/feedback-tickets/${encodeURIComponent(id)}`)
  return envelopeData(response)
}

export async function listAdminFeedback(
  query: AdminFeedbackListQuery,
  signal?: AbortSignal,
): Promise<AdminFeedbackPage> {
  const params = listParams(query)
  for (const key of ['roomId', 'dateFrom', 'dateTo', 'studentNo', 'keyword'] as const) {
    const value = query[key]
    if (value) params[key] = value
  }
  const config: AxiosRequestConfig = { params }
  if (signal) config.signal = signal
  const response = await request.get('/admin/feedback-tickets', config)
  return envelopeData(response)
}

export async function getAdminFeedback(id: string): Promise<AdminFeedbackDetail> {
  const response = await request.get(`/admin/feedback-tickets/${encodeURIComponent(id)}`)
  return envelopeData(response)
}

export async function transitionFeedback(
  id: string,
  status: FeedbackStatus,
  result?: string,
): Promise<AdminFeedbackDetail> {
  const response = await request.patch(`/admin/feedback-tickets/${encodeURIComponent(id)}`, {
    status,
    ...(result ? { result } : {}),
  })
  return envelopeData(response)
}
