/**
 * 聊天测试页面
 * 
 * 模拟微信消息发送接收，用于测试完整的消息流程：
 * 前端 → backend-gateway → message-service → ai-service → schedule-service
 */

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Trash2, Info } from 'lucide-react'

// 消息类型
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  // AI 处理结果（仅 assistant 消息）
  debug?: {
    intent?: string
    entities?: Record<string, unknown>
    action?: {
      type: string
      data?: Record<string, unknown>
      result?: unknown
    }
  }
}

// API 响应类型
interface MessageResponse {
  code: number
  message: string
  data: {
    success: boolean
    reply: string
    action?: {
      type: string
      data?: Record<string, unknown>
      result?: unknown
    }
    error?: string
  }
  timestamp: number
}

export default function ChatTestPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: '👋 欢迎使用消息测试页面！\n\n这里模拟微信消息的发送和接收，用于测试完整的消息处理流程。\n\n试试发送：\n• "明天下午3点开会"\n• "今天有什么安排"\n• "帮我查一下后天的日程"',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 发送消息
  const sendMessage = async () => {
    const text = inputValue.trim()
    if (!text || isLoading) return

    // 添加用户消息
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // 调用消息测试 API
      // 使用与前端相同的开发用户ID，这样创建的任务才能在日程页面看到
      const response = await fetch('/api/v1/message/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          userId: 'dev_user_mock_openid',
        }),
      })

      const data: MessageResponse = await response.json()

      // 添加助手回复
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.data?.reply || '抱歉，处理消息时出现了问题。',
        timestamp: new Date(),
        debug: data.data?.action ? {
          action: data.data.action,
        } : undefined,
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      // 添加错误消息
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `❌ 发送失败：${error instanceof Error ? error.message : '网络错误'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // 清空聊天
  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        content: '💬 聊天记录已清空，开始新的对话吧！',
        timestamp: new Date(),
      },
    ])
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] bg-gray-100">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-green-600" />
          <span className="font-medium">消息测试</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`p-2 rounded-lg transition-colors ${
              showDebug ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="显示调试信息"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={clearChat}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="清空聊天"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'order-1'
                  : 'order-2'
              }`}
            >
              {/* 头像 */}
              <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-500'
                      : message.role === 'assistant'
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* 消息气泡 */}
                <div className="flex flex-col gap-1">
                  <div
                    className={`px-4 py-2 rounded-2xl whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-tr-sm'
                        : message.role === 'assistant'
                        ? 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                        : 'bg-gray-200 text-gray-600 rounded-tl-sm'
                    }`}
                  >
                    {message.content}
                  </div>

                  {/* 调试信息 */}
                  {showDebug && message.debug?.action && (
                    <div className="mt-1 p-2 bg-gray-800 text-green-400 text-xs rounded-lg font-mono overflow-x-auto">
                      <div className="text-gray-400 mb-1">// 执行的操作</div>
                      <pre>{JSON.stringify(message.debug.action, null, 2)}</pre>
                    </div>
                  )}

                  {/* 时间戳 */}
                  <span className={`text-xs text-gray-400 ${message.role === 'user' ? 'text-right' : ''}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 加载中指示器 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="px-4 py-2 bg-white rounded-2xl rounded-tl-sm shadow-sm">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，如：明天下午3点开会"
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-full transition-colors ${
              inputValue.trim() && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

