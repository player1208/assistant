import { useMemo } from 'react'
import { motion } from 'motion/react'


const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 鲜艳配色（与官网 Smooth Tabs 一致的高饱和风格）
const TAB_COLORS = ['#f43f5e', '#2563eb', '#10b981', '#f59e0b', '#7c3aed', '#06b6d4', '#f97316']

export default function WeekdaySelector({ active, onChange }: { active: number; onChange: (idx: number, date: Date) => void }) {
  const today = useMemo(() => new Date(), [])

  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  return (
    <div className="relative flex justify-around text-center text-sm select-none">
      {days.map((d, idx) => {
        const isActive = idx === active
        return (
          <button
            type="button"
            key={idx}
            onClick={() => onChange(idx, d)}
            className="relative weekday-item flex flex-col items-center p-2 w-12 cursor-pointer rounded-lg"
          >
            {isActive && (
              <motion.span
                layoutId="weekday-active-pill"
                className="absolute inset-0 rounded-lg shadow"
                style={{ backgroundColor: TAB_COLORS[idx % TAB_COLORS.length] }}
                transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.6 }}
              />
            )}
            <motion.span
              className="relative z-10 text-xs font-medium"
              animate={{ color: isActive ? '#ffffff' : '#6b7280' }}
              transition={{ duration: 0.2 }}
            >
              {WEEKDAY_LABELS[idx]}
            </motion.span>
            <motion.span
              className="relative z-10 mt-0.5 font-bold text-lg"
              animate={{ color: isActive ? '#ffffff' : '#111827' }}
              transition={{ duration: 0.2 }}
            >
              {d.getDate()}
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}


