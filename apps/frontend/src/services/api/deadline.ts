/**
 * Deadline API 服务
 */

import { apiClient } from './client'
import { Deadline } from '../../features/deadline/model'

export interface CreateDeadlineRequest {
  title: string
  description?: string
  startDate?: string   // YYYY-MM-DD (开始日期，可选)
  deadlineDate: string // YYYY-MM-DD (截止日期)
  strategyType: 'decompose' | 'monitor'
  themeColor?: string
}

export interface UpdateDeadlineRequest {
  title?: string
  description?: string
  startDate?: string   // YYYY-MM-DD (开始日期，可选)
  deadlineDate?: string
  status?: 'active' | 'completed' | 'archived'
  themeColor?: string
  strategyType?: 'decompose' | 'monitor'
  progress?: number
}

export const deadlineApi = {
  /**
   * 创建 Deadline
   */
  create: (data: CreateDeadlineRequest): Promise<Deadline> => {
    return apiClient.post('/deadline', data)
  },

  /**
   * 获取所有 Deadline
   */
  getAll: (): Promise<Deadline[]> => {
    return apiClient.get('/deadline')
  },

  /**
   * 获取单个 Deadline
   */
  getById: (id: string): Promise<Deadline> => {
    return apiClient.get(`/deadline/${id}`)
  },

  /**
   * 获取完整 Deadline（包含 ActionPlan）
   */
  getFullById: (id: string): Promise<any> => {
    return apiClient.get(`/deadline/${id}/full`)
  },

  /**
   * 更新 Deadline
   */
  update: (id: string, data: UpdateDeadlineRequest): Promise<Deadline> => {
    return apiClient.put(`/deadline/${id}`, data)
  },

  /**
   * 删除 Deadline
   */
  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/deadline/${id}`)
  },

  /**
   * 切换 Deadline 状态（active <-> completed）
   */
  toggleStatus: (id: string): Promise<Deadline> => {
    return apiClient.patch(`/deadline/${id}`, {
      status: 'toggle',
    })
  },
}

