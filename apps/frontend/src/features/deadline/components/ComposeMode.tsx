import { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import WeekHeader from './WeekHeader'
import WeekView from './WeekView'
import CreateDeadlineForm from './CreateDeadlineForm'
import { Deadline } from '../model'
import { useComposeMode } from '../context/ComposeModeContext'

type FormData = {
  title: string
  description: string
  startDate: string
  deadlineDate: string
  themeColor: string
}

type Props = {
  deadlines: Deadline[]
  weekOffset: number
  onWeekChange: (offset: number) => void
  onDeleteDeadline: (id: string) => void
  onToggleDeadline: (id: string) => void
  onSaveDeadline: (data: FormData) => void
  onUpdateDeadline: (id: string, data: FormData) => void
  onAddToSchedule?: (deadline: Deadline) => void
}

export default function ComposeMode({
  deadlines,
  weekOffset,
  onWeekChange,
  onDeleteDeadline,
  onToggleDeadline,
  onSaveDeadline,
  onUpdateDeadline,
  onAddToSchedule
}: Props) {
  const { editingDeadline, clearEditingDeadline, startEditingDeadline, isComposeMode, isExiting, exitComposeMode, finalizeExit } = useComposeMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [showNewPanel, setShowNewPanel] = useState(false)
  const [editExitDone, setEditExitDone] = useState(false)
  const [newExitDone, setNewExitDone] = useState(false)

  const calculateCenteredPosition = () => {
    const screenWidth = window.innerWidth
    const fixedSpacing = 10 + 16 + 16 + 10
    const availableWidth = screenWidth - fixedSpacing
    const unitWidth = availableWidth / 6
    const listWidth = Math.floor(unitWidth * 4) - 16
    const centeredLeft = (screenWidth - listWidth) / 2
    return Math.round(centeredLeft)
  }

  const targetPosition = -6
  const initialCenteredPosition = calculateCenteredPosition()
  const [centeredPosition, setCenteredPosition] = useState<number>(initialCenteredPosition)
  const [currentPosition, setCurrentPosition] = useState<number | null>(initialCenteredPosition)

  useLayoutEffect(() => {
    const containerEl = containerRef.current
    const listEl = listRef.current
    if (!containerEl || !listEl) return
    const containerWidth = containerEl.getBoundingClientRect().width
    const listWidth = listEl.getBoundingClientRect().width
    const centeredMarginLeft = Math.round((containerWidth - listWidth) / 2)
    setCenteredPosition(centeredMarginLeft)
    setCurrentPosition(centeredMarginLeft)
  }, [])

  useEffect(() => {
    if (isComposeMode && !isExiting) {
      setCurrentPosition(targetPosition)
      if (!showNewPanel) setShowNewPanel(true)
      if (editExitDone || newExitDone) {
        setEditExitDone(false)
        setNewExitDone(false)
      }
    }
    if (!isComposeMode && !isExiting) {
      setCurrentPosition(null)
    }
  }, [isComposeMode, isExiting, showNewPanel, editExitDone, newExitDone])

  useEffect(() => {
    if (isExiting && showNewPanel) {
      setShowNewPanel(false)
    }
  }, [isExiting, showNewPanel])

  useEffect(() => {
    if (isExiting && newExitDone) {
      setCurrentPosition(centeredPosition)
    }
  }, [isExiting, newExitDone, centeredPosition])

  const calculateFullWidthLayout = () => {
    const viewportWidth = window.innerWidth
    const fixedSpacing = 10 + 16 + 16 + 10
    const availableWidth = viewportWidth - fixedSpacing
    const unitWidth = availableWidth / 6
    const listWidth = Math.floor(unitWidth * 4) - 16
    const editPanelWidth = Math.floor(unitWidth * 1)
    const newPanelWidth = Math.floor(unitWidth * 1)
    return { listWidth, editPanelWidth, newPanelWidth }
  }

  const { listWidth, editPanelWidth, newPanelWidth } = calculateFullWidthLayout()

  const calculateFixedLayout = () => {
    const newPanelRight = 10
    const editPanelRight = newPanelRight + newPanelWidth + 16
    return { newPanelRight, editPanelRight }
  }

  const { newPanelRight, editPanelRight } = calculateFixedLayout()

  const handleSave = (formData: FormData) => {
    if (editingDeadline) {
      onUpdateDeadline(editingDeadline.id, formData)
      clearEditingDeadline()
    } else {
      onSaveDeadline(formData)
      exitComposeMode()
    }
  }

  const handleDeadlineClick = (deadline: Deadline) => {
    startEditingDeadline(deadline)
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-visible"
      style={{
        margin: 0,
        padding: 0,
        pointerEvents: isExiting && newExitDone ? 'none' : 'auto'
      }}
    >
      {/* 周视图列表 */}
      <motion.div
        ref={listRef}
        layoutId="deadline-list-card"
        className="bg-white shadow-xl rounded-lg flex flex-col"
        style={{
          width: listWidth,
          maxWidth: '100%',
          height: 'calc(100vh - 88px)', // NavBar 56px + padding 32px
          boxSizing: 'border-box'
        }}
        initial={false}
        animate={{
          marginLeft: currentPosition ?? centeredPosition
        }}
        transition={{
          type: "tween",
          duration: 0.18,
          ease: [0.4, 0, 1, 1]
        }}
        onAnimationComplete={() => {
          if (isExiting && newExitDone) {
            finalizeExit()
          }
        }}
      >
        {/* 固定头部区域 */}
        <div className="flex-shrink-0">
          <WeekHeader
            weekOffset={weekOffset}
            onPrevWeek={() => onWeekChange(weekOffset - 1)}
            onNextWeek={() => onWeekChange(weekOffset + 1)}
            onToday={() => onWeekChange(0)}
          />
        </div>

        {/* 可滚动的周视图区域 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <WeekView
            deadlines={deadlines}
            weekOffset={weekOffset}
            onDeadlineClick={handleDeadlineClick}
            onToggleDeadline={onToggleDeadline}
          />
        </div>
      </motion.div>

      {/* 编辑面板 */}
      {createPortal(
        <AnimatePresence onExitComplete={() => setEditExitDone(true)}>
          {showNewPanel && (
            <motion.div
              key="edit-panel"
              className="fixed top-[69px] z-30 bg-white border-l border-t-2 border-b-2 border-white/30 shadow-xl overflow-y-auto rounded-l-lg [&::-webkit-scrollbar]:hidden"
              style={{
                right: `${editPanelRight}px`,
                width: `${editPanelWidth}px`,
                height: 'calc(100vh - 79px)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              initial={{ x: "100%", opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{
                x: "100%",
                opacity: 0,
                scale: 0.9,
                transition: { type: "spring", stiffness: 420, damping: 28, mass: 0.6 }
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 25,
                mass: 1,
                restDelta: 0.01,
                restSpeed: 0.01
              }}
            >
              {editingDeadline ? (
                <motion.div
                  key="edit-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 40 }}
                >
                  <CreateDeadlineForm
                    onClose={clearEditingDeadline}
                    onSave={handleSave}
                    onDelete={onDeleteDeadline}
                    onAddToSchedule={onAddToSchedule}
                    editingDeadline={editingDeadline}
                    title="编辑 Deadline"
                    showCloseButton={false}
                    showDeleteButton={true}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="edit-placeholder"
                  className="flex flex-col items-center justify-center h-full text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-lg font-medium">点击左侧列表以开始</p>
                  <p className="text-sm mt-1">选择一个 Deadline 进行编辑</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 新建面板 */}
      {createPortal(
        <AnimatePresence onExitComplete={() => setNewExitDone(true)}>
          {showNewPanel && (
            <motion.div
              key="new-deadline-panel"
              className="fixed top-[69px] z-30 bg-white border-l border-t-2 border-b-2 border-white/30 shadow-lg overflow-y-auto rounded-l-lg [&::-webkit-scrollbar]:hidden"
              initial={{ y: -600, opacity: 0, scale: 0.7, rotateX: -15 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
              exit={{
                y: 600, opacity: 0, scale: 0.8, rotateX: 15,
                transition: { type: "spring", stiffness: 320, damping: 24, mass: 0.9 }
              }}
              transition={{
                type: "spring", stiffness: 150, damping: 15, mass: 1.2, delay: 0.3,
                restDelta: 0.01, restSpeed: 0.01
              }}
              onAnimationComplete={() => {
                if (isExiting && !showNewPanel && !newExitDone) {
                  setNewExitDone(true)
                }
              }}
              style={{
                right: `${newPanelRight}px`,
                width: `${newPanelWidth}px`,
                height: 'calc(100vh - 79px)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <CreateDeadlineForm
                  onClose={() => {}}
                  onSave={handleSave}
                  editingDeadline={null}
                  showCloseButton={false}
                  showDeleteButton={false}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

