import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Task, Connection } from '../types'
import TaskNode from './TaskNode'
import ConnectionLine from './ConnectionLine'
import { calculateCriticalPath } from '../utils/criticalPath'

interface NetworkDiagramProps {
  tasks: Task[]
  connections: Connection[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskSelect: (taskId: string | null) => void
  onTaskEdit: (taskId: string) => void
  onConnectionCreate: (from: string, to: string) => void
  selectedTaskId: string | null
}

export default function NetworkDiagram({
  tasks,
  connections,
  onTaskUpdate,
  onTaskSelect,
  onTaskEdit,
  onConnectionCreate,
  selectedTaskId
}: NetworkDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showCriticalPath, setShowCriticalPath] = useState(true)
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // 计算关键路径和更新任务信息
  const { updatedTasks, criticalTasks, projectDuration } = useMemo(() => {
    if (tasks.length === 0) {
      return { updatedTasks: [], criticalTasks: [], projectDuration: 0 }
    }
    return calculateCriticalPath(tasks)
  }, [tasks])

  // 判断连接是否在关键路径上
  const isConnectionOnCriticalPath = useCallback((connection: Connection) => {
    const fromTask = updatedTasks.find(t => t.id === connection.from)
    const toTask = updatedTasks.find(t => t.id === connection.to)
    return fromTask?.isOnCriticalPath && toTask?.isOnCriticalPath
  }, [updatedTasks])

  // 处理画布拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y })
    }
  }, [viewport.x, viewport.y])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 更新鼠标位置（用于连接预览线）
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const svgX = (e.clientX - rect.left - viewport.x) / viewport.zoom
      const svgY = (e.clientY - rect.top - viewport.y) / viewport.zoom
      setMousePosition({ x: svgX, y: svgY })
    }

    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }))
    }
  }, [isDragging, dragStart, viewport.x, viewport.y, viewport.zoom])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 处理缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(3, prev.zoom * delta))
    }))
  }, [])

  // 处理任务连接
  const handleTaskConnect = useCallback((taskId: string) => {
    if (!isConnecting) {
      // 开始连接模式
      setIsConnecting(true)
      setConnectionStart(taskId)
    } else if (connectionStart && connectionStart !== taskId) {
      // 完成连接
      onConnectionCreate(connectionStart, taskId)
      setIsConnecting(false)
      setConnectionStart(null)
    } else if (connectionStart === taskId) {
      // 点击同一个任务，取消连接
      setIsConnecting(false)
      setConnectionStart(null)
    }
  }, [isConnecting, connectionStart, onConnectionCreate])

  // 取消连接模式
  const cancelConnection = useCallback(() => {
    setIsConnecting(false)
    setConnectionStart(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelConnection()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [cancelConnection])

  // 监听 SVG 容器大小变化
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        setSvgDimensions({ width: rect.width, height: rect.height })
      }
    }
    
    // 延迟执行，确保容器已经渲染
    const timer = setTimeout(updateDimensions, 100)
    
    // 使用 ResizeObserver 监听容器大小变化
    let resizeObserver: ResizeObserver | null = null
    if (svgRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateDimensions)
      resizeObserver.observe(svgRef.current)
    }
    
    window.addEventListener('resize', updateDimensions)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateDimensions)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [tasks]) // 当任务变化时重新计算尺寸

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 工具栏 - 更紧凑的设计 */}
      <div className="absolute top-3 left-3 z-10 flex gap-1">
        <button
          onClick={() => {
            setIsConnecting(!isConnecting)
            if (isConnecting) {
              setConnectionStart(null)
            }
          }}
          className={`px-2 py-1 text-xs rounded-md shadow-sm transition-all flex items-center gap-1 ${
            isConnecting 
              ? 'bg-blue-600 text-white shadow-blue-200' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {isConnecting ? (
            <>
              <span>✕</span>
              <span>取消连接</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>连接任务</span>
            </>
          )}
        </button>
        <button
          onClick={() => setShowCriticalPath(!showCriticalPath)}
          className={`px-2 py-1 text-xs rounded-md shadow-sm transition-all ${
            showCriticalPath 
              ? 'bg-red-600 text-white shadow-red-200' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          关键路径
        </button>
        <button
          onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
          className="px-2 py-1 text-xs bg-white text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 shadow-sm transition-all"
        >
          重置
        </button>
      </div>

      {/* 缩放控制 - 更紧凑的设计 */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white border border-gray-200 rounded-md shadow-sm">
        <button
          onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }))}
          className="w-6 h-6 hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <span className="text-xs text-gray-600 px-2 py-1 border-x border-gray-200">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))}
          className="w-6 h-6 hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* SVG画布 */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          background: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)', 
          backgroundSize: '25px 25px'
        }}
      >
        <g
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
        >
          {/* 网格背景 */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid)" />

          {/* 连接预览线 */}
          {isConnecting && connectionStart && (() => {
            const startTask = updatedTasks.find(t => t.id === connectionStart)
            if (!startTask) return null
            
            const startX = startTask.position.x + 200
            const startY = startTask.position.y + 65
            const endX = mousePosition.x
            const endY = mousePosition.y
            
            // 计算控制点，创建平滑的贝塞尔曲线
            const controlPointOffset = Math.abs(endX - startX) * 0.5
            const cp1X = startX + controlPointOffset
            const cp1Y = startY
            const cp2X = endX - controlPointOffset
            const cp2Y = endY
            
            return (
              <path
                d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`}
                stroke="#3B82F6"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8,4"
                className="opacity-60"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
              />
            )
          })()}

          {/* 连接线 */}
          {connections.map(connection => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              tasks={updatedTasks}
              isOnCriticalPath={showCriticalPath && isConnectionOnCriticalPath(connection)}
            />
          ))}

          {/* 任务节点 */}
          {updatedTasks.map(task => (
            <TaskNode
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              isConnecting={isConnecting}
              isConnectionStart={connectionStart === task.id}
              onSelect={() => onTaskSelect(task.id)}
              onEdit={() => onTaskEdit(task.id)}
              onUpdate={(updates) => onTaskUpdate(task.id, updates)}
              onConnect={() => handleTaskConnect(task.id)}
            />
          ))}
        </g>
      </svg>

      {/* 项目统计信息 */}
      {criticalTasks.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-white border border-gray-200 rounded-md shadow-sm p-2 text-xs">
          <div className="space-y-1">
            <div className="font-medium text-gray-700">项目统计</div>
            <div className="text-gray-600">
              总工期: <span className="font-medium">{projectDuration}天</span>
            </div>
            <div className="text-gray-600">
              关键任务: <span className="font-medium text-red-600">{criticalTasks.length}个</span>
            </div>
            <div className="text-gray-600">
              总任务: <span className="font-medium">{updatedTasks.length}个</span>
            </div>
            <div className="text-gray-500 text-xs mt-1">
              画布: {Math.round(svgDimensions.width)}×{Math.round(svgDimensions.height)}
            </div>
          </div>
        </div>
      )}

      {/* 连接模式提示 */}
      {isConnecting && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-20 text-sm">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <div>
              {connectionStart ? (
                <div>
                  <div className="font-medium">步骤 2: 选择目标任务</div>
                  <div className="text-xs text-blue-200 mt-1">
                    鼠标悬停任务显示连接点，点击左侧输入点完成连接
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-medium">步骤 1: 选择起始任务</div>
                  <div className="text-xs text-blue-200 mt-1">
                    鼠标悬停任务显示连接点，点击右侧输出点开始连接
                  </div>
                </div>
              )}
              <div className="text-xs text-blue-200 mt-1">按 ESC 取消连接</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
