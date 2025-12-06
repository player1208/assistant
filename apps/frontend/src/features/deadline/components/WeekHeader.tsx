import { useMemo } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Target } from 'lucide-react'

type Props = {
  weekOffset: number
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}

export default function WeekHeader({ weekOffset, onPrevWeek, onNextWeek, onToday }: Props) {
  const weekInfo = useMemo(() => {
    const today = new Date()
    const day = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const formatDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`

    let label = ''
    if (weekOffset === 0) {
      label = '本周'
    } else if (weekOffset === 1) {
      label = '下周'
    } else if (weekOffset === -1) {
      label = '上周'
    } else {
      label = `第${Math.abs(weekOffset)}周${weekOffset > 0 ? '后' : '前'}`
    }

    return {
      label,
      range: `${formatDate(monday)} - ${formatDate(sunday)}`,
      isCurrentWeek: weekOffset === 0,
      year: monday.getFullYear()
    }
  }, [weekOffset])

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-red-50/50 to-white">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-red-500" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{weekInfo.label}</span>
            <span className="text-xs text-gray-400">{weekInfo.year}</span>
          </div>
          <span className="text-xs text-gray-500">{weekInfo.range}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {!weekInfo.isCurrentWeek && (
          <motion.button
            onClick={onToday}
            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            今天
          </motion.button>
        )}
        <motion.button
          onClick={onPrevWeek}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </motion.button>
        <motion.button
          onClick={onNextWeek}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </motion.button>
      </div>
    </div>
  )
}

