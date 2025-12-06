/**
 * 微信认证中间件
 *
 * 支持两种认证方式：
 * 1. 微信云托管自动注入的请求头（x-wx-openid 等）
 * 2. JWT Token（Authorization: Bearer <token>）
 *
 * 优先级：微信头 > JWT Token > 开发环境模拟用户
 */

import { Request, Response, NextFunction } from 'express'
import { HEADERS, ENV, ApiErrorCode, verifyToken, extractTokenFromHeader } from '@assistent/shared'
import { ApiError } from './errorHandler'

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      wxUser?: {
        openId: string
        unionId?: string
        appId?: string
        source: 'wx' | 'out' | 'dev' | 'web'
      }
    }
  }
}

export function wxAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // 方式1: 检查微信云托管自动注入的请求头
  const wxOpenId = req.headers[HEADERS.WX_OPENID] as string | undefined
  const unionId = req.headers[HEADERS.WX_UNIONID] as string | undefined
  const appId = req.headers[HEADERS.WX_APPID] as string | undefined
  const source = req.headers[HEADERS.WX_SOURCE] as string | undefined

  if (wxOpenId) {
    // 微信环境，使用微信注入的用户信息
    req.wxUser = {
      openId: wxOpenId,
      unionId,
      appId,
      source: (source as 'wx' | 'out') || 'wx',
    }
    next()
    return
  }

  // 方式2: 检查 JWT Token
  const authHeader = req.headers[HEADERS.AUTHORIZATION] as string | undefined
  const token = extractTokenFromHeader(authHeader)

  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      req.wxUser = {
        openId: payload.openId,
        unionId: payload.unionId,
        source: 'web',
      }
      next()
      return
    }
    // Token 无效，不要在这里抛错，让后面的逻辑处理
  }

  // 方式3: 开发环境允许无认证访问（使用模拟用户）
  if (ENV.IS_DEV) {
    // 检查是否有模拟用户头
    const mockUserId = req.headers['x-mock-user-id'] as string | undefined
    req.wxUser = {
      openId: mockUserId || 'dev_user_mock_openid',
      source: 'dev',
    }
    next()
    return
  }

  // 生产环境无认证信息，抛出错误
  throw new ApiError(ApiErrorCode.UNAUTHORIZED, '请先登录')
}

// 可选的严格认证中间件 - 用于需要强制登录的接口
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.wxUser?.openId) {
    throw new ApiError(ApiErrorCode.UNAUTHORIZED, '请先登录')
  }
  next()
}

