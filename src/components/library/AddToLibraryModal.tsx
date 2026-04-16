import { useState, useMemo } from 'react'
import {
  Library, X, ChevronRight, FolderOpen, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, useToast } from '@/store/app-store'
import { generateId } from '@/lib/csv-parser'
import { cn } from '@/lib/utils'
import type { ChartType, DimensionConfig, MetricConfig, ChartStyleConfig } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  chartType: ChartType
  dimensions: DimensionConfig[]
  metrics: MetricConfig[]
  style: ChartStyleConfig
  dataSourceId: string
}

export function AddToLibraryModal({
  open, onClose, chartType, dimensions, metrics, style, dataSourceId,
}: Props) {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const [chartName, setChartName] = useState(style.title || '')
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)

  const selectedCat = useMemo(
    () => state.libraryCategories.find(c => c.id === selectedCatId),
    [state.libraryCategories, selectedCatId]
  )

  const handleSave = () => {
    if (!chartName.trim()) {
      toast.warning('请输入图表名称')
      return
    }
    if (!selectedCatId) {
      toast.warning('请选择一级分类')
      return
    }
    if (!selectedSubId) {
      toast.warning('请选择二级分类')
      return
    }

    dispatch({
      type: 'ADD_LIBRARY_CHART',
      payload: {
        id: generateId(),
        name: chartName.trim(),
        categoryId: selectedCatId,
        subCategoryId: selectedSubId,
        chartType,
        dimensions,
        metrics,
        style,
        dataSourceId,
        createdAt: Date.now(),
      },
    })

    const catName = selectedCat?.name || ''
    const subName = selectedCat?.subCategories.find(s => s.id === selectedSubId)?.name || ''
    toast.success(`已保存至图表库：${catName} / ${subName}`)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl border border-border bg-card shadow-elegant animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <Library className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">添加至图表库</h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Chart name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                图表名称
              </label>
              <input
                type="text"
                value={chartName}
                onChange={e => setChartName(e.target.value)}
                placeholder="为图表起一个名称"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Category selection — Level 1 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                一级分类
              </label>
              <div className="grid grid-cols-2 gap-2">
                {state.libraryCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCatId(cat.id)
                      setSelectedSubId(null)
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all duration-200',
                      selectedCatId === cat.id
                        ? 'border-primary/40 bg-primary/8 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
                    )}
                  >
                    <FolderOpen className={cn(
                      'h-4 w-4 flex-shrink-0',
                      selectedCatId === cat.id ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className="flex-1 truncate">{cat.name}</span>
                    {selectedCatId === cat.id && (
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-category selection — Level 2 */}
            {selectedCat && (
              <div className="animate-fade-in">
                <label className="text-xs font-medium text-muted-foreground block mb-2">
                  二级分类
                  <span className="ml-1.5 text-primary/70">{selectedCat.name}</span>
                  <ChevronRight className="h-3 w-3 inline mx-0.5 text-muted-foreground" />
                </label>
                {selectedCat.subCategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">
                    该分类下暂无子分类，请在侧边栏中添加
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCat.subCategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubId(sub.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200',
                          selectedSubId === sub.id
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
                        )}
                      >
                        {sub.name}
                        {selectedSubId === sub.id && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="premium"
              onClick={handleSave}
              disabled={!chartName.trim() || !selectedCatId || !selectedSubId}
              className="gap-1.5"
            >
              <Library className="h-4 w-4" />
              保存至图表库
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}