/**
 * API 响应工具函数
 */

import { ApiResponse, ApiErrorCode, API_ERROR_MESSAGES } from '../types/api'

/**
 * 创建成功响应
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    code: ApiErrorCode.SUCCESS,
    message: message || API_ERROR_MESSAGES[ApiErrorCode.SUCCESS],
    data,
    timestamp: Date.now(),
  }
}

/**
 * 创建错误响应
 */
export function errorResponse(
  code: ApiErrorCode,
  message?: string,
  error?: Error
): ApiResponse<null> {
  return {
    code,
    message: message || API_ERROR_MESSAGES[code] || '未知错误',
    data: null,
    timestamp: Date.now(),
    ...(error && process.env.NODE_ENV !== 'production'
      ? {
          error: {
            name: error.name,
            stack: error.stack,
          },
        }
      : {}),
  }
}

/**
 * 创建分页响应
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<{
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  return successResponse({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

/**
 * HTTP 状态码映射
 */
export function getHttpStatusFromErrorCode(code: ApiErrorCode): number {
  switch (code) {
    case ApiErrorCode.SUCCESS:
      return 200
    case ApiErrorCode.INVALID_PARAMS:
      return 400
    case ApiErrorCode.UNAUTHORIZED:
    case ApiErrorCode.AUTH_FAILED:
    case ApiErrorCode.TOKEN_EXPIRED:
    case ApiErrorCode.TOKEN_INVALID:
      return 401
    case ApiErrorCode.FORBIDDEN:
      return 403
    case ApiErrorCode.NOT_FOUND:
    case ApiErrorCode.TASK_NOT_FOUND:
    case ApiErrorCode.DEADLINE_NOT_FOUND:
    case ApiErrorCode.ACTION_PLAN_NOT_FOUND:
      return 404
    case ApiErrorCode.METHOD_NOT_ALLOWED:
      return 405
    case ApiErrorCode.RATE_LIMITED:
      return 429
    default:
      return 500
  }
}

