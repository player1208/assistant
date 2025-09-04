import { useState, useCallback } from 'react'
import { Project, Task, Connection } from '../types'
import NetworkDiagram from '../components/NetworkDiagram'
import TaskEditor from '../components/TaskEditor'

// 模拟数据
const mockProjects: Project[] = [
  {
    id: '1',
    name: '我的第一个项目',
    description: '这是一个示例项目',
    color: '#3B82F6',
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [
      {
        id: 'task-1',
        title: '需求分析',
        description: '分析项目需求',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        status: 'completed',
        priority: 'high',
        dependencies: [],
        position: { x: 100, y: 100 },
        progress: 100,
        estimatedHours: 40
      },
      {
        id: 'task-2',
        title: '系统设计',
        description: '设计系统架构',
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-10'),
        status: 'in-progress',
        priority: 'high',
        dependencies: ['task-1'],
        position: { x: 400, y: 100 },
        progress: 60,
        estimatedHours: 60
      },
      {
        id: 'task-3',
        title: '前端开发',
        description: '开发用户界面',
        startDate: new Date('2024-01-11'),
        endDate: new Date('2024-01-20'),
        status: 'pending',
        priority: 'medium',
        dependencies: ['task-2'],
        position: { x: 100, y: 300 },
        progress: 0,
        estimatedHours: 80
      },
      {
        id: 'task-4',
        title: '后端开发',
        description: '开发API服务',
        startDate: new Date('2024-01-11'),
        endDate: new Date('2024-01-25'),
        status: 'pending',
        priority: 'medium',
        dependencies: ['task-2'],
        position: { x: 400, y: 300 },
        progress: 0,
        estimatedHours: 100
      },
      {
        id: 'task-5',
        title: '测试部署',
        description: '测试和部署应用',
        startDate: new Date('2024-01-26'),
        endDate: new Date('2024-01-30'),
        status: 'pending',
        priority: 'high',
        dependencies: ['task-3', 'task-4'],
        position: { x: 250, y: 500 },
        progress: 0,
        estimatedHours: 40
      }
    ]
  }
]

const mockConnections: Connection[] = [
  { id: 'conn-1', from: 'task-1', to: 'task-2', type: 'finish-to-start' },
  { id: 'conn-2', from: 'task-2', to: 'task-3', type: 'finish-to-start' },
  { id: 'conn-3', from: 'task-2', to: 'task-4', type: 'finish-to-start' },
  { id: 'conn-4', from: 'task-3', to: 'task-5', type: 'finish-to-start' },
  { id: 'conn-5', from: 'task-4', to: 'task-5', type: 'finish-to-start' }
]

export default function PlanningPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [currentProjectId, setCurrentProjectId] = useState('1')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>(mockConnections)
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false)

  const currentProject = projects.find(p => p.id === currentProjectId)
  const selectedTask = currentProject?.tasks.find(t => t.id === selectedTaskId)

  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === currentProjectId 
          ? {
              ...project,
              tasks: project.tasks.map(task => 
                task.id === taskId 
                  ? { ...task, ...updates }
                  : task
              )
            }
          : project
      )
    )
  }, [currentProjectId])

  const handleTaskSelect = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId)
    // 只选中，不打开编辑页面
  }, [])

  const handleTaskEdit = useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskEditorOpen(true)
  }, [])

  const handleConnectionCreate = useCallback((from: string, to: string) => {
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      from,
      to,
      type: 'finish-to-start'
    }
    setConnections(prev => [...prev, newConnection])
  }, [])

  const handleAddTask = useCallback(() => {
    if (currentProject) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: '新任务',
        description: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        progress: 0,
        estimatedHours: 8
      }
      
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === currentProjectId 
            ? {
                ...project,
                tasks: [...project.tasks, newTask]
              }
            : project
        )
      )
    }
  }, [currentProject, currentProjectId])

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 紧凑的侧边栏 */}
      <aside className="w-40 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">项目</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setCurrentProjectId(project.id)}
              className={`w-full text-left p-2 rounded-md text-xs hover:bg-gray-50 transition-colors ${
                currentProjectId === project.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600'
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-gray-200">
          <button className="w-full flex items-center justify-center gap-1 p-2 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            <span>+</span> 新项目
          </button>
        </div>
      </aside>
      
      {/* 主画布区域 */}
      <div className="flex-grow flex flex-col relative">
        {/* 紧凑的顶部工具栏 */}
        <div className="h-12 bg-white border-b border-gray-200 flex justify-between items-center px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-800">
              {currentProject?.name || '选择项目'}
            </h1>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {currentProject?.tasks.length || 0} 个任务
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleAddTask}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
            >
              + 新任务
            </button>
            <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 画布区域 - 占据剩余空间 */}
        <div className="flex-grow relative bg-white">
          {currentProject && (
            <NetworkDiagram
              tasks={currentProject.tasks}
              connections={connections}
              onTaskUpdate={handleTaskUpdate}
              onTaskSelect={handleTaskSelect}
              onTaskEdit={handleTaskEdit}
              onConnectionCreate={handleConnectionCreate}
              selectedTaskId={selectedTaskId}
            />
          )}
        </div>
      </div>

      {/* 任务编辑器 */}
      {isTaskEditorOpen && selectedTask && (
        <TaskEditor
          task={selectedTask}
          onUpdate={(updates) => {
            handleTaskUpdate(selectedTask.id, updates)
            setIsTaskEditorOpen(false)
          }}
          onClose={() => setIsTaskEditorOpen(false)}
        />
      )}
    </div>
  )
}


