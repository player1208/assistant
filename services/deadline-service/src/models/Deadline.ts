/**
 * Deadline (截止日) 数据模型
 * GoalPilot Deadline 模块 - 项目层
 */

import mongoose, { Schema, Document } from 'mongoose'
import { Deadline, DeadlineStrategyType, DeadlineStatus } from '@assistent/shared'

export interface DeadlineDocument extends Omit<Deadline, 'id'>, Document {}

const DeadlineSchema = new Schema<DeadlineDocument>(
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
    // 开始日期 (可选，用于跨天事件)
    startDate: {
      type: String,
      index: true,
    },
    deadlineDate: {
      type: String,
      required: true,
      index: true,
    },
    // 策略类型: 'decompose'=拆解入日程, 'monitor'=仅监控
    strategyType: {
      type: String,
      enum: ['decompose', 'monitor'] as DeadlineStrategyType[],
      required: true,
      default: 'monitor',
    },
    // 进度 (0.0 - 100.0)。策略1由系统算，策略2手填
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // 状态: 'active', 'completed', 'archived'
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'] as DeadlineStatus[],
      default: 'active',
      index: true,
    },
    // 主题颜色
    themeColor: {
      type: String,
      default: '#3b82f6',
    },
  },
  {
    timestamps: true,
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

// 复合索引
DeadlineSchema.index({ userId: 1, status: 1 })
DeadlineSchema.index({ userId: 1, deadlineDate: 1 })
DeadlineSchema.index({ userId: 1, startDate: 1 })

export const DeadlineModel = mongoose.model<DeadlineDocument>('Deadline', DeadlineSchema)

