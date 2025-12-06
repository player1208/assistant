/**
 * 限流中间件
 */

import rateLimit from 'express-rate-limit'
import { RATE_LIMIT, ApiErrorCode } from '@assistent/shared'

// 通用限流器
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    code: ApiErrorCode.RATE_LIMITED,
    message: '请求过于频繁，请稍后再试',
    data: null,
    timestamp: Date.now(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 使用 OpenID 作为限流 key
  keyGenerator: (req) => {
    return req.wxUser?.openId || req.ip || 'anonymous'
  },
})

// 严格限流器 - 用于敏感操作
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 最多 10 次
  message: {
    code: ApiErrorCode.RATE_LIMITED,
    message: '操作过于频繁，请稍后再试',
    data: null,
    timestamp: Date.now(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.wxUser?.openId || req.ip || 'anonymous'
  },
})

