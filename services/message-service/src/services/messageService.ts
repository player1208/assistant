/**
 * 消息处理服务
 *
 * 负责处理微信消息，通过中间体调度 AI 服务
 *
 * 架构：
 * 微信消息 → MessageService → IntermediaryService → AI1/AI2 → 返回用户
 */

import {
  WxMessage,
  WxTextMessage,
  WxEventMessage,
  MessageProcessResult,
  MessageActionType,
  IntentType,
  AIProcessResult,
  ENV,
  SERVICE_PORTS,
  ServiceName,
} from '@assistent/shared'
import { intermediaryService } from './intermediaryService'

class MessageService {
  private aiServiceUrl: string
  private scheduleServiceUrl: string

  constructor() {
    // 根据环境设置服务地址
    if (ENV.IS_PROD) {
      this.aiServiceUrl = `http://${ServiceName.AI}`
      this.scheduleServiceUrl = `http://${ServiceName.SCHEDULE}`
    } else {
      this.aiServiceUrl = `http://localhost:${SERVICE_PORTS[ServiceName.AI]}`
      this.scheduleServiceUrl = `http://localhost:${SERVICE_PORTS[ServiceName.SCHEDULE]}`
    }
  }

  /**
   * 处理微信消息
   * 通过中间体调度 AI 处理流程
   */
  async handleMessage(message: WxMessage): Promise<MessageProcessResult> {
    console.log(`📨 处理消息: type=${message.msgType}, from=${message.fromUserName}`)

    switch (message.msgType) {
      case 'text':
        return await this.handleTextMessage(message as WxTextMessage)

      case 'event':
        return await this.handleEventMessage(message as WxEventMessage)

      case 'voice':
        // 语音消息如果开启了语音识别，可以获取识别结果
        const voiceMsg = message as any
        if (voiceMsg.recognition) {
          return await this.handleTextMessage({
            ...message,
            msgType: 'text',
            content: voiceMsg.recognition,
            msgId: voiceMsg.msgId,
          } as WxTextMessage)
        }
        return {
          success: true,
          reply: '暂不支持语音消息，请发送文字消息。',
        }

      default:
        return {
          success: true,
          reply: '暂不支持此类型的消息，请发送文字消息。',
        }
    }
  }

  /**
   * 处理文本消息
   * 使用中间体进行完整的 AI1 → AI2 处理流程
   */
  async handleTextMessage(message: WxTextMessage): Promise<MessageProcessResult> {
    console.log(`💬 文本消息: "${message.content}"`)

    try {
      // 1. 将微信消息转换为标准格式
      const userInput = intermediaryService.convertWxMessage(message)

      // 2. 通过中间体处理消息（包含 AI1 → AI2 流程）
      const response = await intermediaryService.processMessage(userInput)

      console.log(`✅ 中间体处理完成: success=${response.success}, completed=${response.taskCompleted}`)

      // 3. 返回结果（包含完整调试信息）
      return {
        success: response.success,
        reply: response.reply,
        action: response.details ? {
          type: this.intentToActionType(response.details.intent),
          data: response.details.entities as Record<string, unknown>,
        } : undefined,
        error: response.stuckReason,
        // 完整的双AI流程调试信息
        debug: {
          timeline: response.timeline,
          replyType: response.replyType,
          actionSummary: response.actionSummary,
          ai1Output: (response as any).ai1Output,
          ai2Output: (response as any).ai2Output,
        },
      }

    } catch (error) {
      console.error('处理文本消息失败:', error)

      return {
        success: false,
        reply: '抱歉，我现在有点忙，请稍后再试。',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 将意图类型转换为操作类型
   */
  private intentToActionType(intent: IntentType): MessageActionType {
    const mapping: Record<string, MessageActionType> = {
      [IntentType.CREATE_TASK]: 'create_task',
      [IntentType.QUERY_TASK]: 'query_task',
      [IntentType.UPDATE_TASK]: 'update_task',
      [IntentType.DELETE_TASK]: 'delete_task',
      [IntentType.CREATE_GOAL]: 'create_goal',
      [IntentType.QUERY_GOAL]: 'query_goal',
      [IntentType.CHAT]: 'chat',
    }
    return mapping[intent] || 'none'
  }
  
  /**
   * 处理事件消息
   */
  async handleEventMessage(message: WxEventMessage): Promise<MessageProcessResult> {
    const { event, fromUserName } = message
    console.log(`📢 事件消息: ${event}`)
    
    switch (event) {
      case 'subscribe':
        return {
          success: true,
          reply: `欢迎关注！🎉

我是你的智能日程助手，可以帮你：

📅 创建日程
   例如："明天上午十点有会议"

🔍 查询日程
   例如："明天有什么事"

✏️ 修改日程
   例如："把会议改到下午三点"

❌ 删除日程
   例如："删除明天的会议"

现在就发消息试试吧！`,
        }
        
      case 'unsubscribe':
        console.log(`用户取消关注: ${fromUserName}`)
        return {
          success: true,
          reply: '',  // 取消关注不需要回复
        }
        
      default:
        return {
          success: true,
          reply: '',
        }
    }
  }
  
  /**
   * 调用 AI 服务
   */
  private async callAIService(userId: string, text: string): Promise<AIProcessResult> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          text,
          context: {
            currentDate: new Date().toISOString().split('T')[0],
          },
        }),
      })
      
      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`)
      }
      
      const result = await response.json() as { data: AIProcessResult }
      return result.data
      
    } catch (error) {
      console.error('调用 AI 服务失败:', error)
      
      // 返回默认的未知意图
      return {
        intent: IntentType.UNKNOWN,
        confidence: 0,
        complexity: 'simple' as any,
        entities: {},
        reply: '抱歉，我没有理解你的意思，请换种方式描述。',
      }
    }
  }
  
  /**
   * 执行操作
   */
  private async executeAction(
    userId: string, 
    aiResult: AIProcessResult
  ): Promise<MessageProcessResult> {
    const { intent, entities, reply } = aiResult
    
    try {
      switch (intent) {
        case IntentType.CREATE_TASK:
          return await this.createTask(userId, entities, reply)
          
        case IntentType.QUERY_TASK:
          return await this.queryTasks(userId, entities, reply)
          
        case IntentType.UPDATE_TASK:
          // TODO: 实现更新任务
          return { success: true, reply }
          
        case IntentType.DELETE_TASK:
          // TODO: 实现删除任务
          return { success: true, reply }
          
        case IntentType.GREETING:
        case IntentType.HELP:
        case IntentType.CHAT:
        case IntentType.UNKNOWN:
        default:
          return { success: true, reply }
      }
    } catch (error) {
      console.error('执行操作失败:', error)
      return {
        success: false,
        reply: '操作执行失败，请稍后再试。',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
  
  /**
   * 创建任务
   */
  private async createTask(
    userId: string,
    entities: AIProcessResult['entities'],
    defaultReply: string
  ): Promise<MessageProcessResult> {
    const { title, date, startTime, endTime, isAllDay, priority } = entities
    
    if (!title || !date) {
      return {
        success: false,
        reply: '请提供任务标题和日期，例如："明天上午十点开会"',
      }
    }
    
    try {
      const response = await fetch(`${this.scheduleServiceUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wx-openid': userId,
        },
        body: JSON.stringify({
          title,
          date,
          startTime,
          endTime,
          isAllDay: isAllDay ?? !startTime,
          priority: priority || 'normal',
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Schedule service error: ${response.status}`)
      }
      
      const result = await response.json() as { data: unknown }
      console.log('创建任务成功:', result)

      return {
        success: true,
        reply: defaultReply || `✅ 已创建日程：${title}\n📅 ${date}${startTime ? ' ' + startTime : ' 全天'}`,
        action: {
          type: 'create_task',
          data: entities as unknown as Record<string, unknown>,
          result: result.data,
        },
      }
      
    } catch (error) {
      console.error('创建任务失败:', error)
      return {
        success: false,
        reply: '创建日程失败，请稍后再试。',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
  
  /**
   * 查询任务
   */
  private async queryTasks(
    userId: string,
    entities: AIProcessResult['entities'],
    defaultReply: string
  ): Promise<MessageProcessResult> {
    const { startDate, endDate, date } = entities
    
    // 确定查询的日期范围
    const queryStartDate = startDate || date || new Date().toISOString().split('T')[0]
    const queryEndDate = endDate || date || queryStartDate
    
    try {
      const params = new URLSearchParams({
        startDate: queryStartDate,
        endDate: queryEndDate,
      })
      
      const response = await fetch(
        `${this.scheduleServiceUrl}/tasks?${params}`,
        {
          headers: {
            'x-wx-openid': userId,
          },
        }
      )
      
      if (!response.ok) {
        throw new Error(`Schedule service error: ${response.status}`)
      }
      
      const result = await response.json() as { data: Array<{ isAllDay?: boolean; startTime?: string; title: string }> }
      const tasks = result.data || []

      if (tasks.length === 0) {
        return {
          success: true,
          reply: defaultReply || `📅 ${queryStartDate} 没有日程安排`,
        }
      }

      // 格式化任务列表
      const taskList = tasks
        .map((task, index: number) => {
          const time = task.isAllDay ? '全天' : task.startTime || ''
          return `${index + 1}. ${time ? time + ' ' : ''}${task.title}`
        })
        .join('\n')

      return {
        success: true,
        reply: `📅 ${queryStartDate} 的日程：\n\n${taskList}`,
        action: {
          type: 'query_task',
          data: entities as unknown as Record<string, unknown>,
          result: tasks,
        },
      }
      
    } catch (error) {
      console.error('查询任务失败:', error)
      return {
        success: false,
        reply: '查询日程失败，请稍后再试。',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const messageService = new MessageService()

