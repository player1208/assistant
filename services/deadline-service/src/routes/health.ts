/**
 * 健康检查路由
 */

import { Router } from 'express'
import { successResponse } from '@assistent/shared'
import { isDatabaseConnected } from '../config/database'

export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.json(successResponse({
    status: 'healthy',
    service: 'deadline-service',
    timestamp: new Date().toISOString(),
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
  }))
})

healthRouter.get('/ready', (_req, res) => {
  const dbConnected = isDatabaseConnected()
  
  if (!dbConnected) {
    res.status(503).json({
      code: 5001,
      message: '服务未就绪',
      data: { database: 'disconnected' },
      timestamp: Date.now(),
    })
    return
  }
  
  res.json(successResponse({
    status: 'ready',
    checks: { database: 'ok' },
  }))
})

