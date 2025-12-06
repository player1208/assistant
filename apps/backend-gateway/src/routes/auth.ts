/**
 * 认证路由
 * 
 * 处理微信网页授权和 JWT Token 相关接口
 */

import { Router, Request, Response, IRouter } from 'express'
import { ENV, generateToken } from '@assistent/shared'
import { generateAuthUrl, getAccessToken } from '../services/wxOAuth'
import { asyncHandler } from '../middleware/errorHandler'

export const authRouter: IRouter = Router()

/**
 * GET /auth/wx/authorize
 * 
 * 生成微信授权 URL，前端跳转到此 URL 进行授权
 * 
 * Query 参数:
 * - redirect: 授权成功后的前端跳转地址（可选，默认首页）
 * - scope: 授权范围 snsapi_base | snsapi_userinfo（可选，默认 snsapi_base）
 */
authRouter.get('/wx/authorize', (req: Request, res: Response) => {
  const { redirect = '/', scope = 'snsapi_base' } = req.query
  
  // 回调地址指向后端的 /auth/wx/callback
  const callbackUrl = `${ENV.FRONTEND_URL}/api/v1/auth/wx/callback`
  
  // state 参数传递前端重定向地址
  const state = encodeURIComponent(redirect as string)
  
  // 生成微信授权 URL
  const authUrl = generateAuthUrl(
    callbackUrl,
    state,
    scope as 'snsapi_base' | 'snsapi_userinfo'
  )
  
  // 返回授权 URL，前端自行跳转
  res.json({
    code: 0,
    message: 'success',
    data: { authUrl },
    timestamp: Date.now(),
  })
})

/**
 * GET /auth/wx/callback
 * 
 * 微信授权回调，处理授权码并生成 JWT Token
 * 
 * Query 参数:
 * - code: 微信授权码
 * - state: 前端重定向地址
 */
authRouter.get('/wx/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query
  
  if (!code) {
    // 用户拒绝授权或其他错误
    const redirectUrl = state ? decodeURIComponent(state as string) : '/'
    return res.redirect(`${ENV.FRONTEND_URL}${redirectUrl}?error=auth_denied`)
  }
  
  try {
    // 用授权码换取 access_token 和 openid
    const tokenData = await getAccessToken(code as string)
    
    // 生成 JWT Token
    const token = generateToken({
      openId: tokenData.openid,
      unionId: tokenData.unionid,
      source: 'web',
    })
    
    // 重定向到前端，并携带 token
    const redirectPath = state ? decodeURIComponent(state as string) : '/'
    const separator = redirectPath.includes('?') ? '&' : '?'
    
    res.redirect(`${ENV.FRONTEND_URL}${redirectPath}${separator}token=${token}`)
  } catch (error) {
    console.error('微信授权回调失败:', error)
    const redirectPath = state ? decodeURIComponent(state as string) : '/'
    res.redirect(`${ENV.FRONTEND_URL}${redirectPath}?error=auth_failed`)
  }
}))

/**
 * POST /auth/refresh
 * 
 * 刷新 Token（暂时不实现，直接返回错误让用户重新登录）
 */
authRouter.post('/refresh', (_req: Request, res: Response) => {
  res.status(401).json({
    code: 1001,
    message: '请重新登录',
    data: null,
    timestamp: Date.now(),
  })
})

/**
 * GET /auth/check
 * 
 * 检查当前认证状态（供前端调用检测是否已登录）
 */
authRouter.get('/check', (req: Request, res: Response) => {
  // 如果能到达这里，说明已经通过了认证中间件
  const wxUser = req.wxUser
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      isAuthenticated: !!wxUser,
      user: wxUser ? {
        openId: wxUser.openId,
        source: wxUser.source,
      } : null,
    },
    timestamp: Date.now(),
  })
})

/**
 * GET /auth/dev/login
 * 
 * 开发环境快速登录（生成测试 Token）
 * 仅在开发环境可用
 */
authRouter.get('/dev/login', (req: Request, res: Response) => {
  if (ENV.IS_PROD) {
    return res.status(403).json({
      code: 1003,
      message: '此接口仅在开发环境可用',
      data: null,
      timestamp: Date.now(),
    })
  }
  
  const { userId = 'dev_user_mock_openid' } = req.query
  
  // 生成测试 Token
  const token = generateToken({
    openId: userId as string,
    source: 'web',
  })
  
  res.json({
    code: 0,
    message: 'success',
    data: { token },
    timestamp: Date.now(),
  })
})

