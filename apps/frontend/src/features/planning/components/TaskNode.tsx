import { useState, useRef, useEffect } from 'react'
import { Task } from '../types'

interface TaskNodeProps {
  task: Task
  isSelected: boolean
  isConnecting: boolean
  isConnectionStart: boolean
  onSelect: () => void
  onEdit: () => void
  onUpdate: (updates: Partial<Task>) => void
  onConnect: () => void
}

const statusColors = {
  pending: 'bg-gray-100 border-gray-300 text-gray-700',
  'in-progress': 'bg-blue-100 border-blue-300 text-blue-700',
  completed: 'bg-green-100 border-green-300 text-green-700',
  blocked: 'bg-red-100 border-red-300 text-red-700'
}

const priorityColors = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-red-500'
}

const criticalPathColor = 'stroke-red-500 fill-red-50'
const normalPathColor = 'stroke-gray-300 fill-white'

export default function TaskNode({
  task,
  isSelected,
  isConnecting,
  isConnectionStart,
  onSelect,
  onEdit,
  onUpdate,
  onConnect
}: TaskNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredConnector, setHoveredConnector] = useState<'input' | 'output' | null>(null)
  const nodeRef = useRef<SVGGElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasDragged) {
      // 只有在没有拖拽的情况下才选中节点
      onSelect()
    }
    setHasDragged(false) // 重置拖拽状态
  }

  const handleConnectorClick = (e: React.MouseEvent, type: 'input' | 'output') => {
    e.stopPropagation()
    onConnect()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isConnecting) {
      setIsDragging(true)
      setDragStart({ 
        x: e.clientX - task.position.x, 
        y: e.clientY - task.position.y 
      })
      // 阻止默认行为
      e.preventDefault()
    }
  }

  // 使用全局事件监听器来处理拖拽
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && !isConnecting) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        
        // 计算拖拽距离
        const dragDistance = Math.sqrt(
          Math.pow(e.clientX - (dragStart.x + task.position.x), 2) + 
          Math.pow(e.clientY - (dragStart.y + task.position.y), 2)
        )
        
        // 如果拖拽距离超过5像素，标记为已拖拽
        if (dragDistance > 5) {
          setHasDragged(true)
        }
        
        onUpdate({
          position: { x: newX, y: newY }
        })
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      // 防止文本选择
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isDragging, dragStart, isConnecting, onUpdate, task.position.x, task.position.y])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleTitleSubmit = () => {
    if (editTitle.trim()) {
      onUpdate({ title: editTitle.trim() })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setEditTitle(task.title)
      setIsEditing(false)
    }
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return '✓'
      case 'in-progress':
        return '▶'
      case 'blocked':
        return '⚠'
      default:
        return '○'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const formatSlack = (slack?: number) => {
    if (slack === undefined) return ''
    return slack === 0 ? '关键' : `松弛${slack}天`
  }

  return (
    <g
      ref={nodeRef}
      transform={`translate(${task.position.x}, ${task.position.y})`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setHoveredConnector(null)
      }}
      className={`cursor-pointer ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* 节点背景 */}
      <rect
        width="200"
        height="130"
        rx="8"
        className={`${task.isOnCriticalPath ? criticalPathColor : normalPathColor} stroke-2 ${
          isSelected 
            ? 'stroke-blue-500' 
            : isConnectionStart
            ? 'stroke-blue-400'
            : task.isOnCriticalPath
            ? 'stroke-red-500'
            : 'stroke-gray-300'
        }`}
        style={{ 
          filter: isSelected 
            ? 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))' 
            : task.isOnCriticalPath
            ? 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.3))'
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
      />

      {/* 关键路径指示器 */}
      {task.isOnCriticalPath && (
        <rect
          x="0"
          y="0"
          width="8"
          height="130"
          rx="8 0 0 8"
          className="fill-red-500"
        />
      )}

      {/* 状态指示器 */}
      <circle
        cx="20"
        cy="20"
        r="8"
        className={`${statusColors[task.status].split(' ')[0]} stroke-2 ${statusColors[task.status].split(' ')[1]}`}
      />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        className="text-xs font-bold fill-current"
        style={{ fontSize: '10px' }}
      >
        {getStatusIcon()}
      </text>

      {/* 任务标题 */}
      {isEditing ? (
        <foreignObject x="35" y="10" width="155" height="25">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            className="w-full h-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </foreignObject>
      ) : (
        <text
          x="35"
          y="25"
          className="text-sm font-semibold fill-gray-800"
          style={{ fontSize: '12px' }}
        >
          {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
        </text>
      )}

      {/* 进度条 */}
      <rect
        x="35"
        y="35"
        width="130"
        height="6"
        rx="3"
        className="fill-gray-200"
      />
      <rect
        x="35"
        y="35"
        width={`${(task.progress / 100) * 130}`}
        height="6"
        rx="3"
        className="fill-blue-500"
      />
      <text
        x="100"
        y="50"
        textAnchor="middle"
        className="text-xs fill-gray-600"
        style={{ fontSize: '10px' }}
      >
        {task.progress}%
      </text>

      {/* 日期信息 */}
      <text
        x="35"
        y="70"
        className="text-xs fill-gray-500"
        style={{ fontSize: '10px' }}
      >
        开始: {formatDate(task.startDate)}
      </text>
      <text
        x="35"
        y="85"
        className="text-xs fill-gray-500"
        style={{ fontSize: '10px' }}
      >
        结束: {formatDate(task.endDate)}
      </text>

      {/* 松弛时间/关键路径指示 */}
      <text
        x="35"
        y="105"
        className={`text-xs ${task.isOnCriticalPath ? 'fill-red-600 font-bold' : 'fill-gray-500'}`}
        style={{ fontSize: '9px' }}
      >
        {formatSlack(task.slack)}
      </text>

      {/* 持续时间指示 */}
      <text
        x="35"
        y="120"
        className="text-xs fill-gray-400"
        style={{ fontSize: '9px' }}
      >
        工期: {task.duration || 0}天
      </text>

      {/* 连接点 - 右侧输出点 */}
      {(isHovered || isConnecting || isConnectionStart) && (
        <g>
          <circle
            cx="200"
            cy="65"
            r="8"
            className={`fill-white stroke-2 ${
              isConnectionStart 
                ? 'stroke-blue-500 fill-blue-50' 
                : hoveredConnector === 'output' || isConnecting
                ? 'stroke-green-500 fill-green-50'
                : 'stroke-gray-400'
            } transition-all cursor-pointer`}
            onMouseEnter={() => setHoveredConnector('output')}
            onMouseLeave={() => setHoveredConnector(null)}
            onClick={(e) => handleConnectorClick(e, 'output')}
          />
          <circle
            cx="200"
            cy="65"
            r="4"
            className={`${
              isConnectionStart 
                ? 'fill-blue-500' 
                : hoveredConnector === 'output' || isConnecting
                ? 'fill-green-500'
                : 'fill-gray-400'
            } transition-colors pointer-events-none`}
          />
          {/* 输出连接点标签 */}
          {(hoveredConnector === 'output' || isConnectionStart) && (
            <text
              x="210"
              y="70"
              className="text-xs fill-gray-600 pointer-events-none"
              style={{ fontSize: '10px' }}
            >
              输出
            </text>
          )}
        </g>
      )}

      {/* 连接点 - 左侧输入点 */}
      {(isHovered || isConnecting) && !isConnectionStart && (
        <g>
          <circle
            cx="0"
            cy="65"
            r="8"
            className={`fill-white stroke-2 ${
              hoveredConnector === 'input' || isConnecting
                ? 'stroke-blue-500 fill-blue-50'
                : 'stroke-gray-400'
            } transition-all cursor-pointer`}
            onMouseEnter={() => setHoveredConnector('input')}
            onMouseLeave={() => setHoveredConnector(null)}
            onClick={(e) => handleConnectorClick(e, 'input')}
          />
          <circle
            cx="0"
            cy="65"
            r="4"
            className={`${
              hoveredConnector === 'input' || isConnecting
                ? 'fill-blue-500'
                : 'fill-gray-400'
            } transition-colors pointer-events-none`}
          />
          {/* 输入连接点标签 */}
          {hoveredConnector === 'input' && (
            <text
              x="-35"
              y="70"
              className="text-xs fill-gray-600 pointer-events-none"
              style={{ fontSize: '10px' }}
            >
              输入
            </text>
          )}
        </g>
      )}

      {/* 编辑按钮 - 只在选中时显示 */}
      {isSelected && (
        <g>
          <circle
            cx="180"
            cy="20"
            r="12"
            className="fill-white stroke-2 stroke-gray-300 hover:stroke-blue-500 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onEdit() // 直接触发编辑页面
            }}
          />
          <text
            x="180"
            y="25"
            textAnchor="middle"
            className="text-xs fill-gray-600 hover:fill-blue-600 transition-colors"
            style={{ fontSize: '10px' }}
          >
            ✏️
          </text>
        </g>
      )}
    </g>
  )
}
