import assert from 'node:assert/strict'
import test from 'node:test'
import { statisticsChartItems, statisticsCoverageMessage } from '../src/utils/statistics.ts'

test('缺失和待结算日期在图表中保留断点，不能伪装成零预约', () => {
  const trend = {
    groupBy: 'day',
    items: [{ key: '2026-11-19', label: '11-19', reservationCount: 0 }],
    coverage: {
      availableDates: ['2026-11-19'],
      missingDates: ['2026-11-17'],
      pendingDates: ['2026-11-18'],
      isComplete: false,
    },
  }
  const items = statisticsChartItems(trend)
  assert.deepEqual(
    items.map((item) => item.key),
    ['2026-11-17', '2026-11-18', '2026-11-19'],
  )
  assert.deepEqual(
    items.map((item) => item.reservationCount ?? null),
    [null, null, 0],
  )
  const message = statisticsCoverageMessage(trend.coverage)
  assert.match(message, /仅统计可用日期：2026-11-19/)
  assert.match(message, /缺失快照：2026-11-17/)
  assert.match(message, /待结算：2026-11-18/)
})
