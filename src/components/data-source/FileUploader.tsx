import { useState, useCallback, useRef } from 'react'
import { Upload, FileSpreadsheet, Sparkles, Table, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStore, useToast } from '@/store/app-store'
import { parseCSVFile, parseCSVString } from '@/lib/csv-parser'
import { DEMO_CSV } from '@/lib/demo-data'
import { cn } from '@/lib/utils'
import type { DataSource } from '@/types'

export function FileUploader() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('请上传 CSV 格式的文件')
      return
    }
    setIsLoading(true)
    try {
      const ds = await parseCSVFile(file)
      dispatch({ type: 'ADD_DATA_SOURCE', payload: ds })
      toast.success(`成功导入 "${ds.name}"，共 ${ds.rowCount} 行数据`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '文件解析失败')
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const loadDemo = useCallback(() => {
    const ds = parseCSVString(DEMO_CSV, '合同业绩演示数据')
    dispatch({ type: 'ADD_DATA_SOURCE', payload: ds })
    toast.success('已加载演示数据，共 32 行记录')
  }, [dispatch, toast])

  const removeDataSource = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DATA_SOURCE', payload: id })
    toast.info('数据源已删除')
  }, [dispatch, toast])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload zone */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            上传数据文件
          </CardTitle>
          <CardDescription>
            支持 CSV 格式文件，系统将自动识别字段类型
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 cursor-pointer',
              'transition-all duration-300',
              'hover:border-primary/50 hover:bg-primary/5',
              isDragging ? 'drag-active border-primary bg-primary/5' : 'border-border',
              isLoading && 'pointer-events-none opacity-60'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent">
              {isLoading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              )}
            </div>

            <div className="text-center">
              <p className="text-base font-medium text-foreground">
                {isDragging ? '松开鼠标即可上传' : '拖拽 CSV 文件到此处'}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                或点击选择文件 · 支持包含表头的 CSV 文件
              </p>
            </div>
          </div>

          {/* Demo data button */}
          <div className="mt-4 flex items-center justify-center">
            <Button variant="ghost" onClick={loadDemo} className="gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              使用演示数据快速体验
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data sources list */}
      {state.dataSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5 text-primary" />
              已导入数据源
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.dataSources.map((ds) => (
                <DataSourceCard
                  key={ds.id}
                  dataSource={ds}
                  isActive={ds.id === state.activeDataSourceId}
                  onSelect={() => dispatch({ type: 'SET_ACTIVE_DATA_SOURCE', payload: ds.id })}
                  onRemove={() => removeDataSource(ds.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DataSourceCard({
  dataSource,
  isActive,
  onSelect,
  onRemove,
}: {
  dataSource: DataSource
  isActive: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const numFields = dataSource.fields.filter(f => f.type === 'number').length
  const textFields = dataSource.fields.filter(f => f.type !== 'number').length

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-all duration-200',
        isActive
          ? 'border-primary/40 bg-primary/5 shadow-glow'
          : 'border-border hover:border-primary/20 hover:bg-card/80'
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{dataSource.name}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{dataSource.rowCount} 行</span>
          <span>·</span>
          <span>{dataSource.fields.length} 个字段</span>
          <span>·</span>
          <div className="flex gap-1.5">
            <Badge variant="dimension">{textFields} 文本</Badge>
            <Badge variant="metric">{numFields} 数值</Badge>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
        onClick={e => {
          e.stopPropagation()
          onRemove()
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}