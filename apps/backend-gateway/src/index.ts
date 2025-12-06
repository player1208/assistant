/**
 * Backend Gateway - API 网关入口
 * 
 * 职责：
 * 1. 接收所有前端请求
 * 2. 路由分发到对应的微服务
 * 3. 统一的认证/鉴权处理
 * 4. 请求日志记录
 * 5. 错误处理
 */

import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { ENV, API_PREFIX } from '@assistent/shared'
import { errorHandler } from './middleware/errorHandler'
import { requestIdMiddleware } from './middleware/requestId'
import { wxAuthMiddleware } from './middleware/wxAuth'
import { healthRouter } from './routes/health'
import { proxyRouter } from './routes/proxy'
import { wxCallbackRouter } from './routes/wxCallback'
import { authRouter } from './routes/auth'

const app: Application = express()

// ========== 基础中间件 ==========

// 安全头
app.use(helmet({
  // 微信云托管需要禁用一些限制
  contentSecurityPolicy: false,
}))

// CORS 配置
app.use(cors({
  origin: ENV.IS_PROD 
    ? [/\.weixin\.qq\.com$/, /\.tcloudbaseapp\.com$/]  // 生产环境限制来源
    : '*',  // 开发环境允许所有
  credentials: true,
}))

// 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求日志
app.use(morgan(ENV.IS_PROD ? 'combined' : 'dev'))

// 请求ID追踪
app.use(requestIdMiddleware)

// ========== 健康检查 (无需认证) ==========
app.use(API_PREFIX.HEALTH, healthRouter)

// ========== 微信服务号消息回调 (无需认证，使用签名验证) ==========
// 注意：微信消息是 XML 格式，需要在代理前处理
app.use(express.text({ type: 'text/xml', limit: '1mb' }))
app.use('/wx/callback', wxCallbackRouter)

// ========== 认证路由 (部分无需认证) ==========
// 授权和回调接口不需要认证，单独挂载
app.use(`${API_PREFIX.V1}/auth`, authRouter)

// ========== 微信认证中间件 ==========
app.use(wxAuthMiddleware)

// ========== API 路由 ==========
app.use(API_PREFIX.V1, proxyRouter)

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
const PORT = ENV.PORT

app.listen(PORT, () => {
  console.log(`🚀 Backend Gateway 启动成功`)
  console.log(`   环境: ${ENV.NODE_ENV}`)
  console.log(`   端口: ${PORT}`)
  console.log(`   健康检查: http://localhost:${PORT}${API_PREFIX.HEALTH}`)
  console.log(`   API 入口: http://localhost:${PORT}${API_PREFIX.V1}`)
})

export default app

