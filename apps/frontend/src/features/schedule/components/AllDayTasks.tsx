import { motion } from 'motion/react'
import TaskItem from './TaskItem'
import { Task } from '../model'

export default function AllDayTasks({
  tasks,
  onToggle,
  onTaskClick,
  readOnly = false
}: {
  tasks: Task[]
  onToggle: (id: string) => void
  onTaskClick?: (task: Task) => void
  readOnly?: boolean
}) {
  return (
    <div
      className="bg-white px-4 py-3 mt-2 min-h-[52px]"
      style={{ boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.10), inset 0 -1px 0 rgba(0,0,0,0.10)' }}
    >
      <div className="flex gap-4 items-center">
        <div className="text-sm font-semibold text-blue-600 w-16 text-right">全天</div>
        <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[24px]">
          {tasks.map((task) => (
            <AllDayTaskItem key={task.id} task={task} onToggle={onToggle} onTaskClick={onTaskClick} readOnly={readOnly} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AllDayTaskItem({ task, onToggle, onTaskClick, readOnly = false }: { task: Task; onToggle: (id: string) => void; onTaskClick?: (task: Task) => void; readOnly?: boolean }) {
  const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-800', ring: 'ring-green-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-800', ring: 'ring-purple-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-800', ring: 'ring-indigo-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-800', ring: 'ring-teal-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-800', ring: 'ring-orange-200' },
    red: { bg: 'bg-red-50', text: 'text-red-800', ring: 'ring-red-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-800', ring: 'ring-blue-200' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-800', ring: 'ring-pink-200' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-500 line-through', ring: 'ring-gray-200' },
  }
  const palette = task.status === 'completed' ? colorClasses.gray : (colorClasses[task.goalColor] || colorClasses.green)

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 shadow-sm ring-1 ${palette.bg} ${palette.text} ${palette.ring} ${task.conflictStatus === 'conflict' ? 'ring-2 ring-red-500' : ''}`}
      style={{ fontSize: '14px' }}
    >
      <button
        aria-label="toggle"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!readOnly) {
            onToggle(task.id)
          }
        }}
        disabled={readOnly}
        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
          task.status === 'completed' ? 'bg-gray-400 text-white border-gray-400' : 'border-current'
        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {task.status === 'completed' ? (
          <svg viewBox="0 0 20 20" className="w-3 h-3 -rotate-12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 10l3 3 7-7" />
          </svg>
        ) : null}
      </button>
      <span
        className={`${task.status === 'completed' ? 'line-through' : ''} ${onTaskClick ? 'cursor-pointer' : ''}`}
        onClick={() => onTaskClick?.(task)}
      >
        {task.title}
      </span>
      {task.conflictStatus === 'conflict' && (
        <span className="text-red-600 font-bold text-xs ml-1">⚠️</span>
      )}
    </div>
  )
}


