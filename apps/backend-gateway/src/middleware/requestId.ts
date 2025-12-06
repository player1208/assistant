/**
 * 请求ID中间件 - 用于请求追踪
 */

import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { HEADERS } from '@assistent/shared'

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 优先使用请求头中的 ID，否则生成新的
  const requestId = (req.headers[HEADERS.X_REQUEST_ID] as string) || uuidv4()
  
  req.requestId = requestId
  res.setHeader(HEADERS.X_REQUEST_ID, requestId)
  
  next()
}

