import type { ChartTypeInfo } from '@/types'

/** 图表类型注册表 */
export const CHART_TYPES: ChartTypeInfo[] = [
  {
    type: 'bar',
    label: '柱状图',
    icon: 'BarChart3',
    description: '适合比较不同类别的数值大小',
    minDimensions: 1,
    maxDimensions: 2,
    minMetrics: 1,
    maxMetrics: 5,
  },
  {
    type: 'line',
    label: '折线图',
    icon: 'TrendingUp',
    description: '适合展示数据随时间的变化趋势',
    minDimensions: 1,
    maxDimensions: 2,
    minMetrics: 1,
    maxMetrics: 5,
  },
  {
    type: 'pie',
    label: '饼图',
    icon: 'PieChart',
    description: '适合展示各部分占整体的比例',
    minDimensions: 1,
    maxDimensions: 1,
    minMetrics: 1,
    maxMetrics: 1,
    constraint: '仅支持1个维度 + 1个指标',
  },
  {
    type: 'scatter',
    label: '散点图',
    icon: 'ScatterChart',
    description: '适合观察两个数值变量之间的关系',
    minDimensions: 0,
    maxDimensions: 1,
    minMetrics: 2,
    maxMetrics: 2,
    constraint: '需要2个数值指标',
  },
  {
    type: 'area',
    label: '面积图',
    icon: 'AreaChart',
    description: '适合展示累计值和趋势变化',
    minDimensions: 1,
    maxDimensions: 2,
    minMetrics: 1,
    maxMetrics: 5,
  },
]

/** 默认图表颜色方案 */
export const DEFAULT_CHART_COLORS = [
  'hsl(250, 85%, 63%)',   // primary violet
  'hsl(190, 85%, 55%)',   // cyan
  'hsl(152, 60%, 48%)',   // green
  'hsl(38, 92%, 55%)',    // amber
  'hsl(340, 75%, 60%)',   // pink
  'hsl(280, 70%, 60%)',   // purple
  'hsl(210, 80%, 60%)',   // blue
  'hsl(15, 80%, 60%)',    // orange
]

/** 根据维度和指标数量判断图表类型是否可用 */
export function isChartTypeAvailable(
  chartType: ChartTypeInfo,
  dimensionCount: number,
  metricCount: number
): boolean {
  return (
    dimensionCount >= chartType.minDimensions &&
    dimensionCount <= chartType.maxDimensions &&
    metricCount >= chartType.minMetrics &&
    metricCount <= chartType.maxMetrics
  )
}

/** 推荐图表类型 */
export function recommendChartTypes(
  dimensionCount: number,
  metricCount: number
): ChartTypeInfo[] {
  return CHART_TYPES.filter(ct => isChartTypeAvailable(ct, dimensionCount, metricCount))
}