/**
 * 认证状态管理 Context
 * 
 * 管理用户登录状态、Token 存储、以及微信授权流程
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

// Token 存储键名
const TOKEN_STORAGE_KEY = 'auth_token'

// 用户信息类型
interface User {
  openId: string
  source: 'wx' | 'web' | 'dev'
}

// Context 值类型
interface AuthContextValue {
  // 状态
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  token: string | null
  
  // 方法
  login: (token: string) => void
  logout: () => void
  redirectToWxAuth: (redirectPath?: string) => void
}

// 创建 Context
const AuthContext = createContext<AuthContextValue | null>(null)

// Provider Props
interface AuthProviderProps {
  children: ReactNode
}

/**
 * 认证 Provider
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化：从 localStorage 读取 token，或从 URL 获取
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. 检查 URL 中是否有 token 参数（微信授权回调）
        const urlParams = new URLSearchParams(window.location.search)
        const urlToken = urlParams.get('token')
        
        if (urlToken) {
          // 保存 token 并清理 URL
          localStorage.setItem(TOKEN_STORAGE_KEY, urlToken)
          setToken(urlToken)
          
          // 清理 URL 中的 token 参数
          urlParams.delete('token')
          const newSearch = urlParams.toString()
          const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '')
          window.history.replaceState({}, '', newUrl)
          
          // 验证 token
          await verifyToken(urlToken)
          return
        }
        
        // 2. 检查 localStorage 中的 token
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
        if (storedToken) {
          setToken(storedToken)
          await verifyToken(storedToken)
          return
        }
        
        // 3. 开发环境：自动获取开发 token
        if (import.meta.env.DEV) {
          await getDevToken()
          return
        }
        
        // 4. 没有 token，未登录状态
        setIsLoading(false)
      } catch (error) {
        console.error('初始化认证失败:', error)
        // 清理无效的 token
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setUser(null)
        setIsLoading(false)
      }
    }
    
    initAuth()
  }, [])

  // 验证 token 并获取用户信息
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch('/api/v1/auth/check', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data?.isAuthenticated) {
          setUser(data.data.user)
        } else {
          throw new Error('Token 无效')
        }
      } else {
        throw new Error('验证失败')
      }
    } catch (error) {
      // Token 无效，清理
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setToken(null)
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 开发环境获取测试 token
  const getDevToken = async () => {
    try {
      const response = await fetch('/api/v1/auth/dev/login')
      if (response.ok) {
        const data = await response.json()
        const devToken = data.data?.token
        if (devToken) {
          localStorage.setItem(TOKEN_STORAGE_KEY, devToken)
          setToken(devToken)
          setUser({ openId: 'dev_user_mock_openid', source: 'dev' })
        }
      }
    } catch (error) {
      console.error('获取开发 token 失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 登录（保存 token）
  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    setToken(newToken)
    // 重新验证获取用户信息
    verifyToken(newToken).catch(() => {})
  }, [])

  // 登出
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // 跳转到微信授权页面
  const redirectToWxAuth = useCallback(async (redirectPath?: string) => {
    const path = redirectPath || window.location.pathname + window.location.search
    
    try {
      const response = await fetch(`/api/v1/auth/wx/authorize?redirect=${encodeURIComponent(path)}`)
      const data = await response.json()
      
      if (data.data?.authUrl) {
        window.location.href = data.data.authUrl
      } else {
        console.error('获取授权 URL 失败')
      }
    } catch (error) {
      console.error('获取授权 URL 失败:', error)
    }
  }, [])

  const value: AuthContextValue = {
    isAuthenticated: !!token && !!user,
    isLoading,
    user,
    token,
    login,
    logout,
    redirectToWxAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用认证状态的 Hook
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * 获取当前存储的 Token（供 API Client 使用）
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

