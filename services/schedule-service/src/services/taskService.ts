/**
 * 任务服务层
 */

import { TaskModel, TaskDocument } from '../models/Task'
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  QueryTasksParams,
  DayTasks,
  ApiErrorCode,
} from '@assistent/shared'
import { ApiError } from '../middleware/errorHandler'

export class TaskService {
  /**
   * 创建任务
   */
  async createTask(userId: string, data: CreateTaskRequest): Promise<Task> {
    const taskData: any = { ...data }

    // 检测冲突
    const conflictIds = await this.detectConflicts(
      userId,
      null, // 新任务没有 ID
      data.date,
      taskData.startTime,
      taskData.endTime,
      data.isAllDay
    )

    // 设置冲突状态
    if (conflictIds.length > 0) {
      taskData.conflictStatus = 'conflict'
      taskData.conflictTaskIds = conflictIds
    } else {
      taskData.conflictStatus = 'none'
      taskData.conflictTaskIds = []
    }

    const task = new TaskModel({
      userId,
      ...taskData,
      status: 'pending',
    })

    const saved = await task.save()
    return saved.toJSON() as Task
  }

  /**
   * 获取单个任务
   */
  async getTask(userId: string, taskId: string): Promise<Task> {
    const task = await TaskModel.findOne({ _id: taskId, userId })

    if (!task) {
      throw new ApiError(ApiErrorCode.TASK_NOT_FOUND, '任务不存在')
    }

    return task.toJSON() as Task
  }

  /**
   * 检测时间冲突
   * 返回冲突的任务 ID 列表
   */
  private async detectConflicts(
    userId: string,
    taskId: string | null,
    date: string,
    startTime?: string,
    endTime?: string,
    isAllDay?: boolean
  ): Promise<string[]> {
    // 全天任务不检测时间冲突
    if (isAllDay) {
      return []
    }

    // 如果没有时间信息，不检测冲突
    if (!startTime || !endTime) {
      return []
    }

    // 构建查询条件
    const query: any = {
      userId,
      date,
      isAllDay: false,
      status: { $ne: 'cancelled' }, // 忽略已取消的任务
    }

    // 如果有 taskId，排除当前任务
    if (taskId) {
      query._id = { $ne: taskId }
    }

    // 查询同一天的其他非全天任务
    const conflictingTasks = await TaskModel.find(query).lean()

    const conflictIds: string[] = []

    for (const other of conflictingTasks) {
      if (!other.startTime || !other.endTime) continue

      // 检测时间重叠
      // 冲突条件：startTime < other.endTime && endTime > other.startTime
      if (startTime < other.endTime && endTime > other.startTime) {
        conflictIds.push(other._id.toString())
      }
    }

    return conflictIds
  }

  /**
   * 更新任务
   */
  async updateTask(
    userId: string,
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<Task> {
    // 获取原始任务
    const originalTask = await TaskModel.findOne({ _id: taskId, userId })
    if (!originalTask) {
      throw new ApiError(ApiErrorCode.TASK_NOT_FOUND, '任务不存在')
    }

    const updateData: any = { ...data }

    // 处理冲突检测
    const finalDate = updateData.date || originalTask.date
    const finalStartTime = updateData.startTime || originalTask.startTime
    const finalEndTime = updateData.endTime || originalTask.endTime
    const finalIsAllDay = updateData.isAllDay !== undefined ? updateData.isAllDay : originalTask.isAllDay

    const conflictIds = await this.detectConflicts(
      userId,
      taskId,
      finalDate,
      finalStartTime,
      finalEndTime,
      finalIsAllDay
    )

    // 设置冲突状态
    if (conflictIds.length > 0) {
      updateData.conflictStatus = 'conflict'
      updateData.conflictTaskIds = conflictIds
    } else {
      updateData.conflictStatus = 'none'
      updateData.conflictTaskIds = []
    }

    // 如果状态变为完成，记录完成时间
    if (data.status === 'completed') {
      updateData.completedAt = new Date()
    }

    const task = await TaskModel.findOneAndUpdate(
      { _id: taskId, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!task) {
      throw new ApiError(ApiErrorCode.TASK_NOT_FOUND, '任务不存在')
    }

    return task.toJSON() as Task
  }

  /**
   * 删除任务
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    const result = await TaskModel.deleteOne({ _id: taskId, userId })

    if (result.deletedCount === 0) {
      throw new ApiError(ApiErrorCode.TASK_NOT_FOUND, '任务不存在')
    }
  }

  /**
   * 查询任务列表
   * 支持跨天日程：如果任务有 endDate，则查询范围内任意一天都应该显示该任务
   */
  async queryTasks(userId: string, params: QueryTasksParams): Promise<Task[]> {
    const query: any = { userId }

    // 日期范围查询 - 支持跨天日程
    // 任务在查询范围内的条件：
    // 1. 单日任务：date 在查询范围内
    // 2. 跨天任务：[date, endDate] 与 [startDate, endDate] 有交集
    if (params.startDate && params.endDate) {
      // 查询：任务的 [date, endDate] 与查询的 [startDate, endDate] 有交集
      // 即：task.date <= params.endDate AND (task.endDate >= params.startDate OR task.endDate 不存在且 task.date >= params.startDate)
      query.$and = [
        { date: { $lte: params.endDate } },  // 任务开始日期 <= 查询结束日期
        {
          $or: [
            { endDate: { $gte: params.startDate } },  // 任务结束日期 >= 查询开始日期
            { endDate: { $exists: false }, date: { $gte: params.startDate } },  // 无结束日期的单日任务
            { endDate: null, date: { $gte: params.startDate } },  // endDate 为 null 的单日任务
          ]
        }
      ]
    } else if (params.startDate) {
      // 只有开始日期：任务结束日期 >= 查询开始日期，或者单日任务日期 >= 查询开始日期
      query.$or = [
        { endDate: { $gte: params.startDate } },
        { endDate: { $exists: false }, date: { $gte: params.startDate } },
        { endDate: null, date: { $gte: params.startDate } },
      ]
    } else if (params.endDate) {
      // 只有结束日期：任务开始日期 <= 查询结束日期
      query.date = { $lte: params.endDate }
    }

    // 状态筛选
    if (params.status) {
      query.status = params.status
    }

    // 目标筛选
    if (params.goalId) {
      query.goalId = params.goalId
    }

    // 优先级筛选
    if (params.priority) {
      query.priority = params.priority
    }

    // 搜索
    if (params.search) {
      query.$or = [
        { title: { $regex: params.search, $options: 'i' } },
        { description: { $regex: params.search, $options: 'i' } },
      ]
    }

    // GoalPilot 新增筛选条件
    // 来源类型筛选
    if (params.sourceType) {
      query.sourceType = params.sourceType
    }

    // Deadline 关联筛选
    if (params.deadlineRefId) {
      query.deadlineRefId = params.deadlineRefId
    }

    // Series 关联筛选
    if (params.seriesRefId) {
      query.seriesRefId = params.seriesRefId
    }

    const tasks = await TaskModel.find(query)
      .sort({ date: 1, isAllDay: -1, startTime: 1 })
      .lean()

    return tasks.map((t) => ({
      ...t,
      id: t._id.toString(),
    })) as Task[]
  }

  /**
   * 获取某一天的任务（分组）
   */
  async getDayTasks(userId: string, date: string): Promise<DayTasks> {
    const tasks = await this.queryTasks(userId, {
      startDate: date,
      endDate: date,
    })

    const allDay = tasks.filter((t) => t.isAllDay)
    const timed = tasks.filter((t) => !t.isAllDay)

    return {
      date,
      allDay,
      timed,
    }
  }

  /**
   * 批量更新任务状态
   */
  async batchUpdateStatus(
    userId: string,
    taskIds: string[],
    status: 'pending' | 'completed' | 'cancelled'
  ): Promise<number> {
    const updateData: any = { status }
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    const result = await TaskModel.updateMany(
      { _id: { $in: taskIds }, userId },
      { $set: updateData }
    )

    return result.modifiedCount
  }

  /**
   * 获取任务统计
   */
  async getTaskStats(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    total: number
    completed: number
    pending: number
    cancelled: number
    completionRate: number
  }> {
    const tasks = await TaskModel.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean()

    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const pending = tasks.filter((t) => t.status === 'pending').length
    const cancelled = tasks.filter((t) => t.status === 'cancelled').length

    return {
      total,
      completed,
      pending,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  // ========== GoalPilot 新增方法 ==========

  /**
   * 计算 Deadline 关联日程的进度
   * @returns { total, completed, progress }
   */
  async getDeadlineProgress(
    userId: string,
    deadlineRefId: string
  ): Promise<{ total: number; completed: number; progress: number }> {
    const tasks = await TaskModel.find({
      userId,
      deadlineRefId,
    }).lean()

    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, progress }
  }

  /**
   * 计算 Series 关联日程的统计
   * @returns { total, completed, completionRate }
   */
  async getSeriesStats(
    userId: string,
    seriesRefId: string
  ): Promise<{ total: number; completed: number; completionRate: number }> {
    const tasks = await TaskModel.find({
      userId,
      seriesRefId,
    }).lean()

    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, completionRate }
  }

  /**
   * 批量创建日程 (用于 SeriesGenerator 生成)
   */
  async batchCreateTasks(
    userId: string,
    tasks: CreateTaskRequest[]
  ): Promise<Task[]> {
    const docs = tasks.map((data) => ({
      userId,
      ...data,
      status: 'pending',
    }))

    const saved = await TaskModel.insertMany(docs)
    return saved.map((t) => ({
      ...t.toObject(),
      id: t._id.toString(),
    })) as Task[]
  }

  /**
   * 批量删除未来日程 (用于取消规划时清理)
   * 只删除指定日期之后的未完成日程
   */
  async batchDeleteFutureTasks(
    userId: string,
    options: {
      seriesRefId?: string
      deadlineRefId?: string
      fromDate?: string  // 默认今天
    }
  ): Promise<number> {
    const fromDate = options.fromDate || new Date().toISOString().split('T')[0]

    const query: any = {
      userId,
      date: { $gte: fromDate },
      status: 'pending',  // 只删除未完成的
    }

    if (options.seriesRefId) {
      query.seriesRefId = options.seriesRefId
    }

    if (options.deadlineRefId) {
      query.deadlineRefId = options.deadlineRefId
    }

    // 必须有 seriesRefId 或 deadlineRefId 之一
    if (!options.seriesRefId && !options.deadlineRefId) {
      throw new ApiError(ApiErrorCode.INVALID_PARAMS, '必须指定 seriesRefId 或 deadlineRefId')
    }

    const result = await TaskModel.deleteMany(query)
    return result.deletedCount
  }
}

// 导出单例
export const taskService = new TaskService()

