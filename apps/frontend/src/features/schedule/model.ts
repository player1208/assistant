export type TaskStatus = 'pending' | 'completed' | 'cancelled'
export type TaskColor = 'indigo' | 'purple' | 'teal' | 'green' | 'blue' | 'orange' | 'red' | 'pink'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TaskConflictStatus = 'none' | 'conflict'

export type Task = {
  id: string
  userId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  isAllDay: boolean
  startTime?: string
  endTime?: string
  date: string           // 开始日期 (YYYY-MM-DD)
  endDate?: string       // 结束日期 (YYYY-MM-DD)，跨天日程使用
  goalColor?: TaskColor
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  conflictStatus?: TaskConflictStatus
  conflictTaskIds?: string[]
}

export type DayTasks = { date: string; allDay: Task[]; timed: Task[] }

function baseTasks(): DayTasks {
  return {
    allDay: [
      { id: 'a1', title: '喝三杯水', status: 'pending', goalColor: 'indigo' },
      { id: 'a2', title: '冥想5分钟', status: 'pending', goalColor: 'purple' },
      { id: 'a3', title: '阅读', status: 'pending', goalColor: 'teal' },
      { id: 'a4', title: '练字30分钟', status: 'pending', goalColor: 'green' },
      { id: 'a5', title: '整理桌面', status: 'completed', goalColor: 'purple' },
    ],
    timed: [
      { id: 't1', time: '上午 07:30', title: '晨跑3公里', status: 'pending', goalColor: 'green' },
      { id: 't9', time: '上午 08:00', title: '查看邮件', status: 'completed', goalColor: 'teal' },
      { id: 't2', time: '上午 09:00', title: '撰写项目周报', status: 'pending', goalColor: 'green' },
      { id: 't10', time: '上午 10:30', title: '产品需求评审', description: '新功能原型讨论', status: 'pending', goalColor: 'indigo' },
      { id: 't3', time: '上午 11:00', title: '回复重要邮件', status: 'pending', goalColor: 'green' },
      { id: 't4', time: '中午 12:00', title: '午餐会议', status: 'completed' },
      { id: 't11', time: '下午 01:30', title: '午休', status: 'pending' },
      { id: 't5', time: '下午 02:30', title: '与客户进行视频会议', description: '讨论第三季度合作方案。', status: 'pending', goalColor: 'purple' },
      { id: 't12', time: '下午 03:00', title: '代码评审', status: 'pending', goalColor: 'green' },
      { id: 't6', time: '下午 04:00', title: '团队下午茶', status: 'pending', goalColor: 'green' },
      { id: 't7', time: '下午 05:30', title: '取快递', status: 'completed' },
      { id: 't13', time: '下午 06:30', title: '买菜', status: 'pending', goalColor: 'teal' },
      { id: 't8', time: '晚上 07:00', title: '健身房锻炼 - 胸部', status: 'pending', goalColor: 'purple' },
      { id: 't14', time: '晚上 08:30', title: '看书', status: 'pending', goalColor: 'purple' },
      { id: 't15', time: '晚上 09:30', title: '整理明日计划', status: 'pending', goalColor: 'indigo' },
      { id: 't16', time: '晚上 10:30', title: '洗漱准备睡觉', status: 'pending' },
    ],
  }
}

export function getMockTasks(_dateKey: string): DayTasks {
  // 暂时对所有日期返回相同数据；后端完成后再替换为真实 API
  return baseTasks()
}

