/**
 * 意图解析服务 (AI-1)
 *
 * GoalPilot 前台接待 AI
 *
 * 职责：
 * - 清洗需求和分发指令
 * - 意图识别与防火墙（拒绝非核心功能）
 * - 时间合规性检查（拦截过去的时间）
 * - 信息完整性检查（Slot Filling）
 * - 生成快速回复或派单给 AI2
 *
 * 特点：
 * - 快速响应（<1秒）
 * - 输出结构化 JSON
 * - 不执行数据库操作
 */

import {
  IntentType,
  DateTimeContext,
  AI1IntentType,
  AI1AgentInstruction,
  AI1RawOutput,
} from '@assistent/shared'
import { llmService } from './llmService'
import { generateAI1SystemPrompt } from '../prompts/ai1Prompt'

// 重新导出类型供其他模块使用
export type { AI1IntentType, AI1AgentInstruction, AI1RawOutput }

/**
 * 意图解析结果（兼容旧接口 + 新格式）
 */
export interface IntentParseResult {
  // 给用户的即时回复（用于快速响应）
  userReply: string

  // 是否需要 Agent 进一步处理
  needsAgent: boolean

  // 识别的意图类型
  intent: IntentType

  // 置信度 (0-1)
  confidence: number

  // 传递给 Agent 的指令（如果 needsAgent 为 true）
  agentCommand?: {
    action: string
    params: Record<string, unknown>
  }

  // AI1 原始输出
  ai1Output?: AI1RawOutput

  // 调试信息
  debug?: {
    rawResponse?: string
    parseTime?: number
  }
}

// ========== 服务类 ==========

class IntentParserService {
  /**
   * 解析用户意图（使用新的 AI1 提示词）
   *
   * @param userMessage 用户消息
   * @param dateTimeContext 日期时间上下文（由中间体注入）
   */
  async parse(userMessage: string, dateTimeContext?: DateTimeContext): Promise<IntentParseResult> {
    const startTime = Date.now()

    console.log(`🎯 AI1 前台接待: "${userMessage}"`)

    // 如果没有提供 dateTimeContext，创建一个默认的
    const ctx = dateTimeContext || this.createDefaultDateTimeContext()

    try {
      // 生成带有日期上下文的系统提示词
      const systemPrompt = generateAI1SystemPrompt(ctx)

      // 使用 parser 角色调用 LLM
      const response = await llmService.parseIntent(userMessage, systemPrompt)

      const parseTime = Date.now() - startTime
      console.log(`⚡ AI1 解析完成，耗时: ${parseTime}ms`)

      // 解析 AI1 输出格式的 JSON 响应
      const result = this.parseAI1Response(response)
      result.debug = {
        rawResponse: response,
        parseTime,
      }

      console.log(`   意图: ${result.intent}`)
      console.log(`   需要AI2: ${result.needsAgent}`)
      console.log(`   回复: ${result.userReply || '(派单给AI2)'}`)

      return result

    } catch (error) {
      console.error('AI1 解析失败:', error)

      // 返回降级结果
      return {
        userReply: '收到，让我处理一下...',
        needsAgent: true,
        intent: IntentType.UNKNOWN,
        confidence: 0.5,
        agentCommand: {
          action: 'process_text',
          params: { text: userMessage },
        },
        debug: {
          parseTime: Date.now() - startTime,
        },
      }
    }
  }

  /**
   * 解析 AI1 输出格式的响应
   */
  private parseAI1Response(response: string): IntentParseResult {
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                        response.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed: AI1RawOutput = JSON.parse(jsonStr)

        // 新的 AI1 输出格式
        const hasAgentInstruction = parsed.agent_instruction !== null
        const hasUserReply = parsed.reply_to_user !== null && parsed.reply_to_user.trim() !== ''

        // 关键逻辑：如果有 reply_to_user，说明 AI1 需要先和用户确认，不应该派单给 AI2
        // 只有当 reply_to_user 为空/null 且有 agent_instruction 时，才派单给 AI2
        const shouldDispatchToAgent = hasAgentInstruction && !hasUserReply

        const intent = hasAgentInstruction
          ? this.normalizeIntent(parsed.agent_instruction!.intent)
          : IntentType.CHAT

        // 日志：帮助调试
        if (hasUserReply && hasAgentInstruction) {
          console.log(`⚠️ AI1 同时返回了 reply_to_user 和 agent_instruction，优先返回用户确认，暂不派单`)
        }

        return {
          // reply_to_user 有值说明需要回复用户（追问/报错/闲聊）
          // reply_to_user 为 null 说明信息完整，派单给 AI2
          userReply: parsed.reply_to_user || '',
          needsAgent: shouldDispatchToAgent,
          intent,
          confidence: shouldDispatchToAgent ? 0.95 : 0.9,
          agentCommand: hasAgentInstruction ? {
            action: parsed.agent_instruction!.intent,
            params: parsed.agent_instruction!.payload as Record<string, unknown>,
          } : undefined,
          ai1Output: parsed,
        }
      }

      // 无法解析 JSON，返回默认结果
      return {
        userReply: response.slice(0, 100),
        needsAgent: false,
        intent: IntentType.UNKNOWN,
        confidence: 0.5,
      }

    } catch (error) {
      console.error('解析 AI1 响应失败:', error)

      return {
        userReply: '好的，让我处理一下...',
        needsAgent: true,
        intent: IntentType.UNKNOWN,
        confidence: 0.5,
      }
    }
  }

  /**
   * 标准化意图类型
   */
  private normalizeIntent(intent: string): IntentType {
    const intentMap: Record<string, IntentType> = {
      // 新的 AI1 意图映射
      'create_event': IntentType.CREATE_TASK,
      'create_deadline': IntentType.CREATE_GOAL,
      'set_reminder_interval': IntentType.UPDATE_TASK,
      'toggle_notification': IntentType.UPDATE_TASK,
      'query_agenda': IntentType.QUERY_TASK,
      'greeting': IntentType.GREETING,
      // 旧的意图映射（兼容）
      'create_task': IntentType.CREATE_TASK,
      'query_task': IntentType.QUERY_TASK,
      'update_task': IntentType.UPDATE_TASK,
      'delete_task': IntentType.DELETE_TASK,
      'create_goal': IntentType.CREATE_GOAL,
      'query_goal': IntentType.QUERY_GOAL,
      'help': IntentType.HELP,
      'chat': IntentType.CHAT,
    }

    return intentMap[intent?.toLowerCase()] || IntentType.UNKNOWN
  }

  /**
   * 创建默认的日期时间上下文
   */
  private createDefaultDateTimeContext(): DateTimeContext {
    const now = new Date()
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const oneYearAgo = new Date(now)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      timestamp: now.getTime(),
      today: formatDate(now),
      currentTime: now.toTimeString().split(' ')[0],
      weekday: now.getDay(),
      weekdayName: weekdayNames[now.getDay()],
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      timezone: 'Asia/Shanghai',
      oneYearAgo: formatDate(oneYearAgo),
      yesterday: formatDate(yesterday),
      monthStart: formatDate(monthStart),
      monthEnd: formatDate(monthEnd),
    }
  }
}

// 导出单例
export const intentParserService = new IntentParserService()

