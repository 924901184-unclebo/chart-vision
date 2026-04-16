import { useState, useMemo, useCallback } from 'react'
import {
  SlidersHorizontal, Hash, Type, Calendar, Plus, X, Trash2,
  Layers, Save, Edit3, Search, ChevronLeft, ChevronRight,
  Check, Ruler, BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore, useToast } from '@/store/app-store'
import { cn } from '@/lib/utils'
import type { FieldPreset, DataField } from '@/types'

const PAGE_SIZE = 8

/** 配置库管理页面 */
export function FieldPresetLibrary() {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const activePreset = useMemo(
    () => state.activeFieldPresetId
      ? state.fieldPresets.find(p => p.id === state.activeFieldPresetId) || null
      : null,
    [state.fieldPresets, state.activeFieldPresetId]
  )

  // 获取当前数据源的全部字段（用于配置库编辑）
  const dataSource = useMemo(
    () => state.dataSources.find(ds => ds.id === state.activeDataSourceId),
    [state.dataSources, state.activeDataSourceId]
  )

  if (!activePreset) {
    return <PresetOverview />
  }

  return (
    <PresetEditor
      preset={activePreset}
      fields={dataSource?.fields || []}
    />
  )
}

/** 配置库总览 — 卡片列表 */
function PresetOverview() {
  const { state, dispatch } = useStore()
  const toast = useToast()

  return (
    <div className="space-y-6 animate-fade-in">
      {state.fieldPresets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent mb-4">
              <SlidersHorizontal className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">暂无配置库</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              配置库用于将维度和指标按业务类别分组管理。在侧边栏点击 "+" 创建新的配置库。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.fieldPresets.map(preset => (
            <Card
              key={preset.id}
              className="group hover:border-primary/30 transition-all duration-200 cursor-pointer"
              onClick={() => dispatch({ type: 'SET_ACTIVE_FIELD_PRESET', payload: preset.id })}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                    {preset.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{preset.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant="dimension">{preset.dimensionFields.length} 维度</Badge>
                      <Badge variant="metric">{preset.metricFields.length} 指标</Badge>
                    </div>
                    {(preset.dimensionFields.length > 0 || preset.metricFields.length > 0) && (
                      <p className="text-[10px] text-muted-foreground mt-2 truncate">
                        {[...preset.dimensionFields, ...preset.metricFields].join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/** 配置库编辑器 — 左右双栏：维度 | 指标 */
function PresetEditor({
  preset,
  fields,
}: {
  preset: FieldPreset
  fields: DataField[]
}) {
  const { dispatch } = useStore()
  const toast = useToast()

  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(preset.description)

  const saveDescription = () => {
    dispatch({
      type: 'UPDATE_FIELD_PRESET',
      payload: { ...preset, description: descDraft },
    })
    setEditingDesc(false)
    toast.success('描述已更新')
  }

  const toggleDimension = useCallback((fieldName: string) => {
    const dimSet = new Set(preset.dimensionFields)
    const newDims = dimSet.has(fieldName)
      ? preset.dimensionFields.filter(f => f !== fieldName)
      : [...preset.dimensionFields, fieldName]
    const newMets = preset.metricFields.filter(f => f !== fieldName)
    dispatch({
      type: 'UPDATE_FIELD_PRESET',
      payload: { ...preset, dimensionFields: newDims, metricFields: newMets },
    })
  }, [preset, dispatch])

  const toggleMetric = useCallback((fieldName: string) => {
    const metSet = new Set(preset.metricFields)
    const newMets = metSet.has(fieldName)
      ? preset.metricFields.filter(f => f !== fieldName)
      : [...preset.metricFields, fieldName]
    const newDims = preset.dimensionFields.filter(f => f !== fieldName)
    dispatch({
      type: 'UPDATE_FIELD_PRESET',
      payload: { ...preset, dimensionFields: newDims, metricFields: newMets },
    })
  }, [preset, dispatch])

  const noDataSource = fields.length === 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Preset info header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>{preset.name}</CardTitle>
              {editingDesc ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="text"
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveDescription()}
                    placeholder="输入配置库描述"
                    autoFocus
                    className="flex-1 h-7 rounded border border-input bg-card px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button size="sm" variant="ghost" onClick={saveDescription} className="h-7 px-2 text-xs">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <CardDescription className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => { setEditingDesc(true); setDescDraft(preset.description) }}>
                  {preset.description || '点击添加描述'}
                  <Edit3 className="h-3 w-3" />
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="dimension">{preset.dimensionFields.length} 维度</Badge>
              <Badge variant="metric">{preset.metricFields.length} 指标</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Field assignment — left/right panels */}
      {noDataSource ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              请先在「数据源」步骤中上传数据，才能为配置库分配字段
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 左侧：维度面板 */}
          <FieldPanel
            type="dimension"
            title="维度字段"
            description="选择用于分组和分类的字段"
            icon={<Ruler className="h-4 w-4" />}
            fields={fields}
            selectedFields={preset.dimensionFields}
            onToggle={toggleDimension}
          />

          {/* 右侧：指标面板 */}
          <FieldPanel
            type="metric"
            title="指标字段"
            description="选择用于数值计算的字段"
            icon={<BarChart3 className="h-4 w-4" />}
            fields={fields}
            selectedFields={preset.metricFields}
            onToggle={toggleMetric}
          />
        </div>
      )}
    </div>
  )
}

/** 通用字段面板 — 含搜索、分页 */
function FieldPanel({
  type,
  title,
  description,
  icon,
  fields,
  selectedFields,
  onToggle,
}: {
  type: 'dimension' | 'metric'
  title: string
  description: string
  icon: React.ReactNode
  fields: DataField[]
  selectedFields: string[]
  onToggle: (fieldName: string) => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const selectedSet = useMemo(() => new Set(selectedFields), [selectedFields])

  const isDim = type === 'dimension'

  // 搜索过滤
  const filteredFields = useMemo(() => {
    if (!search.trim()) return fields
    const q = search.trim().toLowerCase()
    return fields.filter(f => f.name.toLowerCase().includes(q))
  }, [fields, search])

  // 分页
  const totalPages = Math.max(1, Math.ceil(filteredFields.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedFields = useMemo(
    () => filteredFields.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredFields, safePage]
  )

  // 搜索变化时重置页码
  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    setPage(1)
  }, [])

  const typeIcons: Record<string, typeof Hash> = {
    number: Hash,
    string: Type,
    date: Calendar,
  }

  return (
    <Card className={cn(
      'flex flex-col',
      isDim ? 'border-chart-2/15' : 'border-primary/15',
    )}>
      {/* Panel header */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            isDim ? 'bg-chart-2/10 text-chart-2' : 'bg-primary/10 text-primary',
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-xs mt-0">{description}</CardDescription>
          </div>
          <Badge variant={type === 'dimension' ? 'dimension' : 'metric'}>{selectedFields.length} 已选</Badge>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="搜索字段名…"
            className="w-full h-8 rounded-lg border border-input bg-card pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>

      {/* Field list */}
      <CardContent className="flex-1 pt-0 pb-3">
        {pagedFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Search className="h-6 w-6 mb-2 opacity-30" />
            <p className="text-xs">{search ? '无匹配字段' : '暂无字段'}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {pagedFields.map(field => {
              const Icon = typeIcons[field.type] || Type
              const isSelected = selectedSet.has(field.name)

              return (
                <button
                  key={field.name}
                  onClick={() => onToggle(field.name)}
                  className={cn(
                    'group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-all duration-200 text-left',
                    isSelected
                      ? isDim
                        ? 'border-chart-2/30 bg-chart-2/[0.07]'
                        : 'border-primary/30 bg-primary/[0.07]'
                      : 'border-transparent hover:border-border hover:bg-muted/30',
                  )}
                >
                  {/* Check indicator */}
                  <div className={cn(
                    'flex h-5 w-5 items-center justify-center rounded flex-shrink-0 border transition-all duration-200',
                    isSelected
                      ? isDim
                        ? 'bg-chart-2/20 border-chart-2/40 text-chart-2'
                        : 'bg-primary/20 border-primary/40 text-primary'
                      : 'border-border group-hover:border-muted-foreground/40',
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  {/* Field icon */}
                  <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

                  {/* Field name */}
                  <span className={cn(
                    'text-sm font-medium flex-1 min-w-0 truncate',
                    isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                  )}>
                    {field.name}
                  </span>

                  {/* Type badge */}
                  <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                    {field.type === 'number' ? '数值' : field.type === 'date' ? '日期' : '文本'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Pagination footer */}
      {filteredFields.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/50">
          <span className="text-[11px] text-muted-foreground">
            共 {filteredFields.length} 项，第 {safePage}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'flex h-6 min-w-[1.5rem] items-center justify-center rounded text-[11px] font-medium transition-colors',
                  p === safePage
                    ? isDim
                      ? 'bg-chart-2/15 text-chart-2'
                      : 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}