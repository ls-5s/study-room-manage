export type StatisticsGroupBy = 'day' | 'room' | 'slot'

export interface StatisticsOverview {
  date: string
  timezone: 'Asia/Shanghai'
  generatedAt: string
  dataStatus: 'live' | 'finalized'
  finalizedAt: string | null
  cards: {
    reservationCount: number
    checkedInCount: number
    noShowCount: number
    utilizationRate: number
  }
  rates: {
    signInRate: number
    noShowRate: number
    outageCancelledCount: number
    settledReservationCount: number
    hasSettledData: boolean
    hasUtilizationData: boolean
  }
}

export interface StatisticsTrendItem {
  key: string
  label: string
  reservationCount: number
  checkedInCount: number
  noShowCount: number
  outageCancelledCount: number
  settledReservationCount: number
  availableSeatMinutes: number
  usedSeatMinutes: number
  signInRate: number
  noShowRate: number
  utilizationRate: number
  hasSettledData: boolean
  hasUtilizationData: boolean
  hasData: boolean
}

export interface StatisticsTrend {
  dateFrom: string
  dateTo: string
  groupBy: StatisticsGroupBy
  timezone: 'Asia/Shanghai'
  generatedAt: string
  items: StatisticsTrendItem[]
}

export interface StatisticsTrendQuery {
  dateFrom?: string | undefined
  dateTo?: string | undefined
  groupBy: StatisticsGroupBy
  roomId?: string | undefined
}

export interface ExportedStatistics {
  blob: Blob
  filename: string
}
