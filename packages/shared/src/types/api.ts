/**
 * API 相关类型定义
 */

// API 响应包装
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
  timestamp: number
}

// 成功响应
export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  code: 0
  data: T
}

// 错误响应
export interface ApiErrorResponse extends ApiResponse<null> {
  code: number
  data: null
  error?: {
    name: string
    stack?: string
  }
}

// API 错误码
export enum ApiErrorCode {
  // 通用错误 (1xxx)
  SUCCESS = 0,
  UNKNOWN_ERROR = 1000,
  INVALID_PARAMS = 1001,
  UNAUTHORIZED = 1002,
  FORBIDDEN = 1003,
  NOT_FOUND = 1004,
  METHOD_NOT_ALLOWED = 1005,
  RATE_LIMITED = 1006,
  SERVER_ERROR = 1007,
  
  // 认证错误 (2xxx)
  AUTH_FAILED = 2001,
  TOKEN_EXPIRED = 2002,
  TOKEN_INVALID = 2003,
  
  // 日程模块错误 (3xxx)
  TASK_NOT_FOUND = 3001,
  TASK_CREATE_FAILED = 3002,
  TASK_UPDATE_FAILED = 3003,
  TASK_DELETE_FAILED = 3004,
  
  // Deadline 模块错误 (4xxx)
  DEADLINE_NOT_FOUND = 4006,
  DEADLINE_CREATE_FAILED = 4007,
  ACTION_PLAN_NOT_FOUND = 4008,

  // 数据库错误 (5xxx)
  DB_CONNECTION_ERROR = 5001,
  DB_QUERY_ERROR = 5002,
}

// 错误消息映射
export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.SUCCESS]: '成功',
  [ApiErrorCode.UNKNOWN_ERROR]: '未知错误',
  [ApiErrorCode.INVALID_PARAMS]: '参数错误',
  [ApiErrorCode.UNAUTHORIZED]: '未授权',
  [ApiErrorCode.FORBIDDEN]: '禁止访问',
  [ApiErrorCode.NOT_FOUND]: '资源不存在',
  [ApiErrorCode.METHOD_NOT_ALLOWED]: '方法不允许',
  [ApiErrorCode.RATE_LIMITED]: '请求过于频繁',
  [ApiErrorCode.SERVER_ERROR]: '服务器错误',
  
  [ApiErrorCode.AUTH_FAILED]: '认证失败',
  [ApiErrorCode.TOKEN_EXPIRED]: 'Token已过期',
  [ApiErrorCode.TOKEN_INVALID]: 'Token无效',
  
  [ApiErrorCode.TASK_NOT_FOUND]: '任务不存在',
  [ApiErrorCode.TASK_CREATE_FAILED]: '创建任务失败',
  [ApiErrorCode.TASK_UPDATE_FAILED]: '更新任务失败',
  [ApiErrorCode.TASK_DELETE_FAILED]: '删除任务失败',
  
  // Deadline 模块错误消息
  [ApiErrorCode.DEADLINE_NOT_FOUND]: 'Deadline不存在',
  [ApiErrorCode.DEADLINE_CREATE_FAILED]: '创建Deadline失败',
  [ApiErrorCode.ACTION_PLAN_NOT_FOUND]: 'ActionPlan不存在',

  [ApiErrorCode.DB_CONNECTION_ERROR]: '数据库连接错误',
  [ApiErrorCode.DB_QUERY_ERROR]: '数据库查询错误',
}

// 服务名称 (用于服务间调用)
export enum ServiceName {
  GATEWAY = 'backend-gateway',
  SCHEDULE = 'schedule-service',
  DEADLINE = 'deadline-service',
  MESSAGE = 'message-service',
  AI = 'ai-service',
}

// 服务端口 (本地开发用)
export const SERVICE_PORTS: Record<ServiceName, number> = {
  [ServiceName.GATEWAY]: 3000,
  [ServiceName.SCHEDULE]: 3001,
  [ServiceName.DEADLINE]: 3005,
  [ServiceName.MESSAGE]: 3003,
  [ServiceName.AI]: 3004,
}

