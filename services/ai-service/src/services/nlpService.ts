/**
 * NLP 服务
 *
 * 负责意图识别、实体提取和回复生成
 *
 * 双 AI 架构：
 * - AI-1 (DeepSeek-V3 Pro): 前台接待，清洗需求和分发指令
 * - AI-2 (Qwen2.5-7B): Agent 执行器，调用工具完成任务
 */

import {
  IntentType,
  TaskComplexity,
  ExtractedEntities,
  AIProcessResult,
  AIContext,
  DateTimeContext,
} from '@assistent/shared'
import { llmService } from './llmService'
import { getPromptTemplate, REPLY_TEMPLATES } from '../prompts/templates'
import { agentService } from './agentService'
import { intentParserService, IntentParseResult, AI1RawOutput } from './intentParserService'

// 扩展 AIContext 以包含 DateTimeContext
interface ExtendedAIContext extends AIContext {
  dateTimeContext?: DateTimeContext
}

// 扩展 AIProcessResult 以支持双 AI 架构
export interface DualAIProcessResult extends AIProcessResult {
  // 来自 AI-1 的即时回复
  quickReply?: string
  // 是否需要 Agent 进一步处理
  needsAgent?: boolean
  // AI-1 的解析结果
  parserResult?: IntentParseResult
  // AI-1 的原始输出
  ai1Output?: AI1RawOutput
}

class NLPService {
  /**
   * 完整处理：意图识别 + 实体提取 + 回复生成
   *
   * 双 AI 架构：
   * 1. AI-1 前台接待，清洗需求，进行 Slot Filling
   * 2. 如果信息完整，派单给 AI-2 执行
   */
  async process(text: string, context?: ExtendedAIContext): Promise<DualAIProcessResult> {
    console.log(`🧠 NLP 处理 (双AI模式): "${text}"`)

    try {
      // 第一步：使用 AI-1 快速解析意图（传入 DateTimeContext）
      const parserResult = await intentParserService.parse(text, context?.dateTimeContext)

      console.log(`📊 AI-1 解析结果:`)
      console.log(`   意图: ${parserResult.intent}`)
      console.log(`   需要AI2: ${parserResult.needsAgent}`)
      console.log(`   回复: ${parserResult.userReply || '(派单给AI2)'}`)

      // 如果不需要 Agent（AI1 直接处理：追问/报错/闲聊）
      if (!parserResult.needsAgent) {
        return {
          intent: parserResult.intent,
          confidence: parserResult.confidence,
          complexity: TaskComplexity.SIMPLE,
          entities: parserResult.agentCommand?.params as ExtractedEntities || {},
          reply: parserResult.userReply,
          quickReply: parserResult.userReply,
          needsAgent: false,
          parserResult,
          ai1Output: parserResult.ai1Output,
          debug: {
            rawResponse: parserResult.debug?.rawResponse,
            reasoning: `AI-1 直接处理，耗时 ${parserResult.debug?.parseTime}ms`,
          },
        }
      }

      // 第二步：信息完整，派单给 AI-2 (Agent) 执行
      console.log(`🤖 派单给 AI-2 (Agent) 处理...`)
      console.log(`   指令: ${JSON.stringify(parserResult.ai1Output?.agent_instruction)}`)

      // 确保 dateTimeContext 存在，如果没有则创建默认的
      const dateTimeContext = context?.dateTimeContext || this.createDefaultDateTimeContext()

      // 使用 execute() 方法（带智能参数修正）
      const agentResult = await agentService.execute({
        instruction: parserResult.ai1Output!.agent_instruction!,
        dateTimeContext,
      })

      console.log(`✅ AI-2 处理完成:`)
      console.log(`   意图: ${agentResult.intent}`)
      console.log(`   工具调用: ${agentResult.toolCallHistory.length} 次`)
      if (agentResult.entities.date) {
        console.log(`   日期: ${agentResult.entities.date}`)
      }

      // 后处理实体
      const entities = this.postProcessEntities(
        agentResult.entities,
        new Date().toISOString().split('T')[0]
      )

      return {
        intent: agentResult.intent,
        confidence: agentResult.confidence,
        complexity: agentResult.complexity,
        entities,
        reply: agentResult.reply,
        quickReply: parserResult.userReply,
        needsAgent: true,
        parserResult,
        ai1Output: parserResult.ai1Output,
        debug: {
          rawResponse: agentResult.debug?.rawResponse,
          reasoning: `AI-1 解析 ${parserResult.debug?.parseTime}ms，AI-2 迭代 ${agentResult.debug?.iterations} 次，工具调用: ${
            agentResult.toolCallHistory.map(t => t.toolName).join(', ') || '无'
          }`,
        },
      }

    } catch (error) {
      console.error('双AI处理失败:', error)

      // 降级处理：使用规则匹配
      return this.fallbackProcess(text, new Date().toISOString().split('T')[0])
    }
  }

  /**
   * 仅使用 AI-1 快速解析（用于需要快速响应的场景）
   */
  async quickParse(text: string): Promise<IntentParseResult> {
    return intentParserService.parse(text)
  }
  
  /**
   * 仅意图识别
   */
  async detectIntent(text: string): Promise<{ intent: IntentType; confidence: number }> {
    try {
      const prompt = getPromptTemplate('intent_only', { text })
      
      const response = await llmService.simpleChat(prompt.user, prompt.system)
      const parsed = this.parseLLMResponse(response)
      
      return {
        intent: parsed.intent || IntentType.UNKNOWN,
        confidence: parsed.confidence || 0.5,
      }
    } catch (error) {
      console.error('意图识别失败:', error)
      return { intent: IntentType.UNKNOWN, confidence: 0 }
    }
  }
  
  /**
   * 仅实体提取
   */
  async extractEntities(text: string, intent?: IntentType): Promise<ExtractedEntities> {
    try {
      const currentDate = new Date().toISOString().split('T')[0]
      const prompt = getPromptTemplate('entity_only', { text, intent, currentDate })
      
      const response = await llmService.simpleChat(prompt.user, prompt.system)
      const parsed = this.parseLLMResponse(response)
      
      return this.postProcessEntities(parsed.entities || {}, currentDate)
    } catch (error) {
      console.error('实体提取失败:', error)
      return {}
    }
  }
  
  /**
   * 解析 LLM 响应
   */
  private parseLLMResponse(content: string): {
    intent: IntentType
    confidence?: number
    entities?: ExtractedEntities
    reply?: string
  } {
    try {
      // 尝试直接解析 JSON
      const json = JSON.parse(content)
      
      return {
        intent: this.normalizeIntent(json.intent),
        confidence: json.confidence,
        entities: json.entities,
        reply: json.reply,
      }
    } catch {
      // JSON 解析失败，尝试提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[0])
          return {
            intent: this.normalizeIntent(json.intent),
            confidence: json.confidence,
            entities: json.entities,
            reply: json.reply,
          }
        } catch {
          // 无法解析
        }
      }
      
      console.warn('无法解析 LLM 响应:', content)
      return { intent: IntentType.UNKNOWN }
    }
  }
  
  /**
   * 标准化意图
   */
  private normalizeIntent(intent: string): IntentType {
    const intentMap: Record<string, IntentType> = {
      'create_task': IntentType.CREATE_TASK,
      'query_task': IntentType.QUERY_TASK,
      'update_task': IntentType.UPDATE_TASK,
      'delete_task': IntentType.DELETE_TASK,
      'create_goal': IntentType.CREATE_GOAL,
      'query_goal': IntentType.QUERY_GOAL,
      'greeting': IntentType.GREETING,
      'help': IntentType.HELP,
      'chat': IntentType.CHAT,
    }
    
    return intentMap[intent?.toLowerCase()] || IntentType.UNKNOWN
  }
  
  /**
   * 后处理实体（日期转换等）
   */
  private postProcessEntities(entities: ExtractedEntities, currentDate: string): ExtractedEntities {
    const result = { ...entities }
    
    // 处理相对日期
    if (result.relativeTime) {
      const baseDate = new Date(currentDate)
      
      switch (result.relativeTime.type) {
        case 'today':
          result.date = currentDate
          break
        case 'tomorrow':
          baseDate.setDate(baseDate.getDate() + 1)
          result.date = baseDate.toISOString().split('T')[0]
          break
        case 'day_after_tomorrow':
          baseDate.setDate(baseDate.getDate() + 2)
          result.date = baseDate.toISOString().split('T')[0]
          break
      }
    }
    
    // 确保日期格式正确
    if (result.date && !result.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // 尝试解析其他格式
      const parsed = new Date(result.date)
      if (!isNaN(parsed.getTime())) {
        result.date = parsed.toISOString().split('T')[0]
      }
    }
    
    // 处理查询日期范围
    if (!result.startDate && !result.endDate && result.date) {
      result.startDate = result.date
      result.endDate = result.date
    }
    
    return result
  }
  
  /**
   * 判断任务复杂度
   */
  private determineComplexity(intent: IntentType): TaskComplexity {
    const simpleIntents = [
      IntentType.CREATE_TASK,
      IntentType.DELETE_TASK,
      IntentType.GREETING,
      IntentType.HELP,
      IntentType.CHAT,
    ]
    
    const mediumIntents = [
      IntentType.QUERY_TASK,
      IntentType.UPDATE_TASK,
      IntentType.QUERY_GOAL,
    ]
    
    if (simpleIntents.includes(intent)) return TaskComplexity.SIMPLE
    if (mediumIntents.includes(intent)) return TaskComplexity.MEDIUM
    return TaskComplexity.COMPLEX
  }
  
  /**
   * 生成回复
   */
  private generateReply(intent: IntentType, entities: ExtractedEntities): string {
    const template = REPLY_TEMPLATES[intent]
    
    if (!template) {
      return '好的，我明白了。'
    }
    
    // 简单的模板替换
    return template
      .replace('{title}', entities.title || '日程')
      .replace('{date}', entities.date || '今天')
      .replace('{time}', entities.startTime || '全天')
  }
  
  /**
   * 降级处理：使用规则匹配
   */
  private fallbackProcess(text: string, currentDate: string): AIProcessResult {
    console.log('⚠️ 使用降级规则处理')
    
    // 简单的规则匹配
    const patterns = [
      { regex: /创建|添加|新建|安排|有[个]?/, intent: IntentType.CREATE_TASK },
      { regex: /查询|查看|有什么|什么事|日程|安排/, intent: IntentType.QUERY_TASK },
      { regex: /修改|改到|更新|调整/, intent: IntentType.UPDATE_TASK },
      { regex: /删除|取消|移除/, intent: IntentType.DELETE_TASK },
      { regex: /你好|早上好|晚上好|嗨|hi|hello/i, intent: IntentType.GREETING },
      { regex: /帮助|怎么用|功能/, intent: IntentType.HELP },
    ]
    
    let intent = IntentType.UNKNOWN
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        intent = pattern.intent
        break
      }
    }
    
    // 简单的日期提取
    const entities: ExtractedEntities = {}
    
    if (text.includes('今天')) {
      entities.date = currentDate
    } else if (text.includes('明天')) {
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      entities.date = tomorrow.toISOString().split('T')[0]
    } else if (text.includes('后天')) {
      const dayAfter = new Date(currentDate)
      dayAfter.setDate(dayAfter.getDate() + 2)
      entities.date = dayAfter.toISOString().split('T')[0]
    }
    
    // 简单的时间提取
    const timeMatch = text.match(/(\d{1,2})[点时:](\d{0,2})/)
    if (timeMatch) {
      const hour = timeMatch[1].padStart(2, '0')
      const minute = (timeMatch[2] || '00').padStart(2, '0')
      entities.startTime = `${hour}:${minute}`
    }
    
    return {
      intent,
      confidence: 0.5,
      complexity: this.determineComplexity(intent),
      entities,
      reply: intent === IntentType.UNKNOWN
        ? '抱歉，我没有理解你的意思。你可以说"明天上午十点有会议"来创建日程，或说"明天有什么事"来查询日程。'
        : this.generateReply(intent, entities),
    }
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

export const nlpService = new NLPService()

