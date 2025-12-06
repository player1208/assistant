/**
 * 日历工具
 *
 * 提供日期相关的工具函数，供 AI Agent 调用
 * 本地计算使用 date-fns，节假日信息使用 chinese-days 库
 *
 * 工具分类：
 * 1. 辅助计算工具 - find_holiday, find_solar_term, calc_date (AI2 时间解析用)
 * 2. 业务工具 - add_event, add_deadline, get_agenda, set_reminder_interval, toggle_daily_brief
 * 3. 旧版工具 - get_today, add_days, get_weekday 等 (保留兼容)
 */

import { format, addDays, startOfWeek, addWeeks, getDay } from 'date-fns'
import {
  ToolDefinition,
  CalendarToolName,
  GetTodayResult,
  AddDaysParams,
  GetWeekdayParams,
  GetDateInfoParams,
  DateInfoResult,
  NextHolidayResult,
  GetYearHolidaysParams,
  ENV,
  SERVICE_PORTS,
  ServiceName,
} from '@assistent/shared'
// chinese-days 库 - 用于精确的中国节假日和24节气查询
import {
  isHoliday,
  isWorkday,
  getHolidaysInRange,
  getSolarTermsInRange,
  getDayDetail,
} from 'chinese-days'

// ========== 常量 ==========

// Schedule Service URL
const SCHEDULE_SERVICE_URL = ENV.IS_PROD
  ? `http://${ServiceName.SCHEDULE}`
  : `http://localhost:${SERVICE_PORTS[ServiceName.SCHEDULE]}`

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']
const WEEKDAY_MAP: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
}

// 节假日 API 地址
const HOLIDAY_API = 'https://timor.tech/api/holiday'

// ========== 工具定义 (给 AI 看的) ==========

export const CALENDAR_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_today',
      description: '获取今天的日期和星期几。当用户询问"今天是几号"、"今天星期几"时使用。',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_days',
      description: '计算某个日期加减N天后的日期。用于处理"明天"、"后天"、"3天后"、"一周后"、"昨天"等相对日期表达。',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: '基准日期，格式 YYYY-MM-DD。不填则默认今天。',
          },
          days: {
            type: 'integer',
            description: '天数。正数表示之后，负数表示之前。例如：1=明天，2=后天，-1=昨天，7=一周后',
          },
        },
        required: ['days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weekday',
      description: '获取本周或下周某一天的日期。用于处理"这周一"、"下周五"、"本周日"等表达。',
      parameters: {
        type: 'object',
        properties: {
          week: {
            type: 'string',
            description: '本周还是下周',
            enum: ['this', 'next'],
          },
          day: {
            type: 'string',
            description: '星期几',
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          },
        },
        required: ['week', 'day'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_date_info',
      description: '查询某天的详细信息，包括星期几、是否节假日、是否调休、节日名称等。用于判断某天是否放假。',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: '要查询的日期，格式 YYYY-MM-DD',
          },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_next_holiday',
      description: '查询从今天开始最近的下一个节假日。注意：这个工具只返回最近的一个节假日，不能查询特定节日。',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_holiday',
      description: '按名称查询特定法定节假日的日期。支持：春节、元旦、清明、劳动节/五一、端午、中秋、国庆。返回指定年份或最近一次该节日的日期。',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '节日名称，如：春节、元旦、清明、劳动节、五一、端午、中秋、国庆',
          },
          year: {
            type: 'integer',
            description: '可选，指定年份。如用户说"明年中秋"则传2026，不传则自动查找最近的',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_solar_term',
      description: '查询24节气的日期。支持：立春、雨水、惊蛰、春分、清明、谷雨、立夏、小满、芒种、夏至、小暑、大暑、立秋、处暑、白露、秋分、寒露、霜降、立冬、小雪、大雪、冬至、小寒、大寒。',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '节气名称，如：立冬、冬至、春分',
          },
          year: {
            type: 'integer',
            description: '可选，指定年份。不传则自动查找最近的',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_year_holidays',
      description: '获取指定年份的所有法定节假日列表。',
      parameters: {
        type: 'object',
        properties: {
          year: {
            type: 'integer',
            description: '年份，如 2024、2025、2026',
          },
        },
        required: ['year'],
      },
    },
  },
  // ========== AI2 业务工具 ==========
  {
    type: 'function',
    function: {
      name: 'add_event',
      description: '创建标准日程（会议、约会、全天纪念日等）。Python 层会自动计算触发时间并写入 notifications 表。',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '事件名称',
          },
          start_time: {
            type: 'string',
            description: '开始时间，格式 YYYY-MM-DD HH:mm',
          },
          is_all_day: {
            type: 'boolean',
            description: '是否全天事件',
          },
          notify_offset: {
            type: 'integer',
            description: '提前提醒分钟数。如 15 (提前15分钟)。如果用户说"不提醒"，传 -1',
          },
          notify_time: {
            type: 'string',
            description: '全天事件的提醒时间，格式 HH:mm（如 "09:00"）',
          },
        },
        required: ['title', 'start_time', 'is_all_day'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_deadline',
      description: '创建截止任务，并设置从今天开始的每日提醒。这是个复合工具，Python 层会创建 Deadline 记录并生成每日提醒。',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '任务名称',
          },
          due_time: {
            type: 'string',
            description: '截止时间，格式 YYYY-MM-DD HH:mm',
          },
          daily_remind_time: {
            type: 'string',
            description: '每日提醒的时间点，格式 HH:mm (如 "09:00")',
          },
        },
        required: ['title', 'due_time', 'daily_remind_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_reminder_interval',
      description: '修改今日剩余未完成任务的催促频率。Python 层会更新系统配置或重置今日剩余的通知队列。',
      parameters: {
        type: 'object',
        properties: {
          interval_minutes: {
            type: 'integer',
            description: '间隔分钟数（如 60, 120）',
          },
        },
        required: ['interval_minutes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'toggle_daily_brief',
      description: '开关早安/晚安提醒。',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: '目标类型：morning=早安, evening=晚安, all=全部',
            enum: ['morning', 'evening', 'all'],
          },
          status: {
            type: 'string',
            description: '状态：on=开, off=关',
            enum: ['on', 'off'],
          },
        },
        required: ['target', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_agenda',
      description: '查询某天的安排（用于回复"明天忙不忙"）。返回该日期的所有 Event 和 Deadline 列表文本。',
      parameters: {
        type: 'object',
        properties: {
          query_date: {
            type: 'string',
            description: '查询日期 YYYY-MM-DD',
          },
        },
        required: ['query_date'],
      },
    },
  },
  // ========== 辅助计算工具 ==========
  {
    type: 'function',
    function: {
      name: 'calc_date',
      description: '日期加减计算。用于计算"端午节前两天"等复杂表达。',
      parameters: {
        type: 'object',
        properties: {
          base_date: {
            type: 'string',
            description: '基准日期，格式 YYYY-MM-DD',
          },
          offset_days: {
            type: 'integer',
            description: '偏移天数。正数表示之后，负数表示之前。如 -2 表示前两天',
          },
        },
        required: ['base_date', 'offset_days'],
      },
    },
  },
]

// ========== 工具实现 ==========

/**
 * 获取今天日期
 */
function getToday(): GetTodayResult {
  const now = new Date()
  const dayOfWeek = getDay(now)
  
  return {
    date: format(now, 'yyyy-MM-dd'),
    weekday: `星期${WEEKDAY_NAMES[dayOfWeek]}`,
    weekdayNumber: dayOfWeek,
  }
}

/**
 * 日期加减
 */
function addDaysToDate(params: AddDaysParams): string {
  const base = params.date ? new Date(params.date) : new Date()
  const result = addDays(base, params.days)
  return format(result, 'yyyy-MM-dd')
}

/**
 * 获取本周/下周某天
 */
function getWeekday(params: GetWeekdayParams): string {
  const now = new Date()
  // 获取本周一 (weekStartsOn: 1 表示周一是一周的开始)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  
  // 如果是下周，加一周
  const targetWeekStart = params.week === 'next' 
    ? addWeeks(weekStart, 1) 
    : weekStart
  
  // 计算偏移
  const offset = WEEKDAY_MAP[params.day]
  const result = addDays(targetWeekStart, offset)
  
  return format(result, 'yyyy-MM-dd')
}

// API 响应类型
interface HolidayAPIResponse {
  code: number
  type?: {
    type: number
    name: string
    week: number
  }
  holiday?: {
    holiday: boolean
    name: string
    wage: number
    date?: string
    rest?: number
  }
}

/**
 * 查询日期信息（调用外部 API）
 */
async function getDateInfo(params: GetDateInfoParams): Promise<DateInfoResult> {
  try {
    const response = await fetch(`${HOLIDAY_API}/info/${params.date}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json() as HolidayAPIResponse

    // 解析返回数据
    // type: 0=工作日, 1=周末, 2=节日, 3=调休
    const typeMap: Record<number, DateInfoResult['type']> = {
      0: 'workday',
      1: 'weekend',
      2: 'holiday',
      3: 'compensatory',
    }

    return {
      date: params.date,
      weekday: data.type?.name || '',
      isHoliday: data.holiday?.holiday === true,
      isWorkday: data.type?.type === 0 || data.type?.type === 3,
      holidayName: data.holiday?.name,
      type: typeMap[data.type?.type ?? 0] || 'workday',
    }
  } catch (error) {
    console.error('获取日期信息失败:', error)

    // 降级：本地计算基本信息
    const date = new Date(params.date)
    const dayOfWeek = getDay(date)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    return {
      date: params.date,
      weekday: `星期${WEEKDAY_NAMES[dayOfWeek]}`,
      isHoliday: false,
      isWorkday: !isWeekend,
      type: isWeekend ? 'weekend' : 'workday',
    }
  }
}

// 下一个节假日 API 响应类型
interface NextHolidayAPIResponse {
  code: number
  holiday?: {
    holiday: boolean
    name: string
    wage: number
    date: string
    rest: number
  }
}

/**
 * 获取下一个节假日（调用外部 API）
 */
async function getNextHoliday(): Promise<NextHolidayResult> {
  try {
    const response = await fetch(`${HOLIDAY_API}/next`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json() as NextHolidayAPIResponse

    return {
      name: data.holiday?.name || '未知节日',
      date: data.holiday?.date || '',
      daysLeft: data.holiday?.rest || 0,
    }
  } catch (error) {
    console.error('获取下一个节假日失败:', error)
    throw new Error('无法获取节假日信息，请稍后重试')
  }
}

// 节日名称映射（用于匹配用户输入的不同表达）
// 英文名是 chinese-days 库返回的标准名称
const HOLIDAY_NAME_MAP: Record<string, { keywords: string[], englishName: string }> = {
  '元旦': { keywords: ['元旦', 'New Year'], englishName: 'New Year\'s Day' },
  '春节': { keywords: ['春节', '过年', '初一', '除夕', 'Spring Festival'], englishName: 'Spring Festival' },
  '清明': { keywords: ['清明', '清明节', 'Tomb-sweeping', 'Qingming'], englishName: 'Tomb-sweeping Day' },
  '劳动节': { keywords: ['劳动节', '五一', 'Labour', 'Labor'], englishName: 'Labour Day' },
  '端午': { keywords: ['端午', '端午节', 'Dragon Boat'], englishName: 'Dragon Boat Festival' },
  '中秋': { keywords: ['中秋', '中秋节', 'Mid-autumn'], englishName: 'Mid-autumn Festival' },
  '国庆': { keywords: ['国庆', '国庆节', 'National Day'], englishName: 'National Day' },
}

interface FindHolidayParams {
  name: string
  year?: number
}

interface FindHolidayResult {
  name: string
  date: string
  year: number
}

/**
 * 按名称查询特定法定节假日（使用 chinese-days 库）
 *
 * 注意：getHolidaysInRange 返回的是日期字符串数组 string[]
 * 需要使用 getDayDetail 来获取每个日期的名称
 */
function findHoliday(params: FindHolidayParams): FindHolidayResult {
  const searchName = params.name.trim()
  console.log(`🔍 查询节日: ${searchName}${params.year ? ` (${params.year}年)` : ''}`)

  // 确定要搜索的节日
  let targetHoliday: { keywords: string[], englishName: string } | null = null
  let matchedChineseName = ''

  for (const [chineseName, holiday] of Object.entries(HOLIDAY_NAME_MAP)) {
    if (holiday.keywords.some(keyword =>
      searchName.includes(keyword) ||
      keyword.includes(searchName) ||
      searchName.toLowerCase().includes(keyword.toLowerCase())
    )) {
      targetHoliday = holiday
      matchedChineseName = chineseName
      break
    }
  }

  if (!targetHoliday) {
    throw new Error(`未找到节日: ${searchName}。支持的节日：元旦、春节、清明、劳动节/五一、端午、中秋、国庆`)
  }

  // 确定查询年份
  const currentYear = new Date().getFullYear()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 如果指定了年份，只查那一年；否则查今年和明年
  const yearsToSearch = params.year
    ? [params.year]
    : [currentYear, currentYear + 1]

  for (const year of yearsToSearch) {
    try {
      // 使用 chinese-days 的 getHolidaysInRange 查询整年
      // 返回的是日期字符串数组 string[]
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      const holidayDates = getHolidaysInRange(startDate, endDate)

      // 遍历每个假日日期，使用 getDayDetail 获取详情
      for (const dateStr of holidayDates) {
        const detail = getDayDetail(dateStr)
        // detail 格式: { work: boolean, name: string, date: string }
        // name 格式: 'Mid-autumn Festival,中秋,1'
        const holidayInfo = detail.name.split(',')
        const englishName = holidayInfo[0]
        const chineseName = holidayInfo[1] || ''

        if (englishName === targetHoliday.englishName ||
            chineseName === matchedChineseName ||
            targetHoliday.keywords.some(k => chineseName.includes(k))) {
          const holidayDate = new Date(dateStr)

          // 如果没有指定年份，确保日期在今天之后（或今天）
          if (!params.year && holidayDate < today) {
            continue
          }

          console.log(`✅ 找到 ${matchedChineseName}: ${dateStr}`)
          return {
            name: matchedChineseName,
            date: dateStr,
            year: year,
          }
        }
      }
    } catch (error) {
      console.error(`获取 ${year} 年节假日失败:`, error)
    }
  }

  throw new Error(`未找到 ${params.year || '最近的'} ${searchName}`)
}

// 24节气名称列表
const SOLAR_TERMS = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
] as const

type SolarTermName = typeof SOLAR_TERMS[number]

interface FindSolarTermParams {
  name: string
  year?: number
}

interface FindSolarTermResult {
  name: string
  date: string
  year: number
}

/**
 * 查询24节气日期（使用 chinese-days 库的 getSolarTermsInRange）
 *
 * getSolarTermsInRange 返回 SolarTerm[] 格式:
 * { date: string, term: SolarTermKey, name: string, index?: number }
 */
function findSolarTerm(params: FindSolarTermParams): FindSolarTermResult {
  const searchName = params.name.trim()
  console.log(`🔍 查询节气: ${searchName}${params.year ? ` (${params.year}年)` : ''}`)

  // 验证节气名称
  const termName = SOLAR_TERMS.find(term =>
    searchName.includes(term) || term.includes(searchName)
  )

  if (!termName) {
    throw new Error(`未找到节气: ${searchName}。支持的节气：${SOLAR_TERMS.join('、')}`)
  }

  // 确定查询年份
  const currentYear = new Date().getFullYear()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 如果指定了年份，只查那一年；否则查今年和明年
  const yearsToSearch = params.year
    ? [params.year]
    : [currentYear, currentYear + 1]

  for (const year of yearsToSearch) {
    try {
      // 使用 getSolarTermsInRange 查询整年的节气
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      const solarTerms = getSolarTermsInRange(startDate, endDate)

      // 查找匹配的节气
      for (const term of solarTerms) {
        // term 格式: { date: string, term: SolarTermKey, name: string }
        if (term.name === termName) {
          const solarTermDate = new Date(term.date)

          // 如果没有指定年份，确保日期在今天之后（或今天）
          if (!params.year && solarTermDate < today) {
            continue
          }

          console.log(`✅ 找到 ${termName}: ${term.date}`)
          return {
            name: termName,
            date: term.date,
            year: year,
          }
        }
      }
    } catch (error) {
      console.error(`获取 ${year} 年 ${termName} 失败:`, error)
    }
  }

  throw new Error(`未找到 ${params.year || '最近的'} ${searchName}`)
}

/**
 * 获取整年节假日（使用 chinese-days 库）
 *
 * 注意：getHolidaysInRange 返回的是日期字符串数组 string[]
 * 需要使用 getDayDetail 来获取每个日期的名称
 */
function getYearHolidays(params: GetYearHolidaysParams): Record<string, { name: string; date: string }> {
  console.log(`📅 获取 ${params.year} 年节假日`)

  try {
    const startDate = `${params.year}-01-01`
    const endDate = `${params.year}-12-31`
    const holidayDates = getHolidaysInRange(startDate, endDate)

    // 转换格式
    const result: Record<string, { name: string; date: string }> = {}

    for (const dateStr of holidayDates) {
      // 使用 getDayDetail 获取日期详情
      const detail = getDayDetail(dateStr)
      // detail.name 格式: 'Mid-autumn Festival,中秋,1'
      const holidayInfo = detail.name.split(',')
      const chineseName = holidayInfo[1] || holidayInfo[0]

      result[dateStr] = {
        name: chineseName,
        date: dateStr,
      }
    }

    console.log(`✅ 找到 ${Object.keys(result).length} 个节假日`)
    return result
  } catch (error) {
    console.error('获取年度节假日失败:', error)
    throw new Error('无法获取节假日信息')
  }
}

// ========== AI2 业务工具实现 ==========

/**
 * 业务工具参数类型
 */
export interface AddEventParams {
  title: string
  start_time: string
  is_all_day: boolean
  notify_offset?: number
  notify_time?: string
}

export interface AddDeadlineParams {
  title: string
  due_time: string
  daily_remind_time: string
}

export interface SetReminderIntervalParams {
  interval_minutes: number
}

export interface ToggleDailyBriefParams {
  target: 'morning' | 'evening' | 'all'
  status: 'on' | 'off'
}

export interface GetAgendaParams {
  query_date: string
}

export interface CalcDateParams {
  base_date: string
  offset_days: number
}

/**
 * 业务工具结果类型
 */
export interface BusinessToolResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

/**
 * 创建日程事件
 *
 * 调用 schedule-service API 创建日程，并检测时间冲突
 */
async function addEvent(params: AddEventParams): Promise<BusinessToolResult> {
  console.log(`📅 创建日程: ${params.title}`)
  console.log(`   开始时间: ${params.start_time}`)
  console.log(`   全天事件: ${params.is_all_day}`)
  console.log(`   提前提醒: ${params.notify_offset ?? '不提醒'}`)

  try {
    // 解析 start_time 为 date 和 startTime
    const [date, time] = params.start_time.split(' ')

    // 计算结束时间 (默认1小时后)
    const endTime = time ? calculateEndTime(time, 60) : undefined

    // 构建请求体
    const requestBody = {
      title: params.title,
      date,
      startTime: time,
      endTime,
      isAllDay: params.is_all_day,
      // 提醒配置
      reminders: params.notify_offset ? [{
        type: 'notification',
        offsetMinutes: params.notify_offset,
        isEnabled: true,
      }] : [],
    }

    // 调用 schedule-service API
    const response = await fetch(`${SCHEDULE_SERVICE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wx-openid': 'test-user', // TODO: 从上下文获取真实用户ID
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json() as {
      code: number
      message: string
      data: {
        id: string
        title: string
        conflictStatus?: string
        conflictTaskIds?: string[]
      }
    }

    if (!response.ok) {
      console.error(`❌ 创建日程失败:`, result)
      return {
        success: false,
        message: result.message || '创建日程失败',
        data: { error: result },
      }
    }

    const task = result.data
    console.log(`✅ 日程创建成功: ${task.id}`)

    // 检测是否有冲突
    const conflictTaskIds = task.conflictTaskIds || []
    if (task.conflictStatus === 'conflict' && conflictTaskIds.length > 0) {
      console.log(`⚠️ 检测到时间冲突，冲突任务: ${conflictTaskIds.join(', ')}`)

      // 查询冲突任务的详情
      const conflictDetails = await getConflictTaskDetails(conflictTaskIds)
      const conflictMessage = formatConflictMessage(conflictDetails)

      return {
        success: true,
        message: `已创建日程：${params.title}。⚠️ 注意：${conflictMessage}`,
        data: {
          id: task.id,
          title: params.title,
          start_time: params.start_time,
          is_all_day: params.is_all_day,
          notify_offset: params.notify_offset,
          conflict: true,
          conflictTaskIds: task.conflictTaskIds,
          conflictDetails,
        },
      }
    }

    return {
      success: true,
      message: `已创建日程：${params.title}`,
      data: {
        id: task.id,
        title: params.title,
        start_time: params.start_time,
        is_all_day: params.is_all_day,
        notify_offset: params.notify_offset,
        conflict: false,
      },
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ 调用 schedule-service 失败:`, errMsg)
    return {
      success: false,
      message: `add_event failed: ${errMsg}`,
      data: { error: errMsg },
    }
  }
}

/**
 * 计算结束时间
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

/**
 * 获取冲突任务的详情
 */
async function getConflictTaskDetails(taskIds: string[]): Promise<Array<{id: string, title: string, startTime?: string, endTime?: string}>> {
  const details: Array<{id: string, title: string, startTime?: string, endTime?: string}> = []

  for (const taskId of taskIds) {
    try {
      const response = await fetch(`${SCHEDULE_SERVICE_URL}/tasks/${taskId}`, {
        headers: {
          'x-wx-openid': 'test-user', // TODO: 从上下文获取真实用户ID
        },
      })
      if (response.ok) {
        const result = await response.json() as {
          data: { id: string; title: string; startTime?: string; endTime?: string }
        }
        const task = result.data
        details.push({
          id: task.id,
          title: task.title,
          startTime: task.startTime,
          endTime: task.endTime,
        })
      }
    } catch (error) {
      console.error(`获取任务 ${taskId} 详情失败:`, error)
    }
  }

  return details
}

/**
 * 格式化冲突消息
 */
function formatConflictMessage(conflictDetails: Array<{id: string, title: string, startTime?: string, endTime?: string}>): string {
  if (conflictDetails.length === 0) {
    return '与其他日程时间冲突'
  }

  const conflictList = conflictDetails.map(task => {
    const timeRange = task.startTime && task.endTime
      ? `(${task.startTime}-${task.endTime})`
      : task.startTime
        ? `(${task.startTime})`
        : ''
    return `"${task.title}"${timeRange}`
  }).join('、')

  return `与${conflictList}时间冲突`
}

/**
 * 创建截止任务
 *
 * 调用 schedule-service API 创建截止任务
 */
async function addDeadline(params: AddDeadlineParams): Promise<BusinessToolResult> {
  console.log(`📦 创建截止任务: ${params.title}`)
  console.log(`   截止时间: ${params.due_time}`)
  console.log(`   每日提醒: ${params.daily_remind_time}`)

  try {
    // 解析 due_time 为 date
    const [date] = params.due_time.split(' ')

    // 构建请求体
    // 注意：Task schema 的 reminder type 只支持 'notification' | 'alarm'
    // 我们使用 startTime 设置提醒时间，offsetMinutes=0 表示在开始时间提醒
    const requestBody = {
      title: params.title,
      date,
      startTime: params.daily_remind_time, // 使用提醒时间作为任务开始时间
      reminders: [{
        type: 'notification',
        offsetMinutes: 0, // 在开始时间提醒
        isEnabled: true,
      }],
    }

    // 调用 schedule-service API
    const response = await fetch(`${SCHEDULE_SERVICE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wx-openid': 'test-user',
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json() as {
      code: number
      message: string
      data: { id: string; title: string }
    }

    if (!response.ok) {
      console.error(`❌ 创建截止任务失败:`, result)
      return {
        success: false,
        message: `add_deadline failed: ${result.message || response.statusText}`,
        data: { error: result },
      }
    }

    console.log(`✅ 截止任务创建成功: ${result.data.id}`)
    return {
      success: true,
      message: `已创建截止任务：${params.title}，将在每天 ${params.daily_remind_time} 提醒您`,
      data: {
        id: result.data.id,
        title: params.title,
        due_time: params.due_time,
        daily_remind_time: params.daily_remind_time,
      },
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ add_deadline failed:`, errMsg)
    return {
      success: false,
      message: `add_deadline failed: ${errMsg}`,
      data: { error: errMsg },
    }
  }
}

/**
 * 设置提醒间隔
 */
async function setReminderInterval(params: SetReminderIntervalParams): Promise<BusinessToolResult> {
  console.log(`⏰ 设置提醒间隔: ${params.interval_minutes} 分钟`)

  try {
    const response = await fetch(`${SCHEDULE_SERVICE_URL}/settings/reminder-interval`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-wx-openid': 'test-user',
      },
      body: JSON.stringify({ interval_minutes: params.interval_minutes }),
    })

    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      return {
        success: false,
        message: `set_reminder_interval failed: ${response.statusText}`,
        data: { error: result },
      }
    }

    return {
      success: true,
      message: `已设置提醒间隔为每 ${params.interval_minutes} 分钟`,
      data: { interval_minutes: params.interval_minutes },
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ set_reminder_interval failed:`, errMsg)
    return {
      success: false,
      message: `set_reminder_interval failed: ${errMsg}`,
      data: { error: errMsg },
    }
  }
}

/**
 * 开关早晚安提醒
 */
async function toggleDailyBrief(params: ToggleDailyBriefParams): Promise<BusinessToolResult> {
  const targetMap = { morning: '早安', evening: '晚安', all: '早晚安' }
  const statusMap = { on: '开启', off: '关闭' }

  console.log(`🌅 ${statusMap[params.status]}${targetMap[params.target]}提醒`)

  try {
    const response = await fetch(`${SCHEDULE_SERVICE_URL}/settings/daily-brief`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-wx-openid': 'test-user',
      },
      body: JSON.stringify({ target: params.target, status: params.status }),
    })

    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      return {
        success: false,
        message: `toggle_daily_brief failed: ${response.statusText}`,
        data: { error: result },
      }
    }

    return {
      success: true,
      message: `已${statusMap[params.status]}${targetMap[params.target]}提醒`,
      data: { target: params.target, status: params.status },
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ toggle_daily_brief failed:`, errMsg)
    return {
      success: false,
      message: `toggle_daily_brief failed: ${errMsg}`,
      data: { error: errMsg },
    }
  }
}

/**
 * 查询某日安排
 */
async function getAgenda(params: GetAgendaParams): Promise<BusinessToolResult> {
  console.log(`📋 查询 ${params.query_date} 的日程`)

  try {
    const response = await fetch(`${SCHEDULE_SERVICE_URL}/tasks?date=${params.query_date}`, {
      headers: { 'x-wx-openid': 'test-user' },
    })

    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      return {
        success: false,
        message: `get_agenda failed: ${response.statusText}`,
        data: { error: result },
      }
    }

    const result = await response.json() as {
      data: Array<{ id: string; title: string; startTime?: string; endTime?: string; type?: string }>
    }

    const tasks = result.data || []
    if (tasks.length === 0) {
      return {
        success: true,
        message: `${params.query_date} 没有安排`,
        data: { query_date: params.query_date, events: [], deadlines: [] },
      }
    }

    const events = tasks.filter(t => t.type !== 'deadline')
    const deadlines = tasks.filter(t => t.type === 'deadline')

    return {
      success: true,
      message: `${params.query_date} 有 ${events.length} 个日程，${deadlines.length} 个截止任务`,
      data: { query_date: params.query_date, events, deadlines },
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ get_agenda failed:`, errMsg)
    return {
      success: false,
      message: `get_agenda failed: ${errMsg}`,
      data: { error: errMsg },
    }
  }
}

/**
 * 日期加减计算
 */
function calcDate(params: CalcDateParams): string {
  const baseDate = new Date(params.base_date)
  const resultDate = addDays(baseDate, params.offset_days)
  return format(resultDate, 'yyyy-MM-dd')
}

// ========== 工具执行器 ==========

// AI2 业务工具名称
export type AI2ToolName =
  | 'add_event'
  | 'add_deadline'
  | 'set_reminder_interval'
  | 'toggle_daily_brief'
  | 'get_agenda'
  | 'calc_date'

/**
 * 执行日历工具
 *
 * @param name 工具名称
 * @param args 工具参数（JSON 对象）
 * @returns 工具执行结果（JSON 字符串）
 */
export async function executeCalendarTool(
  name: CalendarToolName | AI2ToolName,
  args: Record<string, unknown>
): Promise<string> {
  console.log(`🔧 执行工具: ${name}`, args)

  try {
    let result: unknown

    switch (name) {
      // ========== 旧版日期工具 (兼容) ==========
      case 'get_today':
        result = getToday()
        break

      case 'add_days':
        result = addDaysToDate({
          date: args.date as string | undefined,
          days: args.days as number,
        })
        break

      case 'get_weekday':
        result = getWeekday({
          week: args.week as 'this' | 'next',
          day: args.day as GetWeekdayParams['day'],
        })
        break

      case 'get_date_info':
        result = await getDateInfo({
          date: args.date as string,
        })
        break

      case 'get_next_holiday':
        result = await getNextHoliday()
        break

      case 'find_holiday':
        result = await findHoliday({
          name: args.name as string,
        })
        break

      case 'get_year_holidays':
        result = await getYearHolidays({
          year: args.year as number,
        })
        break

      // ========== AI2 业务工具 ==========
      case 'add_event':
        result = await addEvent(args as unknown as AddEventParams)
        break

      case 'add_deadline':
        result = await addDeadline(args as unknown as AddDeadlineParams)
        break

      case 'set_reminder_interval':
        result = await setReminderInterval(args as unknown as SetReminderIntervalParams)
        break

      case 'toggle_daily_brief':
        result = await toggleDailyBrief(args as unknown as ToggleDailyBriefParams)
        break

      case 'get_agenda':
        result = await getAgenda(args as unknown as GetAgendaParams)
        break

      // ========== 辅助计算工具 ==========
      case 'calc_date':
        result = calcDate(args as unknown as CalcDateParams)
        break

      default:
        throw new Error(`未知工具: ${name}`)
    }

    const resultStr = typeof result === 'string' ? result : JSON.stringify(result)
    console.log(`✅ 工具结果: ${resultStr}`)

    return resultStr
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '工具执行失败'
    console.error(`❌ 工具执行失败: ${errorMsg}`)
    return JSON.stringify({ error: errorMsg })
  }
}

/**
 * 检查是否是有效工具
 */
export function isCalendarTool(name: string): name is CalendarToolName | AI2ToolName {
  const validTools: string[] = [
    // 旧版日期工具
    'get_today',
    'add_days',
    'get_weekday',
    'get_date_info',
    'get_next_holiday',
    'find_holiday',
    'get_year_holidays',
    // AI2 业务工具
    'add_event',
    'add_deadline',
    'set_reminder_interval',
    'toggle_daily_brief',
    'get_agenda',
    'calc_date',
  ]
  return validTools.includes(name)
}

