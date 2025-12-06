/**
 * 数据库配置
 */

import mongoose from 'mongoose'
import { ENV } from '@assistent/shared'

let isConnected = false

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    console.log('📦 使用已有的数据库连接')
    return
  }

  try {
    const options: mongoose.ConnectOptions = {
      // 连接池配置
      maxPoolSize: 10,
      minPoolSize: 2,

      // 超时配置
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    await mongoose.connect(ENV.MONGODB_URI, options)
    
    isConnected = true
    console.log('📦 MongoDB 连接成功')

    // 连接事件监听
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 连接错误:', err)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB 连接断开')
      isConnected = false
    })

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB 重新连接成功')
      isConnected = true
    })

  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error)
    throw error
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return
  
  try {
    await mongoose.disconnect()
    isConnected = false
    console.log('📦 MongoDB 连接已关闭')
  } catch (error) {
    console.error('关闭数据库连接失败:', error)
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1
}

