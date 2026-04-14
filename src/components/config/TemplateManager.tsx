import { useState } from 'react'
import { Bookmark, Trash2, Play, Plus, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore, useToast } from '@/store/app-store'
import { generateId } from '@/lib/csv-parser'
import { cn } from '@/lib/utils'
import type { ConfigTemplate, ChartType, DimensionConfig, MetricConfig, ChartStyleConfig } from '@/types'

interface Props {
  currentConfig?: {
    chartType: ChartType
    dimensions: DimensionConfig[]
    metrics: MetricConfig[]
    style: ChartStyleConfig
  }
  onApplyTemplate: (template: ConfigTemplate) => void
}

const chartLabels: Record<ChartType, string> = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图',
  scatter: '散点图',
  area: '面积图',
}

export function TemplateManager({ currentConfig, onApplyTemplate }: Props) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [templateName, setTemplateName] = useState('')

  const handleSave = () => {
    if (!currentConfig) {
      toast.warning('请先完成图表配置')
      return
    }
    if (!templateName.trim()) {
      toast.warning('请输入模板名称')
      return
    }

    const template: ConfigTemplate = {
      id: generateId(),
      name: templateName.trim(),
      chartType: currentConfig.chartType,
      dimensions: currentConfig.dimensions,
      metrics: currentConfig.metrics,
      style: currentConfig.style,
      createdAt: Date.now(),
    }

    dispatch({ type: 'ADD_TEMPLATE', payload: template })
    toast.success(`模板 "${template.name}" 已保存`)
    setTemplateName('')
    setSaving(false)
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              配置模板
            </CardTitle>
            <CardDescription className="mt-1">保存和复用图表配置</CardDescription>
          </div>
          {currentConfig && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setSaving(!saving)}
            >
              <Plus className="h-3.5 w-3.5" />
              保存当前配置
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Save form */}
        {saving && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="输入模板名称"
              className="flex h-9 flex-1 rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <Button size="sm" onClick={handleSave}>保存</Button>
          </div>
        )}

        {/* Template list */}
        {state.templates.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">暂无保存的模板</p>
          </div>
        ) : (
          <div className="space-y-2">
            {state.templates.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default">{chartLabels[t.chartType]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {t.dimensions.length} 维度 · {t.metrics.length} 指标
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary"
                    onClick={() => onApplyTemplate(t)}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      dispatch({ type: 'REMOVE_TEMPLATE', payload: t.id })
                      toast.info('模板已删除')
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}