import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type {
  AppState,
  DataSource,
  ChartConfig,
  ConfigTemplate,
  Toast,
  LibraryChart,
  LibraryCategory,
  LibrarySubCategory,
  FieldPreset,
  DatabaseCategory,
  CanvasItem,
} from '@/types'
import { DEFAULT_LIBRARY_CATEGORIES, DEFAULT_FIELD_PRESETS, DEFAULT_DATABASE_CATEGORIES } from '@/types'

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
  // 图表库 actions
  | { type: 'ADD_LIBRARY_CHART'; payload: LibraryChart }
  | { type: 'REMOVE_LIBRARY_CHART'; payload: string }
  | { type: 'UPDATE_LIBRARY_CHART'; payload: LibraryChart }
  | { type: 'ADD_LIBRARY_CATEGORY'; payload: LibraryCategory }
  | { type: 'REMOVE_LIBRARY_CATEGORY'; payload: string }
  | { type: 'ADD_LIBRARY_SUBCATEGORY'; payload: { categoryId: string; subCategory: LibrarySubCategory } }
  | { type: 'REMOVE_LIBRARY_SUBCATEGORY'; payload: { categoryId: string; subCategoryId: string } }
  | { type: 'SET_ACTIVE_LIBRARY_CATEGORY'; payload: string | null }
  | { type: 'SET_ACTIVE_LIBRARY_SUBCATEGORY'; payload: string | null }
  // 配置库 actions
  | { type: 'ADD_FIELD_PRESET'; payload: FieldPreset }
  | { type: 'UPDATE_FIELD_PRESET'; payload: FieldPreset }
  | { type: 'REMOVE_FIELD_PRESET'; payload: string }
  | { type: 'SET_ACTIVE_FIELD_PRESET'; payload: string | null }
  // 数据库 actions
  | { type: 'ADD_DATABASE_CATEGORY'; payload: DatabaseCategory }
  | { type: 'UPDATE_DATABASE_CATEGORY'; payload: DatabaseCategory }
  | { type: 'REMOVE_DATABASE_CATEGORY'; payload: string }
  | { type: 'SET_ACTIVE_DATABASE_CATEGORY'; payload: string | null }
  | { type: 'ASSIGN_DATA_SOURCE_TO_DATABASE'; payload: { dataSourceId: string; databaseCategoryId: string | undefined } }
  // 界面设计 actions
  | { type: 'ADD_CANVAS_ITEM'; payload: CanvasItem }
  | { type: 'REMOVE_CANVAS_ITEM'; payload: string }
  | { type: 'UPDATE_CANVAS_ITEM'; payload: CanvasItem }
  | { type: 'REORDER_CANVAS_ITEMS'; payload: CanvasItem[] }
  | { type: 'CLEAR_CANVAS' }

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
  // 图表库初始状态
  libraryCategories: DEFAULT_LIBRARY_CATEGORIES,
  libraryCharts: [],
  activeLibraryCategoryId: null,
  activeLibrarySubCategoryId: null,
  // 配置库初始状态
  fieldPresets: DEFAULT_FIELD_PRESETS,
  activeFieldPresetId: null,
  // 数据库初始状态
  databaseCategories: DEFAULT_DATABASE_CATEGORIES,
  activeDatabaseCategoryId: null,
  // 界面设计初始状态
  designCanvasItems: [],
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

    // ─── 图表库 Reducers ───
    case 'ADD_LIBRARY_CHART':
      return {
        ...state,
        libraryCharts: [...state.libraryCharts, action.payload],
      }
    case 'REMOVE_LIBRARY_CHART':
      return {
        ...state,
        libraryCharts: state.libraryCharts.filter(c => c.id !== action.payload),
      }
    case 'UPDATE_LIBRARY_CHART':
      return {
        ...state,
        libraryCharts: state.libraryCharts.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      }
    case 'ADD_LIBRARY_CATEGORY':
      return {
        ...state,
        libraryCategories: [...state.libraryCategories, action.payload],
      }
    case 'REMOVE_LIBRARY_CATEGORY':
      return {
        ...state,
        libraryCategories: state.libraryCategories.filter(c => c.id !== action.payload),
        libraryCharts: state.libraryCharts.filter(c => c.categoryId !== action.payload),
        activeLibraryCategoryId:
          state.activeLibraryCategoryId === action.payload ? null : state.activeLibraryCategoryId,
      }
    case 'ADD_LIBRARY_SUBCATEGORY':
      return {
        ...state,
        libraryCategories: state.libraryCategories.map(c =>
          c.id === action.payload.categoryId
            ? { ...c, subCategories: [...c.subCategories, action.payload.subCategory] }
            : c
        ),
      }
    case 'REMOVE_LIBRARY_SUBCATEGORY':
      return {
        ...state,
        libraryCategories: state.libraryCategories.map(c =>
          c.id === action.payload.categoryId
            ? { ...c, subCategories: c.subCategories.filter(s => s.id !== action.payload.subCategoryId) }
            : c
        ),
        libraryCharts: state.libraryCharts.filter(c => c.subCategoryId !== action.payload.subCategoryId),
      }
    case 'SET_ACTIVE_LIBRARY_CATEGORY':
      return {
        ...state,
        activeLibraryCategoryId: action.payload,
        activeLibrarySubCategoryId: null,
      }
    case 'SET_ACTIVE_LIBRARY_SUBCATEGORY':
      return { ...state, activeLibrarySubCategoryId: action.payload }

    // ─── 配置库 Reducers ───
    case 'ADD_FIELD_PRESET':
      return { ...state, fieldPresets: [...state.fieldPresets, action.payload] }
    case 'UPDATE_FIELD_PRESET':
      return {
        ...state,
        fieldPresets: state.fieldPresets.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      }
    case 'REMOVE_FIELD_PRESET':
      return {
        ...state,
        fieldPresets: state.fieldPresets.filter(p => p.id !== action.payload),
        activeFieldPresetId:
          state.activeFieldPresetId === action.payload ? null : state.activeFieldPresetId,
      }
    case 'SET_ACTIVE_FIELD_PRESET':
      return { ...state, activeFieldPresetId: action.payload }

    // ─── 数据库 Reducers ───
    case 'ADD_DATABASE_CATEGORY':
      return { ...state, databaseCategories: [...state.databaseCategories, action.payload] }
    case 'UPDATE_DATABASE_CATEGORY':
      return {
        ...state,
        databaseCategories: state.databaseCategories.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      }
    case 'REMOVE_DATABASE_CATEGORY':
      return {
        ...state,
        databaseCategories: state.databaseCategories.filter(c => c.id !== action.payload),
        // 清除归属于该数据库的数据源关联
        dataSources: state.dataSources.map(ds =>
          ds.databaseCategoryId === action.payload
            ? { ...ds, databaseCategoryId: undefined }
            : ds
        ),
        activeDatabaseCategoryId:
          state.activeDatabaseCategoryId === action.payload ? null : state.activeDatabaseCategoryId,
      }
    case 'SET_ACTIVE_DATABASE_CATEGORY':
      return { ...state, activeDatabaseCategoryId: action.payload }
    case 'ASSIGN_DATA_SOURCE_TO_DATABASE':
      return {
        ...state,
        dataSources: state.dataSources.map(ds =>
          ds.id === action.payload.dataSourceId
            ? { ...ds, databaseCategoryId: action.payload.databaseCategoryId }
            : ds
        ),
      }

    // ─── 界面设计 Reducers ───
    case 'ADD_CANVAS_ITEM':
      return { ...state, designCanvasItems: [...state.designCanvasItems, action.payload] }
    case 'REMOVE_CANVAS_ITEM':
      return {
        ...state,
        designCanvasItems: state.designCanvasItems.filter(i => i.id !== action.payload),
      }
    case 'UPDATE_CANVAS_ITEM':
      return {
        ...state,
        designCanvasItems: state.designCanvasItems.map(i =>
          i.id === action.payload.id ? action.payload : i
        ),
      }
    case 'REORDER_CANVAS_ITEMS':
      return { ...state, designCanvasItems: action.payload }
    case 'CLEAR_CANVAS':
      return { ...state, designCanvasItems: [] }

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