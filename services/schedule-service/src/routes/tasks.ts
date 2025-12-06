/**
 * 任务路由 (GoalPilot Schedule 模块)
 */

import { Router } from 'express'
import { requireUser } from '../middleware/wxUser'
import * as taskController from '../controllers/taskController'

export const taskRouter = Router()

// 所有任务路由都需要用户登录
taskRouter.use(requireUser)

// 任务 CRUD - 注意：具体路由要在通用路由之前定义
taskRouter.post('/', taskController.createTask)
taskRouter.get('/', taskController.queryTasks)

// 特定路由 (必须在 /:id 之前)
taskRouter.get('/stats', taskController.getTaskStats)
taskRouter.get('/day/:date', taskController.getDayTasks)

// ========== GoalPilot 新增路由 ==========
// 批量创建任务 (用于 SeriesGenerator)
taskRouter.post('/batch', taskController.batchCreateTasks)
// 批量删除未来任务
taskRouter.delete('/batch/future', taskController.batchDeleteFutureTasks)
// 获取 Deadline 关联日程的进度
taskRouter.get('/deadline/:deadlineId/progress', taskController.getDeadlineProgress)
// 获取 Series 关联日程的统计
taskRouter.get('/series/:seriesId/stats', taskController.getSeriesStats)

// 快捷操作 (必须在 /:id 之前)
taskRouter.patch('/:id/toggle', taskController.toggleTaskStatus)
taskRouter.post('/batch/status', taskController.batchUpdateStatus)

// 通用 ID 路由 (必须在最后)
taskRouter.get('/:id', taskController.getTask)
taskRouter.put('/:id', taskController.updateTask)
taskRouter.delete('/:id', taskController.deleteTask)

