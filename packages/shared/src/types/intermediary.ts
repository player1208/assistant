/**
 * 中间体类型定义
 *
 * 中间体（Intermediary）是整个消息处理的核心枢纽
 *
 * 职责：
 * 1. 【接收】接收用户微信端输入的消息
 * 2. 【即时反馈】发送"助手正在处理中"给用户
 * 3. 【日期注入】提供日期时间上下文给 AI1 和 AI2（避免工具调用）
 * 4. 【路由】管理消息路由，判断是否需要 AI2
 * 5. 【格式转换】统一 AI1 → AI2 的 JSON 格式
 * 6. 【结果处理】处理 AI2 响应，判断任务是否完成
 * 7. 【返回用户】将最终结果格式化后返回给用户
 */

import { IntentType, ExtractedEntities, TaskComplexity } from './ai'

// ========== 用户输入（中间体接收） ==========

/**
 * 用户微信端输入的消息
 * 中间体接收的原始请求
 */
export interface UserInputMessage {
  // 消息唯一标识
  messageId: string

  // 用户ID（微信openid等）
  userId: string

  // 消息内容
  content: string

  // 消息类型
  type: 'text' | 'voice' | 'image'

  // 消息来源平台
  platform: 'wechat' | 'web' | 'app'

  // 接收时间戳
  receivedAt: number
}

/**
 * 中间体即时反馈
 * 收到消息后立即发送给用户
 */
export interface ImmediateFeedback {
  // 关联的消息ID
  messageId: string

  // 反馈内容
  content: string  // 默认: "助手正在处理中..."

  // 发送时间戳
  sentAt: number
}

// ========== 日期时间上下文 ==========

/**
 * 日期时间上下文
 * 中间体在处理开始时生成，注入给 AI1 和 AI2
 * 注意：此信息仅用于判断用户操作是否合规，不参与任何计算
 */
export interface DateTimeContext {
  // 当前时间戳
  timestamp: number
  
  // 今天日期 (YYYY-MM-DD)
  today: string
  
  // 当前时间 (HH:mm:ss)
  currentTime: string
  
  // 星期几 (0-6, 0=周日)
  weekday: number
  
  // 星期几的中文表示
  weekdayName: string
  
  // 当前年份
  year: number
  
  // 当前月份 (1-12)
  month: number
  
  // 当前日期 (1-31)
  day: number
  
  // 时区
  timezone: string
  
  // 近一年的起始日期 (用于查询范围限制)
  oneYearAgo: string
  
  // 昨天日期
  yesterday: string
  
  // 本月第一天
  monthStart: string
  
  // 本月最后一天
  monthEnd: string
}

// ========== AI1 输出格式（传给中间体） ==========

/**
 * AI1 允许的意图类型
 */
export type AI1IntentType =
  | 'create_event'           // 创建日程
  | 'create_deadline'        // 创建任务/Deadline
  | 'set_reminder_interval'  // 设置今日提醒间隔
  | 'toggle_notification'    // 开关早晚安
  | 'query_agenda'           // 查询日程/时间
  | 'greeting'               // 问候

/**
 * AI1 的 agent_instruction（派单给 AI2 的指令）
 */
export interface AI1AgentInstruction {
  intent: AI1IntentType
  payload: {
    title?: string
    raw_time_str?: string      // 原始时间描述，如 "明天下午3点"
    raw_notify_str?: string    // 原始提醒描述，如 "提前10分钟"
    raw_duration_str?: string  // 原始间隔描述，如 "每隔2小时"
    is_all_day?: boolean
    target?: 'morning' | 'evening' | 'all'
    status?: 'on' | 'off'
  }
}

/**
 * AI1 原始输出格式（LLM 直接返回）
 *
 * - reply_to_user 有值：需要回复用户（追问/报错/闲聊），不需要 AI2
 * - agent_instruction 有值：信息完整，派单给 AI2 处理
 * - 两者不会同时有值
 */
export interface AI1RawOutput {
  // 给用户的回复（追问/报错/闲聊时有值，派单时为 null）
  reply_to_user: string | null

  // 派单给 AI2 的指令（信息完整时有值，否则为 null）
  agent_instruction: AI1AgentInstruction | null
}

/**
 * AI1 解析结果（中间体使用）
 * AI1 负责 NLP 处理、用户格式理解、逻辑处理
 * 不参与任何计算
 */
export interface AI1Output {
  // 用户消息的原始文本
  originalText: string

  // AI1 原始输出
  rawOutput: AI1RawOutput

  // ===== 解析后的字段（方便中间体使用）=====

  // 是否需要 AI2 进一步处理（agent_instruction 不为 null）
  needsAI2: boolean

  // 给用户的即时回复（如果不需要 AI2）
  quickReply: string

  // 识别的意图（转换为 IntentType）
  intent: IntentType

  // 意图置信度 (0-1)
  confidence: number

  // 预处理是否有错误
  hasError: boolean

  // 错误信息（如果有）
  errorMessage?: string

  // 调试信息
  debug?: {
    parseTime: number
    rawResponse?: string
  }
}

// ========== 中间体 → AI2 的固定 JSON 格式 ==========

/**
 * 中间体传递给 AI2 的请求
 */
export interface IntermediaryToAI2Request {
  // 请求唯一标识
  requestId: string

  // 用户ID
  userId: string

  // AI1 的 agent_instruction（派单指令）
  instruction: AI1AgentInstruction

  // 日期时间上下文（中间体注入）
  dateTimeContext: DateTimeContext

  // 请求时间戳
  timestamp: number
}

/**
 * 会话上下文
 */
export interface SessionContext {
  // 会话ID
  sessionId: string

  // 最近的对话历史
  recentMessages?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>

  // 最近的任务
  recentTasks?: Array<{
    id: string
    title: string
    date: string
  }>
}

// ========== AI2 输出格式（返回给中间体） ==========

/**
 * AI2 工具调用项
 */
export interface AI2ToolCall {
  // 工具名称
  tool: string
  // 工具参数
  args: Record<string, unknown>
}

/**
 * AI2 原始输出格式（LLM 直接返回）
 */
export interface AI2RawOutput {
  // 工具调用列表（按执行顺序）
  tool_calls: AI2ToolCall[]

  // 发送给用户的最终确认文案
  final_report: string
}

/**
 * 实际执行的工具调用记录
 */
export interface ActualToolCall {
  tool: string
  args: Record<string, unknown>
  result?: string
}

/**
 * AI2 处理结果（中间体使用）
 */
export interface AI2Output {
  // 请求ID（与请求对应）
  requestId: string

  // AI2 原始输出
  rawOutput?: AI2RawOutput

  // 实际执行的工具调用历史（区别于 rawOutput 中的 tool_calls）
  toolCallHistory?: ActualToolCall[]

  // ===== 解析后的字段 =====

  // 是否处理成功（工具调用成功）
  success: boolean

  // 任务是否完成
  taskCompleted: boolean

  // 给用户的最终回复
  finalReport: string

  // 失败原因（如果 success 为 false）
  failureReason?: string

  // 需要的额外信息（如果无法完成）
  missingInfo?: string[]

  // 调试信息
  debug?: {
    iterations: number
    toolCalls: ActualToolCall[]
    processingTime: number
  }
}

/**
 * AI2 处理结果详情（旧接口兼容）
 */
export interface AI2ProcessResult {
  // 最终意图
  intent: IntentType

  // 任务复杂度
  complexity: TaskComplexity

  // 提取的完整实体
  entities: ExtractedEntities
  
  // 要执行的操作
  action: {
    type: 'create' | 'query' | 'update' | 'delete' | 'none'
    target: 'task' | 'goal' | 'schedule' | 'none'
    data?: Record<string, unknown>
  }
  
  // 回复文本
  reply: string
}

// ========== 中间体最终输出（返回给用户） ==========

/**
 * 发送给用户的消息
 * 中间体最终输出，通过微信等平台返回给用户
 */
export interface UserOutputMessage {
  // 关联的原始消息ID
  messageId: string

  // 用户ID
  userId: string

  // 回复内容
  content: string

  // 消息类型
  type: 'text' | 'rich'  // rich 可包含卡片等

  // 目标平台
  platform: 'wechat' | 'web' | 'app'

  // 发送时间戳
  sentAt: number
}

/**
 * 中间体内部处理结果
 * 用于决定如何构造 UserOutputMessage
 */
export interface IntermediaryResponse {
  // 请求ID
  requestId: string

  // 关联的原始消息
  originalMessage: UserInputMessage

  // 处理是否成功
  success: boolean

  // 任务是否完成
  taskCompleted: boolean

  // 给用户的回复内容
  reply: string

  // 回复类型
  replyType: 'quick' | 'full' | 'error'

  // ===== 任务完成时 =====
  // 执行的操作摘要（固定格式，描述做了什么）
  actionSummary?: string

  // ===== 任务未完成时 =====
  // 卡住的原因（非固定格式，描述为何卡住）
  stuckReason?: string

  // 需要用户提供的信息
  requiredInfo?: string[]

  // 详细结果
  details?: {
    intent: IntentType
    entities: ExtractedEntities
    complexity: TaskComplexity
  }

  // 处理时间线
  timeline?: {
    receivedAt: number      // 收到用户消息时间
    feedbackSentAt: number  // 发送"处理中"时间
    ai1StartTime: number
    ai1EndTime: number
    ai2StartTime?: number
    ai2EndTime?: number
    replySentAt: number     // 发送最终回复时间
    totalTime: number
  }
}

/**
 * 任务完成时的固定格式输出
 */
export interface TaskCompletedOutput {
  // 是否成功
  success: true

  // 执行的操作类型
  actionType: 'create' | 'query' | 'update' | 'delete'

  // 操作目标
  target: 'task' | 'goal' | 'schedule'

  // 操作摘要（给用户看的描述）
  summary: string

  // 操作详情
  details: {
    // 创建/修改的任务标题
    title?: string
    // 日期
    date?: string
    // 时间
    time?: string
    // 其他相关信息
    [key: string]: unknown
  }
}

/**
 * 任务未完成时的输出
 */
export interface TaskIncompleteOutput {
  // 是否成功
  success: false

  // 卡住的原因
  reason: string

  // 缺少的信息
  missingInfo?: string[]

  // 建议的下一步操作
  suggestion?: string
}

// ========== 中间体配置 ==========

/**
 * 中间体配置
 */
export interface IntermediaryConfig {
  // 是否启用快速响应模式
  enableQuickResponse: boolean
  
  // 快速响应超时时间（毫秒）
  quickResponseTimeout: number
  
  // AI2 处理超时时间（毫秒）
  ai2Timeout: number
  
  // 是否启用调试日志
  enableDebugLog: boolean
  
  // 最大重试次数
  maxRetries: number
}

// ========== 辅助函数类型 ==========

/**
 * 生成日期时间上下文
 */
export type CreateDateTimeContext = () => DateTimeContext

/**
 * 验证用户操作是否合规
 */
export type ValidateUserOperation = (
  context: DateTimeContext,
  entities: ExtractedEntities
) => { valid: boolean; reason?: string }

