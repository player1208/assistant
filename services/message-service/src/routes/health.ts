/**
 * 健康检查路由
 */

import { Router, IRouter } from 'express'
import { successResponse } from '@assistent/shared'

export const healthRouter: IRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.json(successResponse({
    status: 'healthy',
    service: 'message-service',
    timestamp: new Date().toISOString(),
  }))
})

healthRouter.get('/ready', (_req, res) => {
  res.json(successResponse({
    status: 'ready',
    checks: {
      service: 'ok',
    },
  }))
})

