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
  /** 归属的数据库分类 ID */
  databaseCategoryId?: string
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

/** 图表库 — 二级分类 */
export interface LibrarySubCategory {
  id: string
  name: string
}

/** 图表库 — 一级分类 */
export interface LibraryCategory {
  id: string
  name: string
  subCategories: LibrarySubCategory[]
}

/** 图表库 — 保存的图表 */
export interface LibraryChart {
  id: string
  name: string
  /** 一级分类 ID */
  categoryId: string
  /** 二级分类 ID */
  subCategoryId: string
  /** 图表快照配置 */
  chartType: ChartType
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
  style: ChartStyleConfig
  /** 关联的数据源 ID */
  dataSourceId: string
  /** ECharts 图表截图 base64 */
  thumbnail?: string
  createdAt: number
}

/** 配置库 — 保存的字段预设（一组维度+指标的分类集合） */
export interface FieldPreset {
  id: string
  name: string
  description: string
  /** 该配置库包含的维度字段名列表 */
  dimensionFields: string[]
  /** 该配置库包含的指标字段名列表 */
  metricFields: string[]
  createdAt: number
}

/** 数据库 — 数据分类管理 */
export interface DatabaseCategory {
  id: string
  name: string
  description: string
  createdAt: number
}

/** 默认配置库预设 */
export const DEFAULT_FIELD_PRESETS: FieldPreset[] = [
  {
    id: 'preset-business',
    name: '经营',
    description: '与经营业绩相关的维度和指标',
    dimensionFields: ['公司', '部门', '时间'],
    metricFields: ['签约金额', '回款金额'],
    createdAt: Date.now(),
  },
  {
    id: 'preset-content',
    name: '内容',
    description: '与内容产出相关的维度和指标',
    dimensionFields: ['部门', '姓名', '时间'],
    metricFields: ['登版金额'],
    createdAt: Date.now(),
  },
  {
    id: 'preset-finance',
    name: '财务',
    description: '与财务相关的维度和指标',
    dimensionFields: ['公司', '时间'],
    metricFields: ['签约金额', '开票金额', '回款金额'],
    createdAt: Date.now(),
  },
]

/** 默认一级分类 */
export const DEFAULT_LIBRARY_CATEGORIES: LibraryCategory[] = [
  {
    id: 'cat-general',
    name: '综合',
    subCategories: [
      { id: 'sub-leader', name: '领导驾驶舱' },
      { id: 'sub-dept', name: '部门长' },
      { id: 'sub-personal', name: '个人' },
    ],
  },
  {
    id: 'cat-content',
    name: '内容',
    subCategories: [
      { id: 'sub-overview', name: '内容概览' },
      { id: 'sub-detail', name: '内容明细' },
    ],
  },
  {
    id: 'cat-business',
    name: '经营',
    subCategories: [
      { id: 'sub-revenue', name: '营收分析' },
      { id: 'sub-cost', name: '成本分析' },
      { id: 'sub-profit', name: '利润分析' },
    ],
  },
  {
    id: 'cat-efficiency',
    name: '效率',
    subCategories: [
      { id: 'sub-team', name: '团队效率' },
      { id: 'sub-process', name: '流程效率' },
    ],
  },
]

/** 默认数据库分类 */
export const DEFAULT_DATABASE_CATEGORIES: DatabaseCategory[] = [
  {
    id: 'db-business',
    name: '经营数据库',
    description: '存放与经营业绩相关的数据',
    createdAt: Date.now(),
  },
  {
    id: 'db-content',
    name: '内容数据库',
    description: '存放与内容产出相关的数据',
    createdAt: Date.now(),
  },
  {
    id: 'db-finance',
    name: '财务数据库',
    description: '存放与财务相关的数据',
    createdAt: Date.now(),
  },
]

/** ─── 界面设计 ─── */

/** 画布上放置的图表实例 */
export interface CanvasItem {
  id: string
  /** 引用图表库中的图表 ID */
  libraryChartId: string
  /** 画布中的宽度：1=半宽, 2=全宽 */
  width: 1 | 2
  /** 显示标签（来自图表名称） */
  label: string
  /** 排序顺序 */
  order: number
}

/** 全局应用状态 */
export interface AppState {
  dataSources: DataSource[]
  activeDataSourceId: string | null
  chartConfigs: ChartConfig[]
  activeChartConfigId: string | null
  templates: ConfigTemplate[]
  currentStep: 'upload' | 'configure' | 'chart' | 'design' | 'library' | 'fieldPresets' | 'database'
  /** 图表库 — 分类体系 */
  libraryCategories: LibraryCategory[]
  /** 图表库 — 已保存图表 */
  libraryCharts: LibraryChart[]
  /** 图表库 — 当前选中的一级分类 */
  activeLibraryCategoryId: string | null
  /** 图表库 — 当前选中的二级分类 */
  activeLibrarySubCategoryId: string | null
  /** 配置库 — 预设列表 */
  fieldPresets: FieldPreset[]
  /** 图表制作 — 当前选中的配置库 ID（null 表示显示全部字段） */
  activeFieldPresetId: string | null
  /** 数据库 — 分类列表 */
  databaseCategories: DatabaseCategory[]
  /** 数据库 — 当前选中的分类 ID */
  activeDatabaseCategoryId: string | null
  /** 界面设计 — 画布组件列表 */
  designCanvasItems: CanvasItem[]
}

/** Toast通知 */
export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}