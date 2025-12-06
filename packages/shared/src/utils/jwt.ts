/**
 * JWT 工具函数
 * 
 * 用于生成和验证 JWT Token
 */

import jwt from 'jsonwebtoken'
import { ENV } from '../constants'

// JWT Payload 类型
export interface JwtPayload {
  openId: string
  unionId?: string
  source: 'wx' | 'web'  // wx: 微信环境, web: 网页授权
  iat?: number
  exp?: number
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const expiresIn = ENV.JWT_EXPIRES_IN
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  })
}

/**
 * 验证 JWT Token
 * @returns payload 或 null（验证失败）
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * 从 Authorization header 中提取 token
 * 支持 "Bearer <token>" 格式
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  
  return authHeader
}

