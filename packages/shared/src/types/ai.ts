/**
 * AI 服务相关类型定义
 * 
 * 用于意图识别、实体提取等 NLP 处理
 */

// ========== 意图识别 ==========

// 用户意图类型
export enum IntentType {
  // 任务相关
  CREATE_TASK = 'create_task',       // 创建日程/任务
  QUERY_TASK = 'query_task',         // 查询日程
  UPDATE_TASK = 'update_task',       // 修改日程
  DELETE_TASK = 'delete_task',       // 删除日程
  
  // 目标相关
  CREATE_GOAL = 'create_goal',       // 创建目标
  QUERY_GOAL = 'query_goal',         // 查询目标
  UPDATE_GOAL = 'update_goal',       // 更新目标
  
  // 其他
  GREETING = 'greeting',             // 问候
  HELP = 'help',                     // 帮助
  CHAT = 'chat',                     // 闲聊
  UNKNOWN = 'unknown',               // 无法识别
}

// 任务复杂度（用于决定使用简单 LLM 还是 Agent）
export enum TaskComplexity {
  SIMPLE = 'simple',     // 简单：单步操作
  MEDIUM = 'medium',     // 中等：需要查询+执行
  COMPLEX = 'complex',   // 复杂：需要多步规划
}

// ========== 实体提取 ==========

// 提取的实体信息
export interface ExtractedEntities {
  // 任务相关
  title?: string              // 任务/事件标题
  description?: string        // 描述
  
  // 时间相关
  date?: string               // 日期 YYYY-MM-DD
  startTime?: string          // 开始时间 HH:mm
  endTime?: string            // 结束时间 HH:mm
  isAllDay?: boolean          // 是否全天
  
  // 日期范围（用于查询）
  startDate?: string          // 开始日期
  endDate?: string            // 结束日期
  
  // 相对时间表达
  relativeTime?: RelativeTimeExpression
  
  // 优先级
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  
  // 分类
  goalId?: string             // 关联目标ID
  tags?: string[]             // 标签
  
  // 查询相关
  keyword?: string            // 搜索关键词
  status?: 'pending' | 'completed' | 'cancelled'
  
  // 操作目标（用于更新/删除）
  targetTaskId?: string       // 目标任务ID

  // 日期验证信息（内部使用）
  _dateValidation?: {
    original: string          // AI 原始返回的日期
    corrected: string         // 修正后的日期
    reason: string            // 修正原因
  }
}

// 相对时间表达式
export interface RelativeTimeExpression {
  type: 'today' | 'tomorrow' | 'day_after_tomorrow' | 'this_weekday' | 'next_weekday' | 'days_later' | 'specific'
  dayOffset?: number          // 天数偏移
  weekday?: number            // 星期几 (0-6, 0=周日)
  original?: string           // 用户原始表达 (如 "下周一", "后天")
}

// ========== 日期上下文 ==========

// 周日历
export interface WeekCalendar {
  start: string               // 周一日期
  end: string                 // 周日日期
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string
}

// 月份信息
export interface MonthInfo {
  year: number
  month: number               // 1-12
  daysInMonth: number         // 本月天数
  isLeapYear: boolean         // 是否闰年
  firstDay: string            // 月初日期
  lastDay: string             // 月末日期
}

// 预计算的相对日期
export interface RelativeDates {
  today: string
  tomorrow: string
  dayAfterTomorrow: string    // 后天
  threeDaysLater: string      // 大后天
  nextMonday: string
  nextTuesday: string
  nextWednesday: string
  nextThursday: string
  nextFriday: string
  nextSaturday: string
  nextSunday: string
  thisWeekend: string         // 本周六
  nextWeekend: string         // 下周六
}

// 完整日期上下文 (传给 AI 的信息)
export interface DateContext {
  // 基础信息
  today: string               // 今天日期 YYYY-MM-DD
  dayOfWeek: number           // 今天星期几 (0-6, 0=周日)
  weekdayName: string         // 今天星期名 (如 "星期五")
  timezone: string            // 时区

  // 本周日历
  thisWeek: WeekCalendar

  // 下周日历
  nextWeek: WeekCalendar

  // 本月信息
  thisMonth: MonthInfo

  // 预计算的相对日期
  relatives: RelativeDates
}

// 日期验证结果
export interface DateValidationResult {
  isValid: boolean            // AI 计算是否正确
  aiDate: string              // AI 返回的日期
  calculatedDate: string      // 后端计算的日期
  discrepancy: boolean        // 是否有差异
  correctedDate?: string      // 修正后的日期 (如有差异)
  message?: string            // 验证消息
}

// ========== AI 处理请求/响应 ==========

// AI 处理请求
export interface AIProcessRequest {
  userId: string
  text: string                // 用户输入文本
  context?: AIContext         // 上下文信息
}

// AI 上下文（用于提高识别准确度）
export interface AIContext {
  recentTasks?: Array<{       // 最近的任务
    id: string
    title: string
    date: string
  }>
  currentDate?: string        // 当前日期
  timezone?: string           // 时区
}

// AI 处理结果
export interface AIProcessResult {
  // 意图识别
  intent: IntentType
  confidence: number          // 置信度 0-1
  complexity: TaskComplexity  // 任务复杂度
  
  // 实体提取
  entities: ExtractedEntities
  
  // 生成的回复
  reply: string
  
  // 要执行的操作
  action?: {
    type: IntentType
    params?: Record<string, unknown>
  }
  
  // 调试信息
  debug?: {
    reasoning?: string        // 推理过程
    rawResponse?: string      // LLM 原始响应
    dateContext?: {           // 日期上下文信息
      today: string
      weekday: string
    }
  }
}

// ========== LLM 服务配置 ==========

// LLM 提供商
export type LLMProvider = 
  | 'openai'        // OpenAI
  | 'anthropic'     // Claude
  | 'qwen'          // 通义千问
  | 'deepseek'      // DeepSeek
  | 'moonshot'      // Moonshot/Kimi
  | 'zhipu'         // 智谱AI
  | 'custom'        // 自定义模型

// LLM 配置
export interface LLMConfig {
  provider: LLMProvider
  apiKey?: string
  apiEndpoint?: string        // 自定义模型端点
  model?: string              // 模型名称
  temperature?: number        // 温度参数
  maxTokens?: number          // 最大 token 数
  timeout?: number            // 超时时间 (ms)
}

// LLM 请求
export interface LLMChatRequest {
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json'
  tools?: ToolDefinition[]           // Function Calling 工具定义
  toolChoice?: 'auto' | 'none'       // 工具选择模式
}

// LLM 消息
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: ToolCall[]             // AI 返回的工具调用
  toolCallId?: string                // 工具结果的调用 ID
}

// LLM 响应
export interface LLMChatResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: string
  toolCalls?: ToolCall[]             // 如果 AI 决定调用工具
}

// ========== Function Calling / 工具调用 ==========

// 工具定义 (OpenAI 格式)
export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, ToolParameterProperty>
      required?: string[]
    }
  }
}

// 工具参数属性
export interface ToolParameterProperty {
  type: 'string' | 'integer' | 'number' | 'boolean'
  description: string
  enum?: string[]
}

// AI 返回的工具调用
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string    // JSON 字符串
  }
}

// 工具执行结果
export interface ToolResult {
  toolCallId: string
  result: string
}

// ========== 日历工具相关 ==========

// 日历工具名称
export type CalendarToolName =
  | 'get_today'           // 获取今天日期
  | 'add_days'            // 日期加减
  | 'get_weekday'         // 获取本周/下周某天
  | 'get_date_info'       // 查询日期信息（节假日等）
  | 'get_next_holiday'    // 获取下一个节假日
  | 'find_holiday'        // 按名称查询特定节日
  | 'get_year_holidays'   // 获取整年节假日

// get_today 返回
export interface GetTodayResult {
  date: string            // YYYY-MM-DD
  weekday: string         // 星期几（中文）
  weekdayNumber: number   // 0-6, 0=周日
}

// add_days 参数
export interface AddDaysParams {
  date?: string           // 基准日期，默认今天
  days: number            // 天数，正数=之后，负数=之前
}

// get_weekday 参数
export interface GetWeekdayParams {
  week: 'this' | 'next'   // 本周还是下周
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
}

// get_date_info 参数和返回
export interface GetDateInfoParams {
  date: string            // YYYY-MM-DD
}

export interface DateInfoResult {
  date: string
  weekday: string         // 星期几
  isHoliday: boolean      // 是否节假日
  isWorkday: boolean      // 是否工作日
  holidayName?: string    // 节日名称
  type: 'workday' | 'weekend' | 'holiday' | 'compensatory'  // 工作日/周末/节日/调休
}

// get_next_holiday 返回（无参数，从今天开始查）
export interface NextHolidayResult {
  name: string            // 节日名称
  date: string            // 日期
  daysLeft: number        // 距今天数
}

// find_holiday 参数和返回
export interface FindHolidayParams {
  name: string            // 节日名称
}

export interface FindHolidayResult {
  name: string            // 节日名称
  date: string            // 日期
  year: number            // 年份
}

// get_year_holidays 参数
export interface GetYearHolidaysParams {
  year: number            // 年份
}

