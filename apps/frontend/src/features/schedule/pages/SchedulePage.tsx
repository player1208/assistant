import { Plus } from 'lucide-react'
import Header from '../components/Header'
import AllDayTasks from '../components/AllDayTasks'
import TimedTasks from '../components/TimedTasks'

const MOCK_ALL_DAY = [
  { title: '喝三杯水', status: 'pending', goalColor: 'indigo' as const },
  { title: '冥想5分钟', status: 'pending', goalColor: 'purple' as const },
  { title: '阅读', status: 'pending', goalColor: 'teal' as const },
]

const MOCK_TIMED = [
  { time: '上午 07:30', title: '晨跑3公里', status: 'pending', goalColor: 'green' as const },
  { time: '上午 09:00', title: '撰写项目周报', status: 'pending', goalColor: 'green' as const },
  { time: '上午 11:00', title: '回复重要邮件', status: 'pending', goalColor: 'green' as const },
  { time: '中午 12:00', title: '午餐会议', status: 'completed' as const },
  { time: '下午 02:30', title: '与客户进行视频会议', description: '讨论第三季度合作方案。', status: 'pending' as const, goalColor: 'purple' as const, isUrgent: true },
  { time: '下午 04:00', title: '团队下午茶', status: 'pending', goalColor: 'green' as const },
  { time: '下午 05:30', title: '取快递', status: 'completed' as const },
  { time: '晚上 07:00', title: '健身房锻炼 - 胸部', status: 'pending' as const, goalColor: 'purple' as const },
]

export default function SchedulePage() {
  return (
    <div id="page-home" className="h-full overflow-y-auto">
      <div className="bg-white lg:shadow-xl lg:max-w-4xl lg:mx-auto lg:my-8 lg:rounded-lg">
        <Header />
        <AllDayTasks tasks={MOCK_ALL_DAY} />
        <TimedTasks tasks={MOCK_TIMED} />
      </div>
      
      {/* Floating Action Button */}
      <div id="fab-add-task" className="fixed bottom-5 right-5 z-40">
        <button className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
          <Plus className="w-8 h-8" />
        </button>
      </div>
    </div>
  )
}


