/**
 * Prompt 模板
 *
 * 用于 LLM 调用的提示词模板
 *
 * 注意：完整处理现在由 agentService 使用 Agent + 工具模式处理
 * 这里保留的模板主要用于降级处理和简单场景
 */

import { IntentType } from '@assistent/shared'

interface PromptTemplate {
  system: string
  user: string
}

interface PromptParams {
  text: string
  currentDate?: string
  intent?: IntentType
}

/**
 * 获取 Prompt 模板
 */
export function getPromptTemplate(
  type: 'full_process' | 'intent_only' | 'entity_only',
  params: PromptParams
): PromptTemplate {
  switch (type) {
    case 'full_process':
      // 完整处理现在由 agentService 处理，这里提供降级模板
      return getSimpleProcessPrompt(params)
    case 'intent_only':
      return getIntentOnlyPrompt(params)
    case 'entity_only':
      return getEntityOnlyPrompt(params)
    default:
      return getSimpleProcessPrompt(params)
  }
}

/**
 * 简化的处理 Prompt（降级用）
 */
function getSimpleProcessPrompt(params: PromptParams): PromptTemplate {
  const { text } = params
  const today = new Date().toISOString().split('T')[0]

  return {
    system: `你是一个日程管理助手，负责理解用户的自然语言输入并提取结构化信息。

当前日期：${today}

## 支持的意图类型
- create_task: 创建日程/任务
- query_task: 查询日程/任务
- update_task: 修改日程/任务
- delete_task: 删除日程/任务
- greeting: 问候
- help: 帮助
- chat: 闲聊

## 需要提取的实体
- title: 任务标题
- date: 日期 (YYYY-MM-DD 格式)
- startTime: 开始时间 (HH:mm 格式)
- endTime: 结束时间 (HH:mm 格式)

## 返回 JSON 格式
{
  "intent": "意图类型",
  "confidence": 0.0-1.0,
  "entities": { ... },
  "reply": "给用户的回复"
}`,
    user: text,
  }
}

/**
 * 仅意图识别 Prompt
 */
function getIntentOnlyPrompt(params: PromptParams): PromptTemplate {
  const { text } = params
  
  return {
    system: `你是一个意图分类器。根据用户输入，判断其意图类型。

支持的意图：
- create_task: 创建日程/任务
- query_task: 查询日程/任务
- update_task: 修改日程/任务
- delete_task: 删除日程/任务
- greeting: 问候
- help: 帮助
- chat: 闲聊
- unknown: 无法识别

返回 JSON 格式：
{
  "intent": "意图类型",
  "confidence": 0.0-1.0
}`,
    user: text,
  }
}

/**
 * 仅实体提取 Prompt
 */
function getEntityOnlyPrompt(params: PromptParams): PromptTemplate {
  const { text, currentDate, intent } = params
  
  return {
    system: `你是一个实体提取器。从用户输入中提取日程相关的实体信息。

当前日期：${currentDate}
用户意图：${intent || '未知'}

需要提取的实体：
- title: 任务标题
- date: 日期 (YYYY-MM-DD)
- startTime: 开始时间 (HH:mm)
- endTime: 结束时间 (HH:mm)
- isAllDay: 是否全天
- priority: 优先级

返回 JSON 格式：
{
  "entities": {
    "title": "...",
    "date": "YYYY-MM-DD",
    ...
  }
}`,
    user: text,
  }
}

/**
 * 回复模板
 */
export const REPLY_TEMPLATES: Record<IntentType, string> = {
  [IntentType.CREATE_TASK]: '好的，我已为你创建日程：{title}，时间：{date} {time}',
  [IntentType.QUERY_TASK]: '正在查询 {date} 的日程...',
  [IntentType.UPDATE_TASK]: '好的，我已更新日程。',
  [IntentType.DELETE_TASK]: '好的，我已删除该日程。',
  [IntentType.CREATE_GOAL]: '好的，我已为你创建目标：{title}',
  [IntentType.QUERY_GOAL]: '正在查询你的目标...',
  [IntentType.UPDATE_GOAL]: '好的，我已更新目标。',
  [IntentType.GREETING]: '你好！有什么可以帮你的吗？',
  [IntentType.HELP]: `我可以帮你管理日程，你可以这样说：

📅 创建日程："明天上午十点有会议"
🔍 查询日程："明天有什么事"
✏️ 修改日程："把会议改到下午三点"
❌ 删除日程："删除明天的会议"`,
  [IntentType.CHAT]: '好的，我明白了。',
  [IntentType.UNKNOWN]: '抱歉，我没有理解你的意思。你可以说"帮助"查看我能做什么。',
}

