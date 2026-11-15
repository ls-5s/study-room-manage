import type { CheckInCodeResult, CheckInPayload, CheckInResult } from '../types/reservation'
import { envelopeData, request } from '../utils/request'

export async function submitCheckIn(id: string, payload: CheckInPayload): Promise<CheckInResult> {
  const response = await request.post(`/reservations/${encodeURIComponent(id)}/check-in`, payload)
  return envelopeData(response)
}

export async function getCheckInCode(roomId: string): Promise<CheckInCodeResult> {
  const response = await request.get('/admin/check-in-codes', {
    params: { roomId },
    headers: { 'Cache-Control': 'no-store' },
  })
  return envelopeData(response)
}

export async function manualCheckIn(id: string, reason: string): Promise<CheckInResult> {
  const response = await request.post(`/admin/reservations/${encodeURIComponent(id)}/check-in`, {
    reason,
  })
  return envelopeData(response)
}
