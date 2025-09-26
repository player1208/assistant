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
    <div className="p-4 space-y-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onTaskClick={onTaskClick} readOnly={readOnly} />
      ))}
    </div>
  )
}


