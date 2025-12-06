/**
 * 数据库初始化脚本 - 添加测试数据
 * 运行: npx tsx scripts/seed-data.ts
 */

import mongoose from 'mongoose'
import { ENV } from '@assistent/shared'

// 导入模型
import { DeadlineModel } from '../services/deadline-service/src/models/Deadline'
import { TaskModel } from '../services/schedule-service/src/models/Task'

const MOCK_USER_ID = 'dev_user_mock_openid'

async function seedData() {
  try {
    // 连接数据库
    console.log('📦 正在连接数据库...')
    await mongoose.connect(ENV.MONGODB_URI)
    console.log('✅ 数据库连接成功')

    // 清空现有数据
    console.log('🗑️  清空现有数据...')
    await DeadlineModel.deleteMany({ userId: MOCK_USER_ID })
    await TaskModel.deleteMany({ userId: MOCK_USER_ID })
    console.log('✅ 数据清空完成')

    // 获取今天和未来的日期
    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(today.getDate() + 2)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    // 添加 Deadline 数据
    console.log('📝 添加 Deadline 数据...')
    const deadlines = await DeadlineModel.insertMany([
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
      {
        userId: MOCK_USER_ID,
        title: '代码审查',
        description: '新功能模块审查',
        deadlineDate: formatDate(nextWeek),
        strategyType: 'decompose',
        progress: 50,
        status: 'active',
        themeColor: '#10b981',
      },
    ])
    console.log(`✅ 添加了 ${deadlines.length} 条 Deadline`)

    // 添加 Schedule 数据
    console.log('📅 添加 Schedule 数据...')
    const tasks = await TaskModel.insertMany([
      {
        userId: MOCK_USER_ID,
        title: '晨跑3公里',
        date: formatDate(today),
        startTime: '07:30',
        isAllDay: false,
        status: 'completed',
        goalColor: 'green',
      },
      {
        userId: MOCK_USER_ID,
        title: '查看邮件',
        date: formatDate(today),
        startTime: '08:00',
        isAllDay: false,
        status: 'completed',
        goalColor: 'teal',
      },
      {
        userId: MOCK_USER_ID,
        title: '撰写项目周报',
        date: formatDate(today),
        startTime: '09:00',
        isAllDay: false,
        status: 'pending',
        goalColor: 'green',
      },
      {
        userId: MOCK_USER_ID,
        title: '产品需求评审',
        description: '新功能原型讨论',
        date: formatDate(today),
        startTime: '10:30',
        isAllDay: false,
        status: 'pending',
        goalColor: 'indigo',
      },
      {
        userId: MOCK_USER_ID,
        title: '回复重要邮件',
        date: formatDate(today),
        startTime: '11:00',
        isAllDay: false,
        status: 'pending',
        goalColor: 'green',
      },
      {
        userId: MOCK_USER_ID,
        title: '午餐会议',
        date: formatDate(today),
        startTime: '12:00',
        isAllDay: false,
        status: 'completed',
      },
      {
        userId: MOCK_USER_ID,
        title: '午休',
        date: formatDate(today),
        startTime: '13:30',
        isAllDay: false,
        status: 'pending',
      },
      {
        userId: MOCK_USER_ID,
        title: '与客户进行视频会议',
        description: '讨论第三季度合作方案',
        date: formatDate(today),
        startTime: '14:30',
        isAllDay: false,
        status: 'pending',
        goalColor: 'purple',
      },
      {
        userId: MOCK_USER_ID,
        title: '明天的计划',
        date: formatDate(tomorrow),
        isAllDay: true,
        status: 'pending',
      },
      {
        userId: MOCK_USER_ID,
        title: '完成代码审查',
        date: formatDate(tomorrow),
        startTime: '10:00',
        isAllDay: false,
        status: 'pending',
        goalColor: 'blue',
      },
    ])
    console.log(`✅ 添加了 ${tasks.length} 条 Schedule`)

    console.log('\n✨ 数据初始化完成！')
    console.log(`📊 总计: ${deadlines.length} 条 Deadline, ${tasks.length} 条 Schedule`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据初始化失败:', error)
    process.exit(1)
  }
}

seedData()

