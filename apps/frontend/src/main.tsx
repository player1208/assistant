import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './app/router'
import { AuthProvider } from './app/contexts/AuthContext'

// 在开发环境或微信浏览器中启用 vConsole 调试工具
const initVConsole = async () => {
  // 检测是否在微信浏览器中
  const isWechat = /MicroMessenger/i.test(navigator.userAgent)
  // 检测是否开启调试模式（通过 URL 参数 ?debug=1）
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1'

  // 开发环境、微信浏览器、或手动开启调试时启用 vConsole
  if (import.meta.env.DEV || isWechat || isDebugMode) {
    const VConsole = (await import('vconsole')).default
    new VConsole({
      theme: 'dark',
      // 默认打开的面板
      defaultPlugins: ['system', 'network', 'element', 'storage'],
    })
    console.log('vConsole 已启用')
    console.log('环境:', import.meta.env.DEV ? '开发' : '生产')
    console.log('微信浏览器:', isWechat ? '是' : '否')
    console.log('User Agent:', navigator.userAgent)
  }
}

// 初始化 vConsole
initVConsole()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
