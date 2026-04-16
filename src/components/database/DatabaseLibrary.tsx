import { useState, useMemo } from 'react'
import {
  HardDrive, FileSpreadsheet, Hash, Type, Calendar,
  Edit3, Save, Trash2, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore, useToast } from '@/store/app-store'
import { cn } from '@/lib/utils'
import type { DatabaseCategory, DataSource } from '@/types'

/** 数据库管理页面 */
export function DatabaseLibrary() {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const activeCategory = useMemo(
    () => state.activeDatabaseCategoryId
      ? state.databaseCategories.find(c => c.id === state.activeDatabaseCategoryId) || null
      : null,
    [state.databaseCategories, state.activeDatabaseCategoryId]
  )

  if (!activeCategory) {
    return <DatabaseOverview />
  }

  return <DatabaseDetail category={activeCategory} />
}

/** 数据库总览 — 卡片列表 */
function DatabaseOverview() {
  const { state, dispatch } = useStore()

  const getCategoryDsCount = (catId: string) =>
    state.dataSources.filter(ds => ds.databaseCategoryId === catId).length

  // 未归集的数据源
  const unassignedDs = state.dataSources.filter(ds => !ds.databaseCategoryId)

  return (
    <div className="space-y-6 animate-fade-in">
      {state.databaseCategories.length === 0 && unassignedDs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent mb-4">
              <HardDrive className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">暂无数据库</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              数据库用于对已导入的数据源进行分类管理。在侧边栏点击 "+" 创建新的数据库。
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Database category cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.databaseCategories.map(cat => {
              const dsCount = getCategoryDsCount(cat.id)
              return (
                <Card
                  key={cat.id}
                  className="group hover:border-primary/30 transition-all duration-200 cursor-pointer"
                  onClick={() => dispatch({ type: 'SET_ACTIVE_DATABASE_CATEGORY', payload: cat.id })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                        <HardDrive className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="default">{dsCount} 个数据源</Badge>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Unassigned data sources */}
          {unassignedDs.length > 0 && (
            <Card className="border-warning/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-warning" />
                  未归集的数据源
                </CardTitle>
                <CardDescription>
                  以下数据源尚未归集到任何数据库，点击数据源右侧按钮进行归集
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unassignedDs.map(ds => (
                    <UnassignedDataSourceRow key={ds.id} dataSource={ds} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

/** 未归集数据源行 — 带归集下拉 */
function UnassignedDataSourceRow({ dataSource }: { dataSource: DataSource }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [showMenu, setShowMenu] = useState(false)

  const numFields = dataSource.fields.filter(f => f.type === 'number').length
  const textFields = dataSource.fields.filter(f => f.type !== 'number').length

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-border/80 transition-all">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 flex-shrink-0">
        <FileSpreadsheet className="h-4.5 w-4.5 text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{dataSource.name}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span>{dataSource.rowCount} 行</span>
          <span>·</span>
          <Badge variant="dimension">{textFields} 文本</Badge>
          <Badge variant="metric">{numFields} 数值</Badge>
        </div>
      </div>

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setShowMenu(!showMenu)}
        >
          <HardDrive className="h-3.5 w-3.5" />
          归集
        </Button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-popover shadow-elegant py-1">
              {state.databaseCategories.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">暂无数据库，请先创建</p>
              ) : (
                state.databaseCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      dispatch({
                        type: 'ASSIGN_DATA_SOURCE_TO_DATABASE',
                        payload: { dataSourceId: dataSource.id, databaseCategoryId: cat.id },
                      })
                      toast.success(`已归集至「${cat.name}」`)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors text-left"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** 数据库详情 — 展示分类下的数据源 */
function DatabaseDetail({ category }: { category: DatabaseCategory }) {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(category.description)

  const assignedDs = useMemo(
    () => state.dataSources.filter(ds => ds.databaseCategoryId === category.id),
    [state.dataSources, category.id]
  )

  const saveDescription = () => {
    dispatch({
      type: 'UPDATE_DATABASE_CATEGORY',
      payload: { ...category, description: descDraft },
    })
    setEditingDesc(false)
    toast.success('描述已更新')
  }

  const removeFromDb = (dsId: string) => {
    dispatch({
      type: 'ASSIGN_DATA_SOURCE_TO_DATABASE',
      payload: { dataSourceId: dsId, databaseCategoryId: undefined },
    })
    toast.info('已取消归集')
  }

  const typeIcons: Record<string, typeof Hash> = {
    number: Hash,
    string: Type,
    date: Calendar,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Category header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>{category.name}</CardTitle>
              {editingDesc ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="text"
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveDescription()}
                    placeholder="输入数据库描述"
                    autoFocus
                    className="flex-1 h-7 rounded border border-input bg-card px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button size="sm" variant="ghost" onClick={saveDescription} className="h-7 px-2 text-xs">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <CardDescription
                  className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => { setEditingDesc(true); setDescDraft(category.description) }}
                >
                  {category.description || '点击添加描述'}
                  <Edit3 className="h-3 w-3" />
                </CardDescription>
              )}
            </div>
            <Badge variant="default">{assignedDs.length} 个数据源</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Data sources in this category */}
      {assignedDs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">暂无数据源</p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              请在「数据源」页面上传数据后，点击归集按钮将数据分配到此数据库
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignedDs.map(ds => {
            const numFields = ds.fields.filter(f => f.type === 'number').length
            const textFields = ds.fields.filter(f => f.type !== 'number').length
            const dateFields = ds.fields.filter(f => f.type === 'date').length

            return (
              <Card key={ds.id} className="hover:border-primary/20 transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                      <FileSpreadsheet className="h-5.5 w-5.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{ds.name}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{ds.rowCount} 行</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{ds.fields.length} 字段</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <Badge variant="dimension">{textFields} 文本</Badge>
                        <Badge variant="metric">{numFields} 数值</Badge>
                        {dateFields > 0 && (
                          <Badge variant="dimension">{dateFields} 日期</Badge>
                        )}
                      </div>

                      {/* Field preview */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {ds.fields.slice(0, 8).map(field => {
                          const Icon = typeIcons[field.type] || Type
                          return (
                            <span
                              key={field.name}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-surface text-muted-foreground"
                            >
                              <Icon className="h-2.5 w-2.5" />
                              {field.name}
                            </span>
                          )
                        })}
                        {ds.fields.length > 8 && (
                          <span className="text-[10px] text-muted-foreground/60 self-center">
                            +{ds.fields.length - 8} 更多
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => removeFromDb(ds.id)}
                      title="取消归集"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
