import type { DataRow, DimensionConfig, MetricConfig, AggregationType } from '@/types'

interface AggregatedData {
  categories: string[]
  series: {
    name: string
    data: number[]
  }[]
}

/** 聚合单列值 */
function aggregateValues(values: (number | null)[], method: AggregationType): number {
  const validValues = values.filter((v): v is number => v !== null)
  if (validValues.length === 0) return 0

  switch (method) {
    case 'sum':
      return validValues.reduce((a, b) => a + b, 0)
    case 'avg':
      return validValues.reduce((a, b) => a + b, 0) / validValues.length
    case 'count':
      return validValues.length
    case 'min':
      return Math.min(...validValues)
    case 'max':
      return Math.max(...validValues)
    default:
      return validValues.reduce((a, b) => a + b, 0)
  }
}

/** 按维度分组并聚合数据 */
export function aggregateData(
  rows: DataRow[],
  dimensions: DimensionConfig[],
  metrics: MetricConfig[]
): AggregatedData {
  if (dimensions.length === 0 || metrics.length === 0) {
    return { categories: [], series: [] }
  }

  const xAxisDim = dimensions.find(d => d.usage === 'x-axis')
  const groupDim = dimensions.find(d => d.usage === 'group')

  if (!xAxisDim) {
    // 如果没有X轴维度，使用第一个维度
    return aggregateWithSingleDimension(rows, dimensions[0].fieldName, metrics)
  }

  if (groupDim) {
    return aggregateWithGrouping(rows, xAxisDim.fieldName, groupDim.fieldName, metrics)
  }

  return aggregateWithSingleDimension(rows, xAxisDim.fieldName, metrics)
}

/** 单维度聚合 */
function aggregateWithSingleDimension(
  rows: DataRow[],
  dimensionField: string,
  metrics: MetricConfig[]
): AggregatedData {
  // 按维度值分组
  const groups = new Map<string, DataRow[]>()
  rows.forEach(row => {
    const key = String(row[dimensionField] ?? '未知')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  })

  const categories = Array.from(groups.keys())

  const series = metrics.map(metric => ({
    name: metric.fieldName,
    data: categories.map(cat => {
      const groupRows = groups.get(cat) || []
      const values = groupRows.map(r => r[metric.fieldName] as number | null)
      return Math.round(aggregateValues(values, metric.aggregation) * 100) / 100
    }),
  }))

  return { categories, series }
}

/** 双维度聚合（含分组） */
function aggregateWithGrouping(
  rows: DataRow[],
  xField: string,
  groupField: string,
  metrics: MetricConfig[]
): AggregatedData {
  // 获取所有唯一分类和分组值
  const categorySet = new Set<string>()
  const groupSet = new Set<string>()
  rows.forEach(row => {
    categorySet.add(String(row[xField] ?? '未知'))
    groupSet.add(String(row[groupField] ?? '未知'))
  })

  const categories = Array.from(categorySet)
  const groups = Array.from(groupSet)

  // 使用第一个指标进行分组聚合
  const metric = metrics[0]

  const series = groups.map(group => ({
    name: group,
    data: categories.map(cat => {
      const matchingRows = rows.filter(
        r => String(r[xField] ?? '未知') === cat && String(r[groupField] ?? '未知') === group
      )
      const values = matchingRows.map(r => r[metric.fieldName] as number | null)
      return Math.round(aggregateValues(values, metric.aggregation) * 100) / 100
    }),
  }))

  return { categories, series }
}

/** 获取散点图数据 */
export function getScatterData(
  rows: DataRow[],
  xMetric: string,
  yMetric: string,
  groupField?: string
): { name: string; data: [number, number][] }[] {
  if (groupField) {
    const groups = new Map<string, [number, number][]>()
    rows.forEach(row => {
      const group = String(row[groupField] ?? '未知')
      const x = Number(row[xMetric]) || 0
      const y = Number(row[yMetric]) || 0
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group)!.push([x, y])
    })
    return Array.from(groups.entries()).map(([name, data]) => ({ name, data }))
  }

  return [{
    name: `${xMetric} vs ${yMetric}`,
    data: rows.map(row => [
      Number(row[xMetric]) || 0,
      Number(row[yMetric]) || 0,
    ] as [number, number]),
  }]
}

/** 获取饼图数据 */
export function getPieData(
  rows: DataRow[],
  dimension: string,
  metric: MetricConfig
): { name: string; value: number }[] {
  const groups = new Map<string, DataRow[]>()
  rows.forEach(row => {
    const key = String(row[dimension] ?? '未知')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  })

  return Array.from(groups.entries()).map(([name, groupRows]) => {
    const values = groupRows.map(r => r[metric.fieldName] as number | null)
    return {
      name,
      value: Math.round(aggregateValues(values, metric.aggregation) * 100) / 100,
    }
  })
}