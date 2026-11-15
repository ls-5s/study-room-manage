import type {
  AdminReservationPage,
  AdminReservationQuery,
  CancelResult,
  CreateReservationInput,
  CreateReservationResult,
  ReservationDetail,
  ReservationListQuery,
  ReservationPage,
} from '../types/reservation'
import { envelopeData, request } from '../utils/request'

export async function createReservation(
  input: CreateReservationInput,
  idempotencyKey: string,
): Promise<CreateReservationResult> {
  const response = await request.post('/reservations', input, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return envelopeData(response)
}

export async function listMyReservations(query: ReservationListQuery): Promise<ReservationPage> {
  const params: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.status) params.status = query.status
  if (query.dateFrom) params.dateFrom = query.dateFrom
  if (query.dateTo) params.dateTo = query.dateTo
  const response = await request.get('/me/reservations', { params })
  return envelopeData(response)
}

export async function getReservation(id: string): Promise<ReservationDetail> {
  const response = await request.get(`/reservations/${encodeURIComponent(id)}`)
  return envelopeData(response)
}

export async function cancelReservation(id: string, reason?: string): Promise<CancelResult> {
  const response = await request.post(`/reservations/${encodeURIComponent(id)}/cancel`, {
    reason: reason ?? '',
  })
  return envelopeData(response)
}

export async function listAdminReservations(
  query: AdminReservationQuery,
): Promise<AdminReservationPage> {
  const params: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  for (const key of ['status', 'dateFrom', 'dateTo', 'roomId', 'seatNo', 'studentNo', 'keyword'] as const) {
    const value = query[key]
    if (value) params[key] = value
  }
  const response = await request.get('/admin/reservations', { params })
  return envelopeData(response)
}
