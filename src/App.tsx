import { useState, useMemo, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Wand2, Library } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { FileUploader } from '@/components/data-source/FileUploader'
import { DataPreview } from '@/components/data-source/DataPreview'
import { FieldConfigurator } from '@/components/config/FieldConfigurator'
import { ChartRenderer } from '@/components/chart/ChartRenderer'
import { ChartLibrary } from '@/components/library/ChartLibrary'
import { FieldPresetLibrary } from '@/components/presets/FieldPresetLibrary'
import { DatabaseLibrary } from '@/components/database/DatabaseLibrary'
import { InterfaceDesigner } from '@/components/designer/InterfaceDesigner'
import { AddToLibraryModal } from '@/components/library/AddToLibraryModal'
import { ToastContainer } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { useStore, useToast } from '@/store/app-store'
import { DEFAULT_CHART_COLORS } from '@/lib/chart-config'
import type { ChartType, DimensionConfig, MetricConfig, ChartStyleConfig, ConfigTemplate, AppState } from '@/types'

export default function App() {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const [configuredDimensions, setConfiguredDimensions] = useState<DimensionConfig[]>([])
  const [configuredMetrics, setConfiguredMetrics] = useState<MetricConfig[]>([])
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null)
  const [chartStyle, setChartStyle] = useState<ChartStyleConfig>({
    title: '',
    showLegend: true,
    legendPosition: 'top',
    colorScheme: DEFAULT_CHART_COLORS,
  })
  const [showChart, setShowChart] = useState(false)
  const [showAddToLibrary, setShowAddToLibrary] = useState(false)

  const activeDataSource = useMemo(
    () => state.dataSources.find(ds => ds.id === state.activeDataSourceId),
    [state.dataSources, state.activeDataSourceId]
  )

  const hasData = state.dataSources.length > 0

  const handleStepChange = useCallback((step: AppState['currentStep']) => {
    dispatch({ type: 'SET_STEP', payload: step })
    if (step !== 'chart') {
      setShowChart(false)
    }
  }, [dispatch])

  // 实时同步配置变化（由 FieldConfigurator 调用）
  const handleConfigChange = useCallback((dims: DimensionConfig[], mets: MetricConfig[]) => {
    setConfiguredDimensions(dims)
    setConfiguredMetrics(mets)
  }, [])

  // 生成图表
  const handleGenerate = useCallback(() => {
    if (!selectedChartType) {
      toast.warning('请选择图表类型')
      return
    }
    if (!activeDataSource) {
      toast.error('没有可用的数据源')
      return
    }
    if (configuredDimensions.length === 0 || configuredMetrics.length === 0) {
      toast.warning('请配置维度和指标字段')
      return
    }
    setShowChart(true)
    dispatch({ type: 'SET_STEP', payload: 'chart' })
    toast.success('图表已生成')
  }, [selectedChartType, activeDataSource, configuredDimensions, configuredMetrics, dispatch, toast])

  // 应用模板（设置图表类型和样式，维度/指标由 FieldConfigurator 内部处理）
  const handleApplyTemplate = useCallback((template: ConfigTemplate) => {
    setSelectedChartType(template.chartType)
    setChartStyle(template.style)
  }, [])

  // 页面标题/描述
  const headerInfo = {
    upload: { title: '数据源管理', desc: '上传CSV文件或使用演示数据开始' },
    configure: { title: '图表配置', desc: '配置维度、指标和图表类型' },
    chart: { title: '图表制作', desc: '预览和导出可视化图表' },
    library: { title: '图表库', desc: '浏览和管理已保存的图表' },
    fieldPresets: { title: '配置库管理', desc: '管理维度与指标的分类配置' },
    design: { title: '界面设计', desc: '拖拽表单组件设计交互界面' },
    database: { title: '数据库管理', desc: '管理和浏览已归集的数据源' },
  }

  const info = headerInfo[state.currentStep]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentStep={state.currentStep}
        onStepChange={handleStepChange}
        hasData={hasData}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-8 py-4 glass">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{info.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{info.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            {state.currentStep === 'configure' && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => handleStepChange('upload')}
              >
                <ArrowLeft className="h-4 w-4" />
                数据源
              </Button>
            )}
            {state.currentStep === 'chart' && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => handleStepChange('configure')}
              >
                <ArrowLeft className="h-4 w-4" />
                修改配置
              </Button>
            )}
            {state.currentStep === 'upload' && hasData && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => handleStepChange('configure')}
              >
                下一步
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {state.currentStep === 'configure' && selectedChartType && configuredDimensions.length > 0 && configuredMetrics.length > 0 && (
              <Button
                variant="premium"
                size="sm"
                className="gap-1.5"
                onClick={handleGenerate}
              >
                <Wand2 className="h-4 w-4" />
                生成图表
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className={`p-8 mx-auto ${['configure', 'design'].includes(state.currentStep) ? 'max-w-[1400px] min-h-[calc(100%-2rem)] flex flex-col' : 'max-w-6xl'}`}>
          {/* Step 1: Upload */}
          {state.currentStep === 'upload' && (
            <div className="space-y-6">
              <FileUploader />
              {activeDataSource && <DataPreview />}
            </div>
          )}

          {/* Step 2: Configure — 三栏布局（维度 | 指标 | 摘要+预览） */}
          {state.currentStep === 'configure' && (
            <FieldConfigurator
              onConfigChange={handleConfigChange}
              selectedChartType={selectedChartType}
              onChartTypeChange={setSelectedChartType}
              chartStyle={chartStyle}
              onApplyTemplate={handleApplyTemplate}
              onGenerate={handleGenerate}
            />
          )}

          {/* Step 3: Chart */}
          {state.currentStep === 'chart' && showChart && activeDataSource && selectedChartType && (
            <div className="space-y-6">
              <ChartRenderer
                rows={activeDataSource.rows}
                chartType={selectedChartType}
                dimensions={configuredDimensions}
                metrics={configuredMetrics}
                style={chartStyle}
              />

              {/* Quick actions */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleStepChange('configure')}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  修改配置
                </Button>
                <Button
                  variant="premium"
                  onClick={() => setShowAddToLibrary(true)}
                  className="gap-1.5"
                >
                  <Library className="h-4 w-4" />
                  添加至图表库
                </Button>
              </div>
            </div>
          )}

          {state.currentStep === 'chart' && !showChart && (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
              <Wand2 className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">尚未生成图表</p>
              <p className="text-sm mt-1">请先完成数据配置并点击"生成图表"</p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => handleStepChange('configure')}
              >
                前往配置
              </Button>
            </div>
          )}

          {/* Step 4: Library */}
          {state.currentStep === 'library' && (
            <ChartLibrary />
          )}

          {/* Step 5: Field Presets */}
          {state.currentStep === 'fieldPresets' && (
            <FieldPresetLibrary />
          )}

          {/* Step 6: Database */}
          {state.currentStep === 'database' && (
            <DatabaseLibrary />
          )}

          {/* Step 7: Interface Designer */}
          {state.currentStep === 'design' && (
            <InterfaceDesigner />
          )}
          </div>
        </div>
      </main>

      {/* Add to library modal */}
      {showAddToLibrary && selectedChartType && activeDataSource && (
        <AddToLibraryModal
          open={showAddToLibrary}
          onClose={() => setShowAddToLibrary(false)}
          chartType={selectedChartType}
          dimensions={configuredDimensions}
          metrics={configuredMetrics}
          style={chartStyle}
          dataSourceId={activeDataSource.id}
        />
      )}

      <ToastContainer />
    </div>
  )
}