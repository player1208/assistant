import { createContext, useContext, useState, ReactNode } from 'react'
import { Task } from '../model'

type ComposeModeState = {
  isComposeMode: boolean
  isTransitioning: boolean
  isExiting: boolean
  editingTask: Task | null
  enterComposeMode: () => void
  exitComposeMode: () => void
  startEditingTask: (task: Task) => void
  clearEditingTask: () => void
}

const ComposeModeContext = createContext<ComposeModeState | undefined>(undefined)

export function ComposeModeProvider({ children }: { children: ReactNode }) {
  const [isComposeMode, setIsComposeMode] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const enterComposeMode = () => {
    console.log('🚀 开始进入编辑模式...')
    setIsTransitioning(true)

    // 立即切换到编辑模式，不需要延迟
    console.log('⚡ 设置 isComposeMode = true')
    setIsComposeMode(true)
    setEditingTask(null) // 默认为新建模式

    // 等待任务列表滑动动画完成后重置过渡状态
    setTimeout(() => setIsTransitioning(false), 2500)
  }

  const exitComposeMode = () => {
    console.log('🚪 开始退出编辑模式...')
    setIsTransitioning(true)
    setIsExiting(true)

    // 阶段1: 编辑面板向右收回 (立即开始)
    console.log('📝 阶段1: 编辑面板向右收回')
    setEditingTask(null)

    // 阶段2: 新建面板向下掉出 (延迟到800ms，给新建面板足够的退场动画时间)
    setTimeout(() => {
      console.log('📋 阶段2: 新建面板向下掉出 - 设置 isComposeMode = false')
      setIsComposeMode(false)
    }, 800)

    // 阶段3: 任务列表滑回居中 (800ms后开始)
    // 这个在ComposeMode组件中处理

    // 完全结束：给足够的时间让“编辑退场 -> 新建退场 -> 列表滑回”完整播放
    setTimeout(() => {
      console.log('✅ 退场动画完成，重置所有状态')
      setIsTransitioning(false)
      setIsExiting(false)
    }, 2400)
  }

  const startEditingTask = (task: Task) => {
    if (!isComposeMode) {
      // 如果不在编辑模式，立即进入编辑模式并设置编辑任务
      setIsTransitioning(true)
      setIsComposeMode(true)
      setEditingTask(task) // 设置要编辑的任务
      setTimeout(() => setIsTransitioning(false), 2500)
    } else {
      // 如果已经在编辑模式，直接设置编辑任务
      setEditingTask(task)
    }
  }

  const clearEditingTask = () => {
    setEditingTask(null)
  }

  return (
    <ComposeModeContext.Provider
      value={{
        isComposeMode,
        isTransitioning,
        isExiting,
        editingTask,
        enterComposeMode,
        exitComposeMode,
        startEditingTask,
        clearEditingTask,
      }}
    >
      {children}
    </ComposeModeContext.Provider>
  )
}

export function useComposeMode() {
  const context = useContext(ComposeModeContext)
  if (context === undefined) {
    throw new Error('useComposeMode must be used within a ComposeModeProvider')
  }
  return context
}
