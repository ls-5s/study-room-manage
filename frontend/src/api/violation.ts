import type {
  AdminViolationQuery,
  AdminViolationRecord,
  MyViolationQuery,
  RevokeResult,
  ViolationPage,
  ViolationRecord,
  ViolationRules,
} from '../types/violation'
import { envelopeData, request } from '../utils/request'

export async function listMyViolations(
  query: MyViolationQuery,
): Promise<ViolationPage<ViolationRecord>> {
  const params: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.status) params.status = query.status
  const response = await request.get('/me/violations', { params })
  return envelopeData(response)
}

export async function listAdminViolations(
  query: AdminViolationQuery,
): Promise<ViolationPage<AdminViolationRecord>> {
  const params: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  for (const key of ['status', 'studentNo', 'roomId', 'dateFrom', 'dateTo'] as const) {
    const value = query[key]
    if (value) params[key] = value
  }
  const response = await request.get('/admin/violations', { params })
  return envelopeData(response)
}

export async function revokeViolation(id: string, reason: string): Promise<RevokeResult> {
  const response = await request.patch(`/admin/violations/${encodeURIComponent(id)}`, {
    status: 'revoked',
    reason,
  })
  return envelopeData(response)
}

export async function getViolationRules(): Promise<ViolationRules> {
  const response = await request.get('/admin/violation-rules')
  return envelopeData(response)
}

export async function updateViolationRules(input: ViolationRules): Promise<ViolationRules> {
  const response = await request.put('/admin/violation-rules', input)
  return envelopeData(response)
}
