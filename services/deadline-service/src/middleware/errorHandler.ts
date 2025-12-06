/**
 * 错误处理中间件
 */

import { Request, Response, NextFunction } from 'express'
import { ApiErrorCode, errorResponse, getHttpStatusFromErrorCode } from '@assistent/shared'

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

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Error:', err)

  if (err instanceof ApiError) {
    res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err)
    )
    return
  }

  if (err.name === 'ValidationError') {
    res.status(400).json(
      errorResponse(ApiErrorCode.INVALID_PARAMS, err.message, err)
    )
    return
  }

  if (err.name === 'CastError') {
    res.status(400).json(
      errorResponse(ApiErrorCode.INVALID_PARAMS, '无效的参数格式', err)
    )
    return
  }

  res.status(500).json(
    errorResponse(ApiErrorCode.SERVER_ERROR, '服务器内部错误', err)
  )
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

