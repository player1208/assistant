import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_assistant'
const DB_NAME = process.env.DB_NAME || 'personal_assistant'

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    })
    console.log('✅ 数据库连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    process.exit(1)
  }
}

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    console.log('✅ 数据库连接已关闭')
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error)
  }
}

// 数据库连接事件监听
mongoose.connection.on('connected', () => {
  console.log('📊 MongoDB 已连接')
})

mongoose.connection.on('error', (error) => {
  console.error('📊 MongoDB 连接错误:', error)
})

mongoose.connection.on('disconnected', () => {
  console.log('📊 MongoDB 已断开连接')
})

// 优雅关闭
process.on('SIGINT', async () => {
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDatabase()
  process.exit(0)
})
