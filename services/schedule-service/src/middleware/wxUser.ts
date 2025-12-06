/**
 * 微信用户信息提取中间件
 * 
 * 从网关转发的请求头中提取用户信息
 */

import { Request, Response, NextFunction } from 'express'
import { HEADERS, ENV } from '@assistent/shared'

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      userId: string
      wxUser?: {
        openId: string
        unionId?: string
      }
    }
  }
}

export function extractWxUser(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const openId = req.headers[HEADERS.WX_OPENID] as string | undefined
  const unionId = req.headers[HEADERS.WX_UNIONID] as string | undefined

  // 开发环境使用模拟用户
  if (ENV.IS_DEV && !openId) {
    req.userId = 'dev_user_mock_openid'
    req.wxUser = { openId: 'dev_user_mock_openid' }
    next()
    return
  }

  if (openId) {
    req.userId = openId
    req.wxUser = { openId, unionId }
  }

  next()
}

// 要求用户已登录
export function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.userId) {
    res.status(401).json({
      code: 1002,
      message: '请先登录',
      data: null,
      timestamp: Date.now(),
    })
    return
  }
  next()
}

