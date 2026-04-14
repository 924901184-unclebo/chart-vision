import { useState, useMemo, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { FileUploader } from '@/components/data-source/FileUploader'
import { DataPreview } from '@/components/data-source/DataPreview'
import { FieldConfigurator } from '@/components/config/FieldConfigurator'
import { ChartTypeSelector } from '@/components/config/ChartTypeSelector'
import { StyleConfigurator } from '@/components/config/StyleConfigurator'
import { ChartRenderer } from '@/components/chart/ChartRenderer'
import { TemplateManager } from '@/components/config/TemplateManager'
import { ToastContainer } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { useStore, useToast } from '@/store/app-store'
import { DEFAULT_CHART_COLORS } from '@/lib/chart-config'
import { generateId } from '@/lib/csv-parser'
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

  const handleFieldConfigReady = useCallback((config: {
    dimensions: DimensionConfig[]
    metrics: MetricConfig[]
  }) => {
    setConfiguredDimensions(config.dimensions)
    setConfiguredMetrics(config.metrics)
    setSelectedChartType(null)
    setShowChart(false)
  }, [])

  const handleGenerate = useCallback(() => {
    if (!selectedChartType) {
      toast.warning('请选择图表类型')
      return
    }
    if (!activeDataSource) {
      toast.error('没有可用的数据源')
      return
    }
    setShowChart(true)
    dispatch({ type: 'SET_STEP', payload: 'chart' })
    toast.success('图表已生成')
  }, [selectedChartType, activeDataSource, dispatch, toast])

  const handleApplyTemplate = useCallback((template: ConfigTemplate) => {
    setConfiguredDimensions(template.dimensions)
    setConfiguredMetrics(template.metrics)
    setSelectedChartType(template.chartType)
    setChartStyle(template.style)
    toast.info(`已应用模板 "${template.name}"`)
    // Auto navigate to configure step
    dispatch({ type: 'SET_STEP', payload: 'configure' })
  }, [dispatch, toast])

  const currentConfig = selectedChartType ? {
    chartType: selectedChartType,
    dimensions: configuredDimensions,
    metrics: configuredMetrics,
    style: chartStyle,
  } : undefined

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentStep={state.currentStep}
        onStepChange={handleStepChange}
        hasData={hasData}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-8 py-4 glass">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {state.currentStep === 'upload' && '数据源管理'}
              {state.currentStep === 'configure' && '图表配置'}
              {state.currentStep === 'chart' && '图表预览'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {state.currentStep === 'upload' && '上传CSV文件或使用演示数据开始'}
              {state.currentStep === 'configure' && '配置维度、指标和图表类型'}
              {state.currentStep === 'chart' && '查看生成的可视化图表'}
            </p>
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
            {state.currentStep === 'configure' && selectedChartType && (
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
        <div className="p-8 max-w-6xl mx-auto">
          {/* Step 1: Upload */}
          {state.currentStep === 'upload' && (
            <div className="space-y-6">
              <FileUploader />
              {activeDataSource && <DataPreview />}
            </div>
          )}

          {/* Step 2: Configure */}
          {state.currentStep === 'configure' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <FieldConfigurator onConfigReady={handleFieldConfigReady} />

                  {configuredDimensions.length > 0 && configuredMetrics.length > 0 && (
                    <ChartTypeSelector
                      dimensions={configuredDimensions}
                      metrics={configuredMetrics}
                      selectedType={selectedChartType}
                      onSelect={setSelectedChartType}
                    />
                  )}

                  {selectedChartType && (
                    <StyleConfigurator
                      style={chartStyle}
                      onChange={setChartStyle}
                    />
                  )}
                </div>

                <div className="space-y-6">
                  <TemplateManager
                    currentConfig={currentConfig}
                    onApplyTemplate={handleApplyTemplate}
                  />
                </div>
              </div>
            </div>
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
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}