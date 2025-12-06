/**
 * 日期工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化时间为 HH:mm
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 解析日期字符串 YYYY-MM-DD
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * 获取今天的日期字符串
 */
export function getTodayString(): string {
  return formatDate(new Date())
}

/**
 * 判断是否是同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * 获取日期范围内的所有日期
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  
  const current = new Date(start)
  while (current <= end) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * 获取本周的开始和结束日期
 */
export function getWeekRange(date: Date = new Date()): { start: string; end: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  }
}

/**
 * 获取本月的开始和结束日期
 */
export function getMonthRange(date: Date = new Date()): { start: string; end: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay),
  }
}

/**
 * 时间字符串转换为分钟数 (用于排序比较)
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 比较两个时间字符串
 */
export function compareTime(time1: string, time2: string): number {
  return timeToMinutes(time1) - timeToMinutes(time2)
}

