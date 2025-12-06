/**
 * 验证工具函数
 */

/**
 * 验证日期格式 YYYY-MM-DD
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false
  }
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

/**
 * 验证时间格式 HH:mm
 */
export function isValidTimeString(timeStr: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) {
    return false
  }
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

/**
 * 验证 ObjectId 格式 (MongoDB)
 */
export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id)
}

/**
 * 验证 OpenID 格式
 */
export function isValidOpenId(openId: string): boolean {
  // OpenID 通常是 28 位字符
  return typeof openId === 'string' && openId.length >= 20 && openId.length <= 40
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证十六进制颜色值
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * 验证 URL 格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证字符串长度
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max
}

/**
 * 验证数字范围
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max
}

/**
 * 非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * 是否为正整数
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/**
 * 验证分页参数
 */
export function validatePaginationParams(
  page: unknown,
  pageSize: unknown,
  maxPageSize: number = 100
): { page: number; pageSize: number } | null {
  const p = Number(page)
  const ps = Number(pageSize)
  
  if (!Number.isInteger(p) || p < 1) return null
  if (!Number.isInteger(ps) || ps < 1 || ps > maxPageSize) return null
  
  return { page: p, pageSize: ps }
}

