import type { StatisticsGroupBy } from '../types/statistics'

export const statisticsGroupOptions: ReadonlyArray<{
  value: StatisticsGroupBy
  label: string
}> = [
  { value: 'day', label: '按日期' },
  { value: 'room', label: '按自习室' },
  { value: 'slot', label: '按时段' },
]

export function statisticsGroupLabel(groupBy: StatisticsGroupBy): string {
  if (groupBy === 'room') return '自习室'
  if (groupBy === 'slot') return '时段'
  return '日期'
}

export function formatRate(rate: number, hasData: boolean): string {
  return hasData ? `${(rate * 100).toFixed(1)}%` : '暂无数据'
}

export function formatMetricRate(rate: number, hasData: boolean): string {
  return hasData ? `${(rate * 100).toFixed(1)}%` : '—'
}

export function statisticsRangeLabel(dateFrom: string, dateTo: string): string {
  return dateFrom === dateTo ? dateFrom : `${dateFrom} 至 ${dateTo}`
}
