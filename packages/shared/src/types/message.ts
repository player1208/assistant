/**
 * 消息相关类型定义
 * 
 * 用于微信服务号消息处理
 */

// ========== 微信消息类型 ==========

// 微信消息基础类型
export interface WxMessageBase {
  toUserName: string       // 接收方（开发者微信号）
  fromUserName: string     // 发送方 OpenID
  createTime: number       // 消息创建时间戳
  msgType: WxMessageType   // 消息类型
}

// 微信消息类型枚举
export type WxMessageType = 'text' | 'image' | 'voice' | 'video' | 'shortvideo' | 'location' | 'link' | 'event'

// 文本消息
export interface WxTextMessage extends WxMessageBase {
  msgType: 'text'
  content: string          // 文本内容
  msgId: string           // 消息ID
}

// 图片消息
export interface WxImageMessage extends WxMessageBase {
  msgType: 'image'
  picUrl: string          // 图片链接
  mediaId: string         // 图片媒体ID
  msgId: string
}

// 语音消息
export interface WxVoiceMessage extends WxMessageBase {
  msgType: 'voice'
  mediaId: string
  format: string          // 语音格式 (amr, speex)
  recognition?: string    // 语音识别结果（需开启）
  msgId: string
}

// 事件消息
export interface WxEventMessage extends WxMessageBase {
  msgType: 'event'
  event: WxEventType      // 事件类型
  eventKey?: string       // 事件KEY
}

// 事件类型
export type WxEventType = 'subscribe' | 'unsubscribe' | 'SCAN' | 'LOCATION' | 'CLICK' | 'VIEW'

// 联合类型
export type WxMessage = WxTextMessage | WxImageMessage | WxVoiceMessage | WxEventMessage

// ========== 微信回复消息类型 ==========

// 回复消息基础类型
export interface WxReplyBase {
  toUserName: string      // 接收方 OpenID
  fromUserName: string    // 开发者微信号
  createTime: number      // 时间戳
  msgType: WxReplyType
}

export type WxReplyType = 'text' | 'image' | 'voice' | 'video' | 'music' | 'news'

// 文本回复
export interface WxTextReply extends WxReplyBase {
  msgType: 'text'
  content: string
}

// 图文回复
export interface WxNewsReply extends WxReplyBase {
  msgType: 'news'
  articleCount: number
  articles: WxNewsArticle[]
}

export interface WxNewsArticle {
  title: string
  description: string
  picUrl: string
  url: string
}

export type WxReply = WxTextReply | WxNewsReply

// ========== 内部消息处理类型 ==========

// 处理后的消息（统一格式）
export interface ProcessedMessage {
  userId: string          // 用户 OpenID
  type: 'text' | 'voice' | 'image' | 'event'
  content: string         // 文本内容或语音识别结果
  rawMessage: WxMessage   // 原始消息
  timestamp: number
  requestId: string       // 请求追踪ID
}

// 消息处理结果
export interface MessageProcessResult {
  success: boolean
  reply: string           // 回复内容
  action?: MessageAction  // 执行的操作
  error?: string
  // 双AI流程调试信息
  debug?: {
    timeline?: {
      receivedAt: number
      feedbackSentAt: number
      ai1StartTime: number
      ai1EndTime: number
      ai2StartTime?: number
      ai2EndTime?: number
      replySentAt: number
      totalTime: number
    }
    replyType?: string
    actionSummary?: string
    ai1Output?: {
      rawOutput: unknown
      intent: string
      needsAI2: boolean
    }
    ai2Output?: {
      rawOutput: unknown
      toolCalls: Array<{ tool: string; args: Record<string, unknown> }>
      finalReport: string
      success: boolean
    } | null
  }
}

// 消息触发的操作
export interface MessageAction {
  type: MessageActionType
  data?: Record<string, unknown>
  result?: unknown  // 操作结果，类型取决于具体操作
}

export type MessageActionType = 
  | 'create_task'         // 创建任务
  | 'query_task'          // 查询任务
  | 'update_task'         // 更新任务
  | 'delete_task'         // 删除任务
  | 'create_goal'         // 创建目标
  | 'query_goal'          // 查询目标
  | 'chat'                // 闲聊
  | 'none'                // 无操作

