import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import {
  Layers, Hash, Type, Calendar,
  ChevronDown, ChevronUp, X, SlidersHorizontal,
  Search, Check, Ruler, BarChart3, TrendingUp, PieChart,
  ScatterChart, AreaChart, Trash2, Play, Eye, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useStore, useToast } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { aggregateData, getScatterData, getPieData } from '@/lib/data-aggregator'
import { CHART_TYPES, isChartTypeAvailable, DEFAULT_CHART_COLORS } from '@/lib/chart-config'
import { generateId } from '@/lib/csv-parser'
import type {
  DataField, FieldRole, AggregationType, DimensionConfig, MetricConfig,
  ChartType, ChartStyleConfig, ConfigTemplate, DataRow,
} from '@/types'

const typeIcons: Record<string, typeof Hash> = {
  string: Type,
  number: Hash,
  date: Calendar,
}

const aggregationOptions = [
  { value: 'sum', label: '求和' },
  { value: 'avg', label: '平均值' },
  { value: 'count', label: '计数' },
  { value: 'min', label: '最小值' },
  { value: 'max', label: '最大值' },
]

const usageOptions = [
  { value: 'x-axis', label: 'X轴' },
  { value: 'group', label: '分组' },
]

const chartTypeIcons: Record<ChartType, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3,
  line: TrendingUp,
  pie: PieChart,
  scatter: ScatterChart,
  area: AreaChart,
}

const chartTypeLabels: Record<ChartType, string> = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图',
  scatter: '散点图',
  area: '面积图',
}

interface FieldConfigState {
  fields: DataField[]
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
}

interface Props {
  onConfigChange: (dims: DimensionConfig[], metrics: MetricConfig[]) => void
  selectedChartType: ChartType | null
  onChartTypeChange: (type: ChartType) => void
  chartStyle: ChartStyleConfig
  onApplyTemplate: (template: ConfigTemplate) => void
  onGenerate: () => void
}

export function FieldConfigurator({
  onConfigChange,
  selectedChartType,
  onChartTypeChange,
  chartStyle,
  onApplyTemplate,
  onGenerate,
}: Props) {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const dataSource = useMemo(
    () => state.dataSources.find(ds => ds.id === state.activeDataSourceId),
    [state.dataSources, state.activeDataSourceId]
  )

  // 配置库选择
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')

  const selectedPreset = useMemo(
    () => selectedPresetId ? state.fieldPresets.find(p => p.id === selectedPresetId) || null : null,
    [state.fieldPresets, selectedPresetId]
  )

  // 过滤字段
  const visibleFields = useMemo(() => {
    if (!dataSource) return []
    if (!selectedPreset) return dataSource.fields
    const allowedFields = new Set([
      ...selectedPreset.dimensionFields,
      ...selectedPreset.metricFields,
    ])
    return dataSource.fields.filter(f => allowedFields.has(f.name))
  }, [dataSource, selectedPreset])

  const [fieldConfig, setFieldConfig] = useState<FieldConfigState>(() => {
    if (!dataSource) return { fields: [], dimensions: [], metrics: [] }
    return {
      fields: [...dataSource.fields],
      dimensions: [],
      metrics: [],
    }
  })

  // 模板保存状态
  const [saving, setSaving] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // 同步配置变化到父组件
  const prevDimsRef = useRef<DimensionConfig[]>([])
  const prevMetsRef = useRef<MetricConfig[]>([])

  useEffect(() => {
    const dimsChanged = JSON.stringify(fieldConfig.dimensions) !== JSON.stringify(prevDimsRef.current)
    const metsChanged = JSON.stringify(fieldConfig.metrics) !== JSON.stringify(prevMetsRef.current)
    if (dimsChanged || metsChanged) {
      prevDimsRef.current = fieldConfig.dimensions
      prevMetsRef.current = fieldConfig.metrics
      onConfigChange(fieldConfig.dimensions, fieldConfig.metrics)
    }
  }, [fieldConfig.dimensions, fieldConfig.metrics, onConfigChange])

  // 配置库切换
  const handlePresetChange = useCallback((presetId: string) => {
    setSelectedPresetId(presetId)

    if (!dataSource) return
    const preset = state.fieldPresets.find(p => p.id === presetId)

    if (!preset) {
      setFieldConfig({
        fields: dataSource.fields.map(f => ({ ...f, role: 'unused' as FieldRole })),
        dimensions: [],
        metrics: [],
      })
      return
    }

    const dimSet = new Set(preset.dimensionFields)
    const metSet = new Set(preset.metricFields)

    const newFields = dataSource.fields.map(f => ({
      ...f,
      role: dimSet.has(f.name) ? 'dimension' as FieldRole :
            metSet.has(f.name) ? 'metric' as FieldRole :
            'unused' as FieldRole,
    }))

    let hasXAxis = false
    const newDims: DimensionConfig[] = preset.dimensionFields
      .filter(name => dataSource.fields.some(f => f.name === name))
      .map(name => {
        const usage = hasXAxis ? 'group' as const : 'x-axis' as const
        hasXAxis = true
        return { fieldName: name, usage }
      })

    const newMets: MetricConfig[] = preset.metricFields
      .filter(name => dataSource.fields.some(f => f.name === name))
      .map(name => ({ fieldName: name, aggregation: 'sum' as AggregationType }))

    setFieldConfig({ fields: newFields, dimensions: newDims, metrics: newMets })
    toast.info(`已加载配置库「${preset.name}」的字段`)
  }, [dataSource, state.fieldPresets, toast])

  // ─── 维度操作 ───
  const toggleDimension = useCallback((fieldName: string) => {
    setFieldConfig(prev => {
      const configField = prev.fields.find(f => f.name === fieldName)
      if (!configField) return prev

      const wasDim = configField.role === 'dimension'
      const newRole: FieldRole = wasDim ? 'unused' : 'dimension'

      const newFields = prev.fields.map(f =>
        f.name === fieldName ? { ...f, role: newRole } : f
      )

      let newDimensions = [...prev.dimensions]
      let newMetrics = [...prev.metrics]

      if (newRole === 'dimension') {
        newMetrics = newMetrics.filter(m => m.fieldName !== fieldName)
        if (!newDimensions.find(d => d.fieldName === fieldName)) {
          const hasXAxis = newDimensions.some(d => d.usage === 'x-axis')
          newDimensions.push({ fieldName, usage: hasXAxis ? 'group' : 'x-axis' })
        }
      } else {
        newDimensions = newDimensions.filter(d => d.fieldName !== fieldName)
      }

      return { fields: newFields, dimensions: newDimensions, metrics: newMetrics }
    })
  }, [])

  // ─── 指标操作 ───
  const toggleMetric = useCallback((fieldName: string) => {
    setFieldConfig(prev => {
      const configField = prev.fields.find(f => f.name === fieldName)
      if (!configField) return prev

      const wasMet = configField.role === 'metric'
      const newRole: FieldRole = wasMet ? 'unused' : 'metric'

      const newFields = prev.fields.map(f =>
        f.name === fieldName ? { ...f, role: newRole } : f
      )

      let newDimensions = [...prev.dimensions]
      let newMetrics = [...prev.metrics]

      if (newRole === 'metric') {
        newDimensions = newDimensions.filter(d => d.fieldName !== fieldName)
        if (!newMetrics.find(m => m.fieldName === fieldName)) {
          newMetrics.push({ fieldName, aggregation: 'sum' })
        }
      } else {
        newMetrics = newMetrics.filter(m => m.fieldName !== fieldName)
      }

      return { fields: newFields, dimensions: newDimensions, metrics: newMetrics }
    })
  }, [])

  const updateDimensionUsage = useCallback((fieldName: string, usage: 'x-axis' | 'group') => {
    setFieldConfig(prev => ({
      ...prev,
      dimensions: prev.dimensions.map(d =>
        d.fieldName === fieldName ? { ...d, usage } : d
      ),
    }))
  }, [])

  const updateMetricAggregation = useCallback((fieldName: string, aggregation: AggregationType) => {
    setFieldConfig(prev => ({
      ...prev,
      metrics: prev.metrics.map(m =>
        m.fieldName === fieldName ? { ...m, aggregation } : m
      ),
    }))
  }, [])

  // 可用图表类型
  const availableChartTypes = useMemo(() => {
    return CHART_TYPES.filter(ct =>
      isChartTypeAvailable(ct, fieldConfig.dimensions.length, fieldConfig.metrics.length)
    )
  }, [fieldConfig.dimensions.length, fieldConfig.metrics.length])

  // 自动选择合适的图表类型
  useEffect(() => {
    if (fieldConfig.dimensions.length > 0 && fieldConfig.metrics.length > 0) {
      if (!selectedChartType || !availableChartTypes.find(ct => ct.type === selectedChartType)) {
        if (availableChartTypes.length > 0) {
          onChartTypeChange(availableChartTypes[0].type)
        }
      }
    }
  }, [availableChartTypes, selectedChartType, onChartTypeChange, fieldConfig.dimensions.length, fieldConfig.metrics.length])

  // 模板应用（内部处理字段状态 + 外部回调）
  const handleApplyTemplateInternal = useCallback((template: ConfigTemplate) => {
    if (dataSource) {
      const dimSet = new Set(template.dimensions.map(d => d.fieldName))
      const metSet = new Set(template.metrics.map(m => m.fieldName))
      const newFields = dataSource.fields.map(f => ({
        ...f,
        role: dimSet.has(f.name) ? 'dimension' as FieldRole :
              metSet.has(f.name) ? 'metric' as FieldRole :
              'unused' as FieldRole,
      }))
      setFieldConfig({
        fields: newFields,
        dimensions: template.dimensions,
        metrics: template.metrics,
      })
    }
    onApplyTemplate(template)
    toast.info(`已应用模板「${template.name}」`)
  }, [dataSource, onApplyTemplate, toast])

  // 模板保存
  const handleSaveTemplate = useCallback(() => {
    if (!selectedChartType) {
      toast.warning('请先选择图表类型')
      return
    }
    if (!templateName.trim()) {
      toast.warning('请输入模板名称')
      return
    }

    const template: ConfigTemplate = {
      id: generateId(),
      name: templateName.trim(),
      chartType: selectedChartType,
      dimensions: fieldConfig.dimensions,
      metrics: fieldConfig.metrics,
      style: chartStyle,
      createdAt: Date.now(),
    }

    dispatch({ type: 'ADD_TEMPLATE', payload: template })
    toast.success(`模板「${template.name}」已保存`)
    setTemplateName('')
    setSaving(false)
  }, [selectedChartType, templateName, fieldConfig, chartStyle, dispatch, toast])

  // 生成图表
  const handleGenerate = useCallback(() => {
    if (fieldConfig.dimensions.length === 0) {
      toast.warning('请至少选择一个维度字段')
      return
    }
    if (fieldConfig.metrics.length === 0) {
      toast.warning('请至少选择一个指标字段')
      return
    }
    if (!selectedChartType) {
      toast.warning('请选择图表类型')
      return
    }
    onGenerate()
  }, [fieldConfig, selectedChartType, toast, onGenerate])

  // 空状态
  if (!dataSource) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Layers className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">请先上传或选择数据源</p>
        </CardContent>
      </Card>
    )
  }

  // 配置库选项
  const presetOptions = [
    { value: '', label: '全部字段' },
    ...state.fieldPresets.map(p => ({
      value: p.id,
      label: `${p.name}（${p.dimensionFields.length + p.metricFields.length} 字段）`,
    })),
  ]

  const hasConfig = fieldConfig.dimensions.length > 0 && fieldConfig.metrics.length > 0

  return (
    <div className="flex-1 flex flex-col space-y-5 animate-fade-in">
      {/* 配置库选择条 */}
      {state.fieldPresets.length > 0 && (
        <Card className="border-primary/15 bg-primary/[0.03]">
          <CardContent className="py-3.5 px-5">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">配置库</span>
              <Select
                options={presetOptions}
                value={selectedPresetId}
                onChange={handlePresetChange}
                className="flex-1 h-9 text-sm"
              />
              {selectedPreset && (
                <Badge variant="default" className="whitespace-nowrap">
                  {selectedPreset.dimensionFields.length} 维度 · {selectedPreset.metricFields.length} 指标
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 三栏布局 */}
      {visibleFields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
            <SlidersHorizontal className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">当前配置库中没有匹配的字段</p>
            <p className="text-xs mt-1">请先在配置库管理页面中分配字段</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* 第一栏：维度字段 */}
          <ConfigFieldPanel
            type="dimension"
            title="维度字段"
            description="选择分组/X轴字段"
            icon={<Ruler className="h-4 w-4" />}
            fields={visibleFields}
            fieldConfig={fieldConfig}
            onToggle={toggleDimension}
            onUpdateUsage={updateDimensionUsage}
          />

          {/* 第二栏：指标字段 */}
          <ConfigFieldPanel
            type="metric"
            title="指标字段"
            description="选择数值计算字段"
            icon={<BarChart3 className="h-4 w-4" />}
            fields={visibleFields}
            fieldConfig={fieldConfig}
            onToggle={toggleMetric}
            onUpdateAggregation={updateMetricAggregation}
          />

          {/* 第三栏：摘要 + 图表类型 + 实时预览 + 模板 */}
          <div className="space-y-3">
            {/* 配置摘要（简化） */}
            <Card className="border-primary/10">
              <CardContent className="py-3.5 px-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">配置摘要</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground/60 mb-0.5 block">维度 ({fieldConfig.dimensions.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {fieldConfig.dimensions.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground/30 italic">未选择</span>
                      ) : (
                        fieldConfig.dimensions.map(d => (
                          <Badge key={d.fieldName} variant="dimension" className="text-[10px] py-0 px-1.5 h-5">
                            {d.fieldName}
                            <span className="ml-0.5 opacity-50">
                              {d.usage === 'x-axis' ? 'X' : 'G'}
                            </span>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/60 mb-0.5 block">指标 ({fieldConfig.metrics.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {fieldConfig.metrics.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground/30 italic">未选择</span>
                      ) : (
                        fieldConfig.metrics.map(m => (
                          <Badge key={m.fieldName} variant="metric" className="text-[10px] py-0 px-1.5 h-5">
                            {m.fieldName}
                            <span className="ml-0.5 opacity-50">
                              {aggregationOptions.find(a => a.value === m.aggregation)?.label?.[0]}
                            </span>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 图表类型选择（紧凑） */}
            <Card className="border-primary/10">
              <CardContent className="py-3.5 px-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">图表类型</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CHART_TYPES.map(ct => {
                    const Icon = chartTypeIcons[ct.type]
                    const isAvailable = isChartTypeAvailable(ct, fieldConfig.dimensions.length, fieldConfig.metrics.length)
                    const isSelected = selectedChartType === ct.type
                    return (
                      <button
                        key={ct.type}
                        onClick={() => isAvailable && onChartTypeChange(ct.type)}
                        disabled={!isAvailable}
                        title={ct.label}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-all duration-200',
                          isAvailable
                            ? isSelected
                              ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                              : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                            : 'border-border/30 text-muted-foreground/25 cursor-not-allowed',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{chartTypeLabels[ct.type]}</span>
                        {isSelected && <Check className="h-3 w-3 ml-auto flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 实时图表预览 */}
            <Card className="border-primary/10">
              <CardContent className="py-3.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">实时预览</p>
                  {hasConfig && selectedChartType && (
                    <Button
                      size="sm"
                      variant="premium"
                      className="h-6 text-[10px] gap-1 px-2"
                      onClick={handleGenerate}
                    >
                      生成图表
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <ChartPreview
                  rows={dataSource.rows}
                  dimensions={fieldConfig.dimensions}
                  metrics={fieldConfig.metrics}
                  chartType={selectedChartType}
                  style={chartStyle}
                />
              </CardContent>
            </Card>

            {/* 配置模板（简化） */}
            <Card className="border-primary/10">
              <CardContent className="py-3.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">配置模板</p>
                  {hasConfig && selectedChartType && (
                    <button
                      onClick={() => setSaving(!saving)}
                      className="text-[10px] text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      {saving ? '取消' : '+ 保存'}
                    </button>
                  )}
                </div>

                {/* 保存表单 */}
                {saving && (
                  <div className="flex gap-1.5 mb-2.5">
                    <input
                      type="text"
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      placeholder="输入模板名称…"
                      className="flex h-7 flex-1 rounded-md border border-input bg-card px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                      autoFocus
                    />
                    <Button size="sm" className="h-7 text-[10px] px-2.5" onClick={handleSaveTemplate}>
                      保存
                    </Button>
                  </div>
                )}

                {/* 模板列表 */}
                {state.templates.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/40 py-3 text-center">暂无保存的模板</p>
                ) : (
                  <div className="space-y-1">
                    {state.templates.map(t => (
                      <div
                        key={t.id}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border/50 hover:border-primary/20 transition-colors group"
                      >
                        <span className="text-[11px] text-foreground flex-1 truncate">{t.name}</span>
                        <Badge variant="default" className="text-[9px] py-0 px-1 h-4 flex-shrink-0">
                          {chartTypeLabels[t.chartType]}
                        </Badge>
                        <button
                          onClick={() => handleApplyTemplateInternal(t)}
                          className="text-primary hover:text-primary/80 transition-colors opacity-0 group-hover:opacity-100"
                          title="应用"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            dispatch({ type: 'REMOVE_TEMPLATE', payload: t.id })
                            toast.info('模板已删除')
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          title="删除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

/** ─── 实时图表预览组件 ─── */
function ChartPreview({
  rows,
  dimensions,
  metrics,
  chartType,
  style,
}: {
  rows: DataRow[]
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
  chartType: ChartType | null
  style: ChartStyleConfig
}) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const hasData = dimensions.length > 0 && metrics.length > 0 && chartType

  const option = useMemo(() => {
    if (!hasData || !chartType) return null
    return buildPreviewOption(rows, chartType, dimensions, metrics, style)
  }, [rows, chartType, dimensions, metrics, style, hasData])

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }

    if (option) {
      chartInstance.current.setOption(option, true)
    } else {
      chartInstance.current.clear()
    }
  }, [option])

  // Resize observer
  useEffect(() => {
    if (!chartRef.current) return
    const el = chartRef.current
    const ro = new ResizeObserver(() => chartInstance.current?.resize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
        <Eye className="h-10 w-10 mb-2" />
        <p className="text-xs">选择维度和指标后</p>
        <p className="text-xs">自动显示预览</p>
      </div>
    )
  }

  return (
    <div
      ref={chartRef}
      className="w-full rounded-lg"
      style={{ height: '280px' }}
    />
  )
}

/** ─── 构建预览图表配置 ─── */
function buildPreviewOption(
  rows: DataRow[],
  chartType: ChartType,
  dimensions: DimensionConfig[],
  metrics: MetricConfig[],
  style: ChartStyleConfig
): echarts.EChartsOption {
  const colors = style.colorScheme.length > 0 ? style.colorScheme : DEFAULT_CHART_COLORS

  const baseOption: echarts.EChartsOption = {
    color: colors,
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'rgba(255,255,255,0.7)',
    },
    tooltip: {
      trigger: chartType === 'scatter' ? 'item' : 'axis',
      backgroundColor: 'rgba(15, 15, 30, 0.95)',
      borderColor: 'rgba(100, 100, 180, 0.2)',
      borderWidth: 1,
      textStyle: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
      confine: true,
    },
    legend: {
      show: true,
      top: 2,
      textStyle: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 6,
      itemGap: 8,
    },
    grid: {
      top: 32,
      right: 10,
      bottom: 20,
      left: 6,
      containLabel: true,
    },
    animationDuration: 400,
    animationEasing: 'cubicOut',
  }

  // 饼图
  if (chartType === 'pie') {
    const dim = dimensions[0]
    const metric = metrics[0]
    const pieData = getPieData(rows, dim.fieldName, metric)
    return {
      ...baseOption,
      grid: undefined,
      legend: { ...(baseOption.legend as object), top: 2, left: 'center' },
      series: [{
        type: 'pie',
        radius: ['32%', '62%'],
        center: ['50%', '56%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: 'hsl(230, 25%, 5%)', borderWidth: 2 },
        label: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(100, 100, 255, 0.2)' },
        },
        data: pieData,
      }],
    }
  }

  // 散点图
  if (chartType === 'scatter') {
    const xMetric = metrics[0].fieldName
    const yMetric = metrics[1]?.fieldName || metrics[0].fieldName
    const groupField = dimensions[0]?.fieldName
    const scatterData = getScatterData(rows, xMetric, yMetric, groupField)
    return {
      ...baseOption,
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
      },
      series: scatterData.map(s => ({
        type: 'scatter' as const,
        name: s.name,
        data: s.data,
        symbolSize: 8,
        itemStyle: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
      })),
    }
  }

  // 柱状图 / 折线图 / 面积图
  const aggregated = aggregateData(rows, dimensions, metrics)
  const seriesType = chartType === 'area' ? 'line' : chartType

  return {
    ...baseOption,
    xAxis: {
      type: 'category',
      data: aggregated.categories,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 9,
        rotate: aggregated.categories.length > 5 ? 30 : 0,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 9,
        formatter: (v: number) => {
          if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1) + '万'
          return v.toString()
        },
      },
    },
    series: aggregated.series.map((s) => ({
      type: seriesType as 'bar' | 'line',
      name: s.name,
      data: s.data,
      ...(chartType === 'bar' && {
        barMaxWidth: 24,
        barGap: '15%',
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      }),
      ...(chartType === 'line' && {
        smooth: true,
        symbolSize: 4,
        lineStyle: { width: 2 },
      }),
      ...(chartType === 'area' && {
        smooth: true,
        symbolSize: 3,
        lineStyle: { width: 1.5 },
        areaStyle: { opacity: 0.15 },
      }),
    })),
  }
}

/** ─── 字段配置面板 — 带搜索、选择、详细配置 ─── */
function ConfigFieldPanel({
  type,
  title,
  description,
  icon,
  fields,
  fieldConfig,
  onToggle,
  onUpdateUsage,
  onUpdateAggregation,
}: {
  type: 'dimension' | 'metric'
  title: string
  description: string
  icon: React.ReactNode
  fields: DataField[]
  fieldConfig: FieldConfigState
  onToggle: (fieldName: string) => void
  onUpdateUsage?: (fieldName: string, usage: 'x-axis' | 'group') => void
  onUpdateAggregation?: (fieldName: string, aggregation: AggregationType) => void
}) {
  const [search, setSearch] = useState('')
  const [expandedField, setExpandedField] = useState<string | null>(null)

  const isDim = type === 'dimension'

  // 搜索过滤
  const filteredFields = useMemo(() => {
    if (!search.trim()) return fields
    const q = search.trim().toLowerCase()
    return fields.filter(f => f.name.toLowerCase().includes(q))
  }, [fields, search])

  const handleSearch = useCallback((val: string) => {
    setSearch(val)
  }, [])

  // 已选数量
  const selectedCount = isDim ? fieldConfig.dimensions.length : fieldConfig.metrics.length

  return (
    <Card className={cn(
      'flex flex-col',
      isDim ? 'border-chart-2/15' : 'border-primary/15',
    )}>
      {/* 面板头 */}
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            isDim ? 'bg-chart-2/10 text-chart-2' : 'bg-primary/10 text-primary',
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-[10px] mt-0">{description}</CardDescription>
          </div>
          <Badge variant={isDim ? 'dimension' : 'metric'} className="text-[10px]">
            {selectedCount} 已选
          </Badge>
        </div>

        {/* 搜索 */}
        <div className="relative mt-2.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="搜索字段名…"
            className="w-full h-7 rounded-lg border border-input bg-card pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardHeader>

      {/* 字段列表 */}
      <CardContent className="flex-1 pt-0 pb-3 px-3">
        {filteredFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Search className="h-6 w-6 mb-2 opacity-30" />
            <p className="text-xs">{search ? '无匹配字段' : '暂无字段'}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFields.map(field => {
              const Icon = typeIcons[field.type] || Type
              const configField = fieldConfig.fields.find(f => f.name === field.name)
              const isSelected = isDim
                ? configField?.role === 'dimension'
                : configField?.role === 'metric'
              const dim = fieldConfig.dimensions.find(d => d.fieldName === field.name)
              const met = fieldConfig.metrics.find(m => m.fieldName === field.name)
              const isExpanded = expandedField === field.name && isSelected

              return (
                <div key={field.name}>
                  <button
                    onClick={() => onToggle(field.name)}
                    className={cn(
                      'group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-200 text-left',
                      isSelected
                        ? isDim
                          ? 'border-chart-2/30 bg-chart-2/[0.07]'
                          : 'border-primary/30 bg-primary/[0.07]'
                        : 'border-transparent hover:border-border hover:bg-muted/30',
                    )}
                  >
                    {/* 选中指示器 */}
                    <div className={cn(
                      'flex h-4.5 w-4.5 items-center justify-center rounded flex-shrink-0 border transition-all duration-200',
                      isSelected
                        ? isDim
                          ? 'bg-chart-2/20 border-chart-2/40 text-chart-2'
                          : 'bg-primary/20 border-primary/40 text-primary'
                        : 'border-border group-hover:border-muted-foreground/40',
                    )}
                    style={{ width: '18px', height: '18px' }}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>

                    {/* 字段图标 */}
                    <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />

                    {/* 字段名 */}
                    <span className={cn(
                      'text-xs font-medium flex-1 min-w-0 truncate',
                      isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                    )}>
                      {field.name}
                    </span>

                    {/* 类型标签 */}
                    <span className="text-[9px] text-muted-foreground/60 flex-shrink-0">
                      {field.type === 'number' ? '数值' : field.type === 'date' ? '日期' : '文本'}
                    </span>

                    {/* 展开按钮 */}
                    {isSelected && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedField(isExpanded ? null : field.name)
                        }}
                        className="p-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      >
                        {isExpanded
                          ? <ChevronUp className="h-3 w-3" />
                          : <ChevronDown className="h-3 w-3" />
                        }
                      </div>
                    )}
                  </button>

                  {/* 展开配置行 */}
                  {isExpanded && isDim && dim && onUpdateUsage && (
                    <div className="ml-7 mr-2 mt-0.5 mb-0.5 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-chart-2/[0.04] border border-chart-2/10">
                      <span className="text-[10px] text-muted-foreground w-8 flex-shrink-0">用途</span>
                      <Select
                        options={usageOptions}
                        value={dim.usage}
                        onChange={(v) => onUpdateUsage(field.name, v as 'x-axis' | 'group')}
                        className="h-6 text-[10px] flex-1"
                      />
                    </div>
                  )}
                  {isExpanded && !isDim && met && onUpdateAggregation && (
                    <div className="ml-7 mr-2 mt-0.5 mb-0.5 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-primary/[0.04] border border-primary/10">
                      <span className="text-[10px] text-muted-foreground w-8 flex-shrink-0">聚合</span>
                      <Select
                        options={aggregationOptions}
                        value={met.aggregation}
                        onChange={(v) => onUpdateAggregation(field.name, v as AggregationType)}
                        className="h-6 text-[10px] flex-1"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
