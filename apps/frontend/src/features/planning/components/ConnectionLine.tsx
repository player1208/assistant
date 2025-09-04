import { Connection, Task } from '../types'

interface ConnectionLineProps {
  connection: Connection
  tasks: Task[]
}

export default function ConnectionLine({ connection, tasks }: ConnectionLineProps) {
  const fromTask = tasks.find(task => task.id === connection.from)
  const toTask = tasks.find(task => task.id === connection.to)

  if (!fromTask || !toTask) {
    return null
  }

  // 计算连接点位置
  const fromX = fromTask.position.x + 200 // 右侧连接点
  const fromY = fromTask.position.y + 60
  const toX = toTask.position.x // 左侧连接点
  const toY = toTask.position.y + 60

  // 计算控制点，创建平滑的贝塞尔曲线
  const controlPointOffset = Math.abs(toX - fromX) * 0.5
  const cp1X = fromX + controlPointOffset
  const cp1Y = fromY
  const cp2X = toX - controlPointOffset
  const cp2Y = toY

  // 计算箭头方向
  const angle = Math.atan2(toY - fromY, toX - fromX)
  const arrowLength = 10
  const arrowAngle = Math.PI / 6

  const arrowX1 = toX - arrowLength * Math.cos(angle - arrowAngle)
  const arrowY1 = toY - arrowLength * Math.sin(angle - arrowAngle)
  const arrowX2 = toX - arrowLength * Math.cos(angle + arrowAngle)
  const arrowY2 = toY - arrowLength * Math.sin(angle + arrowAngle)

  // 根据连接类型选择颜色
  const getConnectionColor = () => {
    switch (connection.type) {
      case 'finish-to-start':
        return '#3B82F6' // 蓝色
      case 'start-to-start':
        return '#10B981' // 绿色
      case 'finish-to-finish':
        return '#F59E0B' // 黄色
      case 'start-to-finish':
        return '#EF4444' // 红色
      default:
        return '#6B7280' // 灰色
    }
  }

  const getConnectionLabel = () => {
    switch (connection.type) {
      case 'finish-to-start':
        return 'FS'
      case 'start-to-start':
        return 'SS'
      case 'finish-to-finish':
        return 'FF'
      case 'start-to-finish':
        return 'SF'
      default:
        return ''
    }
  }

  return (
    <g>
      {/* 连接线阴影 */}
      <path
        d={`M ${fromX} ${fromY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${toX} ${toY}`}
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="4"
        fill="none"
      />
      
      {/* 连接线 */}
      <path
        d={`M ${fromX} ${fromY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${toX} ${toY}`}
        stroke={getConnectionColor()}
        strokeWidth="3"
        fill="none"
        className="hover:stroke-4 transition-all cursor-pointer"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
      />

      {/* 箭头阴影 */}
      <path
        d={`M ${toX} ${toY} L ${arrowX1} ${arrowY1} M ${toX} ${toY} L ${arrowX2} ${arrowY2}`}
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* 箭头 */}
      <path
        d={`M ${toX} ${toY} L ${arrowX1} ${arrowY1} M ${toX} ${toY} L ${arrowX2} ${arrowY2}`}
        stroke={getConnectionColor()}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* 连接类型标签 */}
      <circle
        cx={(fromX + toX) / 2}
        cy={(fromY + toY) / 2}
        r="14"
        fill="white"
        stroke={getConnectionColor()}
        strokeWidth="2"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      />
      <text
        x={(fromX + toX) / 2}
        y={(fromY + toY) / 2 + 4}
        textAnchor="middle"
        className="text-xs font-bold"
        fill={getConnectionColor()}
        style={{ fontSize: '11px' }}
      >
        {getConnectionLabel()}
      </text>
    </g>
  )
}
