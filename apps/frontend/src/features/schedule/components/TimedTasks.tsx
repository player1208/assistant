import { useState } from 'react'
import { Check, Phone } from 'lucide-react'

type TimedTask = {
  time: string
  title: string
  description?: string
  status: 'pending' | 'completed'
  goalColor?: 'indigo' | 'purple' | 'teal' | 'green'
  isUrgent?: boolean
}

const colorMap = {
  green: { checkbox: 'border-green-500', bg: 'bg-green-50', text: 'text-green-800' },
  purple: { checkbox: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-800' },
  indigo: { checkbox: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  teal: { checkbox: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-800' },
  gray: { checkbox: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-500 line-through' },
} as const

export default function TimedTasks({ tasks: initialTasks }: { tasks: TimedTask[] }) {
  const [tasks, setTasks] = useState(initialTasks)

  const handleTaskToggle = (index: number) => {
    setTasks(prevTasks => 
      prevTasks.map((task, idx) => 
        idx === index 
          ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
          : task
      )
    )
  }

  return (
    <div id="schedule-content" className="p-4 space-y-4">
      {tasks.map((task, idx) => {
        const isCompleted = task.status === 'completed'
        const effectiveColor = isCompleted ? 'gray' : task.goalColor || 'green'
        
        let contentClasses = 'p-3 rounded-lg w-full'
        if (!isCompleted && task.isUrgent) {
          contentClasses += ` ${colorMap[effectiveColor].bg} border-2 border-red-600 shadow-sm`
        } else {
          contentClasses += ` ${colorMap[effectiveColor].bg}`
        }
        
        return (
          <div 
            key={idx} 
            className="task-item flex items-start gap-4"
            data-status={task.status}
            data-goal-color={task.goalColor || 'green'}
            data-is-urgent={!!task.isUrgent}
          >
            <div className="text-sm text-gray-500 w-16 text-right pt-3">{task.time}</div>
            <div className="flex-1 flex items-start gap-3">
              <button 
                className={`task-checkbox mt-2 w-5 h-5 rounded-full flex-shrink-0 transition-all flex items-center justify-center ${
                  isCompleted ? 'bg-gray-400 text-white' : `border-2 ${task.isUrgent ? 'border-red-600' : colorMap[effectiveColor].checkbox}`
                }`}
                onClick={() => handleTaskToggle(idx)}
              >
                {isCompleted && <Check className="w-3 h-3 -rotate-12" />}
              </button>
              <div className={`task-content ${contentClasses}`}>
                <p className={`task-title font-semibold ${isCompleted ? colorMap.gray.text : ''}`}>{task.title}</p>
                {task.description ? <p className="text-sm text-gray-600 mt-1">{task.description}</p> : null}
                {task.isUrgent ? (
                  <div className={`flex items-center gap-2 mt-2 text-xs ${colorMap[effectiveColor].text} font-bold`}>
                    <Phone className="w-3 h-3" />
                    <span>电话预警</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


