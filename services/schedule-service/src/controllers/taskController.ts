/**
 * 任务控制器
 */

import { Request, Response } from 'express'
import { taskService } from '../services/taskService'
import {
  successResponse,
  paginatedResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  QueryTasksParams,
  getTodayString,
  isValidDateString,
  ApiErrorCode,
} from '@assistent/shared'
import { asyncHandler, ApiError } from '../middleware/errorHandler'

/**
 * 创建任务
 * POST /tasks
 */
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const data: CreateTaskRequest = req.body

  // 基本验证
  if (!data.title?.trim()) {
    throw new ApiError(ApiErrorCode.INVALID_PARAMS, '任务标题不能为空')
  }
  if (!data.date || !isValidDateString(data.date)) {
    throw new ApiError(ApiErrorCode.INVALID_PARAMS, '无效的日期格式')
  }

  const task = await taskService.createTask(userId, data)
  res.status(201).json(successResponse(task, '创建成功'))
})

/**
 * 获取单个任务
 * GET /tasks/:id
 */
export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const taskId = req.params.id

  const task = await taskService.getTask(userId, taskId)
  res.json(successResponse(task))
})

/**
 * 更新任务
 * PUT /tasks/:id
 */
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const taskId = req.params.id
  const data: UpdateTaskRequest = req.body

  const task = await taskService.updateTask(userId, taskId, data)
  res.json(successResponse(task, '更新成功'))
})

/**
 * 删除任务
 * DELETE /tasks/:id
 */
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const taskId = req.params.id

  await taskService.deleteTask(userId, taskId)
  res.json(successResponse(null, '删除成功'))
})

/**
 * 查询任务列表
 * GET /tasks
 */
export const queryTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const params: QueryTasksParams = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    status: req.query.status as any,
    goalId: req.query.goalId as string,
    priority: req.query.priority as any,
    search: req.query.search as string,
    // GoalPilot 新增参数
    sourceType: req.query.sourceType as any,
    deadlineRefId: req.query.deadlineRefId as string,
    seriesRefId: req.query.seriesRefId as string,
  }

  const tasks = await taskService.queryTasks(userId, params)
  res.json(successResponse(tasks))
})

/**
 * 获取某天的任务
 * GET /tasks/day/:date
 */
export const getDayTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId
  const date = req.params.date || getTodayString()

  if (!isValidDateString(date)) {
    throw new ApiError(ApiErrorCode.INVALID_PARAMS, '无效的日期格式')
  }

  const dayTasks = await taskService.getDayTasks(userId, date)
  res.json(successResponse(dayTasks))
})

/**
 * 切换任务状态 (完成/未完成)
 * PATCH /tasks/:id/toggle
 */
export const toggleTaskStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId
    const taskId = req.params.id

    // 先获取当前状态
    const currentTask = await taskService.getTask(userId, taskId)
    const newStatus =
      currentTask.status === 'completed' ? 'pending' : 'completed'

    const task = await taskService.updateTask(userId, taskId, {
      status: newStatus,
    })
    res.json(successResponse(task))
  }
)

/**
 * 批量更新状态
 * POST /tasks/batch/status
 */
export const batchUpdateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId
    const { taskIds, status } = req.body

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new ApiError(ApiErrorCode.INVALID_PARAMS, '请提供任务ID列表')
    }

    const count = await taskService.batchUpdateStatus(userId, taskIds, status)
    res.json(successResponse({ modifiedCount: count }, `成功更新 ${count} 个任务`))
  }
)

/**
 * 获取任务统计
 * GET /tasks/stats
 */
export const getTaskStats = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId
    const startDate = (req.query.startDate as string) || getTodayString()
    const endDate = (req.query.endDate as string) || getTodayString()

    const stats = await taskService.getTaskStats(userId, startDate, endDate)
    res.json(successResponse(stats))
  }
)

// ========== GoalPilot 新增接口 ==========

/**
 * 批量创建任务 (用于 SeriesGenerator)
 * POST /tasks/batch
 */
export const batchCreateTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId
    const { tasks } = req.body

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new ApiError(ApiErrorCode.INVALID_PARAMS, '请提供任务列表')
    }

    // 验证每个任务
    for (const task of tasks) {
      if (!task.title?.trim()) {
        throw new ApiError(ApiErrorCode.INVALID_PARAMS, '任务标题不能为空')
      }
      if (!task.date || !isValidDateString(task.date)) {
        throw new ApiError(ApiErrorCode.INVALID_PARAMS, '无效的日期格式')
      }
    }

    const created = await taskService.batchCreateTasks(userId, tasks)
    res.status(201).json(successResponse(created, `成功创建 ${created.length} 个任务`))
  }
)

/**
 * 批量删除未来任务
 * DELETE /tasks/batch/future
 */
export const batchDeleteFutureTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId
    const { seriesRefId, deadlineRefId, fromDate } = req.body

    const count = await taskService.batchDeleteFutureTasks(userId, {
      seriesRefId,
      deadlineRefId,
      fromDate,
    })
    res.json(successResponse({ deletedCount: count }, `成功删除 ${count} 个任务`))
  }
)

/**
 * 获取 Deadline 进度
 * GET /tasks/deadline/:deadlineId/progress
 */
export const getDeadlineProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId
    const deadlineRefId = req.params.deadlineId

    const progress = await taskService.getDeadlineProgress(userId, deadlineRefId)
    res.json(successResponse(progress))
  }
)

/**
 * 获取 Series 统计
 * GET /tasks/series/:seriesId/stats
 */
export const getSeriesStats = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId
    const seriesRefId = req.params.seriesId

    const stats = await taskService.getSeriesStats(userId, seriesRefId)
    res.json(successResponse(stats))
  }
)

