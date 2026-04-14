import { useRef, useEffect, useMemo } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, Maximize2 } from 'lucide-react'
import { aggregateData, getScatterData, getPieData } from '@/lib/data-aggregator'
import { DEFAULT_CHART_COLORS } from '@/lib/chart-config'
import type { ChartType, ChartStyleConfig, DimensionConfig, MetricConfig, DataRow } from '@/types'

interface Props {
  rows: DataRow[]
  chartType: ChartType
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
  style: ChartStyleConfig
}

export function ChartRenderer({ rows, chartType, dimensions, metrics, style }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const option = useMemo(() => {
    return buildChartOption(rows, chartType, dimensions, metrics, style)
  }, [rows, chartType, dimensions, metrics, style])

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }

    chartInstance.current.setOption(option, true)

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [option])

  // Resize observer
  useEffect(() => {
    if (!chartRef.current || !chartInstance.current) return
    const ro = new ResizeObserver(() => chartInstance.current?.resize())
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [])

  const handleExport = (format: 'png' | 'jpeg') => {
    if (!chartInstance.current) return
    const url = chartInstance.current.getDataURL({
      type: format,
      pixelRatio: 2,
      backgroundColor: 'hsl(230, 25%, 5%)',
    })
    const a = document.createElement('a')
    a.href = url
    a.download = `chart.${format === 'jpeg' ? 'jpg' : format}`
    a.click()
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {style.title || '图表预览'}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => handleExport('png')}
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => handleExport('jpeg')}
          >
            <Download className="h-3.5 w-3.5" />
            JPG
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={chartRef}
          className="w-full rounded-lg"
          style={{ height: '480px' }}
        />
      </CardContent>
    </Card>
  )
}

function buildChartOption(
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
    title: style.title
      ? {
          text: style.title,
          left: 'center',
          top: 12,
          textStyle: {
            fontSize: 16,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
          },
        }
      : undefined,
    tooltip: {
      trigger: chartType === 'scatter' ? 'item' : 'axis',
      backgroundColor: 'rgba(15, 15, 30, 0.95)',
      borderColor: 'rgba(100, 100, 180, 0.2)',
      borderWidth: 1,
      textStyle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(100, 100, 255, 0.05)',
        },
      },
    },
    legend: style.showLegend
      ? {
          [style.legendPosition === 'top' || style.legendPosition === 'bottom' ? 'top' : 'left']:
            style.legendPosition === 'top' ? (style.title ? 44 : 12) :
            style.legendPosition === 'bottom' ? undefined : 'center',
          bottom: style.legendPosition === 'bottom' ? 12 : undefined,
          orient: style.legendPosition === 'left' || style.legendPosition === 'right' ? 'vertical' : 'horizontal',
          right: style.legendPosition === 'right' ? 12 : undefined,
          textStyle: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
          itemWidth: 12,
          itemHeight: 8,
          itemGap: 16,
        }
      : { show: false },
    grid: {
      top: style.title ? 80 : (style.showLegend && style.legendPosition === 'top' ? 50 : 40),
      right: style.showLegend && style.legendPosition === 'right' ? 120 : 24,
      bottom: style.showLegend && style.legendPosition === 'bottom' ? 60 : 40,
      left: style.showLegend && style.legendPosition === 'left' ? 120 : 16,
      containLabel: true,
    },
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }

  // Pie chart
  if (chartType === 'pie') {
    const dim = dimensions[0]
    const metric = metrics[0]
    const pieData = getPieData(rows, dim.fieldName, metric)

    return {
      ...baseOption,
      grid: undefined,
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: 'hsl(230, 25%, 5%)',
            borderWidth: 3,
          },
          label: {
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(100, 100, 255, 0.3)',
            },
          },
          data: pieData,
        },
      ],
    }
  }

  // Scatter chart
  if (chartType === 'scatter') {
    const xMetric = metrics[0].fieldName
    const yMetric = metrics[1]?.fieldName || metrics[0].fieldName
    const groupField = dimensions[0]?.fieldName
    const scatterData = getScatterData(rows, xMetric, yMetric, groupField)

    return {
      ...baseOption,
      xAxis: {
        type: 'value',
        name: xMetric,
        nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)' },
      },
      yAxis: {
        type: 'value',
        name: yMetric,
        nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)' },
      },
      series: scatterData.map(s => ({
        type: 'scatter' as const,
        name: s.name,
        data: s.data,
        symbolSize: 12,
        itemStyle: {
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(100, 100, 255, 0.3)',
          },
        },
      })),
    }
  }

  // Bar / Line / Area
  const aggregated = aggregateData(rows, dimensions, metrics)

  const axisConfig = {
    xAxis: {
      type: 'category' as const,
      data: aggregated.categories,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        rotate: aggregated.categories.length > 8 ? 30 : 0,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        formatter: (v: number) => {
          if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1) + '万'
          return v.toString()
        },
      },
    },
  }

  const seriesType = chartType === 'area' ? 'line' : chartType

  return {
    ...baseOption,
    ...axisConfig,
    series: aggregated.series.map((s, i) => ({
      type: seriesType as 'bar' | 'line',
      name: s.name,
      data: s.data,
      ...(chartType === 'bar' && {
        barMaxWidth: 40,
        barGap: '15%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowColor: colors[i % colors.length] + '40',
          },
        },
      }),
      ...(chartType === 'line' && {
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        emphasis: {
          focus: 'series',
        },
      }),
      ...(chartType === 'area' && {
        smooth: true,
        symbolSize: 4,
        lineStyle: { width: 2 },
        areaStyle: {
          opacity: 0.15,
        },
        emphasis: {
          focus: 'series',
        },
      }),
    })),
  }
}