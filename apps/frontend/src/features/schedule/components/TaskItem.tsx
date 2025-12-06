import { motion } from 'motion/react'
import { Task } from '../model'

const colorMap = {
  green: { checkbox: 'border-green-500', bg: 'bg-green-50', text: 'text-green-800' },
  purple: { checkbox: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-800' },
  indigo: { checkbox: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  teal: { checkbox: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-800' },
  orange: { checkbox: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-800' },
  red: { checkbox: 'border-red-500', bg: 'bg-red-50', text: 'text-red-800' },
  blue: { checkbox: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-800' },
  pink: { checkbox: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-800' },
  gray: { checkbox: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-500 line-through' },
} as const

type Props = {
  task: Task
  onToggle: (id: string) => void
  onTaskClick?: (task: Task) => void
  compact?: boolean
  readOnly?: boolean
}

export default function TaskItem({ task, onToggle, onTaskClick, compact, readOnly = false }: Props) {
  const isCompleted = task.status === 'completed'
  const effectiveColor = isCompleted ? 'gray' : ((task.goalColor && task.goalColor in colorMap) ? task.goalColor : 'green') as keyof typeof colorMap

  return (
    <div
      className={`task-item ${compact ? 'inline-flex items-center gap-2 p-1.5 pr-3 rounded-full' : 'flex items-start gap-4'}`}
      style={{ fontSize: '15px' }}
    >
      {task.startTime ? (
        <div className="w-16 text-right pt-3 flex-shrink-0">
          <div className="text-sm text-gray-500" style={{ fontSize: '14px' }}>{task.startTime}</div>
          {task.endTime && (
            <div className="text-xs text-gray-400 mt-0.5" style={{ fontSize: '12px' }}>{task.endTime}</div>
          )}
        </div>
      ) : null}
      <div className={compact ? '' : 'flex-1 flex items-start gap-3 min-w-0'}>
        <motion.button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!readOnly) {
              onToggle(task.id)
            }
          }}
          disabled={readOnly}
          className={compact
            ? `w-5 h-5 rounded-full flex-shrink-0 transition-all ${isCompleted ? 'bg-gray-400 text-white' : 'border-2 ' + colorMap[effectiveColor].checkbox} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`
            : `mt-2 w-5 h-5 rounded-full flex-shrink-0 transition-all flex items-center justify-center ${isCompleted ? 'bg-gray-400 text-white' : 'border-2 ' + colorMap[effectiveColor].checkbox} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          whileHover={!readOnly ? { scale: 1.2 } : undefined}
          whileTap={!readOnly ? { scale: 0.95 } : undefined}
        />
        <motion.div
          layoutId={onTaskClick ? `task-${task.id}` : undefined}
          className={`${compact ? colorMap[effectiveColor].bg : `task-content p-3 rounded-lg flex-1 min-w-0 ${colorMap[effectiveColor].bg}`} ${onTaskClick ? 'cursor-pointer' : ''} ${task.conflictStatus === 'conflict' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => onTaskClick?.(task)}
          whileHover={onTaskClick ? {
            scale: 1.02,
            y: -2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: { duration: 0.2, ease: "easeOut" }
          } : undefined}
          whileTap={onTaskClick ? {
            scale: 0.98,
            y: 0,
            transition: { duration: 0.1, ease: "easeInOut" }
          } : undefined}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold leading-5 break-words ${isCompleted ? colorMap.gray.text : ''}`}
                style={{ fontSize: '15px' }}
              >
                {task.title}
              </p>
              {task.description ? (
                <p
                  className="text-sm text-gray-600 mt-1 break-words"
                  style={{ fontSize: '14px' }}
                >
                  {task.description}
                </p>
              ) : null}
            </div>
            {task.conflictStatus === 'conflict' && (
              <div className="flex-shrink-0 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded whitespace-nowrap">
                冲突
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
