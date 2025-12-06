import { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import Header from './Header'
import WeekdaySelector from './WeekdaySelector'
import AllDayTasks from './AllDayTasks'
import TimedTasks from './TimedTasks'
import CreateScheduleForm from './CreateScheduleForm'
import { DayTasks, TaskColor } from '../model'
import { useComposeMode } from '../context/ComposeModeContext'
import { Task } from '../model'

type Props = {
  activeIdx: number
  tasks: DayTasks
  onDayChange: (idx: number, date: Date) => void
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onSaveTask: (data: {
    title: string
    description: string
    isAllDay: boolean
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    goalColor: TaskColor
  }) => void
  onUpdateTask: (taskId: string, data: {
    title: string
    description: string
    isAllDay: boolean
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    goalColor: TaskColor
  }) => void
}

export default function ComposeMode({
  activeIdx,
  tasks,
  onDayChange,
  onToggleTask,
  onDeleteTask,
  onSaveTask,
  onUpdateTask
}: Props) {
  const { editingTask, clearEditingTask, startEditingTask, isComposeMode, isExiting, exitComposeMode, finalizeExit } = useComposeMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const taskListRef = useRef<HTMLDivElement>(null)

  // 新建面板的显示状态 - 使用独立状态来确保 AnimatePresence 能正确检测变化
  const [showNewPanel, setShowNewPanel] = useState(false)
  // 退场阶段控制：编辑面板先退场 -> 新建面板退场 -> 任务列表滑回
  const [editExitDone, setEditExitDone] = useState(false)
  const [newExitDone, setNewExitDone] = useState(false)


  // 精确计算主页面任务列表的居中位置
  const calculateCenteredPosition = () => {
    const screenWidth = window.innerWidth
    const appShellPadding = 8 // AppShell的px-2左padding
    const containerWidth = screenWidth - (appShellPadding * 2) // AppShell内部可用宽度

    // 使用与主页面相同的宽度计算
    const fixedSpacing = 10 + 16 + 16 + 10
    const availableWidth = screenWidth - fixedSpacing
    const unitWidth = availableWidth / 6
    const taskListWidth = Math.floor(unitWidth * 4) - 16

    // 在AppShell容器内居中的位置
    const centeredLeft = (containerWidth - taskListWidth) / 2
    return centeredLeft
  }

  // 计算目标位置：距离左边缘-6px（再向左移动6px）
  const targetPosition = -6
  
  // 动画位置状态：null = 还没测量，数字 = 当前 marginLeft 值
  // 直接使用目标位置作为初始位置，避免跳动
  const [currentPosition, setCurrentPosition] = useState<number | null>(targetPosition)
  // 记住居中位置，用于退场时滑回
  const [centeredPosition, setCenteredPosition] = useState<number>(calculateCenteredPosition())

  // 测量精确的居中位置（仅用于退场动画）
  useLayoutEffect(() => {
    const containerEl = containerRef.current
    const listEl = taskListRef.current
    if (!containerEl || !listEl) return

    const containerWidth = containerEl.getBoundingClientRect().width
    const listWidth = listEl.getBoundingClientRect().width
    const centeredMarginLeft = Math.round((containerWidth - listWidth) / 2)

    // 保存居中位置（用于退场时滑回）
    setCenteredPosition(centeredMarginLeft)
  }, []) // 只在挂载时执行一次



  // 进入编辑模式时：重置阶段标记并显示新建面板
  useEffect(() => {
    if (isComposeMode && !isExiting) {
      if (!showNewPanel) setShowNewPanel(true)
      if (editExitDone || newExitDone) {
        setEditExitDone(false)
        setNewExitDone(false)
      }
    }
    // 退场完成后，重置位置状态，以便下次进场时重新初始化
    if (!isComposeMode && !isExiting) {
      // 重置位置为 null，下次挂载时会重新测量
      setCurrentPosition(null)
    }
  }, [isComposeMode, isExiting, showNewPanel, editExitDone, newExitDone])




  // 退出阶段：编辑面板和新建面板同时退场
  useEffect(() => {
    if (isExiting && showNewPanel) {
      setShowNewPanel(false)
    }
  }, [isExiting, showNewPanel])

  // 编辑面板的footer引用
  const editFooterRef = useRef<HTMLDivElement>(null)

  // 新建任务成功 Toast & 撤销
  const awaitingCreatePrevIds = useRef<Set<string> | null>(null)
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null)
  const [lastCreatedTitle, setLastCreatedTitle] = useState<string>('')
  const [lastCreatedTime, setLastCreatedTime] = useState<Date | null>(null)
  const [showCreateToast, setShowCreateToast] = useState(false)
  const toastTimerRef = useRef<number | null>(null)

  // 4:1:1 比例分配布局：任务列表4份，编辑工具栏1份，新建工具栏1份
  const calculateFullWidthLayout = () => {
    const viewportWidth = window.innerWidth

    // 固定间距：左边距10px + 任务列表到编辑工具栏16px + 编辑到新建16px + 右边距10px
    const fixedSpacing = 10 + 16 + 16 + 10 // 总计52px固定间距

    // 可分配的总宽度
    const availableWidth = viewportWidth - fixedSpacing

    // 按4:1:1比例分配（总共6份）
    const unitWidth = availableWidth / 6
    const taskListWidth = Math.floor(unitWidth * 4) - 16  // 4份，然后缩小16px
    const editPanelWidth = Math.floor(unitWidth * 1)  // 1份
    const newPanelWidth = Math.floor(unitWidth * 1)   // 1份

    return {
      taskListWidth,
      editPanelWidth,
      newPanelWidth
    }
  }

  const { taskListWidth, editPanelWidth, newPanelWidth } = calculateFullWidthLayout()

  // 简化的固定布局计算
  const calculateFixedLayout = () => {
    // 新建面板：距离右边缘10px
    const newPanelRight = 10

    // 编辑面板：在新建面板左侧16px处
    const editPanelRight = newPanelRight + newPanelWidth + 16

    return {
      newPanelRight,
      editPanelRight
    }
  }

  const { newPanelRight, editPanelRight } = calculateFixedLayout()

  const [, setScrollbarWidth] = useState<number>(0)

  // 阶段3：在新建面板退场完成后，任务列表滑回居中
  useEffect(() => {
    if (isExiting && newExitDone) {
      setCurrentPosition(centeredPosition)
    }
  }, [isExiting, newExitDone, centeredPosition])

  // 计算右侧两栏的水平定位：紧贴卡片右缘 + 16px
  // 移除了anchor计算逻辑，因为现在使用right定位

  // 移除了面板高度计算逻辑，因为现在使用固定高度

  // 无需动态计算，固定为 1.5× 的目标最大宽度

  // 测量左侧列表内滚动条宽度（用于未来可能的视觉补偿）
  useEffect(() => {
    const measure = () => {
      const el = taskListRef.current
      if (!el) return
      const sbw = el.offsetWidth - el.clientWidth
      setScrollbarWidth(sbw > 0 ? sbw : 0)
    }
    // 初次与窗口尺寸变化时测量
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // 监听父级 tasks 更新，捕获新建的任务并弹出 Toast
  useEffect(() => {
    const prev = awaitingCreatePrevIds.current
    if (!prev) return
    const all = [...tasks.allDay, ...tasks.timed]
    const created = all.find(t => !prev.has(t.id))
    if (created) {
      setLastCreatedId(created.id)
      setLastCreatedTitle(created.title || '新任务')
      setLastCreatedTime(new Date())
      setShowCreateToast(true)
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = window.setTimeout(() => setShowCreateToast(false), 5000)
      awaitingCreatePrevIds.current = null
    }
  }, [tasks])

  // 卸载清理 toast 计时器
  useEffect(() => {
    return () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current) }
  }, [])

  const handleSave = (formData: {
    title: string
    description: string
    isAllDay: boolean
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    goalColor: TaskColor
  }) => {
    if (editingTask) {
      // 更新现有任务
      onUpdateTask(editingTask.id, formData)
      clearEditingTask()
    } else {
      // 创建新任务：记录创建前的所有ID，待父级回传新tasks时比对找出新ID
      const prevIds = new Set<string>([
        ...tasks.allDay.map(t => t.id),
        ...tasks.timed.map(t => t.id)
      ])
      awaitingCreatePrevIds.current = prevIds
      onSaveTask(formData)
      // 新建任务后，退出编辑模式并触发退场动画
      exitComposeMode()
    }
  }

  const handleTaskClick = (task: Task) => {
    startEditingTask(task)
  }

  const handleUndoCreate = () => {
    if (lastCreatedId) {
      onDeleteTask(lastCreatedId)
    }
    setShowCreateToast(false)
    setLastCreatedId(null)
  }





  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-visible"
      style={{
        margin: 0,
        padding: 0,
        // 当进入退场阶段且新建面板已退出后，禁用本层指针事件，让主页面立即接管点击
        pointerEvents: isExiting && newExitDone ? 'none' : 'auto'
      }}
    >
      {/* 第一栏：日程列表（1.5倍宽度） - 使用 layoutId 共享布局动画 */}
      <motion.div
        ref={taskListRef}
        layoutId="task-list-card"
        className="bg-white shadow-xl rounded-lg flex flex-col"
        style={{
          width: taskListWidth,
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
          <Header />
          <div className="px-4">
            <WeekdaySelector active={activeIdx} onChange={onDayChange} />
          </div>
          <AllDayTasks
            tasks={tasks.allDay}
            onToggle={onToggleTask}
            onTaskClick={handleTaskClick}
            readOnly={true}
          />
        </div>

        {/* 可滚动的任务列表区域 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <TimedTasks
            tasks={tasks.timed}
            onToggle={onToggleTask}
            onTaskClick={handleTaskClick}
            readOnly={true}
          />
        </div>
      </motion.div>


      {/* 第二栏：编辑面板 - 使用 Portal 固定到 viewport，避免随滚动/父级 transform 影响 */}
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
                transition: {
                  type: "spring",
                  stiffness: 420,
                  damping: 28,
                  mass: 0.6
                }
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
              {editingTask ? (
                <motion.div
                  key="edit-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1,
                    type: "spring",
                    stiffness: 400,
                    damping: 40
                  }}
                >
                  <CreateScheduleForm
                    onClose={clearEditingTask}
                    onSave={handleSave}
                    onDelete={onDeleteTask}
                    editingTask={editingTask}
                    title="编辑日程"
                    showCloseButton={false}
                    showDeleteButton={true}
                    footerRef={editFooterRef}
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
                  <p className="text-sm mt-1">选择一个日程进行编辑</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 第三栏：新建日程模块 - 使用 Portal 固定到 viewport */}
      {createPortal(
        <AnimatePresence onExitComplete={() => setNewExitDone(true)}>
          {showNewPanel && (
            <motion.div
            key="new-schedule-panel"
            className="fixed top-[69px] z-30 bg-white border-l border-t-2 border-b-2 border-white/30 shadow-lg overflow-y-auto rounded-l-lg [&::-webkit-scrollbar]:hidden"
          initial={{ y: -600, opacity: 0, scale: 0.7, rotateX: -15 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
            rotateX: 0
          }}
          exit={{
            y: 600,
            opacity: 0,
            scale: 0.8,
            rotateX: 15,
            transition: {
              type: "spring",
              stiffness: 320,
              damping: 24,
              mass: 0.9
            }
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 15,
            mass: 1.2,
            delay: 0.3,
            restDelta: 0.01,
            restSpeed: 0.01
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
            transition={{
              delay: 0.3,
              duration: 0.4,
              staggerChildren: 0.1
            }}
          >
            <CreateScheduleForm
              onClose={() => {}}
              onSave={handleSave}
              editingTask={null}
              showCloseButton={false}
              showDeleteButton={false}
            />
          </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {showCreateToast && (
            <motion.div
              className="fixed bottom-8 right-6 z-[100] pointer-events-auto"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <div className="flex items-center justify-between gap-4 min-w-[360px] max-w-[560px] bg-gray-900 text-white rounded-2xl px-5 py-3 shadow-2xl border border-gray-800/60">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">已创建：{lastCreatedTitle || '新任务'}</span>
                  <span className="text-xs text-gray-300">{lastCreatedTime ? lastCreatedTime.toLocaleString() : ''}</span>
                </div>
                <button
                  onClick={handleUndoCreate}
                  className="text-sm rounded-full px-3 py-1 bg-emerald-200 text-gray-900 hover:bg-emerald-300 transition-colors"
                >撤销</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  )
}

