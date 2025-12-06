/**
 * 消息处理路由
 * 
 * 处理来自微信服务号的消息
 */

import { Router, Request, Response, IRouter } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { wxSignatureVerify } from '../middleware/wxSignature'
import { messageService } from '../services/messageService'
import { xmlService } from '../services/xmlService'

export const messageRouter: IRouter = Router()

/**
 * GET /message - 微信服务器验证
 * 
 * 微信服务器会发送 GET 请求验证服务器配置
 * 参数：signature, timestamp, nonce, echostr
 */
messageRouter.get('/', wxSignatureVerify, (req: Request, res: Response) => {
  // 验证成功后，原样返回 echostr
  const { echostr } = req.query
  console.log('✅ 微信服务器验证成功')
  res.send(echostr)
})

/**
 * POST /message - 接收微信消息
 * 
 * 微信服务器会发送 POST 请求推送消息
 * 消息格式为 XML
 */
messageRouter.post('/', wxSignatureVerify, asyncHandler(async (req: Request, res: Response) => {
  const xmlBody = req.body as string
  
  console.log('📩 收到微信消息:', xmlBody.substring(0, 200))
  
  try {
    // 1. 解析 XML 消息
    const wxMessage = await xmlService.parseMessage(xmlBody)
    console.log('📝 解析后的消息:', JSON.stringify(wxMessage, null, 2))
    
    // 2. 处理消息
    const result = await messageService.handleMessage(wxMessage)
    
    // 3. 构造 XML 回复
    const replyXml = xmlService.buildReply(
      wxMessage.fromUserName,
      wxMessage.toUserName,
      result.reply
    )
    
    console.log('📤 回复消息:', replyXml.substring(0, 200))
    
    // 4. 返回 XML 响应
    res.set('Content-Type', 'text/xml')
    res.send(replyXml)
    
  } catch (error) {
    console.error('❌ 处理消息失败:', error)
    
    // 返回空字符串表示不回复（微信不会重试）
    // 或者返回一个友好的错误提示
    const errorReply = xmlService.buildReply(
      (await xmlService.parseMessage(xmlBody)).fromUserName,
      (await xmlService.parseMessage(xmlBody)).toUserName,
      '抱歉，处理消息时出现了问题，请稍后再试。'
    )
    res.set('Content-Type', 'text/xml')
    res.send(errorReply)
  }
}))

/**
 * POST /message/test - 测试接口（仅开发环境）
 * 
 * 用于本地测试消息处理逻辑
 */
messageRouter.post('/test', asyncHandler(async (req: Request, res: Response) => {
  const { text, userId } = req.body
  
  if (!text) {
    res.status(400).json({
      code: 1001,
      message: '缺少 text 参数',
      data: null,
      timestamp: Date.now(),
    })
    return
  }
  
  // 构造模拟的微信消息
  const mockMessage = {
    toUserName: 'gh_test',
    fromUserName: userId || 'test_user_openid',
    createTime: Math.floor(Date.now() / 1000),
    msgType: 'text' as const,
    content: text,
    msgId: `test_${Date.now()}`,
  }
  
  // 处理消息
  const result = await messageService.handleMessage(mockMessage)
  
  res.json({
    code: 0,
    message: 'success',
    data: result,
    timestamp: Date.now(),
  })
}))

