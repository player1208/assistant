/**
 * 清理数据库并重新初始化数据
 * 运行: pnpm exec tsx scripts/clean-and-seed.ts
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:mongo@localhost:27017/assistent?authSource=admin&retryWrites=true&w=majority'
const MOCK_USER_ID = 'dev_user_mock_openid'

async function cleanAndSeed() {
  try {
    console.log('🔍 连接到 MongoDB...')
    console.log('连接字符串:', MONGODB_URI)
    
    await mongoose.connect(MONGODB_URI)
    console.log('✅ 连接成功\n')

    const db = mongoose.connection.db
    if (!db) {
      console.error('❌ 无法获取数据库连接')
      return
    }

    // 清空所有数据
    console.log('🗑️  清空现有数据...')
    await db.collection('tasks').deleteMany({ userId: MOCK_USER_ID })
    await db.collection('deadlines').deleteMany({ userId: MOCK_USER_ID })
    console.log('✅ 数据清空完成\n')

    // 获取日期
    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(today.getDate() + 2)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    // 插入任务数据
    console.log('📝 添加任务数据...')
    const tasks = [
      {
        userId: MOCK_USER_ID,
        title: '晨间站会',
        date: formatDate(today),
        startTime: '07:30',
        isAllDay: false,
        status: 'completed',
        priority: 'normal',
        goalColor: 'green',
      },
      {
        userId: MOCK_USER_ID,
        title: '代码审查',
        date: formatDate(today),
        startTime: '08:00',
        isAllDay: false,
        status: 'completed',
        priority: 'normal',
        goalColor: 'teal',
      },
      {
        userId: MOCK_USER_ID,
        title: '完成功能开发',
        date: formatDate(today),
        startTime: '09:00',
        isAllDay: false,
        status: 'pending',
        priority: 'high',
        goalColor: 'green',
      },
      {
        userId: MOCK_USER_ID,
        title: '与客户进行视频会议',
        description: '讨论新需求和项目进展',
        date: formatDate(today),
        startTime: '10:30',
        isAllDay: false,
        status: 'pending',
        priority: 'urgent',
        goalColor: 'indigo',
      },
      {
        userId: MOCK_USER_ID,
        title: '午餐时间',
        date: formatDate(today),
        startTime: '11:00',
        isAllDay: false,
        status: 'pending',
        priority: 'normal',
        goalColor: 'green',
      },
      {
        userId: MOCK_USER_ID,
        title: '下午会议',
        date: formatDate(today),
        startTime: '12:00',
        isAllDay: false,
        status: 'completed',
        priority: 'normal',
      },
      {
        userId: MOCK_USER_ID,
        title: '健身',
        date: formatDate(today),
        startTime: '13:30',
        isAllDay: false,
        status: 'pending',
        priority: 'normal',
      },
      {
        userId: MOCK_USER_ID,
        title: '完成项目文档',
        description: '编写技术文档和使用说明',
        date: formatDate(tomorrow),
        startTime: '14:30',
        isAllDay: false,
        status: 'pending',
        priority: 'high',
        goalColor: 'purple',
      },
      // 全天任务
      {
        userId: MOCK_USER_ID,
        title: '团队建设活动',
        description: '全天团队活动',
        date: formatDate(today),
        isAllDay: true,
        status: 'pending',
        priority: 'normal',
        goalColor: 'orange',
      },
      {
        userId: MOCK_USER_ID,
        title: '公司年度总结会',
        date: formatDate(tomorrow),
        isAllDay: true,
        status: 'pending',
        priority: 'high',
        goalColor: 'red',
      },
      {
        userId: MOCK_USER_ID,
        title: '项目启动会',
        description: '新项目启动会议',
        date: formatDate(dayAfterTomorrow),
        isAllDay: true,
        status: 'pending',
        priority: 'high',
        goalColor: 'blue',
      },
      {
        userId: MOCK_USER_ID,
        title: '放假',
        date: formatDate(nextWeek),
        isAllDay: true,
        status: 'pending',
        priority: 'normal',
        goalColor: 'pink',
      },
    ]

    const insertedTasks = await db.collection('tasks').insertMany(tasks)
    console.log(`✅ 成功添加 ${insertedTasks.insertedCount} 条任务\n`)

    // 插入 Deadline 数据
    console.log('📝 添加 Deadline 数据...')
    const deadlines = [
      {
        userId: MOCK_USER_ID,
        title: '完成项目提案',
        description: '需要包含市场分析和技术方案',
        deadlineDate: formatDate(tomorrow),
        strategyType: 'monitor',
        progress: 0,
        status: 'active',
        themeColor: '#3b82f6',
      },
      {
        userId: MOCK_USER_ID,
        title: '提交季度报告',
        description: '财务数据汇总',
        deadlineDate: formatDate(dayAfterTomorrow),
        strategyType: 'monitor',
        progress: 0,
        status: 'active',
        themeColor: '#f59e0b',
      },
      {
        userId: MOCK_USER_ID,
        title: '准备演讲稿',
        description: '为下周的技术分享会准备演讲稿',
        deadlineDate: formatDate(nextWeek),
        strategyType: 'monitor',
        progress: 0,
        status: 'active',
        themeColor: '#8b5cf6',
      },
    ]

    const insertedDeadlines = await db.collection('deadlines').insertMany(deadlines)
    console.log(`✅ 成功添加 ${insertedDeadlines.insertedCount} 条 Deadline\n`)

    // 验证数据
    console.log('✅ 数据初始化完成！')
    console.log('📊 数据统计:')
    const taskCount = await db.collection('tasks').countDocuments({ userId: MOCK_USER_ID })
    const deadlineCount = await db.collection('deadlines').countDocuments({ userId: MOCK_USER_ID })
    console.log(`   任务: ${taskCount}`)
    console.log(`   Deadline: ${deadlineCount}`)

  } catch (error) {
    console.error('❌ 错误:', error instanceof Error ? error.message : error)
  } finally {
    await mongoose.disconnect()
  }
}

cleanAndSeed()

