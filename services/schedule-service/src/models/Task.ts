/**
 * 任务数据模型 (GoalPilot Schedule)
 */

import mongoose, { Schema, Document } from 'mongoose'
import { Task, TaskStatus, TaskPriority, RepeatType, ScheduleSourceType } from '@assistent/shared'

// Mongoose 文档类型
export interface TaskDocument extends Omit<Task, 'id'>, Document {}

// 任务提醒 Schema
const TaskReminderSchema = new Schema({
  type: {
    type: String,
    enum: ['notification', 'alarm'],
    default: 'notification',
  },
  offsetMinutes: {
    type: Number,
    required: true,
    default: 30,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
}, { _id: true })

// 重复配置 Schema
const RepeatConfigSchema = new Schema({
  type: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as RepeatType[],
    default: 'none',
  },
  interval: Number,
  weekDays: [Number],
  monthDay: Number,
  endDate: String,
  endCount: Number,
}, { _id: false })

// 任务 Schema
const TaskSchema = new Schema<TaskDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'] as TaskStatus[],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'] as TaskPriority[],
      default: 'normal',
    },
    
    // 时间相关
    isAllDay: {
      type: Boolean,
      default: false,
    },
    startTime: String,
    endTime: String,
    date: {
      type: String,
      required: true,
      index: true,
    },
    // 结束日期（跨天日程使用）
    endDate: {
      type: String,
      index: true,
    },
    
    // 分类
    goalId: {
      type: String,
      index: true,
    },
    goalColor: {
      type: String,
      enum: ['indigo', 'purple', 'teal', 'green', 'blue', 'orange', 'red', 'pink'],
    },
    tags: [String],
    
    // 重复
    repeat: RepeatConfigSchema,
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    
    // 提醒
    reminders: [TaskReminderSchema],

    // 元数据
    completedAt: Date,

    // ========== GoalPilot 新增字段 ==========
    // 日程来源类型: manual=手动, deadline=来自Deadline, plan=来自Plan
    sourceType: {
      type: String,
      enum: ['manual', 'deadline', 'plan'] as ScheduleSourceType[],
      default: 'manual',
      index: true,
    },
    // 关联的 Deadline ID (仅当 sourceType='deadline')
    deadlineRefId: {
      type: String,
      index: true,
    },
    // 关联的生成器系列 ID (仅当 sourceType='plan')
    seriesRefId: {
      type: String,
      index: true,
    },
    // 冲突状态: none=无冲突, conflict=有冲突
    conflictStatus: {
      type: String,
      enum: ['none', 'conflict'],
      default: 'none',
      index: true,
    },
    // 冲突的任务 ID 列表
    conflictTaskIds: [String],
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

// 复合索引 - 用户+日期查询
TaskSchema.index({ userId: 1, date: 1 })
// 复合索引 - 用户+状态+日期
TaskSchema.index({ userId: 1, status: 1, date: 1 })
// GoalPilot 新增索引 - 用于查询 Deadline 关联的日程
TaskSchema.index({ userId: 1, deadlineRefId: 1 })
// GoalPilot 新增索引 - 用于查询 Series 关联的日程
TaskSchema.index({ userId: 1, seriesRefId: 1 })

export const TaskModel = mongoose.model<TaskDocument>('Task', TaskSchema)

