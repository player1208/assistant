import { useState, useCallback, useEffect } from 'react'
import { Plus, Trash2, PlusCircle, FolderSearch, Network, BarChart3, Calendar } from 'lucide-react'
import { Project, Task, Connection } from '../types'
import NetworkDiagram from '../components/NetworkDiagram'
import TaskEditor from '../components/TaskEditor'
import Overview from '../components/Overview'
import GanttChart from '../components/GanttChart'

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

type ViewMode = 'network' | 'gantt' | 'overview'

export default function PlanningPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [currentProjectId, setCurrentProjectId] = useState('1')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>(mockConnections)
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('network')
  const [viewKey, setViewKey] = useState(0) // 用于强制重新渲染组件

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

  const handleProjectUpdate = useCallback((updates: Partial<Project>) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === currentProjectId 
          ? { ...project, ...updates }
          : project
      )
    )
  }, [currentProjectId])

  // 处理视图切换时的状态重置
  useEffect(() => {
    // 当视图切换时，重置一些状态
    if (viewMode === 'overview') {
      // 概览模式：清理选中状态
      setSelectedTaskId(null)
    }
    // 网络图和甘特图模式保持当前选中状态不变
  }, [viewMode]) // 只依赖 viewMode，避免无限循环

  return (
    <div id="page-planning" className="h-full flex">
      <aside className="w-64 bg-white border-r flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">我的所有项目</h2>
        </div>
        <div id="project-list" className="flex-grow overflow-y-auto p-2 space-y-1">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setCurrentProjectId(project.id)}
              className={`project-item w-full text-left p-2 rounded-md text-sm hover:bg-gray-100 ${
                currentProjectId === project.id ? 'active' : ''
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>
        <div className="p-2 border-t">
          <button className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="w-4 h-4" />
            <span>创建新项目</span>
          </button>
        </div>
      </aside>
      
      <div className="flex-grow flex flex-col relative">
        <div id="planning-header" className="p-4 border-b bg-white flex justify-between items-center z-20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={currentProject?.name || '加载中...'} 
              onChange={(e) => {
                if (currentProject) {
                  handleProjectUpdate({ name: e.target.value })
                }
              }}
              className="text-xl lg:text-2xl font-bold bg-transparent focus:outline-none focus:bg-gray-100 rounded-lg p-1 -m-1"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* 视图切换按钮 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode('overview')
                  setViewKey(prev => prev + 1) // 强制重新渲染
                }}
                className={`px-3 py-1 text-sm rounded-md transition-all ${
                  viewMode === 'overview' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode('network')
                  setViewKey(prev => prev + 1) // 强制重新渲染
                }}
                className={`px-3 py-1 text-sm rounded-md transition-all ${
                  viewMode === 'network' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Network className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode('gantt')
                  setViewKey(prev => prev + 1) // 强制重新渲染
                }}
                className={`px-3 py-1 text-sm rounded-md transition-all ${
                  viewMode === 'gantt' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={handleAddTask}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新任务</span>
            </button>
            <button className="p-2 text-red-500 hover:bg-red-100 rounded-md">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {!currentProject ? (
          <div id="planning-empty-state" className="flex-grow items-center justify-center text-center">
            <div>
              <FolderSearch className="w-16 h-16 text-gray-300 mx-auto" />
              <h3 className="mt-2 text-lg font-medium text-gray-700">没有选中的项目</h3>
              <p className="mt-1 text-sm text-gray-500">请从左侧选择一个项目，或创建一个新项目。</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full flex-grow">
            {viewMode === 'overview' && (
              <Overview
                key={`overview-${viewKey}`}
                project={currentProject}
                onProjectUpdate={handleProjectUpdate}
              />
            )}
            
            {viewMode === 'network' && (
              <div key={`network-${viewKey}`} className="absolute inset-0 w-full h-full">
                <NetworkDiagram
                  tasks={currentProject.tasks}
                  connections={connections}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskSelect={handleTaskSelect}
                  onTaskEdit={handleTaskEdit}
                  onConnectionCreate={handleConnectionCreate}
                  selectedTaskId={selectedTaskId}
                />
              </div>
            )}
            
            {viewMode === 'gantt' && (
              <div key={`gantt-${viewKey}`} className="absolute inset-0 w-full h-full">
                <GanttChart
                  tasks={currentProject.tasks}
                  selectedTaskId={selectedTaskId}
                  onTaskSelect={handleTaskSelect}
                />
              </div>
            )}
          </div>
        )}
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


