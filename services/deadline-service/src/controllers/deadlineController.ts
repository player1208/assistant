/**
 * Deadline (截止日) 控制器
 * GoalPilot Deadline 模块 - 项目层
 */

import { Request, Response } from 'express'
import { deadlineService } from '../services/deadlineService'
import {
  successResponse,
  CreateDeadlineRequest,
  UpdateDeadlineRequest,
  CreateActionPlanRequest,
  UpdateActionPlanRequest,
  ApiErrorCode,
  isValidDateString,
} from '@assistent/shared'
import { asyncHandler, ApiError } from '../middleware/errorHandler'

// ========== Deadline CRUD ==========

/**
 * 创建 Deadline
 * POST /deadlines
 */
export const createDeadline = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const data: CreateDeadlineRequest = req.body

  if (!data.title?.trim()) {
    throw new ApiError(ApiErrorCode.INVALID_PARAMS, 'Deadline 标题不能为空')
  }
  if (!data.deadlineDate || !isValidDateString(data.deadlineDate)) {
    throw new ApiError(ApiErrorCode.INVALID_PARAMS, '无效的截止日期格式')
  }
  if (!data.strategyType || !['decompose', 'monitor'].includes(data.strategyType)) {
    throw new ApiError(ApiErrorCode.INVALID_PARAMS, '无效的策略类型')
  }

  const deadline = await deadlineService.createDeadline(userId, data)
  res.status(201).json(successResponse(deadline, '创建成功'))
})

/**
 * 获取用户所有 Deadline
 * GET /deadlines?status=active&limit=10
 */
export const getDeadlines = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const status = req.query.status as string
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

  const deadlines = await deadlineService.getDeadlines(userId, { status, limit })
  res.json(successResponse(deadlines))
})

/**
 * 获取单个 Deadline
 * GET /deadlines/:id
 */
export const getDeadline = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const deadlineId = req.params.id

  const deadline = await deadlineService.getDeadline(userId, deadlineId)
  res.json(successResponse(deadline))
})

/**
 * 获取 Deadline 完整数据 (包含 ActionPlan)
 * GET /deadlines/:id/full
 */
export const getDeadlineFull = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const deadlineId = req.params.id

  const data = await deadlineService.getDeadlineFull(userId, deadlineId)
  res.json(successResponse(data))
})

/**
 * 更新 Deadline
 * PUT /deadlines/:id
 */
export const updateDeadline = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const deadlineId = req.params.id
  const data: UpdateDeadlineRequest = req.body

  // 验证日期格式
  if (data.deadlineDate && !isValidDateString(data.deadlineDate)) {
    throw new ApiError(ApiErrorCode.INVALID_PARAMS, '无效的截止日期格式')
  }

  const deadline = await deadlineService.updateDeadline(userId, deadlineId, data)
  res.json(successResponse(deadline, '更新成功'))
})

/**
 * 删除 Deadline
 * DELETE /deadlines/:id
 */
export const deleteDeadline = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const deadlineId = req.params.id

  await deadlineService.deleteDeadline(userId, deadlineId)
  res.json(successResponse(null, '删除成功'))
})

// ========== ActionPlan CRUD ==========

/**
 * 创建 ActionPlan
 * POST /deadlines/:deadlineId/action-plans
 */
export const createActionPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const deadlineId = req.params.deadlineId
  const data: Omit<CreateActionPlanRequest, 'deadlineId'> = req.body

  if (!data.name?.trim()) {
    throw new ApiError(ApiErrorCode.INVALID_PARAMS, 'ActionPlan 名称不能为空')
  }

  const actionPlan = await deadlineService.createActionPlan(userId, {
    ...data,
    deadlineId,
  })
  res.status(201).json(successResponse(actionPlan, '创建成功'))
})

/**
 * 获取 Deadline 下所有 ActionPlan
 * GET /deadlines/:deadlineId/action-plans
 */
export const getActionPlans = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const deadlineId = req.params.deadlineId

  const actionPlans = await deadlineService.getActionPlans(userId, deadlineId)
  res.json(successResponse(actionPlans))
})

/**
 * 更新 ActionPlan
 * PUT /deadlines/action-plans/:actionPlanId
 */
export const updateActionPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const actionPlanId = req.params.actionPlanId
  const data: UpdateActionPlanRequest = req.body

  const actionPlan = await deadlineService.updateActionPlan(userId, actionPlanId, data)
  res.json(successResponse(actionPlan, '更新成功'))
})

/**
 * 删除 ActionPlan
 * DELETE /deadlines/action-plans/:actionPlanId
 */
export const deleteActionPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const actionPlanId = req.params.actionPlanId

  await deadlineService.deleteActionPlan(userId, actionPlanId)
  res.json(successResponse(null, '删除成功'))
})

/**
 * 批量更新 ActionPlan 排序
 * POST /deadlines/action-plans/batch/order
 */
export const batchUpdateActionPlanOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId
    const { updates } = req.body

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ApiError(ApiErrorCode.INVALID_PARAMS, '请提供更新数据')
    }

    const count = await deadlineService.batchUpdateActionPlanOrder(userId, updates)
    res.json(successResponse({ modifiedCount: count }, `成功更新 ${count} 个 ActionPlan`))
  }
)

