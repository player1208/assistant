/**
 * 健康检查路由
 */

import { Router, IRouter } from 'express'
import { successResponse, ENV } from '@assistent/shared'
import { llmService } from '../services/llmService'

export const healthRouter: IRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.json(successResponse({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
    llm: {
      provider: ENV.LLM_PROVIDER,
      model: ENV.LLM_MODEL,
    },
  }))
})

healthRouter.get('/ready', async (_req, res) => {
  // 检查 LLM 服务是否可用
  const llmReady = await llmService.checkHealth()
  
  if (!llmReady) {
    res.status(503).json({
      code: 5001,
      message: '服务未就绪',
      data: { llm: 'unavailable' },
      timestamp: Date.now(),
    })
    return
  }
  
  res.json(successResponse({
    status: 'ready',
    checks: { llm: 'ok' },
  }))
})

