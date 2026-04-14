import {
  BarChart3, Database, Settings2, BookmarkCheck,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppState } from '@/types'

interface Props {
  currentStep: AppState['currentStep']
  onStepChange: (step: AppState['currentStep']) => void
  hasData: boolean
}

const steps = [
  {
    id: 'upload' as const,
    label: '数据源',
    icon: Database,
    description: '上传CSV文件',
  },
  {
    id: 'configure' as const,
    label: '配置',
    icon: Settings2,
    description: '选择维度指标',
  },
  {
    id: 'chart' as const,
    label: '图表',
    icon: BarChart3,
    description: '生成可视化',
  },
]

export function Sidebar({ currentStep, onStepChange, hasData }: Props) {
  return (
    <aside className="flex flex-col w-64 border-r border-border bg-card/50 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
          <BarChart3 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">ChartVision</h1>
          <p className="text-[10px] text-muted-foreground">数据可视化工具</p>
        </div>
      </div>

      {/* Navigation steps */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          工作流程
        </p>
        <div className="space-y-1">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id
            const isDisabled = step.id !== 'upload' && !hasData
            const Icon = step.icon

            return (
              <button
                key={step.id}
                onClick={() => !isDisabled && onStepChange(step.id)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                  isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 transition-colors',
                  isActive ? 'bg-primary/20' : 'bg-surface'
                )}>
                  <Icon className={cn(
                    'h-4 w-4',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          ChartVision MVP v0.1
        </p>
      </div>
    </aside>
  )
}