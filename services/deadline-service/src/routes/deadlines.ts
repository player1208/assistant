/**
 * Deadline (截止日) 路由
 * GoalPilot Deadline 模块 - 项目层
 */

import { Router } from 'express'
import { requireUser } from '../middleware/wxUser'
import * as deadlineController from '../controllers/deadlineController'

export const deadlineRouter = Router()

// 所有路由都需要用户登录
deadlineRouter.use(requireUser)

// Deadline CRUD
deadlineRouter.post('/', deadlineController.createDeadline)
deadlineRouter.get('/', deadlineController.getDeadlines)
deadlineRouter.get('/:id', deadlineController.getDeadline)
deadlineRouter.get('/:id/full', deadlineController.getDeadlineFull)
deadlineRouter.put('/:id', deadlineController.updateDeadline)
deadlineRouter.delete('/:id', deadlineController.deleteDeadline)

// ActionPlan CRUD
deadlineRouter.post('/:deadlineId/action-plans', deadlineController.createActionPlan)
deadlineRouter.get('/:deadlineId/action-plans', deadlineController.getActionPlans)
deadlineRouter.put('/action-plans/:actionPlanId', deadlineController.updateActionPlan)
deadlineRouter.delete('/action-plans/:actionPlanId', deadlineController.deleteActionPlan)

// ActionPlan 批量操作
deadlineRouter.post('/action-plans/batch/order', deadlineController.batchUpdateActionPlanOrder)

