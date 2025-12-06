/**
 * Deadline 模块类型定义
 */

import { BaseEntity } from './common'

// ========== Deadline 策略类型 ==========
// 1=拆解入日程, 2=仅监控
export type DeadlineStrategyType = 'decompose' | 'monitor'

// Deadline 状态
export type DeadlineStatus = 'active' | 'completed' | 'archived'

// ========== Deadline 模块类型 ==========

// Deadline (截止日) 实体
export interface Deadline extends BaseEntity {
  userId: string
  title: string
  description?: string
  startDate?: string       // 开始日期 (YYYY-MM-DD)，可选
  deadlineDate: string     // 截止日期 (YYYY-MM-DD)
  strategyType: DeadlineStrategyType  // 'decompose'=拆解入日程, 'monitor'=仅监控
  progress: number         // 进度 (0.0 - 100.0)。策略1由系统算，策略2手填
  status: DeadlineStatus   // 'active', 'completed', 'archived'
  themeColor?: string      // 主题颜色
}

// 创建 Deadline 请求
export interface CreateDeadlineRequest {
  title: string
  description?: string
  startDate?: string       // 开始日期，可选
  deadlineDate: string
  strategyType: DeadlineStrategyType
  themeColor?: string
}

// 更新 Deadline 请求
export interface UpdateDeadlineRequest {
  title?: string
  description?: string
  startDate?: string       // 开始日期，可选
  deadlineDate?: string
  strategyType?: DeadlineStrategyType
  progress?: number
  status?: DeadlineStatus
  themeColor?: string
}

// ========== ActionPlan 模块类型 (Deadline 的拆解项) ==========

// ActionPlan 实体 (仅用于策略1，记录用户如何拆解 Deadline 的元数据)
export interface ActionPlan extends BaseEntity {
  userId: string
  deadlineId: string       // 外键 -> Deadline.id
  name: string             // 拆解动作名 (如: "写第一章")
  estimatedDays?: number   // 预计耗时天数 (仅做记录)
  scheduledDate?: string   // 计划执行日期
  sortOrder: number        // 排序顺序
}

// 创建 ActionPlan 请求
export interface CreateActionPlanRequest {
  deadlineId: string
  name: string
  estimatedDays?: number
  scheduledDate?: string
}

// 更新 ActionPlan 请求
export interface UpdateActionPlanRequest {
  name?: string
  estimatedDays?: number
  scheduledDate?: string
  sortOrder?: number
}

// Deadline 完整数据 (包含所有 ActionPlan)
export interface DeadlineFullData {
  deadline: Deadline
  actionPlans: ActionPlan[]
}

