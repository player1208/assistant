type Task = { title: string; status: 'pending' | 'completed'; goalColor?: 'indigo' | 'purple' | 'teal' | 'green' }

const colorMap = {
  green: { checkbox: 'border-green-500', bg: 'bg-green-50', text: 'text-green-800' },
  purple: { checkbox: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-800' },
  indigo: { checkbox: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  teal: { checkbox: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-800' },
  gray: { checkbox: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-500 line-through' },
} as const

export default function AllDayTasks({ tasks }: { tasks: Task[] }) {
  return (
    <div className="sticky z-10 bg-white px-4 py-3 border-b">
      <div className="flex gap-4">
        <div className="text-xs font-semibold text-blue-600 w-16 text-right pt-2 flex-shrink-0">全天</div>
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {tasks.map((task, idx) => {
            const color = task.status === 'completed' ? 'gray' : task.goalColor || 'green'
            return (
              <div key={idx} className={`inline-flex items-center gap-3 p-1.5 pr-4 rounded-full ${colorMap[color].bg}`}>
                <button className={`w-5 h-5 rounded-full bg-white flex-shrink-0 transition-all`}></button>
                <p className={`text-sm font-medium ${colorMap[color].text}`}>{task.title}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


