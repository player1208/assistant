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
    startTime: string
    goalColor: TaskColor
    isUrgent: boolean
  }) => void
  onUpdateTask: (taskId: string, data: {
    title: string
    description: string
    isAllDay: boolean
    startTime: string
    goalColor: TaskColor
    isUrgent: boolean
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
  const { editingTask, clearEditingTask, startEditingTask, isComposeMode, isTransitioning, isExiting, exitComposeMode, finalizeExit } = useComposeMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const taskListRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(true)
  const [editPanelRightOffset, setEditPanelRightOffset] = useState(0) // 动态计算的编辑面板right值
  const hasLoggedRef = useRef(false) // 防止重复输出

  // 新建面板的显示状态 - 使用独立状态来确保 AnimatePresence 能正确检测变化
  const [showNewPanel, setShowNewPanel] = useState(false)
  // 退场阶段控制：编辑面板先退场 -> 新建面板退场 -> 任务列表滑回
  const [editExitDone, setEditExitDone] = useState(false)
  const [newExitDone, setNewExitDone] = useState(false)

  // 记录本次会话是否曾经展示过“编辑面板”（用于两栏场景：从未打开编辑面板时，直接视为编辑退场已完成）
  const hadEditPanelRef = useRef(false)
  useEffect(() => {
    if (editingTask) hadEditPanelRef.current = true
  }, [editingTask])

  // 调试用：监控动画状态
  const debugAnimationState = () => {
    console.log('🔍 当前动画状态:', {
      isComposeMode,
      isExiting,
      isTransitioning,
      editingTask: editingTask ? editingTask.id : null
    })
  }

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

  const [initialCenteredPosition, setInitialCenteredPosition] = useState(calculateCenteredPosition())
  const [translateX, setTranslateX] = useState(initialCenteredPosition)

  // 计算目标位置：距离左边缘-6px（再向左移动6px）
  const targetPosition = -6

  // 精确测量“共点”（主页面居中位置）：以容器实际宽度和列表实际宽度为准，避免偏移
  useLayoutEffect(() => {
    const measure = () => {
      const containerEl = containerRef.current
      const listEl = taskListRef.current
      if (!containerEl || !listEl) return
      const containerWidth = containerEl.getBoundingClientRect().width
      const listWidth = listEl.getBoundingClientRect().width
      const centeredMarginLeft = Math.round((containerWidth - listWidth) / 2)
      if (centeredMarginLeft !== initialCenteredPosition) {
        setInitialCenteredPosition(centeredMarginLeft)
      }
      // 初次进入或尚未滑到目标位时，确保从精确的“共点”出发
      if (!isExiting && translateX !== targetPosition) {
        setTranslateX(centeredMarginLeft)
      }
    }
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [initialCenteredPosition, isExiting, translateX, targetPosition])

  // 校准：仅在进入时进行即时校准，避免在退场动画开始帧内二次写入导致跳变
  useEffect(() => {
    if (isExiting) return
    const containerEl = containerRef.current
    const listEl = taskListRef.current
    if (!containerEl || !listEl) return
    // 仅在应当处于共点（未开始滑到目标位）时校准
    const shouldBeCentered = translateX !== targetPosition
    if (!shouldBeCentered) return
    const containerRect = containerEl.getBoundingClientRect()
    const listRect = listEl.getBoundingClientRect()
    const desiredLeft = Math.round(containerRect.left + (containerRect.width - listRect.width) / 2)
    const actualLeft = Math.round(listRect.left)
    const delta = desiredLeft - actualLeft
    if (Math.abs(delta) >= 2) {
      setTranslateX(prev => prev + delta)
    }
  }, [isExiting, translateX, targetPosition])



  // 进入编辑模式时：重置阶段标记并显示新建面板
  useEffect(() => {
    if (isComposeMode && !isExiting) {
      if (!showNewPanel) setShowNewPanel(true)
      if (editExitDone || newExitDone) {
        setEditExitDone(false)
        setNewExitDone(false)
      }
      // 重置“是否曾显示过编辑面板”的会话标记
      hadEditPanelRef.current = false
    }
  }, [isComposeMode, isExiting, showNewPanel, editExitDone, newExitDone])


  // 两栏场景兼容：如果本次会话从未展示过编辑面板，则在进入退出阶段时直接视为“编辑退场已完成”
  useEffect(() => {
    if (isExiting && !hadEditPanelRef.current && !editExitDone) {
      setEditExitDone(true)
    }
  }, [isExiting, editExitDone])


  // 退出阶段：等编辑面板完全退场后，才触发新建面板退场
  useEffect(() => {
    if (isExiting && editExitDone && showNewPanel) {
      setShowNewPanel(false)
    }
  }, [isExiting, editExitDone, showNewPanel])

  // 调试用：监控状态变化
  useEffect(() => {
    debugAnimationState()
  }, [isComposeMode, isExiting, isTransitioning, editingTask])

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

    console.log('� 固定布局计算:')
    console.log('   - 新建面板right:', newPanelRight, 'px')
    console.log('   - 编辑面板right:', editPanelRight, 'px')
    console.log('   - 任务列表滑动: 从标准位置滑动到targetPosition(2px)')
    console.log('   - 最终位置: AppShell(8px) + translateX(2px) = 10px距离屏幕左边缘 ✅')

    return {
      newPanelRight,
      editPanelRight
    }
  }

  const { newPanelRight, editPanelRight } = calculateFixedLayout()

  // 实际DOM位置检查 - 只执行一次
  useEffect(() => {
    if (hasLoggedRef.current) return // 防止重复输出

    const checkPositions = () => {
      const taskListEl = taskListRef.current
      if (taskListEl) {
        const taskListRect = taskListEl.getBoundingClientRect()

        console.log('📍 任务列表实际DOM位置:')
        console.log('   - 距离屏幕左边缘:', taskListRect.left.toFixed(2), 'px')
        console.log('   - 距离屏幕右边缘:', (window.innerWidth - taskListRect.right).toFixed(2), 'px')
        console.log('   - 宽度:', taskListRect.width.toFixed(2), 'px')
        console.log('   - 位置范围:', taskListRect.left.toFixed(2), 'px →', taskListRect.right.toFixed(2), 'px')
        console.log('   - 屏幕宽度:', window.innerWidth, 'px')
        console.log('🔍 父容器层级调试:')

        // 检查所有父容器的位置
        let currentEl = taskListEl.parentElement
        let level = 1
        while (currentEl && level <= 5) {
          const rect = currentEl.getBoundingClientRect()
          const computedStyle = window.getComputedStyle(currentEl)
          console.log(`   - 父容器${level}:`, {
            tagName: currentEl.tagName,
            className: currentEl.className,
            left: rect.left.toFixed(2) + 'px',
            paddingLeft: computedStyle.paddingLeft,
            marginLeft: computedStyle.marginLeft,
            width: rect.width.toFixed(2) + 'px'
          })
          currentEl = currentEl.parentElement
          level++
        }

        console.log('🔍 滑动状态调试:')
        console.log('   - 初始居中位置:', initialCenteredPosition.toFixed(2), 'px')
        console.log('   - 目标位置(targetPosition):', targetPosition, 'px')
        console.log('   - 当前translateX:', translateX.toFixed(2), 'px')
        console.log('   - 计算的最终位置: 父容器left +', translateX.toFixed(2), 'px')

        // 检查是否达到目标10px
        const actualLeftDistance = taskListRect.left
        if (Math.abs(actualLeftDistance - 10) < 1) {
          console.log('✅ 任务列表位置正确！距离屏幕左边缘', actualLeftDistance.toFixed(2), 'px')
        } else {
          console.log('❌ 任务列表位置偏差！目标10px，实际', actualLeftDistance.toFixed(2), 'px，偏差', (actualLeftDistance - 10).toFixed(2), 'px')
        }

        hasLoggedRef.current = true // 标记已输出
      }

      // 检查编辑面板
      setTimeout(() => {
        const fixedElements = Array.from(document.querySelectorAll('.fixed'))
        const editPanel = fixedElements.find(el => {
          const classes = el.className
          return classes.includes('shadow-xl') && classes.includes('border-l') && !classes.includes('shadow-lg')
        })

        if (editPanel) {
          const editRect = editPanel.getBoundingClientRect()
          console.log('📍 编辑面板实际DOM位置:')
          console.log('   - 距离屏幕左边缘:', editRect.left.toFixed(2), 'px')
          console.log('   - 距离屏幕右边缘:', (window.innerWidth - editRect.right).toFixed(2), 'px')
          console.log('   - 宽度:', editRect.width.toFixed(2), 'px')
          console.log('   - 位置范围:', editRect.left.toFixed(2), 'px →', editRect.right.toFixed(2), 'px')

          // 验证与任务列表的间距
          const taskListEl = taskListRef.current
          if (taskListEl) {
            const taskListRect = taskListEl.getBoundingClientRect()
            const actualGap = editRect.left - taskListRect.right
            if (Math.abs(actualGap - 16) < 1) {
              console.log('✅ 任务列表→编辑面板间距正确！', actualGap.toFixed(2), 'px')
            } else {
              console.log('❌ 任务列表→编辑面板间距偏差！目标16px，实际', actualGap.toFixed(2), 'px，偏差', (actualGap - 16).toFixed(2), 'px')
            }
          }
        }
      }, 200)

      // 检查新建面板
      setTimeout(() => {
        const fixedElements = Array.from(document.querySelectorAll('.fixed'))
        const newPanel = fixedElements.find(el => {
          const classes = el.className
          return classes.includes('shadow-lg') && classes.includes('border-l')
        })

        if (newPanel) {
          const newRect = newPanel.getBoundingClientRect()
          console.log('📍 新建面板实际DOM位置:')
          console.log('   - 距离屏幕左边缘:', newRect.left.toFixed(2), 'px')
          console.log('   - 距离屏幕右边缘:', (window.innerWidth - newRect.right).toFixed(2), 'px')
          console.log('   - 宽度:', newRect.width.toFixed(2), 'px')
          console.log('   - 位置范围:', newRect.left.toFixed(2), 'px →', newRect.right.toFixed(2), 'px')

          // 检查是否距离右边缘10px
          const actualRightDistance = window.innerWidth - newRect.right
          if (Math.abs(actualRightDistance - 10) < 1) {
            console.log('✅ 新建面板位置正确！距离屏幕右边缘', actualRightDistance.toFixed(2), 'px')
          } else {
            console.log('❌ 新建面板位置偏差！目标10px，实际', actualRightDistance.toFixed(2), 'px，偏差', (actualRightDistance - 10).toFixed(2), 'px')
          }

          // 验证与编辑面板的间距
          const fixedElements = Array.from(document.querySelectorAll('.fixed'))
          const editPanel = fixedElements.find(el => {
            const classes = el.className
            return classes.includes('shadow-xl') && classes.includes('border-l') && !classes.includes('shadow-lg')
          })
          if (editPanel) {
            const editRect = editPanel.getBoundingClientRect()
            const panelGap = newRect.left - editRect.right
            if (Math.abs(panelGap - 16) < 1) {
              console.log('✅ 编辑面板→新建面板间距正确！', panelGap.toFixed(2), 'px')
            } else {
              console.log('❌ 编辑面板→新建面板间距偏差！目标16px，实际', panelGap.toFixed(2), 'px，偏差', (panelGap - 16).toFixed(2), 'px')
            }

            // 检查是否重叠
            if (panelGap < 0) {
              console.log('🚨 警告: 编辑面板和新建面板重叠了!', Math.abs(panelGap).toFixed(2), 'px')
            }
          }
        }
      }, 300)
    }

    setTimeout(checkPositions, 100)
  }, [taskListWidth, editPanelWidth, newPanelWidth]) // 只在宽度变化时执行

  // 当编辑任务变化时，重置输出标记并立即更新位置
  useEffect(() => {
    hasLoggedRef.current = false

    // 当编辑面板出现时，立即更新位置
    if (editingTask) {
      setTimeout(() => {
        const taskListEl = taskListRef.current
        if (taskListEl) {
          const taskListRect = taskListEl.getBoundingClientRect()
          const actualTaskListRight = taskListRect.right
          const targetEditPanelLeft = actualTaskListRight + 16
          const editPanelRightValue = window.innerWidth - targetEditPanelLeft
          setEditPanelRightOffset(editPanelRightValue)

          console.log('🎯 编辑面板出现时位置更新:')
          console.log('   - 任务列表实际右边缘:', actualTaskListRight.toFixed(2), 'px')
          console.log('   - 编辑面板right值:', editPanelRightValue.toFixed(2), 'px')
        }
      }, 100) // 稍微延迟确保DOM已更新
    }
  }, [editingTask, isComposeMode])
  const [, setScrollbarWidth] = useState<number>(0)

  // 组件挂载后开始从居中位置动画到目标位置
  useEffect(() => {
    console.log('🎯 开始滑动动画，从居中位置:', initialCenteredPosition.toFixed(2), 'px 到目标位置:', targetPosition, 'px')

    // 使用双重 requestAnimationFrame 确保渲染完全稳定
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTranslateX(targetPosition)
      })
    })
  }, [initialCenteredPosition, targetPosition])

  // 阶段3：在新建面板退场完成后，任务列表滑回居中
  useEffect(() => {
    if (isExiting && newExitDone) {
      console.log('🏠 新建面板退场完成，开始任务列表滑回居中:', initialCenteredPosition.toFixed(2), 'px')
      setTranslateX(initialCenteredPosition)
    }
  }, [isExiting, newExitDone, initialCenteredPosition])

  // 阶段3完成后：监听任务列表的 CSS 过渡结束事件，事件驱动地通知 Context 完成退出
  useEffect(() => {
    if (!(isExiting && newExitDone)) return
    const el = taskListRef.current as unknown as HTMLElement | null
    if (!el) return
    const onTransitionEnd = (e: any) => {
      const prop = e?.propertyName || ''
      if (prop === 'margin-left') {
        finalizeExit()
      }
    }
    el.addEventListener('transitionend', onTransitionEnd)
    return () => el.removeEventListener('transitionend', onTransitionEnd)
  }, [isExiting, newExitDone, finalizeExit])


  // 组件挂载后立即开始动画
  useEffect(() => {
    // 立即开始动画
    setIsAnimating(false)
  }, [])


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
    startTime: string
    goalColor: TaskColor
    isUrgent: boolean
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
      console.log('📝 新建任务完成，开始退出编辑模式')
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
      {/* 第一栏：日程列表（1.5倍宽度） - 使用 variants 控制动画状态 */}
      <motion.div
        ref={taskListRef}
        className="bg-white lg:shadow-xl lg:rounded-lg"
        style={{
          width: taskListWidth,
          marginLeft: `${translateX}px`, // 恢复滑动动效：从标准位置滑动到目标位置
          marginTop: '8px', // 与主页面保持一致的顶部间距
          transition: 'margin-left 0.18s cubic-bezier(0.4, 0, 1, 1)', // CSS 过渡：最快、干脆利落
          // border: '2px solid red', // 临时边框已移除
          overflow: 'hidden', // 确保内容不会溢出
          boxSizing: 'border-box' // 确保边框包含在宽度内
        }}

      >
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
        <TimedTasks
          tasks={tasks.timed}
          onToggle={onToggleTask}
          onTaskClick={handleTaskClick}
          readOnly={true}
        />
      </motion.div>


      {/* 第二栏：编辑面板 - 使用 Portal 固定到 viewport，避免随滚动/父级 transform 影响 */}
      {createPortal(
        <AnimatePresence onExitComplete={() => setEditExitDone(true)}>
          {editingTask && (
            <motion.div
              key="edit-panel"
              className="fixed top-[69px] z-30 bg-white border-l border-t-2 border-b-2 border-white/30 shadow-xl overflow-y-auto rounded-l-lg"
              style={{
                right: `${editPanelRight}px`, // 固定布局：在新建面板左侧16px处
                width: `${editPanelWidth}px`,
                height: 'calc(100vh - 79px)'
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
                stiffness: 200,  // 降低弹性，让滑入更平滑
                damping: 25,     // 降低阻尼，增加弹性
                mass: 1,
                restDelta: 0.01,
                restSpeed: 0.01
              }}
              onAnimationStart={() => console.log('🎬 编辑面板动画开始')}
              onAnimationComplete={() => console.log('✅ 编辑面板动画完成')}
            >
              <motion.div
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
            className="fixed top-[69px] z-30 bg-white border-l border-t-2 border-b-2 border-white/30 shadow-lg overflow-y-auto rounded-l-lg"
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
            stiffness: 150,  // 更低的弹性，更慢的动画
            damping: 15,     // 更低的阻尼，更多弹跳
            mass: 1.2,       // 更重的质量，更有重量感
            delay: 0.3,      // 减少延迟，更快响应
            restDelta: 0.01,
            restSpeed: 0.01
          }}
          onAnimationStart={() => console.log('🎬 新建面板动画开始')}
          onAnimationComplete={() => {
            // 直接在新建面板退场动画结束的同一刻，启动任务列表滑回，做到“零等待”
            if (isExiting && !showNewPanel && !newExitDone) {
              setTranslateX(initialCenteredPosition)
              setNewExitDone(true)
            }
            console.log('✅ 新建面板动画完成')
          }}
          style={{
            right: `${newPanelRight}px`, // 固定布局：距离右边缘10px
            width: `${newPanelWidth}px`,
            height: 'calc(100vh - 79px)',
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
