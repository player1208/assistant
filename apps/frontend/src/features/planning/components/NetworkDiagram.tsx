import { useState, useRef, useCallback, useEffect } from 'react'
import { Task, Connection } from '../types'
import TaskNode from './TaskNode'
import ConnectionLine from './ConnectionLine'

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

  // 处理画布拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y })
    }
  }, [viewport.x, viewport.y])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }))
    }
  }, [isDragging, dragStart])

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

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 工具栏 - 更紧凑的设计 */}
      <div className="absolute top-3 left-3 z-10 flex gap-1">
        <button
          onClick={() => setIsConnecting(!isConnecting)}
          className={`px-2 py-1 text-xs rounded-md shadow-sm transition-all ${
            isConnecting 
              ? 'bg-blue-600 text-white shadow-blue-200' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {isConnecting ? '取消连接' : '连接'}
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
          backgroundSize: '25px 25px',
          minHeight: '100%'
        }}
        viewBox="0 0 100% 100%"
        preserveAspectRatio="none"
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
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* 连接线 */}
          {connections.map(connection => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              tasks={tasks}
            />
          ))}

          {/* 任务节点 */}
          {tasks.map(task => (
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

      {/* 连接模式提示 */}
      {isConnecting && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-lg z-20 text-xs">
          {connectionStart ? 
            '点击另一个任务的连接点完成连接' : 
            '点击任务节点的连接点开始连接'
          }
          <span className="ml-2 text-blue-200">ESC取消</span>
        </div>
      )}
    </div>
  )
}
