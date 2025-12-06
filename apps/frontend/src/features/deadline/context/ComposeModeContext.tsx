import { createContext, useContext, useState, ReactNode } from 'react'
import { Deadline } from '../model'

type ComposeModeState = {
  isComposeMode: boolean
  isTransitioning: boolean
  isExiting: boolean
  editingDeadline: Deadline | null
  enterComposeMode: () => void
  exitComposeMode: () => void
  finalizeExit: () => void
  startEditingDeadline: (deadline: Deadline) => void
  clearEditingDeadline: () => void
}

const ComposeModeContext = createContext<ComposeModeState | undefined>(undefined)

export function ComposeModeProvider({ children }: { children: ReactNode }) {
  const [isComposeMode, setIsComposeMode] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null)

  const enterComposeMode = () => {
    setIsTransitioning(true)
    setIsComposeMode(true)
    setEditingDeadline(null)

    setTimeout(() => setIsTransitioning(false), 2500)
  }

  const finalizeExit = () => {
    setIsTransitioning(false)
    setIsExiting(false)
    setIsComposeMode(false)
  }

  const exitComposeMode = () => {
    setIsTransitioning(true)
    setIsExiting(true)
    setEditingDeadline(null)

    setTimeout(() => {
      setIsComposeMode(false)
    }, 800)
  }

  const startEditingDeadline = (deadline: Deadline) => {
    if (!isComposeMode) {
      setIsTransitioning(true)
      setIsComposeMode(true)
      setEditingDeadline(deadline)
      setTimeout(() => setIsTransitioning(false), 2500)
    } else {
      setEditingDeadline(deadline)
    }
  }

  const clearEditingDeadline = () => {
    setEditingDeadline(null)
  }

  return (
    <ComposeModeContext.Provider
      value={{
        isComposeMode,
        isTransitioning,
        isExiting,
        editingDeadline,
        enterComposeMode,
        exitComposeMode,
        finalizeExit,
        startEditingDeadline,
        clearEditingDeadline,
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

