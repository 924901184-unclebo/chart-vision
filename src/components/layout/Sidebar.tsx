import { useState, useMemo } from 'react'
import {
  BarChart3, Database, Brush, Library, SlidersHorizontal, HardDrive,
  ChevronRight, ChevronDown, FolderOpen, Plus, Trash2, X, Layers,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore, useToast } from '@/store/app-store'
import { generateId } from '@/lib/csv-parser'
import type { AppState } from '@/types'

interface Props {
  currentStep: AppState['currentStep']
  onStepChange: (step: AppState['currentStep']) => void
  hasData: boolean
}

const workflowSteps = [
  { id: 'upload' as const, label: '数据源', icon: Database },
  { id: 'configure' as const, label: '配置', icon: Brush },
  { id: 'chart' as const, label: '图表制作', icon: BarChart3 },
  { id: 'design' as const, label: '界面设计', icon: LayoutDashboard },
]

export function Sidebar({ currentStep, onStepChange, hasData }: Props) {
  const { state, dispatch } = useStore()
  const toast = useToast()

  // ─── 板块展开状态（全部默认收起） ───
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // 图表库二级分类展开状态（默认收起）
  const [expandedLibCats, setExpandedLibCats] = useState<Set<string>>(new Set())

  // ─── 新增表单状态 ───
  const [addingDbCat, setAddingDbCat] = useState(false)
  const [newDbCatName, setNewDbCatName] = useState('')
  const [addingPreset, setAddingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [addingLibCat, setAddingLibCat] = useState(false)
  const [newLibCatName, setNewLibCatName] = useState('')
  const [addingLibSubTo, setAddingLibSubTo] = useState<string | null>(null)
  const [newLibSubName, setNewLibSubName] = useState('')

  // ─── 展开/收起工具 ───
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId)
      return next
    })
  }
  const isExpanded = (id: string) => expandedSections.has(id)

  const toggleLibCat = (catId: string) => {
    setExpandedLibCats(prev => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  // 当前激活的板块
  const activeSectionId = useMemo(() => {
    if (['upload', 'configure', 'chart', 'design'].includes(currentStep)) return 'workflow'
    if (currentStep === 'database') return 'database'
    if (currentStep === 'fieldPresets') return 'presets'
    if (currentStep === 'library') return 'library'
    return null
  }, [currentStep])

  // ─── 数据库操作 ───
  const handleAddDbCat = () => {
    if (!newDbCatName.trim()) return
    dispatch({
      type: 'ADD_DATABASE_CATEGORY',
      payload: {
        id: `db-${generateId()}`,
        name: newDbCatName.trim(),
        description: '',
        createdAt: Date.now(),
      },
    })
    toast.success(`已创建数据库 "${newDbCatName.trim()}"`)
    setNewDbCatName('')
    setAddingDbCat(false)
  }

  // ─── 配置库操作 ───
  const handleAddPreset = () => {
    if (!newPresetName.trim()) return
    dispatch({
      type: 'ADD_FIELD_PRESET',
      payload: {
        id: `preset-${generateId()}`,
        name: newPresetName.trim(),
        description: '',
        dimensionFields: [],
        metricFields: [],
        createdAt: Date.now(),
      },
    })
    toast.success(`已创建配置库 "${newPresetName.trim()}"`)
    setNewPresetName('')
    setAddingPreset(false)
  }

  // ─── 图表库操作 ───
  const handleAddLibCat = () => {
    if (!newLibCatName.trim()) return
    dispatch({
      type: 'ADD_LIBRARY_CATEGORY',
      payload: { id: `cat-${generateId()}`, name: newLibCatName.trim(), subCategories: [] },
    })
    toast.success(`已添加分类 "${newLibCatName.trim()}"`)
    setNewLibCatName('')
    setAddingLibCat(false)
  }

  const handleAddLibSub = (categoryId: string) => {
    if (!newLibSubName.trim()) return
    dispatch({
      type: 'ADD_LIBRARY_SUBCATEGORY',
      payload: { categoryId, subCategory: { id: `sub-${generateId()}`, name: newLibSubName.trim() } },
    })
    toast.success(`已添加子分类 "${newLibSubName.trim()}"`)
    setNewLibSubName('')
    setAddingLibSubTo(null)
  }

  // ─── 计数 ───
  const getChartCount = (catId?: string, subId?: string) => {
    return state.libraryCharts.filter(c => {
      if (subId) return c.subCategoryId === subId
      if (catId) return c.categoryId === catId
      return true
    }).length
  }

  const isLibrary = currentStep === 'library'
  const isPresets = currentStep === 'fieldPresets'
  const isDatabase = currentStep === 'database'

  return (
    <aside className="flex flex-col w-64 border-r border-border bg-card/50 flex-shrink-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
          <BarChart3 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">ChartVision</h1>
          <p className="text-[10px] text-muted-foreground">数据可视化工具</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-3 pb-4 space-y-0.5">

        {/* ════════════════════════════════════
            工作流程
        ════════════════════════════════════ */}
        <div>
          <SectionHeader
            icon={Layers}
            label="工作流程"
            isActive={activeSectionId === 'workflow'}
            isExpanded={isExpanded('workflow')}
            onClick={() => toggleSection('workflow')}
          />

          {isExpanded('workflow') && (
            <div className="ml-[2.375rem] space-y-0.5 mt-0.5 pb-1">
              {workflowSteps.map(step => {
                const isActive = currentStep === step.id
                const isDisabled = step.id !== 'upload' && !hasData
                const Icon = step.icon
                return (
                  <button
                    key={step.id}
                    onClick={() => !isDisabled && onStepChange(step.id)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all duration-150 text-sm',
                      isActive
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                      isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', isActive && 'text-primary')} />
                    <span className="flex-1 truncate">{step.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════
            数据库
        ════════════════════════════════════ */}
        <div>
          <SectionHeader
            icon={HardDrive}
            label="数据库"
            count={state.databaseCategories.length}
            isActive={activeSectionId === 'database'}
            isExpanded={isExpanded('database')}
            onClick={() => {
              toggleSection('database')
              dispatch({ type: 'SET_ACTIVE_DATABASE_CATEGORY', payload: null })
              onStepChange('database')
            }}
            onAdd={() => setAddingDbCat(true)}
          />

          {isExpanded('database') && (
            <div className="ml-[2.375rem] space-y-0.5 mt-0.5 pb-1">
              {/* 全部数据 */}
              <button
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_DATABASE_CATEGORY', payload: null })
                  onStepChange('database')
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all duration-150 text-sm',
                  isDatabase && !state.activeDatabaseCategoryId
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                )}
              >
                <Database className={cn('h-3.5 w-3.5 flex-shrink-0', isDatabase && !state.activeDatabaseCategoryId && 'text-primary')} />
                <span className="flex-1 truncate">全部数据</span>
                {isDatabase && !state.activeDatabaseCategoryId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>

              {/* 数据库分类列表 */}
              {state.databaseCategories.map(dbCat => {
                const isActive = isDatabase && state.activeDatabaseCategoryId === dbCat.id
                const dsCount = state.dataSources.filter(ds => ds.databaseCategoryId === dbCat.id).length
                return (
                  <div key={dbCat.id} className="group flex items-center">
                    <button
                      onClick={() => {
                        dispatch({ type: 'SET_ACTIVE_DATABASE_CATEGORY', payload: dbCat.id })
                        onStepChange('database')
                      }}
                      className={cn(
                        'flex-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all duration-150 text-sm',
                        isActive
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                      )}
                    >
                      <HardDrive className={cn('h-3.5 w-3.5 flex-shrink-0', isActive && 'text-primary')} />
                      <span className="flex-1 truncate">{dbCat.name}</span>
                      {dsCount > 0 && (
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums flex-shrink-0">{dsCount}</span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        dispatch({ type: 'REMOVE_DATABASE_CATEGORY', payload: dbCat.id })
                        toast.info(`已删除数据库 "${dbCat.name}"`)
                      }}
                      className="flex-shrink-0 p-1 mr-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      title="删除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}

              {/* 新增表单 */}
              {addingDbCat && (
                <InlineAddForm
                  value={newDbCatName}
                  onChange={setNewDbCatName}
                  onConfirm={handleAddDbCat}
                  onCancel={() => { setAddingDbCat(false); setNewDbCatName('') }}
                  placeholder="数据库名称"
                />
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════
            配置库
        ════════════════════════════════════ */}
        <div>
          <SectionHeader
            icon={SlidersHorizontal}
            label="配置库"
            count={state.fieldPresets.length}
            isActive={activeSectionId === 'presets'}
            isExpanded={isExpanded('presets')}
            onClick={() => {
              toggleSection('presets')
              dispatch({ type: 'SET_ACTIVE_FIELD_PRESET', payload: null })
              onStepChange('fieldPresets')
            }}
            onAdd={() => setAddingPreset(true)}
          />

          {isExpanded('presets') && (
            <div className="ml-[2.375rem] space-y-0.5 mt-0.5 pb-1">
              {/* 全部配置 */}
              <button
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_FIELD_PRESET', payload: null })
                  onStepChange('fieldPresets')
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all duration-150 text-sm',
                  isPresets && !state.activeFieldPresetId
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                )}
              >
                <Layers className={cn('h-3.5 w-3.5 flex-shrink-0', isPresets && !state.activeFieldPresetId && 'text-primary')} />
                <span className="flex-1 truncate">全部配置</span>
                {isPresets && !state.activeFieldPresetId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>

              {/* 配置库列表 */}
              {state.fieldPresets.map(preset => {
                const isActive = isPresets && state.activeFieldPresetId === preset.id
                const fieldCount = preset.dimensionFields.length + preset.metricFields.length
                return (
                  <div key={preset.id} className="group flex items-center">
                    <button
                      onClick={() => {
                        dispatch({ type: 'SET_ACTIVE_FIELD_PRESET', payload: preset.id })
                        onStepChange('fieldPresets')
                      }}
                      className={cn(
                        'flex-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all duration-150 text-sm',
                        isActive
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                      )}
                    >
                      <SlidersHorizontal className={cn('h-3.5 w-3.5 flex-shrink-0', isActive && 'text-primary')} />
                      <span className="flex-1 truncate">{preset.name}</span>
                      {fieldCount > 0 && (
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums flex-shrink-0">{fieldCount}</span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        dispatch({ type: 'REMOVE_FIELD_PRESET', payload: preset.id })
                        toast.info(`已删除配置库 "${preset.name}"`)
                      }}
                      className="flex-shrink-0 p-1 mr-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      title="删除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}

              {/* 新增表单 */}
              {addingPreset && (
                <InlineAddForm
                  value={newPresetName}
                  onChange={setNewPresetName}
                  onConfirm={handleAddPreset}
                  onCancel={() => { setAddingPreset(false); setNewPresetName('') }}
                  placeholder="配置库名称"
                />
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════
            图表库
        ════════════════════════════════════ */}
        <div>
          <SectionHeader
            icon={Library}
            label="图表库"
            count={state.libraryCharts.length}
            isActive={activeSectionId === 'library'}
            isExpanded={isExpanded('library')}
            onClick={() => {
              toggleSection('library')
              dispatch({ type: 'SET_ACTIVE_LIBRARY_CATEGORY', payload: null })
              dispatch({ type: 'SET_ACTIVE_LIBRARY_SUBCATEGORY', payload: null })
              onStepChange('library')
            }}
            onAdd={() => setAddingLibCat(true)}
          />

          {isExpanded('library') && (
            <div className="ml-[2.375rem] space-y-0.5 mt-0.5 pb-1">
              {/* 全部图表 */}
              <button
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_LIBRARY_CATEGORY', payload: null })
                  dispatch({ type: 'SET_ACTIVE_LIBRARY_SUBCATEGORY', payload: null })
                  onStepChange('library')
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all duration-150 text-sm',
                  isLibrary && !state.activeLibraryCategoryId
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                )}
              >
                <Library className={cn('h-3.5 w-3.5 flex-shrink-0', isLibrary && !state.activeLibraryCategoryId && 'text-primary')} />
                <span className="flex-1 truncate">全部图表</span>
                {isLibrary && !state.activeLibraryCategoryId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>

              {/* 图表库分类树 */}
              {state.libraryCategories.map(cat => {
                const isLibCatExpanded = expandedLibCats.has(cat.id)
                const isCatActive = isLibrary && state.activeLibraryCategoryId === cat.id && !state.activeLibrarySubCategoryId
                const catCount = getChartCount(cat.id)

                return (
                  <div key={cat.id}>
                    <div className="group flex items-center">
                      {/* 展开/收起 */}
                      <button
                        onClick={() => toggleLibCat(cat.id)}
                        className="flex-shrink-0 p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {isLibCatExpanded
                          ? <ChevronDown className="h-3 w-3" />
                          : <ChevronRight className="h-3 w-3" />
                        }
                      </button>
                      <button
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_LIBRARY_CATEGORY', payload: cat.id })
                          dispatch({ type: 'SET_ACTIVE_LIBRARY_SUBCATEGORY', payload: null })
                          onStepChange('library')
                          if (!isLibCatExpanded) toggleLibCat(cat.id)
                        }}
                        className={cn(
                          'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all duration-150 text-sm',
                          isCatActive
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                        )}
                      >
                        <FolderOpen className={cn('h-3.5 w-3.5 flex-shrink-0', isCatActive && 'text-primary')} />
                        <span className="flex-1 truncate">{cat.name}</span>
                        {catCount > 0 && (
                          <span className="text-[10px] text-muted-foreground/60 tabular-nums flex-shrink-0">{catCount}</span>
                        )}
                      </button>
                      <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setAddingLibSubTo(cat.id); setNewLibSubName('') }}
                          className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
                          title="添加子分类"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            dispatch({ type: 'REMOVE_LIBRARY_CATEGORY', payload: cat.id })
                            toast.info(`已删除分类 "${cat.name}"`)
                          }}
                          className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                          title="删除分类"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* 子分类 */}
                    {isLibCatExpanded && (
                      <div className="ml-5 pl-2.5 border-l border-border/40 space-y-0.5 mt-0.5">
                        {cat.subCategories.map(sub => {
                          const isSubActive = isLibrary && state.activeLibrarySubCategoryId === sub.id
                          const subCount = getChartCount(cat.id, sub.id)
                          return (
                            <div key={sub.id} className="group/sub flex items-center">
                              <button
                                onClick={() => {
                                  dispatch({ type: 'SET_ACTIVE_LIBRARY_CATEGORY', payload: cat.id })
                                  dispatch({ type: 'SET_ACTIVE_LIBRARY_SUBCATEGORY', payload: sub.id })
                                  onStepChange('library')
                                }}
                                className={cn(
                                  'flex-1 flex items-center gap-2 px-2 py-1 rounded-md text-left transition-all duration-150 text-xs',
                                  isSubActive
                                    ? 'bg-primary/10 text-foreground font-medium'
                                    : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                                )}
                              >
                                <span className="flex-1 truncate">{sub.name}</span>
                                {subCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">{subCount}</span>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  dispatch({ type: 'REMOVE_LIBRARY_SUBCATEGORY', payload: { categoryId: cat.id, subCategoryId: sub.id } })
                                  toast.info(`已删除子分类 "${sub.name}"`)
                                }}
                                className="flex-shrink-0 p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover/sub:opacity-100 transition-all"
                                title="删除"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })}

                        {/* 新增子分类表单 */}
                        {addingLibSubTo === cat.id && (
                          <InlineAddForm
                            value={newLibSubName}
                            onChange={setNewLibSubName}
                            onConfirm={() => handleAddLibSub(cat.id)}
                            onCancel={() => setAddingLibSubTo(null)}
                            placeholder="子分类名称"
                            compact
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* 新增一级分类表单 */}
              {addingLibCat && (
                <InlineAddForm
                  value={newLibCatName}
                  onChange={setNewLibCatName}
                  onConfirm={handleAddLibCat}
                  onCancel={() => { setAddingLibCat(false); setNewLibCatName('') }}
                  placeholder="分类名称"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-border flex-shrink-0">
        <p className="text-[10px] text-muted-foreground">ChartVision MVP v0.3</p>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════
   统一的板块头部组件
═══════════════════════════════════════ */
function SectionHeader({
  icon: Icon,
  label,
  count,
  isActive,
  isExpanded,
  onClick,
  onAdd,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count?: number
  isActive: boolean
  isExpanded: boolean
  onClick: () => void
  onAdd?: () => void
}) {
  return (
    <div className="group flex items-center">
      <button
        onClick={onClick}
        className={cn(
          'flex-1 flex items-center gap-2.5 pl-2.5 pr-2 py-2 rounded-lg text-left transition-all duration-200',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface',
        )}
      >
        {/* 展开/收起指示器 */}
        <div className="flex-shrink-0 w-4 flex items-center justify-center">
          {isExpanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          }
        </div>

        {/* 图标 */}
        <div className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 transition-colors',
          isActive ? 'bg-primary/15' : 'bg-surface',
        )}>
          <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
        </div>

        {/* 名称 */}
        <span className="text-sm font-medium flex-1">{label}</span>

        {/* 数量 */}
        {count !== undefined && (
          <span className={cn(
            'text-[10px] tabular-nums flex-shrink-0 min-w-[1.25rem] text-center rounded-full px-1.5 py-0.5',
            isActive
              ? 'bg-primary/10 text-primary/70'
              : 'text-muted-foreground/50',
          )}>
            {count}
          </span>
        )}
      </button>

      {/* 新增按钮 */}
      {onAdd && (
        <button
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          className="flex-shrink-0 p-1.5 mr-1 text-muted-foreground/40 hover:text-primary opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-primary/5"
          title={`新增${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   统一的内联新增表单
═══════════════════════════════════════ */
function InlineAddForm({
  value,
  onChange,
  onConfirm,
  onCancel,
  placeholder,
  compact,
}: {
  value: string
  onChange: (val: string) => void
  onConfirm: () => void
  onCancel: () => void
  placeholder: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-1.5', compact ? 'px-1' : 'px-0.5')}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onConfirm()}
        placeholder={placeholder}
        autoFocus
        className={cn(
          'flex-1 rounded border border-input bg-card px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring',
          compact ? 'h-6' : 'h-7',
        )}
      />
      <button onClick={onConfirm} className="text-primary hover:text-primary/80 p-0.5 transition-colors">
        <Plus className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      </button>
      <button onClick={onCancel} className="text-muted-foreground hover:text-foreground p-0.5 transition-colors">
        <X className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      </button>
    </div>
  )
}
