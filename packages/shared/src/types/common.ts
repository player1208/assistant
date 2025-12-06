/**
 * 公共类型定义
 */

// 基础实体接口 - 所有实体都应该继承
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// 用户信息 (微信用户)
export interface WxUserInfo {
  openId: string
  unionId?: string
  nickName?: string
  avatarUrl?: string
}

// 分页请求参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 操作结果
export interface OperationResult {
  success: boolean
  message?: string
}

// 日期范围
export interface DateRange {
  startDate: string // ISO 8601 格式
  endDate: string
}

// 颜色主题
export type ThemeColor = 
  | 'indigo' 
  | 'purple' 
  | 'teal' 
  | 'green' 
  | 'blue' 
  | 'orange' 
  | 'red' 
  | 'pink'

// 颜色映射 - 用于前端展示
export const THEME_COLOR_MAP: Record<ThemeColor, string> = {
  indigo: '#6366f1',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  red: '#ef4444',
  pink: '#ec4899',
}

