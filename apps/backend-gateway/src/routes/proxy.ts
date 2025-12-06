/**
 * 代理路由 - 将请求转发到对应的微服务
 *
 * 本地开发时：直接转发到各服务的端口
 * 云托管部署时：使用内网地址进行服务间调用
 */

import { Router, IRouter, Request, Response } from 'express'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import { ClientRequest, IncomingMessage, ServerResponse } from 'http'
import { ENV, SERVICE_PORTS, ServiceName, HEADERS } from '@assistent/shared'

export const proxyRouter: IRouter = Router()

// 获取服务地址
function getServiceUrl(serviceName: ServiceName): string {
  if (ENV.IS_PROD) {
    // 微信云托管内网调用格式
    // 参考: https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/service/service-call.html
    return `http://${serviceName}`
  }
  // 本地开发
  return `http://localhost:${SERVICE_PORTS[serviceName]}`
}

// 获取消息服务地址
function getMessageServiceUrl(): string {
  if (ENV.IS_PROD) {
    return `http://${ServiceName.MESSAGE}`
  }
  return `http://localhost:${SERVICE_PORTS[ServiceName.MESSAGE]}`
}

// 创建消息服务代理配置
function createMessageProxyOptions(): Options {
  return {
    target: getMessageServiceUrl(),
    changeOrigin: true,
    pathRewrite: (path: string) => {
      // /api/v1/message/test -> /message/test
      return path.replace(/^\/api\/v1\/message/, '/message')
    },
    bodyParser: false,
    onProxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
      // 转发用户信息
      if ((req as Request & { wxUser?: { openId: string; unionId?: string } }).wxUser) {
        const wxUser = (req as Request & { wxUser: { openId: string; unionId?: string } }).wxUser
        proxyReq.setHeader(HEADERS.WX_OPENID, wxUser.openId)
        if (wxUser.unionId) {
          proxyReq.setHeader(HEADERS.WX_UNIONID, wxUser.unionId)
        }
      }

      // 处理请求体
      if ((req as any).body) {
        const bodyData = JSON.stringify((req as any).body)
        proxyReq.setHeader('Content-Type', 'application/json; charset=utf-8')
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData, 'utf8'))
        proxyReq.write(bodyData, 'utf8')
      }
    },
    onError: (err: Error, _req: IncomingMessage, res: ServerResponse | Response) => {
      console.error('[Message Proxy Error]', err)
      if (res && 'status' in res) {
        (res as Response).status(502).json({
          code: 5001,
          message: '消息服务暂时不可用',
          data: null,
          timestamp: Date.now(),
        })
      }
    },
  }
}

// 创建代理配置
function createProxyOptions(serviceName: ServiceName): Options {
  // 根据服务类型设置路径重写规则
  let pathRewrite: Record<string, string> | ((path: string) => string) = {}

  if (serviceName === ServiceName.SCHEDULE) {
    // 将 /api/v1/schedule/day/... 改成 /tasks/day/...
    // 将 /api/v1/schedule/stats/... 改成 /tasks/stats/...
    // 将 /api/v1/schedule/... 改成 /tasks/...
    pathRewrite = (path: string) => {
      // 移除 /api/v1/schedule 前缀
      let newPath = path.replace(/^\/api\/v1\/schedule/, '')
      // 添加 /tasks 前缀
      newPath = `/tasks${newPath}`
      return newPath
    }
  } else if (serviceName === ServiceName.DEADLINE) {
    // 将 /api/v1/deadline/... 改成 /deadlines/...
    pathRewrite = (path: string) => {
      // 移除 /api/v1/deadline 前缀
      let newPath = path.replace(/^\/api\/v1\/deadline/, '')
      // 添加 /deadlines 前缀
      newPath = `/deadlines${newPath}`
      return newPath
    }
  } else if (serviceName === ServiceName.AI) {
    // 将 /api/v1/ai/... 改成 /ai/...
    pathRewrite = (path: string) => {
      // 移除 /api/v1/ai 前缀
      let newPath = path.replace(/^\/api\/v1\/ai/, '')
      // 添加 /ai 前缀
      newPath = `/ai${newPath}`
      return newPath
    }
  }

  return {
    target: getServiceUrl(serviceName),
    changeOrigin: true,
    pathRewrite,
    // 禁用自动的 bodyParser，我们在 Express 中间件中已经处理过了
    bodyParser: false,
    onProxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
      // 转发用户信息
      if ((req as Request & { wxUser?: { openId: string; unionId?: string } }).wxUser) {
        const wxUser = (req as Request & { wxUser: { openId: string; unionId?: string } }).wxUser
        proxyReq.setHeader(HEADERS.WX_OPENID, wxUser.openId)
        if (wxUser.unionId) {
          proxyReq.setHeader(HEADERS.WX_UNIONID, wxUser.unionId)
        }
      }

      // 转发请求ID
      if ((req as Request & { requestId?: string }).requestId) {
        proxyReq.setHeader(HEADERS.X_REQUEST_ID, (req as Request & { requestId: string }).requestId)
      }

      // 标记调用来源
      proxyReq.setHeader(HEADERS.X_SERVICE_NAME, ServiceName.GATEWAY)

      // 处理请求体 - 对于有 body 的请求（POST, PUT, PATCH）
      if ((req as any).body) {
        const bodyData = JSON.stringify((req as any).body)
        proxyReq.setHeader('Content-Type', 'application/json; charset=utf-8')
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData, 'utf8'))
        proxyReq.write(bodyData, 'utf8')
      }
    },
    onProxyRes: (proxyRes: IncomingMessage) => {
      // 可以在这里处理响应
    },
    onError: (err: Error, _req: IncomingMessage, res: ServerResponse | Response) => {
      console.error('[Proxy Error]', err)
      if (res && 'status' in res) {
        (res as Response).status(502).json({
          code: 5001,
          message: '服务暂时不可用',
          data: null,
          timestamp: Date.now(),
        })
      }
    },
  }
}

// 日程服务代理
proxyRouter.use(
  '/schedule',
  createProxyMiddleware(createProxyOptions(ServiceName.SCHEDULE))
)

// Deadline 服务代理
proxyRouter.use(
  '/deadline',
  createProxyMiddleware(createProxyOptions(ServiceName.DEADLINE))
)

// AI 服务代理
proxyRouter.use(
  '/ai',
  createProxyMiddleware(createProxyOptions(ServiceName.AI))
)

// 消息测试代理（用于模拟微信消息发送接收）
proxyRouter.use(
  '/message',
  createProxyMiddleware(createMessageProxyOptions())
)

// 默认响应
proxyRouter.get('/', (_req, res) => {
  res.json({
    code: 0,
    message: 'API Gateway v1',
    data: {
      version: '1.0.0',
      services: ['schedule', 'deadline', 'ai', 'message'],
    },
    timestamp: Date.now(),
  })
})

