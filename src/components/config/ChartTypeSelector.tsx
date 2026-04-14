import { useMemo } from 'react'
import {
  BarChart3, TrendingUp, PieChart, ScatterChart, AreaChart,
  Check, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CHART_TYPES, isChartTypeAvailable } from '@/lib/chart-config'
import type { ChartType, DimensionConfig, MetricConfig } from '@/types'

const chartIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  TrendingUp,
  PieChart,
  ScatterChart,
  AreaChart,
}

interface Props {
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
  selectedType: ChartType | null
  onSelect: (type: ChartType) => void
}

export function ChartTypeSelector({ dimensions, metrics, selectedType, onSelect }: Props) {
  const availableTypes = useMemo(
    () => CHART_TYPES.map(ct => ({
      ...ct,
      available: isChartTypeAvailable(ct, dimensions.length, metrics.length),
    })),
    [dimensions.length, metrics.length]
  )

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          图表类型
        </CardTitle>
        <CardDescription>
          根据你的维度和指标配置，选择合适的图表类型
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableTypes.map(ct => {
            const Icon = chartIcons[ct.icon] || BarChart3
            const isSelected = selectedType === ct.type

            return (
              <button
                key={ct.type}
                onClick={() => ct.available && onSelect(ct.type)}
                disabled={!ct.available}
                className={cn(
                  'relative flex flex-col items-center gap-3 rounded-lg border p-5 text-center transition-all duration-200',
                  'cursor-pointer',
                  ct.available
                    ? isSelected
                      ? 'border-primary/50 bg-primary/8 shadow-glow'
                      : 'border-border hover:border-primary/30 hover:bg-primary/5'
                    : 'border-border/50 opacity-40 cursor-not-allowed'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                  isSelected ? 'bg-primary/15' : 'bg-surface'
                )}>
                  <Icon className={cn(
                    'h-6 w-6',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{ct.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {ct.description}
                  </p>
                </div>
                {!ct.available && ct.constraint && (
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <AlertCircle className="h-3 w-3" />
                    <span>{ct.constraint}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}