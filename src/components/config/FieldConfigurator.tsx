import { useMemo, useCallback, useState } from 'react'
import {
  Settings2, Layers, BarChart3, ArrowRight, Hash, Type, Calendar,
  ChevronDown, ChevronUp, GripVertical, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useStore, useToast } from '@/store/app-store'
import { cn } from '@/lib/utils'
import type { DataField, FieldRole, AggregationType, DimensionConfig, MetricConfig } from '@/types'

const typeIcons = {
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

interface FieldConfigState {
  fields: DataField[]
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
}

interface Props {
  onConfigReady: (config: {
    dimensions: DimensionConfig[]
    metrics: MetricConfig[]
  }) => void
}

export function FieldConfigurator({ onConfigReady }: Props) {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const dataSource = useMemo(
    () => state.dataSources.find(ds => ds.id === state.activeDataSourceId),
    [state.dataSources, state.activeDataSourceId]
  )

  const [fieldConfig, setFieldConfig] = useState<FieldConfigState>(() => {
    if (!dataSource) return { fields: [], dimensions: [], metrics: [] }
    return {
      fields: [...dataSource.fields],
      dimensions: [],
      metrics: [],
    }
  })

  const [expandedField, setExpandedField] = useState<string | null>(null)

  const toggleFieldRole = useCallback((fieldName: string, role: FieldRole) => {
    setFieldConfig(prev => {
      const field = prev.fields.find(f => f.name === fieldName)
      if (!field) return prev

      const newFields = prev.fields.map(f => {
        if (f.name !== fieldName) return f
        return { ...f, role: f.role === role ? 'unused' as FieldRole : role }
      })

      const newRole = field.role === role ? 'unused' : role
      let newDimensions = [...prev.dimensions]
      let newMetrics = [...prev.metrics]

      if (newRole === 'dimension') {
        newMetrics = newMetrics.filter(m => m.fieldName !== fieldName)
        if (!newDimensions.find(d => d.fieldName === fieldName)) {
          const hasXAxis = newDimensions.some(d => d.usage === 'x-axis')
          newDimensions.push({
            fieldName,
            usage: hasXAxis ? 'group' : 'x-axis',
          })
        }
      } else if (newRole === 'metric') {
        newDimensions = newDimensions.filter(d => d.fieldName !== fieldName)
        if (!newMetrics.find(m => m.fieldName === fieldName)) {
          newMetrics.push({ fieldName, aggregation: 'sum' })
        }
      } else {
        newDimensions = newDimensions.filter(d => d.fieldName !== fieldName)
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

  const removeField = useCallback((fieldName: string) => {
    setFieldConfig(prev => ({
      fields: prev.fields.map(f => f.name === fieldName ? { ...f, role: 'unused' as FieldRole } : f),
      dimensions: prev.dimensions.filter(d => d.fieldName !== fieldName),
      metrics: prev.metrics.filter(m => m.fieldName !== fieldName),
    }))
  }, [])

  const handleNext = () => {
    if (fieldConfig.dimensions.length === 0) {
      toast.warning('请至少选择一个维度字段')
      return
    }
    if (fieldConfig.metrics.length === 0) {
      toast.warning('请至少选择一个指标字段')
      return
    }
    onConfigReady({
      dimensions: fieldConfig.dimensions,
      metrics: fieldConfig.metrics,
    })
  }

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Field selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            字段配置
          </CardTitle>
          <CardDescription>
            为每个字段指定角色：作为维度（分组/X轴）或指标（数值计算）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fieldConfig.fields.map(field => {
              const Icon = typeIcons[field.type]
              const isExpanded = expandedField === field.name
              const dim = fieldConfig.dimensions.find(d => d.fieldName === field.name)
              const met = fieldConfig.metrics.find(m => m.fieldName === field.name)

              return (
                <div
                  key={field.name}
                  className={cn(
                    'rounded-lg border transition-all duration-200',
                    field.role === 'dimension' && 'border-chart-2/30 bg-chart-2/5',
                    field.role === 'metric' && 'border-primary/30 bg-primary/5',
                    field.role === 'unused' && 'border-border hover:border-border/80',
                  )}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{field.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {field.type === 'number' ? '数值' : field.type === 'date' ? '日期' : '文本'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFieldRole(field.name, 'dimension')}
                        className={cn(
                          'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200',
                          field.role === 'dimension'
                            ? 'field-tag-dimension'
                            : 'bg-transparent text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        维度
                      </button>
                      <button
                        onClick={() => toggleFieldRole(field.name, 'metric')}
                        className={cn(
                          'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200',
                          field.role === 'metric'
                            ? 'field-tag-metric'
                            : 'bg-transparent text-muted-foreground hover:bg-muted/50',
                          field.type === 'string' && field.role !== 'metric' && 'opacity-40'
                        )}
                      >
                        指标
                      </button>
                      {(dim || met) && (
                        <button
                          onClick={() => setExpandedField(isExpanded ? null : field.name)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                      {(dim || met) && (
                        <button
                          onClick={() => removeField(field.name)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded config */}
                  {isExpanded && dim && (
                    <div className="px-4 pb-3 border-t border-border/50 pt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">用途</span>
                        <Select
                          options={usageOptions}
                          value={dim.usage}
                          onChange={(v) => updateDimensionUsage(field.name, v as 'x-axis' | 'group')}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {isExpanded && met && (
                    <div className="px-4 pb-3 border-t border-border/50 pt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">聚合</span>
                        <Select
                          options={aggregationOptions}
                          value={met.aggregation}
                          onChange={(v) => updateMetricAggregation(field.name, v as AggregationType)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Config summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">配置摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">维度</p>
              <div className="flex flex-wrap gap-1.5">
                {fieldConfig.dimensions.length === 0 ? (
                  <span className="text-xs text-muted-foreground/60">未选择维度</span>
                ) : (
                  fieldConfig.dimensions.map(d => (
                    <Badge key={d.fieldName} variant="dimension">
                      {d.fieldName}
                      <span className="ml-1 opacity-60">({d.usage === 'x-axis' ? 'X轴' : '分组'})</span>
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">指标</p>
              <div className="flex flex-wrap gap-1.5">
                {fieldConfig.metrics.length === 0 ? (
                  <span className="text-xs text-muted-foreground/60">未选择指标</span>
                ) : (
                  fieldConfig.metrics.map(m => (
                    <Badge key={m.fieldName} variant="metric">
                      {m.fieldName}
                      <span className="ml-1 opacity-60">({aggregationOptions.find(a => a.value === m.aggregation)?.label})</span>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleNext}
              className="gap-2"
              disabled={fieldConfig.dimensions.length === 0 || fieldConfig.metrics.length === 0}
            >
              选择图表类型
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}