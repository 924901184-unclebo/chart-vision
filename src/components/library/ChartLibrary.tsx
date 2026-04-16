import { useMemo, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import {
  Library, BarChart3, TrendingUp, PieChart, ScatterChart, AreaChart,
  Trash2, FolderOpen, Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore, useToast } from '@/store/app-store'
import { cn } from '@/lib/utils'
import type { LibraryChart, ChartType } from '@/types'
import { aggregateData, getScatterData, getPieData } from '@/lib/data-aggregator'
import { DEFAULT_CHART_COLORS } from '@/lib/chart-config'

const chartTypeLabels: Record<ChartType, string> = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图',
  scatter: '散点图',
  area: '面积图',
}

const chartTypeIcons: Record<ChartType, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3,
  line: TrendingUp,
  pie: PieChart,
  scatter: ScatterChart,
  area: AreaChart,
}

export function ChartLibrary() {
  const { state, dispatch } = useStore()
  const toast = useToast()

  // 当前筛选条件
  const activeCatId = state.activeLibraryCategoryId
  const activeSubId = state.activeLibrarySubCategoryId

  // 筛选图表
  const filteredCharts = useMemo(() => {
    return state.libraryCharts.filter(c => {
      if (activeSubId) return c.subCategoryId === activeSubId
      if (activeCatId) return c.categoryId === activeCatId
      return true
    })
  }, [state.libraryCharts, activeCatId, activeSubId])

  // 面包屑
  const breadcrumb = useMemo(() => {
    const parts: string[] = ['全部图表']
    if (activeCatId) {
      const cat = state.libraryCategories.find(c => c.id === activeCatId)
      if (cat) parts.push(cat.name)
      if (activeSubId) {
        const sub = cat?.subCategories.find(s => s.id === activeSubId)
        if (sub) parts.push(sub.name)
      }
    }
    return parts
  }, [activeCatId, activeSubId, state.libraryCategories])

  const handleDelete = (chart: LibraryChart) => {
    dispatch({ type: 'REMOVE_LIBRARY_CHART', payload: chart.id })
    toast.info(`已从图表库移除 "${chart.name}"`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          {breadcrumb.map((part, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-border">/</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-foreground font-medium' : ''}>{part}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredCharts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent mb-4">
              <Library className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">暂无图表</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              在"图表"工作流程中生成图表后，点击"添加至图表库"将图表保存到此分类
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chart grid */}
      {filteredCharts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCharts.map(chart => (
            <LibraryChartCard
              key={chart.id}
              chart={chart}
              onDelete={() => handleDelete(chart)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** 单个图表卡片（带迷你 ECharts 预览） */
function LibraryChartCard({
  chart,
  onDelete,
}: {
  chart: LibraryChart
  onDelete: () => void
}) {
  const { state } = useStore()
  const miniChartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const Icon = chartTypeIcons[chart.chartType] || BarChart3

  // 找到关联数据源
  const dataSource = state.dataSources.find(ds => ds.id === chart.dataSourceId)

  // 找到分类名
  const cat = state.libraryCategories.find(c => c.id === chart.categoryId)
  const sub = cat?.subCategories.find(s => s.id === chart.subCategoryId)

  // 渲染迷你图表
  useEffect(() => {
    if (!miniChartRef.current || !dataSource) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(miniChartRef.current, undefined, { renderer: 'canvas' })
    }

    const option = buildMiniOption(chart, dataSource.rows)
    chartInstance.current.setOption(option, true)

    const ro = new ResizeObserver(() => chartInstance.current?.resize())
    ro.observe(miniChartRef.current)
    return () => ro.disconnect()
  }, [chart, dataSource])

  return (
    <Card className="overflow-hidden group hover:border-primary/30 transition-all duration-200">
      {/* Mini chart preview */}
      <div className="relative h-44 bg-surface/30 border-b border-border">
        {dataSource ? (
          <div ref={miniChartRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            数据源已删除
          </div>
        )}
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            移除
          </Button>
        </div>
      </div>
      {/* Info */}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{chart.name}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="default">{chartTypeLabels[chart.chartType]}</Badge>
              {cat && (
                <span className="text-[10px] text-muted-foreground">
                  {cat.name}{sub ? ` / ${sub.name}` : ''}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {chart.dimensions.map(d => d.fieldName).join(', ')} → {chart.metrics.map(m => m.fieldName).join(', ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** 构建迷你图表配置 */
function buildMiniOption(chart: LibraryChart, rows: import('@/types').DataRow[]): echarts.EChartsOption {
  const colors = chart.style.colorScheme.length > 0 ? chart.style.colorScheme : DEFAULT_CHART_COLORS

  const base: echarts.EChartsOption = {
    color: colors,
    backgroundColor: 'transparent',
    animation: false,
    grid: { top: 8, right: 8, bottom: 8, left: 8, containLabel: false },
    tooltip: { show: false },
    legend: { show: false },
  }

  if (chart.chartType === 'pie') {
    const dim = chart.dimensions[0]
    const metric = chart.metrics[0]
    const pieData = getPieData(rows, dim.fieldName, metric)
    return {
      ...base,
      grid: undefined,
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '50%'],
        label: { show: false },
        itemStyle: { borderRadius: 3, borderColor: 'hsl(230, 25%, 5%)', borderWidth: 2 },
        data: pieData,
      }],
    }
  }

  if (chart.chartType === 'scatter') {
    const xMetric = chart.metrics[0].fieldName
    const yMetric = chart.metrics[1]?.fieldName || xMetric
    const groupField = chart.dimensions[0]?.fieldName
    const data = getScatterData(rows, xMetric, yMetric, groupField)
    return {
      ...base,
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'value', show: false },
      series: data.map(s => ({ type: 'scatter' as const, data: s.data, symbolSize: 6 })),
    }
  }

  const agg = aggregateData(rows, chart.dimensions, chart.metrics)
  const seriesType = chart.chartType === 'area' ? 'line' : chart.chartType

  return {
    ...base,
    xAxis: { type: 'category', data: agg.categories, show: false },
    yAxis: { type: 'value', show: false },
    series: agg.series.map(s => ({
      type: seriesType as 'bar' | 'line',
      data: s.data,
      ...(chart.chartType === 'bar' && { barMaxWidth: 16, itemStyle: { borderRadius: [2, 2, 0, 0] } }),
      ...(chart.chartType === 'line' && { smooth: true, symbolSize: 0, lineStyle: { width: 2 } }),
      ...(chart.chartType === 'area' && { smooth: true, symbolSize: 0, lineStyle: { width: 1.5 }, areaStyle: { opacity: 0.2 } }),
    })),
  }
}