import type {
  AdminRoomListQuery,
  AdminStudyRoomDetail,
  AdminStudyRoomPage,
  RoomInput,
  RoomMutationResult,
  RoomUpdateInput,
  SeatBatchInput,
  SeatBatchResult,
  SeatUpdateInput,
  SlotMutationResult,
  TimeSlotInput,
  TimeSlotUpdateInput,
} from '../types/study-room'
import { envelopeData, request } from '../utils/request'

export async function getAdminStudyRooms(query: AdminRoomListQuery): Promise<AdminStudyRoomPage> {
  const response = await request.get('/admin/study-rooms', {
    params: {
      ...query,
      status: query.status || undefined,
    },
  })
  return envelopeData(response)
}

export async function getAdminStudyRoom(roomId: string): Promise<AdminStudyRoomDetail> {
  const response = await request.get(`/admin/study-rooms/${encodeURIComponent(roomId)}`)
  return envelopeData(response)
}

export async function createStudyRoom(input: RoomInput): Promise<AdminStudyRoomDetail> {
  const response = await request.post('/admin/study-rooms', input)
  return envelopeData(response)
}

export async function updateStudyRoom(
  roomId: string,
  input: RoomUpdateInput,
): Promise<RoomMutationResult> {
  const response = await request.patch(`/admin/study-rooms/${encodeURIComponent(roomId)}`, input)
  return envelopeData(response)
}

export async function createRoomTimeSlot(
  roomId: string,
  input: TimeSlotInput,
): Promise<{ id: string; room: AdminStudyRoomDetail; autoClosed: boolean }> {
  const response = await request.post(
    `/admin/study-rooms/${encodeURIComponent(roomId)}/time-slots`,
    input,
  )
  return envelopeData(response)
}

export async function updateRoomTimeSlot(
  slotId: string,
  input: TimeSlotUpdateInput,
): Promise<SlotMutationResult> {
  const response = await request.patch(`/admin/time-slots/${encodeURIComponent(slotId)}`, input)
  return envelopeData(response)
}

export async function createSeatBatch(
  roomId: string,
  input: SeatBatchInput,
): Promise<SeatBatchResult> {
  const response = await request.post(
    `/admin/study-rooms/${encodeURIComponent(roomId)}/seats`,
    input,
  )
  return envelopeData(response)
}

export async function updateSeat(
  seatId: string,
  input: SeatUpdateInput,
): Promise<SlotMutationResult> {
  const response = await request.patch(`/admin/seats/${encodeURIComponent(seatId)}`, input)
  return envelopeData(response)
}
