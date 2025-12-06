/**
 * Deadline (截止日) 服务层
 * GoalPilot Deadline 模块 - 项目层
 */

import { DeadlineModel } from '../models/Deadline'
import { ActionPlanModel } from '../models/ActionPlan'
import {
  Deadline,
  ActionPlan,
  CreateDeadlineRequest,
  UpdateDeadlineRequest,
  CreateActionPlanRequest,
  UpdateActionPlanRequest,
  DeadlineFullData,
  ApiErrorCode,
} from '@assistent/shared'
import { ApiError } from '../middleware/errorHandler'

export class DeadlineService {
  // ========== Deadline CRUD ==========
  
  /**
   * 创建 Deadline
   */
  async createDeadline(userId: string, data: CreateDeadlineRequest): Promise<Deadline> {
    const deadline = new DeadlineModel({
      userId,
      ...data,
      progress: 0,
      status: 'active',
    })

    const saved = await deadline.save()
    return saved.toJSON() as Deadline
  }

  /**
   * 获取用户所有 Deadline
   */
  async getDeadlines(
    userId: string,
    options?: { status?: string; limit?: number }
  ): Promise<Deadline[]> {
    const query: any = { userId }
    
    if (options?.status) {
      query.status = options.status
    }
    
    let queryBuilder = DeadlineModel.find(query).sort({ deadlineDate: 1 })
    
    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit)
    }
    
    const deadlines = await queryBuilder.lean()
    
    return deadlines.map((d) => ({
      ...d,
      id: d._id.toString(),
    })) as Deadline[]
  }

  /**
   * 获取单个 Deadline
   */
  async getDeadline(userId: string, deadlineId: string): Promise<Deadline> {
    const deadline = await DeadlineModel.findOne({ _id: deadlineId, userId })

    if (!deadline) {
      throw new ApiError(ApiErrorCode.NOT_FOUND, 'Deadline 不存在')
    }

    return deadline.toJSON() as Deadline
  }

  /**
   * 获取 Deadline 完整数据 (包含 ActionPlan)
   */
  async getDeadlineFull(userId: string, deadlineId: string): Promise<DeadlineFullData> {
    const deadline = await this.getDeadline(userId, deadlineId)
    const actionPlans = await this.getActionPlans(userId, deadlineId)
    
    return {
      deadline,
      actionPlans,
    }
  }

  /**
   * 更新 Deadline
   */
  async updateDeadline(
    userId: string,
    deadlineId: string,
    data: UpdateDeadlineRequest
  ): Promise<Deadline> {
    const deadline = await DeadlineModel.findOneAndUpdate(
      { _id: deadlineId, userId },
      { $set: data },
      { new: true, runValidators: true }
    )

    if (!deadline) {
      throw new ApiError(ApiErrorCode.NOT_FOUND, 'Deadline 不存在')
    }

    return deadline.toJSON() as Deadline
  }

  /**
   * 更新 Deadline 进度 (仅用于策略1自动计算)
   */
  async updateDeadlineProgress(
    userId: string,
    deadlineId: string,
    progress: number
  ): Promise<Deadline> {
    return this.updateDeadline(userId, deadlineId, { progress })
  }

  /**
   * 删除 Deadline（同时删除关联的 ActionPlan）
   */
  async deleteDeadline(userId: string, deadlineId: string): Promise<void> {
    const deadline = await DeadlineModel.findOne({ _id: deadlineId, userId })

    if (!deadline) {
      throw new ApiError(ApiErrorCode.NOT_FOUND, 'Deadline 不存在')
    }

    await Promise.all([
      DeadlineModel.deleteOne({ _id: deadlineId }),
      ActionPlanModel.deleteMany({ deadlineId }),
    ])
  }

  // ========== ActionPlan CRUD ==========

  /**
   * 创建 ActionPlan
   */
  async createActionPlan(userId: string, data: CreateActionPlanRequest): Promise<ActionPlan> {
    // 验证 Deadline 存在
    await this.getDeadline(userId, data.deadlineId)
    
    // 获取当前最大排序
    const maxSort = await ActionPlanModel.findOne({ deadlineId: data.deadlineId })
      .sort({ sortOrder: -1 })
      .select('sortOrder')
      .lean()
    
    const actionPlan = new ActionPlanModel({
      userId,
      ...data,
      sortOrder: (maxSort?.sortOrder ?? -1) + 1,
    })

    const saved = await actionPlan.save()
    return saved.toJSON() as ActionPlan
  }

  /**
   * 获取 Deadline 下所有 ActionPlan
   */
  async getActionPlans(userId: string, deadlineId: string): Promise<ActionPlan[]> {
    const actionPlans = await ActionPlanModel.find({ userId, deadlineId })
      .sort({ sortOrder: 1 })
      .lean()

    return actionPlans.map((a) => ({
      ...a,
      id: a._id.toString(),
    })) as ActionPlan[]
  }

  /**
   * 更新 ActionPlan
   */
  async updateActionPlan(
    userId: string,
    actionPlanId: string,
    data: UpdateActionPlanRequest
  ): Promise<ActionPlan> {
    const actionPlan = await ActionPlanModel.findOneAndUpdate(
      { _id: actionPlanId, userId },
      { $set: data },
      { new: true, runValidators: true }
    )

    if (!actionPlan) {
      throw new ApiError(ApiErrorCode.NOT_FOUND, 'ActionPlan 不存在')
    }

    return actionPlan.toJSON() as ActionPlan
  }

  /**
   * 删除 ActionPlan
   */
  async deleteActionPlan(userId: string, actionPlanId: string): Promise<void> {
    const result = await ActionPlanModel.deleteOne({ _id: actionPlanId, userId })

    if (result.deletedCount === 0) {
      throw new ApiError(ApiErrorCode.NOT_FOUND, 'ActionPlan 不存在')
    }
  }

  /**
   * 批量更新 ActionPlan 排序
   */
  async batchUpdateActionPlanOrder(
    userId: string,
    updates: Array<{ actionPlanId: string; sortOrder: number }>
  ): Promise<number> {
    const operations = updates.map((u) => ({
      updateOne: {
        filter: { _id: u.actionPlanId, userId },
        update: { $set: { sortOrder: u.sortOrder } },
      },
    }))

    const result = await ActionPlanModel.bulkWrite(operations)
    return result.modifiedCount
  }
}

export const deadlineService = new DeadlineService()

