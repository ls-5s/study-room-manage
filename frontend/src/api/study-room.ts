import type { AxiosRequestConfig } from 'axios'
import type {
  SeatMapResult,
  StudyRoomDetail,
  StudyRoomListQuery,
  StudyRoomPage,
} from '../types/study-room'
import { envelopeData, request } from '../utils/request'

export async function getStudyRooms(
  query: StudyRoomListQuery,
  signal?: AbortSignal,
): Promise<StudyRoomPage> {
  const params: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.keyword) params.keyword = query.keyword
  if (query.date) params.date = query.date
  if (query.startTime) params.startTime = query.startTime
  if (query.endTime) params.endTime = query.endTime
  const config: AxiosRequestConfig = { params }
  if (signal) config.signal = signal
  const response = await request.get('/study-rooms', config)
  return envelopeData(response)
}

export async function getStudyRoom(roomId: string, date: string): Promise<StudyRoomDetail> {
  const response = await request.get(`/study-rooms/${encodeURIComponent(roomId)}`, {
    params: { date },
  })
  return envelopeData(response)
}

export async function getSeatMap(
  roomId: string,
  date: string,
  slotId: string,
): Promise<SeatMapResult> {
  const response = await request.get(`/study-rooms/${encodeURIComponent(roomId)}/seats`, {
    params: { date, slotId },
  })
  return envelopeData(response)
}
