import { createContext, useContext, useState, ReactNode } from 'react'
import { Task } from '../model'

type ComposeModeState = {
  isComposeMode: boolean
  isTransitioning: boolean
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
    setIsTransitioning(true)
    
    // 延迟切换模式，等待退出动画
    setTimeout(() => {
      setIsComposeMode(false)
      setEditingTask(null)
    }, 400)
    
    // 再延迟一点重置过渡状态
    setTimeout(() => {
      setIsTransitioning(false)
    }, 600)
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
