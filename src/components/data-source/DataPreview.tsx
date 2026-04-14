import { useMemo, useState } from 'react'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export function DataPreview() {
  const { state } = useStore()
  const [page, setPage] = useState(0)

  const dataSource = useMemo(
    () => state.dataSources.find(ds => ds.id === state.activeDataSourceId),
    [state.dataSources, state.activeDataSourceId]
  )

  if (!dataSource) return null

  const totalPages = Math.ceil(dataSource.rowCount / PAGE_SIZE)
  const pageRows = dataSource.rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const typeBadge = (type: string) => {
    switch (type) {
      case 'number': return <Badge variant="metric">数值</Badge>
      case 'date': return <Badge variant="dimension">日期</Badge>
      default: return <Badge variant="unused">文本</Badge>
    }
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          数据预览 — {dataSource.name}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>共 {dataSource.rowCount} 行</span>
          {totalPages > 1 && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs min-w-[60px] text-center">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto custom-scrollbar rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                {dataSource.fields.map(field => (
                  <th
                    key={field.name}
                    className="whitespace-nowrap px-4 py-3 text-left font-medium text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <span>{field.name}</span>
                      {typeBadge(field.type)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-surface/30',
                    i % 2 === 0 ? 'bg-transparent' : 'bg-surface/20'
                  )}
                >
                  {dataSource.fields.map(field => (
                    <td
                      key={field.name}
                      className={cn(
                        'whitespace-nowrap px-4 py-2.5',
                        field.type === 'number' ? 'text-right tabular-nums' : 'text-left'
                      )}
                    >
                      <span className="text-foreground/80">
                        {row[field.name] != null
                          ? field.type === 'number'
                            ? Number(row[field.name]).toLocaleString()
                            : String(row[field.name])
                          : '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}