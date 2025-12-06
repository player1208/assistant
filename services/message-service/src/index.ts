/**
 * Message Service - 消息服务入口
 * 
 * 职责：
 * 1. 接收微信服务号消息
 * 2. 解析消息并调用 AI 服务
 * 3. 根据意图调用对应的业务服务
 * 4. 构造回复消息
 */

import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { ENV, SERVICE_PORTS, ServiceName } from '@assistent/shared'
import { errorHandler } from './middleware/errorHandler'
import { healthRouter } from './routes/health'
import { messageRouter } from './routes/message'

const app: Application = express()

// ========== 基础中间件 ==========
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
// 注意：微信消息是 XML 格式，需要 raw body
app.use(express.text({ type: 'text/xml', limit: '1mb' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(ENV.IS_PROD ? 'combined' : 'dev'))

// ========== 路由 ==========
app.use('/health', healthRouter)
app.use('/message', messageRouter)

// 根路由
app.get('/', (_req, res) => {
  res.json({
    code: 0,
    message: 'Message Service',
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
const PORT = ENV.IS_PROD ? ENV.PORT : SERVICE_PORTS[ServiceName.MESSAGE]

async function bootstrap() {
  try {
    app.listen(PORT, () => {
      console.log(`💬 Message Service 启动成功`)
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

