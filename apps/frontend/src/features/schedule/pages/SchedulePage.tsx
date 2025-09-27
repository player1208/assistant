import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Header from '../components/Header'
import WeekdaySelector from '../components/WeekdaySelector'
import AllDayTasks from '../components/AllDayTasks'
import TimedTasks from '../components/TimedTasks'
import FloatingAddButton from '../components/FloatingAddButton'
import CreateScheduleModal from '../components/CreateScheduleModal'
import ComposeMode from '../components/ComposeMode'
import { ComposeModeProvider, useComposeMode } from '../context/ComposeModeContext'
import { DayTasks, getMockTasks, Task, TaskColor } from '../model'
import InteractiveBackground from '../components/InteractiveBackground'


function SchedulePageContent() {
  const today = useMemo(() => new Date(), [])
  const [activeIdx, setActiveIdx] = useState(today.getDay())
  const [, setActiveDate] = useState<Date>(today)
  const [tasks, setTasks] = useState<DayTasks>(() => getMockTasks(keyOf(today)))
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { isComposeMode, isTransitioning, isExiting, enterComposeMode, exitComposeMode } = useComposeMode()

  // 计算与编辑模式一致的任务列表宽度
  const calculateTaskListWidth = () => {
    const viewportWidth = window.innerWidth
    // 使用与ComposeMode相同的计算逻辑
    const fixedSpacing = 10 + 16 + 16 + 10 // 总计52px固定间距
    const availableWidth = viewportWidth - fixedSpacing
    const unitWidth = availableWidth / 6
    return Math.floor(unitWidth * 4) - 16  // 4份，然后缩小16px
  }

  const [taskListWidth, setTaskListWidth] = useState(calculateTaskListWidth())

  // 监听窗口大小变化，动态更新任务列表宽度
  useEffect(() => {
    const handleResize = () => {
      setTaskListWidth(calculateTaskListWidth())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function keyOf(date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }

  function handleDayChange(idx: number, date: Date) {
    setActiveIdx(idx)
    setActiveDate(date)
    setTasks(getMockTasks(keyOf(date)))
  }

  function toggleTask(id: string) {
    setTasks((prev) => ({
      allDay: prev.allDay.map((t) => (t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t)),
      timed: prev.timed.map((t) => (t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t)),
    }))
  }

  function handleCreateSchedule(formData: {
    title: string
    description: string
    isAllDay: boolean
    startTime: string
    goalColor: TaskColor
    isUrgent: boolean
  }) {
    // 生成新任务ID
    const newId = `new-${Date.now()}`
    
    // 创建新任务对象
    const newTask: Task = {
      id: newId,
      title: formData.title,
      description: formData.description,
      status: 'pending',
      goalColor: formData.goalColor,
      isUrgent: formData.isUrgent,
      time: formData.isAllDay ? undefined : `${formData.startTime}`,
    }

    // 添加到对应的任务列表
    setTasks((prev) => ({
      allDay: formData.isAllDay ? [...prev.allDay, newTask] : prev.allDay,
      timed: formData.isAllDay ? prev.timed : [...prev.timed, newTask].sort((a, b) => {
        const timeA = a.time || '00:00'
        const timeB = b.time || '00:00'
        return timeA.localeCompare(timeB)
      }),
    }))
  }

  function handleDeleteTask(id: string) {
    setTasks((prev) => ({
      allDay: prev.allDay.filter(t => t.id !== id),
      timed: prev.timed.filter(t => t.id !== id),
    }))
  }

  function handleUpdateTask(taskId: string, formData: {
    title: string
    description: string
    isAllDay: boolean
    startTime: string
    goalColor: TaskColor
    isUrgent: boolean
  }) {
    const updatedTask: Partial<Task> = {
      title: formData.title,
      description: formData.description,
      goalColor: formData.goalColor,
      isUrgent: formData.isUrgent,
      time: formData.isAllDay ? undefined : formData.startTime,
    }

    setTasks((prev) => ({
      allDay: prev.allDay.map(t => t.id === taskId ? { ...t, ...updatedTask } : t),
      timed: prev.timed.map(t => t.id === taskId ? { ...t, ...updatedTask } : t).sort((a, b) => {
        const timeA = a.time || '00:00'
        const timeB = b.time || '00:00'
        return timeA.localeCompare(timeB)
      }),
    }))
  }

  // 简化布局：1280px以上都使用四栏模式，撑满屏幕
  const currentWidth = window.innerWidth
  const shouldUseComposeMode = currentWidth >= 1280
  
  // 调试信息
  console.log('屏幕宽度:', currentWidth, '使用谱曲模式:', shouldUseComposeMode)

  const handleAddClick = () => {
    console.log('🔵 点击了蓝色编辑按钮')
    console.log('📏 当前屏幕宽度:', currentWidth)
    console.log('🎵 是否使用编辑模式:', shouldUseComposeMode)

    if (shouldUseComposeMode) {
      console.log('✨ 调用 enterComposeMode()')
      enterComposeMode()
    } else {
      console.log('📱 打开模态框')
      setIsCreateModalOpen(true)
    }
  }

  const handleComposeExit = () => {
    exitComposeMode()
  }

  // 谱曲模式视图（在退出阶段保持挂载以确保退场动画可见）
  if ((isComposeMode || isExiting) && shouldUseComposeMode) {
    return (
      <>
        <div className="flex h-full w-full overflow-visible">
          <ComposeMode
            activeIdx={activeIdx}
            tasks={tasks}
            onDayChange={handleDayChange}
            onToggleTask={toggleTask}
            onDeleteTask={handleDeleteTask}
            onSaveTask={handleCreateSchedule}
            onUpdateTask={handleUpdateTask}
          />
        </div>
        
        {/* 绿色退出按钮 - 定位在任务栏右下角 */}
        <button
          onClick={handleComposeExit}
          className="fixed w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl z-30 flex items-center justify-center"
          style={{
            bottom: '24px',
            left: `${Math.floor((currentWidth - 28 - 32) * 0.65) - 60}px`, // 任务栏宽度 - 按钮宽度 - 边距
            transform: isTransitioning ? 'scale(0.85)' : 'scale(1)',
            opacity: isTransitioning ? 0.6 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: isTransitioning ? 'brightness(0.9)' : 'brightness(1)'
          }}
          aria-label="退出谱曲模式"
        >
          <span>✓</span>
        </button>
      </>
    )
  }

  // 标准浏览模式视图
  return (
    <>
      <motion.div
        className="bg-white lg:shadow-xl lg:rounded-lg text-[15px] flex-1 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          x: 0,
          filter: 'blur(0)',
          transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1]
          }
        }}
        layout
        style={{
          width: taskListWidth,
          marginLeft: 'auto', // 居中显示
          marginRight: 'auto', // 居中显示
          marginTop: '8px',
          marginBottom: 0,
          // 移除 transform，避免与 ComposeMode 的动画冲突
          opacity: isTransitioning ? 0.85 : 1,
          filter: isTransitioning ? 'blur(1px)' : 'blur(0)',
          transition: isTransitioning ? 'opacity 2.5s ease, filter 2.5s ease' : 'none'
        }}
      >
        <Header />
        <div className="px-4">
          <WeekdaySelector active={activeIdx} onChange={handleDayChange} />
        </div>
        <AllDayTasks tasks={tasks.allDay} onToggle={toggleTask} />
        <TimedTasks tasks={tasks.timed} onToggle={toggleTask} />
      </motion.div>

      {/* 悬浮添加按钮 */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: {
            delay: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 20
          }
        }}
      >
        <FloatingAddButton onClick={handleAddClick} />
      </motion.div>

      {/* 新建日程模态框 */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateScheduleModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSave={handleCreateSchedule}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default function SchedulePage() {
  return (
    <>
      <InteractiveBackground />
      <ComposeModeProvider>
        <SchedulePageContent />
      </ComposeModeProvider>
    </>
  )
}


