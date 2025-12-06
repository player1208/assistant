/**
 * Schedule Service - 日程服务入口
 *
 * 职责：
 * 1. 任务的 CRUD 操作
 * 2. 日程查询和统计
 * 3. 任务提醒管理
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
import { taskRouter } from './routes/tasks'

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
app.use('/tasks', taskRouter)

// 根路由
app.get('/', (_req, res) => {
  res.json({
    code: 0,
    message: 'Schedule Service',
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
const PORT = ENV.IS_PROD ? ENV.PORT : SERVICE_PORTS[ServiceName.SCHEDULE]

async function bootstrap() {
  try {
    // 连接数据库
    await connectDatabase()
    
    app.listen(PORT, () => {
      console.log(`📅 Schedule Service 启动成功`)
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

