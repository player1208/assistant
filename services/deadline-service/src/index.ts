/**
 * Deadline Service - 截止日服务入口 (GoalPilot 项目层)
 *
 * 职责：
 * 1. Deadline 截止日管理
 * 2. ActionPlan 行动计划管理
 * 3. 支持两种策略：拆解模式(decompose)、监控模式(monitor)
 */

// 加载 .env 环境变量 (必须在最前面)
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { ENV, SERVICE_PORTS, ServiceName } from '@assistent/shared'
import { connectDatabase } from './config/database'
import { errorHandler } from './middleware/errorHandler'
import { extractWxUser } from './middleware/wxUser'
import { healthRouter } from './routes/health'
import { deadlineRouter } from './routes/deadlines'

const app = express()

// ========== 基础中间件 ==========
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(ENV.IS_PROD ? 'combined' : 'dev'))

// ========== 用户信息提取 ==========
app.use(extractWxUser)

// ========== 路由 ==========
app.use('/health', healthRouter)
app.use('/deadlines', deadlineRouter)

// 根路由
app.get('/', (_req, res) => {
  res.json({
    code: 0,
    message: 'Deadline Service (GoalPilot 项目层)',
    data: { version: '1.0.0' },
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
const PORT = ENV.IS_PROD ? ENV.PORT : SERVICE_PORTS[ServiceName.DEADLINE]

async function bootstrap() {
  try {
    await connectDatabase()
    
    app.listen(PORT, () => {
      console.log(`📅 Deadline Service 启动成功`)
      console.log(`   环境: ${ENV.NODE_ENV}`)
      console.log(`   端口: ${PORT}`)
    })
  } catch (error) {
    console.error('❌ 启动失败:', error)
    process.exit(1)
  }
}

bootstrap()

export default app

