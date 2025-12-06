/**
 * 微信服务号消息回调路由
 *
 * 处理来自微信服务器的消息推送
 * 直接代理到 message-service 处理
 */

import { Router, IRouter, Response } from 'express'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import { ClientRequest, IncomingMessage, ServerResponse } from 'http'
import { ENV, SERVICE_PORTS, ServiceName } from '@assistent/shared'

export const wxCallbackRouter: IRouter = Router()

// 获取 message-service 地址
function getMessageServiceUrl(): string {
  if (ENV.IS_PROD) {
    return `http://${ServiceName.MESSAGE}`
  }
  return `http://localhost:${SERVICE_PORTS[ServiceName.MESSAGE]}`
}

// 创建代理配置
const proxyOptions: Options = {
  target: getMessageServiceUrl(),
  changeOrigin: true,
  pathRewrite: {
    // /wx/callback -> /message
    '^/wx/callback': '/message',
  },
  onProxyReq: (_proxyReq: ClientRequest, req: IncomingMessage) => {
    // 微信消息是 XML 格式，需要保持原始 body
    // http-proxy-middleware 会自动处理
    console.log(`[WX Callback] ${req.method} ${req.url}`)
  },
  onProxyRes: (proxyRes: IncomingMessage) => {
    console.log(`[WX Callback] Response: ${proxyRes.statusCode}`)
  },
  onError: (err: Error, _req: IncomingMessage, res: ServerResponse | Response) => {
    console.error('[WX Callback Error]', err)
    if (res && 'status' in res) {
      // 微信服务器期望收到 "success" 或空字符串
      (res as Response).status(200).send('success')
    }
  },
}

// 代理所有请求到 message-service
wxCallbackRouter.use('/', createProxyMiddleware(proxyOptions))

