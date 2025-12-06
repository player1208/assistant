import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Deadline } from '../model'
import DeadlineItem from './DeadlineItem'

type Props = {
  deadlines: Deadline[]
  weekOffset: number
  onDeadlineClick?: (deadline: Deadline) => void
  onToggleDeadline?: (id: string) => void
}

export default function WeekView({ deadlines, weekOffset, onDeadlineClick, onToggleDeadline }: Props) {
  // 获取本周的7天
  const weekDays = useMemo(() => {
    const today = new Date()
    const day = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7)

    const days: { date: Date; dateStr: string; isToday: boolean; dayName: string }[] = []
    const dayNames = ['一', '二', '三', '四', '五', '六', '日']

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const isToday = dateStr === today.toISOString().split('T')[0]
      days.push({ date: d, dateStr, isToday, dayName: dayNames[i] })
    }

    return days
  }, [weekOffset])

  // 按日期分组 deadlines（支持跨天事件）
  const deadlinesByDay = useMemo(() => {
    const grouped: Record<string, Deadline[]> = {}
    weekDays.forEach(day => {
      grouped[day.dateStr] = []
    })

    deadlines.forEach(deadline => {
      // 获取开始和结束日期
      const startDate = deadline.startDate || deadline.deadlineDate
      const endDate = deadline.deadlineDate

      // 遍历所有在范围内的日期
      weekDays.forEach(day => {
        // 检查当前日期是否在 [startDate, endDate] 范围内
        if (day.dateStr >= startDate && day.dateStr <= endDate) {
          grouped[day.dateStr].push(deadline)
        }
      })
    })

    return grouped
  }, [deadlines, weekDays])

  return (
    <div className="flex-1 flex flex-col">
      {/* 周视图 - 7列布局 */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full grid grid-cols-7 divide-x divide-gray-100">
          {weekDays.map((day, index) => {
            const dayDeadlines = deadlinesByDay[day.dateStr] || []

            return (
              <div
                key={day.dateStr}
                className={`flex flex-col min-w-0 ${day.isToday ? 'bg-red-50/30' : ''}`}
              >
                {/* 日期头部 */}
                <div className={`flex flex-col items-center py-3 border-b ${day.isToday ? 'border-red-100' : 'border-gray-100'}`}>
                  <span className={`text-xs font-medium ${day.isToday ? 'text-red-500' : 'text-gray-400'}`}>
                    {day.dayName}
                  </span>
                  <motion.div
                    className={`w-8 h-8 flex items-center justify-center rounded-full mt-1 ${
                      day.isToday
                        ? 'bg-red-500 text-white'
                        : 'text-gray-900'
                    }`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <span className="text-sm font-bold">{day.date.getDate()}</span>
                  </motion.div>
                </div>

                {/* 该日的 Deadlines */}
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                  <AnimatePresence mode="popLayout">
                    {dayDeadlines.length > 0 ? (
                      dayDeadlines.map((deadline, i) => (
                        <motion.div
                          key={deadline.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <DeadlineItem
                            deadline={deadline}
                            onClick={onDeadlineClick}
                            onToggle={onToggleDeadline}
                            compact
                          />
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        className="h-full flex items-center justify-center"
                      >
                        <span className="text-xs text-gray-300">-</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

