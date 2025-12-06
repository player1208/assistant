/**
 * 微信签名验证中间件
 * 
 * 用于验证请求是否来自微信服务器
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { ENV } from '@assistent/shared'

/**
 * 验证微信签名
 * 
 * 微信服务器在推送消息时会带上 signature、timestamp、nonce 参数
 * 开发者通过检验 signature 对请求进行校验
 * 
 * 校验流程：
 * 1. 将 token、timestamp、nonce 三个参数进行字典序排序
 * 2. 将三个参数字符串拼接成一个字符串进行 sha1 加密
 * 3. 开发者获得加密后的字符串可与 signature 对比，标识该请求来源于微信
 */
export function wxSignatureVerify(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { signature, timestamp, nonce } = req.query
  
  // 开发环境可以跳过验证
  if (ENV.IS_DEV && !signature) {
    console.log('⚠️ 开发环境跳过签名验证')
    next()
    return
  }
  
  if (!signature || !timestamp || !nonce) {
    console.warn('❌ 缺少签名参数')
    res.status(400).send('Missing signature parameters')
    return
  }
  
  const token = ENV.WX_MP_TOKEN
  
  // 1. 字典序排序
  const arr = [token, timestamp as string, nonce as string].sort()
  
  // 2. SHA1 加密
  const str = arr.join('')
  const hash = crypto.createHash('sha1').update(str).digest('hex')
  
  // 3. 对比签名
  if (hash === signature) {
    console.log('✅ 签名验证通过')
    next()
  } else {
    console.warn('❌ 签名验证失败')
    console.warn(`   期望: ${hash}`)
    console.warn(`   实际: ${signature}`)
    res.status(403).send('Invalid signature')
  }
}

