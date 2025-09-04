import Header from '../components/Header'
import WeekdaySelector from '../components/WeekdaySelector'
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
    <div className="bg-white lg:shadow-xl lg:max-w-4xl lg:mx-auto lg:my-8 lg:rounded-lg">
      <Header />
      <div className="px-4">
        <WeekdaySelector />
      </div>
      <AllDayTasks tasks={MOCK_ALL_DAY} />
      <TimedTasks tasks={MOCK_TIMED} />
    </div>
  )
}


