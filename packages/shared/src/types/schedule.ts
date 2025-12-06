/**
 * 日程模块类型定义
 */

import { BaseEntity, ThemeColor } from './common'

// ========== Schedule (日程) 状态枚举 ==========
// 0=未完成, 1=已完成, 2=已延期, 3=已放弃
export type ScheduleStatus = 'pending' | 'completed' | 'postponed' | 'abandoned'

// 日程来源类型: 0=手动, 1=Deadline, 2=Plan
export type ScheduleSourceType = 'manual' | 'deadline' | 'plan'

// 日程冲突状态
export type TaskConflictStatus = 'none' | 'conflict'

// ========== 兼容旧代码的别名 ==========
// 任务状态
export type TaskStatus = 'pending' | 'completed' | 'cancelled'

// 任务优先级
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

// 重复类型
export type RepeatType = 
  | 'none'      // 不重复
  | 'daily'     // 每天
  | 'weekly'    // 每周
  | 'monthly'   // 每月
  | 'yearly'    // 每年
  | 'custom'    // 自定义

// 重复配置
export interface RepeatConfig {
  type: RepeatType
  interval?: number        // 间隔 (如每2天)
  weekDays?: number[]      // 周几 (0-6, 0=周日)
  monthDay?: number        // 每月几号
  endDate?: string         // 结束日期
  endCount?: number        // 结束次数
}

// 任务实体 (兼容旧代码)
export interface Task extends BaseEntity {
  userId: string           // 用户ID (openId)
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority

  // 时间相关
  isAllDay: boolean        // 是否全天任务
  startTime?: string       // 开始时间 (HH:mm)
  endTime?: string         // 结束时间 (HH:mm)
  date: string             // 开始日期 (YYYY-MM-DD)
  endDate?: string         // 结束日期 (YYYY-MM-DD)，跨天日程使用

  // 分类和标签
  goalId?: string          // 关联的目标ID
  goalColor?: ThemeColor   // 目标颜色 (冗余存储方便展示)
  tags?: string[]

  // 重复
  repeat?: RepeatConfig
  parentTaskId?: string    // 如果是重复任务实例，指向原始任务

  // 提醒
  reminders?: TaskReminder[]

  // 元数据
  completedAt?: Date       // 完成时间

  // ========== GoalPilot 新增字段 ==========
  // 日程来源类型: manual=手动, deadline=来自Deadline, plan=来自Plan
  sourceType?: ScheduleSourceType
  // 关联的 Deadline ID (仅当 sourceType='deadline')
  deadlineRefId?: string
  // 关联的生成器系列 ID (仅当 sourceType='plan')
  seriesRefId?: string
  // 冲突状态: none=无冲突, conflict=有冲突
  conflictStatus?: TaskConflictStatus
  // 冲突的任务 ID 列表
  conflictTaskIds?: string[]
}

// 任务提醒
export interface TaskReminder {
  id: string
  type: 'notification' | 'alarm'
  offsetMinutes: number    // 提前多少分钟提醒
  isEnabled: boolean
}

// 创建任务请求
export interface CreateTaskRequest {
  title: string
  description?: string
  isAllDay: boolean
  startTime?: string
  endTime?: string
  date: string
  priority?: TaskPriority
  goalId?: string
  tags?: string[]
  repeat?: RepeatConfig
  reminders?: Omit<TaskReminder, 'id'>[]
  // GoalPilot 新增
  sourceType?: ScheduleSourceType
  deadlineRefId?: string
  seriesRefId?: string
}

// 更新任务请求
export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  isAllDay?: boolean
  startTime?: string
  endTime?: string
  date?: string
  priority?: TaskPriority
  goalId?: string
  tags?: string[]
  repeat?: RepeatConfig
  reminders?: Omit<TaskReminder, 'id'>[]
  // GoalPilot 新增
  sourceType?: ScheduleSourceType
  deadlineRefId?: string
  seriesRefId?: string
}

// 日任务列表
export interface DayTasks {
  date: string
  allDay: Task[]
  timed: Task[]
}

// 查询任务参数
export interface QueryTasksParams {
  startDate?: string
  endDate?: string
  status?: TaskStatus
  goalId?: string
  priority?: TaskPriority
  search?: string
  // GoalPilot 新增
  sourceType?: ScheduleSourceType
  deadlineRefId?: string
  seriesRefId?: string
}

