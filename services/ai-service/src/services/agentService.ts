/**
 * Agent 服务 (AI2)
 *
 * GoalPilot 后端执行智能体
 *
 * 职责：
 * - 接收 AI1 的指令
 * - 时间解析与计算
 * - 调用业务工具执行操作
 * - 生成用户汇报
 *
 * 特点：
 * - 支持工具链调用（如先查节日再创建日程）
 * - 输出结构化 JSON（tool_calls + final_report）
 */

import {
  LLMMessage,
  LLMChatResponse,
  ToolCall,
  ToolDefinition,
  IntentType,
  ExtractedEntities,
  TaskComplexity,
  DateTimeContext,
  AI1AgentInstruction,
} from '@assistent/shared'
import { llmService } from './llmService'
import {
  CALENDAR_TOOL_DEFINITIONS,
  executeCalendarTool,
  isCalendarTool
} from '../tools/calendarTools'
import { generateAI2SystemPrompt } from '../prompts/ai2Prompt'

// ========== 常量 ==========

// 最大循环次数（防止无限循环）
const MAX_ITERATIONS = 5

// ========== 类型定义 ==========

export interface AgentResult {
  intent: IntentType
  confidence: number
  complexity: TaskComplexity
  entities: ExtractedEntities
  reply: string
  toolCallHistory: ToolCallRecord[]
  // AI2 新增：工具调用列表和最终汇报
  ai2Output?: AI2RawOutput
  debug?: {
    iterations: number
    rawResponse?: string
  }
}

interface ToolCallRecord {
  toolName: string
  arguments: Record<string, unknown>
  result: string
}

/**
 * AI2 原始输出格式
 */
export interface AI2RawOutput {
  tool_calls: Array<{
    tool: string
    args: Record<string, unknown>
  }>
  final_report: string
}

/**
 * AI2 执行输入
 */
export interface AI2ExecuteInput {
  instruction: AI1AgentInstruction
  dateTimeContext: DateTimeContext
}

// ========== Agent 服务 ==========

class AgentService {
  /**
   * 执行 AI1 派发的指令（新接口）
   *
   * @param input 包含 AI1 指令和日期上下文
   */
  async execute(input: AI2ExecuteInput): Promise<AgentResult> {
    const { instruction, dateTimeContext } = input

    console.log(`🤖 AI2 执行指令: ${instruction.intent}`)
    console.log(`   Payload: ${JSON.stringify(instruction.payload)}`)

    // 生成带日期上下文的系统提示词
    const systemPrompt = generateAI2SystemPrompt(dateTimeContext)

    // 构建用户消息（AI1 的指令）
    const userMessage = JSON.stringify({
      intent: instruction.intent,
      payload: instruction.payload,
    })

    // 初始化消息历史
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]

    // 工具调用历史
    const toolCallHistory: ToolCallRecord[] = []

    // Agent 循环（处理可能的工具链调用）
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      console.log(`📍 AI2 迭代 ${i + 1}/${MAX_ITERATIONS}`)

      // 调用 LLM (使用 agent 角色 - Qwen2.5-7B)
      const response = await llmService.chat({
        messages,
        tools: CALENDAR_TOOL_DEFINITIONS,
        toolChoice: 'auto',
        temperature: 0.3,
      }, 'agent')

      // 检查是否有工具调用
      if (response.toolCalls && response.toolCalls.length > 0) {
        console.log(`🔧 AI2 请求调用 ${response.toolCalls.length} 个工具: ${response.toolCalls.map(tc => tc.function.name).join(', ')}`)

        // 添加 AI 的工具调用消息
        messages.push({
          role: 'assistant',
          content: response.content || '',
          toolCalls: response.toolCalls,
        })

        // 执行所有工具调用（依赖 AI 自己按正确顺序调用）
        for (const toolCall of response.toolCalls) {
          const result = await this.executeTool(toolCall)
          toolCallHistory.push({
            toolName: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments || '{}'),
            result,
          })
          messages.push({ role: 'tool', content: result, toolCallId: toolCall.id })
        }

        // 继续循环，让 AI 处理工具结果
        continue
      }

      // 没有工具调用，解析 AI2 的最终输出
      console.log(`✅ AI2 完成，共 ${i + 1} 次迭代，${toolCallHistory.length} 次工具调用`)

      return this.parseAI2Response(response.content, instruction, toolCallHistory, i + 1)
    }

    // 超过最大迭代次数
    console.warn(`⚠️ AI2 达到最大迭代次数 ${MAX_ITERATIONS}`)

    return {
      intent: this.normalizeIntent(instruction.intent),
      confidence: 0.5,
      complexity: TaskComplexity.COMPLEX,
      entities: instruction.payload as ExtractedEntities,
      reply: '抱歉，处理您的请求时遇到了问题，请稍后重试。',
      toolCallHistory,
      debug: { iterations: MAX_ITERATIONS },
    }
  }

  /**
   * 运行 Agent 处理用户请求（兼容旧接口）
   *
   * @deprecated 建议使用 execute() 方法
   */
  async run(userMessage: string, dateTimeContext?: DateTimeContext): Promise<AgentResult> {
    console.log(`🤖 Agent 开始处理: "${userMessage}"`)

    // 如果有 dateTimeContext，使用新的提示词
    const systemPrompt = dateTimeContext
      ? generateAI2SystemPrompt(dateTimeContext)
      : this.getLegacySystemPrompt()

    // 初始化消息历史
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]

    // 工具调用历史
    const toolCallHistory: ToolCallRecord[] = []

    // Agent 循环
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      console.log(`📍 Agent 迭代 ${i + 1}/${MAX_ITERATIONS}`)

      // 调用 LLM (使用 agent 角色 - Qwen2.5-7B)
      const response = await llmService.chat({
        messages,
        tools: CALENDAR_TOOL_DEFINITIONS,
        toolChoice: 'auto',
        temperature: 0.3,
      }, 'agent')

      // 检查是否有工具调用
      if (response.toolCalls && response.toolCalls.length > 0) {
        console.log(`🔧 AI 请求调用 ${response.toolCalls.length} 个工具: ${response.toolCalls.map(tc => tc.function.name).join(', ')}`)

        // 添加 AI 的工具调用消息
        messages.push({
          role: 'assistant',
          content: response.content || '',
          toolCalls: response.toolCalls,
        })

        // 执行所有工具调用（依赖 AI 自己按正确顺序调用）
        for (const toolCall of response.toolCalls) {
          const result = await this.executeTool(toolCall)
          toolCallHistory.push({
            toolName: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments || '{}'),
            result,
          })
          messages.push({ role: 'tool', content: result, toolCallId: toolCall.id })
        }

        // 继续循环，让 AI 处理工具结果
        continue
      }

      // 没有工具调用，说明 AI 已经有了最终答案
      console.log(`✅ Agent 完成，共 ${i + 1} 次迭代，${toolCallHistory.length} 次工具调用`)
      console.log(`📝 AI-2 原始回复:`, response.content?.slice(0, 500))

      return this.parseAgentResponse(response.content, toolCallHistory, i + 1)
    }
    
    // 超过最大迭代次数
    console.warn(`⚠️ Agent 达到最大迭代次数 ${MAX_ITERATIONS}`)
    
    return {
      intent: IntentType.UNKNOWN,
      confidence: 0.5,
      complexity: TaskComplexity.COMPLEX,
      entities: {},
      reply: '抱歉，我在处理你的请求时遇到了问题，请稍后重试。',
      toolCallHistory,
      debug: { iterations: MAX_ITERATIONS },
    }
  }
  
  /**
   * 执行工具调用
   */
  private async executeTool(toolCall: ToolCall): Promise<string> {
    const { name, arguments: argsStr } = toolCall.function

    try {
      // 兼容处理：arguments 可能是字符串或对象，可能有双重转义
      let args: Record<string, unknown>
      if (typeof argsStr === 'string') {
        let parsed = JSON.parse(argsStr || '{}')
        // 处理双重转义的情况（字符串解析后还是字符串）
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed)
        }
        args = parsed
      } else {
        args = argsStr || {}
      }
      
      // 检查是否是日历工具
      if (isCalendarTool(name)) {
        return await executeCalendarTool(name, args)
      }
      
      // 未知工具
      console.warn(`⚠️ 未知工具: ${name}`)
      return JSON.stringify({ error: `未知工具: ${name}` })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '工具执行失败'
      console.error(`❌ 工具执行失败: ${errorMsg}`)
      return JSON.stringify({ error: errorMsg })
    }
  }
  
  /**
   * 解析 Agent 最终响应
   */
  private parseAgentResponse(
    content: string,
    toolCallHistory: ToolCallRecord[],
    iterations: number
  ): AgentResult {
    try {
      // 尝试解析 JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed = JSON.parse(jsonStr)
        
        return {
          intent: this.normalizeIntent(parsed.intent),
          confidence: 0.9,
          complexity: this.determineComplexity(parsed.intent),
          entities: parsed.entities || {},
          reply: parsed.reply || '好的，我明白了。',
          toolCallHistory,
          debug: { iterations, rawResponse: content },
        }
      }
      
      // 无法解析 JSON，返回纯文本回复
      return {
        intent: IntentType.CHAT,
        confidence: 0.7,
        complexity: TaskComplexity.SIMPLE,
        entities: {},
        reply: content,
        toolCallHistory,
        debug: { iterations, rawResponse: content },
      }
    } catch (error) {
      console.error('解析 Agent 响应失败:', error)
      
      return {
        intent: IntentType.UNKNOWN,
        confidence: 0.5,
        complexity: TaskComplexity.SIMPLE,
        entities: {},
        reply: content || '抱歉，我没有理解你的意思。',
        toolCallHistory,
        debug: { iterations, rawResponse: content },
      }
    }
  }
  
  /**
   * 解析 AI2 新格式的响应
   */
  private parseAI2Response(
    content: string,
    instruction: AI1AgentInstruction,
    toolCallHistory: ToolCallRecord[],
    iterations: number
  ): AgentResult {
    try {
      // 尝试解析 JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                        content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed: AI2RawOutput = JSON.parse(jsonStr)

        return {
          intent: this.normalizeIntent(instruction.intent),
          confidence: 0.95,
          complexity: this.determineComplexity(instruction.intent),
          entities: instruction.payload as ExtractedEntities,
          reply: parsed.final_report || '操作已完成。',
          toolCallHistory,
          ai2Output: parsed,
          debug: { iterations, rawResponse: content },
        }
      }

      // 无法解析 JSON，返回纯文本
      return {
        intent: this.normalizeIntent(instruction.intent),
        confidence: 0.7,
        complexity: TaskComplexity.SIMPLE,
        entities: instruction.payload as ExtractedEntities,
        reply: content,
        toolCallHistory,
        debug: { iterations, rawResponse: content },
      }
    } catch (error) {
      console.error('解析 AI2 响应失败:', error)

      return {
        intent: this.normalizeIntent(instruction.intent),
        confidence: 0.5,
        complexity: TaskComplexity.SIMPLE,
        entities: instruction.payload as ExtractedEntities,
        reply: '操作可能已完成，但解析响应时出现问题。',
        toolCallHistory,
        debug: { iterations, rawResponse: content },
      }
    }
  }

  /**
   * 获取旧版系统提示词（兼容）
   */
  private getLegacySystemPrompt(): string {
    return `你是一个智能日程管理助手。

## 你的任务

1. 理解用户意图
2. 使用日期工具获取准确日期
3. 返回结构化 JSON（后端会执行实际操作）

## 返回格式

\`\`\`json
{
  "intent": "意图类型",
  "entities": { ... },
  "reply": "给用户的回复"
}
\`\`\`
`
  }

  /**
   * 标准化意图
   */
  private normalizeIntent(intent: string): IntentType {
    const intentMap: Record<string, IntentType> = {
      // 新的 AI1/AI2 意图映射
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
   * 判断任务复杂度
   */
  private determineComplexity(intent: string): TaskComplexity {
    const simpleIntents = ['create_task', 'create_event', 'delete_task', 'greeting', 'help', 'chat']
    const mediumIntents = ['query_task', 'query_agenda', 'update_task', 'query_goal']

    if (simpleIntents.includes(intent?.toLowerCase())) return TaskComplexity.SIMPLE
    if (mediumIntents.includes(intent?.toLowerCase())) return TaskComplexity.MEDIUM
    return TaskComplexity.COMPLEX
  }
}

// 导出单例
export const agentService = new AgentService()

