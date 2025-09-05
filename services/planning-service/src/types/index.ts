export interface Task {
  _id?: string
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
  // 关键路径计算字段
  earlyStart?: Date
  earlyFinish?: Date
  lateStart?: Date
  lateFinish?: Date
  slack?: number // 松弛时间
  isOnCriticalPath?: boolean
  duration?: number // 持续时间（天）
  // 数据库字段
  createdAt?: Date
  updatedAt?: Date
}

export interface Project {
  _id?: string
  id: string
  name: string
  description?: string
  tasks: Task[]
  createdAt: Date
  updatedAt: Date
  color: string
  userId?: string // 用户ID，用于多用户支持
}

export interface Connection {
  _id?: string
  id: string
  from: string // 源任务ID
  to: string
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
  projectId: string // 所属项目ID
  createdAt?: Date
  updatedAt?: Date
}

export interface User {
  _id?: string
  id: string
  username: string
  email: string
  createdAt: Date
  updatedAt: Date
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 请求类型
export interface CreateProjectRequest {
  name: string
  description?: string
  color?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  color?: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked'
  priority?: 'low' | 'medium' | 'high'
  dependencies?: string[]
  position?: { x: number; y: number }
  progress?: number
  estimatedHours?: number
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  startDate?: Date
  endDate?: Date
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked'
  priority?: 'low' | 'medium' | 'high'
  dependencies?: string[]
  position?: { x: number; y: number }
  progress?: number
  estimatedHours?: number
  actualHours?: number
}

export interface CreateConnectionRequest {
  from: string
  to: string
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
}
