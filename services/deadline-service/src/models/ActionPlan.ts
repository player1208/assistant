/**
 * ActionPlan (Deadline 拆解项) 数据模型
 * GoalPilot Deadline 模块 - 仅用于策略1 (拆解模式)
 */

import mongoose, { Schema, Document } from 'mongoose'
import { ActionPlan } from '@assistent/shared'

export interface ActionPlanDocument extends Omit<ActionPlan, 'id'>, Document {}

const ActionPlanSchema = new Schema<ActionPlanDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // 外键 -> Deadline.id
    deadlineId: {
      type: String,
      required: true,
      index: true,
    },
    // 拆解动作名 (如: "写第一章")
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    // 预计耗时天数 (仅做记录)
    estimatedDays: {
      type: Number,
      min: 1,
    },
    // 计划执行日期
    scheduledDate: {
      type: String,
    },
    // 排序顺序
    sortOrder: {
      type: Number,
      default: 0,
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
ActionPlanSchema.index({ userId: 1, deadlineId: 1 })

export const ActionPlanModel = mongoose.model<ActionPlanDocument>('ActionPlan', ActionPlanSchema)

