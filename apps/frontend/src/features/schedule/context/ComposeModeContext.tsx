import { createContext, useContext, useState, ReactNode } from 'react'
import { Task } from '../model'

type ComposeModeState = {
  isComposeMode: boolean
  isTransitioning: boolean
  isExiting: boolean
  editingTask: Task | null
  enterComposeMode: () => void
  exitComposeMode: () => void
  finalizeExit: () => void
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
    setIsTransitioning(true)
    setIsComposeMode(true)
    setEditingTask(null) // 默认为新建模式

    // 等待任务列表滑动动画完成后重置过渡状态（保持不变）
    setTimeout(() => setIsTransitioning(false), 2500)
  }

  // 由动画完成事件触发的“退出完成”回调（事件驱动）
  const finalizeExit = () => {
    setIsTransitioning(false)
    setIsExiting(false)
    setIsComposeMode(false)
  }

  const exitComposeMode = () => {
    setIsTransitioning(true)
    setIsExiting(true)

    // 阶段1: 编辑面板向右收回 (立即开始)
    setEditingTask(null)

    // 阶段2: 新建面板向下掉出 (延迟到800ms，给新建面板足够的退场动画时间)
    setTimeout(() => {
      setIsComposeMode(false)
    }, 800)

    // 阶段3: 任务列表滑回居中 在 ComposeMode 组件中由动画事件驱动触发
    // 完全结束：改为事件驱动，由 finalizeExit() 负责重置，不再使用固定计时器
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
        finalizeExit,
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
