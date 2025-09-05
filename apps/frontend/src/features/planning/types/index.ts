export interface Task {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high'
  dependencies: string[] // 依赖的任务ID
  position: { x: number; y: number }
  progress: number // 0-100
  estimatedHours?: number
  actualHours?: number
  // 新增字段用于进度网络图计算
  earlyStart?: Date
  earlyFinish?: Date
  lateStart?: Date
  lateFinish?: Date
  slack?: number // 松弛时间
  isOnCriticalPath?: boolean
  duration?: number // 持续时间（天）
}

export interface Project {
  id: string
  name: string
  description?: string
  tasks: Task[]
  createdAt: Date
  updatedAt: Date
  color: string
}

export interface Connection {
  id: string
  from: string // 源任务ID
  to: string // 目标任务ID
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
}

export interface NetworkDiagramState {
  projects: Project[]
  currentProjectId: string | null
  selectedTaskId: string | null
  connections: Connection[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
}
