/**
 * NLP 处理路由
 *
 * 提供意图识别、实体提取、AI2 执行等接口
 *
 * 端点：
 * - POST /process       - AI1 处理用户输入
 * - POST /process/ai2   - AI2 执行 AI1 派发的指令
 * - POST /process/intent - 仅识别意图
 * - POST /process/entities - 仅提取实体
 */

import { Router, Request, Response, IRouter } from 'express'
import {
  successResponse,
  AIProcessRequest,
  IntermediaryToAI2Request,
  AI2Output,
  AI2RawOutput,
} from '@assistent/shared'
import { asyncHandler } from '../middleware/errorHandler'
import { nlpService } from '../services/nlpService'
import { agentService } from '../services/agentService'

export const processRouter: IRouter = Router()

/**
 * POST /process - 处理用户输入
 * 
 * 输入：用户文本
 * 输出：意图、实体、回复
 */
processRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { userId, text, context } = req.body as AIProcessRequest
  
  if (!text) {
    res.status(400).json({
      code: 1001,
      message: '缺少 text 参数',
      data: null,
      timestamp: Date.now(),
    })
    return
  }
  
  console.log(`🧠 处理请求: userId=${userId}, text="${text}"`)
  
  // 调用 NLP 服务处理
  const result = await nlpService.process(text, context)
  
  console.log(`✅ 处理结果: intent=${result.intent}, confidence=${result.confidence}`)
  
  res.json(successResponse(result))
}))

/**
 * POST /process/intent - 仅识别意图
 */
processRouter.post('/intent', asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body
  
  if (!text) {
    res.status(400).json({
      code: 1001,
      message: '缺少 text 参数',
      data: null,
      timestamp: Date.now(),
    })
    return
  }
  
  const result = await nlpService.detectIntent(text)
  
  res.json(successResponse(result))
}))

/**
 * POST /process/entities - 仅提取实体
 */
processRouter.post('/entities', asyncHandler(async (req: Request, res: Response) => {
  const { text, intent } = req.body

  if (!text) {
    res.status(400).json({
      code: 1001,
      message: '缺少 text 参数',
      data: null,
      timestamp: Date.now(),
    })
    return
  }

  const result = await nlpService.extractEntities(text, intent)

  res.json(successResponse(result))
}))

/**
 * POST /process/ai2 - AI2 执行 AI1 派发的指令
 *
 * 输入：IntermediaryToAI2Request
 * - requestId: 请求ID
 * - userId: 用户ID
 * - instruction: AI1 的 agent_instruction
 * - dateTimeContext: 日期时间上下文
 *
 * 输出：AI2Output
 * - success: 是否成功
 * - taskCompleted: 任务是否完成
 * - finalReport: 给用户的最终回复
 * - failureReason: 失败原因（如果失败）
 */
processRouter.post('/ai2', asyncHandler(async (req: Request, res: Response) => {
  const request = req.body as IntermediaryToAI2Request

  // 验证必需字段
  if (!request.instruction) {
    res.status(400).json({
      code: 1001,
      message: '缺少 instruction 参数',
      data: null,
      timestamp: Date.now(),
    })
    return
  }

  if (!request.dateTimeContext) {
    res.status(400).json({
      code: 1001,
      message: '缺少 dateTimeContext 参数',
      data: null,
      timestamp: Date.now(),
    })
    return
  }

  const startTime = Date.now()
  console.log(`🤖 AI2 执行请求: requestId=${request.requestId}, intent=${request.instruction.intent}`)
  console.log(`   Payload: ${JSON.stringify(request.instruction.payload)}`)

  try {
    // 调用 agentService.execute()
    const agentResult = await agentService.execute({
      instruction: request.instruction,
      dateTimeContext: request.dateTimeContext,
    })

    const processingTime = Date.now() - startTime
    console.log(`✅ AI2 执行完成: ${processingTime}ms`)

    // 构建 AI2Output
    // 使用 toolCallHistory（实际执行的工具调用）而不是 ai2Output.tool_calls（AI 输出的 JSON）
    const actualToolCalls = agentResult.toolCallHistory?.map(tc => ({
      tool: tc.toolName,
      args: tc.arguments,
      result: tc.result,
    })) || []

    const output: AI2Output = {
      requestId: request.requestId,
      rawOutput: agentResult.ai2Output as AI2RawOutput | undefined,
      success: true,
      taskCompleted: true,
      finalReport: agentResult.reply,
      toolCallHistory: actualToolCalls,
      debug: {
        iterations: agentResult.debug?.iterations || 1,
        toolCalls: actualToolCalls,
        processingTime,
      },
    }

    res.json(successResponse(output))

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ AI2 执行失败:`, error)

    // 返回失败结果（描述为何卡住）
    const output: AI2Output = {
      requestId: request.requestId,
      success: false,
      taskCompleted: false,
      finalReport: '',
      failureReason: error instanceof Error ? error.message : '执行失败',
      debug: {
        iterations: 0,
        toolCalls: [],
        processingTime,
      },
    }

    res.json(successResponse(output))
  }
}))

