// MongoDB 初始化脚本
// 在 mongosh 中运行: load('/path/to/init-db.js')

use assistent;

// 获取日期
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

const formatDate = (d) => d.toISOString().split('T')[0];

// 清空现有数据
db.deadlines.deleteMany({ userId: 'dev_user_mock_openid' });
db.tasks.deleteMany({ userId: 'dev_user_mock_openid' });

// 添加 Deadline 数据
db.deadlines.insertMany([
  {
    userId: 'dev_user_mock_openid',
    title: '完成项目提案',
    description: '需要包含市场分析和技术方案',
    deadlineDate: formatDate(tomorrow),
    strategyType: 'monitor',
    progress: 0,
    status: 'active',
    themeColor: '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '提交季度报告',
    description: '财务数据汇总',
    deadlineDate: formatDate(dayAfterTomorrow),
    strategyType: 'monitor',
    progress: 0,
    status: 'active',
    themeColor: '#f59e0b',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '准备演讲稿',
    description: '为下周的技术分享会准备演讲稿',
    deadlineDate: formatDate(nextWeek),
    strategyType: 'monitor',
    progress: 0,
    status: 'active',
    themeColor: '#8b5cf6',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '代码审查',
    description: '新功能模块审查',
    deadlineDate: formatDate(nextWeek),
    strategyType: 'decompose',
    progress: 50,
    status: 'active',
    themeColor: '#10b981',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ 添加了 4 条 Deadline 数据');

// 添加 Schedule 数据
db.tasks.insertMany([
  {
    userId: 'dev_user_mock_openid',
    title: '晨跑3公里',
    date: formatDate(today),
    startTime: '07:30',
    isAllDay: false,
    status: 'completed',
    goalColor: 'green',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '查看邮件',
    date: formatDate(today),
    startTime: '08:00',
    isAllDay: false,
    status: 'completed',
    goalColor: 'teal',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '撰写项目周报',
    date: formatDate(today),
    startTime: '09:00',
    isAllDay: false,
    status: 'pending',
    goalColor: 'green',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '产品需求评审',
    description: '新功能原型讨论',
    date: formatDate(today),
    startTime: '10:30',
    isAllDay: false,
    status: 'pending',
    goalColor: 'indigo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '回复重要邮件',
    date: formatDate(today),
    startTime: '11:00',
    isAllDay: false,
    status: 'pending',
    goalColor: 'green',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '午餐会议',
    date: formatDate(today),
    startTime: '12:00',
    isAllDay: false,
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '午休',
    date: formatDate(today),
    startTime: '13:30',
    isAllDay: false,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: 'dev_user_mock_openid',
    title: '与客户进行视频会议',
    description: '讨论第三季度合作方案',
    date: formatDate(today),
    startTime: '14:30',
    isAllDay: false,
    status: 'pending',
    goalColor: 'purple',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ 添加了 8 条 Schedule 数据');
print('✨ 数据初始化完成！');

