import { motion } from 'motion/react'
import { Check, AlertTriangle } from 'lucide-react'
import { Deadline, getDaysRemaining } from '../model'

type Props = {
  deadline: Deadline
  onClick?: (deadline: Deadline) => void
  onToggle?: (id: string) => void
  compact?: boolean // 紧凑模式用于周视图列
}

export default function DeadlineItem({ deadline, onClick, onToggle, compact = false }: Props) {
  const daysRemaining = getDaysRemaining(deadline.deadlineDate)
  const isCompleted = deadline.status === 'completed'

  // 根据剩余天数决定紧急程度（已完成时使用灰色）
  const getUrgencyStyle = () => {
    if (isCompleted) {
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-400', label: '已完成' }
    }
    if (daysRemaining < 0) {
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', label: '已过期' }
    }
    if (daysRemaining === 0) {
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', label: '今天' }
    }
    if (daysRemaining <= 2) {
      return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: `${daysRemaining}天后` }
    }
    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', label: `${daysRemaining}天后` }
  }

  const urgency = getUrgencyStyle()

  const handleClick = () => {
    if (onClick) {
      onClick(deadline)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止冒泡，避免触发 onClick
    if (onToggle) {
      onToggle(deadline.id)
    }
  }

  // 获取复选框的边框颜色（红色保留给系统标识过期状态）
  const getCheckboxBorderColor = () => {
    if (isCompleted) return 'border-gray-400'
    const color = deadline.themeColor || '#3b82f6'
    // 根据 themeColor 返回对应的边框颜色类
    if (color === '#3b82f6') return 'border-blue-500'
    if (color === '#8b5cf6') return 'border-purple-500'
    if (color === '#10b981') return 'border-green-500'
    if (color === '#f59e0b') return 'border-amber-500'
    if (color === '#6366f1') return 'border-indigo-500'
    return 'border-blue-500'
  }

  // 紧凑模式 - 用于周视图列
  if (compact) {
    return (
      <motion.div
        onClick={handleClick}
        className={`relative p-2 rounded-lg border ${urgency.border} ${urgency.bg} cursor-pointer hover:shadow-md transition-all`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        <div className="flex items-start gap-1.5">
          {/* 复选框 */}
          <motion.button
            onClick={handleToggle}
            className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
              isCompleted
                ? 'bg-gray-400 text-white'
                : `border-2 ${getCheckboxBorderColor()} hover:bg-gray-100`
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCompleted && <Check className="w-2.5 h-2.5 -rotate-12" />}
          </motion.button>

          <div className="flex-1 min-w-0">
            {/* 标题 */}
            <span className={`text-xs font-medium line-clamp-2 leading-tight ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {deadline.title}
            </span>

            {/* 紧急标签 */}
            {!isCompleted && daysRemaining <= 2 && (
              <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-medium ${urgency.text}`}>
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>{urgency.label}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // 标准模式
  return (
    <motion.div
      onClick={handleClick}
      className={`relative p-3 rounded-xl border ${urgency.border} ${urgency.bg} cursor-pointer transition-all`}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="flex items-start gap-3">
        {/* 复选框 */}
        <motion.button
          onClick={handleToggle}
          className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-gray-400 text-white'
              : `border-2 ${getCheckboxBorderColor()} hover:bg-gray-100`
          }`}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCompleted && <Check className="w-3 h-3 -rotate-12" />}
        </motion.button>

        <div className="flex-1 min-w-0">
          {/* 标题行 */}
          <div className="flex items-start justify-between gap-2">
            <span className={`font-medium truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {deadline.title}
            </span>

            {/* 紧急标签 */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${urgency.text} ${!isCompleted && daysRemaining <= 0 ? 'bg-white/60' : ''}`}>
              {!isCompleted && daysRemaining <= 2 && <AlertTriangle className="w-3 h-3" />}
              <span>{urgency.label}</span>
            </div>
          </div>

          {/* 描述 */}
          {deadline.description && (
            <p className={`mt-1 text-sm line-clamp-2 ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
              {deadline.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

