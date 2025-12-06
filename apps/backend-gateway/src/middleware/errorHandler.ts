/**
 * 全局错误处理中间件
 */

import { Request, Response, NextFunction } from 'express'
import { ApiErrorCode, errorResponse, getHttpStatusFromErrorCode } from '@assistent/shared'

// 自定义 API 错误类
export class ApiError extends Error {
  public code: ApiErrorCode
  public statusCode: number

  constructor(code: ApiErrorCode, message?: string) {
    super(message)
    this.code = code
    this.statusCode = getHttpStatusFromErrorCode(code)
    this.name = 'ApiError'
  }
}

// 错误处理中间件
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Error:', err)

  // 如果是自定义 API 错误
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err)
    )
    return
  }

  // 处理 JSON 解析错误
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json(
      errorResponse(ApiErrorCode.INVALID_PARAMS, '请求体 JSON 格式错误', err)
    )
    return
  }

  // 其他未知错误
  res.status(500).json(
    errorResponse(ApiErrorCode.SERVER_ERROR, '服务器内部错误', err)
  )
}

// 异步路由包装器 - 自动捕获 async 函数的错误
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

