import { useStore } from '@/store/app-store'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const toastStyles = {
  success: 'border-success/30 bg-success/10',
  error: 'border-destructive/30 bg-destructive/10',
  info: 'border-primary/30 bg-primary/10',
  warning: 'border-warning/30 bg-warning/10',
}

const iconStyles = {
  success: 'text-success',
  error: 'text-destructive',
  info: 'text-primary',
  warning: 'text-warning',
}

export function ToastContainer() {
  const { state, dispatch } = useStore()

  if (state.toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {state.toasts.map(toast => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-elegant animate-slide-in-left',
              'min-w-[300px] max-w-[420px]',
              'glass',
              toastStyles[toast.type]
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0', iconStyles[toast.type])} />
            <p className="text-sm text-foreground flex-1">{toast.message}</p>
            <button
              onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}