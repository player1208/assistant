/**
 * API 客户端 - 基础 HTTP 请求封装
 *
 * 自动处理：
 * - JWT Token 认证
 * - 错误处理
 * - 401 未授权跳转
 */

import { getStoredToken } from '../../app/contexts/AuthContext'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export class ApiError extends Error {
  code: number
  data?: any

  constructor(code: number, message: string, data?: any) {
    super(message)
    this.code = code
    this.data = data
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options?: {
      body?: any
      headers?: Record<string, string>
    }
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    // 获取存储的 token
    const token = getStoredToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }

    // 如果有 token，添加到 Authorization 头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      })

      if (!response.ok) {
        const errorData: ApiResponse<any> = await response.json()

        // 处理 401 未授权错误
        if (response.status === 401) {
          // 清除无效的 token
          localStorage.removeItem('auth_token')
          // 可以在这里触发重新登录流程
          // window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        }

        throw new ApiError(errorData.code, errorData.message, errorData.data)
      }

      const data: ApiResponse<T> = await response.json()
      return data.data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(-1, error instanceof Error ? error.message : '网络请求失败')
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, { headers })
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', endpoint, { body, headers })
  }

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', endpoint, { body, headers })
  }

  patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', endpoint, { body, headers })
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, { headers })
  }
}

export const apiClient = new ApiClient()

