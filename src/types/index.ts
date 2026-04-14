/** 字段数据类型 */
export type FieldType = 'string' | 'number' | 'date'

/** 字段角色 */
export type FieldRole = 'dimension' | 'metric' | 'unused'

/** 聚合方式 */
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max'

/** 图表类型 */
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area'

/** 数据源字段定义 */
export interface DataField {
  name: string
  type: FieldType
  role: FieldRole
  /** 当 role=metric 时的聚合方式 */
  aggregation?: AggregationType
  /** 标记字段在配置中的用途 */
  usage?: 'x-axis' | 'group' | 'y-axis' | 'value'
  /** 样本值（用于预览） */
  sampleValues: string[]
}

/** 原始数据行 */
export type DataRow = Record<string, string | number | null>

/** 数据源 */
export interface DataSource {
  id: string
  name: string
  fields: DataField[]
  rows: DataRow[]
  rowCount: number
  createdAt: number
}

/** 图表配置 */
export interface ChartConfig {
  id: string
  name: string
  dataSourceId: string
  chartType: ChartType
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
  style: ChartStyleConfig
  createdAt: number
}

/** 维度配置 */
export interface DimensionConfig {
  fieldName: string
  usage: 'x-axis' | 'group'
}

/** 指标配置 */
export interface MetricConfig {
  fieldName: string
  aggregation: AggregationType
}

/** 图表样式配置 */
export interface ChartStyleConfig {
  title: string
  showLegend: boolean
  legendPosition: 'top' | 'bottom' | 'left' | 'right'
  colorScheme: string[]
}

/** 配置模板 */
export interface ConfigTemplate {
  id: string
  name: string
  chartType: ChartType
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
  style: ChartStyleConfig
  createdAt: number
}

/** 图表类型信息 */
export interface ChartTypeInfo {
  type: ChartType
  label: string
  icon: string
  description: string
  minDimensions: number
  maxDimensions: number
  minMetrics: number
  maxMetrics: number
  /** 特殊限制描述 */
  constraint?: string
}

/** 全局应用状态 */
export interface AppState {
  dataSources: DataSource[]
  activeDataSourceId: string | null
  chartConfigs: ChartConfig[]
  activeChartConfigId: string | null
  templates: ConfigTemplate[]
  currentStep: 'upload' | 'configure' | 'chart'
}

/** Toast通知 */
export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}