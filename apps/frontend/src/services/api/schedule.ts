/**
 * Schedule API 服务
 */

import { apiClient } from './client'
import { Task } from '../../features/schedule/model'

export interface CreateTaskRequest {
  title: string
  description?: string
  isAllDay: boolean
  startTime?: string
  endTime?: string
  goalColor?: string
  status?: 'pending' | 'completed'
  date: string    // 开始日期 YYYY-MM-DD
  endDate?: string // 结束日期 YYYY-MM-DD（跨天日程）
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  isAllDay?: boolean
  startTime?: string
  endTime?: string
  goalColor?: string
  status?: 'pending' | 'completed'
  date?: string     // 开始日期 YYYY-MM-DD
  endDate?: string  // 结束日期 YYYY-MM-DD（跨天日程）
}

export interface DayTasksResponse {
  date: string
  allDay: Task[]
  timed: Task[]
}

export const scheduleApi = {
  /**
   * 创建任务
   */
  createTask: (data: CreateTaskRequest): Promise<Task> => {
    return apiClient.post('/schedule', data)
  },

  /**
   * 查询任务
   */
  queryTasks: (params?: Record<string, any>): Promise<Task[]> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiClient.get(`/schedule${queryString}`)
  },

  /**
   * 获取某天的任务
   */
  getDayTasks: (date: string): Promise<DayTasksResponse> => {
    return apiClient.get(`/schedule/day/${date}`)
  },

  /**
   * 获取单个任务
   */
  getTaskById: (id: string): Promise<Task> => {
    return apiClient.get(`/schedule/${id}`)
  },

  /**
   * 更新任务
   */
  updateTask: (id: string, data: UpdateTaskRequest): Promise<Task> => {
    return apiClient.put(`/schedule/${id}`, data)
  },

  /**
   * 删除任务
   */
  deleteTask: (id: string): Promise<void> => {
    return apiClient.delete(`/schedule/${id}`)
  },

  /**
   * 切换任务状态
   */
  toggleTaskStatus: (id: string): Promise<Task> => {
    return apiClient.patch(`/schedule/${id}/toggle`, {})
  },

  /**
   * 获取任务统计
   */
  getTaskStats: (): Promise<any> => {
    return apiClient.get('/schedule/stats')
  },

  /**
   * 批量更新任务状态
   */
  batchUpdateStatus: (ids: string[], status: 'pending' | 'completed'): Promise<void> => {
    return apiClient.post('/schedule/batch/status', { ids, status })
  },
}

