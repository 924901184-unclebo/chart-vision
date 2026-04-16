import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import {
  BarChart3, TrendingUp, PieChart, ScatterChart, AreaChart,
  GripVertical, Trash2, Search, X, Columns, RectangleHorizontal,
  RotateCcw, LayoutDashboard, ChevronDown, FolderOpen,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore, useToast } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { generateId } from '@/lib/csv-parser'
import { aggregateData, getScatterData, getPieData } from '@/lib/data-aggregator'
import { DEFAULT_CHART_COLORS } from '@/lib/chart-config'
import type { LibraryChart, CanvasItem, ChartType } from '@/types'

/* ─── 图表类型标签与图标 ─── */
const chartTypeLabels: Record<ChartType, string> = {
  bar: '柱状图', line: '折线图', pie: '饼图', scatter: '散点图', area: '面积图',
}

const chartTypeIcons: Record<ChartType, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3, line: TrendingUp, pie: PieChart, scatter: ScatterChart, area: AreaChart,
}

/* ═══════════════════════════════════════
   InterfaceDesigner 主组件
═══════════════════════════════════════ */
export function InterfaceDesigner() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const canvasItems = state.designCanvasItems
  const libraryCharts = state.libraryCharts
  const libraryCategories = state.libraryCategories

  // 搜索
  const [search, setSearch] = useState('')
  // 展开的一级分类
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  // 展开的二级分类
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())
  // 拖拽状态
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false)
  const dragCounter = useRef(0)

  // 初始化时展开有图表的分类和子分类
  useEffect(() => {
    const catsWithCharts = new Set(libraryCharts.map(c => c.categoryId))
    const subsWithCharts = new Set(libraryCharts.map(c => c.subCategoryId))
    setExpandedCats(catsWithCharts)
    setExpandedSubs(subsWithCharts)
  }, [libraryCharts])

  // 过滤后的图表
  const filteredCharts = useMemo(() => {
    if (!search.trim()) return libraryCharts
    const q = search.trim().toLowerCase()
    return libraryCharts.filter(c => c.name.toLowerCase().includes(q))
  }, [search, libraryCharts])

  // 按二级子分类分组
  const chartsBySubCategory = useMemo(() => {
    const map = new Map<string, LibraryChart[]>()
    for (const chart of filteredCharts) {
      if (!map.has(chart.subCategoryId)) map.set(chart.subCategoryId, [])
      map.get(chart.subCategoryId)!.push(chart)
    }
    return map
  }, [filteredCharts])

  // 统计每个一级分类下的图表数
  const chartCountByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const chart of filteredCharts) {
      map.set(chart.categoryId, (map.get(chart.categoryId) || 0) + 1)
    }
    return map
  }, [filteredCharts])

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  const toggleSubCategory = (subId: string) => {
    setExpandedSubs(prev => {
      const next = new Set(prev)
      next.has(subId) ? next.delete(subId) : next.add(subId)
      return next
    })
  }

  // 查找图表引用
  const getChartById = useCallback((chartId: string) => {
    return libraryCharts.find(c => c.id === chartId)
  }, [libraryCharts])

  /* ─── 从图表库拖入画布 ─── */
  const handleLibraryDragStart = useCallback((e: React.DragEvent, chart: LibraryChart) => {
    e.dataTransfer.setData('application/library-chart', chart.id)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  /* ─── 画布内拖拽排序 ─── */
  const handleCanvasDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('application/canvas-item', itemId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingItemId(itemId)
  }, [])

  const handleCanvasDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/canvas-item') ? 'move' : 'copy'
    setDragOverIndex(index)
  }, [])

  const handleCanvasDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragOverCanvas(true)
  }, [])

  const handleCanvasDragLeave = useCallback(() => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverIndex(null)
      setIsDragOverCanvas(false)
    }
  }, [])

  const handleCanvasDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setDragOverIndex(null)
    setDraggingItemId(null)
    setIsDragOverCanvas(false)

    // 从图表库拖入
    const chartId = e.dataTransfer.getData('application/library-chart')
    if (chartId) {
      const chart = libraryCharts.find(c => c.id === chartId)
      if (!chart) return

      const newItem: CanvasItem = {
        id: `ci-${generateId()}`,
        libraryChartId: chart.id,
        width: 2,
        label: chart.name,
        order: dropIndex,
      }

      const newItems = [...canvasItems]
      newItems.splice(dropIndex, 0, newItem)
      const reordered = newItems.map((item, i) => ({ ...item, order: i }))
      dispatch({ type: 'REORDER_CANVAS_ITEMS', payload: reordered })
      toast.success(`已添加图表「${chart.name}」`)
      return
    }

    // 画布内排序
    const canvasItemId = e.dataTransfer.getData('application/canvas-item')
    if (canvasItemId) {
      const fromIndex = canvasItems.findIndex(i => i.id === canvasItemId)
      if (fromIndex === -1 || fromIndex === dropIndex) return
      const newItems = [...canvasItems]
      const [moved] = newItems.splice(fromIndex, 1)
      const adjustedIndex = dropIndex > fromIndex ? dropIndex - 1 : dropIndex
      newItems.splice(adjustedIndex, 0, moved)
      const reordered = newItems.map((item, i) => ({ ...item, order: i }))
      dispatch({ type: 'REORDER_CANVAS_ITEMS', payload: reordered })
    }
  }, [canvasItems, libraryCharts, dispatch, toast])

  // 画布空区域 drop（追加到末尾）
  const handleCanvasEmptyDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOverIndex(null)
    setDraggingItemId(null)
    setIsDragOverCanvas(false)

    const chartId = e.dataTransfer.getData('application/library-chart')
    if (chartId) {
      const chart = libraryCharts.find(c => c.id === chartId)
      if (!chart) return

      const newItem: CanvasItem = {
        id: `ci-${generateId()}`,
        libraryChartId: chart.id,
        width: 2,
        label: chart.name,
        order: canvasItems.length,
      }
      dispatch({ type: 'ADD_CANVAS_ITEM', payload: newItem })
      toast.success(`已添加图表「${chart.name}」`)
      return
    }

    const canvasItemId = e.dataTransfer.getData('application/canvas-item')
    if (canvasItemId) {
      const fromIndex = canvasItems.findIndex(i => i.id === canvasItemId)
      if (fromIndex === -1) return
      const newItems = [...canvasItems]
      const [moved] = newItems.splice(fromIndex, 1)
      newItems.push(moved)
      const reordered = newItems.map((item, i) => ({ ...item, order: i }))
      dispatch({ type: 'REORDER_CANVAS_ITEMS', payload: reordered })
    }
  }, [canvasItems, libraryCharts, dispatch, toast])

  const handleRemoveItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_CANVAS_ITEM', payload: id })
  }, [dispatch])

  const handleToggleWidth = useCallback((item: CanvasItem) => {
    dispatch({
      type: 'UPDATE_CANVAS_ITEM',
      payload: { ...item, width: item.width === 1 ? 2 : 1 },
    })
  }, [dispatch])

  const handleClearCanvas = useCallback(() => {
    dispatch({ type: 'CLEAR_CANVAS' })
    toast.info('画布已清空')
  }, [dispatch, toast])

  return (
    <div className="flex gap-5 flex-1 min-h-0 animate-fade-in">
      {/* ═══ 左侧：图表库 ═══ */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden border-primary/10">
          {/* 头部 */}
          <div className="px-4 pt-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">图表库</p>
                <p className="text-[10px] text-muted-foreground">
                  {libraryCharts.length} 个图表 · 拖拽到右侧画布
                </p>
              </div>
            </div>

            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索图表…"
                className="w-full h-7 rounded-lg border border-input bg-card pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* 图表列表（按分类） */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {libraryCharts.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground/40">
                <FolderOpen className="h-10 w-10 mb-3" />
                <p className="text-xs font-medium">图表库为空</p>
                <p className="text-[10px] mt-1 text-center px-4">
                  请先在「图表制作」中创建图表并保存到图表库
                </p>
              </div>
            ) : (
              libraryCategories.map(cat => {
                const catCount = chartCountByCategory.get(cat.id) || 0
                if (catCount === 0 && !search) return null
                // 搜索模式下如果该分类无匹配结果也跳过
                if (catCount === 0 && search) return null
                const isCatOpen = expandedCats.has(cat.id)

                return (
                  <div key={cat.id} className="mb-1">
                    {/* 一级分类 */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors"
                    >
                      <ChevronDown className={cn(
                        'h-3 w-3 flex-shrink-0 transition-transform duration-200',
                        !isCatOpen && '-rotate-90'
                      )} />
                      <FolderOpen className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground/40 ml-auto flex-shrink-0">{catCount}</span>
                    </button>

                    {/* 二级子分类 */}
                    {isCatOpen && (
                      <div className="ml-3 mt-0.5 space-y-0.5">
                        {cat.subCategories.map(sub => {
                          const subCharts = chartsBySubCategory.get(sub.id)
                          if (!subCharts || subCharts.length === 0) return null
                          const isSubOpen = expandedSubs.has(sub.id)

                          return (
                            <div key={sub.id}>
                              <button
                                onClick={() => toggleSubCategory(sub.id)}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-left text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface/30 transition-colors"
                              >
                                <ChevronDown className={cn(
                                  'h-2.5 w-2.5 flex-shrink-0 transition-transform duration-200',
                                  !isSubOpen && '-rotate-90'
                                )} />
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/8 text-primary/80">
                                  {sub.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground/30 ml-auto flex-shrink-0">{subCharts.length}</span>
                              </button>

                              {/* 图表列表 */}
                              {isSubOpen && (
                                <div className="space-y-1 mt-1 ml-2">
                                  {subCharts.map(chart => {
                                    const Icon = chartTypeIcons[chart.chartType] || BarChart3
                                    return (
                                      <div
                                        key={chart.id}
                                        draggable
                                        onDragStart={e => handleLibraryDragStart(e, chart)}
                                        className={cn(
                                          'group flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-150',
                                          'border-border/50 hover:border-primary/30 hover:bg-primary/[0.03]',
                                          'active:scale-[0.97] active:shadow-lg',
                                        )}
                                      >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
                                          <Icon className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-foreground truncate">{chart.name}</p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-muted-foreground/60">
                                              {chartTypeLabels[chart.chartType]}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/30">·</span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                              {chart.dimensions.length}维 {chart.metrics.length}指标
                                            </span>
                                          </div>
                                        </div>
                                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 flex-shrink-0 transition-colors" />
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {search && filteredCharts.length === 0 && libraryCharts.length > 0 && (
              <div className="flex flex-col items-center py-8 text-muted-foreground/40">
                <Search className="h-8 w-8 mb-2" />
                <p className="text-xs">无匹配图表</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ═══ 右侧：设计画布 ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 画布工具栏 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">设计画布</p>
            {canvasItems.length > 0 && (
              <Badge variant="default" className="text-[10px]">
                {canvasItems.length} 个图表
              </Badge>
            )}
          </div>
          {canvasItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleClearCanvas}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              清空画布
            </Button>
          )}
        </div>

        {/* 画布区域 */}
        <Card className={cn(
          'flex-1 overflow-hidden border-2 transition-colors duration-200',
          isDragOverCanvas ? 'border-primary/40 bg-primary/[0.02]' : 'border-dashed border-border/60',
        )}>
          <CardContent className="h-full p-0">
            {canvasItems.length === 0 ? (
              /* 空画布 */
              <div
                className="h-full flex flex-col items-center justify-center text-muted-foreground/30 transition-colors"
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                onDragEnter={handleCanvasDragEnter}
                onDragLeave={handleCanvasDragLeave}
                onDrop={handleCanvasEmptyDrop}
              >
                <LayoutDashboard className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium">拖拽图表到此处</p>
                <p className="text-sm mt-1">从左侧图表库中选择已保存的图表，拖放到画布开始设计</p>
              </div>
            ) : (
              /* 有内容的画布 */
              <div
                className="h-full overflow-y-auto custom-scrollbar p-5"
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/canvas-item') ? 'move' : 'copy' }}
                onDragEnter={handleCanvasDragEnter}
                onDragLeave={handleCanvasDragLeave}
                onDrop={handleCanvasEmptyDrop}
              >
                <div className="grid grid-cols-2 gap-4 auto-rows-min">
                  {canvasItems.map((item, index) => {
                    const chart = getChartById(item.libraryChartId)
                    if (!chart) return null
                    const isDragging = draggingItemId === item.id
                    const isDropTarget = dragOverIndex === index

                    return (
                      <div
                        key={item.id}
                        className={cn(item.width === 2 ? 'col-span-2' : 'col-span-1')}
                        onDragOver={e => handleCanvasDragOver(e, index)}
                        onDragEnter={handleCanvasDragEnter}
                        onDragLeave={handleCanvasDragLeave}
                        onDrop={e => handleCanvasDrop(e, index)}
                      >
                        {isDropTarget && !isDragging && (
                          <div className="h-1 bg-primary/50 rounded-full mb-2 animate-pulse" />
                        )}

                        <div
                          draggable
                          onDragStart={e => handleCanvasDragStart(e, item.id)}
                          onDragEnd={() => { setDraggingItemId(null); setDragOverIndex(null); dragCounter.current = 0 }}
                          className={cn(
                            'group relative rounded-xl border-2 transition-all duration-200 cursor-grab active:cursor-grabbing',
                            isDragging
                              ? 'opacity-30 scale-95'
                              : 'hover:shadow-lg hover:shadow-primary/5',
                            'border-border/50 bg-card hover:border-primary/30',
                          )}
                        >
                          {/* 操作栏 */}
                          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleToggleWidth(item)}
                                className="p-1 rounded text-muted-foreground/50 hover:text-foreground hover:bg-surface transition-colors"
                                title={item.width === 1 ? '扩展为全宽' : '缩小为半宽'}
                              >
                                {item.width === 1
                                  ? <RectangleHorizontal className="h-3.5 w-3.5" />
                                  : <Columns className="h-3.5 w-3.5" />
                                }
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 图表标题栏 */}
                          <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-border/30">
                            {(() => {
                              const Icon = chartTypeIcons[chart.chartType] || BarChart3
                              return <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            })()}
                            <span className="text-xs font-semibold text-foreground truncate">{item.label}</span>
                            <Badge variant="default" className="text-[9px] ml-auto flex-shrink-0">
                              {chartTypeLabels[chart.chartType]}
                            </Badge>
                          </div>

                          {/* ECharts 图表预览 */}
                          <div className="p-3">
                            <CanvasChartPreview chart={chart} height={item.width === 2 ? 220 : 180} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   画布内的 ECharts 图表预览
═══════════════════════════════════════ */
function CanvasChartPreview({ chart, height }: { chart: LibraryChart; height: number }) {
  const { state } = useStore()
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)

  // 获取关联的数据源
  const dataSource = useMemo(() => {
    return state.dataSources.find(ds => ds.id === chart.dataSourceId)
  }, [state.dataSources, chart.dataSourceId])

  // 构建 ECharts option
  const option = useMemo(() => {
    if (!dataSource) return null
    return buildMiniOption(chart, dataSource.rows)
  }, [chart, dataSource])

  useEffect(() => {
    if (!chartRef.current) return

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, undefined, { renderer: 'canvas' })
    }

    if (option) {
      instanceRef.current.setOption(option, true)
    }

    const ro = new ResizeObserver(() => instanceRef.current?.resize())
    ro.observe(chartRef.current)

    return () => {
      ro.disconnect()
    }
  }, [option])

  // 组件卸载时销毁 ECharts
  useEffect(() => {
    return () => {
      instanceRef.current?.dispose()
      instanceRef.current = null
    }
  }, [])

  if (!dataSource) {
    return (
      <div
        className="flex flex-col items-center justify-center text-muted-foreground/30 rounded-lg bg-surface/30 border border-border/30"
        style={{ height }}
      >
        <BarChart3 className="h-8 w-8 mb-2" />
        <p className="text-[10px]">关联数据源不可用</p>
      </div>
    )
  }

  return <div ref={chartRef} style={{ width: '100%', height }} />
}

/* ─── 构建迷你图表 Option ─── */
function buildMiniOption(chart: LibraryChart, rows: import('@/types').DataRow[]): echarts.EChartsOption {
  const colors = chart.style.colorScheme?.length ? chart.style.colorScheme : DEFAULT_CHART_COLORS

  const base: echarts.EChartsOption = {
    animation: true,
    color: colors,
    grid: { top: 24, right: 16, bottom: 24, left: 48, containLabel: false },
    tooltip: { trigger: 'axis', confine: true },
  }

  if (chart.chartType === 'pie') {
    const dim = chart.dimensions[0]
    const metric = chart.metrics[0]
    const pieData = getPieData(rows, dim.fieldName, metric)
    return {
      ...base,
      grid: undefined,
      tooltip: { trigger: 'item', confine: true },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: pieData,
        label: { show: true, fontSize: 10, color: 'rgba(255,255,255,0.6)' },
        itemStyle: { borderRadius: 4, borderColor: 'transparent', borderWidth: 2 },
      }],
    }
  }

  if (chart.chartType === 'scatter') {
    const xMetric = chart.metrics[0].fieldName
    const yMetric = chart.metrics[1]?.fieldName || xMetric
    const groupField = chart.dimensions[0]?.fieldName
    const scatterData = getScatterData(rows, xMetric, yMetric, groupField)
    return {
      ...base,
      xAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }, axisLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }, axisLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)' } },
      series: scatterData.map(s => ({ type: 'scatter' as const, data: s.data, symbolSize: 6 })),
    }
  }

  // bar / line / area
  const { categories, series: rawSeries } = aggregateData(rows, chart.dimensions, chart.metrics)
  const seriesType = chart.chartType === 'area' ? 'line' : chart.chartType

  return {
    ...base,
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', rotate: categories.length > 6 ? 30 : 0 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      axisLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)' },
    },
    series: rawSeries.map(s => ({
      ...s,
      type: seriesType as 'bar' | 'line',
      ...(chart.chartType === 'bar' && { barMaxWidth: 20, itemStyle: { borderRadius: [3, 3, 0, 0] } }),
      ...(chart.chartType === 'line' && { smooth: true, symbolSize: 0, lineStyle: { width: 2 } }),
      ...(chart.chartType === 'area' && { smooth: true, symbolSize: 0, lineStyle: { width: 1.5 }, areaStyle: { opacity: 0.15 } }),
    })),
  }
}
