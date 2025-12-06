/**
 * 健康检查路由
 * 
 * 微信云托管会定期访问健康检查接口来判断服务是否正常
 */

import { Router, IRouter } from 'express'
import { successResponse } from '@assistent/shared'

export const healthRouter: IRouter = Router()

// 健康检查
healthRouter.get('/', (_req, res) => {
  res.json(successResponse({
    status: 'healthy',
    service: 'backend-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))
})

// 就绪检查 (可以检查数据库连接等)
healthRouter.get('/ready', (_req, res) => {
  // TODO: 添加数据库连接检查等
  res.json(successResponse({
    status: 'ready',
    checks: {
      database: 'ok', // 后续实现真实检查
      cache: 'ok',
    },
  }))
})

// 存活检查
healthRouter.get('/live', (_req, res) => {
  res.json(successResponse({
    status: 'alive',
    pid: process.pid,
    memory: process.memoryUsage(),
  }))
})

