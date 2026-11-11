import type { Paginated } from './api'

export type StudyRoomStatus = 'open' | 'closed' | 'disabled'
export type TimeSlotStatus = 'active' | 'inactive'
export type SeatStaticStatus = 'available' | 'maintenance' | 'disabled'
export type SeatMapStatus = SeatStaticStatus | 'reserved'

export interface RoomGrid {
  rows: number
  columns: number
}

export interface TimeSlot {
  id: string
  label: string
  startTime: string
  endTime: string
  status: TimeSlotStatus
  bookableFrom: string
}

export interface Seat {
  id: string
  batchPrefix: string
  seatNo: string
  row: number
  column: number
  status: SeatStaticStatus
  bookableFrom: string
  remark: string | null
}

export interface SeatMapSeat {
  id: string
  seatNo: string
  row: number
  column: number
  status: SeatMapStatus
  disabledReason: string | null
}

export interface StudyRoomSummary {
  id: string
  name: string
  location: string
  description: string | null
  status: StudyRoomStatus
  bookableFrom: string
  grid: RoomGrid
  seatCount: number
  bookableSeatCount: number
  matchedSlot?: TimeSlot
  availableSeatCount?: number
}

export interface StudyRoomDetail extends StudyRoomSummary {
  date: string
  timeSlots: TimeSlot[]
}

export interface AdminStudyRoomDetail {
  id: string
  name: string
  location: string
  description: string | null
  grid: RoomGrid
  status: StudyRoomStatus
  bookableFrom: string
  seatCount: number
  bookableSeatCount: number
  timeSlots: TimeSlot[]
  seats: Seat[]
}

export interface SeatMapResult {
  roomId: string
  date: string
  slot: {
    id: string
    label: string
    startAt: string
    endAt: string
  }
  seats: SeatMapSeat[]
  availableSeatCount: number
}

export interface StudyRoomListQuery {
  keyword?: string
  date?: string
  startTime?: string
  endTime?: string
  page: number
  pageSize: number
}

export interface AdminRoomListQuery {
  keyword?: string
  status?: StudyRoomStatus | ''
  page: number
  pageSize: number
}

export type StudyRoomPage = Paginated<StudyRoomSummary>
export type AdminStudyRoomPage = Paginated<StudyRoomSummary>

export interface RoomInput {
  name: string
  location: string
  description?: string | null
  gridRows: number
  gridColumns: number
}

export interface RoomUpdateInput extends Partial<RoomInput> {
  status?: StudyRoomStatus
}

export interface TimeSlotInput {
  label: string
  startTime: string
  endTime: string
  status?: TimeSlotStatus
}

export type TimeSlotUpdateInput = Partial<TimeSlotInput>

export interface SeatBatchInput {
  prefix: string
  rows: number
  columns: number
  startRow: number
  startColumn: number
  skip: { row: number; column: number }[]
}

export interface SeatBatchResult {
  roomId: string
  count: number
  room: AdminStudyRoomDetail
}

export interface SeatUpdateInput {
  seatNo?: string
  row?: number
  column?: number
  status?: SeatStaticStatus
  remark?: string | null
}

export interface RoomMutationResult extends AdminStudyRoomDetail {
  autoClosed?: boolean
}

export interface SlotMutationResult {
  room: AdminStudyRoomDetail
  autoClosed: boolean
}
