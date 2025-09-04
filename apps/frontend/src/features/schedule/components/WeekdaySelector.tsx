import { useMemo, useState } from 'react'

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function WeekdaySelector() {
  const today = useMemo(() => new Date(), [])
  const [active, setActive] = useState(today.getDay())

  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  return (
    <div className="flex justify-around text-center text-sm">
      {days.map((d, idx) => {
        const isActive = idx === active
        return (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={
              'weekday-item flex flex-col items-center p-2 w-12 cursor-pointer rounded-lg ' +
              (isActive ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-100')
            }
          >
            <span className={isActive ? 'text-xs font-light' : 'text-xs text-gray-500'}>
              {WEEKDAY_LABELS[idx]}
            </span>
            <span className={isActive ? 'font-bold text-lg mt-0.5' : 'font-semibold mt-1'}>
              {d.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}


