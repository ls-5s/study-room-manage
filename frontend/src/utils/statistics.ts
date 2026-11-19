import type {
  StatisticsCoverage,
  StatisticsGroupBy,
  StatisticsTrend,
  StatisticsTrendItem,
} from '../types/statistics'

// Keep missing dates on the time axis without plotting them as zero or joining across gaps.
export function statisticsChartItems(
  trend: StatisticsTrend | null,
): Array<Partial<StatisticsTrendItem> & Pick<StatisticsTrendItem, 'key' | 'label'>> {
  if (!trend) return []
  if (trend.groupBy !== 'day') return trend.items
  const byDate = new Map(trend.items.map((item) => [item.key, item]))
  return [
    ...trend.coverage.availableDates,
    ...trend.coverage.missingDates,
    ...trend.coverage.pendingDates,
  ]
    .sort()
    .map((date) => byDate.get(date) ?? { key: date, label: date.slice(5) })
}

export function statisticsCoverageMessage(coverage?: StatisticsCoverage): string {
  if (!coverage) return '统计完整性尚未检查'
  if (coverage.isComplete) return '所选日期数据完整'
  return [
    `仅统计可用日期：${coverage.availableDates.join('、') || '无'}`,
    coverage.missingDates.length ? `缺失快照：${coverage.missingDates.join('、')}` : '',
    coverage.pendingDates.length ? `待结算：${coverage.pendingDates.join('、')}` : '',
  ]
    .filter(Boolean)
    .join('；')
}

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
