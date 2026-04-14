import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type {
  AppState,
  DataSource,
  ChartConfig,
  ConfigTemplate,
  Toast,
} from '@/types'

type Action =
  | { type: 'ADD_DATA_SOURCE'; payload: DataSource }
  | { type: 'REMOVE_DATA_SOURCE'; payload: string }
  | { type: 'SET_ACTIVE_DATA_SOURCE'; payload: string }
  | { type: 'UPDATE_DATA_SOURCE'; payload: DataSource }
  | { type: 'ADD_CHART_CONFIG'; payload: ChartConfig }
  | { type: 'UPDATE_CHART_CONFIG'; payload: ChartConfig }
  | { type: 'REMOVE_CHART_CONFIG'; payload: string }
  | { type: 'SET_ACTIVE_CHART_CONFIG'; payload: string | null }
  | { type: 'SET_STEP'; payload: AppState['currentStep'] }
  | { type: 'ADD_TEMPLATE'; payload: ConfigTemplate }
  | { type: 'REMOVE_TEMPLATE'; payload: string }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }

interface StoreState extends AppState {
  toasts: Toast[]
}

const initialState: StoreState = {
  dataSources: [],
  activeDataSourceId: null,
  chartConfigs: [],
  activeChartConfigId: null,
  templates: [],
  currentStep: 'upload',
  toasts: [],
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'ADD_DATA_SOURCE':
      return {
        ...state,
        dataSources: [...state.dataSources, action.payload],
        activeDataSourceId: action.payload.id,
      }
    case 'REMOVE_DATA_SOURCE':
      return {
        ...state,
        dataSources: state.dataSources.filter(ds => ds.id !== action.payload),
        activeDataSourceId:
          state.activeDataSourceId === action.payload
            ? state.dataSources[0]?.id || null
            : state.activeDataSourceId,
      }
    case 'SET_ACTIVE_DATA_SOURCE':
      return { ...state, activeDataSourceId: action.payload }
    case 'UPDATE_DATA_SOURCE':
      return {
        ...state,
        dataSources: state.dataSources.map(ds =>
          ds.id === action.payload.id ? action.payload : ds
        ),
      }
    case 'ADD_CHART_CONFIG':
      return {
        ...state,
        chartConfigs: [...state.chartConfigs, action.payload],
        activeChartConfigId: action.payload.id,
      }
    case 'UPDATE_CHART_CONFIG':
      return {
        ...state,
        chartConfigs: state.chartConfigs.map(cc =>
          cc.id === action.payload.id ? action.payload : cc
        ),
      }
    case 'REMOVE_CHART_CONFIG':
      return {
        ...state,
        chartConfigs: state.chartConfigs.filter(cc => cc.id !== action.payload),
        activeChartConfigId:
          state.activeChartConfigId === action.payload ? null : state.activeChartConfigId,
      }
    case 'SET_ACTIVE_CHART_CONFIG':
      return { ...state, activeChartConfigId: action.payload }
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] }
    case 'REMOVE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.payload),
      }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }
    default:
      return state
  }
}

const StoreContext = createContext<{
  state: StoreState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useToast() {
  const { state, dispatch } = useStore()

  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString(36)
    dispatch({ type: 'ADD_TOAST', payload: { id, type, message } })
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id })
    }, 4000)
  }

  return {
    toasts: state.toasts,
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    info: (msg: string) => addToast('info', msg),
    warning: (msg: string) => addToast('warning', msg),
  }
}