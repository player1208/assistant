/**
 * 中间体服务 (Intermediary Service)
 *
 * 整个消息处理的核心枢纽，连接微信业务和AI服务
 *
 * 流程图：
 * ┌─────────────┐      ┌──────────────┐
 * │ 用户微信输入 │──────>│ AI1接收消息   │
 * └─────────────┘      └──────┬───────┘
 *        │                    │
 *        v                    v
 * ┌──────────────┐     ┌───────────────────┐
 * │ 系统自动反馈：│     │ 中间层注入dateTime │
 * │ 助手正在处理中│     │ (只用于判断合规)   │
 * └──────────────┘     └─────────┬─────────┘
 *                                │
 *                                v
 *                     ┌───────────────────┐
 *                     │ 判定分类处理检验   │
 *                     └─────────┬─────────┘
 *                               │
 *                               v
 *                     ┌───────────────────┐
 *                     │ 检查是否有缺(Slot)│
 *                     └────┬─────────┬────┘
 *                     有   │         │ 无
 *                          v         v
 *              ┌────────────────┐  ┌─────────────────┐
 *              │ 返回用户消息    │  │ 判断是否需要AI2 │
 *              │ (等待补充)     │  └───┬────────┬───┘
 *              └────────────────┘      │ 不需要  │ 需要
 *                                      v         v
 *                          ┌─────────────┐ ┌──────────────────────┐
 *                          │ 返回用户消息 │ │ AI2接收固定JSON格式   │
 *                          └─────────────┘ └──────────┬───────────┘
 *                                                     │
 *                                                     v
 *                                          ┌───────────────────┐
 *                                          │ 中间层传日期时间   │
 *                                          └─────────┬─────────┘
 *                                                    │
 *                                                    v
 *                                          ┌───────────────────┐
 *                                          │     AI2 处理      │
 *                                          └────┬─────────┬────┘
 *                                          成功 │         │ 失败
 *                                               v         v
 *                                      ┌──────────┐ ┌───────────┐
 *                                      │ 描述做了 │ │ 描述为何  │
 *                                      │ 什么     │ │ 卡住      │
 *                                      └──────────┘ └───────────┘
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

import {
  WxMessage,
  WxTextMessage,
  UserInputMessage,
  ImmediateFeedback,
  DateTimeContext,
  AI1Output,
  AI1RawOutput,
  AI1AgentInstruction,
  IntermediaryToAI2Request,
  AI2Output,
  IntermediaryResponse,
  UserOutputMessage,
  IntentType,
  ENV,
  SERVICE_PORTS,
  ServiceName,
} from '@assistent/shared'
import { v4 as uuidv4 } from 'uuid'

// ========== 常量 ==========

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const IMMEDIATE_FEEDBACK_TEXT = '助手正在处理中...'

// ========== 中间体服务 ==========

class IntermediaryService {
  private aiServiceUrl: string
  private scheduleServiceUrl: string

  constructor() {
    if (ENV.IS_PROD) {
      this.aiServiceUrl = `http://${ServiceName.AI}`
      this.scheduleServiceUrl = `http://${ServiceName.SCHEDULE}`
    } else {
      this.aiServiceUrl = `http://localhost:${SERVICE_PORTS[ServiceName.AI]}`
      this.scheduleServiceUrl = `http://localhost:${SERVICE_PORTS[ServiceName.SCHEDULE]}`
    }
  }

  // ========== 1. 接收用户消息 ==========

  /**
   * 将微信消息转换为标准 UserInputMessage
   */
  convertWxMessage(wxMessage: WxMessage): UserInputMessage {
    const messageId = uuidv4()
    
    let content = ''
    let type: 'text' | 'voice' | 'image' = 'text'

    switch (wxMessage.msgType) {
      case 'text':
        content = (wxMessage as WxTextMessage).content
        type = 'text'
        break
      case 'voice':
        content = (wxMessage as any).recognition || ''
        type = 'voice'
        break
      case 'image':
        type = 'image'
        break
    }

    return {
      messageId,
      userId: wxMessage.fromUserName,
      content,
      type,
      platform: 'wechat',
      receivedAt: Date.now(),
    }
  }

  // ========== 2. 即时反馈 ==========

  /**
   * 生成即时反馈消息
   * 注意：微信被动回复只能返回一条消息，所以这个主要用于客服消息接口
   */
  createImmediateFeedback(messageId: string): ImmediateFeedback {
    return {
      messageId,
      content: IMMEDIATE_FEEDBACK_TEXT,
      sentAt: Date.now(),
    }
  }

  // ========== 3. 生成日期时间上下文 ==========

  /**
   * 生成日期时间上下文
   * 注入给 AI1 和 AI2，避免工具调用
   */
  createDateTimeContext(): DateTimeContext {
    const now = new Date()
    
    // 今天
    const today = this.formatDate(now)
    
    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // 一年前
    const oneYearAgo = new Date(now)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    // 本月第一天
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // 本月最后一天
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      timestamp: now.getTime(),
      today,
      currentTime: this.formatTime(now),
      weekday: now.getDay(),
      weekdayName: WEEKDAY_NAMES[now.getDay()],
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      timezone: 'Asia/Shanghai',
      oneYearAgo: this.formatDate(oneYearAgo),
      yesterday: this.formatDate(yesterday),
      monthStart: this.formatDate(monthStart),
      monthEnd: this.formatDate(monthEnd),
    }
  }

  // ========== 4. 主处理流程 ==========

  /**
   * 处理用户消息的主入口
   */
  async processMessage(userInput: UserInputMessage): Promise<IntermediaryResponse> {
    const requestId = uuidv4()
    const timeline = {
      receivedAt: userInput.receivedAt,
      feedbackSentAt: Date.now(),
      ai1StartTime: 0,
      ai1EndTime: 0,
      ai2StartTime: 0,
      ai2EndTime: 0,
      replySentAt: 0,
      totalTime: 0,
    }

    console.log(`🔄 [${requestId}] 中间体开始处理: "${userInput.content}"`)

    // 生成日期时间上下文（注入给AI）
    const dateTimeContext = this.createDateTimeContext()
    console.log(`📅 [${requestId}] 日期上下文: ${dateTimeContext.today} ${dateTimeContext.weekdayName}`)

    try {
      // 调用 AI1 进行意图解析
      timeline.ai1StartTime = Date.now()
      const ai1Output = await this.callAI1(userInput, dateTimeContext)
      timeline.ai1EndTime = Date.now()

      console.log(`🤖 [${requestId}] AI1 结果: intent=${ai1Output.intent}, needsAI2=${ai1Output.needsAI2}`)

      // 检查是否有错误
      if (ai1Output.hasError) {
        return this.buildErrorResponse(requestId, userInput, ai1Output.errorMessage || '处理失败', timeline)
      }

      // 判断是否需要 AI2
      if (!ai1Output.needsAI2) {
        // 不需要 AI2，直接返回 AI1 的回复
        timeline.replySentAt = Date.now()
        timeline.totalTime = timeline.replySentAt - timeline.receivedAt

        return {
          requestId,
          originalMessage: userInput,
          success: true,
          taskCompleted: true,
          reply: ai1Output.quickReply,
          replyType: 'quick',
          actionSummary: '直接回复',
          timeline,
          // 添加调试信息
          ai1Output: {
            rawOutput: ai1Output.rawOutput,
            intent: ai1Output.intent,
            needsAI2: ai1Output.needsAI2,
          },
          ai2Output: null,
        } as IntermediaryResponse
      }

      // 需要 AI2 处理
      timeline.ai2StartTime = Date.now()
      const ai2Request = this.buildAI2Request(requestId, userInput.userId, ai1Output, dateTimeContext)
      const ai2Output = await this.callAI2(ai2Request)
      timeline.ai2EndTime = Date.now()

      console.log(`🤖 [${requestId}] AI2 结果: success=${ai2Output.success}, completed=${ai2Output.taskCompleted}`)

      // 构建最终响应
      timeline.replySentAt = Date.now()
      timeline.totalTime = timeline.replySentAt - timeline.receivedAt

      const response = this.buildFinalResponse(requestId, userInput, ai1Output, ai2Output, timeline)
      // 注入调试信息
      ;(response as any).ai1Output = {
        rawOutput: ai1Output.rawOutput,
        intent: ai1Output.intent,
        needsAI2: ai1Output.needsAI2,
      }
      ;(response as any).ai2Output = {
        rawOutput: ai2Output.rawOutput,
        // 使用实际执行的工具调用历史，而不是 AI 输出的 JSON
        toolCalls: ai2Output.toolCallHistory || ai2Output.rawOutput?.tool_calls || [],
        finalReport: ai2Output.finalReport,
        success: ai2Output.success,
      }
      return response

    } catch (error) {
      console.error(`❌ [${requestId}] 处理失败:`, error)
      return this.buildErrorResponse(
        requestId,
        userInput,
        error instanceof Error ? error.message : '未知错误',
        timeline
      )
    }
  }

  // ========== 5. AI1 调用 ==========

  /**
   * 调用 AI1 进行意图解析
   *
   * AI1 输出格式：
   * {
   *   "reply_to_user": "string | null",  // 追问/报错/闲聊时有值
   *   "agent_instruction": {             // 信息完整时有值
   *     "intent": "create_event | create_deadline | ...",
   *     "payload": { ... }
   *   } | null
   * }
   */
  private async callAI1(userInput: UserInputMessage, dateTimeContext: DateTimeContext): Promise<AI1Output> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInput.userId,
          text: userInput.content,
          context: {
            currentDate: dateTimeContext.today,
            timezone: dateTimeContext.timezone,
            // 注入完整日期上下文给 AI1
            dateTimeContext,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`AI1 service error: ${response.status}`)
      }

      // 定义响应数据类型
      interface AI1ResponseData {
        ai1Output?: AI1RawOutput
        reply?: string
        quickReply?: string
        needsAgent?: boolean
        intent?: string
        agentCommand?: { params?: AI1AgentInstruction['payload'] }
        confidence?: number
      }

      const result = await response.json() as { data: AI1ResponseData }
      const data = result.data

      // 解析 AI1 原始输出
      const ai1RawOutput: AI1RawOutput = data.ai1Output || {
        reply_to_user: data.reply || data.quickReply || null,
        agent_instruction: data.needsAgent ? {
          intent: (data.intent || 'unknown') as AI1AgentInstruction['intent'],
          payload: data.agentCommand?.params || {},
        } : null,
      }

      // 判断是否需要 AI2
      const needsAI2 = ai1RawOutput.agent_instruction !== null

      // 转换意图类型
      const intent = needsAI2
        ? this.convertAI1Intent(ai1RawOutput.agent_instruction!.intent)
        : IntentType.UNKNOWN

      return {
        originalText: userInput.content,
        rawOutput: ai1RawOutput,
        needsAI2,
        quickReply: ai1RawOutput.reply_to_user || '',
        intent,
        confidence: data.confidence || 0.9,
        hasError: false,
        debug: {
          parseTime: Date.now(),
          rawResponse: JSON.stringify(data),
        },
      }
    } catch (error) {
      console.error('调用 AI1 失败:', error)
      return {
        originalText: userInput.content,
        rawOutput: {
          reply_to_user: '抱歉，我现在有点忙，请稍后再试。',
          agent_instruction: null,
        },
        needsAI2: false,
        quickReply: '抱歉，我现在有点忙，请稍后再试。',
        intent: IntentType.UNKNOWN,
        confidence: 0,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'AI1 调用失败',
      }
    }
  }

  /**
   * 转换 AI1 意图类型到 IntentType
   */
  private convertAI1Intent(ai1Intent: string): IntentType {
    const intentMap: Record<string, IntentType> = {
      'create_event': IntentType.CREATE_TASK,
      'create_deadline': IntentType.CREATE_TASK,
      'query_agenda': IntentType.QUERY_TASK,
      'set_reminder_interval': IntentType.UPDATE_TASK,
      'toggle_notification': IntentType.UPDATE_TASK,
      'greeting': IntentType.GREETING,
    }
    return intentMap[ai1Intent] || IntentType.UNKNOWN
  }

  // ========== 6. AI2 调用 ==========

  /**
   * 构建 AI2 请求
   *
   * 使用 AI1 的 agent_instruction 作为 AI2 的输入
   */
  private buildAI2Request(
    requestId: string,
    userId: string,
    ai1Output: AI1Output,
    dateTimeContext: DateTimeContext
  ): IntermediaryToAI2Request {
    // 确保有 agent_instruction
    if (!ai1Output.rawOutput.agent_instruction) {
      throw new Error('AI1 没有返回 agent_instruction，无法调用 AI2')
    }

    return {
      requestId,
      userId,
      instruction: ai1Output.rawOutput.agent_instruction,
      dateTimeContext,
      timestamp: Date.now(),
    }
  }

  /**
   * 调用 AI2 进行任务执行
   *
   * 调用 ai-service 的 /process/ai2 端点
   *
   * AI2 输出格式：
   * {
   *   "tool_calls": [{ "tool": "add_event", "args": {...} }],
   *   "final_report": "📅 已创建日程..."
   * }
   */
  private async callAI2(request: IntermediaryToAI2Request): Promise<AI2Output> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/process/ai2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`AI2 service error: ${response.status}`)
      }

      const result = await response.json() as { data: AI2Output }
      return result.data

    } catch (error) {
      console.error('调用 AI2 失败:', error)

      // 返回失败结果（描述为何卡住）
      return {
        requestId: request.requestId,
        success: false,
        taskCompleted: false,
        finalReport: '',
        failureReason: error instanceof Error ? error.message : 'AI2 调用失败',
      }
    }
  }

  // ========== 7. 构建响应 ==========

  /**
   * 构建最终响应
   *
   * 根据流程图：
   * - 任务成功：返回固定格式描述（描述做了什么）
   * - 任务失败：返回固定格式描述（描述为何卡住）
   */
  private buildFinalResponse(
    requestId: string,
    userInput: UserInputMessage,
    ai1Output: AI1Output,
    ai2Output: AI2Output,
    timeline: IntermediaryResponse['timeline']
  ): IntermediaryResponse {
    if (ai2Output.taskCompleted && ai2Output.success) {
      // ✅ 任务完成 - 使用 AI2 的 final_report
      return {
        requestId,
        originalMessage: userInput,
        success: true,
        taskCompleted: true,
        reply: ai2Output.finalReport || '操作已完成。',
        replyType: 'full',
        actionSummary: this.buildActionSummary(ai2Output, ai1Output),
        details: {
          intent: ai1Output.intent,
          entities: {},
          complexity: 'medium' as any,
        },
        timeline,
      }
    } else {
      // ❌ 任务未完成 - 描述为何卡住
      return {
        requestId,
        originalMessage: userInput,
        success: false,
        taskCompleted: false,
        reply: ai2Output.failureReason || '抱歉，我无法完成这个任务。',
        replyType: 'error',
        stuckReason: ai2Output.failureReason,
        requiredInfo: ai2Output.missingInfo,
        timeline,
      }
    }
  }

  /**
   * 构建操作摘要（任务完成时的固定格式描述）
   *
   * 使用 AI2 的 tool_calls 来生成摘要
   */
  private buildActionSummary(ai2Output: AI2Output, ai1Output: AI1Output): string {
    // 如果有 AI2 的 rawOutput，使用 tool_calls 生成摘要
    if (ai2Output.rawOutput?.tool_calls?.length) {
      const toolCalls = ai2Output.rawOutput.tool_calls
      const toolNames = toolCalls.map((tc: { tool: string }) => tc.tool).join(', ')
      return `执行了工具: ${toolNames}`
    }

    // 否则根据意图生成默认摘要
    const instruction = ai1Output.rawOutput.agent_instruction
    if (!instruction) return '处理完成'

    const title = instruction.payload.title || '日程'
    const timeStr = instruction.payload.raw_time_str || ''

    switch (instruction.intent) {
      case 'create_event':
        return `已创建日程「${title}」${timeStr ? `，时间：${timeStr}` : ''}`
      case 'create_deadline':
        return `已创建任务「${title}」${timeStr ? `，截止：${timeStr}` : ''}`
      case 'query_agenda':
        return `已查询${timeStr || '今天'}的日程`
      case 'set_reminder_interval':
        return `已设置提醒间隔`
      case 'toggle_notification':
        return `已更新通知设置`
      default:
        return '处理完成'
    }
  }

  /**
   * 构建错误响应
   */
  private buildErrorResponse(
    requestId: string,
    userInput: UserInputMessage,
    errorMessage: string,
    timeline?: IntermediaryResponse['timeline']
  ): IntermediaryResponse {
    const now = Date.now()
    const finalTimeline = timeline ? {
      ...timeline,
      replySentAt: now,
      totalTime: now - timeline.receivedAt,
    } : undefined

    return {
      requestId,
      originalMessage: userInput,
      success: false,
      taskCompleted: false,
      reply: '抱歉，处理您的消息时出现了问题，请稍后再试。',
      replyType: 'error',
      stuckReason: errorMessage,
      timeline: finalTimeline,
    }
  }

  // ========== 8. 转换为微信回复 ==========

  /**
   * 将中间体响应转换为微信回复消息
   */
  toUserOutputMessage(response: IntermediaryResponse): UserOutputMessage {
    return {
      messageId: response.originalMessage.messageId,
      userId: response.originalMessage.userId,
      content: response.reply,
      type: 'text',
      platform: 'wechat',
      sentAt: Date.now(),
    }
  }

  // ========== 辅助方法 ==========

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private formatTime(date: Date): string {
    return date.toTimeString().split(' ')[0]
  }
}

export const intermediaryService = new IntermediaryService()

