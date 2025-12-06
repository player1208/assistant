import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import Header from '../components/Header'
import WeekdaySelector from '../components/WeekdaySelector'
import AllDayTasks from '../components/AllDayTasks'
import TimedTasks from '../components/TimedTasks'
import FloatingAddButton from '../components/FloatingAddButton'
import CreateScheduleModal from '../components/CreateScheduleModal'
import ComposeMode from '../components/ComposeMode'
import { ComposeModeProvider, useComposeMode } from '../context/ComposeModeContext'
import { DayTasks, Task, TaskColor } from '../model'
import { scheduleApi } from '../../../services/api/schedule'


function SchedulePageContent() {
  const today = useMemo(() => new Date(), [])
  const [activeIdx, setActiveIdx] = useState(today.getDay())
  const [activeDate, setActiveDate] = useState<Date>(today)
  const [tasks, setTasks] = useState<DayTasks>({ allDay: [], timed: [] })
  const [loading, setLoading] = useState(true)
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 初始化加载今天的任务
  useEffect(() => {
    const fetchTodayTasks = async () => {
      try {
        setLoading(true)
        const data = await scheduleApi.getDayTasks(keyOf(today))
        setTasks(data)
      } catch (err) {
        console.error('Failed to fetch today tasks:', err)
        setTasks({ allDay: [], timed: [] })
      } finally {
        setLoading(false)
      }
    }
    fetchTodayTasks()
  }, [])

  async function handleDayChange(idx: number, date: Date) {
    setActiveIdx(idx)
    setActiveDate(date)
    try {
      const data = await scheduleApi.getDayTasks(keyOf(date))
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks for date:', err)
      setTasks({ allDay: [], timed: [] })
    }
  }

  async function toggleTask(id: string) {
    try {
      const updatedTask = await scheduleApi.toggleTaskStatus(id)
      setTasks((prev) => ({
        date: prev.date || activeDate.toISOString().split('T')[0],
        allDay: prev.allDay.map((t) => (t.id === id ? { ...t, status: updatedTask.status } : t)),
        timed: prev.timed.map((t) => (t.id === id ? { ...t, status: updatedTask.status } : t)),
      }))
    } catch (err) {
      console.error('Failed to toggle task:', err)
      alert('切换任务状态失败，请重试')
    }
  }

  async function handleCreateSchedule(formData: {
    title: string
    description: string
    isAllDay: boolean
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    goalColor: TaskColor
  }) {
    try {
      // 判断是否跨天日程（开始日期 != 结束日期）
      const isMultiDay = formData.startDate !== formData.endDate

      const newTask = await scheduleApi.createTask({
        title: formData.title,
        description: formData.description,
        isAllDay: formData.isAllDay,
        startTime: formData.isAllDay ? undefined : formData.startTime,
        endTime: formData.isAllDay ? undefined : formData.endTime,
        goalColor: formData.goalColor,
        status: 'pending',
        date: formData.startDate,
        // 只有跨天时才传 endDate
        endDate: isMultiDay ? formData.endDate : undefined,
      })

      // 添加到对应的任务列表
      setTasks((prev) => ({
        date: prev.date,
        allDay: formData.isAllDay ? [...prev.allDay, newTask] : prev.allDay,
        timed: formData.isAllDay ? prev.timed : [...prev.timed, newTask].sort((a, b) => {
          const timeA = a.startTime || '00:00'
          const timeB = b.startTime || '00:00'
          return timeA.localeCompare(timeB)
        }),
      }))
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('创建任务失败，请重试')
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      await scheduleApi.deleteTask(id)
      setTasks((prev) => ({
        date: prev.date,
        allDay: prev.allDay.filter(t => t.id !== id),
        timed: prev.timed.filter(t => t.id !== id),
      }))
    } catch (err) {
      console.error('Failed to delete task:', err)
      alert('删除任务失败，请重试')
    }
  }

  async function handleUpdateTask(taskId: string, formData: {
    title: string
    description: string
    isAllDay: boolean
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    goalColor: TaskColor
  }) {
    try {
      // 判断是否跨天日程
      const isMultiDay = formData.startDate !== formData.endDate

      const updated = await scheduleApi.updateTask(taskId, {
        title: formData.title,
        description: formData.description,
        isAllDay: formData.isAllDay,
        startTime: formData.isAllDay ? undefined : formData.startTime,
        endTime: formData.isAllDay ? undefined : formData.endTime,
        goalColor: formData.goalColor,
        date: formData.startDate,
        // 只有跨天时才传 endDate
        endDate: isMultiDay ? formData.endDate : undefined,
      })

      // 如果日期变更，任务可能需要从当前视图移除
      const currentViewDate = tasks.date
      const newDate = formData.startDate

      if (newDate !== currentViewDate) {
        // 日期变了，从当前视图移除该任务
        setTasks((prev) => ({
          date: prev.date,
          allDay: prev.allDay.filter(t => t.id !== taskId),
          timed: prev.timed.filter(t => t.id !== taskId),
        }))
      } else {
        // 日期没变，更新任务（需要处理全天/定时任务之间的切换）
        setTasks((prev) => {
          // 先从两个列表中移除该任务
          const filteredAllDay = prev.allDay.filter(t => t.id !== taskId)
          const filteredTimed = prev.timed.filter(t => t.id !== taskId)

          if (formData.isAllDay) {
            // 更新后是全天任务，添加到 allDay 列表
            return {
              date: prev.date,
              allDay: [...filteredAllDay, updated],
              timed: filteredTimed,
            }
          } else {
            // 更新后是定时任务，添加到 timed 列表并排序
            return {
              date: prev.date,
              allDay: filteredAllDay,
              timed: [...filteredTimed, updated].sort((a, b) => {
                const timeA = a.startTime || '00:00'
                const timeB = b.startTime || '00:00'
                return timeA.localeCompare(timeB)
              }),
            }
          }
        })
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      alert('更新任务失败，请重试')
    }
  }

  // 简化布局：1280px以上都使用四栏模式，撑满屏幕
  const currentWidth = window.innerWidth
  const shouldUseComposeMode = currentWidth >= 1280

  const handleAddClick = () => {
    if (shouldUseComposeMode) {
      enterComposeMode()
    } else {
      setIsCreateModalOpen(true)
    }
  }

  const handleComposeExit = () => {
    exitComposeMode()
  }

  // 谱曲模式视图（在退出阶段保持挂载以确保退场动画可见）
  const isInComposeMode = (isComposeMode || isExiting) && shouldUseComposeMode

  return (
    <LayoutGroup>
      <div className="h-full w-full flex flex-col overflow-hidden">
        {isInComposeMode ? (
          <>
            <div className="flex-1 min-h-0 flex w-full overflow-visible">
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

            {/* 绿色退出按钮 - 使用 layoutId 与蓝色按钮共享动画 */}
            <motion.button
              layoutId="floating-add-button"
              onClick={handleComposeExit}
              className="fixed w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg z-30 flex items-center justify-center"
              style={{
                bottom: '24px',
                left: `${Math.floor((currentWidth - 28 - 32) * 0.65) - 60}px`,
                opacity: isTransitioning ? 0.6 : 1,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="退出谱曲模式"
            >
              <span className="text-lg">✓</span>
            </motion.button>
          </>
        ) : (
          // 标准浏览模式视图
          <>
            <motion.div
              layoutId="task-list-card"
              className="bg-white shadow-xl rounded-lg text-[15px] flex flex-col"
              initial={false}
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
                maxWidth: '100%',
                height: 'calc(100vh - 88px)', // NavBar 56px + padding 32px
                marginLeft: 'auto',
                marginRight: 'auto',
                opacity: isTransitioning ? 0.85 : 1,
                filter: isTransitioning ? 'blur(1px)' : 'blur(0)',
                transition: isTransitioning ? 'opacity 2.5s ease, filter 2.5s ease' : 'none'
              }}
            >
              {/* 固定头部区域 */}
              <div className="flex-shrink-0">
                <Header />
                <div className="px-4">
                  <WeekdaySelector active={activeIdx} onChange={handleDayChange} />
                </div>
                <AllDayTasks tasks={tasks.allDay} onToggle={toggleTask} />
              </div>

              {/* 可滚动的任务列表区域 */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <TimedTasks tasks={tasks.timed} onToggle={toggleTask} />
              </div>
            </motion.div>

            {/* 悬浮添加按钮 - 固定在视口右下角 */}
            <motion.div
              layoutId="floating-add-button"
              className="fixed bottom-8 z-30"
              style={{
                right: `max(1.5rem, calc(50vw - ${taskListWidth / 2}px - 4rem))`
              }}
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
        )}
      </div>
    </LayoutGroup>
  )
}

export default function SchedulePage() {
  return (
    <ComposeModeProvider>
      <SchedulePageContent />
    </ComposeModeProvider>
  )
}


