import { motion } from 'motion/react'
import { Task } from '../model'

const colorMap = {
  green: { checkbox: 'border-green-500', bg: 'bg-green-50', text: 'text-green-800' },
  purple: { checkbox: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-800' },
  indigo: { checkbox: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  teal: { checkbox: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-800' },
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
  const effectiveColor = isCompleted ? 'gray' : (task.goalColor || 'green')

  return (
    <div className={`task-item ${compact ? 'inline-flex items-center gap-2 p-1.5 pr-3 rounded-full' : 'flex items-start gap-4'}`}>
      {task.time ? (
        <div className="text-sm text-gray-500 w-16 text-right pt-3">{task.time}</div>
      ) : null}
      <div className={compact ? '' : 'flex-1 flex items-start gap-3'}>
        <button
          onClick={() => !readOnly && onToggle(task.id)}
          disabled={readOnly}
          className={compact
            ? `w-5 h-5 rounded-full flex-shrink-0 transition-all ${isCompleted ? 'bg-gray-400 text-white' : 'border-2 ' + colorMap[effectiveColor].checkbox} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`
            : `mt-2 w-5 h-5 rounded-full flex-shrink-0 transition-all flex items-center justify-center ${isCompleted ? 'bg-gray-400 text-white' : 'border-2 ' + (task.isUrgent && !isCompleted ? 'border-red-600' : colorMap[effectiveColor].checkbox)} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
        />
        <motion.div
          layoutId={onTaskClick ? `task-${task.id}` : undefined}
          className={`${compact ? colorMap[effectiveColor].bg : `task-content p-3 rounded-lg w-full ${task.isUrgent && !isCompleted ? `${colorMap[effectiveColor].bg} border-2 border-red-600 shadow-sm` : colorMap[effectiveColor].bg}`} ${onTaskClick ? 'cursor-pointer' : ''}`}
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
          <motion.p 
            layoutId={onTaskClick ? `task-title-${task.id}` : undefined}
            className={`font-semibold leading-5 ${isCompleted ? colorMap.gray.text : ''}`}
          >
            {task.title}
          </motion.p>
          {task.description ? (
            <motion.p 
              layoutId={onTaskClick ? `task-desc-${task.id}` : undefined}
              className="text-sm text-gray-600 mt-1"
            >
              {task.description}
            </motion.p>
          ) : null}
          {task.isUrgent ? (
            <div className={`flex items-center gap-2 mt-2 text-xs ${colorMap[effectiveColor].text} font-bold`}>
              <span>电话预警</span>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
