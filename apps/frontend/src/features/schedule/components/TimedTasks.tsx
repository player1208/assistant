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

export default function TimedTasks({ tasks }: { tasks: TimedTask[] }) {
  return (
    <div className="p-4 space-y-4">
      {tasks.map((task, idx) => {
        const isCompleted = task.status === 'completed'
        const effectiveColor = isCompleted ? 'gray' : task.goalColor || 'green'
        const contentClasses = `${task.isUrgent && !isCompleted ? `${colorMap[effectiveColor].bg} border-2 border-red-600 shadow-sm` : colorMap[effectiveColor].bg}`
        return (
          <div key={idx} className="task-item flex items-start gap-4">
            <div className="text-sm text-gray-500 w-16 text-right pt-3">{task.time}</div>
            <div className="flex-1 flex items-start gap-3">
              <button className={`mt-2 w-5 h-5 rounded-full flex-shrink-0 transition-all ${isCompleted ? 'bg-gray-400 text-white' : `border-2 ${task.isUrgent ? 'border-red-600' : colorMap[effectiveColor].checkbox}`}`}></button>
              <div className={`p-3 rounded-lg w-full ${contentClasses}`}>
                <p className={`font-semibold ${isCompleted ? colorMap.gray.text : ''}`}>{task.title}</p>
                {task.description ? <p className="text-sm text-gray-600 mt-1">{task.description}</p> : null}
                {task.isUrgent ? (
                  <div className={`flex items-center gap-2 mt-2 text-xs ${colorMap[effectiveColor].text} font-bold`}>
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


