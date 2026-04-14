import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette } from 'lucide-react'
import { Select } from '@/components/ui/select'
import type { ChartStyleConfig } from '@/types'

interface Props {
  style: ChartStyleConfig
  onChange: (style: ChartStyleConfig) => void
}

const legendPositionOptions = [
  { value: 'top', label: '顶部' },
  { value: 'bottom', label: '底部' },
  { value: 'left', label: '左侧' },
  { value: 'right', label: '右侧' },
]

export function StyleConfigurator({ style, onChange }: Props) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4 w-4 text-primary" />
          样式配置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">图表标题</label>
          <input
            type="text"
            value={style.title}
            onChange={e => onChange({ ...style, title: e.target.value })}
            placeholder="输入图表标题"
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">显示图例</label>
            <button
              onClick={() => onChange({ ...style, showLegend: !style.showLegend })}
              className={`flex h-9 w-full items-center justify-center rounded-md border text-sm transition-all ${
                style.showLegend
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-input bg-card text-muted-foreground'
              }`}
            >
              {style.showLegend ? '显示' : '隐藏'}
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">图例位置</label>
            <Select
              options={legendPositionOptions}
              value={style.legendPosition}
              onChange={v => onChange({ ...style, legendPosition: v as ChartStyleConfig['legendPosition'] })}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}