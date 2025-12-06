export type DeadlineStatus = 'active' | 'completed' | 'archived'

export type Deadline = {
  id: string
  title: string
  description?: string
  startDate?: string   // YYYY-MM-DD (开始日期，可选)
  deadlineDate: string // YYYY-MM-DD (截止日期)
  status: DeadlineStatus
  themeColor?: string
}

// 按周分组的 Deadline
export type WeekDeadlines = {
  weekStart: string // 周一日期
  weekEnd: string   // 周日日期
  deadlines: Deadline[]
}

// Mock 数据
function getMockDeadlines(): Deadline[] {
  const today = new Date()
  const formatDate = (d: Date) => d.toISOString().split('T')[0]
  
  // 本周的一些日期
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  
  const wednesday = new Date(monday)
  wednesday.setDate(monday.getDate() + 2)
  
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  
  const nextWednesday = new Date(monday)
  nextWednesday.setDate(monday.getDate() + 9)

  return [
    {
      id: 'd1',
      title: '完成项目提案',
      description: '需要包含市场分析和技术方案',
      deadlineDate: formatDate(wednesday),
      status: 'active',
      themeColor: '#3b82f6',
    },
    {
      id: 'd2',
      title: '提交季度报告',
      description: '财务数据汇总',
      deadlineDate: formatDate(friday),
      status: 'active',
      themeColor: '#f59e0b',
    },
    {
      id: 'd3',
      title: '准备演讲稿',
      deadlineDate: formatDate(friday),
      status: 'active',
      themeColor: '#8b5cf6'
    },
    {
      id: 'd4',
      title: '代码审查',
      description: '新功能模块审查',
      deadlineDate: formatDate(nextMonday),
      status: 'active',
      themeColor: '#10b981'
    },
    {
      id: 'd5',
      title: '客户会议准备',
      deadlineDate: formatDate(nextWednesday),
      status: 'active',
      themeColor: '#f59e0b',
    }
  ]
}

export function getDeadlines(): Deadline[] {
  return getMockDeadlines()
}

// 获取日期所在周的周一
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - (day === 0 ? 6 : day - 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// 获取日期所在周的周日
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

// 格式化日期显示
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 ${weekday}`
}

// 计算距离截止日期的天数
export function getDaysRemaining(deadlineDate: string): number {
  const deadline = new Date(deadlineDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)
  const diffTime = deadline.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

