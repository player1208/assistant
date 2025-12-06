/**
 * AI Service - AI 处理服务入口
 *
 * 双 AI 架构：
 * - AI-1 (DeepSeek-V3 Pro): 快速意图解析
 * - AI-2 (Qwen2.5-7B): Agent 工具调用
 */

// 加载 .env 环境变量 (必须在最前面)
import dotenv from 'dotenv'
dotenv.config()

import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { ENV, SERVICE_PORTS, ServiceName } from '@assistent/shared'
import { errorHandler } from './middleware/errorHandler'
import { healthRouter } from './routes/health'
import { processRouter } from './routes/process'
import { llmService } from './services/llmService'

const app: Application = express()

// ========== 基础中间件 ==========
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(ENV.IS_PROD ? 'combined' : 'dev'))

// ========== 路由 ==========
app.use('/health', healthRouter)
app.use('/process', processRouter)

// 根路由
app.get('/', (_req, res) => {
  res.json({
    code: 0,
    message: 'AI Service',
    data: { 
      version: '1.0.0',
      provider: ENV.LLM_PROVIDER,
    },
    timestamp: Date.now(),
  })
})

// ========== 404 处理 ==========
app.use((_req, res) => {
  res.status(404).json({
    code: 1004,
    message: '接口不存在',
    data: null,
    timestamp: Date.now(),
  })
})

// ========== 错误处理 ==========
app.use(errorHandler)

// ========== 启动服务 ==========
const PORT = ENV.IS_PROD ? ENV.PORT : SERVICE_PORTS[ServiceName.AI]

async function bootstrap() {
  try {
    // 获取模型配置
    const parserConfig = llmService.getConfig('parser')
    const agentConfig = llmService.getConfig('agent')

    app.listen(PORT, () => {
      console.log(`🤖 AI Service 启动成功 (双AI架构)`)
      console.log(`   环境: ${ENV.NODE_ENV}`)
      console.log(`   端口: ${PORT}`)
      console.log(`   ┌─ AI-1 意图解析器: ${parserConfig.model}`)
      console.log(`   └─ AI-2 Agent执行器: ${agentConfig.model}`)
    })
  } catch (error) {
    console.error('❌ 启动失败:', error)
    process.exit(1)
  }
}

bootstrap()

export default app

