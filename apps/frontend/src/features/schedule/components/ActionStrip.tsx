import { Edit3, Trash2 } from 'lucide-react'
import { Task } from '../model'
import { useComposeMode } from '../context/ComposeModeContext'

type Props = {
  allDayTasks: Task[]
  timedTasks: Task[]
  onDeleteTask: (id: string) => void
}

// 操作胶囊组件
function ActionPod({ task, onEdit, onDelete }: { task: Task; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-gray-100 rounded-lg p-1 flex gap-1 shadow-sm">
      <button
        onClick={onEdit}
        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-blue-600 transition-colors"
        aria-label={`编辑 ${task.title}`}
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-red-600 transition-colors"
        aria-label={`删除 ${task.title}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function ActionStrip({ allDayTasks, timedTasks, onDeleteTask }: Props) {
  const { startEditingTask } = useComposeMode()

  return (
    <div 
      className="w-24 flex-shrink-0 bg-gray-50 border-l border-gray-200"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* 全天任务区域 - 对应吸顶区域的高度 */}
      <div className="h-[73px] flex items-center justify-center border-b border-gray-200">
        <span className="text-xs text-gray-400 font-medium">操作</span>
      </div>

      {/* 全天任务操作胶囊 */}
      <div className="p-2 space-y-2">
        {allDayTasks.map((task) => (
          <div key={task.id} className="flex justify-center">
            <ActionPod
              task={task}
              onEdit={() => startEditingTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          </div>
        ))}
      </div>

      {/* 定时任务操作胶囊 */}
      <div className="p-2 space-y-4">
        {timedTasks.map((task) => (
          <div key={task.id} className="h-20 flex items-center justify-center">
            <ActionPod
              task={task}
              onEdit={() => startEditingTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
