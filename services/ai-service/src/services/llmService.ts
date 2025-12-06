/**
 * LLM 服务
 * 
 * 封装对 LLM 的调用，支持多种提供商和自定义模型
 */

import {
  ENV,
  LLMProvider,
  LLMChatRequest,
  LLMChatResponse,
  LLMMessage,
  ToolCall,
  ToolDefinition,
} from '@assistent/shared'

// OpenAI 兼容的响应类型
interface OpenAIResponse {
  choices: Array<{
    message?: {
      content?: string
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: {
          name: string
          arguments: string
        }
      }>
    }
    finish_reason?: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 通义千问响应类型
interface QwenResponse {
  output?: {
    choices?: Array<{
      message?: { content?: string }
    }>
  }
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

// LLM 角色类型
export type LLMRole = 'parser' | 'agent'

// LLM 配置
interface LLMConfig {
  provider: string
  apiKey: string
  apiEndpoint: string
  model: string
  maxTokens: number
  timeout: number
}

class LLMService {
  private provider: string
  private apiKey: string
  private apiEndpoint: string
  private model: string
  private timeout: number

  // 多模型配置
  private parserConfig: LLMConfig
  private agentConfig: LLMConfig

  constructor() {
    // 直接从 process.env 读取，确保 dotenv 加载后能获取最新值
    this.provider = process.env.LLM_PROVIDER || ENV.LLM_PROVIDER
    this.apiKey = process.env.LLM_API_KEY || ENV.LLM_API_KEY
    this.apiEndpoint = process.env.LLM_API_ENDPOINT || ENV.LLM_API_ENDPOINT
    this.model = process.env.LLM_MODEL || ENV.LLM_MODEL
    this.timeout = parseInt(process.env.LLM_TIMEOUT || String(ENV.LLM_TIMEOUT), 10)

    // AI-1: 意图解析器 (快速响应) - DeepSeek-V3 (免费版)
    // 注意：Pro/deepseek-ai/DeepSeek-V3 需要付费，这里使用免费版
    this.parserConfig = {
      provider: this.provider,
      apiKey: this.apiKey,
      apiEndpoint: this.apiEndpoint,
      model: process.env.LLM_PARSER_MODEL || 'deepseek-ai/DeepSeek-V3',
      maxTokens: parseInt(process.env.LLM_PARSER_MAX_TOKENS || '500', 10),
      timeout: this.timeout,
    }

    // AI-2: Agent 执行器 (工具调用) - Qwen2.5-7B
    this.agentConfig = {
      provider: this.provider,
      apiKey: this.apiKey,
      apiEndpoint: this.apiEndpoint,
      model: process.env.LLM_AGENT_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
      maxTokens: parseInt(process.env.LLM_AGENT_MAX_TOKENS || '1000', 10),
      timeout: this.timeout,
    }

    console.log(`🤖 LLM 双模型配置:`)
    console.log(`   Provider: ${this.provider}`)
    console.log(`   Endpoint: ${this.apiEndpoint}`)
    console.log(`   API Key: ${this.apiKey ? '已配置 ✓' : '未配置 ✗'}`)
    console.log(`   ┌─ AI-1 意图解析器: ${this.parserConfig.model}`)
    console.log(`   │  Max Tokens: ${this.parserConfig.maxTokens}`)
    console.log(`   └─ AI-2 Agent执行器: ${this.agentConfig.model}`)
    console.log(`      Max Tokens: ${this.agentConfig.maxTokens}`)
  }

  /**
   * 获取指定角色的配置
   */
  getConfig(role: LLMRole): LLMConfig {
    return role === 'parser' ? this.parserConfig : this.agentConfig
  }

  /**
   * 检查 LLM 服务健康状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      // 对于自定义模型，尝试调用健康检查接口
      if (this.provider === 'custom') {
        const response = await fetch(`${this.apiEndpoint}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })
        return response.ok
      }

      // 对于云服务，简单返回 true（有 API Key 就认为可用）
      return !!this.apiKey
    } catch {
      return false
    }
  }
  
  /**
   * 聊天补全
   * @param request 请求参数
   * @param role 使用哪个模型角色: 'parser' (快速意图解析) 或 'agent' (工具调用)
   */
  async chat(request: LLMChatRequest, role?: LLMRole): Promise<LLMChatResponse> {
    // 根据角色选择配置
    const config = role ? this.getConfig(role) : this.agentConfig

    console.log(`🔮 LLM 请求: ${config.provider} / ${config.model} (${role || 'default'})`)

    switch (config.provider) {
      case 'siliconflow':
        // 硅基流动使用 OpenAI 兼容格式
        return await this.callSiliconFlow(request, config)
      case 'custom':
        return await this.callCustomModel(request, config)
      case 'openai':
        return await this.callOpenAI(request, config)
      case 'qwen':
        return await this.callQwen(request, config)
      case 'deepseek':
        return await this.callDeepSeek(request, config)
      default:
        // 默认尝试 OpenAI 兼容格式
        return await this.callSiliconFlow(request, config)
    }
  }

  /**
   * 调用硅基流动 API (OpenAI 兼容格式)
   * 支持 Function Calling
   */
  private async callSiliconFlow(request: LLMChatRequest, config?: LLMConfig): Promise<LLMChatResponse> {
    const cfg = config || this.agentConfig

    // 构建请求体
    const requestBody: Record<string, unknown> = {
      model: cfg.model,
      messages: this.convertMessages(request.messages),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? cfg.maxTokens,
    }

    // 如果有工具定义，添加到请求中
    if (request.tools && request.tools.length > 0) {
      requestBody.tools = request.tools
      requestBody.tool_choice = request.toolChoice || 'auto'
    }

    const response = await fetch(`${this.apiEndpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SiliconFlow error: ${response.status} - ${error}`)
    }

    const data = await response.json() as OpenAIResponse
    const message = data.choices[0]?.message

    // 解析工具调用
    const toolCalls = message?.tool_calls?.map(tc => ({
      id: tc.id,
      type: tc.type as 'function',
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    }))

    return {
      content: message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      finishReason: data.choices[0]?.finish_reason,
      toolCalls,
    }
  }

  /**
   * 转换消息格式（处理工具消息）
   */
  private convertMessages(messages: LLMMessage[]): unknown[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: msg.toolCallId,
          content: msg.content,
        }
      }

      if (msg.role === 'assistant' && msg.toolCalls) {
        return {
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: tc.type,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        }
      }

      return {
        role: msg.role,
        content: msg.content,
      }
    })
  }
  
  /**
   * 调用自定义模型
   */
  private async callCustomModel(request: LLMChatRequest, config?: LLMConfig): Promise<LLMChatResponse> {
    const cfg = config || this.agentConfig
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), cfg.timeout)

    try {
      const response = await fetch(`${cfg.apiEndpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey && { 'Authorization': `Bearer ${cfg.apiKey}` }),
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? cfg.maxTokens,
          response_format: request.responseFormat === 'json'
            ? { type: 'json_object' }
            : undefined,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Custom model error: ${response.status} - ${error}`)
      }

      const data = await response.json() as OpenAIResponse

      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
        finishReason: data.choices[0]?.finish_reason,
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timeout')
      }
      throw error
    }
  }

  /**
   * 调用 OpenAI API
   */
  private async callOpenAI(request: LLMChatRequest, config?: LLMConfig): Promise<LLMChatResponse> {
    const cfg = config || this.agentConfig
    const endpoint = cfg.apiEndpoint || 'https://api.openai.com'

    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o-mini',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? cfg.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`)
    }

    const data = await response.json() as OpenAIResponse

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    }
  }

  /**
   * 调用通义千问 API
   */
  private async callQwen(request: LLMChatRequest, config?: LLMConfig): Promise<LLMChatResponse> {
    const cfg = config || this.agentConfig
    const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model || 'qwen-turbo',
        input: {
          messages: request.messages,
        },
        parameters: {
          result_format: 'message',
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? cfg.maxTokens,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Qwen error: ${response.status}`)
    }

    const data = await response.json() as QwenResponse

    return {
      content: data.output?.choices?.[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    }
  }

  /**
   * 调用 DeepSeek API
   */
  private async callDeepSeek(request: LLMChatRequest, config?: LLMConfig): Promise<LLMChatResponse> {
    const cfg = config || this.agentConfig
    const endpoint = cfg.apiEndpoint || 'https://api.deepseek.com'

    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model || 'deepseek-chat',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? cfg.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek error: ${response.status}`)
    }

    const data = await response.json() as OpenAIResponse

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    }
  }

  /**
   * 便捷方法：简单对话
   * @param prompt 用户提示
   * @param systemPrompt 系统提示
   * @param role 使用哪个模型角色
   */
  async simpleChat(prompt: string, systemPrompt?: string, role?: LLMRole): Promise<string> {
    const messages: LLMMessage[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    const response = await this.chat({ messages }, role)
    return response.content
  }

  /**
   * 使用意图解析器 (AI-1) 进行快速解析
   */
  async parseIntent(prompt: string, systemPrompt?: string): Promise<string> {
    return this.simpleChat(prompt, systemPrompt, 'parser')
  }

  /**
   * 使用 Agent 执行器 (AI-2) 进行工具调用
   */
  async agentChat(request: LLMChatRequest): Promise<LLMChatResponse> {
    return this.chat(request, 'agent')
  }
}

// 延迟初始化，确保 dotenv 已加载
let _llmService: LLMService | null = null

export function getLLMService(): LLMService {
  if (!_llmService) {
    _llmService = new LLMService()
  }
  return _llmService
}

// 兼容旧代码
export const llmService = {
  get instance() {
    return getLLMService()
  },
  chat: (...args: Parameters<LLMService['chat']>) => getLLMService().chat(...args),
  simpleChat: (...args: Parameters<LLMService['simpleChat']>) => getLLMService().simpleChat(...args),
  parseIntent: (...args: Parameters<LLMService['parseIntent']>) => getLLMService().parseIntent(...args),
  agentChat: (...args: Parameters<LLMService['agentChat']>) => getLLMService().agentChat(...args),
  checkHealth: () => getLLMService().checkHealth(),
  getConfig: (role: LLMRole) => getLLMService().getConfig(role),
}

