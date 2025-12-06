import TaskItem from './TaskItem'
import { Task } from '../model'

export default function TimedTasks({ 
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
    <div className="p-4 space-y-4 min-h-[100px]">
      {tasks.length === 0 ? (
        <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
          暂无任务
        </div>
      ) : (
        tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={onToggle} onTaskClick={onTaskClick} readOnly={readOnly} />
        ))
      )}
    </div>
  )
}


