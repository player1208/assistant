import { useMemo, useState, useRef, useEffect } from 'react'
import { Task } from '../types'

interface GanttChartProps {
  tasks: Task[]
  selectedTaskId: string | null
  onTaskSelect: (taskId: string | null) => void
}

interface GanttTask extends Task {
  startX: number
  width: number
  row: number
}

export default function GanttChart({ tasks, selectedTaskId, onTaskSelect }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const [containerHeight, setContainerHeight] = useState(600)

  // 监听容器大小变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerWidth(rect.width)
        setContainerHeight(rect.height)
      }
    }
    
    // 延迟执行，确保容器已经渲染
    const timer = setTimeout(updateSize, 100)
    
    // 使用 ResizeObserver 监听容器大小变化
    let resizeObserver: ResizeObserver | null = null
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateSize)
      resizeObserver.observe(containerRef.current)
    }
    
    window.addEventListener('resize', updateSize)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateSize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [tasks]) // 当任务变化时重新计算尺寸

  const { ganttTasks, dateRange, timeScale, timelineHeaders } = useMemo(() => {
    if (tasks.length === 0) {
      return { 
        ganttTasks: [], 
        dateRange: { start: new Date(), end: new Date() }, 
        timeScale: 1,
        timelineHeaders: []
      }
    }

    // 计算日期范围
    const allDates = tasks.flatMap(task => [task.startDate, task.endDate])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // 添加一些边距
    const startDate = new Date(minDate.getTime() - 3 * 24 * 60 * 60 * 1000) // 前3天
    const endDate = new Date(maxDate.getTime() + 3 * 24 * 60 * 60 * 1000) // 后3天
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    
    // 动态计算每天宽度，确保充分利用容器空间
    const availableWidth = Math.max(containerWidth - 250, 400) // 减去任务名称列宽度
    const maxDays = Math.min(totalDays, 100) // 限制最大天数，防止无限拉长
    const dayWidth = Math.max(20, Math.min(50, availableWidth / maxDays)) // 限制在20-50px之间
    
    // 生成时间轴标题
    const timelineHeaders = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayOffset = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      timelineHeaders.push({
        date: new Date(currentDate),
        x: dayOffset * dayWidth,
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // 转换任务为甘特图任务
    const ganttTasks: GanttTask[] = tasks.map((task, index) => {
      const taskStartDays = Math.floor((task.startDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      const taskDurationDays = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (24 * 60 * 60 * 1000))
      
      return {
        ...task,
        startX: taskStartDays * dayWidth,
        width: Math.max(taskDurationDays * dayWidth, 20), // 最小宽度20px
        row: index
      }
    })

    return {
      ganttTasks,
      dateRange: { start: startDate, end: endDate },
      timeScale: dayWidth,
      timelineHeaders
    }
  }, [tasks, containerWidth])

  const totalWidth = Math.min(2000, Math.max(800, timelineHeaders.length * timeScale)) // 限制最大宽度
  const totalHeight = Math.max(400, ganttTasks.length * 50 + 80)

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'fill-green-500'
      case 'in-progress':
        return 'fill-blue-500'
      case 'blocked':
        return 'fill-red-500'
      default:
        return 'fill-gray-400'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    })
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-white">
      {/* 甘特图头部 */}
      <div className="flex-shrink-0 border-b bg-gray-50">
        <div className="flex">
          {/* 任务名称列标题 */}
          <div className="w-64 p-3 border-r bg-white">
            <h3 className="font-medium text-gray-700">任务名称</h3>
          </div>
          {/* 时间轴标题和工具栏 */}
          <div className="flex-1 p-3 flex items-center justify-between">
            <h3 className="font-medium text-gray-700">时间线</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>已完成</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>进行中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>待开始</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>关键路径</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 甘特图内容 */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full" style={{ minWidth: `${totalWidth + 256}px` }}>
          {/* 时间轴网格 */}
          <div className="relative">
            {/* 时间轴背景 */}
            <div className="absolute top-0 left-64 right-0 h-full">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="ganttGrid" width={timeScale} height="50" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="50" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#ganttGrid)" />
                
                {/* 周末背景 */}
                {timelineHeaders.filter(h => h.isWeekend).map((header, index) => (
                  <rect
                    key={index}
                    x={header.x}
                    y="0"
                    width={timeScale}
                    height="100%"
                    fill="rgba(239, 68, 68, 0.05)"
                  />
                ))}

                {/* 今日线 */}
                {(() => {
                  const today = new Date()
                  const todayOffset = Math.floor((today.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000))
                  if (todayOffset >= 0 && todayOffset * timeScale <= totalWidth) {
                    return (
                      <g>
                        <line
                          x1={todayOffset * timeScale}
                          y1="0"
                          x2={todayOffset * timeScale}
                          y2="100%"
                          stroke="#EF4444"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                        />
                        <text
                          x={todayOffset * timeScale + 5}
                          y="15"
                          className="text-xs fill-red-600 font-medium"
                          style={{ fontSize: '10px' }}
                        >
                          今日
                        </text>
                      </g>
                    )
                  }
                  return null
                })()}
              </svg>
            </div>

            {/* 任务行 */}
            {ganttTasks.map((task, index) => (
              <div key={task.id} className="relative h-12 border-b border-gray-100 hover:bg-gray-50">
                <div className="flex h-full">
                  {/* 任务名称 */}
                  <div 
                    className="w-64 p-3 border-r bg-white flex items-center cursor-pointer"
                    onClick={() => onTaskSelect(task.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {/* 状态指示器 */}
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in-progress' ? 'bg-blue-500' :
                        task.status === 'blocked' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      
                      {/* 任务标题 */}
                      <span className={`text-sm truncate ${
                        selectedTaskId === task.id ? 'font-medium text-blue-600' : 'text-gray-700'
                      }`}>
                        {task.title}
                      </span>
                      
                      {/* 关键路径指示 */}
                      {task.isOnCriticalPath && (
                        <div className="w-2 h-2 bg-red-500 rounded-full ml-auto" title="关键路径" />
                      )}
                    </div>
                  </div>

                  {/* 甘特条区域 */}
                  <div className="flex-1 relative">
                    {/* 甘特条 */}
                    <div
                      className={`absolute top-2 h-8 rounded-md cursor-pointer transition-all ${
                        task.isOnCriticalPath 
                          ? 'bg-red-100 border border-red-300' 
                          : task.status === 'completed'
                          ? 'bg-green-100 border border-green-300'
                          : task.status === 'in-progress'
                          ? 'bg-blue-100 border border-blue-300'
                          : task.status === 'blocked'
                          ? 'bg-red-100 border border-red-300'
                          : 'bg-gray-100 border border-gray-300'
                      } ${selectedTaskId === task.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: `${task.startX}px`,
                        width: `${task.width}px`
                      }}
                      onClick={() => onTaskSelect(task.id)}
                      title={`${task.title}
开始: ${formatDate(task.startDate)}
结束: ${formatDate(task.endDate)}
进度: ${task.progress}%
状态: ${task.status === 'completed' ? '已完成' : task.status === 'in-progress' ? '进行中' : task.status === 'blocked' ? '已阻塞' : '待开始'}
${task.isOnCriticalPath ? '关键路径任务' : ''}`}
                    >
                      {/* 进度条 */}
                      <div
                        className={`h-full rounded-md ${
                          task.isOnCriticalPath 
                            ? 'bg-red-500' 
                            : task.status === 'completed'
                            ? 'bg-green-500'
                            : task.status === 'in-progress'
                            ? 'bg-blue-500'
                            : task.status === 'blocked'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                      
                      {/* 进度文本 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部时间轴 */}
      <div className="flex-shrink-0 border-t bg-gray-50">
        <div className="flex">
          <div className="w-64 p-2 border-r bg-white"></div>
          <div className="flex-1 relative h-12">
            <svg width="100%" height="100%" className="absolute inset-0">
              {timelineHeaders.filter((_, index) => index % Math.max(1, Math.floor(7 / timeScale * 20)) === 0).map((header, index) => (
                <g key={index}>
                  <line
                    x1={header.x}
                    y1="0"
                    x2={header.x}
                    y2="100%"
                    stroke="#d1d5db"
                    strokeWidth="1"
                  />
                  <text
                    x={header.x + 5}
                    y="20"
                    className="text-xs fill-gray-600"
                    style={{ fontSize: '10px' }}
                  >
                    {header.date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
