/**
 * AI1 (前台接待) 提示词
 *
 * 职责：清洗需求和分发指令
 * - 意图识别与防火墙
 * - 时间合规性检查
 * - 信息完整性检查 (Slot Filling)
 * - 生成快速回复或派单给 AI2
 *
 * 注意：使用微调模型后，只需简化提示词即可
 */

import { DateTimeContext } from '@assistent/shared'

// ========== 提示词模板 ==========

/**
 * 生成 AI1 系统提示词（微调版 - 简化）
 *
 * 微调后的模型已经将复杂规则内化到模型权重中，
 * 只需要提供当前时间上下文和输出格式即可。
 *
 * @param dateTimeContext 由中间体注入的日期时间上下文
 */
export function generateAI1SystemPrompt(dateTimeContext: DateTimeContext): string {
  return `你是日程助手AI1，负责意图识别。当前时间：${dateTimeContext.today} ${dateTimeContext.currentTime} ${dateTimeContext.weekdayName}。
输出JSON格式：{"reply_to_user": string|null, "agent_instruction": {"intent": string, "payload": {...}}|null}`
}

// ========== 导出 ==========

export const AI1_PROMPT = {
  generate: generateAI1SystemPrompt,
}

