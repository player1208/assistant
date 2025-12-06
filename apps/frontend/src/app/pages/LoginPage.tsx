/**
 * 登录页面
 * 
 * 处理微信网页授权登录流程
 */

import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { MessageCircle, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading, redirectToWxAuth } = useAuth()
  
  // 获取重定向路径和错误信息
  const redirectPath = searchParams.get('redirect') || '/'
  const error = searchParams.get('error')

  // 如果已登录，直接跳转
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, redirectPath])

  // 处理微信登录
  const handleWxLogin = () => {
    redirectToWxAuth(redirectPath)
  }

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">加载中...</p>
        </motion.div>
      </div>
    )
  }

  // 错误提示
  const getErrorMessage = () => {
    switch (error) {
      case 'auth_denied':
        return '您取消了授权，请重新登录'
      case 'auth_failed':
        return '授权失败，请稍后重试'
      default:
        return null
    }
  }

  const errorMessage = getErrorMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <span className="text-3xl">📅</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800">个人助手</h1>
          <p className="text-gray-500 mt-2">登录以同步您的日程和目标</p>
        </div>

        {/* 错误提示 */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </motion.div>
        )}

        {/* 登录卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          {/* 微信登录按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWxLogin}
            className="w-full py-3 px-4 bg-[#07C160] hover:bg-[#06AE56] text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-colors shadow-md"
          >
            <MessageCircle className="w-5 h-5" />
            微信登录
          </motion.button>

          <p className="text-center text-xs text-gray-400 mt-4">
            登录即表示您同意我们的服务条款和隐私政策
          </p>
        </motion.div>

        {/* 开发环境提示 */}
        {import.meta.env.DEV && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <p className="text-yellow-700 text-sm text-center">
              🔧 开发环境：将自动使用测试账号登录
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

